import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

// === COMPONENTE HEADER DE COCINA ===
export function CocinaHeader({ onToggleSidebar, user }: { onToggleSidebar: () => void; user: { usuario: string; avatar?: string | null; }; }) {
    return (
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onToggleSidebar}
                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                🍳 Panel de Cocina
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Bienvenido, {user.usuario}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Botón de recarga manual */}
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        title="Recargar"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
