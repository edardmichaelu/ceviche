import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { MeseroSidebar } from '../components/mesero/MeseroSidebar';
import { MeseroHeader } from '../components/mesero/MeseroHeader';
import { PedidoProvider } from '../contexts/PedidoContext';

interface User {
    id: number;
    usuario: string;
    rol: string;
    estacion?: string;
    avatar?: string | null;
    correo?: string;
    activo?: boolean;
}

interface MeseroLayoutProps {
    user: User | null;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onLogout: () => void;
    onProfileUpdate: (updatedUser: { usuario: string; avatar?: string | null; }) => void;
}

export function MeseroLayout({ user, isDarkMode, setIsDarkMode, onLogout, onProfileUpdate }: MeseroLayoutProps) {
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
    return <Navigate to="/login" replace />;
  }

  return (
    <PedidoProvider>
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <MeseroSidebar
          user={currentUser}
          onLogout={onLogout}
          isSidebarOpen={isSidebarOpen}
          onProfileUpdate={onProfileUpdate}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <MeseroHeader
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            onToggleSidebar={handleToggleSidebar}
            user={currentUser}
          />

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </PedidoProvider>
  );
}
