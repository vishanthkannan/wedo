import React, { useContext, useState } from 'react';
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
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return null; // We hide default loading since intro screen covers it
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  return (
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
  );
};

const App = () => {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BackgroundPattern />
        <AnimatePresence>
          {showIntro && <IntroScreen key="intro" onComplete={() => setShowIntro(false)} />}
        </AnimatePresence>
        
        <div style={{ opacity: showIntro ? 0 : 1, transition: 'opacity 0.5s ease', pointerEvents: showIntro ? 'none' : 'auto' }}>
          <Router>
            <AppRoutes />
          </Router>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
