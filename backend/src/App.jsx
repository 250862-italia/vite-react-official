import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import OnboardingDashboard from './pages/OnboardingDashboard';
import TaskView from './pages/TaskView';
import Badges from './pages/Badges';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/onboarding" element={<OnboardingDashboard />} />
            <Route path="/task/:taskId" element={<TaskView />} />
            <Route path="/badges" element={<Badges />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 