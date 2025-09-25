import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CajaSidebar from '../components/caja/CajaSidebar';
import CajaHeader from '../components/caja/CajaHeader';

interface User {
    usuario: string;
    rol: string;
}

interface CajaLayoutProps {
    user: User | null;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onLogout: () => void;
}

// === LAYOUT ESPECÍFICO PARA CAJA ===
export function CajaLayout({ user, isDarkMode, setIsDarkMode, onLogout }: CajaLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleToggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    if (!user) {
        return null; // O un spinner de carga
    }

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <CajaSidebar
                user={user}
                onLogout={onLogout}
                isSidebarOpen={isSidebarOpen}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <CajaHeader
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    onToggleSidebar={handleToggleSidebar}
                    user={user}
                />

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default CajaLayout;

