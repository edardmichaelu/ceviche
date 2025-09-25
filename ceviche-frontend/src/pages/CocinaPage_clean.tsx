import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { ErrorHandler } from '../utils/errorHandler';
import { KanbanBoard, CocinaStats, CocinaFilters } from '../components/cocina';
import { Orden, ItemOrden } from '../types/cocina.types';
import { formatDateTimeGlobal, getEstadoColorGlobal, getEstadoIconGlobal, getEstadoDisplayNameGlobal } from '../utils/auxiliaryFunctions';

// === CONFIGURACIÓN GLOBAL ===
const COCINA_CONFIG = {
    refreshInterval: 30000, // 30 segundos
    maxItemsPerColumn: 50,
    showWaitTime: true,
    groupByPriority: false,
    compactMode: false,
    autoRefresh: true
};

// === FUNCIÓN GLOBAL PARA FORZAR RECARGA ===
declare global {
    interface Window {
        refreshCocina: () => void;
        toggleHeaderFunc: () => void;
    }
}

// Función global para forzar recarga de cocina desde cualquier lugar
(window as any).refreshCocina = () => {
    console.log('🔄 Forzando recarga de cocina desde ventana global');
};

// === COMPONENTE PRINCIPAL DE COCINA ===
const CocinaPage: React.FC = () => {
    // === ESTADOS PRINCIPALES ===
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forceRefresh, setForceRefresh] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterEstacion, setFilterEstacion] = useState('');

    // === FUNCIÓN PARA CARGAR ÓRDENES ===
    const loadOrdenes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🍳 === CARGANDO ÓRDENES ===');
            const response = await apiClient.get('/api/orden/pendientes');

            console.log('🍳 Estado de respuesta:', response?.status);
            console.log('🍳 Headers de respuesta:', response?.headers);

            if (response && (response as any).success && (response as any).data) {
                const ordenesData = (response as any).data;
                console.log('🍳 Datos recibidos:', ordenesData.length);

                // Verificar estructura de datos
                if (Array.isArray(ordenesData)) {
                    console.log('🍳 ✅ Datos son array, procesando...');
                    setOrdenes(ordenesData);
                } else {
                    console.error('🍳 ❌ Datos no son array:', typeof ordenesData);
                    setError('Formato de datos inválido');
                }
            } else {
                console.error('🍳 ❌ Respuesta no exitosa:', response);
                setError('Error al cargar órdenes');
            }
        } catch (error: any) {
            console.error('🍳 ❌ Error al cargar órdenes:', error);
            ErrorHandler.logError('cargar órdenes cocina', error);
            const errorMessage = ErrorHandler.showErrorNotification(error, 'cargar órdenes cocina');
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // === FUNCIÓN PARA AVANZAR ITEM ===
    const handleAvanzarItem = useCallback(async (itemId: number) => {
        try {
            console.log('🍳 Avanzando item:', itemId);

            const response = await apiClient.patch(`/api/orden/items/${itemId}/avanzar`, {});

            if (response?.data?.success) {
                toast.success('✅ Item avanzado correctamente');
                setForceRefresh(prev => prev + 1);
            } else {
                throw new Error('Error al avanzar item');
            }
        } catch (error: any) {
            console.error('🍳 Error avanzando item:', error);
            ErrorHandler.logError('avanzar item cocina', error);
            const errorMessage = ErrorHandler.showErrorNotification(error, 'avanzar item cocina');
            toast.error(errorMessage);
        }
    }, []);

    // === FUNCIÓN PARA CANCELAR ITEM ===
    const handleCancelarItem = useCallback(async (itemId: number) => {
        try {
            console.log('🍳 Cancelando item:', itemId);

            const response = await apiClient.patch(`/api/orden/items/${itemId}/cancelar`, {});

            if (response?.data?.success) {
                toast.success('❌ Item cancelado correctamente');
                setForceRefresh(prev => prev + 1);
            } else {
                throw new Error('Error al cancelar item');
            }
        } catch (error: any) {
            console.error('🍳 Error cancelando item:', error);
            ErrorHandler.logError('cancelar item cocina', error);
            const errorMessage = ErrorHandler.showErrorNotification(error, 'cancelar item cocina');
            toast.error(errorMessage);
        }
    }, []);

    // === FUNCIÓN DE LOGOUT ===
    const handleLogout = useCallback(() => {
        console.log('🍳 Logout de cocina');
        toast.success('Sesión cerrada correctamente');
        sessionStorage.clear();
        window.location.href = '/login';
    }, []);

    // === EFECTOS ===
    useEffect(() => {
        // Cargar órdenes iniciales
        loadOrdenes();

        // Configurar auto-refresh
        if (COCINA_CONFIG.autoRefresh) {
            const interval = setInterval(() => {
                console.log('🍳 Auto-refresh ejecutado');
                loadOrdenes();
            }, COCINA_CONFIG.refreshInterval);

            return () => clearInterval(interval);
        }
    }, [loadOrdenes]);

    // === EFECTO PARA ACTUALIZACIONES EN TIEMPO REAL ===
    useEffect(() => {
        // Escuchar eventos de localStorage para actualizaciones en tiempo real
        const handleStorageChange = (e: StorageEvent) => {
            console.log('🍳 Evento storage detectado:', e.key, e.newValue);
            if (e.key === 'new_order' || e.key === 'cocina_refresh') {
                console.log('🍳 🔄 Recargando órdenes por evento storage');
                loadOrdenes();
            }
        };

        // Escuchar eventos personalizados
        const handleNewOrder = (event: CustomEvent) => {
            console.log('🍳 🔄 Nueva orden detectada:', event.detail);
            loadOrdenes();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('newOrder', handleNewOrder as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('newOrder', handleNewOrder as EventListener);
        };
    }, [loadOrdenes]);

    // === RENDER PRINCIPAL ===
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="min-h-screen bg-slate-50 dark:bg-slate-900"
        >
            {/* Header de estadísticas */}
            <div className="bg-gradient-to-br from-white via-orange-50 to-orange-100 dark:from-slate-800 dark:via-orange-900/30 dark:to-orange-800/40 rounded-b-2xl shadow-lg p-6 border-b-2 border-orange-200/50 dark:border-orange-700/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl">
                            <span className="text-3xl">🍳</span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-1">
                                🍳 Panel de Cocina
                            </h1>
                            <p className="text-slate-700 dark:text-slate-300 font-medium">
                                {ordenes.length} órdenes activas • {ordenes.flatMap(o => o.items || []).length} items pendientes
                            </p>
                        </div>
                    </div>

                    {/* Botón de recarga */}
                    <button
                        onClick={() => loadOrdenes()}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-200 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-300 dark:hover:bg-orange-900/40 transition-colors font-medium"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Recargar
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center m-6">
                    <div className="text-red-600 dark:text-red-400 text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Error</h3>
                    <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
                </div>
            )}

            {/* Contenido principal */}
            <div className="p-6">
                {/* Estadísticas */}
                <CocinaStats
                    totalOrdenes={ordenes.length}
                    itemsPendientes={ordenes.flatMap(o => o.items || []).filter(item => item.estado === 'pendiente').length}
                    itemsPreparando={ordenes.flatMap(o => o.items || []).filter(item => item.estado === 'preparando').length}
                    itemsListos={ordenes.flatMap(o => o.items || []).filter(item => item.estado === 'listo').length}
                    tiempoPromedio={ordenes.length > 0 ? ordenes.flatMap(o => o.items || []).length / ordenes.length * 5 : 0}
                />

                {/* Filtros */}
                <CocinaFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterEstado={filterEstado}
                    onFilterEstadoChange={setFilterEstado}
                    filterEstacion={filterEstacion}
                    onFilterEstacionChange={setFilterEstacion}
                />

                {/* Kanban Board */}
                <KanbanBoard
                    ordenes={ordenes}
                    onAvanzarItem={handleAvanzarItem}
                    onCancelarItem={handleCancelarItem}
                    loading={loading}
                />

                {/* Vista de detalle expandida */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Órdenes Detalladas</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {ordenes
                            .filter(orden => {
                                const matchesSearch = searchTerm === '' ||
                                    orden.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (orden.cliente_nombre && orden.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                    (orden.items && orden.items.some(item =>
                                        item.producto?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
                                    ));

                                const matchesEstado = filterEstado === '' || orden.estado === filterEstado;
                                const matchesEstacion = filterEstacion === '' || (orden.items && orden.items.some(item => item.estacion === filterEstacion));

                                return matchesSearch && matchesEstado && matchesEstacion;
                            })
                            .sort((a, b) => new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime())
                            .map((orden) => {
                                const dateTime = formatDateTimeGlobal(orden.creado_en);
                                return (
                                    <motion.div
                                        key={orden.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                                    >
                                        {/* Header de la Orden */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                        Orden #{orden.numero}
                                                    </h3>
                                                    <div className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getEstadoColorGlobal(orden.estado)}`}>
                                                        {orden.estado.toUpperCase()}
                                                    </div>
                                                </div>

                                                {/* Información de Mesa y Mozo */}
                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                    <div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">Mesa</p>
                                                        <p className="font-medium text-slate-900 dark:text-white">{orden.mesa.numero}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">Cliente</p>
                                                        <p className="font-medium text-slate-900 dark:text-white">{orden.cliente_nombre}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">Mozo</p>
                                                        <p className="font-medium text-slate-900 dark:text-white">{orden.mozo.usuario}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                                                        <p className="font-bold text-orange-600 dark:text-orange-400">S/ {orden.monto_total.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items de la orden */}
                                        <div className="space-y-3">
                                            {orden.items?.map((item) => (
                                                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-slate-900 dark:text-white">
                                                            {item.producto?.nombre || `Producto #${item.producto_id}`}
                                                        </h4>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            Estación: {item.estacion} • Cant: {item.cantidad}
                                                        </p>
                                                        {item.notas && (
                                                            <p className="text-xs text-orange-600 dark:text-orange-400">
                                                                Nota: {item.notas}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColorGlobal(item.estado)}`}>
                                                        {getEstadoIconGlobal(item.estado)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                    </div>
                </div>

                {/* Sin órdenes */}
                {ordenes.length === 0 && !loading && !error && (
                    <div className="text-center py-16">
                        <div className="text-slate-400 dark:text-slate-500 text-8xl mb-6">🍽️</div>
                        <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-3">
                            No hay órdenes pendientes
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            Todas las órdenes han sido completadas
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CocinaPage;
