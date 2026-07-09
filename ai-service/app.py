import os
import tempfile
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from ocr import process_certificate
from recommendation import calculate_recommendations

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB file limit

# Simple CORS support for local dev
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "TrustIntern AI Service"}), 200

@app.route('/api/ocr', methods=['POST'])
def run_ocr():
    """
    Receives a certificate file, performs OCR, and returns the extracted fields.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected for uploading"}), 400
        
    try:
        # Save file to a temporary location
        filename = secure_filename(file.filename)
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        # Process the certificate
        parsed_data = process_certificate(temp_path)
        
        # Remove temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return jsonify(parsed_data), 200
        
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Internal error during OCR processing: {str(e)}"}), 500

@app.route('/api/recommend', methods=['POST'])
def run_recommend():
    """
    Computes match scores and skill gaps.
    Expects JSON:
    {
      "student_profile": { ... },
      "internships": [ ... ]
    }
    """
    data = request.get_json()
    if not data or 'student_profile' not in data or 'internships' not in data:
        return jsonify({"error": "Invalid request payload. Must specify 'student_profile' and 'internships'"}), 400
        
    try:
        student_profile = data['student_profile']
        internships = data['internships']
        
        recommendations = calculate_recommendations(student_profile, internships)
        return jsonify(recommendations), 200
        
    except Exception as e:
        return jsonify({"error": f"Internal error during recommendation: {str(e)}"}), 500

if __name__ == '__main__':
    # Listen on all interfaces on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
