import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { FiAlertCircle } from 'react-icons/fi';
import '../styles.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const allowedEmails = [
    'sales@high5clothing.co.uk',
    'developments@high5clothing.co.uk',
    // Add your team's emails
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.toLowerCase();
    if (!allowedEmails.includes(normalizedEmail)) {
      setError('Access denied: Email not authorized');
      console.log('Unauthorized email:', normalizedEmail);
      return;
    }

    try {
      await signInWithEmailAndPassword(getAuth(), email, 'High54ever');
      console.log('Login successful for email:', normalizedEmail);
      navigate('/');
    } catch (err) {
      console.error('Firebase Login Error:', {
        code: err.code,
        message: err.message,
        email: normalizedEmail
      });
      setError(`Login failed: ${err.code} - ${err.message}`);
    }
  };

  return (
    <div className="app-container light" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-container">
        <h2 className="login-title">High5 Dashboard Login</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="login-input"
            />
          </div>
          {error && (
            <div className="error-content">
              <FiAlertCircle size={20} className="error-icon" />
              <p>{error}</p>
            </div>
          )}
          <button type="submit" className="action-button login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;