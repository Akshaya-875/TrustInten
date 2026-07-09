import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { studentAPI, STATIC_FILE_URL } from '../services/api';
import { 
  Award, FileText, CheckCircle2, AlertTriangle, HelpCircle, 
  MapPin, Building, BookOpen, Layers, UploadCloud, LogOut, Bell
} from 'lucide-react';

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Form edit states
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [prefLoc, setPrefLoc] = useState('');
  const [prefInd, setPrefInd] = useState('');
  const [projects, setProjects] = useState('');
  const [certs, setCerts] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);

  // File states
  const [uploading, setUploading] = useState({ photo: false, resume: false, certificate: false });
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const profRes = await studentAPI.getProfile();
      setProfile(profRes.data);
      
      // Initialize edit fields
      setFullName(profRes.data.fullName || '');
      setCgpa(profRes.data.cgpa || '');
      setPrefLoc(profRes.data.preferredLocation || '');
      setPrefInd(profRes.data.preferredIndustry || '');
      setProjects(profRes.data.projects || '');
      setCerts(profRes.data.certifications || '');
      setSelectedSkills(profRes.data.skills?.map(s => s.id) || []);

      const skillsRes = await studentAPI.getSkills();
      setSkills(skillsRes.data);

      const appsRes = await studentAPI.getApplications();
      setApplications(appsRes.data);

      const notesRes = await studentAPI.getNotifications();
      setNotifications(notesRes.data);

      // Fetch recommendations only if verified
      if (profRes.data.verificationStatus === 'VERIFIED') {
        const recRes = await studentAPI.getRecommendations();
        setRecommendations(recRes.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: '' });
    try {
      const res = await studentAPI.updateProfile({
        fullName,
        cgpa: parseFloat(cgpa) || 0.0,
        preferredLocation: prefLoc,
        preferredIndustry: prefInd,
        projects,
        certifications: certs,
        skillIds: selectedSkills
      });
      setProfile(res.data);
      setEditMode(false);
      setFeedback({ type: 'success', msg: 'Profile updated successfully!' });
      
      // reload details
      loadData();
    } catch (err) {
      setFeedback({ type: 'danger', msg: 'Failed to update profile details' });
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [type]: true }));
    setFeedback({ type: '', msg: '' });
    const formData = new FormData();
    formData.append('file', file);

    try {
      let res;
      if (type === 'photo') {
        res = await studentAPI.uploadPhoto(formData);
        setFeedback({ type: 'success', msg: 'Profile photo uploaded successfully!' });
      } else if (type === 'resume') {
        res = await studentAPI.uploadResume(formData);
        setFeedback({ type: 'success', msg: 'Resume uploaded successfully!' });
      } else if (type === 'certificate') {
        res = await studentAPI.uploadCertificate(formData);
        setFeedback({ type: 'success', msg: 'Certificate uploaded! Verification status is set to PENDING.' });
      }
      loadData();
    } catch (err) {
      setFeedback({ type: 'danger', msg: `Failed to upload ${type}: ${err.response?.data?.error || err.message}` });
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleApply = async (jobId) => {
    try {
      await studentAPI.apply(jobId);
      setFeedback({ type: 'success', msg: 'Applied successfully!' });
      loadData();
    } catch (err) {
      setFeedback({ type: 'danger', msg: err.response?.data || 'Failed to apply' });
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await studentAPI.markNotificationRead(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const calculateCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.fullName) score += 15;
    if (profile.skills && profile.skills.length > 0) score += 15;
    if (profile.projects) score += 15;
    if (profile.certifications) score += 15;
    if (profile.profilePhoto) score += 10;
    if (profile.resumePath) score += 15;
    if (profile.degreeCertificatePath) score += 15;
    return score;
  };

  if (!profile) return <div className="container mt-5 text-center">Loading dashboard...</div>;

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg custom-navbar mb-4 py-3">
        <div className="container">
          <Link className="navbar-brand fw-bold text-gradient d-flex align-items-center gap-2" to="/student/dashboard">
            <Award style={{ color: '#6366f1' }} /> TrustIntern AI
          </Link>
          
          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* Notifications Dropdown */}
            <div className="dropdown">
              <button className="btn btn-glass btn-sm position-relative rounded-circle p-2" type="button" data-bs-toggle="dropdown">
                <Bell size={18} />
                {notifications.filter(n => !n.readStatus).length > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                    {notifications.filter(n => !n.readStatus).length}
                  </span>
                )}
              </button>
              <ul className="dropdown-menu dropdown-menu-end glass-card p-2 border-secondary" style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                <li className="dropdown-header text-white fw-bold">Notifications</li>
                <li><hr className="dropdown-divider bg-secondary" /></li>
                {notifications.length === 0 ? (
                  <li className="dropdown-item text-muted text-center py-3 small">No notifications yet</li>
                ) : (
                  notifications.map(n => (
                    <li key={n.id} className={`p-2 rounded mb-1 small ${n.readStatus ? 'text-secondary' : 'bg-dark text-white fw-semibold'}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <div>{n.message}</div>
                      {!n.readStatus && (
                        <button onClick={() => handleMarkNotificationRead(n.id)} className="btn btn-link p-0 text-decoration-none mt-1" style={{ fontSize: '0.75rem', color: '#818cf8' }}>
                          Mark as read
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container pb-5">
        
        {/* Welcome Block */}
        <div className="row mb-4">
          <div className="col">
            <h2 className="fw-bold">Welcome back, <span className="text-gradient">{profile.fullName}</span></h2>
            <p className="text-secondary">Track certificate validations and apply for internships recommended by our AI matching engine.</p>
          </div>
        </div>

        {/* Global feedbacks */}
        {feedback.msg && (
          <div className={`alert alert-${feedback.type} border-0 small mb-4 rounded-3 text-center`} style={{ background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: feedback.type === 'success' ? '#34d399' : '#f87171' }}>
            {feedback.msg}
          </div>
        )}

        <div className="row g-4">
          
          {/* Left Column - Profile & Details */}
          <div className="col-lg-4">
            <div className="card glass-card p-4 h-100">
              
              {/* Profile Avatar & verification badge */}
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block mb-3">
                  <img 
                    src={profile.profilePhoto ? `${STATIC_FILE_URL}${profile.profilePhoto}` : 'https://api.dicebear.com/7.x/bottts/svg?seed=student'} 
                    alt="Profile" 
                    className="rounded-circle border border-2 border-secondary"
                    style={{ width: '110px', height: '110px', objectFit: 'cover' }}
                  />
                  <div className="mt-3">
                    {profile.verificationStatus === 'VERIFIED' ? (
                      <span className="badge-verified"><CheckCircle2 size={14} /> Verified</span>
                    ) : profile.verificationStatus === 'PENDING' ? (
                      <span className="badge-pending"><HelpCircle size={14} /> Pending</span>
                    ) : (
                      <span className="badge-fake"><AlertTriangle size={14} /> {profile.verificationStatus}</span>
                    )}
                  </div>
                </div>
                
                <h4 className="fw-bold mb-1">{profile.fullName}</h4>
                <p className="text-secondary small">{profile.user?.email}</p>
              </div>

              {/* Profile Completeness */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1 small">
                  <span className="text-secondary">Profile Completion</span>
                  <span className="fw-bold">{calculateCompleteness()}%</span>
                </div>
                <div className="progress bg-dark" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-gradient" 
                    role="progressbar" 
                    style={{ width: `${calculateCompleteness()}%`, background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }}
                  />
                </div>
              </div>

              <hr className="bg-secondary opacity-25" />

              {/* Read Mode details */}
              {!editMode ? (
                <div>
                  <div className="mb-3">
                    <div className="custom-label">CGPA</div>
                    <div className="fw-semibold">{profile.cgpa ? profile.cgpa.toFixed(2) : 'Not specified'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="custom-label"><MapPin size={14} className="me-1" /> Preferred Location</div>
                    <div className="fw-semibold">{profile.preferredLocation || 'Not specified'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="custom-label"><Building size={14} className="me-1" /> Preferred Industry</div>
                    <div className="fw-semibold">{profile.preferredIndustry || 'Not specified'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="custom-label"><BookOpen size={14} className="me-1" /> Skills</div>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {profile.skills?.length === 0 ? (
                        <span className="text-muted small">No skills added</span>
                      ) : (
                        profile.skills?.map(s => (
                          <span key={s.id} className="badge bg-secondary-subtle text-secondary border border-secondary small">{s.name}</span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="custom-label"><Layers size={14} className="me-1" /> Projects</div>
                    <div className="text-secondary small text-truncate-custom">{profile.projects || 'No projects listed'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="custom-label">Certifications</div>
                    <div className="text-secondary small text-truncate-custom">{profile.certifications || 'No certifications listed'}</div>
                  </div>

                  <button onClick={() => setEditMode(true)} className="btn btn-glass w-100 btn-sm mt-3">
                    Edit Profile Details
                  </button>
                </div>
              ) : (
                /* Edit Mode details */
                <form onSubmit={handleSaveProfile}>
                  <div className="mb-2">
                    <label className="custom-label">Full Name</label>
                    <input type="text" className="form-control form-control-sm custom-input" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  </div>
                  <div className="mb-2">
                    <label className="custom-label">CGPA</label>
                    <input type="number" step="0.01" max="10" min="0" className="form-control form-control-sm custom-input" value={cgpa} onChange={e => setCgpa(e.target.value)} required />
                  </div>
                  <div className="mb-2">
                    <label className="custom-label">Preferred Location</label>
                    <input type="text" className="form-control form-control-sm custom-input" value={prefLoc} onChange={e => setPrefLoc(e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <label className="custom-label">Preferred Industry</label>
                    <input type="text" className="form-control form-control-sm custom-input" value={prefInd} onChange={e => setPrefInd(e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <label className="custom-label">Projects</label>
                    <textarea rows="2" className="form-control form-control-sm custom-input" value={projects} onChange={e => setProjects(e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <label className="custom-label">Certifications</label>
                    <textarea rows="2" className="form-control form-control-sm custom-input" value={certs} onChange={e => setCerts(e.target.value)} />
                  </div>
                  
                  {/* Skill selection checklist */}
                  <div className="mb-3">
                    <label className="custom-label">Select Skills</label>
                    <div className="p-2 border border-secondary rounded bg-dark" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                      {skills.map(s => (
                        <div key={s.id} className="form-check small text-secondary">
                          <input 
                            className="form-check-input bg-dark border-secondary" 
                            type="checkbox" 
                            id={`edit-skill-${s.id}`} 
                            checked={selectedSkills.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSkills(prev => [...prev, s.id]);
                              } else {
                                setSelectedSkills(prev => prev.filter(id => id !== s.id));
                              }
                            }}
                          />
                          <label className="form-check-label text-white" htmlFor={`edit-skill-${s.id}`}>{s.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-gradient btn-sm w-50">Save</button>
                    <button type="button" onClick={() => setEditMode(false)} className="btn btn-glass btn-sm w-50">Cancel</button>
                  </div>
                </form>
              )}

            </div>
          </div>

          {/* Right Column - File Uploads & Lists */}
          <div className="col-lg-8">
            <div className="row g-4">
              
              {/* Document Upload Panels */}
              <div className="col-12">
                <div className="card glass-card p-4">
                  <h4 className="fw-bold mb-3">Academic Registry & Documents</h4>
                  
                  <div className="row g-3">
                    {/* Degree Certificate Upload */}
                    <div className="col-md-6">
                      <div className="p-3 rounded bg-dark border border-secondary text-center h-100 d-flex flex-column justify-content-between">
                        <div>
                          <Award className="text-gradient mx-auto mb-2" size={24} style={{ color: '#818cf8' }} />
                          <h6 className="fw-bold mb-1">Degree Certificate</h6>
                          <p className="text-secondary small mb-3">Upload PDF or Image. (Required for AI Recommend Unlock)</p>
                        </div>
                        <div>
                          {profile.degreeCertificatePath ? (
                            <div className="text-success small mb-2 text-truncate px-2">✓ {profile.degreeCertificatePath.split('/').pop()}</div>
                          ) : (
                            <div className="text-muted small mb-2">No file uploaded</div>
                          )}
                          <label className="btn btn-glass btn-sm w-100">
                            {uploading.certificate ? 'Uploading...' : 'Choose File'}
                            <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => handleFileUpload(e, 'certificate')} hidden disabled={uploading.certificate} />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Resume Upload */}
                    <div className="col-md-6">
                      <div className="p-3 rounded bg-dark border border-secondary text-center h-100 d-flex flex-column justify-content-between">
                        <div>
                          <FileText className="text-gradient mx-auto mb-2" size={24} style={{ color: '#06b6d4' }} />
                          <h6 className="fw-bold mb-1">Resume Document</h6>
                          <p className="text-secondary small mb-3">Upload your latest professional CV (PDF/Word format).</p>
                        </div>
                        <div>
                          {profile.resumePath ? (
                            <div className="text-success small mb-2 text-truncate px-2">✓ {profile.resumePath.split('/').pop()}</div>
                          ) : (
                            <div className="text-muted small mb-2">No file uploaded</div>
                          )}
                          <label className="btn btn-glass btn-sm w-100">
                            {uploading.resume ? 'Uploading...' : 'Choose File'}
                            <input type="file" accept=".pdf,.docx,.doc" onChange={e => handleFileUpload(e, 'resume')} hidden disabled={uploading.resume} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Photo upload inline */}
                  <div className="mt-4 p-3 rounded bg-dark-subtle border border-secondary d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                      <h6 className="fw-bold mb-0">Upload Profile Avatar</h6>
                      <span className="text-secondary small">JPEG/PNG format, max size 5MB.</span>
                    </div>
                    <label className="btn btn-glass btn-sm">
                      {uploading.photo ? 'Uploading...' : 'Upload Photo'}
                      <input type="file" accept=".png,.jpg,.jpeg" onChange={e => handleFileUpload(e, 'photo')} hidden disabled={uploading.photo} />
                    </label>
                  </div>

                </div>
              </div>

              {/* AI Recommended Internships */}
              <div className="col-12">
                <div className="card glass-card p-4">
                  <h4 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
                    AI Internship Recommendations
                    {profile.verificationStatus === 'VERIFIED' && (
                      <span className="text-gradient small fw-bold" style={{ fontSize: '0.85rem' }}>Powered by TF-IDF Matching</span>
                    )}
                  </h4>

                  {profile.verificationStatus !== 'VERIFIED' ? (
                    <div className="p-4 rounded text-center" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px dashed rgba(245, 158, 11, 0.2)' }}>
                      <AlertTriangle className="text-warning mx-auto mb-2" size={32} />
                      <h5 className="fw-bold text-warning mb-1">AI Matches Locked</h5>
                      <p className="text-secondary small mb-0" style={{ maxWidth: '480px', margin: '0 auto' }}>
                        To satisfy engineering project privacy rules, our matching engine runs only on verified academic records. Please upload your degree certificate and wait for Admin to sign it into the blockchain ledger.
                      </p>
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div className="text-muted small text-center py-4">No matching open internships found for your profile settings. Try adding more skills.</div>
                  ) : (
                    <div className="row g-3">
                      {recommendations.map(rec => (
                        <div key={rec.id} className="col-md-6">
                          <div className="p-3 rounded bg-dark border border-secondary d-flex flex-column justify-content-between h-100">
                            <div>
                              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                <h6 className="fw-bold text-white mb-0">{rec.internship?.title}</h6>
                                <span className="badge rounded-pill bg-success-subtle text-success border border-success px-2 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
                                  {rec.matchScore}% Match
                                </span>
                              </div>
                              <p className="text-muted small mb-1">{rec.internship?.recruiter?.companyName}</p>
                              <div className="text-secondary small mb-2"><MapPin size={12} /> {rec.internship?.location} | <Building size={12} /> {rec.internship?.industry}</div>
                              <p className="text-secondary small text-truncate-custom mb-3">{rec.internship?.description}</p>
                              
                              {/* Skill gaps */}
                              {rec.skillGap && (
                                <div className="mb-3">
                                  <span className="text-warning small fw-medium" style={{ fontSize: '0.75rem' }}>⚠️ Skill Gaps detected:</span>
                                  <div className="d-flex flex-wrap gap-1 mt-1">
                                    {rec.skillGap.split(',').map((g, idx) => (
                                      <span key={idx} className="badge bg-warning-subtle text-warning border border-warning small" style={{ fontSize: '0.7rem' }}>{g.trim()}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <button 
                              onClick={() => handleApply(rec.internship?.id)} 
                              className="btn btn-gradient btn-sm w-100 mt-2"
                              disabled={applications.some(a => a.internship?.id === rec.internship?.id)}
                            >
                              {applications.some(a => a.internship?.id === rec.internship?.id) ? 'Applied' : 'Apply Now'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>

              {/* Applied Internships list */}
              <div className="col-12">
                <div className="card glass-card p-4">
                  <h4 className="fw-bold mb-3">Applied Internships Tracker</h4>
                  
                  {applications.length === 0 ? (
                    <div className="text-muted small text-center py-4">You haven't applied for any internships yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-dark table-hover align-middle border-secondary text-secondary small">
                        <thead>
                          <tr className="border-secondary text-white">
                            <th>Job Title</th>
                            <th>Company</th>
                            <th>AI Score</th>
                            <th>Applied Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map(app => (
                            <tr key={app.id} className="border-secondary">
                              <td className="text-white fw-medium">{app.internship?.title}</td>
                              <td>{app.internship?.recruiter?.companyName}</td>
                              <td>
                                <span className="badge bg-secondary-subtle text-secondary border border-secondary">{app.matchScore}%</span>
                              </td>
                              <td>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Today'}</td>
                              <td>
                                <span className={`badge ${
                                  app.status === 'SHORTLISTED' || app.status === 'ACCEPTED' ? 'bg-success' : 
                                  app.status === 'REJECTED' ? 'bg-danger' : 'bg-primary'
                                } px-2 py-1`}>
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
