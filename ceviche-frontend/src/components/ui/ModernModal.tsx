import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const iconMap = {
  info: ExclamationTriangleIcon,
  warning: ExclamationTriangleIcon,
  error: ExclamationTriangleIcon,
  success: CheckCircleIcon
};

const colorMap = {
  info: 'text-blue-600 dark:text-blue-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
  success: 'text-green-600 dark:text-green-400'
};

const bgColorMap = {
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
};

export const ModernModal: React.FC<ModernModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = true
}) => {
  const Icon = iconMap[type];
  const iconColor = colorMap[type];
  const bgColor = bgColorMap[type];

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border ${bgColor}`}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 p-2 rounded-full bg-white dark:bg-gray-700 border ${bgColor}`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {message}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {showCancel && (
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    type === 'success'
                      ? 'bg-green-600 hover:bg-green-700'
                      : type === 'error'
                      ? 'bg-red-600 hover:bg-red-700'
                      : type === 'warning'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para usar modales modernos
export const useModernModal = () => {
  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showModal = (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      onCancel
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const alert = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    showModal('Información', message, type, closeModal);
  };

  const confirm = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    type: 'info' | 'warning' | 'error' | 'success' = 'warning'
  ) => {
    showModal('Confirmación', message, type, onConfirm, onCancel || closeModal);
  };

  return {
    modalState,
    showModal,
    closeModal,
    alert,
    confirm
  };
};
