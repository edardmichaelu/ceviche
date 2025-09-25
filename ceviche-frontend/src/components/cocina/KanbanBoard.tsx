import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { KanbanColumn } from './KanbanColumn';
import { KanbanOrdenesColumn } from './KanbanOrdenesColumn';
import { Orden, ItemOrden, KanbanColumnKey, KANBAN_COLUMNS, KANBAN_ORDENES_COLUMNS, KanbanOrdenesColumnKey } from '../../types/cocina.types';

interface KanbanBoardProps {
    ordenes: Orden[];
    onAvanzarItem: (itemId: number) => void;
    onCancelarItem: (itemId: number) => void;
    loading?: boolean;
    mode?: 'items' | 'ordenes';
    onActualizarEstadoOrden?: (ordenId: number, nuevoEstado: string) => void;
    onVerDetallesOrden?: (orden: Orden) => void;
    onEliminarOrden?: (ordenId: number) => void;
}

// === COMPONENTE KANBAN BOARD COMPLETO ===
export function KanbanBoard({
    ordenes,
    onAvanzarItem,
    onCancelarItem,
    loading = false,
    mode = 'ordenes',
    onActualizarEstadoOrden,
    onVerDetallesOrden,
    onEliminarOrden
}: KanbanBoardProps) {

    // === MODO ITEMS (LEGACY) ===
    const getColumnItems = useCallback((estado: string) => {
        if (!ordenes || ordenes.length === 0) return [];
        const itemsFiltrados = ordenes.flatMap(orden =>
            orden.items
                .filter(item => item.estado === estado)
                .map(item => ({ item, orden }))
        );
        return itemsFiltrados;
    }, [ordenes]);

    const handleAvanzarItem = useCallback((item: ItemOrden) => {
        console.log('🍳 KanbanBoard: Avanzando item', item.id, 'de', item.estado);
        onAvanzarItem(item.id);
    }, [onAvanzarItem]);

    const handleCancelarItem = useCallback((item: ItemOrden) => {
        console.log('🍳 KanbanBoard: Cancelando item', item.id, 'estado actual:', item.estado);
        onCancelarItem(item.id);
    }, [onCancelarItem]);

    // === MODO ÓRDENES (NUEVO) ===
    const getColumnOrdenes = useCallback((estado: string) => {
        if (!ordenes || ordenes.length === 0) return [];
        return ordenes.filter(orden => orden.estado === estado);
    }, [ordenes]);

    const handleActualizarEstadoOrden = useCallback((ordenId: number, nuevoEstado: string) => {
        console.log('🍳 KanbanBoard: Actualizando estado de orden', ordenId, 'a', nuevoEstado);
        if (onActualizarEstadoOrden) {
            onActualizarEstadoOrden(ordenId, nuevoEstado);
        }
    }, [onActualizarEstadoOrden]);

    const handleVerDetallesOrden = useCallback((orden: Orden) => {
        console.log('🍳 KanbanBoard: Viendo detalles de orden', orden.id);
        if (onVerDetallesOrden) {
            onVerDetallesOrden(orden);
        }
    }, [onVerDetallesOrden]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    // === RENDER MODO ITEMS (LEGACY) ===
    if (mode === 'items') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                <div className="flex gap-6 overflow-x-auto pb-6">
                    {(Object.keys(KANBAN_COLUMNS) as KanbanColumnKey[]).map((columnKey) => {
                        const columnConfig = KANBAN_COLUMNS[columnKey];
                        const items = getColumnItems(columnConfig.estado);

                        return (
                            <KanbanColumn
                                key={columnKey}
                                titulo={columnConfig.titulo}
                                icono={columnConfig.icono}
                                estado={columnConfig.estado}
                                color={columnConfig.color}
                                items={items}
                                onAvanzar={handleAvanzarItem}
                                onCancelar={handleCancelarItem}
                            />
                        );
                    })}
                </div>
            </motion.div>
        );
    }

    // === RENDER MODO ÓRDENES (NUEVO) ===
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
        >
            <div className="flex gap-4 overflow-x-auto pb-4">
                {(Object.keys(KANBAN_ORDENES_COLUMNS) as KanbanOrdenesColumnKey[]).map((columnKey) => {
                    const columnConfig = KANBAN_ORDENES_COLUMNS[columnKey];
                    const ordenes = getColumnOrdenes(columnConfig.estado);

                    return (
                        <KanbanOrdenesColumn
                            key={columnKey}
                            titulo={columnConfig.titulo}
                            icono={columnConfig.icono}
                            estado={columnConfig.estado}
                            color={columnConfig.color}
                            descripcion={columnConfig.descripcion}
                            ordenes={ordenes}
                            onActualizarEstado={handleActualizarEstadoOrden}
                            onVerDetalles={handleVerDetallesOrden}
                            onEliminarOrden={onEliminarOrden}
                        />
                    );
                })}
            </div>
        </motion.div>
    );
}
