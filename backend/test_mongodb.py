from pymongo import MongoClient
import sys

try:
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    
    # Test the connection
    print("Testing MongoDB connection...")
    print(f"Server info: {client.server_info()}")
    
    # Test database access
    db = client['science_solver']
    print(f"Database 'science_solver' exists: {'science_solver' in client.list_database_names()}")
    
    # Test collection access
    files_collection = db['files']
    print(f"Collection 'files' exists: 'files' in db.list_collection_names()")
    
    # Test a simple insert
    test_doc = {'test': 'connection_test'}
    result = files_collection.insert_one(test_doc)
    print(f"Insert test successful. Document ID: {result.inserted_id}")
    
    # Clean up test document
    files_collection.delete_one({'_id': result.inserted_id})
    print("Test document cleaned up")
    
except Exception as e:
    print(f"Error connecting to MongoDB: {str(e)}", file=sys.stderr)
    import traceback
    print(f"Traceback: {traceback.format_exc()}", file=sys.stderr) 