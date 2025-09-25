import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import { apiClient } from '../apiClient';
import { toast } from 'react-hot-toast';

// --- Interfaces ---
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

interface Zona {
  id: number;
  nombre: string;
  mesas: Mesa[];
  color: string;
}

interface Piso {
  id: number;
  nombre: string;
  zonas: Zona[];
}

interface DynamicMesaMapProps {
  onMesaClick?: (mesa: Mesa) => void;
  onMesaStatusChange?: (mesaId: number, nuevoEstado: string) => void;
  refreshInterval?: number;
  showOrderDetails?: boolean;
  showWaitTime?: boolean;
  compactMode?: boolean;
}

// --- Colores por estado ---
const getEstadoColor = (estado: string) => {
  const colors = {
    disponible: 'bg-green-100 border-green-300 text-green-800',
    ocupada: 'bg-blue-100 border-blue-300 text-blue-800',
    reservada: 'bg-purple-100 border-purple-300 text-purple-800',
    limpieza: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    mantenimiento: 'bg-red-100 border-red-300 text-red-800',
    cerrada: 'bg-gray-100 border-gray-300 text-gray-800'
  };
  return colors[estado as keyof typeof colors] || colors.disponible;
};

const getEstadoIcon = (estado: string) => {
  const icons = {
    disponible: CheckCircleIcon,
    ocupada: UserGroupIcon,
    reservada: ClockIcon,
    limpieza: ExclamationTriangleIcon,
    mantenimiento: XCircleIcon,
    cerrada: XCircleIcon
  };
  return icons[estado as keyof typeof icons] || CheckCircleIcon;
};

