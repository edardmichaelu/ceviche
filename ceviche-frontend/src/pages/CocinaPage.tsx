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
    const [kanbanMode, setKanbanMode] = useState<'items' | 'ordenes'>('ordenes');

    // === FUNCIÓN PARA CARGAR ÓRDENES ===
    const loadOrdenes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🍳 === CARGANDO ÓRDENES ===');
            const response = await apiClient.get('/api/orden/cocina/pendientes');

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
    }, []); // ← loadOrdenes sin dependencias para evitar bucles

    // === FUNCIÓN PARA AVANZAR ITEM ===
    const handleAvanzarItem = useCallback(async (itemId: number) => {
        try {
            console.log('🍳 Avanzando item:', itemId);

            const response = await apiClient.patch(`/api/orden/items/${itemId}/avanzar`);

            if (response?.success) {
                toast.success('✅ Item avanzado correctamente');
                // Forzar recarga inmediata de los datos
                await loadOrdenes();
            } else {
                throw new Error(response?.error || 'Error al avanzar item');
            }
        } catch (error: any) {
            console.error('🍳 Error avanzando item:', error);
            ErrorHandler.logError('avanzar item cocina', error);
            const errorMessage = ErrorHandler.showErrorNotification(error, 'avanzar item cocina');
            toast.error(errorMessage);
        }
    }, [loadOrdenes]);

    // === FUNCIÓN PARA CANCELAR ITEM ===
    const handleCancelarItem = useCallback(async (itemId: number) => {
        try {
            console.log('🍳 Cancelando item:', itemId);

            const response = await apiClient.patch(`/api/orden/items/${itemId}/cancelar`);

            if (response?.success) {
                toast.success('❌ Item cancelado correctamente');
                // Forzar recarga inmediata de los datos
                await loadOrdenes();
            } else {
                throw new Error(response?.error || 'Error al cancelar item');
            }
        } catch (error: any) {
            console.error('🍳 Error cancelando item:', error);
            ErrorHandler.logError('cancelar item cocina', error);
            const errorMessage = ErrorHandler.showErrorNotification(error, 'cancelar item cocina');
            toast.error(errorMessage);
        }
    }, [loadOrdenes]);

    // === FUNCIÓN PARA ACTUALIZAR ESTADO DE ORDEN ===
    const handleActualizarEstadoOrden = useCallback(async (ordenId: number, nuevoEstado: string) => {
        try {
            console.log('🍳 Actualizando estado de orden:', ordenId, 'a', nuevoEstado);

            // Usar fetch directamente para tener más control sobre la respuesta
            const token = sessionStorage.getItem('accessToken');
            const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
            const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
            const port = 5000;
            const baseUrl = `${protocol}//${host}:${port}`;

            const response = await fetch(`${baseUrl}/api/orden/${ordenId}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            console.log('🍳 Status de respuesta:', response.status);
            console.log('🍳 Headers de respuesta:', Object.fromEntries(response.headers.entries()));

            let responseData;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
                console.log('🍳 Datos de respuesta JSON:', responseData);
            } else {
                const textData = await response.text();
                console.log('🍳 Datos de respuesta TEXT:', textData);
                responseData = { error: 'Respuesta no es JSON', details: textData };
            }

            if (response.ok && responseData && responseData.success) {
                console.log('✅ Respuesta exitosa, actualizando kanban');

                // Forzar recarga inmediata de los datos
                await loadOrdenes();

                toast.success(`✅ Orden ${nuevoEstado === 'cancelada' ? 'cancelada' : 'actualizada'} correctamente`);
            } else {
                // Error en la respuesta
                const errorMessage = responseData?.error || responseData?.message || `Error HTTP ${response.status}`;
                console.error('🍳 Error en respuesta:', errorMessage);
                console.error('🍳 Detalles completos:', responseData);
                toast.error(`❌ ${errorMessage}`);
            }
        } catch (error: any) {
            console.error('🍳 Error de red:', error);

            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                toast.error('❌ Error de conexión. Verifica que el servidor esté ejecutándose.');
            } else {
                const errorMessage = ErrorHandler.showErrorNotification(error, 'actualizar estado orden cocina');
                toast.error(`❌ ${errorMessage}`);
            }

            ErrorHandler.logError('actualizar estado orden cocina', error);
        }
    }, []);

    // === FUNCIÓN PARA VER DETALLES DE ORDEN ===
    const handleVerDetallesOrden = useCallback((orden: Orden) => {
        console.log('🍳 Viendo detalles de orden:', orden.id);
        // Por ahora solo mostramos en consola, después podemos implementar un modal
        console.log('📋 Detalles de la orden:', {
            id: orden.id,
            numero: orden.numero,
            estado: orden.estado,
            mesa: orden.mesa?.numero,
            cliente: orden.cliente_nombre,
            mozo: orden.mozo?.usuario,
            total: orden.monto_total,
            productos: orden.items?.length,
            creado: orden.creado_en
        });
    }, []);

    // === FUNCIÓN PARA LIMPIAR ÓRDENES SERVIDAS ===
    const handleLimpiarServidas = useCallback(async () => {
        try {
            console.log('🧹 Limpiando órdenes servidas...');

            // Filtrar órdenes que no están servidas
            const ordenesFiltradas = ordenes.filter(orden => orden.estado !== 'servida');

            // Simular que estas son las órdenes que se mostrarían
            console.log(`🧹 ${ordenes.length - ordenesFiltradas.length} órdenes servidas eliminadas del kanban`);

            // Actualizar el estado local (en un caso real, esto vendría del backend)
            setOrdenes(ordenesFiltradas);

            toast.success('✅ Órdenes servidas eliminadas del kanban');
        } catch (error: any) {
            console.error('🍳 Error limpiando órdenes servidas:', error);
            toast.error('❌ Error al limpiar órdenes servidas');
        }
    }, [ordenes]);

    // === FUNCIÓN PARA LIMPIAR ÓRDENES CANCELADAS ===
    const handleLimpiarCanceladas = useCallback(async () => {
        try {
            console.log('🧹 Limpiando órdenes canceladas...');

            // Filtrar órdenes que no están canceladas
            const ordenesFiltradas = ordenes.filter(orden => orden.estado !== 'cancelada');

            // Simular que estas son las órdenes que se mostrarían
            console.log(`🧹 ${ordenes.length - ordenesFiltradas.length} órdenes canceladas eliminadas del kanban`);

            // Actualizar el estado local (en un caso real, esto vendría del backend)
            setOrdenes(ordenesFiltradas);

            toast.success('✅ Órdenes canceladas eliminadas del kanban');
        } catch (error: any) {
            console.error('🍳 Error limpiando órdenes canceladas:', error);
            toast.error('❌ Error al limpiar órdenes canceladas');
        }
    }, [ordenes]);

    // === FUNCIÓN PARA LIMPIAR ÓRDENES COMPLETADAS ===
    const handleLimpiarCompletadas = useCallback(async () => {
        try {
            console.log('🧹 Limpiando órdenes completadas (servidas y canceladas)...');

            // Filtrar órdenes que no están completadas
            const ordenesFiltradas = ordenes.filter(orden =>
                orden.estado !== 'servida' && orden.estado !== 'cancelada'
            );

            const eliminadas = ordenes.length - ordenesFiltradas.length;
            console.log(`🧹 ${eliminadas} órdenes completadas eliminadas del kanban`);

            // Actualizar el estado local (en un caso real, esto vendría del backend)
            setOrdenes(ordenesFiltradas);

            toast.success(`✅ ${eliminadas} órdenes completadas eliminadas del kanban`);
            } catch (error: any) {
            console.error('🍳 Error limpiando órdenes completadas:', error);
            toast.error('❌ Error al limpiar órdenes completadas');
        }
    }, [ordenes]);

    // === FUNCIÓN PARA ELIMINAR ORDEN INDIVIDUAL ===
    const handleEliminarOrden = useCallback(async (ordenId: number) => {
        try {
            console.log('🗑️ Eliminando orden individual:', ordenId);

            // Filtrar la orden específica del estado local
            const ordenesFiltradas = ordenes.filter(orden => orden.id !== ordenId);

            console.log(`🗑️ Orden ${ordenId} eliminada del kanban`);

            // Actualizar el estado local
            setOrdenes(ordenesFiltradas);

            toast.success('✅ Orden eliminada del kanban');
        } catch (error: any) {
            console.error('🍳 Error eliminando orden:', error);
            toast.error('❌ Error al eliminar orden');
        }
    }, [ordenes]);

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
    }, []); // ← Remover loadOrdenes para evitar bucles

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
    }, [loadOrdenes]); // ← loadOrdenes dependency added

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
                                {ordenes.filter(o => o.estado !== 'servida' && o.estado !== 'cancelada').length} órdenes activas • {ordenes.flatMap(o => o.items || []).length} items pendientes
                            </p>
                </div>
            </div>

                    {/* Controles de kanban */}
                    <div className="flex items-center gap-3">
                        {/* Toggle modo kanban */}
                        <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 rounded-lg p-1">
                        <button
                                onClick={() => setKanbanMode('items')}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    kanbanMode === 'items'
                                        ? 'bg-orange-500 text-white'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                            >
                                🔧 Items
                        </button>
                        <button
                                onClick={() => setKanbanMode('ordenes')}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    kanbanMode === 'ordenes'
                                        ? 'bg-orange-500 text-white'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                            >
                                📋 Órdenes
                            </button>
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

                    {/* Botones de limpieza del kanban */}
                    <div className="flex items-center gap-2">
                        {/* Limpiar servidas */}
                    <button
                            onClick={handleLimpiarServidas}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                            title="Eliminar órdenes servidas del kanban"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Limpiar Servidas
                    </button>

                        {/* Limpiar canceladas */}
                    <button
                            onClick={handleLimpiarCanceladas}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                            title="Eliminar órdenes canceladas del kanban"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpiar Canceladas
                        </button>

                        {/* Limpiar completadas */}
                        <button
                            onClick={handleLimpiarCompletadas}
                            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                            title="Eliminar todas las órdenes completadas (servidas y canceladas)"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Limpiar Completadas
                    </button>
                    </div>
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
                    totalOrdenes={ordenes.filter(o => o.estado !== 'servida' && o.estado !== 'cancelada').length}
                    itemsPendientes={ordenes.flatMap(o => o.items || []).filter(item => item.estado === 'pendiente').length}
                    itemsPreparando={ordenes.flatMap(o => o.items || []).filter(item => item.estado === 'preparando').length}
                    itemsListos={ordenes.flatMap(o => o.items || []).filter(item => item.estado === 'listo').length}
                    tiempoPromedio={ordenes.filter(o => o.estado !== 'servida' && o.estado !== 'cancelada').length > 0 ? ordenes.flatMap(o => o.items || []).length / ordenes.filter(o => o.estado !== 'servida' && o.estado !== 'cancelada').length * 5 : 0}
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
                    mode={kanbanMode}
                    onActualizarEstadoOrden={handleActualizarEstadoOrden}
                    onVerDetallesOrden={handleVerDetallesOrden}
                    onEliminarOrden={handleEliminarOrden}
                />

                {/* Debug info */}
                {kanbanMode === 'items' && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Debug - Items Mode</h4>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                            <p>Total órdenes: {ordenes.length}</p>
                            <p>Total items: {ordenes.flatMap(o => o.items || []).length}</p>
                            <p>Items por estado:</p>
                            <ul className="ml-4">
                                {['pendiente', 'en_cola', 'preparando', 'listo', 'servido', 'cancelado'].map(estado => {
                                    const count = ordenes.flatMap(o => o.items || []).filter(item => item.estado === estado).length;
                                    return <li key={estado}>{estado}: {count}</li>;
                                })}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-6"></div>
                        <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-3">
                            Cargando órdenes...
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Preparando el panel de cocina 🍳
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-16">
                        <div className="text-red-400 dark:text-red-500 text-8xl mb-6">⚠️</div>
                        <h3 className="text-xl font-medium text-red-900 dark:text-red-200 mb-3">
                            Error al cargar órdenes
                        </h3>
                        <p className="text-red-600 dark:text-red-400 mb-6">
                            {error}
                        </p>
                        <button
                            onClick={() => loadOrdenes()}
                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Sin órdenes */}
                {ordenes.length === 0 && !loading && !error && (
                    <div className="text-center py-16">
                        <div className="text-slate-400 dark:text-slate-500 text-8xl mb-6">🍽️</div>
                        <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-3">
                            No hay órdenes pendientes
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Todas las órdenes han sido procesadas. ¡Excelente trabajo! 🎉
                        </p>
                    </div>
            )}
        </div>
        </motion.div>
    );
};

export default CocinaPage;
