import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { ErrorHandler } from '../utils/errorHandler';
import { usePedido } from '../contexts/PedidoContext';
import {
    TableCellsIcon,
    ShoppingCartIcon,
    ClockIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    XCircleIcon,
    ArrowRightIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

// --- Interfaces ---
interface Mesa {
  id: number;
  numero: number;
  estado: 'libre' | 'ocupada' | 'reservada' | 'mantenimiento';
  capacidad: number;
  zona_id: number;
  zona?: { id: number; nombre: string; };
}

interface Estadisticas {
  totalMesas: number;
  mesasDisponibles: number;
  mesasOcupadas: number;
  ordenesActivas: number;
  ingresosHoy: number;
}

const MeseroDashboardPage: React.FC = () => {
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [estadisticas, setEstadisticas] = useState<Estadisticas>({
        totalMesas: 0,
        mesasDisponibles: 0,
        mesasOcupadas: 0,
        ordenesActivas: 0,
        ingresosHoy: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { pedidoActual } = usePedido();
    const navigate = useNavigate();

  // Cargar datos
  useEffect(() => {
    console.log('MeseroDashboardPage: Iniciando carga de datos...');
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Cargar mesas y zonas
        const [mesasResponse, zonasResponse] = await Promise.all([
          apiClient.get('/api/local/mesas/public'),
          apiClient.get('/api/local/zonas/public')
        ]);

        console.log('MeseroDashboardPage: Respuestas recibidas:', { mesasResponse, zonasResponse });

        const mesasData = ErrorHandler.processApiResponse(mesasResponse);
        const zonasData = ErrorHandler.processApiResponse(zonasResponse);

        console.log('MeseroDashboardPage: Datos procesados:', { mesasData, zonasData });

        let mesasArray: Mesa[] = [];

        if (ErrorHandler.isSuccessResponse(mesasData)) {
          mesasArray = Array.isArray(mesasData.data) ? mesasData.data :
                      Array.isArray(mesasData.mesas) ? mesasData.mesas :
                      Array.isArray(mesasData) ? mesasData : [];
          setMesas(mesasArray);
        }

        if (ErrorHandler.isSuccessResponse(zonasData)) {
          const zonasArray = Array.isArray(zonasData.data) ? zonasData.data :
                           Array.isArray(zonasData.zonas) ? zonasData.zonas :
                           Array.isArray(zonasData) ? zonasData : [];

          // Enriquecer mesas con información de zona
          setMesas(prevMesas =>
            prevMesas.map(mesa => ({
              ...mesa,
              zona: zonasArray.find((z: any) => z.id === mesa.zona_id)
            }))
          );
        }

        // Calcular estadísticas básicas solo si tenemos mesas
        if (mesasArray.length > 0) {
          const totalMesas = mesasArray.length;
          const mesasDisponibles = mesasArray.filter((m: Mesa) => m.estado === 'libre').length;
          const mesasOcupadas = mesasArray.filter((m: Mesa) => m.estado === 'ocupada').length;

          setEstadisticas({
            totalMesas,
            mesasDisponibles,
            mesasOcupadas,
            ordenesActivas: mesasOcupadas, // Simplificación
            ingresosHoy: 0 // Placeholder
          });
        }

      } catch (error: any) {
        console.error('MeseroDashboardPage: Error al cargar datos:', error);
        ErrorHandler.logError('cargar datos del dashboard', error);
        setError(error?.message || 'Error al cargar datos del dashboard');
        toast.error(error?.message || 'Error al cargar datos del dashboard');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMesaClick = (mesa: Mesa) => {
    if (mesa.estado === 'libre') {
      toast.success(`Mesa ${mesa.numero} seleccionada para tomar pedido`);
      navigate('/mesero/productos');
    } else {
      toast(`Mesa ${mesa.numero} está ${mesa.estado}`);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/local/mesas/public');
      const mesasData = ErrorHandler.processApiResponse(response);

      if (ErrorHandler.isSuccessResponse(mesasData)) {
        const mesasArray = Array.isArray(mesasData.data) ? mesasData.data :
                         Array.isArray(mesasData.mesas) ? mesasData.mesas :
                         Array.isArray(mesasData) ? mesasData : [];
        setMesas(mesasArray);
      }

      toast.success('✅ Datos actualizados');
    } catch (error: any) {
      ErrorHandler.logError('actualizar datos', error);
      toast.error(error?.message || 'Error al actualizar datos');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando panel del mesero...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Error al cargar el panel
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Panel del Mesero
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gestiona las mesas y toma pedidos de manera eficiente
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TableCellsIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Mesas</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{estadisticas.totalMesas}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TableCellsIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Disponibles</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{estadisticas.mesasDisponibles}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Ocupadas</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{estadisticas.mesasOcupadas}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Ingresos Hoy</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">S/ {estadisticas.ingresosHoy}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pedido Actual */}
      {pedidoActual && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <ShoppingCartIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Pedido en Progreso
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Mesa {pedidoActual.mesa_id} - {pedidoActual.productos.length} productos
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                S/ {pedidoActual.total.toFixed(2)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/mesero/productos')}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Agregar Productos
            </button>
            <button
              onClick={() => navigate('/mesero/pedido')}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Ver Pedido Completo
            </button>
          </div>
        </motion.div>
      )}

      {/* Acciones rápidas */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/mesero/mesas')}
            className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <TableCellsIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <p className="font-semibold text-blue-900 dark:text-blue-100">Vista de Mesas</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Gestionar mesas disponibles</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/mesero/productos')}
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <ShoppingCartIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div className="text-left">
              <p className="font-semibold text-green-900 dark:text-green-100">
                {pedidoActual ? 'Continuar Pedido' : 'Tomar Pedido'}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {pedidoActual ? 'Agregar más productos' : 'Crear nuevo pedido'}
              </p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/mesero/categorias')}
            className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <UserGroupIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div className="text-left">
              <p className="font-semibold text-purple-900 dark:text-purple-100">Ver Categorías</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Explorar productos</p>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Vista de mesas resumida */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Estado de Mesas
          </h2>
          <button
            onClick={() => navigate('/mesero/mesas')}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
          >
            Ver todas →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mesas.slice(0, 12).map((mesa, index) => (
            <motion.div
              key={mesa.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMesaClick(mesa)}
              className={`relative cursor-pointer rounded-xl p-4 transition-all duration-300 ${
                mesa.estado === 'libre'
                  ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500'
                  : mesa.estado === 'ocupada'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700'
                  : mesa.estado === 'reservada'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700'
                  : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {mesa.numero}
                </div>
                <div className="text-sm font-medium">
                  <span className={
                    mesa.estado === 'libre' ? 'text-green-800 dark:text-green-300' :
                    mesa.estado === 'ocupada' ? 'text-blue-800 dark:text-blue-300' :
                    mesa.estado === 'reservada' ? 'text-yellow-800 dark:text-yellow-300' :
                    'text-red-800 dark:text-red-300'
                  }>
                    {mesa.estado === 'libre' ? '✅ Libre' :
                     mesa.estado === 'ocupada' ? '👥 Ocupada' :
                     mesa.estado === 'reservada' ? '📅 Reservada' :
                     '🔧 Mantenimiento'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cap: {mesa.capacidad}
                </div>
                {mesa.zona && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {mesa.zona.nombre}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {mesas.length === 0 && (
          <div className="text-center py-12">
            <TableCellsIcon className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No hay mesas configuradas
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Contacta al administrador para configurar las mesas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeseroDashboardPage;

