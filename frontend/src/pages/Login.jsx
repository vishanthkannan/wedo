import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackgroundPattern from '../components/BackgroundPattern';
import MidnightSkyBackground from '../components/MidnightSkyBackground';
import UiverseButton from '../components/UiverseButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      alert('Login failed. Please check credentials.');
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
            />
            <label htmlFor="password" className="form__label">Password</label>
          </div>
          
          <UiverseButton isSubmitting={false} text="SIGN IN" />
        </form>
        
        <Link to="/register" className="auth-link">
          Don't have an account? Sign up
        </Link>
      </motion.div>
    </div>
  );
};

export default Login;
