import requests
import json
import time

AI_SERVICE_URL = "http://localhost:5000"

def show_health():
    print("\n--- 1. Testing AI Service Health ---")
    try:
        res = requests.get(f"{AI_SERVICE_URL}/health")
        print(f"Status Code: {res.status_code}")
        print(f"Response: {json.dumps(res.json(), indent=2)}")
    except Exception as e:
        print(f"Error connecting to AI Service: {e}")

def show_ocr_demo():
    print("\n--- 2. Testing OCR Extraction (/api/ocr) ---")
    print("Since we don't have an uploaded certificate file handy, we will simulate the OCR endpoint's")
    print("behavior. In the live system, when a file is uploaded, the Flask server reads it via")
    print("OpenCV and PyTesseract to parse out names, register numbers, universities, and GPAs.")
    print("Let's look at the regex extraction patterns loaded in ocr.py:")
    
    sample_text = """
    ANNA UNIVERSITY, CHENNAI
    This is to certify that JOHN DOE
    bearing Registration Number REG101
    has successfully completed the degree of
    Bachelor of Engineering in Computer Science
    with a Cumulative Grade Point Average (CGPA) of 8.50
    Certificate ID: CERT-2026-001
    """
    
    # Import the parser from ocr.py directly to show how it extracts text
    import sys
    sys.path.append("D:/trustintern-ai/ai-service")
    try:
        from ocr import parse_certificate_text
        extracted_data = parse_certificate_text(sample_text)
        print("\nInput Mock Certificate Text:\n" + sample_text.strip())
        print("\nExtracted Metadata Payload:")
        print(json.dumps(extracted_data, indent=2))
    except Exception as e:
        print(f"Error loading parser: {e}")

def show_recommendation_demo():
    print("\n--- 3. Testing AI Recommendation (/api/recommend) ---")
    
    # Student profile
    student_profile = {
        "skills": ["Java", "Spring Boot", "MySQL", "JavaScript"],
        "projects": "Library Management System in Spring Boot",
        "certifications": "Java SE 11 Programmer Certificate",
        "degree": "Bachelor of Engineering in Computer Science",
        "cgpa": 8.50,
        "preferred_location": "Bangalore",
        "preferred_industry": "Software Engineering",
        "resume_text": "Enthusiastic developer with Java and Spring Boot experience. Built scalable REST APIs."
    }

    # Open internships
    internships = [
        {
            "id": 1,
            "title": "Java Developer Intern",
            "description": "Work on building scalable Spring Boot REST APIs and integrating with MySQL databases.",
            "requirements": "Knowledge of Java, Spring Boot, and SQL databases. Basic understanding of RESTful concepts.",
            "location": "Bangalore",
            "industry": "Software Engineering",
            "skills": ["Java", "Spring Boot", "MySQL", "REST APIs"]
        },
        {
            "id": 2,
            "title": "AI / Machine Learning Intern",
            "description": "We are looking for an AI/ML intern to work on data preprocessing, model building, and OpenCV image pipelines.",
            "requirements": "Proficiency in Python. Experience with Pandas, NumPy, Scikit-Learn. Computer vision is a plus.",
            "location": "Mumbai",
            "industry": "Data Science",
            "skills": ["Python", "OpenCV", "Machine Learning", "Data Analysis"]
        }
    ]

    payload = {
        "student_profile": student_profile,
        "internships": internships
    }

    try:
        res = requests.post(f"{AI_SERVICE_URL}/api/recommend", json=payload)
        print(f"Status Code: {res.status_code}")
        print("AI Recommendations Output:")
        print(json.dumps(res.json(), indent=2))
        
        # Display match score and skill gaps
        results = res.json()
        print("\nMatching Summary:")
        for r in results:
            job_id = r["internship_id"]
            job = next(job for job in internships if job["id"] == job_id)
            print(f"- Job: {job['title']} at {job['location']} ({job['industry']})")
            print(f"  Match Score: {r['match_score']}%")
            if r['skill_gap']:
                print(f"  [Skill Gap] (Missing): {', '.join(r['skill_gap'])}")
            else:
                print("  [OK] No skill gaps detected! Perfect fit.")
    except Exception as e:
        print(f"Error calling recommendation API: {e}")

if __name__ == "__main__":
    show_health()
    show_ocr_demo()
    show_recommendation_demo()
