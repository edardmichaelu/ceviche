// Funciones auxiliares globales para estados y formateo
export const getEstadoColorGlobal = (estado: string) => {
    switch (estado) {
        case 'en_cola': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        case 'preparando': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
        case 'listo': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800';
        case 'servido': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-800';
        case 'cancelado': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200 dark:border-orange-800';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
};

export const getEstadoDisplayNameGlobal = (estado: string) => {
    switch (estado) {
        case 'en_cola': return 'En Cola';
        case 'preparando': return 'Preparando';
        case 'listo': return 'Listo';
        case 'servido': return 'Servido';
        case 'cancelado': return 'Cancelado';
        default: return estado;
    }
};

export const getEstadoIconGlobal = (estado: string) => {
    switch (estado) {
        case 'en_cola': return '🟢';
        case 'preparando': return '🟡';
        case 'listo': return '🔴';
        case 'servido': return '⚪';
        case 'cancelado': return '🟠';
        default: return '⚫';
    }
};

export const getEstacionNameGlobal = (estacion?: string) => {
    switch (estacion) {
        case 'frio': return 'Fríos';
        case 'caliente': return 'Calientes';
        case 'bebida': return 'Bebidas';
        case 'postre': return 'Postres';
        default: return 'General';
    }
};

export const formatDateTimeGlobal = (dateString: string) => {
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        time: date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        dateTime: date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
};

