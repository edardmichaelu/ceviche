import React from 'react';
import { motion } from 'framer-motion';
import { formatDateTimeGlobal, getEstadoColorGlobal, getEstadoIconGlobal } from '../../utils/auxiliaryFunctions';
import { KanbanCardProps } from '../../types/cocina.types';

// === COMPONENTE DE TARJETA KANBAN ===
export function KanbanCard({ item, orden, onAvanzar, onCancelar }: KanbanCardProps) {
    // Verificar si orden existe antes de acceder a sus propiedades
    const dateTime = orden ? formatDateTimeGlobal(orden.creado_en) : { date: 'N/A', time: 'N/A', dateTime: 'N/A' };

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
                        Orden #{orden?.numero || 'N/A'} • Mesa {orden?.mesa?.numero || 'N/A'}
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
                                console.log('🍳 KanbanCard: Avanzando item', item.id, 'de', item.estado);
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
                                console.log('🍳 KanbanCard: Cancelando item', item.id, 'estado actual:', item.estado);
                                console.log('🍳 Botón de cancelar visible para item en estado:', item.estado);
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
