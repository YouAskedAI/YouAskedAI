import unittest
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime

class TestMongoDB(unittest.TestCase):
    def setUp(self):
        # Load environment variables
        load_dotenv()
        self.mongo_uri = os.getenv('MONGODB_URI')
        
        if not self.mongo_uri:
            self.skipTest("MONGODB_URI not found in environment variables")
            
        # Connect to MongoDB
        self.client = MongoClient(self.mongo_uri)
        self.db = self.client['test_db']
        self.folders = self.db['folders']
        self.files = self.db['files']
        
    def test_connection(self):
        """Test MongoDB connection"""
        try:
            # Test connection by getting server info
            server_info = self.client.server_info()
            self.assertIsNotNone(server_info)
        except Exception as e:
            self.fail(f"MongoDB connection test failed: {str(e)}")
            
    def test_folder_operations(self):
        """Test folder CRUD operations"""
        # Create a test folder
        folder_data = {
            "name": "Test Folder",
            "created_at": datetime.utcnow(),
            "files": []
        }
        
        # Insert folder
        folder_id = self.folders.insert_one(folder_data).inserted_id
        self.assertIsNotNone(folder_id)
        
        # Read folder
        folder = self.folders.find_one({"_id": folder_id})
        self.assertIsNotNone(folder)
        self.assertEqual(folder["name"], "Test Folder")
        
        # Update folder
        self.folders.update_one(
            {"_id": folder_id},
            {"$set": {"name": "Updated Test Folder"}}
        )
        updated_folder = self.folders.find_one({"_id": folder_id})
        self.assertEqual(updated_folder["name"], "Updated Test Folder")
        
        # Delete folder
        self.folders.delete_one({"_id": folder_id})
        deleted_folder = self.folders.find_one({"_id": folder_id})
        self.assertIsNone(deleted_folder)
        
    def test_file_operations(self):
        """Test file CRUD operations"""
        # Create a test file
        file_data = {
            "name": "test.txt",
            "folder_id": "test_folder_id",
            "content": "This is a test file",
            "created_at": datetime.utcnow()
        }
        
        # Insert file
        file_id = self.files.insert_one(file_data).inserted_id
        self.assertIsNotNone(file_id)
        
        # Read file
        file = self.files.find_one({"_id": file_id})
        self.assertIsNotNone(file)
        self.assertEqual(file["name"], "test.txt")
        
        # Update file
        self.files.update_one(
            {"_id": file_id},
            {"$set": {"name": "updated_test.txt"}}
        )
        updated_file = self.files.find_one({"_id": file_id})
        self.assertEqual(updated_file["name"], "updated_test.txt")
        
        # Delete file
        self.files.delete_one({"_id": file_id})
        deleted_file = self.files.find_one({"_id": file_id})
        self.assertIsNone(deleted_file)
        
    def tearDown(self):
        # Clean up test database
        self.client.drop_database('test_db')
        self.client.close()

if __name__ == '__main__':
    unittest.main() 