// --- Componente de Mesa Individual ---
const MesaCard = ({ 
  mesa, 
  onClick, 
  onStatusChange, 
  showOrderDetails = true, 
  showWaitTime = true,
  compactMode = false 
}: {
  mesa: Mesa;
  onClick?: (mesa: Mesa) => void;
  onStatusChange?: (mesaId: number, nuevoEstado: string) => void;
  showOrderDetails?: boolean;
  showWaitTime?: boolean;
  compactMode?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const EstadoIcon = getEstadoIcon(mesa.estado);
  const colorClass = getEstadoColor(mesa.estado);

  const handleStatusChange = (nuevoEstado: string) => {
    if (onStatusChange) {
      onStatusChange(mesa.id, nuevoEstado);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-lg border-2 p-3 cursor-pointer transition-all duration-300
        ${colorClass}
        ${compactMode ? 'min-h-[80px]' : 'min-h-[120px]'}
        ${isHovered ? 'shadow-lg' : 'shadow-md'}
      `}
      onClick={() => onClick?.(mesa)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header de la mesa */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <EstadoIcon className="h-5 w-5" />
          <span className="font-bold text-lg">Mesa {mesa.numero}</span>
        </div>
        <span className="text-sm font-medium">Cap: {mesa.capacidad}</span>
      </div>

      {/* Estado actual */}
      <div className="text-sm font-medium capitalize mb-2">
        {mesa.estado}
      </div>

      {/* Detalles de orden si está ocupada */}
      {mesa.estado === 'ocupada' && mesa.orden_activa && showOrderDetails && (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1">
            <ClipboardDocumentListIcon className="h-4 w-4" />
            <span>{mesa.orden_activa.total_items} ítems</span>
          </div>
          {mesa.orden_activa.cliente_nombre && (
            <div className="text-gray-600">
              {mesa.orden_activa.cliente_nombre}
            </div>
          )}
          {showWaitTime && mesa.orden_activa.tiempo_espera > 0 && (
            <div className="flex items-center gap-1 text-orange-600">
              <ClockIcon className="h-4 w-4" />
              <span>{mesa.orden_activa.tiempo_espera} min</span>
            </div>
          )}
        </div>
      )}

      {/* Zona */}
      <div className="text-xs text-gray-500 mt-2">
        {mesa.zona_nombre} - {mesa.piso_nombre}
      </div>

      {/* Botones de cambio de estado (solo en hover) */}
      <AnimatePresence>
        {isHovered && onStatusChange && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-2 right-2 flex gap-1"
          >
            {mesa.estado === 'disponible' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('ocupada');
                }}
                className="bg-blue-500 text-white p-1 rounded text-xs hover:bg-blue-600"
                title="Marcar como ocupada"
              >
                <UserGroupIcon className="h-3 w-3" />
              </button>
            )}
            {mesa.estado === 'ocupada' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('limpieza');
                }}
                className="bg-yellow-500 text-white p-1 rounded text-xs hover:bg-yellow-600"
                title="Marcar para limpieza"
              >
                <ExclamationTriangleIcon className="h-3 w-3" />
              </button>
            )}
            {mesa.estado === 'limpieza' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('disponible');
                }}
                className="bg-green-500 text-white p-1 rounded text-xs hover:bg-green-600"
                title="Marcar como disponible"
              >
                <CheckCircleIcon className="h-3 w-3" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Componente Principal ---
export const DynamicMesaMap: React.FC<DynamicMesaMapProps> = ({
  onMesaClick,
  onMesaStatusChange,
  refreshInterval = 30000, // 30 segundos por defecto
  showOrderDetails = true,
  showWaitTime = true,
  compactMode = false
}) => {
  const [layout, setLayout] = useState<Piso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // --- Función para cargar datos ---
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClient.get<Piso[]>('/mesero/layout');
      setLayout(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      const errorMessage = err.message || 'Error cargando layout del restaurante';
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Función para actualizar estado de mesa ---
  const handleMesaStatusChange = async (mesaId: number, nuevoEstado: string) => {
    try {
      // Aquí harías la llamada a la API para actualizar el estado
      // await apiClient.put(`/mesero/mesas/${mesaId}/estado`, { estado: nuevoEstado });
      
      // Por ahora, actualizamos localmente
      setLayout(prevLayout => 
        prevLayout.map(piso => ({
          ...piso,
          zonas: piso.zonas.map(zona => ({
            ...zona,
            mesas: zona.mesas.map(mesa => 
              mesa.id === mesaId 
                ? { ...mesa, estado: nuevoEstado }
                : mesa
            )
          }))
        }))
      );
      
      toast.success(`✅ Mesa ${mesaId} actualizada a ${nuevoEstado}`);
      onMesaStatusChange?.(mesaId, nuevoEstado);
    } catch (err: any) {
      toast.error(`❌ Error actualizando mesa: ${err.message}`);
    }
  };

  // --- Efectos ---
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(loadData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadData, refreshInterval]);

  // --- Renderizado de carga ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando mapa de mesas...</p>
        </div>
      </div>
    );
  }

  // --- Renderizado de error ---
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // --- Renderizado principal ---
  return (
    <div className="w-full h-full">
      {/* Header con información de actualización */}
      <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800">Mapa de Mesas</h2>
        <div className="text-sm text-gray-500">
          Última actualización: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Layout de pisos */}
      <div className="space-y-6">
        {layout.map((piso) => (
          <div key={piso.id} className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {piso.nombre}
            </h3>
            
            {/* Zonas del piso */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {piso.zonas.map((zona) => (
                <div key={zona.id} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">{zona.nombre}</h4>
                  
                  {/* Mesas de la zona */}
                  <div className={`grid gap-2 ${
                    compactMode 
                      ? 'grid-cols-2' 
                      : 'grid-cols-1'
                  }`}>
                    {zona.mesas.map((mesa) => (
                      <MesaCard
                        key={mesa.id}
                        mesa={mesa}
                        onClick={onMesaClick}
                        onStatusChange={handleMesaStatusChange}
                        showOrderDetails={showOrderDetails}
                        showWaitTime={showWaitTime}
                        compactMode={compactMode}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de estados */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">Resumen de Estados</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {['disponible', 'ocupada', 'reservada', 'limpieza'].map((estado) => {
            const count = layout.reduce((total, piso) => 
              total + piso.zonas.reduce((zonaTotal, zona) => 
                zonaTotal + zona.mesas.filter(mesa => mesa.estado === estado).length, 0
              ), 0
            );
            const EstadoIcon = getEstadoIcon(estado);
            const colorClass = getEstadoColor(estado);
            
            return (
              <div key={estado} className={`flex items-center gap-2 p-2 rounded ${colorClass}`}>
                <EstadoIcon className="h-4 w-4" />
                <span className="capitalize">{estado}: {count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DynamicMesaMap;
