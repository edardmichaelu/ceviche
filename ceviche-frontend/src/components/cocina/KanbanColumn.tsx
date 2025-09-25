import React from 'react';
import { motion } from 'framer-motion';
import { KanbanColumnProps, KanbanCardProps } from '../../types/cocina.types';
import { KanbanCard } from './KanbanCard';

// === COMPONENTE DE COLUMNA KANBAN ===
export function KanbanColumn({ titulo, icono, estado, color, items, onAvanzar, onCancelar }: KanbanColumnProps) {
    return (
        <div className="flex-1 min-w-0">
            {/* Header de la columna */}
            <div className={`p-5 rounded-t-xl ${color} border-b-2`}>
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{icono}</span>
                    <h3 className="font-bold text-white text-lg">{titulo}</h3>
                    <span className="ml-auto bg-white/25 text-white px-4 py-2 rounded-full text-lg font-bold">
                        {items.length}
                    </span>
                </div>
            </div>

            {/* Contenido de la columna */}
            <div className="p-4 space-y-3 min-h-[600px] max-h-[900px] overflow-auto bg-white dark:bg-slate-800/50 rounded-b-xl border-x-2 border-b-2 border-slate-200 dark:border-slate-700">
                {items.length === 0 ? (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-16">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-lg font-medium">Sin items</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Esta columna está vacía</p>
                    </div>
                ) : (
                    items.map(({ item, orden }, index) => (
                        <KanbanCard
                            key={`${item.id}-${index}`}
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
