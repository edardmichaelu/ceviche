import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FireIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';
import { apiClient } from '../apiClient';
import { toast } from 'react-hot-toast';

// --- Interfaces ---
interface ItemCocina {
  id: number;
  orden_id: number;
  producto: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  cantidad: number;
  estado: string;
  mesa_numero: string;
  cliente_nombre?: string;
  tiempo_espera: number;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estacion: string;
  creado_en: string;
  notas?: string;
}

interface MesaCocina {
  id: number;
  numero: string;
  estado: string;
  items: ItemCocina[];
  tiempo_total_espera: number;
  prioridad_maxima: 'baja' | 'media' | 'alta' | 'urgente';
  zona_nombre: string;
  piso_nombre: string;
}

interface CocinaMesaMapProps {
  estacion: string;
  onItemStatusChange?: (itemId: number, nuevoEstado: string) => void;
  onMesaClick?: (mesa: MesaCocina) => void;
  refreshInterval?: number;
  showWaitTime?: boolean;
  groupByPriority?: boolean;
}

// --- Colores por prioridad ---
const getPrioridadColor = (prioridad: string) => {
  const colors = {
    baja: 'bg-green-100 border-green-300 text-green-800',
    media: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    alta: 'bg-orange-100 border-orange-300 text-orange-800',
    urgente: 'bg-red-100 border-red-300 text-red-800'
  };
  return colors[prioridad as keyof typeof colors] || colors.media;
};

const getPrioridadIcon = (prioridad: string) => {
  const icons = {
    baja: CheckCircleIcon,
    media: ClockIcon,
    alta: ExclamationTriangleIcon,
    urgente: FireIcon
  };
  return icons[prioridad as keyof typeof icons] || ClockIcon;
};

