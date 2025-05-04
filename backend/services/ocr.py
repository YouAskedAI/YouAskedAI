import pytesseract
from PIL import Image
import PyPDF2
import io
from typing import Union

async def extract_text_from_file(file: Union[bytes, str]) -> str:
    """
    Extract text from an image or PDF file.
    Supports: PNG, JPG, JPEG, PDF
    """
    try:
        # Handle PDF files
        if file.filename.lower().endswith('.pdf'):
            return await extract_text_from_pdf(file)
        
        # Handle image files
        elif file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            return await extract_text_from_image(file)
        
        else:
            raise ValueError("Unsupported file format")
            
    except Exception as e:
        raise Exception(f"Error extracting text from file: {str(e)}")

async def extract_text_from_pdf(file) -> str:
    """Extract text from a PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(await file.read()))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

async def extract_text_from_image(file) -> str:
    """Extract text from an image file using OCR"""
    try:
        image = Image.open(io.BytesIO(await file.read()))
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from image: {str(e)}") 