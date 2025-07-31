import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GuestDashboard from './pages/GuestDashboard';
import MLMDashboard from './pages/MLMDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import CommissionsPage from './pages/CommissionsPage';
import NetworkMLMPage from './pages/NetworkMLMPage';
import ReferralPage from './pages/ReferralPage';
import NetworkReferralPage from './pages/NetworkReferralPage';
import TasksPage from './pages/TasksPage';
import ProfilePage from './pages/ProfilePage';
import ContractPage from './pages/ContractPage';
import CommunicationsPage from './pages/CommunicationsPage';
import PlanSelection from './components/Plans/PlanSelection';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/guest" element={<GuestDashboard />} />
          <Route path="/mlm" element={<MLMDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/commissions" element={<CommissionsPage />} />
          <Route path="/network" element={<NetworkMLMPage />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/network-referral" element={<NetworkReferralPage />} />
        <Route path="/tasks" element={<TasksPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/contract" element={<ContractPage />} />
          <Route path="/communications" element={<CommunicationsPage />} />
          <Route path="/plans" element={<PlanSelection />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 