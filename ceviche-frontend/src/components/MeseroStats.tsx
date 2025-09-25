import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TableCellsIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/solid';

interface Estadisticas {
  totalMesas: number;
  mesasDisponibles: number;
  mesasOcupadas: number;
  mesasReservadas: number;
  mesasLimpieza: number;
  mesasMantenimiento: number;
  mesasCerradas: number;
  ordenesActivas: number;
  tiempoPromedioEspera: number;
  ingresosHoy: number;
  clientesAtendidos: number;
}

interface MeseroStatsProps {
  estadisticas: Estadisticas;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const MeseroStats: React.FC<MeseroStatsProps> = ({
  estadisticas,
  onRefresh,
  isLoading = false
}) => {
  const statsCards = [
    {
      title: 'Mesas Disponibles',
      value: estadisticas.mesasDisponibles,
      total: estadisticas.totalMesas,
      icon: CheckCircleIcon,
      color: 'green',
      percentage: estadisticas.totalMesas > 0 ? (estadisticas.mesasDisponibles / estadisticas.totalMesas) * 100 : 0
    },
    {
      title: 'Mesas Ocupadas',
      value: estadisticas.mesasOcupadas,
      total: estadisticas.totalMesas,
      icon: UserGroupIcon,
      color: 'blue',
      percentage: estadisticas.totalMesas > 0 ? (estadisticas.mesasOcupadas / estadisticas.totalMesas) * 100 : 0
    },
    {
      title: 'Reservas',
      value: estadisticas.mesasReservadas,
      total: estadisticas.totalMesas,
      icon: ClockIcon,
      color: 'purple',
      percentage: estadisticas.totalMesas > 0 ? (estadisticas.mesasReservadas / estadisticas.totalMesas) * 100 : 0
    },
    {
      title: 'En Limpieza',
      value: estadisticas.mesasLimpieza,
      total: estadisticas.totalMesas,
      icon: ExclamationTriangleIcon,
      color: 'yellow',
      percentage: estadisticas.totalMesas > 0 ? (estadisticas.mesasLimpieza / estadisticas.totalMesas) * 100 : 0
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: {
        bg: 'bg-green-50',
        text: 'text-green-800',
        icon: 'text-green-600',
        bar: 'bg-green-500'
      },
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        icon: 'text-blue-600',
        bar: 'bg-blue-500'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        icon: 'text-purple-600',
        bar: 'bg-purple-500'
      },
      yellow: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        icon: 'text-yellow-600',
        bar: 'bg-yellow-500'
      }
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <ChartBarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Estadísticas del Día</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Resumen de operaciones</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <ArrowTrendingUpIcon className="h-4 w-4" />
            )}
            Actualizar
          </button>
        )}
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color);
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${colors.bg} rounded-lg p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-6 w-6 ${colors.icon}`} />
                <span className="text-xs text-gray-500">
                  {stat.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${colors.text}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colors.bar} transition-all duration-500`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TableCellsIcon className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {estadisticas.ordenesActivas}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Órdenes Activas</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {estadisticas.tiempoPromedioEspera} min
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Promedio</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                ${estadisticas.ingresosHoy.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos Hoy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de estado */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-blue-800 dark:text-blue-300">Resumen del Estado</h4>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          {estadisticas.mesasOcupadas > 0 
            ? `${estadisticas.mesasOcupadas} mesa(s) ocupada(s) con ${estadisticas.ordenesActivas} orden(es) activa(s)`
            : 'No hay mesas ocupadas en este momento'
          }
        </p>
        {estadisticas.mesasLimpieza > 0 && (
          <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
            {estadisticas.mesasLimpieza} mesa(s) esperando limpieza
          </p>
        )}
      </div>
    </div>
  );
};

export default MeseroStats;
