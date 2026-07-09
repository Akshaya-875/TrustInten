import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({ email });
      setMessage(response.data.message || 'Password reset instructions were sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
      <div className="card glass-card p-4 p-md-5 w-100" style={{ maxWidth: '480px' }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-gradient">Forgot Password</h2>
          <p className="text-secondary small">Enter your email to receive password reset instructions.</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="custom-label">Email Address</label>
            <input
              type="email"
              className="form-control custom-input"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-gradient w-100 py-2" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center mt-3 small">
          <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
