import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const Toast = ({ message, type = 'info', duration = 5000, onClose, isVisible }) => {
  const [progress, setProgress] = useState(100);

  const getToastStyle = () => {
    switch(type) {
      case 'success':
        return {
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500',
          textColor: 'text-green-400',
          icon: FiCheckCircle,
          iconColor: 'text-green-400'
        };
      case 'error':
        return {
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500',
          textColor: 'text-red-400',
          icon: FiXCircle,
          iconColor: 'text-red-400'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-400',
          icon: FiAlertTriangle,
          iconColor: 'text-yellow-400'
        };
      default:
        return {
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-400',
          icon: FiInfo,
          iconColor: 'text-blue-400'
        };
    }
  };

  const toastStyle = getToastStyle();
  const Icon = toastStyle.icon;

  useEffect(() => {
    if (isVisible && duration > 0) {
      const interval = 50;
      const decrement = (100 / duration) * interval;
      
      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - decrement;
          if (newProgress <= 0) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return newProgress;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm animate-pulse`}>
      <div className={`${toastStyle.bgColor} ${toastStyle.borderColor} border rounded-lg shadow-lg backdrop-blur-sm`}>
        <div className="flex items-start p-4">
          <Icon className={`w-5 h-5 ${toastStyle.iconColor} mt-0.5 flex-shrink-0`} />
          
          <div className="ml-3 flex-1">
            <p className={`${toastStyle.textColor} text-sm font-medium`}>
              {message}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-gray-700 rounded-b-lg overflow-hidden">
          <div
            className={`h-full transition-all duration-50 ${
              type === 'success' ? 'bg-green-500' :
              type === 'error' ? 'bg-red-500' :
              type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          isVisible={toast.isVisible}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Toast Hook for easy usage
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration,
      isVisible: true
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Convenience methods
  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default Toast;
