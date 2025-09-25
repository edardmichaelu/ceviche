import { useState, useEffect, useCallback } from 'react';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos
const WARNING_TIMEOUT = 1 * 60 * 1000;   // 1 minuto de advertencia

interface InactivityManagerProps {
  onLogout: () => void;
}

export function InactivityManager({ onLogout }: InactivityManagerProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_TIMEOUT / 1000);

  const resetTimer = useCallback(() => {
    setShowWarning(false);
    clearTimeout(window.warningTimer);
    clearTimeout(window.logoutTimer);

    window.warningTimer = setTimeout(() => {
      setShowWarning(true);
      setCountdown(WARNING_TIMEOUT / 1000);
    }, INACTIVITY_TIMEOUT - WARNING_TIMEOUT);

    window.logoutTimer = setTimeout(() => {
      onLogout();
    }, INACTIVITY_TIMEOUT);
  }, [onLogout]);

  const handleStayActive = () => {
    resetTimer();
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer(); // Inicia el temporizador al montar el componente

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(window.warningTimer);
      clearTimeout(window.logoutTimer);
    };
  }, [resetTimer]);

  useEffect(() => {
    let interval: number;
    if (showWarning) {
      interval = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showWarning]);

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 text-center max-w-sm mx-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">¿Sigues ahí?</h3>
        <p className="text-gray-600 mb-6">
          Tu sesión se cerrará automáticamente por inactividad en <span className="font-bold text-red-500">{countdown}</span> segundos.
        </p>
        <button
          onClick={handleStayActive}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300"
        >
          Permanecer Conectado
        </button>
      </div>
    </div>
  );
}

// Extender el objeto Window para evitar errores de TypeScript
declare global {
  interface Window {
    warningTimer: number;
    logoutTimer: number;
  }
}
