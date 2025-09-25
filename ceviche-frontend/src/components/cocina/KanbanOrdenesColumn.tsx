import React from 'react';
import { motion } from 'framer-motion';
import { KanbanOrdenesColumnProps, KanbanOrdenesCardProps } from '../../types/cocina.types';
import { KanbanOrdenesCard } from './KanbanOrdenesCard';

// === COMPONENTE DE COLUMNA KANBAN PARA ÓRDENES ===
export function KanbanOrdenesColumn({
    titulo,
    icono,
    estado,
    color,
    descripcion,
    ordenes,
    onActualizarEstado,
    onVerDetalles,
    onEliminarOrden
}: KanbanOrdenesColumnProps) {

    return (
        <div className="flex-1 min-w-0">
            {/* Header de la columna */}
            <div className={`${color} rounded-t-xl border-b-2 p-5`}>
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{icono}</span>
                    <div className="flex-1">
                        <h3 className="font-bold text-white text-lg">{titulo}</h3>
                        <p className="text-white/90 text-sm">{descripcion}</p>
                    </div>
                    <span className="bg-white/25 text-white px-4 py-2 rounded-full text-lg font-bold">
                        {ordenes.length}
                    </span>
                </div>
            </div>

            {/* Contenido de la columna */}
            <div className="p-4 space-y-3 min-h-[600px] max-h-[900px] overflow-auto bg-white dark:bg-slate-800/50 rounded-b-xl border-x-2 border-b-2 border-slate-200 dark:border-slate-700">
                {ordenes.length === 0 ? (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-16">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-lg font-medium">Sin órdenes</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Esta columna está vacía</p>
                        <p className="text-xs text-slate-300 dark:text-slate-600 mt-2">Las órdenes aparecerán aquí automáticamente</p>
                    </div>
                ) : (
                    ordenes.map((orden, index) => (
                        <KanbanOrdenesCard
                            key={`${orden.id}-${index}`}
                            orden={orden}
                            onActualizarEstado={onActualizarEstado}
                            onVerDetalles={onVerDetalles}
                            onEliminarOrden={onEliminarOrden}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
