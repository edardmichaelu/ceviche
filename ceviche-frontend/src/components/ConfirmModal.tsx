import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  CheckIcon as CheckIconSolid,
  XMarkIcon as XMarkIconSolid
} from '@heroicons/react/24/solid';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  isLoading = false
}) => {
  const typeStyles = {
    danger: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-red-500',
      buttonBg: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      buttonIcon: XMarkIconSolid
    },
    warning: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-500',
      buttonBg: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
      buttonIcon: XMarkIconSolid
    },
    info: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-blue-500',
      buttonBg: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      buttonIcon: CheckIconSolid
    }
  };

  const currentStyle = typeStyles[type];
  const IconComponent = currentStyle.icon;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-700`}>
                    <IconComponent className={`h-6 w-6 ${currentStyle.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 pt-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`
                    flex-1 px-4 py-3 bg-gradient-to-r ${currentStyle.buttonBg}
                    text-white rounded-lg transition-all duration-200
                    font-medium shadow-lg hover:shadow-xl
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                  `}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <currentStyle.buttonIcon className="h-4 w-4" />
                      {confirmText}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
