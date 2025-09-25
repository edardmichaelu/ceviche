import React from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface LocalFiltersProps {
  activeTab: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterByStatus: string;
  onStatusChange: (status: string) => void;
  filterByPiso: string | number;
  onPisoChange: (piso: string | number) => void;
  onClearFilters: () => void;
  pisos: any[];
}

const LocalFilters: React.FC<LocalFiltersProps> = ({
  activeTab,
  searchTerm,
  onSearchChange,
  filterByStatus,
  onStatusChange,
  filterByPiso,
  onPisoChange,
  onClearFilters,
  pisos
}) => {
  const getStatusOptions = () => {
    if (activeTab === 'mesas') {
      return [
        { value: 'all', label: 'Todos los estados' },
        { value: 'disponible', label: 'Disponible' },
        { value: 'ocupada', label: 'Ocupada' },
        { value: 'limpieza', label: 'Limpieza' },
        { value: 'reservada', label: 'Reservada' },
        { value: 'fuera_servicio', label: 'Fuera de servicio' }
      ];
    } else if (activeTab === 'zonas') {
      return [
        { value: 'all', label: 'Todos los tipos' },
        { value: 'salon', label: 'Salón' },
        { value: 'barra', label: 'Barra' },
        { value: 'terraza', label: 'Terraza' },
        { value: 'privada', label: 'Privada' },
        { value: 'vip', label: 'VIP' },
        { value: 'interior', label: 'Interior' },
        { value: 'rapida', label: 'Rápida' },
        { value: 'business', label: 'Business' },
        { value: 'infantil', label: 'Infantil' },
        { value: 'recepcion', label: 'Recepción' }
      ];
    }
    return [];
  };

  const hasActiveFilters = searchTerm || filterByStatus !== 'all' || filterByPiso !== 'all';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Barra de búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtro por estado (solo para mesas y zonas) */}
        {(activeTab === 'mesas' || activeTab === 'zonas') && (
          <div className="w-full lg:w-48">
            <select
              value={activeTab === 'mesas' ? filterByStatus : filterByPiso}
              onChange={(e) => activeTab === 'mesas' ? onStatusChange(e.target.value) : onPisoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getStatusOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtro por piso (para zonas y mesas) */}
        {(activeTab === 'zonas' || activeTab === 'mesas') && (
          <div className="w-full lg:w-48">
            <select
              value={filterByPiso}
              onChange={(e) => onPisoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los pisos</option>
              {pisos.map((piso) => (
                <option key={piso.id} value={piso.id}>
                  {piso.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Botón de limpiar filtros */}
        {hasActiveFilters && (
          <motion.button
            onClick={onClearFilters}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
            <span className="font-medium">Limpiar filtros</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default LocalFilters;
