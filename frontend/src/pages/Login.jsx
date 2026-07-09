import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, User, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ username, password });
      const { jwtToken, role, userId, username: resUsername } = response.data;

      // Store auth details
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('username', resUsername);

      // Route to respective dashboards
      if (role === 'ROLE_ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'ROLE_STUDENT') {
        navigate('/student/dashboard');
      } else if (role === 'ROLE_RECRUITER') {
        navigate('/recruiter/dashboard');
      } else {
        setError('Unknown user role. Please contact support.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '85vh' }}>
      <div className="card glass-card p-4 p-md-5 w-100" style={{ maxWidth: '480px' }}>
        
        {/* Title / Logo */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center mb-2" style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: 'rgba(79, 70, 229, 0.15)',
            border: '1px solid rgba(79, 70, 229, 0.3)'
          }}>
            <ShieldCheck size={35} className="text-gradient" style={{ color: '#6366f1' }} />
          </div>
          <h2 className="mb-1 fw-bold text-gradient">TrustIntern AI</h2>
          <p className="text-secondary small">Academic Verification & AI Job Match</p>
        </div>

        {error && (
          <div className="alert alert-danger border-0 small py-2 px-3 mb-4 rounded-3 text-center" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Username Input */}
          <div className="mb-3">
            <label className="custom-label">Username</label>
            <div className="input-group">
              <span className="input-group-text border-end-0 custom-input" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <User size={18} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 custom-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="custom-label">Password</label>
            <div className="input-group">
              <span className="input-group-text border-end-0 custom-input" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Lock size={18} className="text-muted" />
              </span>
              <input
                type="password"
                className="form-control border-start-0 custom-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-gradient w-100 py-2.5 mb-3"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-3 small">
          <span className="text-secondary">Don't have an account? </span>
          <Link to="/register" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
            Sign Up
          </Link>
        </div>
        <div className="text-center mt-2 small">
          <Link to="/forgot-password" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
