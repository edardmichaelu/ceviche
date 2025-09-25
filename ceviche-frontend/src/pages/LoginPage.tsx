import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

// --- Interfaces e Iconos Mejorados ---
const ICONS = {
    sun: (
        <div className="p-2 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
            <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        </div>
    ),
    moon: (
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700">
            <svg className="h-6 w-6 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        </div>
    ),
    eye: (
        <svg className="h-6 w-6 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
    ),
    eyeOff: (
        <svg className="h-6 w-6 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781z" clipRule="evenodd" />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A10.025 10.025 0 00.458 10c1.274 4.057 5.022 7 9.542 7 1.853 0 3.579-.498 5.042-1.374l-1.557-1.557z" />
        </svg>
    )
};

interface LoginPageProps {
  onLoginSuccess: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export function LoginPage({ onLoginSuccess, isDarkMode, setIsDarkMode }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error('El usuario y la contraseña son obligatorios.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      console.log('Login attempt:', { identifier, password });
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        toast.success(`¡Bienvenido de vuelta, ${data.usuario.usuario}!`);
        setTimeout(() => toast('Tu sesión se cerrará tras 5 minutos de inactividad.', { icon: '🕒' }), 1000);
        sessionStorage.setItem('accessToken', data.access_token);
        sessionStorage.setItem('userData', JSON.stringify(data.usuario));
        onLoginSuccess(); // Notifica al componente padre que el login fue exitoso
      } else {
        toast.error(data.error || 'Ocurrió un error inesperado.');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-6 relative">
      <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-6 right-6 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-110">
        {isDarkMode ? ICONS.sun : ICONS.moon}
      </button>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="w-full max-w-md bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">🐟 Cevicheria</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Bienvenido de nuevo, ingresa a tu cuenta</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="identifier">Usuario o Correo</label>
            <input id="identifier" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg border-2 border-transparent focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-300" placeholder="ej: mozo1" disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="password">Contraseña</label>
            <div className="relative">
              <input id="password" type={isPasswordVisible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg border-2 border-transparent focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-300" placeholder="••••••••" disabled={isLoading} />
              <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                {isPasswordVisible ? ICONS.eye : ICONS.eyeOff}
              </button>
            </div>
          </div>
          <div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center p-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed">
              {isLoading ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 'Ingresar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
