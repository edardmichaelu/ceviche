import { useLocation } from 'react-router-dom';
import { Bars3Icon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

// Mapeo de rutas a títulos
const viewTitles: { [key: string]: string } = {
    '/admin': 'Dashboard',
    '/admin/menu': 'Gestión de Menú',
    '/admin/local': 'Configurar Local',
    '/admin/ventas': 'Historial de Ventas',
    '/admin/usuarios': 'Gestionar Usuarios',
    '/admin/ordenes': 'Gestión de Órdenes',
};


interface HeaderProps {
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onToggleSidebar: () => void;
}

export function Header({ isDarkMode, setIsDarkMode, onToggleSidebar }: HeaderProps) {
    const location = useLocation();
    const title = viewTitles[location.pathname] || 'Administración';

    return (
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 flex justify-between items-center border-b dark:border-slate-700 h-[65px]">
            <div className="flex items-center gap-4">
                <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Bars3Icon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                {isDarkMode ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-slate-600" />}
            </button>
        </header>
    );
}
