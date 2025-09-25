import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon, CalendarIcon, ClockIcon, BuildingOffice2Icon, TableCellsIcon, HomeIcon, TagIcon } from '@heroicons/react/24/outline';

interface ModalVerBloqueoProps {
  isOpen: boolean;
  onClose: () => void;
  bloqueo: {
    id: number;
    titulo: string;
    descripcion?: string;
    tipo: string;
    estado: string;
    fecha_inicio: string;
    fecha_fin: string;
    mesa_id?: number;
    zona_id?: number;
    piso_id?: number;
    notas?: string;
    motivo?: string;
    mesa_numero?: string;
    zona_nombre?: string;
    piso_nombre?: string;
    usuario_nombre?: string;
    duracion_horas: number;
    creado_en: string;
  } | null;
}

export function ModalVerBloqueo({ isOpen, onClose, bloqueo }: ModalVerBloqueoProps) {
  if (!bloqueo) return null;

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'programado':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'mantenimiento':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'evento':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'limpieza':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
      case 'emergencia':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
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

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularDuracion = (fechaInicio: string, fechaFin: string) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffMs = fin.getTime() - inicio.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    return diffHours;
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 cursor-pointer"
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
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Detalles del Bloqueo
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {bloqueo.id}
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
                      <TagIcon className="h-5 w-5 text-blue-500" />
                      Información Básica
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Título:</span>
                        <p className="text-gray-900 dark:text-white font-medium">{bloqueo.titulo}</p>
                      </div>
                      {bloqueo.descripcion && (
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Descripción:</span>
                          <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            {bloqueo.descripcion}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fechas y Horarios */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-green-500" />
                      Fechas y Horarios
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">{formatFecha(bloqueo.fecha_inicio)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {formatHora(bloqueo.fecha_inicio)} - {formatHora(bloqueo.fecha_fin)}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Duración:</span>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {calcularDuracion(bloqueo.fecha_inicio, bloqueo.fecha_fin)} horas
                        </p>
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
                      {bloqueo.piso_nombre && (
                        <div className="flex items-center gap-3">
                          <HomeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white font-medium">{bloqueo.piso_nombre}</span>
                        </div>
                      )}
                      {bloqueo.zona_nombre && (
                        <div className="flex items-center gap-3">
                          <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white font-medium">{bloqueo.zona_nombre}</span>
                        </div>
                      )}
                      {bloqueo.mesa_numero && (
                        <div className="flex items-center gap-3">
                          <TableCellsIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">Mesa {bloqueo.mesa_numero}</span>
                        </div>
                      )}
                      {!bloqueo.piso_nombre && !bloqueo.zona_nombre && !bloqueo.mesa_numero && (
                        <p className="text-gray-500 dark:text-gray-400 italic">Sin ubicación específica</p>
                      )}
                    </div>
                  </div>

                  {/* Estado y Tipo */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="h-5 w-5 bg-gray-400 rounded-full"></span>
                      Estado y Tipo
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Estado:</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(bloqueo.estado)}`}>
                            {bloqueo.estado.charAt(0).toUpperCase() + bloqueo.estado.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Tipo:</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTipoColor(bloqueo.tipo)}`}>
                            {bloqueo.tipo.charAt(0).toUpperCase() + bloqueo.tipo.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notas y Motivo */}
                {(bloqueo.notas || bloqueo.motivo) && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Información Adicional
                    </h4>
                    {bloqueo.notas && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Notas:</span>
                        <p className="mt-1 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {bloqueo.notas}
                        </p>
                      </div>
                    )}
                    {bloqueo.motivo && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Motivo:</span>
                        <p className="mt-1 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {bloqueo.motivo}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Información del Usuario */}
                {bloqueo.usuario_nombre && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Creado por:</span>
                      <p className="text-gray-900 dark:text-white font-medium">{bloqueo.usuario_nombre}</p>
                    </div>
                  </div>
                )}

                {/* Fecha de creación */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Bloqueo creado el {new Date(bloqueo.creado_en).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
