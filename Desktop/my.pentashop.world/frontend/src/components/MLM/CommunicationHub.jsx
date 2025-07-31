import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';
import { 
  MessageSquare, 
  Send, 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Mail,
  User,
  Star,
  Plus
} from 'lucide-react';

const CommunicationHub = ({ user }) => {
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    type: 'request',
    priority: 'normal'
  });

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    if (user && user.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMessages(),
        loadRequests(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      setMessage({ type: 'error', text: 'Errore nel caricamento dei dati' });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await axios.get(getApiUrl('/messages'), { headers: getHeaders() });
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento messaggi:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await axios.get(getApiUrl('/ambassador/requests'), { headers: getHeaders() });
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento richieste:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await axios.get(getApiUrl('/notifications'), { headers: getHeaders() });
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
    }
  };

  const handleContactAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(getApiUrl('/ambassador/contact-admin'), contactForm, { headers: getHeaders() });
      if (response.data.success) {
        setShowContactModal(false);
        setContactForm({ subject: '', message: '', type: 'request', priority: 'normal' });
        loadRequests();
        setMessage({ type: 'success', text: 'Richiesta inviata con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore invio richiesta:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nell\'invio della richiesta' });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info': return <Bell className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-neutral-600">Caricamento comunicazioni...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-800">
          📞 Centro Comunicazioni
        </h2>
        <button
          onClick={() => setShowContactModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Contatta Admin
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            activeTab === 'messages' ? 'bg-white shadow-sm' : 'text-gray-600'
          }`}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Messaggi
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            activeTab === 'requests' ? 'bg-white shadow-sm' : 'text-gray-600'
          }`}
        >
          <Mail className="h-4 w-4 mr-2" />
          Le Mie Richieste
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            activeTab === 'notifications' ? 'bg-white shadow-sm' : 'text-gray-600'
          }`}
        >
          <Bell className="h-4 w-4 mr-2" />
          Notifiche
        </button>
      </div>

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nessun messaggio ricevuto</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">
                        {msg.senderId === 2 ? 'Admin' : msg.senderName}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(msg.priority)}`}>
                      {msg.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{msg.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(msg.createdAt).toLocaleDateString('it-IT')}</span>
                    {msg.isRead ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nessuna richiesta inviata</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((request) => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">Tu</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'responded' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{request.subject}</h4>
                  <p className="text-sm text-gray-600 mb-3">{request.message}</p>
                  {request.adminResponse && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                      <p className="text-sm text-blue-800">
                        <strong>Risposta Admin:</strong> {request.adminResponse}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(request.createdAt).toLocaleDateString('it-IT')}</span>
                    {request.status === 'responded' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nessuna notifica ricevuta</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(notification.type)}
                      <span className="font-medium text-sm">{notification.title}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(notification.createdAt).toLocaleDateString('it-IT')}</span>
                    {notification.isRead ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact Admin Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Contatta Admin</h3>
            <form onSubmit={handleContactAdmin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oggetto
                  </label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Messaggio
                  </label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="4"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={contactForm.type}
                      onChange={(e) => setContactForm({...contactForm, type: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="request">Richiesta</option>
                      <option value="feedback">Feedback</option>
                      <option value="support">Supporto</option>
                      <option value="suggestion">Suggerimento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorità
                    </label>
                    <select
                      value={contactForm.priority}
                      onChange={(e) => setContactForm({...contactForm, priority: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="normal">Normale</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="btn btn-outline"
                >
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  Invia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationHub; 