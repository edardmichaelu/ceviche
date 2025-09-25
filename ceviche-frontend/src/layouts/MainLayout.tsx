import { Outlet, useLocation } from 'react-router-dom';
import { SunIcon, MoonIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';
import { CocinaLayout } from './CocinaLayout';

// --- Interfaces ---
interface User {
    usuario: string;
    rol: string;
}

interface MainLayoutProps {
    user: User | null;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onLogout: () => void;
}

// --- Mapeo de Títulos ---
const viewTitles: { [key: string]: string } = {
    '/caja': 'Panel de Caja',
    '/mesero': 'Vista de Mesas',
};

export function MainLayout({ user, isDarkMode, setIsDarkMode, onLogout }: MainLayoutProps) {
  const location = useLocation();
  const title = viewTitles[location.pathname] || 'Dashboard';

  if (!user) {
    return null; // O un spinner
  }

  // Nota: Las rutas de cocina ahora están manejadas por rutas específicas en App.tsx
  // No necesitamos verificar /cocina aquí ya que tienen su propio layout

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-900">
        <header className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex-shrink-0 m-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{title}</h1>
            <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{user.rol}: {user.usuario}</span>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    {isDarkMode ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-slate-600" />}
                </button>
                <button onClick={onLogout} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Cerrar Sesión">
                    <ArrowLeftOnRectangleIcon className="h-6 w-6 text-red-500" />
                </button>
            </div>
        </header>
        <main className="flex-grow overflow-hidden">
            {/* Outlet renderizará la página anidada (CajaPage o MeseroPage) */}
            <Outlet />
        </main>
    </div>
  );
}
