import React, { useState } from 'react';
import { CocinaSidebar } from '../components/cocina/CocinaSidebar';
import { CocinaHeader } from '../components/cocina/CocinaHeader';
import { Outlet } from 'react-router-dom';

interface User {
    usuario: string;
}

interface CocinaLayoutProps {
    user: User | null;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onLogout: () => void;
}

// === LAYOUT ESPECÍFICO PARA COCINA ===
export function CocinaLayout({ user, isDarkMode, setIsDarkMode, onLogout }: CocinaLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleToggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    if (!user) {
        return null; // O un spinner de carga
    }

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <CocinaSidebar
                user={user}
                onLogout={onLogout}
                isSidebarOpen={isSidebarOpen}
                isHeaderVisible={true}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <CocinaHeader
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
