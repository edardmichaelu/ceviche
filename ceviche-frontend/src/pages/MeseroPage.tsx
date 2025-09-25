import React, { useState, useEffect } from 'react';
import { apiClient } from '../apiClient';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TableCellsIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ChartBarIcon,
  BellIcon,
  CogIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import MeseroSidebar from '../components/MeseroSidebar';
import MesaCard from '../components/MesaCard';
import MeseroStats from '../components/MeseroStats';

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

interface Zona { id: number; nombre: string; mesas: Mesa[]; }
interface Piso { id: number; nombre: string; zonas: Zona[]; }

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

export function MeseroPage() {
  const [layout, setLayout] = useState<Piso[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalMesas: 0,
    mesasDisponibles: 0,
    mesasOcupadas: 0,
    mesasReservadas: 0,
    mesasLimpieza: 0,
    mesasMantenimiento: 0,
    mesasCerradas: 0,
    ordenesActivas: 0,
    tiempoPromedioEspera: 0,
    ingresosHoy: 0,
    clientesAtendidos: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [activeTab, setActiveTab] = useState('mapa');
  const [useRealtimeData, setUseRealtimeData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar layout
        const endpoint = useRealtimeData ? '/api/mesero/public/layout/realtime' : '/api/mesero/public/layout';
        const layoutResponse = await apiClient.getPublic(endpoint);
        const layoutData = layoutResponse.data || layoutResponse;
        setLayout(layoutData);

        // Cargar estadísticas
        const statsResponse = await apiClient.get('/api/mesero/estadisticas/estados');
        const statsData = statsResponse.data || statsResponse;
        
        // Calcular estadísticas
        const totalMesas = layoutData.reduce((total: number, piso: Piso) => 
          total + piso.zonas.reduce((zonaTotal: number, zona: Zona) => 
            zonaTotal + zona.mesas.length, 0
          ), 0
        );

        const estados = {
          disponible: 0,
          ocupada: 0,
          reservada: 0,
          limpieza: 0,
          mantenimiento: 0,
          cerrada: 0
        };

        layoutData.forEach((piso: Piso) => {
          piso.zonas.forEach((zona: Zona) => {
            zona.mesas.forEach((mesa: Mesa) => {
              estados[mesa.estado as keyof typeof estados]++;
            });
          });
        });

        setEstadisticas({
          totalMesas,
          mesasDisponibles: estados.disponible,
          mesasOcupadas: estados.ocupada,
          mesasReservadas: estados.reservada,
          mesasLimpieza: estados.limpieza,
          mesasMantenimiento: estados.mantenimiento,
          mesasCerradas: estados.cerrada,
          ordenesActivas: layoutData.reduce((total: number, piso: Piso) => 
            total + piso.zonas.reduce((zonaTotal: number, zona: Zona) => 
              zonaTotal + zona.mesas.filter((mesa: Mesa) => mesa.orden_activa).length, 0
            ), 0
          ),
          tiempoPromedioEspera: 15, // Placeholder
          ingresosHoy: 0, // Placeholder
          clientesAtendidos: 0 // Placeholder
        });

      } catch (error: any) {
        toast.error(`❌ ${error.message || 'No se pudo cargar los datos.'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [useRealtimeData]);

  // Filtrar mesas
  const filteredLayout = layout.map(piso => ({
    ...piso,
    zonas: piso.zonas.map(zona => ({
      ...zona,
      mesas: zona.mesas.filter(mesa => {
        const matchesSearch = mesa.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             mesa.zona_nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterEstado === 'todos' || mesa.estado === filterEstado;
        return matchesSearch && matchesFilter;
      })
    })).filter(zona => zona.mesas.length > 0)
  })).filter(piso => piso.zonas.length > 0);

  const handleMesaClick = (mesa: Mesa) => {
    setSelectedMesa(mesa);
  };

  const handleMesaStatusChange = async (mesaId: number, nuevoEstado: string) => {
    try {
      await apiClient.put(`/api/mesero/mesas/${mesaId}/estado`, { estado: nuevoEstado });
      toast.success(`✅ Mesa ${mesaId} actualizada a ${nuevoEstado}`);
      
      // Recargar datos
      const endpoint = useRealtimeData ? '/mesero/public/layout/realtime' : '/mesero/public/layout';
      const response = await apiClient.getPublic(endpoint);
      setLayout(response.data || response);
    } catch (error: any) {
      toast.error(`❌ Error actualizando mesa: ${error.message}`);
    }
  };

  const handleRefresh = async () => {
    const endpoint = useRealtimeData ? '/api/mesero/public/layout/realtime' : '/api/mesero/public/layout';
    try {
      const response = await apiClient.getPublic(endpoint);
      setLayout(response.data || response);
      toast.success('✅ Datos actualizados');
    } catch (error: any) {
      toast.error(`❌ Error: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Cargando panel de mesero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      {/* Sidebar */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <MeseroSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              estadisticas={{
                totalMesas: estadisticas.totalMesas,
                mesasOcupadas: estadisticas.mesasOcupadas,
                mesasDisponibles: estadisticas.mesasDisponibles,
                mesasLimpieza: estadisticas.mesasLimpieza
              }}
              notificaciones={0}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                {sidebarCollapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
              </button>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Panel de Mesero
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar mesa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtro de estado */}
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="disponible">Disponibles</option>
                <option value="ocupada">Ocupadas</option>
                <option value="reservada">Reservadas</option>
                <option value="limpieza">Limpieza</option>
              </select>

              {/* Toggle de vista */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'compact' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Compacto
                </button>
              </div>

              {/* Toggle de tiempo real */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useRealtimeData}
                  onChange={(e) => setUseRealtimeData(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Tiempo real</span>
              </label>

              {/* Botón de actualizar */}
              <button
                onClick={handleRefresh}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'mapa' && (
            <div className="space-y-6">
              {/* Estadísticas */}
              <MeseroStats
                estadisticas={estadisticas}
                onRefresh={handleRefresh}
                isLoading={isLoading}
              />

              {/* Layout de mesas */}
              {filteredLayout.length === 0 ? (
                <div className="text-center py-12">
                  <TableCellsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No hay mesas que coincidan</h3>
                  <p className="text-gray-400">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {filteredLayout.map((piso) => (
                    <motion.div
                      key={piso.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
                    >
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                        {piso.nombre}
                      </h2>
                      
                      <div className="space-y-6">
                        {piso.zonas.map((zona) => (
                          <div key={zona.id} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
                              {zona.nombre} ({zona.mesas.length} mesas)
                            </h3>
                            
                            <div className={`grid gap-4 ${
                              viewMode === 'compact' 
                                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                            }`}>
                              {zona.mesas.map((mesa) => (
                                <MesaCard
                                  key={mesa.id}
                                  mesa={mesa}
                                  onMesaClick={handleMesaClick}
                                  onStatusChange={handleMesaStatusChange}
                                  onViewDetails={setSelectedMesa}
                                  compactMode={viewMode === 'compact'}
                                  showActions={true}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ordenes' && (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">Órdenes Activas</h3>
              <p className="text-gray-400">Próximamente</p>
            </div>
          )}

          {activeTab === 'reservas' && (
            <div className="text-center py-12">
              <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">Reservas del Día</h3>
              <p className="text-gray-400">Próximamente</p>
            </div>
          )}

          {activeTab === 'estadisticas' && (
            <div className="text-center py-12">
              <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">Estadísticas Detalladas</h3>
              <p className="text-gray-400">Próximamente</p>
            </div>
          )}

          {activeTab === 'notificaciones' && (
            <div className="text-center py-12">
              <BellIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">Notificaciones</h3>
              <p className="text-gray-400">Próximamente</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles de mesa */}
      <AnimatePresence>
        {selectedMesa && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedMesa(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
                Detalles de Mesa {selectedMesa.numero}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Estado:</span>
                  <span className="capitalize">{selectedMesa.estado}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Capacidad:</span>
                  <span>{selectedMesa.capacidad} personas</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Zona:</span>
                  <span>{selectedMesa.zona_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Piso:</span>
                  <span>{selectedMesa.piso_nombre}</span>
                </div>
                {selectedMesa.orden_activa && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Orden Activa</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Cliente:</span>
                        <span>{selectedMesa.orden_activa.cliente_nombre || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ítems:</span>
                        <span>{selectedMesa.orden_activa.total_items}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tiempo espera:</span>
                        <span className="text-orange-600">{selectedMesa.orden_activa.tiempo_espera} min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setSelectedMesa(null)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    toast.info('Funcionalidad de edición próximamente');
                  }}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Editar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}