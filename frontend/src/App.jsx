import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import OnboardingDashboard from './pages/OnboardingDashboard';
import TaskView from './pages/TaskView';
import Badges from './pages/Badges';
import Shop from './pages/Shop';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <div>
                    <Navigation />
                    <OnboardingDashboard />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/tasks/:taskId"
              element={
                <PrivateRoute>
                  <div>
                    <Navigation />
                    <TaskView />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/badges"
              element={
                <PrivateRoute>
                  <div>
                    <Navigation />
                    <Badges />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/shop"
              element={
                <PrivateRoute>
                  <div>
                    <Navigation />
                    <Shop />
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
