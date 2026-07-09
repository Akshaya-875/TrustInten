from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def calculate_recommendations(student_profile, internships):
    """
    Calculates the matching scores and skill gaps for a list of internships.
    
    student_profile format:
    {
        "skills": ["Java", "SQL"],
        "projects": "Library app in Java",
        "certifications": "Java Certified",
        "degree": "BE Computer Science",
        "cgpa": 8.5,
        "preferred_location": "Bangalore",
        "preferred_industry": "Software Engineering",
        "resume_text": "Experienced in java and sql development"
    }
    
    internships format:
    [
        {
            "id": 1,
            "title": "Java Intern",
            "description": "Develop Spring REST APIs",
            "requirements": "Java, SQL, REST",
            "location": "Bangalore",
            "industry": "Software Engineering",
            "skills": ["Java", "SQL", "Spring Boot"]
        },
        ...
    ]
    """
    # 1. Build text representation for Student
    student_skills_str = ", ".join(student_profile.get("skills", []))
    student_text = f"{student_skills_str} {student_profile.get('projects', '')} {student_profile.get('certifications', '')} {student_profile.get('degree', '')} {student_profile.get('preferred_industry', '')} {student_profile.get('resume_text', '')}"
    
    results = []
    
    for internship in internships:
        # Build text representation for Internship
        job_skills_str = ", ".join(internship.get("skills", []))
        job_text = f"{internship.get('title', '')} {internship.get('description', '')} {internship.get('requirements', '')} {internship.get('industry', '')} {job_skills_str}"
        
        # Calculate TF-IDF Cosine Similarity
        vectorizer = TfidfVectorizer(stop_words='english')
        try:
            tfidf_matrix = vectorizer.fit_transform([student_text, job_text])
            semantic_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        except Exception:
            semantic_score = 0.0
            
        # Calculate Skill Match
        student_skills_set = set(s.lower().strip() for s in student_profile.get("skills", []))
        job_skills_set = set(s.lower().strip() for s in internship.get("skills", []))
        
        skills_matched = student_skills_set.intersection(job_skills_set)
        skills_gap = job_skills_set - student_skills_set
        
        skill_score = 0.0
        if job_skills_set:
            skill_score = len(skills_matched) / len(job_skills_set)
            
        # Calculate Location Match
        student_loc = student_profile.get("preferred_location", "").lower().strip()
        job_loc = internship.get("location", "").lower().strip()
        loc_score = 1.0 if student_loc == job_loc else 0.0
        
        # Calculate Industry Match
        student_ind = student_profile.get("preferred_industry", "").lower().strip()
        job_ind = internship.get("industry", "").lower().strip()
        ind_score = 1.0 if student_ind == job_ind else 0.0
        
        # Weighted aggregate score: 40% Skills, 40% Semantic TF-IDF, 10% Location, 10% Industry
        final_score = int((skill_score * 40) + (semantic_score * 40) + (loc_score * 10) + (ind_score * 10))
        final_score = max(0, min(100, final_score))
        
        # Capitalize skill gaps nicely
        gap_suggestions = [s.title() for s in skills_gap]
        
        results.append({
            "internship_id": internship.get("id"),
            "match_score": final_score,
            "skill_gap": gap_suggestions
        })
        
    # Sort by match score descending
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results
