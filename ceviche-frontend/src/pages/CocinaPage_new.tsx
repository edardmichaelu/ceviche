import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowPathIcon, MapPinIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { formatDateTimeGlobal, getEstadoColorGlobal, getEstadoIconGlobal, getEstadoDisplayNameGlobal } from '../utils/auxiliaryFunctions';

// Componente de columna Kanban
interface KanbanColumnProps {
    titulo: string;
    icono: string;
    estado: string;
    color: string;
    items: Array<{item: ItemOrden, orden: Orden}>;
    onAvanzar: (item: ItemOrden) => void;
    onCancelar: (item: ItemOrden) => void;
}

function KanbanColumn({ titulo, icono, estado, color, items, onAvanzar, onCancelar }: KanbanColumnProps) {
    return (
        <div className="flex-1 min-w-0">
            {/* Header de la columna */}
            <div className={`p-4 rounded-t-xl ${color} border-b-2`}>
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{icono}</span>
                    <h3 className="font-bold text-slate-900 dark:text-white">{titulo}</h3>
                    <span className="ml-auto bg-white/20 text-white px-2 py-1 rounded-full text-sm font-medium">
                        {items.length}
                    </span>
                </div>
            </div>

            {/* Contenido de la columna */}
            <div className="p-4 space-y-3 max-h-96 overflow-auto bg-white dark:bg-slate-800/50">
                {items.length === 0 ? (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-sm">Sin items</p>
                    </div>
                ) : (
                    items.map(({ item, orden }) => (
                        <KanbanCard
                            key={item.id}
                            item={item}
                            orden={orden}
                            onAvanzar={onAvanzar}
                            onCancelar={onCancelar}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// Componente de tarjeta Kanban
interface KanbanCardProps {
    item: ItemOrden;
    orden: Orden;
    onAvanzar: (item: ItemOrden) => void;
    onCancelar: (item: ItemOrden) => void;
}

function KanbanCard({ item, orden, onAvanzar, onCancelar }: KanbanCardProps) {
    const dateTime = formatDateTimeGlobal(orden.creado_en);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
            {/* Información principal compacta */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate text-sm">
                        {item.producto?.nombre || `Producto #${item.producto_id}`}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Orden #{orden.numero} • Mesa {orden.mesa?.numero || orden.mesa_id}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {dateTime.time}
                    </p>
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ml-2 ${getEstadoColorGlobal(item.estado)}`}>
                    {getEstadoIconGlobal(item.estado)}
                </div>
            </div>

            {/* Cantidad y botones de acción */}
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Cant: {item.cantidad}
                </span>

                <div className="flex gap-1">
                    {item.estado !== 'servido' && item.estado !== 'cancelado' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAvanzar(item);
                            }}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                            title="Avanzar estado"
                        >
                            ➡️
                        </button>
                    )}

                    {item.estado !== 'servido' && item.estado !== 'cancelado' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancelar(item);
                            }}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                            title="Cancelar item"
                        >
                            ❌
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// Interfaces
interface Orden {
    id: number;
    numero: string;
    mesa_id: number;
    mozo_id: number;
    tipo: string;
    estado: string;
    monto_total: number;
    cliente_nombre: string;
    creado_en: string;
    actualizado_en: string;
    mesa: {
        numero: string;
        zona: string;
        piso: string;
    };
    mozo: {
        usuario: string;
    };
    items: ItemOrden[];
}

interface ItemOrden {
    id: number;
    orden_id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    estado: string;
    estacion: string;
    notas: string;
    fecha_inicio: string;
    producto: {
        nombre: string;
        categoria: string;
        tipo_estacion: string;
    };
}

// Componente Sidebar
interface CocinaSidebarProps {
    user: { usuario: string; };
    onLogout: () => void;
    isSidebarOpen: boolean;
    isHeaderVisible: boolean;
}

const COCINA_NAV_ITEMS = [
    {
        to: '/cocina',
        text: 'Órdenes Pendientes',
        icon: (
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
        ),
        color: 'text-orange-600 dark:text-orange-400'
    }
];

// Variable para almacenar la función del header
let toggleHeaderFunc: () => void = () => {};

// Función global para forzar recarga de cocina desde cualquier lugar
(window as any).refreshCocina = () => {
    console.log('🔄 Forzando recarga de cocina desde ventana global');
};

function CocinaSidebar({ user, onLogout, isSidebarOpen, isHeaderVisible }: CocinaSidebarProps) {
    const location = window.location;
    const baseLinkClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors duration-200";
    const hoverClasses = "hover:bg-orange-100 dark:hover:bg-slate-700";
    const activeLinkClasses = "bg-orange-600 text-white shadow-lg";

    return (
        <aside className={`bg-white dark:bg-slate-800 shadow-lg flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="p-3 text-center border-b dark:border-slate-700 h-[65px] flex items-center justify-center overflow-hidden">
                <h1 className={`text-xl font-bold text-orange-500 whitespace-nowrap transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>🍳 Cocina</h1>
                <h1 className={`text-xl font-bold text-orange-500 absolute transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>🍳</h1>
            </div>
            <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                {COCINA_NAV_ITEMS.map(item => {
                    const isActive = location.pathname === item.to;
                    return (
                        <a
                            key={item.to}
                            href={item.to}
                            className={`${baseLinkClasses} ${isActive ? activeLinkClasses : hoverClasses} ${isActive ? '' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                            <div className="flex-shrink-0">{item.icon}</div>
                            <span className={`whitespace-nowrap transition-opacity duration-200 text-sm ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>{item.text}</span>
                        </a>
                    );
                })}

                {/* Botón de control de visibilidad del header */}
                <div className="space-y-1">
                    <button
                        onClick={() => {
                            toggleHeaderFunc();
                        }}
                        className={`${baseLinkClasses} w-full text-left ${isHeaderVisible ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                        title={isHeaderVisible ? 'Ocultar header' : 'Mostrar header'}
                    >
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isHeaderVisible ? "M20 12H4" : "M12 4v16m8-8H4"} />
                            </svg>
                        </div>
                        <span className={`whitespace-nowrap transition-opacity duration-200 text-sm ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>
                            {isHeaderVisible ? 'Ocultar Header' : 'Mostrar Header'}
                        </span>
                    </button>
                </div>
            </nav>

            <div className="p-2 border-t dark:border-slate-700">
                <button
                    onClick={onLogout}
                    className="group w-full flex items-center gap-3 rounded-md p-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                >
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className={`whitespace-nowrap transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}

const CocinaPage: React.FC = () => {
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [forceRefresh, setForceRefresh] = useState(0);
    const [user, setUser] = useState<{ usuario: string }>({ usuario: 'Cocinero' });

    // Función para obtener items por columna
    const getColumnItems = useCallback((estado: string) => {
        return ordenes.flatMap(orden =>
            orden.items
                .filter(item => item.estado === estado)
                .map(item => ({ item, orden }))
        );
    }, [ordenes]);

    // Función para obtener órdenes por estación
    const ordenesPorEstacion = {
        frio: getColumnItems('en_cola').filter(({ item }) => item.estacion === 'frio'),
        caliente: getColumnItems('en_cola').filter(({ item }) => item.estacion === 'caliente'),
        bebida: getColumnItems('en_cola').filter(({ item }) => item.estacion === 'bebida'),
        postre: getColumnItems('en_cola').filter(({ item }) => item.estacion === 'postre')
    };

    const loadOrdenes = useCallback(async (force = false) => {
        try {
            console.log('🍳 Cargando órdenes de cocina...', { force, currentOrders: ordenes.length });

            const response = await apiClient.get('/api/orden/cocina/pendientes');

            if (response && typeof response === 'object' && 'success' in response && response.success && 'data' in response) {
                const ordenesData = (response as any).data;

                console.log('🍳 Datos recibidos:', {
                    total: ordenesData.length,
                    itemsInCola: ordenesData.filter((o: any) =>
                        o.items && o.items.some((i: any) => i.estado === 'en_cola')
                    ).length,
                    itemsByState: ordenesData.reduce((acc: any, o: any) => {
                        if (o.items) {
                            o.items.forEach((i: any) => {
                                acc[i.estado] = (acc[i.estado] || 0) + 1;
                            });
                        }
                        return acc;
                    }, {})
                });

                // Verificar específicamente si hay nuevos items en cola
                const currentItemsInCola = ordenes.reduce((total: number, o: any) =>
                    total + (o.items ? o.items.filter((i: any) => i.estado === 'en_cola').length : 0), 0
                );

                const newItemsInCola = ordenesData.reduce((total: number, o: any) =>
                    total + (o.items ? o.items.filter((i: any) => i.estado === 'en_cola').length : 0), 0
                );

                // Solo actualizar si hay cambios reales o nuevos items en cola
                if (JSON.stringify(ordenesData) !== JSON.stringify(ordenes) || newItemsInCola > currentItemsInCola) {
                    const hadOrders = ordenes.length > 0;
                    const newOrdersCount = ordenesData.length - ordenes.length;

                    console.log('🍳 Diferencia detectada:', {
                        hadOrders,
                        currentOrders: ordenes.length,
                        newOrders: ordenesData.length,
                        newOrdersCount,
                        currentItemsInCola,
                        newItemsInCola,
                        itemsDifference: newItemsInCola - currentItemsInCola
                    });

                    // Mostrar notificación si hay nuevos items en cola
                    const newItemsDifference = newItemsInCola - currentItemsInCola;
                    if (newItemsDifference > 0) {
                        toast.success(`🍳 ¡${newItemsDifference} nuevo(s) item(s) en cola!`);
                    }

                    setOrdenes(ordenesData);

                    // Si hay nuevos pedidos, mostrar notificación
                    if (newOrdersCount > 0) {
                        toast.success(`🍳 ¡${newOrdersCount} nueva(s) orden(es) recibida(s)!`);
                    }
                }
            }
        } catch (error) {
            console.error('Error cargando órdenes:', error);
            toast.error('Error al cargar órdenes');
        } finally {
            setLoading(false);
        }
    }, [ordenes]);

    useEffect(() => {
        loadOrdenes();
        // Actualizar cada 30 segundos para mejor respuesta
        const interval = setInterval(loadOrdenes, 30000);
        return () => clearInterval(interval);
    }, [forceRefresh]);

    // Función global para forzar recarga desde cualquier lugar
    useEffect(() => {
        toggleHeaderFunc = () => setIsHeaderVisible(prev => !prev);

        // Escuchar eventos de localStorage para actualizaciones en tiempo real
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'new_order' || e.key === 'cocina_refresh') {
                console.log('🍳 Detectado cambio en storage, recargando...');
                loadOrdenes(true);
            }
        };

        // Escuchar eventos personalizados
        const handleNewOrder = () => {
            console.log('🍳 Nueva orden detectada, recargando...');
            loadOrdenes(true);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('newOrder', handleNewOrder);
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                loadOrdenes();
            }
        });

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('newOrder', handleNewOrder);
        };
    }, [loadOrdenes]);

    const handleAvanzarEstado = async (item: ItemOrden) => {
        try {
            const nuevosEstados = {
                'en_cola': 'preparando',
                'preparando': 'listo',
                'listo': 'servido'
            };

            const nuevoEstado = nuevosEstados[item.estado as keyof typeof nuevosEstados];
            if (!nuevoEstado) {
                toast.error('Estado no válido para avanzar');
                return;
            }

            await apiClient.put(`/api/orden/items/${item.id}/estado`, { estado: nuevoEstado });

            const mensajes = {
                'preparando': '🔥 Item en preparación',
                'listo': '✅ Item listo para servir',
                'servido': '📤 Item servido'
            };

            toast.success(mensajes[nuevoEstado as keyof typeof mensajes] || `✅ Item avanzado a ${nuevoEstado}`);
            loadOrdenes();
        } catch (error) {
            console.error('Error actualizando item:', error);
            toast.error('Error al avanzar item');
        }
    };

    const handleCancelarItem = async (item: ItemOrden) => {
        try {
            await apiClient.put(`/api/orden/items/${item.id}/estado`, { estado: 'cancelado' });
            toast.success('❌ Item cancelado');
            loadOrdenes();
        } catch (error) {
            console.error('Error cancelando item:', error);
            toast.error('Error al cancelar item');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-300 dark:from-slate-900 dark:via-emerald-800/60 dark:to-emerald-700/70">
                <div className="relative">
                    <div className="animate-spin rounded-full h-32 w-32 border-4 border-emerald-300 dark:border-emerald-600 border-t-emerald-600 dark:border-t-emerald-400 shadow-2xl"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl animate-bounce">🍳</div>
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white/90 dark:bg-slate-800/90 px-6 py-3 rounded-2xl shadow-xl border-2 border-emerald-300 dark:border-emerald-500 backdrop-blur-sm">
                            <p className="text-lg text-emerald-700 dark:text-emerald-300 font-bold">Cargando cocina...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
            <CocinaSidebar
                user={user}
                onLogout={() => console.log('Logout')}
                isSidebarOpen={isSidebarOpen}
                isHeaderVisible={isHeaderVisible}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                {isHeaderVisible && (
                    <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        🍳 Órdenes Pendientes
                                    </h1>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                                        Gestiona las órdenes en tiempo real
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                        <span className="text-blue-800 dark:text-blue-300 font-medium">
                                            🟢 En Cola: {getColumnItems('en_cola').length}
                                        </span>
                                    </div>
                                    <div className="bg-yellow-100 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                                        <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                                            🟡 Preparando: {getColumnItems('preparando').length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    console.log('🍳 Forzando actualización manual...');
                                    setForceRefresh(prev => prev + 1);
                                    toast.success('🔄 Actualizando...');
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                            >
                                <ArrowPathIcon className="h-4 w-4" />
                                Actualizar
                            </button>

                            {/* Contador de órdenes por estación */}
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-3 shadow-lg">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Estaciones:</span>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                                        ❄️ {ordenesPorEstacion.frio.length}
                                    </span>
                                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
                                        🔥 {ordenesPorEstacion.caliente.length}
                                    </span>
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                                        🥤 {ordenesPorEstacion.bebida.length}
                                    </span>
                                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                                        🍰 {ordenesPorEstacion.postre.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Kanban Board */}
                <div className="flex-1 overflow-hidden p-6">
                    <div className="h-full">
                        <div className="flex gap-6 h-full">
                            {/* Columna: En cola */}
                            <KanbanColumn
                                titulo="En Cola"
                                icono="🟢"
                                estado="en_cola"
                                color="bg-blue-100 dark:bg-blue-900/30"
                                items={getColumnItems('en_cola').map(item => ({item, orden: ordenes.find(o => o.items.some(i => i.id === item.id))!}))}
                                onAvanzar={handleAvanzarEstado}
                                onCancelar={handleCancelarItem}
                            />

                            {/* Columna: Preparando */}
                            <KanbanColumn
                                titulo="Preparando"
                                icono="🟡"
                                estado="preparando"
                                color="bg-yellow-100 dark:bg-yellow-900/30"
                                items={getColumnItems('preparando').map(item => ({item, orden: ordenes.find(o => o.items.some(i => i.id === item.id))!}))}
                                onAvanzar={handleAvanzarEstado}
                                onCancelar={handleCancelarItem}
                            />

                            {/* Columna: Listo */}
                            <KanbanColumn
                                titulo="Listo"
                                icono="🔴"
                                estado="listo"
                                color="bg-red-100 dark:bg-red-900/30"
                                items={getColumnItems('listo').map(item => ({item, orden: ordenes.find(o => o.items.some(i => i.id === item.id))!}))}
                                onAvanzar={handleAvanzarEstado}
                                onCancelar={handleCancelarItem}
                            />

                            {/* Columna: Servido */}
                            <KanbanColumn
                                titulo="Servido"
                                icono="⚪"
                                estado="servido"
                                color="bg-gray-100 dark:bg-gray-900/30"
                                items={getColumnItems('servido').map(item => ({item, orden: ordenes.find(o => o.items.some(i => i.id === item.id))!}))}
                                onAvanzar={handleAvanzarEstado}
                                onCancelar={handleCancelarItem}
                            />

                            {/* Columna: Cancelado */}
                            <KanbanColumn
                                titulo="Cancelado"
                                icono="🟠"
                                estado="cancelado"
                                color="bg-orange-100 dark:bg-orange-900/30"
                                items={getColumnItems('cancelado').map(item => ({item, orden: ordenes.find(o => o.items.some(i => i.id === item.id))!}))}
                                onAvanzar={handleAvanzarEstado}
                                onCancelar={handleCancelarItem}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CocinaPage;

