import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundPattern from '../components/BackgroundPattern';
import MidnightSkyBackground from '../components/MidnightSkyBackground';
import UiverseButton from '../components/UiverseButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <MidnightSkyBackground />
      <motion.div 
        className="premium-card auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue your wedo.</p>

        <AnimatePresence>
          {error && (
            <motion.div 
              className="error-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form__group field" style={{ maxWidth: '100%' }}>
            <input 
              type="email" 
              placeholder="Email address" 
              className="form__field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="email"
              disabled={loading}
            />
            <label htmlFor="email" className="form__label">Email address</label>
          </div>
          <div className="form__group field" style={{ maxWidth: '100%', marginBottom: '20px' }}>
            <input 
              type="password" 
              placeholder="Password" 
              className="form__field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="password"
              disabled={loading}
            />
            <label htmlFor="password" className="form__label">Password</label>
          </div>
          
          <UiverseButton disabled={loading} text="SIGN IN" />
        </form>
        
        <Link to="/register" className="auth-link">
          Don't have an account? Sign up
        </Link>
      </motion.div>
    </div>
  );
};

export default Login;
