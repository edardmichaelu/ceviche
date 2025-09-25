import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { ErrorHandler } from '../utils/errorHandler';
import { usePedido } from '../contexts/PedidoContext';
import { useNavigate } from 'react-router-dom';

interface Producto {
    id: number;
    nombre: string;
    descripcion?: string;
    precio: number;
    categoria_id: number;
    imagen_url?: string;
    disponible: boolean;
    categoria?: {
        id: number;
        nombre: string;
        color: string;
        icono: string;
    };
}

interface Categoria {
    id: number;
    nombre: string;
    descripcion?: string;
    color: string;
    icono: string;
    orden: number;
    activa: boolean;
}

const ProductosPage: React.FC = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategoria, setActiveCategoria] = useState<number | null>(null);
    const { agregarProducto, pedidoActual } = usePedido();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [productosResponse, categoriasResponse] = await Promise.all([
                apiClient.get('/api/producto/'),
                apiClient.get('/api/categoria/public')
            ]);

            const productosData = ErrorHandler.processApiResponse(productosResponse);
            const categoriasData = ErrorHandler.processApiResponse(categoriasResponse);

            if (ErrorHandler.isSuccessResponse(productosData)) {
                const productosArray = Array.isArray(productosData.data) ? productosData.data :
                                     Array.isArray(productosData.productos) ? productosData.productos :
                                     Array.isArray(productosData) ? productosData : [];
                setProductos(productosArray.filter((p: Producto) => p.disponible));
            }

            if (ErrorHandler.isSuccessResponse(categoriasData)) {
                const categoriasArray = Array.isArray(categoriasData.data) ? categoriasData.data :
                                      Array.isArray(categoriasData.categorias) ? categoriasData.categorias :
                                      Array.isArray(categoriasData) ? categoriasData : [];
                setCategorias(categoriasArray.filter((c: Categoria) => c.activa));
                if (categoriasArray.length > 0 && !activeCategoria) {
                    setActiveCategoria(categoriasArray[0].id);
                }
            }
        } catch (error: any) {
            ErrorHandler.logError('cargar productos', error);
            const errorMessage = ErrorHandler.showErrorNotification(error, 'cargar productos');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const productosFiltrados = activeCategoria
        ? productos.filter(p => p.categoria_id === activeCategoria)
        : productos;

    const handleProductoClick = (producto: Producto) => {
        if (!pedidoActual) {
            toast.error('Primero selecciona una mesa');
            navigate('/mesero/mesas');
            return;
        }

        agregarProducto({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio
        });

        toast.success(`${producto.nombre} agregado al pedido`);
    };

    const getFullImageUrl = (relativeUrl: string | null) => {
        if (!relativeUrl) return null;
        if (relativeUrl.startsWith('http')) return relativeUrl;

        const protocol = window.location.protocol;
        const host = window.location.hostname;
        const port = 5000;
        return `${protocol}//${host}:${port}${relativeUrl}`;
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Productos Disponibles
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Selecciona los productos para agregar al pedido
                        </p>
                    </div>

                    {pedidoActual && (
                        <div className="text-right">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Mesa {pedidoActual.mesa_id}</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {pedidoActual.productos.length} productos
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                S/ {pedidoActual.total.toFixed(2)}
                            </p>
                        </div>
                    )}
                </div>

                {pedidoActual && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/mesero/pedido')}
                            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Ver Pedido ({pedidoActual.productos.length})
                        </button>
                    </div>
                )}
            </div>

            {/* Categorías */}
            {categorias.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Filtrar por Categoría
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setActiveCategoria(null)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeCategoria === null
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            Todos los productos
                        </button>
                        {categorias.map((categoria) => (
                            <button
                                key={categoria.id}
                                onClick={() => setActiveCategoria(categoria.id)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                    activeCategoria === categoria.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                            >
                                <span>{categoria.icono}</span>
                                {categoria.nombre}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid de Productos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productosFiltrados.map((producto, index) => (
                    <motion.div
                        key={producto.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleProductoClick(producto)}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                    >
                        {/* Imagen del producto */}
                        <div className="relative h-48 bg-slate-100 dark:bg-slate-700">
                            {producto.imagen_url ? (
                                <img
                                    src={getFullImageUrl(producto.imagen_url) || undefined}
                                    alt={producto.nombre}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.parentNode?.querySelector('.fallback-icon');
                                        if (fallback) {
                                            (fallback as HTMLElement).style.display = 'flex';
                                        }
                                    }}
                                />
                            ) : null}
                            <div className={`fallback-icon w-full h-full flex items-center justify-center text-slate-400 ${producto.imagen_url ? 'hidden' : 'flex'}`}>
                                <div className="text-4xl">
                                    {producto.categoria?.icono || '🍽️'}
                                </div>
                            </div>

                            {/* Badge de categoría */}
                            {producto.categoria && (
                                <div className="absolute top-2 left-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        producto.categoria.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300' :
                                        producto.categoria.color === 'orange' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300' :
                                        producto.categoria.color === 'red' ? 'bg-red-500/20 text-red-700 dark:text-red-300' :
                                        producto.categoria.color === 'green' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                                        producto.categoria.color === 'pink' ? 'bg-pink-500/20 text-pink-700 dark:text-pink-300' :
                                        producto.categoria.color === 'purple' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' :
                                        producto.categoria.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' :
                                        'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                                    }`}>
                                        {producto.categoria.icono} {producto.categoria.nombre}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Información del producto */}
                        <div className="p-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                                {producto.nombre}
                            </h3>
                            {producto.descripcion && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                    {producto.descripcion}
                                </p>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    S/ {producto.precio.toFixed(2)}
                                </span>
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                                    Disponible
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {productosFiltrados.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-slate-400 dark:text-slate-500 text-6xl mb-4">🍽️</div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        No hay productos disponibles
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        {activeCategoria ? 'No hay productos en esta categoría' : 'No hay productos en el sistema'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProductosPage;
