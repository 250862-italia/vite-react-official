import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Mail,
  User,
  Star
} from 'lucide-react';

const CommunicationManager = () => {
  const [activeTab, setActiveTab] = useState('messages');
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [messageForm, setMessageForm] = useState({
    recipientId: '',
    message: '',
    type: 'info',
    priority: 'normal'
  });

  const [notificationForm, setNotificationForm] = useState({
    userId: '',
    title: '',
    message: '',
    type: 'info',
    priority: 'normal'
  });

  const [responseForm, setResponseForm] = useState({
    response: '',
    status: 'responded'
  });

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUsers(),
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

  const loadUsers = async () => {
    try {
      const response = await axios.get(getApiUrl('/admin/users'), { headers: getHeaders() });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento utenti:', error);
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
      const response = await axios.get(getApiUrl('/admin/ambassador-requests'), { headers: getHeaders() });
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(getApiUrl('/admin/send-message'), messageForm, { headers: getHeaders() });
      if (response.data.success) {
        setShowMessageModal(false);
        setMessageForm({ recipientId: '', message: '', type: 'info', priority: 'normal' });
        loadMessages();
        setMessage({ type: 'success', text: 'Messaggio inviato con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nell\'invio del messaggio' });
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(getApiUrl('/admin/create-notification'), notificationForm, { headers: getHeaders() });
      if (response.data.success) {
        setShowNotificationModal(false);
        setNotificationForm({ userId: '', title: '', message: '', type: 'info', priority: 'normal' });
        loadNotifications();
        setMessage({ type: 'success', text: 'Notifica creata con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore creazione notifica:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nella creazione della notifica' });
    }
  };

  const handleRespondToRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        getApiUrl(`/admin/ambassador-requests/${selectedRequest.id}/respond`), 
        responseForm, 
        { headers: getHeaders() }
      );
      if (response.data.success) {
        setShowResponseModal(false);
        setResponseForm({ response: '', status: 'responded' });
        setSelectedRequest(null);
        loadRequests();
        setMessage({ type: 'success', text: 'Risposta inviata con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore risposta richiesta:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nell\'invio della risposta' });
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
          📞 Gestione Comunicazioni
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowMessageModal(true)}
            className="btn btn-primary"
          >
            <Send className="h-4 w-4 mr-2" />
            Invia Messaggio
          </button>
          <button
            onClick={() => setShowNotificationModal(true)}
            className="btn btn-outline"
          >
            <Bell className="h-4 w-4 mr-2" />
            Crea Notifica
          </button>
        </div>
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
          Richieste Ambassador
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
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-sm">{request.ambassadorName}</span>
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
                    <p className="text-sm text-blue-800">{request.adminResponse}</p>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(request.createdAt).toLocaleDateString('it-IT')}</span>
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowResponseModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Rispondi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
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
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Invia Messaggio</h3>
            <form onSubmit={handleSendMessage}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatario
                  </label>
                  <select
                    value={messageForm.recipientId}
                    onChange={(e) => setMessageForm({...messageForm, recipientId: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Seleziona utente</option>
                    {users.filter(u => u.role === 'ambassador').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Messaggio
                  </label>
                  <textarea
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
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
                      value={messageForm.type}
                      onChange={(e) => setMessageForm({...messageForm, type: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="info">Informazione</option>
                      <option value="warning">Avviso</option>
                      <option value="success">Successo</option>
                      <option value="error">Errore</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorità
                    </label>
                    <select
                      value={messageForm.priority}
                      onChange={(e) => setMessageForm({...messageForm, priority: e.target.value})}
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
                  onClick={() => setShowMessageModal(false)}
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

      {/* Create Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Crea Notifica</h3>
            <form onSubmit={handleCreateNotification}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utente
                  </label>
                  <select
                    value={notificationForm.userId}
                    onChange={(e) => setNotificationForm({...notificationForm, userId: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Seleziona utente</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titolo
                  </label>
                  <input
                    type="text"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Messaggio
                  </label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
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
                      value={notificationForm.type}
                      onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="info">Informazione</option>
                      <option value="warning">Avviso</option>
                      <option value="success">Successo</option>
                      <option value="error">Errore</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorità
                    </label>
                    <select
                      value={notificationForm.priority}
                      onChange={(e) => setNotificationForm({...notificationForm, priority: e.target.value})}
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
                  onClick={() => setShowNotificationModal(false)}
                  className="btn btn-outline"
                >
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  Crea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Rispondi a Richiesta</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Da:</strong> {selectedRequest.ambassadorName}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Oggetto:</strong> {selectedRequest.subject}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Messaggio:</strong> {selectedRequest.message}
              </p>
            </div>
            <form onSubmit={handleRespondToRequest}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Risposta
                  </label>
                  <textarea
                    value={responseForm.response}
                    onChange={(e) => setResponseForm({...responseForm, response: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={responseForm.status}
                    onChange={(e) => setResponseForm({...responseForm, status: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="responded">Risposto</option>
                    <option value="in_progress">In Lavorazione</option>
                    <option value="resolved">Risolto</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowResponseModal(false)}
                  className="btn btn-outline"
                >
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  Invia Risposta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationManager; 