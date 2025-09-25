import React, { useState, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ArrowLeftOnRectangleIcon, ChevronDownIcon, ClockIcon, UserIcon } from '@heroicons/react/24/solid';
import { CocinaSidebarProps } from '../../types/cocina.types';
import { ProfileEditModal } from '../admin/ProfileEditModal';

// === CONFIGURACIÓN DE NAVEGACIÓN ===
export const COCINA_NAV_ITEMS = [
    {
        to: '/cocina',
        text: 'Órdenes Pendientes',
        icon: (
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
        ),
        color: 'text-orange-600 dark:text-orange-400'
    },
    {
        to: '/cocina/ordenes-detalladas',
        text: 'Órdenes Detalladas',
        icon: (
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
        ),
        color: 'text-blue-600 dark:text-blue-400'
    }
];

// === COMPONENTE SIDEBAR DE COCINA ===
export function CocinaSidebar({ user, onLogout, isSidebarOpen, isHeaderVisible, onProfileUpdate }: CocinaSidebarProps) {
    const location = window.location;
    const baseLinkClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors duration-200";
    const hoverClasses = "hover:bg-orange-100 dark:hover:bg-slate-700";
    const activeLinkClasses = "bg-orange-600 text-white shadow-lg";

    // Estado para el modal de perfil
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const getAvatarUrl = () => {
        if (user.avatar) {
            return user.avatar;
        }
        return `https://ui-avatars.com/api/?name=${user.usuario.charAt(0)}&background=e2e8f0&color=475569&bold=true`;
    };

    // Estado para estadísticas en tiempo real
    const [stats, setStats] = useState({
        ordenesTotal: 0,
        itemsPendientes: 0,
        itemsPreparando: 0,
        itemsUrgentes: 0
    });

    // Función para actualizar estadísticas
    useEffect(() => {
        const updateStats = () => {
            // Obtener estadísticas desde localStorage o API
            const ordenesData = JSON.parse(localStorage.getItem('cocina_ordenes') || '[]');
            const totalOrdenes = ordenesData.length;
            const itemsPendientes = ordenesData.flatMap((o: any) => o.items || [])
                .filter((item: any) => item.estado === 'pendiente' || item.estado === 'en_cola').length;
            const itemsPreparando = ordenesData.flatMap((o: any) => o.items || [])
                .filter((item: any) => item.estado === 'preparando').length;
            const itemsUrgentes = ordenesData.flatMap((o: any) => o.items || [])
                .filter((item: any) => item.prioridad === 'urgente' || item.prioridad === 'alta').length;

            setStats({
                ordenesTotal: totalOrdenes,
                itemsPendientes: itemsPendientes,
                itemsPreparando: itemsPreparando,
                itemsUrgentes: itemsUrgentes
            });
        };

        // Actualizar al cargar
        updateStats();

        // Actualizar cada 10 segundos
        const interval = setInterval(updateStats, 10000);

        // Escuchar eventos de nuevas órdenes
        const handleNewOrder = (event: CustomEvent) => {
            console.log('🔔 Nueva orden recibida en sidebar cocina:', event.detail);
            updateStats();
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'new_order') {
                console.log('🔄 Storage change detectado en sidebar cocina');
                updateStats();
            }
        };

        window.addEventListener('newOrder', handleNewOrder as EventListener);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('newOrder', handleNewOrder as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return (
        <>
        <aside className={`bg-white dark:bg-slate-800 shadow-lg flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="p-3 text-center border-b dark:border-slate-700 h-[65px] flex items-center justify-center overflow-hidden">
                <h1 className={`text-xl font-bold text-orange-500 whitespace-nowrap transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>🍳 Cocina</h1>
                <h1 className={`text-xl font-bold text-orange-500 absolute transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>🍳</h1>
            </div>
            <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                {COCINA_NAV_ITEMS.map(item => {
                    const isActive = location.pathname === item.to;
                    return (
                        <a
                            key={item.to}
                            href={item.to}
                            className={`${baseLinkClasses} ${isActive ? activeLinkClasses : `${item.color} ${hoverClasses}`}`}
                        >
                            <div className="flex-shrink-0">{item.icon}</div>
                            <span className={`whitespace-nowrap transition-opacity duration-200 text-sm ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>{item.text}</span>
                        </a>
                    );
                })}

                {/* Panel de estadísticas (solo visible cuando está expandido) */}
                {isSidebarOpen && (
                    <div className="mt-4 space-y-2">
                        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                            <h4 className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                Actividad en Tiempo Real
                            </h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Órdenes:</span>
                                    <span className="font-medium text-orange-600 dark:text-orange-400">{stats.ordenesTotal}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Pendientes:</span>
                                    <span className="font-medium text-red-600 dark:text-red-400">{stats.itemsPendientes}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Preparando:</span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">{stats.itemsPreparando}</span>
                                </div>
                                {stats.itemsUrgentes > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Urgentes:</span>
                                        <span className="font-medium text-red-600 dark:text-red-400 animate-pulse">{stats.itemsUrgentes}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </nav>

            <div className="p-2 border-t dark:border-slate-700">
                <Menu as="div" className="relative w-full text-left">
                    <div>
                        <Menu.Button className="group w-full flex items-center gap-3 rounded-md p-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                            <img src={getAvatarUrl()} className="w-8 h-8 rounded-full flex-shrink-0" alt="Cocinero avatar" />
                            <div className={`flex-grow text-left overflow-hidden transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.usuario}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Cocinero</p>
                            </div>
                            <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`} />
                        </Menu.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute bottom-full left-0 mb-2 w-full origin-bottom-left rounded-md bg-white dark:bg-slate-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div className="py-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={() => setIsProfileModalOpen(true)}
                                            className={`${
                                                active ? 'bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'
                                            } group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-200`}
                                        >
                                            <UserIcon className="h-4 w-4" />
                                            Editar Perfil
                                        </button>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={onLogout}
                                            className={`${
                                                active ? 'bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'
                                            } group flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-200`}
                                        >
                                            <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                                            Cerrar Sesión
                                        </button>
                                    )}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>
        </aside>

        {/* Modal de Editar Perfil */}
        <ProfileEditModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            onSuccess={(updatedUser) => {
                setIsProfileModalOpen(false);
                if (onProfileUpdate && updatedUser) {
                    onProfileUpdate(updatedUser);
                }
            }}
        />
        </>
    );
}
