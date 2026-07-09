import os
import cv2
import re
import numpy as np
import pytesseract
from PyPDF2 import PdfReader
from pdf2image import convert_from_path
import tempfile

# Set up Tesseract path for Windows
tesseract_paths = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
]
for path in tesseract_paths:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        break


def deskew_image(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    coords = np.column_stack(np.where(thresh > 0))
    if coords.size == 0:
        return img
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    (h, w) = img.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return rotated


def preprocess_image(image_path):
    """
    Applies image preprocessing to improve OCR accuracy.
    Converts to grayscale, applies thresholding to reduce noise.
    """
    # Read image using OpenCV
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")

    img = deskew_image(img)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    gray = cv2.medianBlur(gray, 3)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

    preprocessed_path = image_path + "_preprocessed.png"
    cv2.imwrite(preprocessed_path, thresh)
    return preprocessed_path

def extract_text_from_pdf(pdf_path):
    """
    Extracts text from a digital PDF using PyPDF2.
    """
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def ocr_pdf_as_images(pdf_path):
    """
    Converts PDF pages to images and performs OCR on each page.
    """
    tmp_dir = tempfile.mkdtemp(prefix="ocr_pdf_")
    text = ""
    pages = convert_from_path(pdf_path, dpi=300, output_folder=tmp_dir, fmt='png')
    for index, page_image in enumerate(pages):
        temp_path = os.path.join(tmp_dir, f"page_{index}.png")
        page_image.save(temp_path, "PNG")
        processed_path = preprocess_image(temp_path)
        text += pytesseract.image_to_string(processed_path) + "\n"
        for cleanup_path in [temp_path, processed_path]:
            if os.path.exists(cleanup_path):
                os.remove(cleanup_path)
    try:
        os.rmdir(tmp_dir)
    except OSError:
        pass
    return text


def parse_certificate_text(text):
    """
    Parses the OCR text to extract name, register_number, university, degree, cgpa, and certificate_id.
    """
    data = {
        "name": None,
        "register_number": None,
        "university": None,
        "degree": None,
        "cgpa": None,
        "certificate_id": None
    }
    
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    full_clean_text = "\n".join(lines)
    
    # 1. Certificate ID Regex
    cert_id_patterns = [
        r"(?:Certificate|Cert)\s*(?:ID|No|Number|Code)[:\s\.-]+([A-Z0-9-]+)",
        r"(?:Certificate\s*ID|Cert\s*ID)[:\s\.-]*([A-Z0-9-]+)",
        r"CERT-\d{4}-\d+",
        r"Certificate\s*Number\s*([A-Z0-9-]+)"
    ]
    for pattern in cert_id_patterns:
        match = re.search(pattern, full_clean_text, re.IGNORECASE)
        if match:
            data["certificate_id"] = match.group(1) if len(match.groups()) > 0 else match.group(0)
            break
            
    # 2. Register Number Regex
    reg_patterns = [
        r"(?:Register|Registration|Reg|Roll)\s*(?:No|Num|Number)[:\s\.-]+([A-Z0-9]+)",
        r"Reg\s*[:\s\.-]*([A-Z0-9]+)"
    ]
    for pattern in reg_patterns:
        match = re.search(pattern, full_clean_text, re.IGNORECASE)
        if match:
            data["register_number"] = match.group(1)
            break
            
    # 3. CGPA Regex
    cgpa_patterns = [
        r"(?:CGPA|GPA|Cumulative\s*Grade\s*Point\s*Average)[:\s\.-]+([0-9]\.[0-9]+)",
        r"([0-9]\.[0-9]+)\s*(?:CGPA|GPA)"
    ]
    for pattern in cgpa_patterns:
        match = re.search(pattern, full_clean_text, re.IGNORECASE)
        if match:
            try:
                data["cgpa"] = float(match.group(1))
            except ValueError:
                pass
            break
            
    # 4. University Regex
    uni_patterns = [
        r"([A-Za-z\s]+University[A-Za-z\s]*)",
        r"([A-Za-z\s]+Institute\s+of\s+[A-Za-z\s]*)",
        r"Anna\s+University",
        r"Visvesvaraya\s+Technological\s+University",
        r"Mumbai\s+University"
    ]
    for pattern in uni_patterns:
        match = re.search(pattern, full_clean_text, re.IGNORECASE)
        if match:
            data["university"] = match.group(1).strip()
            break
            
    # 5. Degree Regex
    degree_patterns = [
        r"(Bachelor\s+of\s+[A-Za-z\s]+(?:Engineering|Technology|Science|Commerce|Arts)?)",
        r"(Master\s+of\s+[A-Za-z\s]+(?:Engineering|Technology|Science|Management)?)",
        r"(B\.E\.?|B\.Tech\.?|M\.Tech\.?|B\.Sc\.?|M\.Sc\.?|M\.B\.A\.?)\s*(?:in\s+([A-Za-z\s]+))?"
    ]
    for pattern in degree_patterns:
        match = re.search(pattern, full_clean_text, re.IGNORECASE)
        if match:
            data["degree"] = match.group(1).strip()
            break

    # 6. Name Regex - "This is to certify that <Name> of..."
    name_patterns = [
        r"certify\s+that\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
        r"conferred\s+on\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
        r"presented\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)"
    ]
    for pattern in name_patterns:
        match = re.search(pattern, full_clean_text, re.IGNORECASE)
        if match:
            data["name"] = match.group(1).strip()
            break
            
    if not data["name"]:
        # Fallback heuristic: find capital-case lines that aren't degree/university/labels
        for line in lines:
            words = line.split()
            if 2 <= len(words) <= 4 and all(w[0].isupper() if w[0].isalpha() else False for w in words):
                lower_line = line.lower()
                if not any(k in lower_line for k in ["university", "institute", "bachelor", "master", "technology", "engineering", "certificate"]):
                    data["name"] = line
                    break

    return data

def process_certificate(file_path):
    """
    Main function to process certificate (PDF, PNG, JPG).
    """
    _, ext = os.path.splitext(file_path.lower())
    
    extracted_text = ""
    if ext == ".pdf":
        # First try direct text extraction
        try:
            extracted_text = extract_text_from_pdf(file_path)
        except Exception as e:
            print(f"Digital PDF extraction failed: {e}")
            extracted_text = ""

        # If no text was extracted, fallback to OCR-based PDF image conversion
        if not extracted_text.strip():
            try:
                extracted_text = ocr_pdf_as_images(file_path)
            except Exception as e:
                raise ValueError(f"Could not OCR scanned PDF: {e}")
    elif ext in [".png", ".jpg", ".jpeg"]:
        try:
            preprocessed_image_path = preprocess_image(file_path)
            extracted_text = pytesseract.image_to_string(preprocessed_image_path)
            # Remove temp preprocessed file
            if os.path.exists(preprocessed_image_path):
                os.remove(preprocessed_image_path)
        except Exception as e:
            # Fallback to raw image OCR if preprocessing fails or OpenCV isn't configured with graphics
            print(f"OpenCV preprocess failed, falling back to direct OCR: {e}")
            extracted_text = pytesseract.image_to_string(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")
        
    if not extracted_text.strip():
        raise ValueError("Could not extract any text from the document.")
        
    parsed_data = parse_certificate_text(extracted_text)
    parsed_data["raw_text"] = extracted_text
    return parsed_data
