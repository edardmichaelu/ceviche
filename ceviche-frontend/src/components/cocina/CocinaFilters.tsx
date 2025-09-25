import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { CocinaFiltersProps } from '../../types/cocina.types';

// === COMPONENTE DE FILTROS DE COCINA ===
export function CocinaFilters({ searchTerm, onSearchChange, filterEstado, onFilterEstadoChange, filterEstacion, onFilterEstacionChange }: CocinaFiltersProps) {
    const estados = [
        { value: '', label: 'Todos los estados' },
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'preparando', label: 'Preparando' },
        { value: 'listo', label: 'Listo' },
        { value: 'cancelado', label: 'Cancelado' }
    ];

    const estaciones = [
        { value: '', label: 'Todas las estaciones' },
        { value: 'parrilla', label: 'Parrilla' },
        { value: 'horno', label: 'Horno' },
        { value: 'frio', label: 'Frío' },
        { value: 'bebidas', label: 'Bebidas' },
        { value: 'postres', label: 'Postres' }
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Campo de búsqueda */}
                <div className="flex-1">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por orden, mesa, producto..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Filtro por estado */}
                <div className="lg:w-48">
                    <div className="relative">
                        <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <select
                            value={filterEstado}
                            onChange={(e) => onFilterEstadoChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                        >
                            {estados.map((estado) => (
                                <option key={estado.value} value={estado.value}>
                                    {estado.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Filtro por estación */}
                <div className="lg:w-48">
                    <div className="relative">
                        <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <select
                            value={filterEstacion}
                            onChange={(e) => onFilterEstacionChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                        >
                            {estaciones.map((estacion) => (
                                <option key={estacion.value} value={estacion.value}>
                                    {estacion.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Botón de limpiar filtros */}
                {(searchTerm || filterEstado || filterEstacion) && (
                    <button
                        onClick={() => {
                            onSearchChange('');
                            onFilterEstadoChange('');
                            onFilterEstacionChange('');
                        }}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        Limpiar
                    </button>
                )}
            </div>

            {/* Mostrar filtros activos */}
            {(searchTerm || filterEstado || filterEstacion) && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                    <div className="flex flex-wrap gap-2">
                        {searchTerm && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                                🔍 {searchTerm}
                            </span>
                        )}
                        {filterEstado && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                                📋 {estados.find(e => e.value === filterEstado)?.label}
                            </span>
                        )}
                        {filterEstacion && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300">
                                🏭 {estaciones.find(e => e.value === filterEstacion)?.label}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
