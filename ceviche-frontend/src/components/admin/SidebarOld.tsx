import { NavLink } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
    HomeIcon,
    BuildingStorefrontIcon,
    CalendarIcon,
    UsersIcon,
    ArrowLeftOnRectangleIcon,
    ChevronDownIcon,
    DocumentTextIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/solid';

const NAV_ITEMS = [
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
        to: '/admin/calendario', 
        text: 'Calendario', 
        icon: (
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
        ), 
        color: 'text-purple-500' 
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
        to: '/admin/auditoria', 
        text: 'Panel de Auditoría', 
        icon: (
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <DocumentTextIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
        ), 
        color: 'text-orange-500' 
    },
];

interface SidebarProps {
    user: { usuario: string; };
    onLogout: () => void;
    isSidebarOpen: boolean;
}

export function Sidebar({ user, onLogout, isSidebarOpen }: SidebarProps) {
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
                {NAV_ITEMS.map(item => (
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