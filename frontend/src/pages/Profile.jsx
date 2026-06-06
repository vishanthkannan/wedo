import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MidnightSkyBackground from '../components/MidnightSkyBackground';
import Footer from '../components/Footer';
import { playSound } from '../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flame, Check, User, Mail, Lock, Save, Key, AlertCircle, Volume2, VolumeX, LogOut, Award, Camera } from 'lucide-react';

const Profile = () => {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Settings State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [currentPassword, setCurrentPassword] = useState('');


  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  // Toggle Edit states
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/tasks/analytics/weekly');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      }
    };
    fetchAnalytics();
  }, []);

  // Update Profile details
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ text: '', type: '' });
    if (!name.trim()) {
      setProfileMessage({ text: 'Name is required.', type: 'error' });
      return;
    }
    setLoadingProfile(true);
    try {
      playSound('click', soundEnabled);
      const res = await api.put('/auth/profile', { name });
      setUser({ ...user, name: res.data.name });
      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => playSound('reward', soundEnabled), 300);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setProfileMessage({ text: msg, type: 'error' });
    } finally {
      setLoadingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ text: 'All password fields are required.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }

    setLoadingPassword(true);
    try {
      playSound('click', soundEnabled);
      await api.put('/auth/password', { currentPassword, newPassword });
      setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => playSound('reward', soundEnabled), 300);
      setShowPasswordEdit(false);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to change password.';
      setPasswordMessage({ text: msg, type: 'error' });
    } finally {
      setLoadingPassword(false);
    }
  };

  const formattedDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <div className="app-container">
      {/* Profile Page Video Background */}
      <div 
        className="profile-video-bg"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          overflow: 'hidden',
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, #0a0a0f 0%, #030305 100%)'
        }}
      >
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.28,
            filter: 'brightness(0.7) contrast(1.1)'
          }}
        >
          <source src="/video/profile.mp4" type="video/mp4" />
        </video>
      </div>

      <header className="app-header">
        <div className="user-info">
          <button 
            className="premium-logout-btn" 
            onClick={() => navigate('/')}
            style={{ marginRight: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          <div className="user-details" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              Profile Settings
            </h3>
          </div>
        </div>
      </header>

      <div className="profile-grid">
        
        {/* Left Column: Profile Card and Streak Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Avatar and Info Card */}
          <div className="premium-card profile-card-transparent" style={{ padding: '32px', textAlign: 'center', position: 'relative' }}>
            <div className="grid-bg" style={{ opacity: 0.1, borderRadius: 'inherit' }}></div>
            
            <div 
              style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'var(--accent-gradient)',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                fontFamily: 'Outfit, sans-serif',
                color: 'white',
                boxShadow: 'var(--shadow-glow)',
                border: '4px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {user?.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>{user?.email}</p>
            
            <div 
              style={{ 
                borderTop: '1px solid var(--border-color)', 
                paddingTop: '16px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Award size={14} style={{ color: 'var(--accent-color)' }} />
              <span>Member since: {formattedDate}</span>
            </div>

            {/* In-Card Quick Controls */}
            <div 
              style={{ 
                borderTop: '1px solid var(--border-color)', 
                marginTop: '16px',
                paddingTop: '16px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2
              }}
            >
              <button 
                className="header-icon-btn"
                onClick={() => setSoundEnabled(!soundEnabled)} 
                title="Toggle Sound"
                style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <button 
                className="premium-logout-btn"
                onClick={logout}
                title="Log Out"
                style={{ margin: 0 }}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Streak Stats Card */}
          <div 
            className="premium-card profile-card-transparent" 
            style={{ 
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={24} style={{ color: '#F97316', filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Streak Status</h3>
              </div>
              <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.2)', color: '#fdba74', fontWeight: '600' }}>Active Tracker</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'center' }}>
              <div style={{ padding: '16px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Current Streak</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#F97316', fontFamily: 'Outfit, sans-serif' }}>
                  {user?.dailyStreak || 0}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>days</p>
              </div>
              <div style={{ padding: '16px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Longest Streak</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-color)', fontFamily: 'Outfit, sans-serif' }}>
                  {user?.longestStreak || 0}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>days</p>
              </div>
            </div>
          </div>

          {/* Productivity Analytics Card */}
          <div className="premium-card profile-card-transparent" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={20} style={{ color: 'var(--accent-color)' }} />
              Habit Progress (Last 30 Days)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Habits Completed</span>
                  <span style={{ fontWeight: '600' }}>{analytics?.totalCompleted || 0}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${Math.min(100, (analytics?.totalCompleted || 0) * 2)}%`, 
                      height: '100%', 
                      background: 'var(--accent-gradient)',
                      borderRadius: '4px',
                      transition: 'width 1s ease-in-out'
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Completion Rate</span>
                  <span style={{ fontWeight: '600' }}>{analytics?.completionPercent || 0}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${analytics?.completionPercent || 0}%`, 
                      height: '100%', 
                      background: 'var(--accent-gradient)',
                      borderRadius: '4px',
                      transition: 'width 1s ease-in-out'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Profile & Settings Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: '1.5' }}>
          
          {/* Update Profile Details Form */}
          <div className="premium-card profile-card-transparent" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <User size={22} style={{ color: 'var(--accent-color)' }} />
                Profile Details
              </h3>
              {!showProfileEdit && (
                <button 
                  onClick={() => setShowProfileEdit(true)} 
                  className="premium-btn" 
                  style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-sm)' }}
                >
                  Edit Details
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {profileMessage.text && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={profileMessage.type === 'error' ? 'error-banner' : 'error-banner success-banner'}
                  style={{ 
                    marginBottom: '20px', 
                    background: profileMessage.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                    borderColor: profileMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'
                  }}
                >
                  <AlertCircle size={16} style={{ color: profileMessage.type === 'error' ? '#ef4444' : '#22c55e' }} />
                  <span style={{ color: profileMessage.type === 'error' ? 'var(--text-primary)' : '#86efac', fontSize: '13px' }}>{profileMessage.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {!showProfileEdit ? (
                <motion.div
                  key="profile-read"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <div style={{ padding: '16px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.02)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Name</p>
                    <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>{user?.name}</p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.02)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Email</p>
                    <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>{user?.email}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.form 
                  key="profile-edit"
                  onSubmit={async (e) => {
                    await handleUpdateProfile(e);
                    setShowProfileEdit(false);
                  }} 
                  className="auth-form" 
                  style={{ gap: '20px' }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="form__group field" style={{ maxWidth: '100%', marginBottom: '12px' }}>
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      className="form__field"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      id="profile-name"
                      disabled={loadingProfile}
                      autoFocus
                    />
                    <label htmlFor="profile-name" className="form__label">Full Name</label>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="submit" 
                      className="premium-btn" 
                      style={{ width: 'fit-content', minWidth: '130px' }}
                      disabled={loadingProfile}
                    >
                      <Save size={16} />
                      <span>{loadingProfile ? 'Saving...' : 'Save Details'}</span>
                    </button>
                    <button 
                      type="button" 
                      className="premium-logout-btn" 
                      style={{ margin: 0, padding: '12px 20px', borderRadius: 'var(--radius-md)' }}
                      onClick={() => setShowProfileEdit(false)}
                      disabled={loadingProfile}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Change Password Form */}
          <div className="premium-card profile-card-transparent" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <Key size={22} style={{ color: 'var(--accent-color)' }} />
                Security Settings
              </h3>
              {!showPasswordEdit && (
                <button 
                  onClick={() => setShowPasswordEdit(true)} 
                  className="premium-btn" 
                  style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-sm)' }}
                >
                  Change Password
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {passwordMessage.text && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={passwordMessage.type === 'error' ? 'error-banner' : 'error-banner success-banner'}
                  style={{ 
                    marginBottom: '20px', 
                    background: passwordMessage.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                    borderColor: passwordMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'
                  }}
                >
                  <AlertCircle size={16} style={{ color: passwordMessage.type === 'error' ? '#ef4444' : '#22c55e' }} />
                  <span style={{ color: passwordMessage.type === 'error' ? 'var(--text-primary)' : '#86efac', fontSize: '13px' }}>{passwordMessage.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {!showPasswordEdit ? (
                <motion.div
                  key="password-read"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                    Keep your account secure by periodically updating your password.
                  </p>
                </motion.div>
              ) : (
                <motion.form 
                  key="password-edit"
                  onSubmit={async (e) => {
                    await handleChangePassword(e);
                  }} 
                  className="auth-form" 
                  style={{ gap: '20px' }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="form__group field" style={{ maxWidth: '100%' }}>
                    <input 
                      type="password" 
                      placeholder="Current Password" 
                      className="form__field"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      id="current-password"
                      disabled={loadingPassword}
                      autoFocus
                    />
                    <label htmlFor="current-password" className="form__label">Current Password</label>
                  </div>

                  <div className="form__group field" style={{ maxWidth: '100%' }}>
                    <input 
                      type="password" 
                      placeholder="New Password" 
                      className="form__field"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      id="new-password"
                      disabled={loadingPassword}
                    />
                    <label htmlFor="new-password" className="form__label">New Password</label>
                  </div>

                  <div className="form__group field" style={{ maxWidth: '100%', marginBottom: '12px' }}>
                    <input 
                      type="password" 
                      placeholder="Confirm New Password" 
                      className="form__field"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      id="confirm-password"
                      disabled={loadingPassword}
                    />
                    <label htmlFor="confirm-password" className="form__label">Confirm New Password</label>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="submit" 
                      className="premium-btn" 
                      style={{ width: 'fit-content', minWidth: '150px' }}
                      disabled={loadingPassword}
                    >
                      <Lock size={16} />
                      <span>{loadingPassword ? 'Updating...' : 'Update Password'}</span>
                    </button>
                    <button 
                      type="button" 
                      className="premium-logout-btn" 
                      style={{ margin: 0, padding: '12px 20px', borderRadius: 'var(--radius-md)' }}
                      onClick={() => setShowPasswordEdit(false)}
                      disabled={loadingPassword}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
      <Footer />
    </div>
  );
};

export default Profile;
