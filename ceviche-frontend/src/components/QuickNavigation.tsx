import React from 'react';
import { motion } from 'framer-motion';
import { 
  HomeIcon,
  TableCellsIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface QuickNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalItems?: number;
  totalMesas?: number;
  mesasOcupadas?: number;
  showCart?: boolean;
}

export const QuickNavigation: React.FC<QuickNavigationProps> = ({
  activeTab,
  onTabChange,
  totalItems = 0,
  totalMesas = 0,
  mesasOcupadas = 0,
  showCart = true
}) => {
  let navItems = [
    {
      id: 'mesas',
      label: 'Mesas',
      icon: TableCellsIcon,
      color: 'bg-blue-500',
      count: totalMesas,
      description: 'Gestionar mesas'
    },
    {
      id: 'categorias',
      label: 'Menú',
      icon: HomeIcon,
      color: 'bg-green-500',
      count: null,
      description: 'Ver categorías'
    },
    {
      id: 'carrito',
      label: 'Carrito',
      icon: ShoppingCartIcon,
      color: 'bg-orange-500',
      count: totalItems,
      description: 'Ver pedido'
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      count: mesasOcupadas,
      description: 'Gestionar clientes'
    },
    {
      id: 'tiempo',
      label: 'Tiempo',
      icon: ClockIcon,
      color: 'bg-yellow-500',
      count: null,
      description: 'Ver tiempos'
    },
    {
      id: 'estadisticas',
      label: 'Stats',
      icon: ChartBarIcon,
      color: 'bg-gray-500',
      count: null,
      description: 'Ver estadísticas'
    }
  ];

  if (!showCart) {
    navItems = navItems.filter(item => item.id !== 'carrito');
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="grid grid-cols-6 gap-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(item.id)}
              className={`relative p-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? `${item.color} text-white shadow-lg` 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.count !== null && item.count > 0 && (
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                    isActive ? 'bg-white text-gray-800' : 'bg-red-500 text-white'
                  }`}>
                    {item.count > 99 ? '99+' : item.count}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickNavigation;
