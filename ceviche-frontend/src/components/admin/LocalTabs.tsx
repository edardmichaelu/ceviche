import React from 'react';
import { motion } from 'framer-motion';
import { BuildingOfficeIcon, MapIcon, TableCellsIcon } from '@heroicons/react/24/outline';

interface LocalTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pisosCount: number;
  zonasCount: number;
  mesasCount: number;
}

const LocalTabs: React.FC<LocalTabsProps> = ({
  activeTab,
  onTabChange,
  pisosCount,
  zonasCount,
  mesasCount
}) => {
  const tabs = [
    {
      id: 'pisos',
      name: 'Pisos',
      icon: BuildingOfficeIcon,
      count: pisosCount,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'zonas',
      name: 'Zonas',
      icon: MapIcon,
      count: zonasCount,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'mesas',
      name: 'Mesas',
      icon: TableCellsIcon,
      count: mesasCount,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                transition-all duration-200 font-medium text-sm
                ${isActive
                  ? `${tab.color} text-white shadow-lg`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
                ${tab.hoverColor}
              `}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.name}</span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-semibold
                ${isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }
              `}>
                {tab.count}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default LocalTabs;
