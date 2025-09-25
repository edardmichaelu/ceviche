import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { ErrorHandler } from '../utils/errorHandler';
import {
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ArrowPathIcon,
    EyeIcon,
    UserIcon,
    TableCellsIcon,
    CurrencyDollarIcon,
    UsersIcon,
    PrinterIcon
} from '@heroicons/react/24/outline';

interface OrdenDetallada {
    id: number;
    numero: string;
    estado: 'pendiente' | 'confirmada' | 'preparando' | 'lista' | 'servida' | 'cancelada';
    total: number;
    num_comensales: number;
    cliente_nombre?: string;
    tipo: string;
    creado_en: string;
    actualizado_en: string;
    mesa_numero: number;
    mozo_nombre: string;
    items: {
        id: number;
        producto_id: number;
        producto: {
          id: number;
          nombre: string;
          descripcion?: string;
        };
        cantidad: number;
        precio_unitario: number;
        estado: string;
        observaciones?: string;
    }[];
    tiempo_preparacion?: number;
    prioridad?: 'normal' | 'urgente' | 'muy_urgente';
}

const OrdenesDetalladasMeseroPage: React.FC = () => {
    const [ordenes, setOrdenes] = useState<OrdenDetallada[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrden, setSelectedOrden] = useState<OrdenDetallada | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadOrdenes();
    }, []);

    const loadOrdenes = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/orden/mesero/detalladas');

            if (response && response.data && Array.isArray(response.data)) {
                setOrdenes(response.data);
            } else {
                toast.error('No se pudieron cargar las órdenes detalladas');
            }
        } catch (error: any) {
            ErrorHandler.logError('cargar órdenes detalladas del mesero', error);
            toast.error('Error al cargar las órdenes detalladas');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadOrdenes();
        setRefreshing(false);
        toast.success('Órdenes actualizadas');
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
            case 'confirmada': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'preparando': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
            case 'lista': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
            case 'servida': return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800';
            case 'cancelada': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'pendiente': return ClockIcon;
            case 'confirmada': return CheckCircleIcon;
            case 'preparando': return ArrowPathIcon;
            case 'lista': return CheckCircleIcon;
            case 'servida': return CheckCircleIcon;
            case 'cancelada': return ExclamationCircleIcon;
            default: return DocumentTextIcon;
        }
    };

    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTiempo = (minutos: number) => {
        if (minutos < 60) return `${minutos} min`;
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${horas}h ${mins}min`;
    };

    const handleVerDetalles = (orden: OrdenDetallada) => {
        setSelectedOrden(orden);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrden(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-slate-900 dark:via-blue-900/30 dark:to-blue-800/40">
                <div className="relative">
                    <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-300 dark:border-blue-600 border-t-blue-600 dark:border-t-blue-400 shadow-2xl"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl animate-bounce">📋</div>
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white/90 dark:bg-slate-800/90 px-6 py-3 rounded-2xl shadow-xl border-2 border-blue-300 dark:border-blue-500 backdrop-blur-sm">
                            <p className="text-lg text-blue-700 dark:text-blue-300 font-bold">Cargando órdenes...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-white via-blue-100 to-blue-200 dark:from-slate-800 dark:via-blue-700/60 dark:to-blue-600/70 rounded-2xl shadow-lg p-8 border-2 border-blue-300/50 dark:border-blue-500/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg">
                                <DocumentTextIcon className="h-8 w-8 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                                📋 Órdenes Detalladas
                            </h1>
                            <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
                                Visualiza las órdenes enviadas a cocina con todos los detalles
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                    >
                        {refreshing ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <ArrowPathIcon className="h-4 w-4" />
                        )}
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Contenido */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                {ordenes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ordenes.map((orden, index) => (
                            <motion.div
                                key={orden.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-200 dark:border-slate-600"
                            >
                                {/* Header de la orden */}
                                <div className="p-4 border-b border-slate-200 dark:border-slate-600">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                #{orden.numero}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(orden.estado)}`}>
                                                {React.createElement(getEstadoIcon(orden.estado), { className: 'h-3 w-3 mr-1' })}
                                                {orden.estado.charAt(0).toUpperCase() + orden.estado.slice(1)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleVerDetalles(orden)}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                            title="Ver detalles"
                                        >
                                            <EyeIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <TableCellsIcon className="h-4 w-4 text-slate-400" />
                                            <span className="text-slate-600 dark:text-slate-300">
                                                Mesa {orden.mesa_numero}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <UserIcon className="h-4 w-4 text-slate-400" />
                                            <span className="text-slate-600 dark:text-slate-300">
                                                {orden.mozo_nombre}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <UsersIcon className="h-4 w-4 text-slate-400" />
                                            <span className="text-slate-600 dark:text-slate-300">
                                                {orden.num_comensales} personas
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <CurrencyDollarIcon className="h-4 w-4 text-slate-400" />
                                            <span className="font-semibold text-green-600 dark:text-green-400">
                                                S/ {orden.total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="p-4">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                        Productos ({orden.items.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {orden.items.slice(0, 3).map((item) => (
                                            <div key={item.id} className="text-xs bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-600">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-700 dark:text-slate-300 truncate">
                                                        {item.producto?.nombre || 'Producto sin nombre'}
                                                    </span>
                                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                                        {item.cantidad}x
                                                    </span>
                                                </div>
                                                <div className="text-slate-500 dark:text-slate-400">
                                                    S/ {item.precio_unitario.toFixed(2)} c/u
                                                </div>
                                            </div>
                                        ))}
                                        {orden.items.length > 3 && (
                                            <div className="text-xs text-center text-slate-500 dark:text-slate-400 py-1">
                                                +{orden.items.length - 3} más...
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 rounded-b-xl">
                                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                        <span>Creada: {formatFecha(orden.creado_en)}</span>
                                        <span>Items: {orden.items.length}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-slate-400 dark:text-slate-500 text-8xl mb-6">
                            📋
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            No hay órdenes detalladas
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-lg mb-6">
                            Las órdenes aparecerán aquí cuando se envíen desde Venta Rápida
                        </p>
                        <button
                            onClick={handleRefresh}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Actualizar
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Detalles de Orden */}
            <AnimatePresence>
                {isModalOpen && selectedOrden && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={handleCloseModal}
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                            <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                Detalles de la Orden
                                            </h3>
                                            <p className="text-base text-slate-500 dark:text-slate-400">
                                                #{selectedOrden.numero} • Mesa {selectedOrden.mesa_numero}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCloseModal}
                                        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                        aria-label="Cerrar modal"
                                    >
                                        <svg className="h-5 w-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Contenido */}
                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Información General */}
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                                    📋 Información General
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600 dark:text-slate-400">Número de Orden:</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">#{selectedOrden.numero}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600 dark:text-slate-400">Estado:</span>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(selectedOrden.estado)}`}>
                                                            {React.createElement(getEstadoIcon(selectedOrden.estado), { className: 'h-3 w-3 mr-1' })}
                                                            {selectedOrden.estado.charAt(0).toUpperCase() + selectedOrden.estado.slice(1)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600 dark:text-slate-400">Total:</span>
                                                        <span className="font-bold text-green-600 dark:text-green-400">S/ {selectedOrden.total.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600 dark:text-slate-400">Comensales:</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">{selectedOrden.num_comensales}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600 dark:text-slate-400">Tipo:</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">{selectedOrden.tipo}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600 dark:text-slate-400">Mozo:</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">{selectedOrden.mozo_nombre}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600 dark:text-slate-400">Mesa:</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">{selectedOrden.mesa_numero}</span>
                                                    </div>
                                                    {selectedOrden.cliente_nombre && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600 dark:text-slate-400">Cliente:</span>
                                                            <span className="font-semibold text-slate-900 dark:text-white">{selectedOrden.cliente_nombre}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                                    ⏰ Tiempos
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600 dark:text-slate-400">Creada:</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">{formatFecha(selectedOrden.creado_en)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600 dark:text-slate-400">Última actualización:</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">{formatFecha(selectedOrden.actualizado_en)}</span>
                                                    </div>
                                                    {selectedOrden.tiempo_preparacion && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600 dark:text-slate-400">Tiempo estimado:</span>
                                                            <span className="font-semibold text-slate-900 dark:text-white">{formatTiempo(selectedOrden.tiempo_preparacion)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Productos */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                                🍽️ Productos ({selectedOrden.items.length})
                                            </h4>
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {selectedOrden.items.map((item) => (
                                                    <div key={item.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex-1">
                                                                <h5 className="font-semibold text-slate-900 dark:text-white">{item.producto?.nombre || 'Producto sin nombre'}</h5>
                                                                {item.producto?.descripcion && (
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                                        {item.producto.descripcion}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                                    <span>Cantidad: {item.cantidad}</span>
                                                                    <span>•</span>
                                                                    <span>S/ {item.precio_unitario.toFixed(2)} c/u</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-bold text-blue-600 dark:text-blue-400">
                                                                    S/ {(item.cantidad * item.precio_unitario).toFixed(2)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {item.observaciones && (
                                                            <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                                                                <span className="font-medium">Nota:</span> {item.observaciones}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Total */}
                                            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-lg font-semibold text-slate-900 dark:text-white">Total General:</span>
                                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        S/ {selectedOrden.total.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCloseModal}
                                            className="flex-1 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-xl hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors font-semibold"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrdenesDetalladasMeseroPage;
