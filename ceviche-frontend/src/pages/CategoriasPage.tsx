import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../apiClient';
import { ErrorHandler } from '../utils/errorHandler';

interface Categoria {
    id: number;
    nombre: string;
    descripcion?: string;
    color: string;
    icono: string;
    orden?: number;
    activo: boolean;
}

const CategoriasPage: React.FC = () => {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Verificar autenticación
        const token = sessionStorage.getItem('accessToken');
        const userData = sessionStorage.getItem('userData');

        if (token && userData) {
            const user = JSON.parse(userData);
            console.log('👤 Usuario autenticado:', user);

            // Verificar si el usuario tiene permisos para acceder a esta página
            if (user.rol === 'admin') {
                // Si es admin, redirigir a la página de administración
                console.log('🔄 Redirigiendo admin a /admin/categorias');
                navigate('/admin/categorias', { replace: true });
                return;
            } else if (!['mesero', 'mozo'].includes(user.rol)) {
                // Si no es mesero ni mozo, mostrar error
                console.error('❌ Usuario sin permisos:', user.rol);
                setError('Acceso denegado. Se requiere rol de Mesero o Mozo.');
                setLoading(false);
                return;
            }

            console.log('✅ Usuario autorizado, cargando categorías...');
            setIsAuthenticated(true);
            loadCategorias();
        } else {
            console.error('❌ Usuario no autenticado');
            setIsAuthenticated(false);
            setError('No autenticado. Inicie sesión para acceder a las categorías.');
            setLoading(false);
        }
    }, [navigate]);

    const loadCategorias = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Cargando categorías...');
            const response = await apiClient.get('/api/categoria/');
            console.log('📥 Respuesta de API:', response);

            const categoriasData = ErrorHandler.processApiResponse(response);
            console.log('🔍 Datos procesados:', categoriasData);

            if (ErrorHandler.isSuccessResponse(categoriasData)) {
                const categoriasArray = Array.isArray(categoriasData.data) ? categoriasData.data :
                                      Array.isArray(categoriasData.categorias) ? categoriasData.categorias :
                                      Array.isArray(categoriasData) ? categoriasData : [];
                console.log('📋 Array de categorías:', categoriasArray);

                // Ordenar por el campo 'orden'
                const filteredAndSorted = categoriasArray.filter((c: Categoria) => c.activo).sort((a, b) => (a.orden || 0) - (b.orden || 0));
                console.log('✅ Categorías filtradas y ordenadas:', filteredAndSorted);

                setCategorias(filteredAndSorted);
            } else {
                console.error('❌ Respuesta de API no exitosa:', categoriasData);
                setError('Error en la respuesta de la API');
            }
        } catch (error: any) {
            console.error('❌ Error al cargar categorías:', error);

            if (error.response?.status === 403) {
                setError('Acceso denegado. Se requiere rol de Administrador.');
            } else {
                setError(error.message || 'Error al cargar categorías');
            }

            ErrorHandler.logError('cargar categorías', error);
            const errorMessage = ErrorHandler.showErrorNotification(error, 'cargar categorías');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoriaClick = (categoria: Categoria) => {
        // Navegar a productos con la categoría seleccionada
        navigate(`/mesero/productos?categoria=${categoria.id}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        🍽️ Categorías de Productos
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Selecciona una categoría para explorar sus productos
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                    <div className="text-red-600 dark:text-red-400 text-6xl mb-4">🚫</div>
                    <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
                        {error.includes('No autenticado') ? 'Sesión Expirada' : 'Acceso Denegado'}
                    </h3>
                    <p className="text-red-600 dark:text-red-400 text-lg">
                        {error}
                    </p>
                    {!isAuthenticated && (
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Ir al Login
                        </button>
                    )}
                    <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                        <p>Si ve esta página, asegúrese de estar en la URL correcta:</p>
                        <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded mt-2">
                            /mesero/categorias (para meseros)
                        </p>
                        <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded mt-1">
                            /admin/categorias (para administradores)
                        </p>
                    </div>
                </div>
            )}

            {/* Grid de Categorías */}
            {!error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categorias.map((categoria, index) => (
                        <motion.div
                            key={categoria.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCategoriaClick(categoria)}
                            className="group cursor-pointer relative overflow-hidden"
                        >
                            {/* Card principal */}
                            <div className={`relative rounded-2xl p-8 transition-all duration-300 shadow-lg hover:shadow-2xl transform group-hover:-translate-y-1 ${
                                categoria.color === 'cyan'
                                    ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500'
                                    : categoria.color === 'orange'
                                    ? 'bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500'
                                    : categoria.color === 'red'
                                    ? 'bg-gradient-to-br from-red-400 to-red-600 hover:from-red-300 hover:to-red-500'
                                    : categoria.color === 'green'
                                    ? 'bg-gradient-to-br from-green-400 to-green-600 hover:from-green-300 hover:to-green-500'
                                    : categoria.color === 'pink'
                                    ? 'bg-gradient-to-br from-pink-400 to-pink-600 hover:from-pink-300 hover:to-pink-500'
                                    : categoria.color === 'purple'
                                    ? 'bg-gradient-to-br from-purple-400 to-purple-600 hover:from-purple-300 hover:to-purple-500'
                                    : categoria.color === 'indigo'
                                    ? 'bg-gradient-to-br from-indigo-400 to-indigo-600 hover:from-indigo-300 hover:to-indigo-500'
                                    : 'bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500'
                            } text-white min-h-[200px] flex flex-col justify-between`}
                            >
                                {/* Icono grande */}
                                <div className="text-center">
                                    <div className="text-7xl mb-6 opacity-90 group-hover:scale-110 transition-transform duration-300">
                                        {categoria.icono}
                                    </div>
                                </div>

                                {/* Información */}
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold mb-2">{categoria.nombre}</h3>
                                    {categoria.descripcion && (
                                        <p className="text-sm opacity-90 leading-relaxed">{categoria.descripcion}</p>
                                    )}
                                </div>

                                {/* Flecha indicadora */}
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Overlay de hover */}
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                            </div>

                            {/* Efecto de brillo */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
                        </motion.div>
                    ))}
                </div>
            )}

            {categorias.length === 0 && !error && !loading && isAuthenticated && (
                <div className="text-center py-16">
                    <div className="text-slate-400 dark:text-slate-500 text-8xl mb-6">📂</div>
                    <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-3">
                        No hay categorías disponibles
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        No se encontraron categorías activas en el sistema
                    </p>
                    <button
                        onClick={() => loadCategorias()}
                        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            )}
        </div>
    );
};

export default CategoriasPage;
