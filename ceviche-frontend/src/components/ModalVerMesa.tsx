import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, TableCellsIcon, UserGroupIcon, ClockIcon, UsersIcon, CalendarIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

interface ModalVerMesaProps {
  isOpen: boolean;
  onClose: () => void;
  mesa: {
    mesa: {
      id: number;
      numero: number;
      estado: string;
      capacidad: number;
      zona_nombre?: string;
      piso_nombre?: string;
    };
    orden_activa?: {
      id: number;
      estado: string;
      total: number;
      cliente_nombre?: string;
      creado_en: string;
      items: {
        id: number;
        producto: {
          id: number;
          nombre: string;
          descripcion?: string;
        };
        cantidad: number;
        precio: number;
        estado: string;
      }[];
    };
    reservas_hoy?: {
      id: number;
      cliente_nombre: string;
      hora_reserva: string;
      numero_personas: number;
      estado: string;
    }[];
    ordenes_recientes?: {
      id: number;
      estado: string;
      total: number;
      creado_en: string;
    }[];
  } | null;
  onTomarPedido?: () => void;
}

export function ModalVerMesa({ isOpen, onClose, mesa, onTomarPedido }: ModalVerMesaProps) {
  if (!mesa) return null;

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'ocupada':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'reservada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'limpieza':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'mantenimiento':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'cerrada':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return '✅';
      case 'ocupada':
        return '👥';
      case 'reservada':
        return '📅';
      case 'limpieza':
        return '🧹';
      case 'mantenimiento':
        return '🔧';
      case 'cerrada':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatHora = (hora: string) => {
    return hora.substring(0, 5); // Solo mostrar HH:MM
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TableCellsIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Detalles de la Mesa
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Mesa {mesa.mesa.numero}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Cerrar modal"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Información Básica */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <TableCellsIcon className="h-5 w-5 text-blue-500" />
                      Información General
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Número:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{mesa.mesa.numero}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Estado:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(mesa.mesa.estado)}`}>
                          {getEstadoIcon(mesa.mesa.estado)} {mesa.mesa.estado.charAt(0).toUpperCase() + mesa.mesa.estado.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Capacidad:</span>
                        <div className="flex items-center gap-1">
                          <UserGroupIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white font-medium">{mesa.mesa.capacidad} personas</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Zona:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {mesa.mesa.zona_nombre || 'Sin zona asignada'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <BuildingOffice2Icon className="h-5 w-5 text-purple-500" />
                      Ubicación
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Zona:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {mesa.mesa.zona_nombre || 'Sin zona'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Piso:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {mesa.mesa.piso_nombre || 'Sin piso'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Mesa ID:</span>
                        <span className="text-gray-900 dark:text-white font-medium">{mesa.mesa.id}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orden Activa */}
                {mesa.orden_activa && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                      <UsersIcon className="h-5 w-5" />
                      Orden Activa
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-blue-600 dark:text-blue-400">Cliente:</span>
                        <p className="text-blue-900 dark:text-blue-100 font-medium">
                          {mesa.orden_activa.cliente_nombre || 'Sin nombre'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-blue-600 dark:text-blue-400">Total:</span>
                        <p className="text-blue-900 dark:text-blue-100 font-medium">
                          S/ {mesa.orden_activa.total.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-blue-600 dark:text-blue-400">Estado:</span>
                        <p className="text-blue-900 dark:text-blue-100 font-medium">
                          {mesa.orden_activa.estado}
                        </p>
                      </div>
                    </div>
                    {mesa.orden_activa.items && mesa.orden_activa.items.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Productos:</h5>
                        <div className="space-y-1">
                          {mesa.orden_activa.items.map((item) => (
                            <div key={item.id} className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                              <div className="flex justify-between items-center">
                                <span>
                                  {item.cantidad}x {item.producto?.nombre || 'Producto sin nombre'}
                                </span>
                                <span className="font-medium">
                                  S/ {item.precio.toFixed(2)}
                                </span>
                              </div>
                              {item.producto?.descripcion && (
                                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                  {item.producto.descripcion}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reservas del Día */}
                {mesa.reservas_hoy && mesa.reservas_hoy.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                      <CalendarIcon className="h-5 w-5 text-green-500" />
                      Reservas del Día
                    </h4>
                    <div className="space-y-3">
                      {mesa.reservas_hoy.map((reserva) => (
                        <div key={reserva.id} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 dark:text-green-400">👤</span>
                              <span className="text-green-900 dark:text-green-100 font-medium">
                                {reserva.cliente_nombre}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-green-900 dark:text-green-100 font-medium">
                                {formatHora(reserva.hora_reserva)}
                              </div>
                              <div className="text-sm text-green-600 dark:text-green-400">
                                {reserva.numero_personas} personas
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Órdenes Recientes */}
                {mesa.ordenes_recientes && mesa.ordenes_recientes.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                      <ClockIcon className="h-5 w-5 text-orange-500" />
                      Órdenes Recientes
                    </h4>
                    <div className="space-y-2">
                      {mesa.ordenes_recientes.slice(0, 3).map((orden) => (
                        <div key={orden.id} className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-orange-600 dark:text-orange-400">📋</span>
                              <span className="text-orange-900 dark:text-orange-100 font-medium">
                                Orden #{orden.id}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-orange-900 dark:text-orange-100 font-medium">
                                S/ {orden.total.toFixed(2)}
                              </div>
                              <div className="text-xs text-orange-600 dark:text-orange-400">
                                {formatFecha(orden.creado_en)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer con acciones */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cerrar
                  </button>
                  {mesa.mesa.estado === 'disponible' && onTomarPedido && (
                    <button
                      onClick={() => {
                        onTomarPedido();
                        onClose();
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Tomar Pedido
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
