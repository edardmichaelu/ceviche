import { useLocation } from 'react-router-dom';
import {
    SunIcon,
    MoonIcon,
    Bars3Icon
} from '@heroicons/react/24/outline';

// Mapeo de rutas a títulos
const viewTitles: { [key: string]: string } = {
    '/caja': 'Cobrar Órdenes',
    '/caja/dashboard': 'Dashboard de Caja',
    '/caja/historial': 'Historial de Pagos',
    '/caja/reportes': 'Reportes',
};

interface CajaHeaderProps {
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onToggleSidebar: () => void;
    user: { usuario: string; avatar?: string | null; };
}

export default function CajaHeader({ isDarkMode, setIsDarkMode, onToggleSidebar, user }: CajaHeaderProps) {
    const location = useLocation();
    const title = viewTitles[location.pathname] || 'Panel de Caja';

    return (
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 h-[65px]">
            <div className="flex items-center justify-between px-4 py-3 h-full">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Bars3Icon className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/10 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">En línea</span>
                    </div>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                        {isDarkMode ? (
                            <SunIcon className="h-5 w-5" />
                        ) : (
                            <MoonIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}

// También exportación con nombre para compatibilidad con imports anteriores
export { CajaHeader };

