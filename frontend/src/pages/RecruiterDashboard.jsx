import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recruiterAPI, studentAPI } from '../services/api';
import { 
  Building, Briefcase, FileCheck, CheckCircle2, AlertTriangle, 
  MapPin, Globe, PlusCircle, X, ShieldAlert, LogOut
} from 'lucide-react';

const RecruiterDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [skills, setSkills] = useState([]);

  // Filter toggles
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs'); // jobs, applications, candidates

  // Form states
  const [editProfile, setEditProfile] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');
  const [companyWeb, setCompanyWeb] = useState('');

  // Post job states
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobReqs, setJobReqs] = useState('');
  const [jobLoc, setJobLoc] = useState('');
  const [jobInd, setJobInd] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const profRes = await recruiterAPI.getProfile();
      setProfile(profRes.data);
      setCompanyName(profRes.data.companyName || '');
      setCompanyDesc(profRes.data.companyDescription || '');
      setCompanyWeb(profRes.data.companyWebsite || '');

      const jobsRes = await recruiterAPI.getMyInternships();
      setInternships(jobsRes.data);

      const appsRes = await recruiterAPI.getApplicationsReceived();
      setApplications(appsRes.data);

      const candRes = await recruiterAPI.getCandidates(onlyVerified);
      setCandidates(candRes.data);

      const skillsRes = await studentAPI.getSkills();
      setSkills(skillsRes.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [onlyVerified]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await recruiterAPI.updateProfile({
        companyName,
        companyDescription: companyDesc,
        companyWebsite: companyWeb
      });
      setProfile(res.data);
      setEditProfile(false);
      setFeedback({ type: 'success', msg: 'Company profile updated successfully!' });
    } catch (err) {
      setFeedback({ type: 'danger', msg: 'Failed to update company details' });
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      await recruiterAPI.postInternship({
        title: jobTitle,
        description: jobDesc,
        requirements: jobReqs,
        location: jobLoc,
        industry: jobInd,
        salary: parseFloat(jobSalary) || 0.0,
        skillIds: selectedSkills
      });

      setShowJobModal(false);
      setFeedback({ type: 'success', msg: 'Internship posted successfully!' });
      
      // Clear forms
      setJobTitle('');
      setJobDesc('');
      setJobReqs('');
      setJobLoc('');
      setJobInd('');
      setJobSalary('');
      setSelectedSkills([]);

      loadData();
    } catch (err) {
      setFeedback({ type: 'danger', msg: 'Failed to post internship' });
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job listing?")) return;
    try {
      await recruiterAPI.deleteInternship(id);
      setFeedback({ type: 'success', msg: 'Job listing deleted successfully!' });
      loadData();
    } catch (err) {
      setFeedback({ type: 'danger', msg: 'Failed to delete job' });
    }
  };

  const handleUpdateAppStatus = async (appId, status) => {
    try {
      await recruiterAPI.updateApplicationStatus(appId, status);
      setFeedback({ type: 'success', msg: `Application status updated to ${status}!` });
      loadData();
    } catch (err) {
      setFeedback({ type: 'danger', msg: 'Failed to update application status' });
    }
  };

  if (!profile) return <div className="container mt-5 text-center">Loading recruiter dashboard...</div>;

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg custom-navbar mb-4 py-3">
        <div className="container">
          <Link className="navbar-brand fw-bold text-gradient d-flex align-items-center gap-2" to="/recruiter/dashboard">
            <Building style={{ color: '#6366f1' }} /> TrustIntern AI
          </Link>
          
          <button onClick={handleLogout} className="btn btn-outline-danger btn-sm ms-auto d-flex align-items-center gap-1">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container pb-5">
        
        {/* Company Header Card */}
        <div className="row mb-4">
          <div className="col">
            <h2 className="fw-bold">Recruiter Console: <span className="text-gradient">{profile.companyName}</span></h2>
            <p className="text-secondary">Publish internships, review applications, and screen Blockchain-verified credentials.</p>
          </div>
        </div>

        {/* Feedback alerts */}
        {feedback.msg && (
          <div className={`alert alert-${feedback.type} border-0 small mb-4 rounded-3 text-center`} style={{ background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: feedback.type === 'success' ? '#34d399' : '#f87171' }}>
            {feedback.msg}
          </div>
        )}

        <div className="row g-4">
          
          {/* Left Column: Company Profile details */}
          <div className="col-lg-4">
            <div className="card glass-card p-4">
              <h4 className="fw-bold mb-3 d-flex align-items-center gap-1"><Building size={20} className="text-muted" /> Company Profile</h4>
              
              {!editProfile ? (
                <div>
                  <h5 className="text-white fw-semibold mb-1">{profile.companyName}</h5>
                  {profile.companyWebsite && (
                    <a href={profile.companyWebsite} target="_blank" rel="noreferrer" className="text-decoration-none small d-flex align-items-center gap-1 mb-3" style={{ color: '#818cf8' }}>
                      <Globe size={14} /> {profile.companyWebsite}
                    </a>
                  )}
                  <p className="text-secondary small">{profile.companyDescription || 'No company description added yet.'}</p>
                  
                  <button onClick={() => setEditProfile(true)} className="btn btn-glass btn-sm w-100 mt-3">
                    Edit Profile Details
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile}>
                  <div className="mb-2">
                    <label className="custom-label">Company Name</label>
                    <input type="text" className="form-control form-control-sm custom-input" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                  </div>
                  <div className="mb-2">
                    <label className="custom-label">Website URL</label>
                    <input type="url" className="form-control form-control-sm custom-input" value={companyWeb} onChange={e => setCompanyWeb(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label className="custom-label">Description</label>
                    <textarea rows="3" className="form-control form-control-sm custom-input" value={companyDesc} onChange={e => setCompanyDesc(e.target.value)} />
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-gradient btn-sm w-50">Save</button>
                    <button type="button" onClick={() => setEditProfile(false)} className="btn btn-glass btn-sm w-50">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Listings and Application list */}
          <div className="col-lg-8">
            
            {/* Tabs control */}
            <div className="d-flex gap-2 mb-4 bg-dark p-1.5 rounded-3 border border-secondary" style={{ width: 'fit-content' }}>
              <button 
                onClick={() => setActiveTab('jobs')} 
                className={`btn btn-sm px-3 py-1.5 rounded-2 ${activeTab === 'jobs' ? 'btn-gradient border-0' : 'btn-glass text-secondary'}`}
              >
                My Internships ({internships.length})
              </button>
              <button 
                onClick={() => setActiveTab('apps')} 
                className={`btn btn-sm px-3 py-1.5 rounded-2 ${activeTab === 'apps' ? 'btn-gradient border-0' : 'btn-glass text-secondary'}`}
              >
                Applications Received ({applications.length})
              </button>
              <button 
                onClick={() => setActiveTab('candidates')} 
                className={`btn btn-sm px-3 py-1.5 rounded-2 ${activeTab === 'candidates' ? 'btn-gradient border-0' : 'btn-glass text-secondary'}`}
              >
                Search Candidates
              </button>
            </div>

            {/* TAB CONTENT: JOB LISTINGS */}
            {activeTab === 'jobs' && (
              <div className="card glass-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold mb-0">Active Internship Openings</h4>
                  <button onClick={() => setShowJobModal(true)} className="btn btn-gradient btn-sm d-flex align-items-center gap-1">
                    <PlusCircle size={16} /> Post Internship
                  </button>
                </div>

                {internships.length === 0 ? (
                  <div className="text-center py-4 text-muted small">You haven't posted any internships yet. Click the button above to post your first.</div>
                ) : (
                  <div className="row g-3">
                    {internships.map(job => (
                      <div key={job.id} className="col-12">
                        <div className="p-3 rounded bg-dark border border-secondary d-flex justify-content-between align-items-start flex-wrap gap-3">
                          <div>
                            <h6 className="fw-bold text-white mb-1">{job.title}</h6>
                            <div className="text-secondary small mb-2"><MapPin size={12} /> {job.location} | <Building size={12} /> {job.industry} | Stipend: ₹{job.salary}</div>
                            <p className="text-secondary small text-truncate-custom mb-2">{job.description}</p>
                            <div className="d-flex flex-wrap gap-1 mt-1">
                              {job.skills?.map(s => (
                                <span key={s.id} className="badge bg-secondary-subtle text-secondary border border-secondary small">{s.name}</span>
                              ))}
                            </div>
                          </div>

                          <div className="d-flex flex-column gap-2 text-end">
                            <span className={`badge ${job.status === 'OPEN' ? 'bg-success' : 'bg-danger'} ms-auto`}>{job.status}</span>
                            <button onClick={() => handleDeleteJob(job.id)} className="btn btn-outline-danger btn-sm py-0 px-2 mt-2" style={{ fontSize: '0.8rem' }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: APPLICATIONS */}
            {activeTab === 'apps' && (
              <div className="card glass-card p-4">
                <h4 className="fw-bold mb-3">Applicants Portal</h4>

                {applications.length === 0 ? (
                  <div className="text-center py-4 text-muted small">No applications received yet.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle border-secondary text-secondary small">
                      <thead>
                        <tr className="border-secondary text-white">
                          <th>Candidate</th>
                          <th>Credential Status</th>
                          <th>Applied Role</th>
                          <th>Match Score</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map(app => (
                          <tr key={app.id} className="border-secondary">
                            <td>
                              <div className="fw-semibold text-white">{app.student?.fullName}</div>
                              <div className="small text-muted">{app.student?.user?.email}</div>
                            </td>
                            <td>
                              {app.student?.verificationStatus === 'VERIFIED' ? (
                                <span className="badge-verified"><CheckCircle2 size={12} /> Blockchain Verified</span>
                              ) : (
                                <span className="badge bg-secondary-subtle text-secondary border border-secondary text-white-50"><ShieldAlert size={12} /> {app.student?.verificationStatus}</span>
                              )}
                            </td>
                            <td className="text-white">{app.internship?.title}</td>
                            <td>
                              <span className="badge bg-primary-subtle text-primary border border-primary fw-bold" style={{ fontSize: '0.85rem' }}>{app.matchScore}%</span>
                            </td>
                            <td>
                              <span className={`badge ${
                                app.status === 'SHORTLISTED' || app.status === 'ACCEPTED' ? 'bg-success' : 
                                app.status === 'REJECTED' ? 'bg-danger' : 'bg-primary'
                              } px-2 py-1`}>
                                {app.status}
                              </span>
                            </td>
                            <td>
                              {app.status === 'APPLIED' && (
                                <div className="d-flex gap-1">
                                  <button onClick={() => handleUpdateAppStatus(app.id, 'shortlisted')} className="btn btn-success btn-sm py-0.5 px-2" style={{ fontSize: '0.75rem' }}>Shortlist</button>
                                  <button onClick={() => handleUpdateAppStatus(app.id, 'rejected')} className="btn btn-danger btn-sm py-0.5 px-2" style={{ fontSize: '0.75rem' }}>Reject</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: SEARCH CANDIDATES */}
            {activeTab === 'candidates' && (
              <div className="card glass-card p-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <h4 className="fw-bold mb-0">Browse Student Network</h4>
                  
                  {/* Verified Filter checkbox */}
                  <div className="form-check form-switch text-secondary small">
                    <input 
                      className="form-check-input bg-dark border-secondary" 
                      type="checkbox" 
                      id="verifiedFilterCheck" 
                      checked={onlyVerified}
                      onChange={(e) => setOnlyVerified(e.target.checked)}
                    />
                    <label className="form-check-label text-white" htmlFor="verifiedFilterCheck">Show Only Blockchain Verified</label>
                  </div>
                </div>

                <div className="row g-3">
                  {candidates.length === 0 ? (
                    <div className="text-center py-4 text-muted small">No candidates matching filters found.</div>
                  ) : (
                    candidates.map(cand => (
                      <div key={cand.userId} className="col-md-6">
                        <div className="p-3 rounded bg-dark border border-secondary h-100 d-flex flex-column justify-content-between">
                          <div>
                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                              <h6 className="fw-bold text-white mb-0">{cand.fullName}</h6>
                              {cand.verificationStatus === 'VERIFIED' ? (
                                <span className="badge-verified py-0.5 px-2" style={{ fontSize: '0.7rem' }}><CheckCircle2 size={10} /> Verified</span>
                              ) : (
                                <span className="badge bg-secondary-subtle text-secondary border border-secondary py-0.5 px-2" style={{ fontSize: '0.7rem' }}>{cand.verificationStatus}</span>
                              )}
                            </div>
                            
                            <div className="text-secondary small mb-2">GPA: {cand.cgpa ? cand.cgpa.toFixed(2) : 'N/A'} | Prefers: {cand.preferredLocation || 'Anywhere'}</div>
                            <p className="text-secondary small text-truncate-custom mb-3">{cand.resumeText || 'No details provided.'}</p>
                            
                            <div className="d-flex flex-wrap gap-1">
                              {cand.skills?.map(s => (
                                <span key={s.id} className="badge bg-secondary-subtle text-secondary border border-secondary small" style={{ fontSize: '0.7rem' }}>{s.name}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* MODAL: POST INTERNSHIP */}
      {showJobModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-card border-secondary text-white">
              
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">Post New Internship</h5>
                <button onClick={() => setShowJobModal(false)} className="btn btn-link text-white p-0"><X size={20} /></button>
              </div>

              <form onSubmit={handlePostJob}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="custom-label">Job Title</label>
                      <input type="text" className="form-control custom-input" placeholder="e.g. Java Developer Intern" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="custom-label">Stipend (Monthly ₹)</label>
                      <input type="number" className="form-control custom-input" placeholder="e.g. 15000" value={jobSalary} onChange={e => setJobSalary(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="custom-label">Location</label>
                      <input type="text" className="form-control custom-input" placeholder="e.g. Bangalore" value={jobLoc} onChange={e => setJobLoc(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="custom-label">Industry Sector</label>
                      <input type="text" className="form-control custom-input" placeholder="e.g. Software Engineering" value={jobInd} onChange={e => setJobInd(e.target.value)} required />
                    </div>
                    <div className="col-12">
                      <label className="custom-label">Role Description</label>
                      <textarea rows="3" className="form-control custom-input" placeholder="Describe the responsibilities and daily tasks..." value={jobDesc} onChange={e => setJobDesc(e.target.value)} required />
                    </div>
                    <div className="col-12">
                      <label className="custom-label">Requirements</label>
                      <textarea rows="2" className="form-control custom-input" placeholder="Desired qualifications, experience..." value={jobReqs} onChange={e => setJobReqs(e.target.value)} />
                    </div>
                    
                    {/* Skills required */}
                    <div className="col-12">
                      <label className="custom-label">Required Skills</label>
                      <div className="p-3 border border-secondary rounded bg-dark d-flex flex-wrap gap-3">
                        {skills.map(s => (
                          <div key={s.id} className="form-check form-check-inline small text-secondary">
                            <input 
                              className="form-check-input bg-dark border-secondary" 
                              type="checkbox" 
                              id={`modal-skill-${s.id}`} 
                              checked={selectedSkills.includes(s.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSkills(prev => [...prev, s.id]);
                                } else {
                                  setSelectedSkills(prev => prev.filter(id => id !== s.id));
                                }
                              }}
                            />
                            <label className="form-check-label text-white" htmlFor={`modal-skill-${s.id}`}>{s.name}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-secondary">
                  <button type="submit" className="btn btn-gradient">Post Job</button>
                  <button type="button" onClick={() => setShowJobModal(false)} className="btn btn-glass">Close</button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecruiterDashboard;
