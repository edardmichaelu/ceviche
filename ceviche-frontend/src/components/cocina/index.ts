// === EXPORTACIONES DE COMPONENTES DE COCINA ===

// Componentes principales
export { KanbanBoard } from './KanbanBoard';
export { KanbanColumn } from './KanbanColumn';
export { KanbanCard } from './KanbanCard';

// Layout y navegación
export { CocinaSidebar } from './CocinaSidebar';
export { CocinaHeader } from './CocinaHeader';

// Utilitarios
export { CocinaStats } from './CocinaStats';
export { CocinaFilters } from './CocinaFilters';

// Configuración y navegación
export { COCINA_NAV_ITEMS } from './CocinaSidebar';

// Tipos (re-export)
export type {
    Orden,
    ItemOrden,
    KanbanColumnProps,
    KanbanCardProps,
    CocinaSidebarProps,
    CocinaHeaderProps,
    CocinaStatsProps,
    CocinaFiltersProps,
    KanbanConfig,
    CocinaSettings,
    CocinaNotification,
    CocinaAlert,
    ItemEstado,
    OrdenEstado,
    PrioridadNivel,
    KanbanColumnKey
} from '../../types/cocina.types';

// Configuración
export { KANBAN_COLUMNS } from '../../types/cocina.types';
