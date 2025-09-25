import React from 'react';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  TableCellsIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Piso {
  id: number;
  nombre: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

interface Zona {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: string;
  capacidad_maxima: number;
  piso_id: number;
  orden: number;
  activo: boolean;
  color: string;
  icono: string;
  piso_nombre: string;
  creado_en: string;
  actualizado_en: string;
}

interface Mesa {
  id: number;
  numero: string;
  capacidad: number;
  zona_id: number;
  estado: string;
  activo: boolean;
  qr_code?: string;
  zona_nombre: string;
  piso_nombre: string;
  creado_en: string;
  actualizado_en: string;
}

interface LocalDataTableProps {
  activeTab: string;
  data: (Piso | Zona | Mesa)[];
  onView: (item: any) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  getEstadoColor: (estado: string, variant?: 'pills' | 'table') => string;
}

const LocalDataTable: React.FC<LocalDataTableProps> = ({
  activeTab,
  data,
  onView,
  onEdit,
  onDelete,
  getEstadoColor
}) => {
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'disponible': return '✅';
      case 'ocupada': return '🔴';
      case 'limpieza': return '🧹';
      case 'reservada': return '📅';
      case 'fuera_servicio': return '🚫';
      case 'activo': return '✅';
      case 'programado': return '⏰';
      case 'completado': return '🎉';
      case 'cancelado': return '❌';
      default: return '❓';
    }
  };

  const renderTableHeaders = () => {
    if (activeTab === 'pisos') {
      return (
        <>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Nombre
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Descripción
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Estado
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Orden
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Acciones
          </th>
        </>
      );
    } else if (activeTab === 'zonas') {
      return (
        <>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Nombre
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Tipo
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Piso
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Capacidad
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Estado
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Acciones
          </th>
        </>
      );
    } else { // mesas
      return (
        <>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Número
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Zona
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Piso
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Capacidad
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Estado
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            Acciones
          </th>
        </>
      );
    }
  };

  const renderTableRow = (item: any, index: number) => {
    if (activeTab === 'pisos') {
      const piso = item as Piso;
      return (
        <tr key={piso.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <BuildingOffice2Icon className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {piso.nombre}
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {piso.descripcion || 'Sin descripción'}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(piso.activo ? 'activo' : 'inactivo')}`}>
              <span>{getEstadoIcon(piso.activo ? 'activo' : 'inactivo')}</span>
              {piso.activo ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
            {piso.orden}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onView(piso)}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-900/30 transition-all duration-200"
                title="Ver detalles"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(piso)}
                className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 transition-all duration-200"
                title="Editar"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(piso)}
                className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:text-red-900 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 transition-all duration-200"
                title="Eliminar"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    } else if (activeTab === 'zonas') {
      const zona = item as Zona;
      return (
        <tr key={zona.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {zona.nombre}
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(zona.tipo)}`}>
              <span>{getEstadoIcon(zona.tipo)}</span>
              {zona.tipo.charAt(0).toUpperCase() + zona.tipo.slice(1)}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <BuildingOffice2Icon className="h-4 w-4 mr-1" />
              {zona.piso_nombre}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
            {zona.capacidad_maxima}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(zona.activo ? 'activo' : 'inactivo')}`}>
              <span>{getEstadoIcon(zona.activo ? 'activo' : 'inactivo')}</span>
              {zona.activo ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onView(zona)}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-900/30 transition-all duration-200"
                title="Ver detalles"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(zona)}
                className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 transition-all duration-200"
                title="Editar"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(zona)}
                className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:text-red-900 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 transition-all duration-200"
                title="Eliminar"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    } else { // mesas
      const mesa = item as Mesa;
      return (
        <tr key={mesa.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <TableCellsIcon className="h-5 w-5 text-purple-500 mr-2" />
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Mesa {mesa.numero}
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <MapPinIcon className="h-4 w-4 mr-1" />
              {mesa.zona_nombre}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <BuildingOffice2Icon className="h-4 w-4 mr-1" />
              {mesa.piso_nombre}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
            {mesa.capacidad}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(mesa.estado)}`}>
              <span>{getEstadoIcon(mesa.estado)}</span>
              {mesa.estado.charAt(0).toUpperCase() + mesa.estado.slice(1).replace('_', ' ')}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onView(mesa)}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-900/30 transition-all duration-200"
                title="Ver detalles"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(mesa)}
                className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 transition-all duration-200"
                title="Editar"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(mesa)}
                className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:text-red-900 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 transition-all duration-200"
                title="Eliminar"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {renderTableHeaders()}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => renderTableRow(item, index))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LocalDataTable;
