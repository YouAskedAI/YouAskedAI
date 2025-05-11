from flask import Flask, render_template, request, jsonify, redirect, url_for
from sympy import symbols, solve, simplify
import numpy as np
import json
from flask_pymongo import PyMongo
import os
from werkzeug.utils import secure_filename
from datetime import datetime
from flask_cors import CORS
import sys
import requests
from PIL import Image
import io
import base64
from PyPDF2 import PdfReader
import openai
from bson.objectid import ObjectId
import pytesseract
import magic
from dotenv import load_dotenv
from flask_jwt_extended import jwt_required, get_jwt_identity
import firebase_admin
from firebase_admin import credentials, auth

# Load environment variables
load_dotenv()

# Initialize Firebase Admin
try:
    # First try to load from environment variable
    firebase_credentials = os.getenv('FIREBASE_CREDENTIALS')
    if firebase_credentials:
        cred_dict = json.loads(firebase_credentials)
        cred = credentials.Certificate(cred_dict)
    else:
        # Then try to load from file
        cred = credentials.Certificate('firebase-credentials.json')
    
    # Initialize Firebase Admin
    firebase_admin.initialize_app(cred)
    print("Firebase Admin initialized successfully")
except FileNotFoundError:
    print("Firebase credentials not found. Running without Firebase authentication.")
    print("Please provide Firebase credentials either through:")
    print("1. FIREBASE_CREDENTIALS environment variable (JSON string)")
    print("2. firebase-credentials.json file in the backend directory")
except json.JSONDecodeError:
    print("Invalid JSON in Firebase credentials. Please check the format.")
except Exception as e:
    print(f"Error initializing Firebase: {e}")

app = Flask(__name__, 
            static_folder='../frontend/static',
            template_folder='../frontend/templates')

# Enable CORS
CORS(app)

# Authentication middleware
def auth_required(f):
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401
        try:
            # Remove 'Bearer ' from the token
            token = auth_header.split(' ')[1]
            # Verify the token
            decoded_token = auth.verify_id_token(token)
            # Add user info to request
            request.user = decoded_token
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 401
    wrapper.__name__ = f.__name__
    return wrapper

# MongoDB configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/youaskedai"
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'csv', 'xlsx'}

# DeepSeek API configuration
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', 'sk-00e8d6a6d92640b49a5d84596101ca6f')
DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

# Initialize MongoDB
try:
    mongo = PyMongo(app)
    print("Successfully connected to MongoDB")
    print("Database and collections are ready")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Helper functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def extract_text_from_pdf(filepath):
    try:
        # Extract text from PDF using PyPDF2
        with open(filepath, 'rb') as file:
            reader = PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

def extract_text_from_image(filepath):
    try:
        # Convert image to text using pytesseract
        image = Image.open(filepath)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from image: {str(e)}")

def solve_with_deepseek(problem, problem_type):
    try:
        # Get API key from environment variable
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            print("Error: DeepSeek API key not found in environment variables", file=sys.stderr)
            raise Exception("DeepSeek API key not found in environment variables")

        print(f"Processing problem: {problem}", file=sys.stderr)
        print(f"Problem type: {problem_type}", file=sys.stderr)

        # Create a structured prompt based on problem type
        system_prompt = f"""You are an expert {problem_type} tutor. Please solve the following problem step by step.
        Format your response EXACTLY as follows (include the section headers exactly as shown):

        Problem Statement:
        [Restate the problem clearly]

        Solution Steps:
        1. [First step with explanation]
        2. [Second step with explanation]
        [Continue with numbered steps as needed]

        Final Answer:
        [Provide the final answer clearly]

        Verification:
        [Explain how to verify the solution]

        Make sure to:
        - Show all calculations and reasoning
        - Explain each step clearly
        - Use appropriate mathematical notation
        - Verify your solution
        """

        # Prepare the API request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": problem}
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }

        print("Sending request to DeepSeek API...", file=sys.stderr)
        print(f"Request data: {json.dumps(data, indent=2)}", file=sys.stderr)
        
        # Make the API request
        response = requests.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30  # Add timeout
        )

        print(f"API Response Status: {response.status_code}", file=sys.stderr)
        print(f"API Response: {response.text}", file=sys.stderr)

        # Check for errors
        if response.status_code != 200:
            error_msg = f"Error calling DeepSeek API: {response.status_code} {response.reason}"
            if response.text:
                error_msg += f" - {response.text}"
            print(f"API Error: {error_msg}", file=sys.stderr)
            raise Exception(error_msg)

        # Extract and return the solution
        result = response.json()
        if 'choices' in result and len(result['choices']) > 0:
            solution = result['choices'][0]['message']['content']
            print(f"Received solution: {solution}", file=sys.stderr)
            
            # Ensure the solution has the required sections
            if not all(section in solution for section in ['Problem Statement:', 'Solution Steps:', 'Final Answer:', 'Verification:']):
                print("Warning: Solution missing required sections, adding template", file=sys.stderr)
                solution = f"""Problem Statement:
{problem}

Solution Steps:
1. Analyzing the problem...
2. Processing the solution...

Final Answer:
[Solution will be displayed here]

Verification:
[Verification steps will be shown here]

{solution}"""
            
            return solution
        else:
            error_msg = "No solution received from DeepSeek API"
            print(f"Error: {error_msg}", file=sys.stderr)
            raise Exception(error_msg)

    except requests.exceptions.Timeout:
        error_msg = "Request to DeepSeek API timed out"
        print(f"Error: {error_msg}", file=sys.stderr)
        raise Exception(error_msg)
    except requests.exceptions.RequestException as e:
        error_msg = f"Error making request to DeepSeek API: {str(e)}"
        print(f"Error: {error_msg}", file=sys.stderr)
        raise Exception(error_msg)
    except Exception as e:
        print(f"Error in solve_with_deepseek: {str(e)}", file=sys.stderr)
        raise

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/tutor')
def tutor():
    return render_template('tutor.html')

@app.route('/teacher')
def teacher():
    return render_template('teacher_dashboard.html')

@app.route('/homework')
def homework():
    return render_template('homework.html')

@app.route('/folder')
def folder():
    folder_id = request.args.get('id')
    if not folder_id:
        # If no folder ID is provided, redirect to My Files folder
        my_files_folder = mongo.db.folders.find_one({'name': 'My Files'})
        if my_files_folder:
            return redirect(url_for('folder', id=str(my_files_folder['_id'])))
        else:
            # Create My Files folder if it doesn't exist
            my_files_folder = {
                'name': 'My Files',
                'description': 'Personal solutions and files',
                'created_at': datetime.utcnow(),
                'files': [],
                'solutions': []
            }
            result = mongo.db.folders.insert_one(my_files_folder)
            return redirect(url_for('folder', id=str(result.inserted_id)))
    return render_template('folder.html')

@app.route('/api/folders', methods=['GET'])
@auth_required
def get_folders():
    folders = list(mongo.db.folders.find({'user_id': request.user['uid']}))
    for folder in folders:
        folder['_id'] = str(folder['_id'])
    return jsonify(folders)

@app.route('/api/folders', methods=['POST'])
@auth_required
def create_folder():
    data = request.json
    folder = {
        'name': data.get('name'),
        'description': data.get('description', ''),
        'created_at': datetime.utcnow(),
        'user_id': request.user['uid'],
        'files': [],
        'homework': [],
        'books': []
    }
    result = mongo.db.folders.insert_one(folder)
    folder['_id'] = str(result.inserted_id)
    return jsonify(folder)

@app.route('/api/folders/<folder_id>', methods=['GET'])
def get_folder(folder_id):
    folder = mongo.db.folders.find_one({'_id': ObjectId(folder_id)})
    if folder:
        folder['_id'] = str(folder['_id'])
        return jsonify(folder)
    return jsonify({'error': 'Folder not found'}), 404

