import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapIcon,
  BuildingOffice2Icon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

interface LocalCategoriesProps {
  activeTab: string;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  pisos: any[];
  zonas: any[];
  mesas: any[];
  searchTerm: string;
  filterByStatus: string;
  filterByPiso: string | number;
}

const LocalCategories: React.FC<LocalCategoriesProps> = ({
  activeTab,
  activeCategory,
  onCategoryChange,
  pisos,
  zonas,
  mesas,
  searchTerm,
  filterByStatus,
  filterByPiso
}) => {
  // Función para calcular contadores sin filtros de categoría
  const getCategoryCount = (category: string): number => {
    let data = activeTab === 'pisos' ? pisos : activeTab === 'zonas' ? zonas : mesas;

    // Aplicar filtros excepto el de categoría
    if (searchTerm) {
      data = data.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        if (activeTab === 'pisos') {
          const piso = item as any;
          return piso.nombre.toLowerCase().includes(searchLower) ||
                 (piso.descripcion?.toLowerCase().includes(searchLower) ?? false);
        } else if (activeTab === 'zonas') {
          const zona = item as any;
          return zona.nombre.toLowerCase().includes(searchLower) ||
                 zona.tipo.toLowerCase().includes(searchLower) ||
                 zona.piso_nombre.toLowerCase().includes(searchLower);
        } else {
          const mesa = item as any;
          return mesa.numero.toLowerCase().includes(searchLower) ||
                 mesa.zona_nombre.toLowerCase().includes(searchLower);
        }
      });
    }

    // Filtro por piso (para zonas y mesas)
    if (filterByPiso !== 'all' && (activeTab === 'zonas' || activeTab === 'mesas')) {
      const pisoId = filterByPiso as number;
      data = data.filter(item => {
        if (activeTab === 'zonas') {
          return (item as any).piso_id === pisoId;
        } else {
          return (item as any).zona_id === pisoId;
        }
      });
    }

    // Filtro por estado (solo para mesas)
    if (filterByStatus !== 'all' && activeTab === 'mesas') {
      data = data.filter(item => (item as any).estado === filterByStatus);
    }

    // Si es "all", devolver el total de elementos
    if (category === 'all') {
      return data.length;
    }

    // Contar elementos de la categoría específica
    if (activeTab === 'mesas') {
      return data.filter(item => (item as any).estado === category).length;
    } else if (activeTab === 'zonas') {
      return data.filter(item => (item as any).tipo === category).length;
    }

    return data.length; // Para pisos, todas las categorías tienen el mismo conteo (total de pisos)
  };

  const getUniqueZonaTypes = () => {
    const types = zonas.map(zona => zona.tipo);
    return [...new Set(types)].sort();
  };

  const getCategories = () => {
    if (activeTab === 'pisos') {
      return [{ id: 'all', name: 'Todas', icon: CheckCircleIcon, color: 'bg-blue-500' }];
    } else if (activeTab === 'zonas') {
      const types = getUniqueZonaTypes();
      return [
        { id: 'all', name: 'Todas', icon: CheckCircleIcon, color: 'bg-green-500' },
        ...types.map(type => ({
          id: type,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          icon: MapIcon,
          color: 'bg-green-500'
        }))
      ];
    } else { // mesas
      return [
        { id: 'all', name: 'Todas', icon: CheckCircleIcon, color: 'bg-purple-500' },
        { id: 'disponible', name: 'Disponible', icon: CheckCircleIcon, color: 'bg-green-500' },
        { id: 'ocupada', name: 'Ocupada', icon: XCircleIcon, color: 'bg-red-500' },
        { id: 'limpieza', name: 'Limpieza', icon: ClockIcon, color: 'bg-yellow-500' },
        { id: 'reservada', name: 'Reservada', icon: TableCellsIcon, color: 'bg-blue-500' },
        { id: 'fuera_servicio', name: 'Fuera de servicio', icon: XCircleIcon, color: 'bg-gray-500' }
      ];
    }
  };

  const categories = getCategories();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          const count = getCategoryCount(category.id);

          return (
            <motion.button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? `${category.color} text-white shadow-lg`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{category.name}</span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-semibold
                ${isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }
              `}>
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default LocalCategories;
