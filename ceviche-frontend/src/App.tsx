import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useTheme } from './hooks/useTheme';

// Importación de Páginas y Layouts
import { LoginPage } from './pages/LoginPage';
import { AppLayout } from './layouts/AppLayout';
import { MeseroLayout } from './layouts/MeseroLayout';
import { CocinaLayout } from './layouts/CocinaLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { CajaPage } from './pages/CajaPage';
import VentaRapidaPage from './pages/VentaRapidaPage';
import MenuPrincipalPage from './pages/MenuPrincipalPage';
import CartaPublicaPage from './pages/CartaPublicaPage';
import CartaQRPage from './pages/CartaQRPage';
import PedidoActualPage from './pages/PedidoActualPage';
import MesasPage from './pages/MesasPage';
import CategoriasPage from './pages/CategoriasPage';
import ProductosPage from './pages/ProductosPage';
import CocinaPage from './pages/CocinaPage';
import OrdenesDetalladasPage from './pages/OrdenesDetalladasPage';
import OrdenesDetalladasMeseroPage from './pages/OrdenesDetalladasMeseroPage';
import AuditDashboardPage from './pages/AuditDashboardPage';
import LocalManagementPage from './pages/LocalManagementPage';
import ReservasPage from './pages/ReservasPage';
import BloqueosPage from './pages/BloqueosPage';
import CalendarioPage from './pages/CalendarioPage';
import CategoriaManagementPage from './pages/CategoriaManagementPage';
import ProductoManagementPage from './pages/ProductoManagementPage';
import IngredienteManagementPage from './pages/IngredienteManagementPage';
import TipoIngredienteManagementPage from './pages/TipoIngredienteManagementPage';
import ProductoIngredienteManagementPage from './pages/ProductoIngredienteManagementPage';
import AdminOrdenesPage from './pages/AdminOrdenesPage';
import { InactivityManager } from './components/InactivityManager';

// --- Interfaces y Tipos ---
interface User {
  id: number;
  usuario: string;
  rol: string;
  estacion?: string;
}

// --- Componente Principal de la Aplicación ---
function App() {
  // ... (Estados y Efectos existentes se mantienen igual)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && typeof parsedUser === 'object') {
          setCurrentUser(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing userData:', error);
        sessionStorage.removeItem('userData');
      }
    }
    setIsAuthCheckComplete(true);
  }, []);

  useEffect(() => {
    setIsDarkMode(isDark);
  }, [isDark]);

  const handleLoginSuccess = () => {
    const userData = sessionStorage.getItem('userData');
    if (userData) setCurrentUser(JSON.parse(userData));
  };

  const handleLogout = () => {
    toast.success('Sesión cerrada correctamente.');
    sessionStorage.clear();
    setCurrentUser(null);
  };

  if (!isAuthCheckComplete) {
    return <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-900" />;
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <Toaster position="top-right" toastOptions={{ style: { background: isDark ? '#334155' : '' , color: isDark ? '#fff' : '' } }} />
      {currentUser && <InactivityManager onLogout={handleLogout} />}
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas (no requieren login) */}
          <Route path="/carta" element={<CartaPublicaPage />} />
          <Route path="/carta-qr" element={<CartaQRPage />} />

          <Route
            path="/login"
            element={
              currentUser ? <Navigate to="/" /> : <LoginPage onLoginSuccess={handleLoginSuccess} isDarkMode={isDark} setIsDarkMode={setIsDarkMode} />
            }
          />

          {/* Redirección raíz por rol (evita usar index dentro de /* para prevenir bucles) */}
          <Route
            path="/"
            element={
              !currentUser ? <Navigate to="/login" replace /> : (
                currentUser.rol === 'admin' ? <Navigate to="/admin" replace /> :
                currentUser.rol === 'caja' ? <Navigate to="/caja" replace /> :
                (currentUser.rol === 'mozo' || currentUser.rol === 'mesero') ? <Navigate to="/mesero" replace /> :
                currentUser.rol === 'cocina' ? <Navigate to="/cocina" replace /> :
                <div>Rol no reconocido</div>
              )
            }
          />

          {/* Rutas del Mesero con su propio Layout */}
          <Route
            path="/mesero/*"
            element={
              !currentUser || (currentUser.rol !== 'mozo' && currentUser.rol !== 'mesero') ?
              <Navigate to="/login" replace /> :
              <MeseroLayout user={currentUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} />
            }
          >
            <Route index element={<VentaRapidaPage />} />
            <Route path="mesas" element={<MesasPage />} />
            <Route path="categorias" element={<CategoriasPage />} />
            <Route path="productos" element={<ProductosPage />} />
            <Route path="pedido" element={<PedidoActualPage />} />
            <Route path="ordenes-detalladas" element={<OrdenesDetalladasMeseroPage />} />
            <Route path="ordenes" element={<div>Órdenes - Próximamente</div>} />
            <Route path="reservas" element={<div>Reservas - Próximamente</div>} />
            <Route path="estadisticas" element={<div>Estadísticas - Próximamente</div>} />
            <Route path="notificaciones" element={<div>Notificaciones - Próximamente</div>} />
          </Route>

          {/* Rutas de Cocina con su propio Layout (fuera de AppLayout para evitar bucles) */}
          <Route
            path="/cocina/*"
            element={
              !currentUser || (currentUser.rol !== 'cocina' && currentUser.rol !== 'admin') ?
              <Navigate to="/login" replace /> :
              <CocinaLayout user={currentUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} />
            }
          >
            <Route index element={<CocinaPage />} />
            <Route path="ordenes-detalladas" element={<OrdenesDetalladasPage />} />
          </Route>

          {/* Rutas de Admin con su propio Layout */}
          <Route
            path="/admin/*"
            element={
              !currentUser || currentUser.rol !== 'admin' ?
              <Navigate to="/login" replace /> :
              <AdminLayout user={currentUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} />
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="usuarios" element={<UserManagementPage />} />
            <Route path="auditoria" element={<AuditDashboardPage />} />
            <Route path="local" element={<LocalManagementPage />} />
            <Route path="reservas" element={<ReservasPage />} />
            <Route path="bloqueos" element={<BloqueosPage />} />
            <Route path="calendario" element={<CalendarioPage />} />
            <Route path="categorias" element={<CategoriaManagementPage />} />
            <Route path="productos" element={<ProductoManagementPage />} />
            <Route path="ingredientes" element={<IngredienteManagementPage />} />
            <Route path="tipos-ingrediente" element={<TipoIngredienteManagementPage />} />
            <Route path="producto-ingrediente" element={<ProductoIngredienteManagementPage />} />
            <Route path="ordenes" element={<AdminOrdenesPage />} />
          </Route>

          {/* Ruta Principal Protegida que renderiza el Layout apropiado (MESERO/CAJA) */}
          <Route
            path="/*"
            element={
              !currentUser ? <Navigate to="/login" replace /> : <AppLayout user={currentUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} />
            }
          >
            <Route path="caja" element={<CajaPage />} />
            <Route path="menu-principal" element={<MenuPrincipalPage />} />

            {/* (Sin index redirect aquí para evitar bucles) */}
          </Route>

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
