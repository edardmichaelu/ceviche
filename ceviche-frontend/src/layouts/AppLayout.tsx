import { Navigate, Outlet } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { MainLayout } from './MainLayout';
import { MeseroLayout } from './MeseroLayout';
import CajaLayout from './CajaLayout';

// --- Interfaces ---
interface User {
    id: number;
    usuario: string;
    rol: string;
    estacion?: string;
}

interface AppLayoutProps {
    user: User | null;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onLogout: () => void;
}

export function AppLayout({ user, isDarkMode, setIsDarkMode, onLogout }: AppLayoutProps) {
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Decide qué layout renderizar basado en el rol del usuario
    switch (user.rol) {
        case 'admin':
            return <AdminLayout user={user} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={onLogout} />;
        case 'mozo':
        case 'mesero':
            return <MeseroLayout user={user} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={onLogout} />;
        case 'caja':
            return <CajaLayout user={user} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={onLogout} />;
        default:
            // Si el rol no tiene un layout específico, lo redirige o muestra un error
            return <Navigate to="/login" replace />;
    }
}
