import React from 'react';
import { motion } from 'framer-motion';
import { formatDateTimeGlobal, getEstadoColorGlobal, getEstadoIconGlobal } from '../../utils/auxiliaryFunctions';
import { KanbanOrdenesCardProps } from '../../types/cocina.types';

// === COMPONENTE DE TARJETA KANBAN PARA ÓRDENES ===
export function KanbanOrdenesCard({ orden, onActualizarEstado, onVerDetalles, onEliminarOrden }: KanbanOrdenesCardProps) {
    // Formatear fecha y hora
    const dateTime = formatDateTimeGlobal(orden.creado_en);

    // Obtener los productos principales (máximo 3)
    const productosPrincipales = orden.items?.slice(0, 3) || [];
    const productosAdicionales = orden.items?.length ? orden.items.length - 3 : 0;

    // Función para obtener el siguiente estado válido
    const getSiguienteEstado = (estadoActual: string) => {
        const flujoEstados = ['confirmada', 'preparando', 'lista', 'servida'];
        const currentIndex = flujoEstados.indexOf(estadoActual);
        if (currentIndex === -1 || currentIndex === flujoEstados.length - 1) {
            return null; // No hay siguiente estado
        }
        return flujoEstados[currentIndex + 1];
    };

    const siguienteEstado = getSiguienteEstado(orden.estado);
    const puedeCancelar = orden.estado !== 'servida' && orden.estado !== 'cancelada';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => onVerDetalles(orden)}
        >
            {/* Header de la orden */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            Orden #{orden.numero}
                        </h4>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColorGlobal(orden.estado)}`}>
                            {getEstadoIconGlobal(orden.estado)}
                            <span className="ml-1">{orden.estado.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Información básica */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <div>
                            <span className="font-medium">Mesa:</span> {orden.mesa?.numero || 'N/A'}
                        </div>
                        <div>
                            <span className="font-medium">Cliente:</span> {orden.cliente_nombre || 'Sin nombre'}
                        </div>
                    </div>

                    {/* Hora de entrada */}
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Entrada:</span> {dateTime.time}
                    </div>
                </div>
            </div>

            {/* Productos principales */}
            <div className="mb-2">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Productos ({orden.items?.length || 0}):
                </div>
                <div className="space-y-1 max-h-20 overflow-hidden">
                    {productosPrincipales.map((item, index) => (
                        <div key={item.id} className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 rounded px-2 py-1">
                            <div className="flex justify-between">
                                <span className="truncate">
                                    {item.producto?.nombre || `Producto #${item.producto_id}`}
                                </span>
                                <span className="font-medium ml-2">
                                    {item.cantidad}x
                                </span>
                            </div>
                        </div>
                    ))}
                    {productosAdicionales > 0 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 italic px-2">
                            +{productosAdicionales} producto{productosAdicionales !== 1 ? 's' : ''} más...
                        </div>
                    )}
                </div>
            </div>

            {/* Información adicional */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-3">
                <div>
                    <span className="font-medium">Mozo:</span> {orden.mozo?.usuario || 'N/A'}
                </div>
                <div>
                    <span className="font-medium">Total:</span> S/ {orden.monto_total.toFixed(2)}
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
                {siguienteEstado && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onActualizarEstado(orden.id, siguienteEstado);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                    >
                        Avanzar → {siguienteEstado.toUpperCase()}
                    </button>
                )}

                {puedeCancelar && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onActualizarEstado(orden.id, 'cancelada');
                        }}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                    >
                        ❌ Cancelar
                    </button>
                )}

                {/* Botón de eliminar del kanban (solo para órdenes servidas o canceladas) */}
                {(orden.estado === 'servida' || orden.estado === 'cancelada') && onEliminarOrden && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Estás seguro de eliminar la orden #${orden.numero} del kanban?`)) {
                                onEliminarOrden(orden.id);
                            }
                        }}
                        className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-medium transition-colors"
                        title="Eliminar del kanban"
                    >
                        🗑️
                    </button>
                )}
            </div>
        </motion.div>
    );
}