@app.route('/api/folders/<folder_id>', methods=['DELETE'])
def delete_folder(folder_id):
    result = mongo.db.folders.delete_one({'_id': ObjectId(folder_id)})
    if result.deleted_count:
        return jsonify({'message': 'Folder deleted'})
    return jsonify({'error': 'Folder not found'}), 404

@app.route('/api/folders/<folder_id>/files', methods=['GET'])
def get_folder_files(folder_id):
    folder = mongo.db.folders.find_one({'_id': ObjectId(folder_id)})
    if folder:
        return jsonify(folder.get('files', []))
    return jsonify({'error': 'Folder not found'}), 404

@app.route('/api/folders/<folder_id>/files', methods=['POST'])
@auth_required
def upload_file(folder_id):
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Save file to uploads directory
    upload_dir = os.path.join(app.root_path, 'uploads')
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    filename = secure_filename(file.filename)
    file_path = os.path.join(upload_dir, filename)
    file.save(file_path)
    
    # Add file to folder
    file_data = {
        'name': filename,
        'path': file_path,
        'uploaded_at': datetime.utcnow()
    }

    mongo.db.folders.update_one(
        {'_id': ObjectId(folder_id)},
        {'$push': {'files': file_data}}
    )

    return jsonify(file_data)

@app.route('/api/folders/<folder_id>/homework', methods=['GET'])
def get_folder_homework(folder_id):
    folder = mongo.db.folders.find_one({'_id': ObjectId(folder_id)})
    if folder:
        return jsonify(folder.get('homework', []))
    return jsonify({'error': 'Folder not found'}), 404

@app.route('/api/folders/<folder_id>/homework', methods=['POST'])
def add_homework(folder_id):
    data = request.json
    homework = {
        'title': data.get('title'),
        'description': data.get('description', ''),
        'created_at': datetime.utcnow()
    }
    
    mongo.db.folders.update_one(
        {'_id': ObjectId(folder_id)},
        {'$push': {'homework': homework}}
    )
    
    return jsonify(homework)

@app.route('/api/folders/<folder_id>/books', methods=['GET'])
def get_folder_books(folder_id):
    folder = mongo.db.folders.find_one({'_id': ObjectId(folder_id)})
    if folder:
        return jsonify(folder.get('books', []))
    return jsonify({'error': 'Folder not found'}), 404

@app.route('/api/folders/<folder_id>/books', methods=['POST'])
def add_book(folder_id):
    data = request.json
    book = {
        'title': data.get('title'),
        'description': data.get('description', ''),
        'created_at': datetime.utcnow()
    }
    
    mongo.db.folders.update_one(
        {'_id': ObjectId(folder_id)},
        {'$push': {'books': book}}
    )
    
    return jsonify(book)

@app.route('/api/files', methods=['GET'])
def get_files():
    folder_id = request.args.get('folderId', 'root')
    files = list(mongo.db.files.find({'folder_id': folder_id}, {'_id': 1, 'filename': 1, 'type': 1, 'uploadDate': 1}))
    return jsonify(files)