// --- Componente de Item de Cocina ---
const ItemCocinaCard = ({ 
  item, 
  onStatusChange 
}: {
  item: ItemCocina;
  onStatusChange?: (itemId: number, nuevoEstado: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const PrioridadIcon = getPrioridadIcon(item.prioridad);
  const colorClass = getPrioridadColor(item.prioridad);

  const handleStatusChange = (nuevoEstado: string) => {
    if (onStatusChange) {
      onStatusChange(item.id, nuevoEstado);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative rounded-lg border-2 p-3 cursor-pointer transition-all duration-300
        ${colorClass}
        ${isHovered ? 'shadow-lg' : 'shadow-md'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header del item */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PrioridadIcon className="h-4 w-4" />
          <span className="font-bold text-sm">{item.producto?.nombre || 'Producto sin nombre'}</span>
        </div>
        <span className="text-xs font-medium">x{item.cantidad}</span>
      </div>

      {/* Estado actual */}
      <div className="text-xs font-medium capitalize mb-2">
        {item.estado}
      </div>

      {/* Información de la mesa */}
      <div className="text-xs text-gray-600 mb-2">
        Mesa: {item.mesa_numero}
        {item.cliente_nombre && ` - ${item.cliente_nombre}`}
      </div>

      {/* Tiempo de espera */}
      <div className="flex items-center gap-1 text-xs text-orange-600">
        <ClockIcon className="h-3 w-3" />
        <span>{item.tiempo_espera} min</span>
      </div>

      {/* Notas si existen */}
      {item.notas && (
        <div className="text-xs text-gray-500 mt-2 italic">
          "{item.notas}"
        </div>
      )}

      {/* Botones de cambio de estado */}
      <AnimatePresence>
        {isHovered && onStatusChange && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-2 right-2 flex gap-1"
          >
            {item.estado === 'en_cola' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('preparando');
                }}
                className="bg-blue-500 text-white p-1 rounded text-xs hover:bg-blue-600"
                title="Comenzar preparación"
              >
                <ClockIcon className="h-3 w-3" />
              </button>
            )}
            {item.estado === 'preparando' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('listo');
                }}
                className="bg-green-500 text-white p-1 rounded text-xs hover:bg-green-600"
                title="Marcar como listo"
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

// --- Componente de Mesa para Cocina ---
const MesaCocinaCard = ({ 
  mesa, 
  onClick, 
  onItemStatusChange 
}: {
  mesa: MesaCocina;
  onClick?: (mesa: MesaCocina) => void;
  onItemStatusChange?: (itemId: number, nuevoEstado: string) => void;
}) => {
  const PrioridadIcon = getPrioridadIcon(mesa.prioridad_maxima);
  const colorClass = getPrioridadColor(mesa.prioridad_maxima);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`
        rounded-lg border-2 p-4 cursor-pointer transition-all duration-300
        ${colorClass}
        shadow-md hover:shadow-lg
      `}
      onClick={() => onClick?.(mesa)}
    >
      {/* Header de la mesa */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PrioridadIcon className="h-5 w-5" />
          <span className="font-bold text-lg">Mesa {mesa.numero}</span>
        </div>
        <span className="text-sm font-medium">{mesa.items.length} ítems</span>
      </div>

      {/* Información de la zona */}
      <div className="text-sm text-gray-600 mb-3">
        {mesa.zona_nombre} - {mesa.piso_nombre}
      </div>

      {/* Tiempo total de espera */}
      <div className="flex items-center gap-1 text-sm text-orange-600 mb-3">
        <ClockIcon className="h-4 w-4" />
        <span>{mesa.tiempo_total_espera} min total</span>
      </div>

      {/* Items de la mesa */}
      <div className="space-y-2">
        {mesa.items.map((item) => (
          <ItemCocinaCard
            key={item.id}
            item={item}
            onStatusChange={onItemStatusChange}
          />
        ))}
      </div>
    </motion.div>
  );
};

// --- Componente Principal ---
export const CocinaMesaMap: React.FC<CocinaMesaMapProps> = ({
  estacion,
  onItemStatusChange,
  onMesaClick,
  refreshInterval = 15000, // 15 segundos por defecto
  showWaitTime = true,
  groupByPriority = true
}) => {
  const [mesas, setMesas] = useState<MesaCocina[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // --- Función para cargar datos ---
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClient.get<MesaCocina[]>(`/api/cocina/mesas/${estacion}`);
      setMesas(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      const errorMessage = err.message || 'Error cargando datos de cocina';
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [estacion]);

  // --- Función para actualizar estado de item ---
  const handleItemStatusChange = async (itemId: number, nuevoEstado: string) => {
    try {
      await apiClient.put(`/api/cocina/items/${itemId}/status`, { estado: nuevoEstado });
      toast.success(`✅ Item actualizado a ${nuevoEstado}`);
      onItemStatusChange?.(itemId, nuevoEstado);
      // Recargar datos después de la actualización
      loadData();
    } catch (err: any) {
      toast.error(`❌ Error actualizando item: ${err.message}`);
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

  // --- Agrupar mesas por prioridad si está habilitado ---
  const mesasAgrupadas = groupByPriority 
    ? mesas.reduce((acc, mesa) => {
        if (!acc[mesa.prioridad_maxima]) {
          acc[mesa.prioridad_maxima] = [];
        }
        acc[mesa.prioridad_maxima].push(mesa);
        return acc;
      }, {} as Record<string, MesaCocina[]>)
    : { todas: mesas };

  // --- Renderizado de carga ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando datos de cocina...</p>
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
        <h2 className="text-xl font-bold text-gray-800">
          Cocina - Estación {estacion}
        </h2>
        <div className="text-sm text-gray-500">
          Última actualización: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Layout de mesas agrupadas por prioridad */}
      <div className="space-y-6">
        {Object.entries(mesasAgrupadas).map(([prioridad, mesasGrupo]) => (
          <div key={prioridad} className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
              {prioridad === 'todas' ? 'Todas las Mesas' : `Prioridad ${prioridad}`}
              <span className="ml-2 text-sm text-gray-500">({mesasGrupo.length} mesas)</span>
            </h3>
            
            {/* Mesas del grupo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mesasGrupo.map((mesa) => (
                <MesaCocinaCard
                  key={mesa.id}
                  mesa={mesa}
                  onClick={onMesaClick}
                  onItemStatusChange={handleItemStatusChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de estados */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">Resumen de Estados</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {['en_cola', 'preparando', 'listo', 'servido'].map((estado) => {
            const count = mesas.reduce((total, mesa) => 
              total + mesa.items.filter(item => item.estado === estado).length, 0
            );
            
            return (
              <div key={estado} className="flex items-center gap-2 p-2 rounded bg-gray-100">
                <span className="capitalize">{estado}: {count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CocinaMesaMap;
