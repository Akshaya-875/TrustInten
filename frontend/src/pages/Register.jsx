import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { ShieldCheck, User, Mail, Lock, Briefcase, Award } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ROLE_STUDENT');
  
  // Role specific fields
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const getErrorMessage = (errorResponse, fallbackMessage) => {
    if (!errorResponse) {
      return fallbackMessage;
    }

    if (typeof errorResponse === 'string') {
      return errorResponse;
    }

    if (typeof errorResponse === 'object') {
      return errorResponse.error || errorResponse.message || fallbackMessage;
    }

    return fallbackMessage;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload = {
      username,
      email,
      password,
      role,
      fullName: role === 'ROLE_STUDENT' ? fullName : null,
      companyName: role === 'ROLE_RECRUITER' ? companyName : null,
    };

    try {
      await authAPI.register(payload);
      setSuccess('Registration successful! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err.response?.data, 'An error occurred during registration. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
      <div className="card glass-card p-4 p-md-5 w-100" style={{ maxWidth: '520px' }}>
        
        {/* Title */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center mb-2" style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: 'rgba(79, 70, 229, 0.15)',
            border: '1px solid rgba(79, 70, 229, 0.3)'
          }}>
            <ShieldCheck size={35} style={{ color: '#6366f1' }} />
          </div>
          <h2 className="mb-1 fw-bold text-gradient">Create Account</h2>
          <p className="text-secondary small">Start your credential-verified career journey</p>
        </div>

        {error && (
          <div className="alert alert-danger border-0 small py-2 px-3 mb-4 rounded-3 text-center" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success border-0 small py-2 px-3 mb-4 rounded-3 text-center" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          
          {/* Role selector buttons */}
          <div className="mb-3">
            <label className="custom-label">I want to register as a:</label>
            <div className="row g-2">
              <div className="col-6">
                <button
                  type="button"
                  onClick={() => setRole('ROLE_STUDENT')}
                  className={`btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 border ${
                    role === 'ROLE_STUDENT'
                      ? 'btn-gradient border-transparent'
                      : 'btn-glass border-secondary'
                  }`}
                  style={{ fontSize: '0.9rem' }}
                >
                  <Award size={16} /> Student
                </button>
              </div>
              <div className="col-6">
                <button
                  type="button"
                  onClick={() => setRole('ROLE_RECRUITER')}
                  className={`btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 border ${
                    role === 'ROLE_RECRUITER'
                      ? 'btn-gradient border-transparent'
                      : 'btn-glass border-secondary'
                  }`}
                  style={{ fontSize: '0.9rem' }}
                >
                  <Briefcase size={16} /> Recruiter
                </button>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="mb-3">
            <label className="custom-label">Username</label>
            <div className="input-group">
              <span className="input-group-text border-end-0 custom-input" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <User size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 custom-input"
                placeholder="Choose username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="custom-label">Email Address</label>
            <div className="input-group">
              <span className="input-group-text border-end-0 custom-input" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Mail size={16} className="text-muted" />
              </span>
              <input
                type="email"
                className="form-control border-start-0 custom-input"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="custom-label">Password</label>
            <div className="input-group">
              <span className="input-group-text border-end-0 custom-input" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Lock size={16} className="text-muted" />
              </span>
              <input
                type="password"
                className="form-control border-start-0 custom-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Conditional Name Inputs based on Role */}
          {role === 'ROLE_STUDENT' ? (
            <div className="mb-4">
              <label className="custom-label">Full Name (Matches Certificate)</label>
              <input
                type="text"
                className="form-control custom-input"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="custom-label">Company Name</label>
              <input
                type="text"
                className="form-control custom-input"
                placeholder="TechCorp Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-gradient w-100 py-2.5 mb-3"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-2 small">
          <span className="text-secondary">Already have an account? </span>
          <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
