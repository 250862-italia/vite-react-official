import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocket = (token) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!token) return;

    try {
      // Chiudi connessione esistente
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Crea nuova connessione WebSocket
      const wsUrl = `ws://localhost:3001?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔗 WebSocket connesso');
        setIsConnected(true);
        
        // Pulisci timeout di riconnessione
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Notifica ricevuta:', data);
          
          // Aggiungi notifica alla lista
          setNotifications(prev => [
            {
              id: Date.now(),
              type: data.type,
              message: data.data.message,
              data: data.data,
              timestamp: data.timestamp
            },
            ...prev.slice(0, 9) // Mantieni solo le ultime 10 notifiche
          ]);
          
          // Mostra notifica toast
          showNotificationToast(data);
        } catch (error) {
          console.error('❌ Errore parsing notifica:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnesso');
        setIsConnected(false);
        
        // Riconnessione automatica dopo 3 secondi
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Tentativo riconnessione...');
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Errore WebSocket:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ Errore connessione WebSocket:', error);
      setIsConnected(false);
    }
  }, [token]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Funzione per mostrare notifica toast
  const showNotificationToast = (data) => {
    // Crea elemento toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-lg">🔔</span>
        <div>
          <div class="font-semibold">${getNotificationTitle(data.type)}</div>
          <div class="text-sm opacity-90">${data.data.message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Anima entrata
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // Rimuovi dopo 5 secondi
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 5000);
  };

  // Funzione per ottenere titolo notifica
  const getNotificationTitle = (type) => {
    const titles = {
      'TASK_CREATED': 'Nuovo Task',
      'TASK_UPDATED': 'Task Aggiornato',
      'USER_CREATED': 'Nuovo Utente',
      'USER_UPDATED': 'Utente Aggiornato',
      'COMMISSION_PLAN_CREATED': 'Nuovo Piano Commissioni',
      'COMMISSION_PLAN_UPDATED': 'Piano Commissioni Aggiornato',
      'KYC_APPROVED': 'KYC Approvato',
      'KYC_REJECTED': 'KYC Rifiutato',
      'COMMISSION_PAID': 'Commissione Pagata',
      'PACKAGE_AUTHORIZED': 'Pacchetto Autorizzato'
    };
    
    return titles[type] || 'Notifica';
  };

  // Connessione automatica quando cambia il token
  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup alla disconnessione
    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return {
    isConnected,
    notifications,
    connect,
    disconnect
  };
}; 