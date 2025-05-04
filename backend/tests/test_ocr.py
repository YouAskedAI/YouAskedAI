import unittest
import os
from PIL import Image
import pytesseract
from pdf2image import convert_from_path

class TestOCR(unittest.TestCase):
    def setUp(self):
        self.test_image_path = "test_data/test_image.png"
        self.test_pdf_path = "test_data/test_pdf.pdf"
        
        # Create test directory if it doesn't exist
        os.makedirs("test_data", exist_ok=True)
        
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='white')
        img.save(self.test_image_path)
        
        # Create a simple test PDF
        # Note: This is a placeholder - you'll need to add actual PDF creation code
        # or use a sample PDF file for testing
        
    def test_image_ocr(self):
        """Test OCR on an image file"""
        try:
            text = pytesseract.image_to_string(Image.open(self.test_image_path))
            self.assertIsInstance(text, str)
        except Exception as e:
            self.fail(f"Image OCR test failed: {str(e)}")
            
    def test_pdf_ocr(self):
        """Test OCR on a PDF file"""
        try:
            # Convert PDF to images
            images = convert_from_path(self.test_pdf_path)
            text = ""
            for image in images:
                text += pytesseract.image_to_string(image)
            self.assertIsInstance(text, str)
        except Exception as e:
            self.fail(f"PDF OCR test failed: {str(e)}")
            
    def tearDown(self):
        # Clean up test files
        if os.path.exists(self.test_image_path):
            os.remove(self.test_image_path)
        if os.path.exists(self.test_pdf_path):
            os.remove(self.test_pdf_path)
        if os.path.exists("test_data"):
            os.rmdir("test_data")

if __name__ == '__main__':
    unittest.main() 