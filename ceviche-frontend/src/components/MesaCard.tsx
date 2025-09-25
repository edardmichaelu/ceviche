import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/solid';

interface Mesa {
  id: number;
  numero: string;
  estado: string;
  capacidad: number;
  zona_id: number;
  zona_nombre: string;
  piso_nombre: string;
  orden_activa?: {
    id: number;
    total_items: number;
    tiempo_espera: number;
    estado: string;
    cliente_nombre?: string;
  };
  ultima_actividad?: string;
}

interface MesaCardProps {
  mesa: Mesa;
  onMesaClick?: (mesa: Mesa) => void;
  onStatusChange?: (mesaId: number, nuevoEstado: string) => void;
  onViewDetails?: (mesa: Mesa) => void;
  compactMode?: boolean;
  showActions?: boolean;
}

export const MesaCard: React.FC<MesaCardProps> = ({
  mesa,
  onMesaClick,
  onStatusChange,
  onViewDetails,
  compactMode = false,
  showActions = true
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Colores y estilos por estado
  const getEstadoStyles = (estado: string) => {
    const styles = {
      disponible: {
        bg: 'bg-gradient-to-br from-green-50 to-green-100',
        border: 'border-green-300',
        text: 'text-green-800',
        icon: 'text-green-600',
        shadow: 'shadow-green-100'
      },
      ocupada: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        border: 'border-blue-300',
        text: 'text-blue-800',
        icon: 'text-blue-600',
        shadow: 'shadow-blue-100'
      },
      reservada: {
        bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
        border: 'border-purple-300',
        text: 'text-purple-800',
        icon: 'text-purple-600',
        shadow: 'shadow-purple-100'
      },
      limpieza: {
        bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
        icon: 'text-yellow-600',
        shadow: 'shadow-yellow-100'
      },
      mantenimiento: {
        bg: 'bg-gradient-to-br from-red-50 to-red-100',
        border: 'border-red-300',
        text: 'text-red-800',
        icon: 'text-red-600',
        shadow: 'shadow-red-100'
      },
      cerrada: {
        bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-800',
        icon: 'text-gray-600',
        shadow: 'shadow-gray-100'
      }
    };
    return styles[estado as keyof typeof styles] || styles.disponible;
  };

  const getEstadoIcon = (estado: string) => {
    const icons = {
      disponible: CheckCircleIcon,
      ocupada: UserGroupIcon,
      reservada: ClockIcon,
      limpieza: ExclamationTriangleIcon,
      mantenimiento: WrenchScrewdriverIcon,
      cerrada: XCircleIcon
    };
    return icons[estado as keyof typeof icons] || CheckCircleIcon;
  };

  const getEstadoLabel = (estado: string) => {
    const labels = {
      disponible: 'Disponible',
      ocupada: 'Ocupada',
      reservada: 'Reservada',
      limpieza: 'Limpieza',
      mantenimiento: 'Mantenimiento',
      cerrada: 'Cerrada'
    };
    return labels[estado as keyof typeof labels] || estado;
  };

  const styles = getEstadoStyles(mesa.estado);
  const EstadoIcon = getEstadoIcon(mesa.estado);

  const handleStatusChange = (nuevoEstado: string) => {
    if (onStatusChange) {
      onStatusChange(mesa.id, nuevoEstado);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-300
        ${styles.bg} ${styles.border} ${styles.text}
        ${isHovered ? `shadow-lg ${styles.shadow}` : 'shadow-md'}
        ${compactMode ? 'min-h-[100px]' : 'min-h-[140px]'}
      `}
      onClick={() => onMesaClick?.(mesa)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header de la mesa */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <EstadoIcon className={`h-6 w-6 ${styles.icon}`} />
          <div>
            <span className="font-bold text-lg">Mesa {mesa.numero}</span>
            <p className="text-xs opacity-75">{getEstadoLabel(mesa.estado)}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium">Cap: {mesa.capacidad}</span>
          <p className="text-xs opacity-75">{mesa.zona_nombre}</p>
        </div>
      </div>

      {/* Contenido principal */}
      {!compactMode && (
        <div className="space-y-2">
          {/* Detalles de orden si está ocupada */}
          {mesa.estado === 'ocupada' && mesa.orden_activa && (
            <div className="bg-white/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{mesa.orden_activa.total_items} ítems</span>
              </div>
              {mesa.orden_activa.cliente_nombre && (
                <p className="text-xs opacity-75 truncate">
                  Cliente: {mesa.orden_activa.cliente_nombre}
                </p>
              )}
              {mesa.orden_activa.tiempo_espera > 0 && (
                <div className="flex items-center gap-1 text-orange-600">
                  <ClockIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">{mesa.orden_activa.tiempo_espera} min</span>
                </div>
              )}
            </div>
          )}

          {/* Información de zona */}
          <div className="text-xs opacity-75">
            {mesa.piso_nombre} • {mesa.zona_nombre}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <AnimatePresence>
        {isHovered && showActions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-2 right-2 flex gap-1"
          >
            {/* Botón de ver detalles */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(mesa);
              }}
              className="bg-white/90 text-gray-700 p-1.5 rounded-lg shadow-md hover:bg-white transition-colors"
              title="Ver detalles"
            >
              <EyeIcon className="h-4 w-4" />
            </button>

            {/* Botones de cambio de estado */}
            {onStatusChange && (
              <>
                {mesa.estado === 'disponible' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange('ocupada');
                    }}
                    className="bg-blue-500 text-white p-1.5 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
                    title="Marcar como ocupada"
                  >
                    <UserGroupIcon className="h-4 w-4" />
                  </button>
                )}
                {mesa.estado === 'ocupada' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange('limpieza');
                    }}
                    className="bg-yellow-500 text-white p-1.5 rounded-lg shadow-md hover:bg-yellow-600 transition-colors"
                    title="Marcar para limpieza"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4" />
                  </button>
                )}
                {mesa.estado === 'limpieza' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange('disponible');
                    }}
                    className="bg-green-500 text-white p-1.5 rounded-lg shadow-md hover:bg-green-600 transition-colors"
                    title="Marcar como disponible"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                  </button>
                )}
                {mesa.estado === 'reservada' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange('ocupada');
                    }}
                    className="bg-blue-500 text-white p-1.5 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
                    title="Confirmar ocupación"
                  >
                    <UserGroupIcon className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de actividad reciente */}
      {mesa.ultima_actividad && (
        <div className="absolute bottom-2 left-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Actividad reciente" />
        </div>
      )}
    </motion.div>
  );
};

export default MesaCard;
