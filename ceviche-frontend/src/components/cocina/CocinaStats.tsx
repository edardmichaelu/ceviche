import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, FireIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { CocinaStatsProps } from '../../types/cocina.types';

// === COMPONENTE DE ESTADÍSTICAS DE COCINA ===
export function CocinaStats({ totalOrdenes, itemsPendientes, itemsPreparando, itemsListos, tiempoPromedio }: CocinaStatsProps) {
    const stats = [
        {
            title: 'Órdenes Totales',
            value: totalOrdenes,
            icon: ClockIcon,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            textColor: 'text-blue-600 dark:text-blue-400'
        },
        {
            title: 'Items Pendientes',
            value: itemsPendientes,
            icon: ClockIcon,
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            textColor: 'text-orange-600 dark:text-orange-400'
        },
        {
            title: 'En Preparación',
            value: itemsPreparando,
            icon: FireIcon,
            color: 'bg-red-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            textColor: 'text-red-600 dark:text-red-400'
        },
        {
            title: 'Listos',
            value: itemsListos,
            icon: CheckCircleIcon,
            color: 'bg-green-500',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            textColor: 'text-green-600 dark:text-green-400'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 ${stat.bgColor}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                {stat.title}
                            </p>
                            <p className={`text-2xl font-bold ${stat.textColor}`}>
                                {stat.value}
                            </p>
                            {tiempoPromedio > 0 && stat.title === 'Items Pendientes' && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                    ⏱️ ~{tiempoPromedio.toFixed(0)} min promedio
                                </p>
                            )}
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color}`}>
                            <stat.icon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
