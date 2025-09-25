// === INTERFACES Y TIPOS PARA EL DASHBOARD DE COCINA ===

export interface Orden {
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

export interface ItemOrden {
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

export interface KanbanColumnProps {
    titulo: string;
    icono: string;
    estado: string;
    color: string;
    items: Array<{item: ItemOrden, orden: Orden}>;
    onAvanzar: (item: ItemOrden) => void;
    onCancelar: (item: ItemOrden) => void;
}

export interface KanbanCardProps {
    item: ItemOrden;
    orden: Orden;
    onAvanzar: (item: ItemOrden) => void;
    onCancelar: (item: ItemOrden) => void;
}

export interface CocinaSidebarProps {
    user: { usuario: string; avatar?: string | null; };
    onLogout: () => void;
    isSidebarOpen: boolean;
    isHeaderVisible: boolean;
    onProfileUpdate?: (updatedUser: { usuario: string; avatar?: string | null; }) => void;
}

export interface CocinaHeaderProps {
    onToggleSidebar: () => void;
    onToggleHeader: () => void;
    isHeaderVisible: boolean;
    user: { usuario: string; avatar?: string | null; };
}

export interface CocinaStatsProps {
    totalOrdenes: number;
    itemsPendientes: number;
    itemsPreparando: number;
    itemsListos: number;
    tiempoPromedio: number;
}

export interface CocinaFiltersProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filterEstado: string;
    onFilterEstadoChange: (estado: string) => void;
    filterEstacion: string;
    onFilterEstacionChange: (estacion: string) => void;
}

// === CONFIGURACIÓN DEL KANBAN ===
export interface KanbanConfig {
    columns: Array<{
        estado: string;
        titulo: string;
        icono: string;
        color: string;
    }>;
}

export interface CocinaSettings {
    refreshInterval: number;
    maxItemsPerColumn: number;
    showWaitTime: boolean;
    groupByPriority: boolean;
    compactMode: boolean;
    autoRefresh: boolean;
}

// === TIPOS PARA NOTIFICACIONES ===
export interface CocinaNotification {
    id: string;
    type: 'new_order' | 'order_ready' | 'order_cancelled' | 'error';
    message: string;
    timestamp: Date;
    read: boolean;
}

export interface CocinaAlert {
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    autoClose: boolean;
    duration?: number;
}

// === ESTADOS DEL SISTEMA ===
export type ItemEstado = 'pendiente' | 'preparando' | 'listo' | 'servido' | 'cancelado';
export type OrdenEstado = 'pendiente' | 'preparando' | 'lista' | 'entregada' | 'cancelada';
export type PrioridadNivel = 'baja' | 'media' | 'alta' | 'urgente';

// === CONFIGURACIÓN DE COLUMNAS KANBAN PARA ÓRDENES ===
export const KANBAN_ORDENES_COLUMNS = {
    confirmada: {
        titulo: 'Confirmada',
        icono: '📋',
        color: 'bg-blue-500',
        estado: 'confirmada',
        descripcion: 'Órdenes confirmadas listas para preparación'
    },
    preparando: {
        titulo: 'Preparando',
        icono: '🔥',
        color: 'bg-orange-500',
        estado: 'preparando',
        descripcion: 'Órdenes en proceso de preparación'
    },
    lista: {
        titulo: 'Lista',
        icono: '✅',
        color: 'bg-green-500',
        estado: 'lista',
        descripcion: 'Órdenes listas para servir'
    },
    servida: {
        titulo: 'Servida',
        icono: '🍽️',
        color: 'bg-emerald-500',
        estado: 'servida',
        descripcion: 'Órdenes servidas a clientes'
    },
    cancelada: {
        titulo: 'Cancelada',
        icono: '❌',
        color: 'bg-red-500',
        estado: 'cancelada',
        descripcion: 'Órdenes canceladas'
    }
} as const;

// === CONFIGURACIÓN DE COLUMNAS KANBAN PARA ITEMS (LEGACY) ===
export const KANBAN_COLUMNS = {
    pendiente: {
        titulo: 'Pendiente',
        icono: '🍳',
        color: 'bg-orange-500',
        estado: 'pendiente'
    },
    preparando: {
        titulo: 'Preparando',
        icono: '🔥',
        color: 'bg-red-500',
        estado: 'preparando'
    },
    listo: {
        titulo: 'Listo',
        icono: '✅',
        color: 'bg-green-500',
        estado: 'listo'
    },
    cancelado: {
        titulo: 'Cancelado',
        icono: '❌',
        color: 'bg-gray-500',
        estado: 'cancelado'
    }
} as const;

export type KanbanColumnKey = keyof typeof KANBAN_COLUMNS;
export type KanbanOrdenesColumnKey = keyof typeof KANBAN_ORDENES_COLUMNS;

// === INTERFACES PARA KANBAN DE ÓRDENES ===
export interface KanbanOrdenesColumnProps {
    titulo: string;
    icono: string;
    estado: string;
    color: string;
    descripcion: string;
    ordenes: Orden[];
    onActualizarEstado: (ordenId: number, nuevoEstado: string) => void;
    onVerDetalles: (orden: Orden) => void;
    onEliminarOrden?: (ordenId: number) => void;
}

export interface KanbanOrdenesCardProps {
    orden: Orden;
    onActualizarEstado: (ordenId: number, nuevoEstado: string) => void;
    onVerDetalles: (orden: Orden) => void;
    onEliminarOrden?: (ordenId: number) => void;
}
