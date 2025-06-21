import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import ToastContainer from './components/ToastContainer';
import useToast from './hooks/useToast';
import Login from './pages/Login';
import Home from './pages/Home';
import OnboardingDashboard from './pages/OnboardingDashboard';
import TaskView from './pages/TaskView';
import Badges from './pages/Badges';

function AppContent() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        
        {/* Protected routes with header */}
        <Route path="/onboarding" element={
          <PrivateRoute>
            <div>
              <Header />
              <div className="pt-16 lg:pt-20">
                <OnboardingDashboard />
              </div>
            </div>
          </PrivateRoute>
        } />
        
        <Route path="/tasks" element={
          <PrivateRoute>
            <div>
              <Header />
              <div className="pt-16 lg:pt-20">
                <OnboardingDashboard />
              </div>
            </div>
          </PrivateRoute>
        } />
        
        <Route path="/task/:taskId" element={
          <PrivateRoute>
            <div>
              <Header />
              <div className="pt-16 lg:pt-20">
                <TaskView />
              </div>
            </div>
          </PrivateRoute>
        } />
        
        <Route path="/badges" element={
          <PrivateRoute>
            <div>
              <Header />
              <div className="pt-16 lg:pt-20">
                <Badges />
              </div>
            </div>
          </PrivateRoute>
        } />
        
        {/* Redirect to home for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App; 