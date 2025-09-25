import { NavLink } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import {
    HomeIcon,
    BuildingStorefrontIcon,
    CalendarIcon,
    UsersIcon,
    ArrowLeftOnRectangleIcon,
    ChevronDownIcon,
    DocumentTextIcon,
    CalendarDaysIcon,
    ExclamationTriangleIcon,
    ChevronRightIcon,
    TagIcon,
    CubeIcon,
    BeakerIcon,
    LinkIcon
} from '@heroicons/react/24/solid';

const MAIN_NAV_ITEMS = [
    { 
        to: '/admin', 
        text: 'Dashboard', 
        icon: (
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/20">
                <HomeIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
        ), 
        color: 'text-sky-500' 
    },
    { 
        to: '/admin/local', 
        text: 'Configurar Local', 
        icon: (
            <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                <BuildingStorefrontIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
        ), 
        color: 'text-green-500' 
    },
    { 
        to: '/admin/usuarios', 
        text: 'Gestionar Usuarios', 
        icon: (
            <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                <UsersIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
        ), 
        color: 'text-pink-500' 
    },
    { 
        to: '/admin/categorias', 
        text: 'Gestión de Categorías', 
        icon: (
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                <TagIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
        ), 
        color: 'text-indigo-500' 
    },
    {
        to: '/admin/productos',
        text: 'Gestión de Productos',
        icon: (
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <CubeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
        ),
        color: 'text-blue-500'
    },
    {
        to: '/admin/ordenes',
        text: 'Gestión de Órdenes',
        icon: (
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <DocumentTextIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
        ),
        color: 'text-emerald-500'
    },
    { 
        to: '/admin/auditoria', 
        text: 'Panel de Auditoría', 
        icon: (
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <DocumentTextIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
        ), 
        color: 'text-orange-500' 
    }
];

const INGREDIENTES_MENU_ITEMS = [
    {
        to: '/admin/ingredientes',
        text: 'Gestión de Ingredientes',
        icon: (
            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <BeakerIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
        )
    },
    {
        to: '/admin/tipos-ingrediente',
        text: 'Tipos de Ingrediente',
        icon: (
            <div className="p-1 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                <TagIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
        )
    },
    {
        to: '/admin/producto-ingrediente',
        text: 'Producto-Ingrediente',
        icon: (
            <div className="p-1 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                <LinkIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
        )
    }
];

const RESERVAS_MENU_ITEMS = [
    {
        to: '/admin/calendario',
        text: 'Calendario',
        icon: (
            <div className="p-1 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <CalendarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
        )
    },
    {
        to: '/admin/reservas',
        text: 'Gestión de Reservas',
        icon: (
            <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <CalendarDaysIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
        )
    },
    {
        to: '/admin/bloqueos',
        text: 'Gestión de Bloqueos',
        icon: (
            <div className="p-1 rounded-lg bg-red-50 dark:bg-red-900/20">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
        )
    }
];

interface SidebarProps {
    user: { usuario: string; };
    onLogout: () => void;
    isSidebarOpen: boolean;
}

export function Sidebar({ user, onLogout, isSidebarOpen }: SidebarProps) {
    const [isReservasOpen, setIsReservasOpen] = useState(false);
    const [isIngredientesOpen, setIsIngredientesOpen] = useState(false);
    
    const baseLinkClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors duration-200";
    const hoverClasses = "hover:bg-sky-100 dark:hover:bg-slate-700";
    const activeLinkClasses = "bg-blue-600 text-white shadow-lg";

    return (
        <aside className={`bg-white dark:bg-slate-800 shadow-lg flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="p-3 text-center border-b dark:border-slate-700 h-[65px] flex items-center justify-center overflow-hidden">
                <h1 className={`text-xl font-bold text-blue-500 whitespace-nowrap transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>🐟 Cevicheria</h1>
                <h1 className={`text-xl font-bold text-blue-500 absolute transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>🐟</h1>
            </div>
            <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                {MAIN_NAV_ITEMS.map(item => (
                    <NavLink 
                        key={item.to}
                        to={item.to}
                        end
                        className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : `${item.color} ${hoverClasses}`}`}
                        title={!isSidebarOpen ? item.text : ''}
                    >
                        <div className="flex-shrink-0">{item.icon}</div>
                        <span className={`whitespace-nowrap transition-opacity duration-200 text-sm ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>{item.text}</span>
                    </NavLink>
                ))}

                {/* Menú desplegable de Reservas y Bloqueos */}
                {isSidebarOpen && (
                    <div className="mt-2">
                        <button
                            onClick={() => setIsReservasOpen(!isReservasOpen)}
                            className={`w-full ${baseLinkClasses} ${hoverClasses} text-gray-700 dark:text-gray-200`}
                        >
                            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                                <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="flex-grow text-left text-sm">Reservas & Bloqueos</span>
                            <ChevronRightIcon className={`h-4 w-4 transition-transform duration-200 ${isReservasOpen ? 'rotate-90' : ''}`} />
                        </button>
                        
                        <Transition
                            show={isReservasOpen}
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-150"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <div className="ml-4 mt-1 space-y-1">
                                {RESERVAS_MENU_ITEMS.map(item => (
                                    <NavLink 
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) => 
                                            `${baseLinkClasses} text-sm ${isActive ? activeLinkClasses : `text-gray-600 dark:text-gray-300 ${hoverClasses}`}`
                                        }
                                    >
                                        <div className="flex-shrink-0">{item.icon}</div>
                                        <span className="whitespace-nowrap">{item.text}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </Transition>
                    </div>
                )}

                {/* Menú desplegable de Ingredientes */}
                {isSidebarOpen && (
                    <div className="mt-2">
                        <button
                            onClick={() => setIsIngredientesOpen(!isIngredientesOpen)}
                            className={`w-full ${baseLinkClasses} ${hoverClasses} text-gray-700 dark:text-gray-200`}
                        >
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                <BeakerIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="flex-grow text-left text-sm">Gestión de Ingredientes</span>
                            <ChevronRightIcon className={`h-4 w-4 transition-transform duration-200 ${isIngredientesOpen ? 'rotate-90' : ''}`} />
                        </button>

                        <Transition
                            show={isIngredientesOpen}
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-150"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <div className="ml-4 mt-1 space-y-1">
                                {INGREDIENTES_MENU_ITEMS.map(item => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) =>
                                            `${baseLinkClasses} text-sm ${isActive ? activeLinkClasses : `text-gray-600 dark:text-gray-300 ${hoverClasses}`}`
                                        }
                                    >
                                        <div className="flex-shrink-0">{item.icon}</div>
                                        <span className="whitespace-nowrap">{item.text}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </Transition>
                    </div>
                )}
            </nav>
            
            <div className="p-2 border-t dark:border-slate-700">
                <Menu as="div" className="relative w-full text-left">
                    <div>
                        <Menu.Button className="group w-full flex items-center gap-3 rounded-md p-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                            <img src={`https://ui-avatars.com/api/?name=${user.usuario.charAt(0)}&background=e2e8f0&color=475569&bold=true`} className="w-8 h-8 rounded-full flex-shrink-0" alt="Admin avatar" />
                            <div className={`flex-grow text-left overflow-hidden transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.usuario}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Administrador</p>
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
    );
}
