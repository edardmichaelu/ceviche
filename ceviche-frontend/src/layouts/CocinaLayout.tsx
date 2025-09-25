import React, { useState, useEffect } from 'react';
import { CocinaSidebar } from '../components/cocina/CocinaSidebar';
import { CocinaHeader } from '../components/cocina/CocinaHeader';
import { Outlet } from 'react-router-dom';

interface User {
    id: number;
    usuario: string;
    rol: string;
    estacion?: string;
    avatar?: string | null;
    correo?: string;
    activo?: boolean;
}

interface CocinaLayoutProps {
    user: User | null;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onLogout: () => void;
    onProfileUpdate: (updatedUser: { usuario: string; avatar?: string | null; }) => void;
}

// === LAYOUT ESPECÍFICO PARA COCINA ===
export function CocinaLayout({ user, isDarkMode, setIsDarkMode, onLogout, onProfileUpdate }: CocinaLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(user);

    // Sincronizar currentUser cuando cambie la prop user
    useEffect(() => {
        setCurrentUser(user);
    }, [user]);

    const handleToggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const handleProfileUpdate = (updatedUser: { usuario: string; avatar?: string | null; }) => {
        if (currentUser) {
            const newUserData = {
                ...currentUser,
                ...updatedUser
            };
            setCurrentUser(newUserData);

            // Actualizar sessionStorage para persistir el avatar
            sessionStorage.setItem('userData', JSON.stringify(newUserData));
        }
    };

    if (!user) {
        return null; // O un spinner de carga
    }

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <CocinaSidebar
                user={currentUser}
                onLogout={onLogout}
                isSidebarOpen={isSidebarOpen}
                isHeaderVisible={true}
                onProfileUpdate={onProfileUpdate}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <CocinaHeader
                    onToggleSidebar={handleToggleSidebar}
                    user={currentUser}
                />

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
