import { NavLink } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
    BanknotesIcon,
    DocumentTextIcon,
    ChartBarIcon,
    ArrowLeftOnRectangleIcon,
    ChevronDownIcon,
    ClockIcon,
    ReceiptRefundIcon,
    CalculatorIcon
} from '@heroicons/react/24/solid';

const CAJA_NAV_ITEMS = [
    {
        to: '/caja',
        text: 'Cobrar Órdenes',
        icon: (
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <BanknotesIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
        ),
        color: 'text-green-600 dark:text-green-400'
    },
    {
        to: '/caja/dashboard',
        text: 'Dashboard de Caja',
        icon: (
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
        ),
        color: 'text-blue-600 dark:text-blue-400'
    },
    {
        to: '/caja/historial',
        text: 'Historial de Pagos',
        icon: (
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <DocumentTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
        ),
        color: 'text-purple-600 dark:text-purple-400'
    },
    {
        to: '/caja/reportes',
        text: 'Reportes',
        icon: (
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <CalculatorIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
        ),
        color: 'text-orange-600 dark:text-orange-400'
    }
];

interface CajaSidebarProps {
    user: { usuario: string; };
    onLogout: () => void;
    isSidebarOpen: boolean;
}

export function CajaSidebar({ user, onLogout, isSidebarOpen }: CajaSidebarProps) {
    const baseLinkClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors duration-200";
    const hoverClasses = "hover:bg-green-100 dark:hover:bg-slate-700";
    const activeLinkClasses = "bg-green-600 text-white shadow-lg";

    return (
        <aside className={`bg-white dark:bg-slate-800 shadow-lg flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="p-3 text-center border-b dark:border-slate-700 h-[65px] flex items-center justify-center overflow-hidden">
                <h1 className={`text-xl font-bold text-green-500 whitespace-nowrap transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>💰 Caja</h1>
                <h1 className={`text-xl font-bold text-green-500 absolute transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>💰</h1>
            </div>

            <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
                {CAJA_NAV_ITEMS.map(item => (
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

                {/* Panel de estadísticas en tiempo real */}
                {isSidebarOpen && (
                    <div className="mt-4 space-y-2">
                        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 border border-green-200 dark:border-green-800">
                            <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                Estado Actual
                            </h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Pendientes:</span>
                                    <span className="font-medium text-red-600 dark:text-red-400">5</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Hoy:</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">S/ 2,450</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Mes:</span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">S/ 75,000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <div className="p-2 border-t dark:border-slate-700">
                <Menu as="div" className="relative w-full text-left">
                    <div>
                        <Menu.Button className="group w-full flex items-center gap-3 rounded-md p-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                            <img src={`https://ui-avatars.com/api/?name=${user.usuario.charAt(0)}&background=e2e8f0&color=475569&bold=true`} className="w-8 h-8 rounded-full flex-shrink-0" alt="Cajero avatar" />
                            <div className={`flex-grow text-left overflow-hidden transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.usuario}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Cajero</p>
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

export default CajaSidebar;
