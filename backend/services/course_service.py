from fastapi import HTTPException
from typing import List, Dict
import os
from ..services.firebase import storage, db
from ..services.ocr import extract_text_from_image
from ..services.pdf import extract_text_from_pdf
from ..services.deepseek import solve_problem

class CourseService:
    @staticmethod
    async def create_course_folder(user_id: str, course_name: str) -> Dict:
        """Create a new course folder for a user"""
        try:
            # Create folder in Firebase Storage
            folder_path = f"users/{user_id}/courses/{course_name}/"
            storage.bucket().blob(folder_path).upload_from_string('')
            
            # Create folder reference in Firestore
            folder_ref = db.collection('users').document(user_id).collection('courses').document(course_name)
            folder_ref.set({
                'name': course_name,
                'created_at': firestore.SERVER_TIMESTAMP,
                'files': []
            })
            
            return {'status': 'success', 'folder_path': folder_path}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def upload_file(user_id: str, course_name: str, file, filename: str) -> Dict:
        """Upload a file to a course folder"""
        try:
            # Upload file to Firebase Storage
            file_path = f"users/{user_id}/courses/{course_name}/{filename}"
            blob = storage.bucket().blob(file_path)
            blob.upload_from_file(file.file)
            
            # Get file URL
            file_url = blob.public_url
            
            # Extract text based on file type
            text_content = ""
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                text_content = await extract_text_from_image(file_url)
            elif filename.lower().endswith('.pdf'):
                text_content = await extract_text_from_pdf(file_url)
            
            # Update Firestore with file metadata
            file_ref = db.collection('users').document(user_id).collection('courses').document(course_name)
            file_ref.update({
                'files': firestore.ArrayUnion([{
                    'name': filename,
                    'url': file_url,
                    'type': filename.split('.')[-1],
                    'text_content': text_content,
                    'uploaded_at': firestore.SERVER_TIMESTAMP
                }])
            })
            
            return {
                'status': 'success',
                'file_url': file_url,
                'text_content': text_content
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def solve_problem(user_id: str, course_name: str, problem: str) -> Dict:
        """Solve a problem using the course materials"""
        try:
            # Get all files from the course folder
            course_ref = db.collection('users').document(user_id).collection('courses').document(course_name)
            course_data = course_ref.get()
            
            if not course_data.exists:
                raise HTTPException(status_code=404, detail="Course not found")
            
            # Combine all text content from files
            combined_text = ""
            for file in course_data.get('files', []):
                combined_text += file.get('text_content', '') + "\n\n"
            
            # Use DeepSeek to solve the problem
            solution = await solve_problem(problem, combined_text)
            
            return {
                'status': 'success',
                'solution': solution
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def get_course_files(user_id: str, course_name: str) -> List[Dict]:
        """Get all files in a course folder"""
        try:
            course_ref = db.collection('users').document(user_id).collection('courses').document(course_name)
            course_data = course_ref.get()
            
            if not course_data.exists:
                raise HTTPException(status_code=404, detail="Course not found")
            
            return course_data.get('files', [])
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def delete_file(user_id: str, course_name: str, filename: str) -> Dict:
        """Delete a file from a course folder"""
        try:
            # Delete from Firebase Storage
            file_path = f"users/{user_id}/courses/{course_name}/{filename}"
            storage.bucket().blob(file_path).delete()
            
            # Update Firestore
            course_ref = db.collection('users').document(user_id).collection('courses').document(course_name)
            course_ref.update({
                'files': firestore.ArrayRemove([{
                    'name': filename
                }])
            })
            
            return {'status': 'success'}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e)) 