import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import IntroScreen from './components/IntroScreen';
import BackgroundPattern from './components/BackgroundPattern';
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppContent = () => {
  const { user, loading } = useContext(AuthContext);
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Show intro if auth is still loading OR if the minimum 2.5s animation time hasn't finished
  const showIntro = loading || !minTimePassed;

  return (
    <>
      <BackgroundPattern />
      <AnimatePresence>
        {showIntro && <IntroScreen key="intro" />}
      </AnimatePresence>
      
      <div style={{ opacity: showIntro ? 0 : 1, transition: 'opacity 0.5s ease', pointerEvents: showIntro ? 'none' : 'auto' }}>
        {!loading && (
          <Router>
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
            </Routes>
          </Router>
        )}
      </div>
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