@app.route('/api/solve-from-files', methods=['POST'])
def solve_from_files():
    data = request.get_json()
    file_ids = data.get('fileIds', [])
    problem_type = data.get('problemType', 'math')
    
    # Get file paths from MongoDB
    files = list(mongo.db.files.find({'_id': {'$in': file_ids}}, {'path': 1, 'type': 1}))
    
    # Prepare files for DeepSeek API
    file_contents = []
    for file in files:
        if file['type'] == 'application/pdf':
            # For PDF files, extract text (you'll need to implement PDF text extraction)
            # This is a placeholder - you'll need to implement actual PDF text extraction
            file_contents.append(f"PDF Content from {file['path']}")
        elif file['type'].startswith('image/'):
            # For images, you might want to use OCR to extract text
            # This is a placeholder - you'll need to implement actual OCR
            file_contents.append(f"Image Content from {file['path']}")
    
    # Combine file contents and create a prompt for DeepSeek
    combined_content = "\n\n".join(file_contents)
    prompt = f"""
    Please analyze the following content and solve the {problem_type} problem:
    
    {combined_content}
    
    Provide a step-by-step solution with:
    1. Problem statement
    2. Solution steps
    3. Final answer
    4. Verification
    """
    
    # Call DeepSeek API
    try:
        response = solve_with_deepseek(prompt, problem_type)
        return jsonify({'solution': response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/solve', methods=['POST'])
def solve():
    try:
        print("Received solve request")
        
        # Check if request contains files
        if 'file' in request.files:
            file = request.files['file']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                # Extract text based on file type
                if filename.lower().endswith('.pdf'):
                    problem = extract_text_from_pdf(filepath)
                else:  # Image file
                    problem = extract_text_from_image(filepath)
                
                # Clean up the file
                os.remove(filepath)
            else:
                return jsonify({'error': 'Invalid file type'}), 400
        else:
            # Get problem from form data
            problem = request.form.get('problem')
        
        problem_type = request.form.get('type')
        
        if not problem:
            return jsonify({'error': 'No problem provided'}), 400
        if not problem_type:
            return jsonify({'error': 'No problem type provided'}), 400
            
        print(f"Problem: {problem}")
        print(f"Problem type: {problem_type}")
        
        # Solve the problem using DeepSeek
        solution = solve_with_deepseek(problem, problem_type)
        
        # Save the solution to My Files folder
        try:
            # Get or create My Files folder
            my_files_folder = mongo.db.folders.find_one({'name': 'My Files'})
            if not my_files_folder:
                my_files_folder = {
                    'name': 'My Files',
                    'description': 'Personal solutions and files',
                    'created_at': datetime.utcnow(),
                    'files': [],
                    'solutions': []
                }
                result = mongo.db.folders.insert_one(my_files_folder)
                my_files_folder['_id'] = result.inserted_id
            else:
                my_files_folder['_id'] = str(my_files_folder['_id'])
            
            # Create solution document
            solution_doc = {
                'problem': problem,
                'problem_type': problem_type,
                'solution': solution,
                'created_at': datetime.utcnow()
            }
            
            # Add solution to folder
            mongo.db.folders.update_one(
                {'_id': ObjectId(my_files_folder['_id'])},
                {'$push': {'solutions': solution_doc}}
            )
            
        except Exception as e:
            print(f"Error saving solution: {str(e)}")
            # Continue even if saving fails
        
        return jsonify({'solution': solution})
    
    except Exception as e:
        print(f"Error in solve route: {str(e)}", file=sys.stderr)
        return jsonify({'error': str(e)}), 500

@app.route('/api/folders/my-files/solutions', methods=['GET'])
def get_my_solutions():
    try:
        my_files_folder = mongo.db.folders.find_one({'name': 'My Files'})
        if not my_files_folder:
            return jsonify({'solutions': []})
        
        solutions = my_files_folder.get('solutions', [])
        return jsonify({'solutions': solutions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Remove all courses-related routes
@app.route('/api/teacher/courses/count')
def get_active_courses_count():
    return jsonify({"count": 0})

@app.route('/api/teacher/students/count')
def get_total_students_count():
    return jsonify({"count": 0})

@app.route('/api/teacher/grading/count')
def get_pending_grading_count():
    return jsonify({"count": 0})

@app.route('/api/teacher/courses', methods=['GET'])
def get_courses():
    return jsonify([])

@app.route('/api/teacher/courses', methods=['POST'])
def create_course():
    return jsonify({"status": "error", "message": "Courses feature is not available"}), 403

@app.route('/api/teacher/materials', methods=['POST'])
def upload_material():
    return jsonify({"status": "error", "message": "Courses feature is not available"}), 403

@app.route('/api/teacher/quizzes', methods=['POST'])
def create_quiz():
    return jsonify({"status": "error", "message": "Courses feature is not available"}), 403

@app.route('/api/teacher/exams', methods=['POST'])
def create_exam():
    return jsonify({"status": "error", "message": "Courses feature is not available"}), 403

@app.route('/api/folders/<folder_id>/files/<filename>', methods=['DELETE'])
def delete_file(folder_id, filename):
    # Remove file from folder's file list in MongoDB
    mongo.db.folders.update_one(
        {'_id': ObjectId(folder_id)},
        {'$pull': {'files': {'name': filename}}}
    )
    # Remove file from disk
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    return jsonify({'message': 'File deleted'})

@app.route('/api/folders/my-files/files', methods=['POST'])
def upload_file_to_my_files():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    upload_dir = os.path.join(app.root_path, 'uploads')
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    filename = secure_filename(file.filename)
    file_path = os.path.join(upload_dir, filename)
    file.save(file_path)

    file_data = {
        'name': filename,
        'path': file_path,
        'uploaded_at': datetime.utcnow()
    }

    # Save to My Files folder in MongoDB
    my_files_folder = mongo.db.folders.find_one({'name': 'My Files'})
    if not my_files_folder:
        my_files_folder = {
            'name': 'My Files',
            'description': 'Personal solutions and files',
            'created_at': datetime.utcnow(),
            'files': [],
            'solutions': []
        }
        result = mongo.db.folders.insert_one(my_files_folder)
        my_files_folder['_id'] = result.inserted_id
    else:
        my_files_folder['_id'] = str(my_files_folder['_id'])

    mongo.db.folders.update_one(
        {'_id': ObjectId(my_files_folder['_id'])},
        {'$push': {'files': file_data}}
    )

    return jsonify(file_data)

@app.route('/signup')
def signup():
    return render_template('signup.html')

@app.route('/api/auth/verify', methods=['POST'])
def verify_token():
    try:
        # Check if Firebase is initialized
        if not firebase_admin._apps:
            print("Firebase Admin SDK not initialized")
            return jsonify({'error': 'Firebase Admin SDK not initialized. Please check server logs.'}), 500

        # Get the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            print("No Authorization header provided")
            return jsonify({'error': 'No Authorization header provided'}), 401
        
        if not auth_header.startswith('Bearer '):
            print("Invalid Authorization header format")
            return jsonify({'error': 'Invalid Authorization header format'}), 401

        # Extract the token
        token = auth_header.split('Bearer ')[1]
        print(f"Received token: {token[:20]}...")  # Log first 20 chars of token

        try:
            # Verify the token with Firebase Admin
            decoded_token = auth.verify_id_token(token)
            print(f"Token verified successfully for user: {decoded_token.get('uid')}")
            
            # Get user data from the token
            user_data = {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'displayName': decoded_token.get('name'),
                'photoURL': decoded_token.get('picture')
            }
            print(f"User data extracted: {user_data}")

            try:
                # Store user in MongoDB if not exists
                user_collection = mongo.db.users
                existing_user = user_collection.find_one({'uid': user_data['uid']})
                
                if not existing_user:
                    print(f"Creating new user in MongoDB: {user_data['uid']}")
                    user_collection.insert_one({
                        'uid': user_data['uid'],
                        'email': user_data['email'],
                        'displayName': user_data['displayName'],
                        'photoURL': user_data['photoURL'],
                        'createdAt': datetime.utcnow()
                    })
                else:
                    print(f"Updating existing user in MongoDB: {user_data['uid']}")
                    # Update user data if it has changed
                    user_collection.update_one(
                        {'uid': user_data['uid']},
                        {'$set': {
                            'email': user_data['email'],
                            'displayName': user_data['displayName'],
                            'photoURL': user_data['photoURL'],
                            'updatedAt': datetime.utcnow()
                        }}
                    )

                return jsonify(user_data), 200

            except Exception as mongo_error:
                print(f"MongoDB error: {str(mongo_error)}")
                # Still return user data even if MongoDB operation fails
                return jsonify(user_data), 200

        except Exception as e:
            print(f"Error verifying token: {str(e)}")
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401

    except Exception as e:
        print(f"Error in verify_token: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000, debug=True) 