import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAPI, STATIC_FILE_URL } from '../services/api';
import { 
  ShieldAlert, ShieldCheck, Cpu, Users, Award, BookOpen, 
  HelpCircle, RefreshCw, PlusCircle, CheckCircle, AlertTriangle, LogOut
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [records, setRecords] = useState([]);
  const [universities, setUniversities] = useState([]);

  // Selected student for verification side-by-side check
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [ocrReport, setOcrReport] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Form states for university record upload
  const [certId, setCertId] = useState('');
  const [studName, setStudName] = useState('');
  const [regNum, setRegNum] = useState('');
  const [uniId, setUniId] = useState('');
  const [deg, setDeg] = useState('');
  const [cgpaVal, setCgpaVal] = useState('');
  const [fileHashVal, setFileHashVal] = useState('');
  
  const [auditResult, setAuditResult] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const statsRes = await adminAPI.getStats();
      setStats(statsRes.data);

      const pendRes = await adminAPI.getPendingCertificates();
      setPending(pendRes.data);

      const ledgerRes = await adminAPI.getBlockchainLedger();
      setLedger(ledgerRes.data);

      const recRes = await adminAPI.getCertificateRecords();
      setRecords(recRes.data);

      const uniRes = await adminAPI.getUniversities();
      setUniversities(uniRes.data);
      if (uniRes.data.length > 0) {
        setUniId(uniRes.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
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

  const handleLoadOcr = async (student) => {
    setSelectedStudent(student);
    setOcrLoading(true);
    setOcrReport(null);
    setFeedback({ type: '', msg: '' });
    try {
      const res = await adminAPI.verifyOcr(student.userId);
      setOcrReport(res.data);
    } catch (err) {
      setFeedback({ type: 'danger', msg: 'Failed to run OCR extraction on certificate file.' });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedStudent || !ocrReport) return;
    const cid = ocrReport.ocrCertificateId || ocrReport.registryRecord?.certificateId;
    if (!cid) {
      alert("Cannot approve: Certificate ID could not be identified.");
      return;
    }
    
    setFeedback({ type: '', msg: '' });
    try {
      await adminAPI.approveCertificate(selectedStudent.userId, cid);
      setFeedback({ type: 'success', msg: 'Certificate approved and successfully minted to Blockchain!' });
      setSelectedStudent(null);
      setOcrReport(null);
      loadData();
    } catch (err) {
      setFeedback({ type: 'danger', msg: err.response?.data || 'Failed to verify certificate' });
    }
  };

  const handleReject = async (reason) => {
    if (!selectedStudent) return;
    setFeedback({ type: '', msg: '' });
    try {
      await adminAPI.rejectCertificate(selectedStudent.userId, reason);
      setFeedback({ type: 'success', msg: `Certificate rejected. Marked as ${reason.toUpperCase()}.` });
      setSelectedStudent(null);
      setOcrReport(null);
      loadData();
    } catch (err) {
      setFeedback({ type: 'danger', msg: 'Failed to reject certificate' });
    }
  };

  const handleAuditBlockchain = async () => {
    setAuditResult(null);
    try {
      const res = await adminAPI.validateBlockchain();
      setAuditResult(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRegistryRecord = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: '' });
    try {
      await adminAPI.createCertificateRecord({
        certificateId: certId,
        studentName: studName,
        registerNumber: regNum,
        universityId: parseInt(uniId),
        degree: deg,
        cgpa: parseFloat(cgpaVal),
        certificateHash: fileHashVal
      });

      setFeedback({ type: 'success', msg: 'New Genuine Certificate registry record added!' });
      
      // Reset forms
      setCertId('');
      setStudName('');
      setRegNum('');
      setDeg('');
      setCgpaVal('');
      setFileHashVal('');
      
      loadData();
    } catch (err) {
      setFeedback({ type: 'danger', msg: 'Failed to add registry record' });
    }
  };

  if (!stats) return <div className="container mt-5 text-center">Loading admin console...</div>;

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg custom-navbar mb-4 py-3">
        <div className="container">
          <Link className="navbar-brand fw-bold text-gradient d-flex align-items-center gap-2" to="/admin/dashboard">
            <Cpu style={{ color: '#6366f1' }} /> TrustIntern Admin
          </Link>
          
          <button onClick={handleLogout} className="btn btn-outline-danger btn-sm ms-auto d-flex align-items-center gap-1">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="container pb-5">
        
        {/* Title */}
        <div className="row mb-4">
          <div className="col">
            <h2 className="fw-bold">Platform Administration</h2>
            <p className="text-secondary">Validate uploaded certificates side-by-side with OCR, manage blockchain records, and audit cryptographic integrity.</p>
          </div>
        </div>

        {/* Global Feedback Alert */}
        {feedback.msg && (
          <div className={`alert alert-${feedback.type} border-0 small mb-4 rounded-3 text-center`} style={{ background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: feedback.type === 'success' ? '#34d399' : '#f87171' }}>
            {feedback.msg}
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="card glass-card p-3 text-center">
              <Users className="text-gradient mx-auto mb-1" size={24} style={{ color: '#818cf8' }} />
              <div className="small text-secondary">Total Students</div>
              <h3 className="fw-bold mb-0 mt-1">{stats.totalStudents}</h3>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card glass-card p-3 text-center">
              <Users className="text-gradient mx-auto mb-1" size={24} style={{ color: '#34d399' }} />
              <div className="small text-secondary">Total Recruiters</div>
              <h3 className="fw-bold mb-0 mt-1">{stats.totalRecruiters}</h3>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card glass-card p-3 text-center">
              <Award className="text-gradient mx-auto mb-1" size={24} style={{ color: '#f59e0b' }} />
              <div className="small text-secondary">Pending Validations</div>
              <h3 className="fw-bold mb-0 mt-1">{stats.pendingCertificates}</h3>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card glass-card p-3 text-center" style={{ border: stats.blockchainIntegrity ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)' }}>
              {stats.blockchainIntegrity ? (
                <ShieldCheck className="text-success mx-auto mb-1" size={24} />
              ) : (
                <ShieldAlert className="text-danger mx-auto mb-1 animate-pulse" size={24} />
              )}
              <div className="small text-secondary">Blockchain Integrity</div>
              <h5 className="fw-bold mb-0 mt-1.5" style={{ color: stats.blockchainIntegrity ? '#34d399' : '#f87171' }}>
                {stats.blockchainIntegrity ? 'SECURE' : 'COMPROMISED'}
              </h5>
            </div>
          </div>
        </div>

        {/* Audit & Verification columns */}
        <div className="row g-4 mb-4">
          
          {/* LEFT: PENDING CERTIFICATES LIST */}
          <div className="col-lg-5">
            <div className="card glass-card p-4 h-100">
              <h4 className="fw-bold mb-3 d-flex align-items-center gap-2"><Award size={20} className="text-muted" /> Verification Board</h4>
              <p className="text-secondary small">Click on a pending student to open side-by-side OCR registry check.</p>
              
              {pending.length === 0 ? (
                <div className="text-muted small text-center py-4">No student certificates pending validation.</div>
              ) : (
                <div className="list-group bg-transparent border-0">
                  {pending.map(student => (
                    <button 
                      key={student.userId} 
                      onClick={() => handleLoadOcr(student)} 
                      className={`list-group-item list-group-item-action bg-dark border-secondary text-white rounded mb-2 text-start p-3 ${selectedStudent?.userId === student.userId ? 'border-primary border-2' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold">{student.fullName}</span>
                        <span className="badge bg-warning text-dark px-2 py-0.5" style={{ fontSize: '0.7rem' }}>PENDING</span>
                      </div>
                      <div className="small text-muted mb-2">GPA: {student.cgpa}</div>
                      {student.degreeCertificatePath && (
                        <div className="small text-success text-truncate">📁 {student.degreeCertificatePath.split('/').pop()}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: COMPARISON & ACTION PANEL */}
          <div className="col-lg-7">
            <div className="card glass-card p-4 h-100">
              <h4 className="fw-bold mb-3">Verification Inspector</h4>

              {!selectedStudent ? (
                <div className="text-center py-5 text-muted small">Select a pending student from the verification board to review.</div>
              ) : ocrLoading ? (
                <div className="text-center py-5">
                  <RefreshCw size={30} className="text-primary animate-spin mb-2" />
                  <div className="small text-secondary">Calling Python OCR engine & analyzing registry details...</div>
                </div>
              ) : ocrReport ? (
                <div>
                  
                  {/* Side-by-side details check */}
                  <div className="p-3 rounded bg-dark border border-secondary mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
                      <h6 className="fw-bold text-white mb-0">Registry Analysis Evaluation</h6>
                      {ocrReport.matchStatus === 'VERIFIED' ? (
                        <span className="badge-verified"><CheckCircle size={12} /> {ocrReport.matchStatus} Match</span>
                      ) : ocrReport.matchStatus === 'TAMPERED' ? (
                        <span className="badge-tampered"><ShieldAlert size={12} /> TAMPER WARNING</span>
                      ) : (
                        <span className="badge-fake"><AlertTriangle size={12} /> FAKE SUGGESTED</span>
                      )}
                    </div>

                    <div className="row g-2 small">
                      {/* Name check */}
                      <div className="col-4 text-muted">Student Name:</div>
                      <div className="col-8 text-white">{selectedStudent.fullName}</div>
                      <div className="col-4 text-muted">OCR Name:</div>
                      <div className="col-8 text-white">{ocrReport.ocrName || 'N/A'}</div>
                      <div className="col-4 text-muted">Registry Name:</div>
                      <div className="col-8 text-white" style={{ color: ocrReport.registryRecord ? '#34d399' : '#f87171' }}>
                        {ocrReport.registryRecord ? ocrReport.registryRecord.studentName : 'Not found'}
                      </div>
                      
                      <div className="col-12"><hr className="bg-secondary opacity-25 my-1" /></div>

                      {/* Reg No check */}
                      <div className="col-4 text-muted">OCR Reg No:</div>
                      <div className="col-8 text-white">{ocrReport.ocrRegisterNumber || 'N/A'}</div>
                      <div className="col-4 text-muted">Registry Reg No:</div>
                      <div className="col-8 text-white fw-bold">{ocrReport.registryRecord?.registerNumber || 'N/A'}</div>

                      <div className="col-12"><hr className="bg-secondary opacity-25 my-1" /></div>

                      {/* GPA check */}
                      <div className="col-4 text-muted">OCR CGPA:</div>
                      <div className="col-8 text-white">{ocrReport.ocrCgpa || 'N/A'}</div>
                      <div className="col-4 text-muted">Registry CGPA:</div>
                      <div className="col-8 text-white fw-bold">{ocrReport.registryRecord?.cgpa || 'N/A'}</div>

                      <div className="col-12"><hr className="bg-secondary opacity-25 my-1" /></div>

                      {/* Cert ID check */}
                      <div className="col-4 text-muted">Certificate ID:</div>
                      <div className="col-8 text-white fw-bold">{ocrReport.ocrCertificateId || 'N/A'}</div>

                      <div className="col-12"><hr className="bg-secondary opacity-25 my-1" /></div>

                      {/* File Hash check */}
                      <div className="col-4 text-muted">Cert SHA-256:</div>
                      <div className="col-8 text-white text-truncate font-monospace" style={{ fontSize: '0.75rem' }}>{ocrReport.fileHash}</div>
                    </div>
                  </div>

                  {/* View Uploaded File Link */}
                  <div className="mb-4">
                    <a 
                      href={`${STATIC_FILE_URL}${selectedStudent.degreeCertificatePath}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-glass btn-sm w-100"
                    >
                      Open Uploaded Certificate File
                    </a>
                  </div>

                  {/* Action buttons */}
                  <div className="row g-2">
                    <div className="col-6">
                      <button onClick={handleApprove} className="btn btn-success w-100 py-2.5 small fw-bold">
                        Approve & Mint Block
                      </button>
                    </div>
                    <div className="col-3">
                      <button onClick={() => handleReject('tampered')} className="btn btn-warning w-100 py-2.5 text-dark small fw-bold">
                        Mark Tampered
                      </button>
                    </div>
                    <div className="col-3">
                      <button onClick={() => handleReject('fake')} className="btn btn-danger w-100 py-2.5 small fw-bold">
                        Mark Fake
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-5 text-muted small">No report loaded.</div>
              )}

            </div>
          </div>

        </div>

        {/* BLOCKCHAIN AUDIT BOARD */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="card glass-card p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <h4 className="fw-bold mb-0 d-flex align-items-center gap-2"><Cpu size={20} className="text-muted" /> Blockchain Ledgers Log</h4>
                <button onClick={handleAuditBlockchain} className="btn btn-glass btn-sm d-flex align-items-center gap-1">
                  <RefreshCw size={14} /> Validate Ledger Integrity
                </button>
              </div>

              {auditResult && (
                <div className={`alert alert-${auditResult.valid ? 'success' : 'danger'} border-0 small py-2 px-3 mb-3 rounded-3 text-center`} style={{ background: auditResult.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: auditResult.valid ? '#34d399' : '#f87171' }}>
                  {auditResult.message}
                </div>
              )}

              {ledger.length === 0 ? (
                <div className="text-muted small text-center py-3">No blocks minted on the blockchain yet. Approve student certificates to create blocks.</div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table table-dark table-hover align-middle border-secondary text-secondary small">
                    <thead>
                      <tr className="border-secondary text-white">
                        <th>Block #</th>
                        <th>Cert ID</th>
                        <th>Student ID</th>
                        <th>Timestamp</th>
                        <th>Previous Hash</th>
                        <th>Current Block Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map(block => (
                        <tr key={block.blockNumber} className="border-secondary">
                          <td className="text-white fw-bold">#{block.blockNumber}</td>
                          <td className="text-white">{block.certificateId}</td>
                          <td>Student ID: {block.studentId}</td>
                          <td>{new Date(block.timestamp).toLocaleString()}</td>
                          <td className="text-truncate font-monospace" style={{ maxWidth: '120px', fontSize: '0.75rem' }}>{block.previousHash}</td>
                          <td className="text-truncate font-monospace text-gradient fw-bold" style={{ maxWidth: '140px', fontSize: '0.75rem' }}>{block.currentHash}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* REGISTRY MANAGER */}
        <div className="row g-4">
          <div className="col-12">
            <div className="card glass-card p-4">
              <h4 className="fw-bold mb-3 d-flex align-items-center gap-2"><BookOpen size={20} className="text-muted" /> University Master Certificate Registry</h4>
              
              <div className="row g-4">
                {/* Form to add record */}
                <div className="col-lg-4">
                  <div className="p-3 rounded bg-dark border border-secondary">
                    <h6 className="fw-bold text-white mb-3">Add Registry Template</h6>
                    <form onSubmit={handleAddRegistryRecord}>
                      <div className="mb-2">
                        <label className="custom-label">Certificate ID</label>
                        <input type="text" className="form-control form-control-sm custom-input" placeholder="e.g. CERT-2026-001" value={certId} onChange={e => setCertId(e.target.value)} required />
                      </div>
                      <div className="mb-2">
                        <label className="custom-label">Student Name</label>
                        <input type="text" className="form-control form-control-sm custom-input" placeholder="John Doe" value={studName} onChange={e => setStudName(e.target.value)} required />
                      </div>
                      <div className="mb-2">
                        <label className="custom-label">Register Number</label>
                        <input type="text" className="form-control form-control-sm custom-input" placeholder="REG101" value={regNum} onChange={e => setRegNum(e.target.value)} required />
                      </div>
                      <div className="mb-2">
                        <label className="custom-label">University</label>
                        <select className="form-select form-select-sm custom-input" value={uniId} onChange={e => setUniId(e.target.value)}>
                          {universities.map(u => (
                            <option key={u.id} value={u.id} className="bg-dark text-white">{u.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-2">
                        <label className="custom-label">Degree</label>
                        <input type="text" className="form-control form-control-sm custom-input" placeholder="BE Computer Science" value={deg} onChange={e => setDeg(e.target.value)} required />
                      </div>
                      <div className="mb-2">
                        <label className="custom-label">CGPA</label>
                        <input type="number" step="0.01" max="10" className="form-control form-control-sm custom-input" placeholder="8.50" value={cgpaVal} onChange={e => setCgpaVal(e.target.value)} required />
                      </div>
                      <div className="mb-3">
                        <label className="custom-label">Expected File Hash (SHA-256)</label>
                        <input type="text" className="form-control form-control-sm custom-input" placeholder="64 character hex string" value={fileHashVal} onChange={e => setFileHashVal(e.target.value)} required />
                      </div>

                      <button type="submit" className="btn btn-gradient btn-sm w-100 d-flex align-items-center justify-content-center gap-1">
                        <PlusCircle size={14} /> Add Template
                      </button>
                    </form>
                  </div>
                </div>

                {/* Table display */}
                <div className="col-lg-8">
                  <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="table table-dark table-hover align-middle border-secondary text-secondary small">
                      <thead>
                        <tr className="border-secondary text-white">
                          <th>Cert ID</th>
                          <th>Student Name</th>
                          <th>Register No</th>
                          <th>University</th>
                          <th>Degree</th>
                          <th>CGPA</th>
                          <th>SHA-256 Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map(rec => (
                          <tr key={rec.id} className="border-secondary">
                            <td className="text-white fw-bold">{rec.certificateId}</td>
                            <td className="text-white">{rec.studentName}</td>
                            <td>{rec.registerNumber}</td>
                            <td>{rec.university?.name}</td>
                            <td>{rec.degree}</td>
                            <td>{rec.cgpa?.toFixed(2)}</td>
                            <td className="text-truncate font-monospace" style={{ maxWidth: '120px', fontSize: '0.75rem' }}>{rec.certificateHash}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
