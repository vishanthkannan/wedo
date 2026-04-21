import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackgroundPattern from '../components/BackgroundPattern';
import JpMatrixBackground from '../components/JpMatrixBackground';
import UiverseButton from '../components/UiverseButton';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      alert('Registration failed.');
    }
  };

  return (
    <div className="auth-container">
      <JpMatrixBackground />
      <motion.div 
        className="premium-card auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join us and start tracking your routines.</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form__group field" style={{ maxWidth: '100%' }}>
            <input 
              type="text" 
              placeholder="Full Name" 
              className="form__field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              id="name"
            />
            <label htmlFor="name" className="form__label">Full Name</label>
          </div>
          
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
          
          <UiverseButton isSubmitting={false} text="SIGN UP" />
        </form>
        
        <Link to="/login" className="auth-link">
          Already have an account? Sign in
        </Link>
      </motion.div>
    </div>
  );
};

export default Register;
