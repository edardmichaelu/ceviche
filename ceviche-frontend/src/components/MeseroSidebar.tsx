import React from 'react';
import { motion } from 'framer-motion';
import {
  TableCellsIcon,
  ClockIcon,
  ChartBarIcon,
  BellIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface User {
  usuario: string;
  rol: string;
}

interface MeseroSidebarProps {
  user: User;
  onLogout: () => void;
  isSidebarOpen: boolean;
  estadisticas?: {
    totalMesas: number;
    mesasOcupadas: number;
    mesasDisponibles: number;
    mesasLimpieza: number;
  };
  notificaciones?: number;
}

export const MeseroSidebar: React.FC<MeseroSidebarProps> = ({
  user,
  onLogout,
  isSidebarOpen,
  estadisticas = { totalMesas: 0, mesasOcupadas: 0, mesasDisponibles: 0, mesasLimpieza: 0 },
  notificaciones = 0
}) => {
  const menuItems = [
    {
      id: 'mapa',
      label: 'Mapa de Mesas',
      icon: TableCellsIcon,
      description: 'Vista general del restaurante'
    },
    {
      id: 'menu-principal',
      label: 'Menú Principal',
      icon: ClipboardDocumentListIcon,
      description: 'Sistema de ventas',
      external: true
    },
    {
      id: 'ordenes',
      label: 'Órdenes Activas',
      icon: ClipboardDocumentListIcon,
      description: 'Gestión de pedidos'
    },
    {
      id: 'reservas',
      label: 'Reservas',
      icon: ClockIcon,
      description: 'Reservas del día'
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      icon: ChartBarIcon,
      description: 'Métricas y reportes'
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      icon: BellIcon,
      description: 'Alertas y avisos',
      badge: notificaciones
    }
  ];

  const baseLinkClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors duration-200";
  const hoverClasses = "hover:bg-sky-100 dark:hover:bg-slate-700";
  const activeLinkClasses = "bg-blue-600 text-white shadow-lg";

  return (
    <aside className={`bg-white dark:bg-slate-800 shadow-lg flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      {/* Header */}
      <div className="p-3 text-center border-b dark:border-slate-700 h-[65px] flex items-center justify-center overflow-hidden">
        <h1 className={`text-xl font-bold text-blue-500 whitespace-nowrap transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>🍽️ Mesero</h1>
        <h1 className={`text-xl font-bold text-blue-500 absolute transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>🍽️</h1>
      </div>

      {/* Estadísticas rápidas */}
      {isSidebarOpen && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Estado Actual</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-700 dark:text-green-400">Disponibles</span>
              </div>
              <p className="text-lg font-bold text-green-800 dark:text-green-300">{estadisticas.mesasDisponibles}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-700 dark:text-blue-400">Ocupadas</span>
              </div>
              <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{estadisticas.mesasOcupadas}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                <span className="text-xs text-yellow-700 dark:text-yellow-400">Limpieza</span>
              </div>
              <p className="text-lg font-bold text-yellow-800 dark:text-yellow-300">{estadisticas.mesasLimpieza}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <TableCellsIcon className="h-4 w-4 text-gray-600" />
                <span className="text-xs text-gray-700 dark:text-gray-400">Total</span>
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-300">{estadisticas.totalMesas}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menú de navegación */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => item.external ? window.open('/menu-principal', '_blank') : window.location.href = item.id === 'mapa' ? '/mesero/dashboard' : `/mesero/${item.id}`}
                  className={`w-full ${baseLinkClasses} ${hoverClasses} ${
                    window.location.pathname.includes(item.id)
                      ? activeLinkClasses
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className={`flex-1 text-left overflow-hidden transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>
                    <span className={`whitespace-nowrap transition-opacity duration-200 text-sm ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && isSidebarOpen && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer con usuario y configuración */}
      <div className="p-2 border-t dark:border-slate-700">
        <Menu as="div" className="relative w-full text-left">
          <div>
            <Menu.Button className="group w-full flex items-center gap-3 rounded-md p-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700">
              <img
                src={`https://ui-avatars.com/api/?name=${user.usuario.charAt(0)}&background=e2e8f0&color=475569&bold=true`}
                className="w-8 h-8 rounded-full flex-shrink-0"
                alt="Avatar"
              />
              <div className={`flex-grow text-left overflow-hidden transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0' : 'opacity-100'}`}>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.usuario}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.rol}</p>
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
};

export default MeseroSidebar;
