import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import IntroScreen from './components/IntroScreen';
import BackgroundPattern from './components/BackgroundPattern';
import MidnightSkyBackground from './components/MidnightSkyBackground';
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppContent = () => {
  const { user, loading, profileBgVideo } = useContext(AuthContext);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Show intro if auth is still loading OR if the minimum 2.5s animation time hasn't finished
  const showIntro = loading || !minTimePassed;
  const isProfilePage = location.pathname === '/profile';
  const isLoginPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      {/* Conditionally render dashboard and login backgrounds */}
      {!isProfilePage && <BackgroundPattern />}
      {!isProfilePage && <MidnightSkyBackground />}

      {/* Conditionally render profile background at root level (truly static/fixed) */}
      {isProfilePage && (
        <div
          className="profile-video-bg"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -2,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: 'radial-gradient(circle at center, #0a0a0f 0%, #030305 100%)'
          }}
        >
          <video
            key={profileBgVideo}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 'var(--profile-video-opacity)', // Configurable transparency from CSS
              filter: 'brightness(0.7) contrast(1.1)'
            }}
          >
            <source src={profileBgVideo} type="video/mp4" />
          </video>
        </div>
      )}

      <AnimatePresence>
        {showIntro && <IntroScreen key="intro" />}
      </AnimatePresence>

      <div style={{ opacity: showIntro ? 0 : 1, transition: 'opacity 0.5s ease', pointerEvents: showIntro ? 'none' : 'auto' }}>
        {!loading && (
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        )}
      </div>
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
