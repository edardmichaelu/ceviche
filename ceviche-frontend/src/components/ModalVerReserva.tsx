import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, UserIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, ClockIcon, UserGroupIcon, BuildingOffice2Icon, TableCellsIcon } from '@heroicons/react/24/outline';

interface ModalVerReservaProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: {
    id: number;
    cliente_nombre: string;
    cliente_telefono?: string;
    cliente_email?: string;
    fecha_reserva: string;
    hora_reserva: string;
    duracion_estimada: number;
    numero_personas: number;
    estado: string;
    tipo_reserva: string;
    zona_nombre?: string | null;
    mesa_numero?: string | null;
    notas?: string;
    requerimientos_especiales?: string;
    creado_en?: string;
  } | null;
}

export function ModalVerReserva({ isOpen, onClose, reserva }: ModalVerReservaProps) {
  if (!reserva) return null;

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelada':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'especial':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'grupo':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatHora = (hora: string) => {
    const [hours, minutes] = hora.split(':');
    return `${hours}:${minutes}`;
  };

  const calcularHoraFin = (horaInicio: string, duracion: number) => {
    const [hours, minutes] = horaInicio.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duracion;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Detalles de la Reserva
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {reserva.id}
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
                  
                  {/* Información del Cliente */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-blue-500" />
                      Cliente
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white font-medium">{reserva.cliente_nombre}</span>
                      </div>
                      {reserva.cliente_telefono && (
                        <div className="flex items-center gap-3">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">{reserva.cliente_telefono}</span>
                        </div>
                      )}
                      {reserva.cliente_email && (
                        <div className="flex items-center gap-3">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">{reserva.cliente_email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información de la Reserva */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-green-500" />
                      Reserva
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">{formatFecha(reserva.fecha_reserva)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {formatHora(reserva.hora_reserva)} - {calcularHoraFin(reserva.hora_reserva, reserva.duracion_estimada)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <UserGroupIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">{reserva.numero_personas} persona{reserva.numero_personas !== 1 ? 's' : ''}</span>
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
                      <div className="flex items-center gap-3">
                        <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white font-medium">
                          {reserva.zona_nombre || 'Sin zona asignada'}
                        </span>
                      </div>
                      {reserva.mesa_numero && (
                        <div className="flex items-center gap-3">
                          <TableCellsIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">Mesa {reserva.mesa_numero}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estado y Tipo */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="h-5 w-5 bg-gray-400 rounded-full"></span>
                      Estado
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Estado:</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(reserva.estado)}`}>
                            {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Tipo:</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTipoColor(reserva.tipo_reserva)}`}>
                            {reserva.tipo_reserva.charAt(0).toUpperCase() + reserva.tipo_reserva.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notas y Requerimientos */}
                {(reserva.notas || reserva.requerimientos_especiales) && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Información Adicional
                    </h4>
                    {reserva.notas && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Notas:</span>
                        <p className="mt-1 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {reserva.notas}
                        </p>
                      </div>
                    )}
                    {reserva.requerimientos_especiales && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Requerimientos especiales:</span>
                        <p className="mt-1 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {reserva.requerimientos_especiales}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fecha de creación */}
                {reserva.creado_en && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reserva creada el {new Date(reserva.creado_en).toLocaleString('es-ES')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
