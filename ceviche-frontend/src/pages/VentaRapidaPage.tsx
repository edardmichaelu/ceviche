import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { ErrorHandler } from '../utils/errorHandler';
import { usePedido } from '../contexts/PedidoContext';
import { useNavigate } from 'react-router-dom';
import {
    UsersIcon,
    ClipboardDocumentListIcon,
    ShoppingBagIcon,
    PlusIcon,
    MinusIcon,
    ArrowRightOnRectangleIcon,
    PrinterIcon,
    TrashIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
    ArrowRightIcon as ArrowRightIconSolid
} from '@heroicons/react/24/solid';

interface Zona {
    id: number;
    nombre: string;
    descripcion?: string;
}

interface Mesa {
    id: number;
    numero: number;
    zona_id: number;
    capacidad: number;
    estado: 'disponible' | 'ocupada' | 'limpieza' | 'reservada' | 'fuera_servicio';
    descripcion?: string;
    zona?: Zona;
}

interface Categoria {
    id: number;
    nombre: string;
    descripcion?: string;
    icono: string;
    color: string;
    activo: boolean;
    orden: number;
    cantidad_productos?: number;
}

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

const VentaRapidaPage: React.FC = () => {
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeZona, setActiveZona] = useState<number | null>(null);
    const [activeCategoria, setActiveCategoria] = useState<number | null>(null);
    const [numComensales, setNumComensales] = useState<number>(1);
    const [isSendingOrder, setIsSendingOrder] = useState(false);
    const [showOrderSummary, setShowOrderSummary] = useState(false);
    const { iniciarPedido, agregarProducto, pedidoActual, enviarPedido, actualizarComensales, removerProducto, actualizarCantidad, setPedidoActual, limpiarPedido } = usePedido();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (pedidoActual?.num_comensales) {
            setNumComensales(pedidoActual.num_comensales);
        }
    }, [pedidoActual]);

    // Efecto para recalcular total cuando cambie el interruptor de cálculo por persona
    useEffect(() => {
        if (pedidoActual && pedidoActual.productos.length > 0) {
            const nuevoTotal = pedidoActual.productos.reduce((total, producto) => {
                return total + (pedidoActual.es_por_persona
                    ? producto.precio * (pedidoActual.num_comensales || 1) * producto.cantidad
                    : producto.precio * producto.cantidad);
            }, 0);

            // Solo actualizar si el total es diferente
            if (Math.abs(pedidoActual.total - nuevoTotal) > 0.01) {
                setPedidoActual(prev => prev ? { ...prev, total: nuevoTotal } : null);
            }
        }
    }, [pedidoActual?.es_por_persona, pedidoActual?.num_comensales, pedidoActual?.productos]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [zonasResponse, mesasResponse, categoriasResponse, productosResponse] = await Promise.all([
                apiClient.get('/api/local/zonas/public'),
                apiClient.get('/api/local/mesas/public'),
                apiClient.get('/api/categoria/'),
                apiClient.get('/api/producto/')
            ]);

            const zonasData = ErrorHandler.processApiResponse(zonasResponse);
            const mesasData = ErrorHandler.processApiResponse(mesasResponse);
            const categoriasData = ErrorHandler.processApiResponse(categoriasResponse);
            const productosData = ErrorHandler.processApiResponse(productosResponse);

            if (ErrorHandler.isSuccessResponse(zonasData)) {
                const zonasArray = Array.isArray(zonasData.data) ? zonasData.data : [];
                setZonas(zonasArray);
                if (zonasArray.length > 0) {
                    setActiveZona(zonasArray[0].id);
                }
            }

            if (ErrorHandler.isSuccessResponse(mesasData)) {
                const mesasArray = Array.isArray(mesasData.data) ? mesasData.data : [];
                setMesas(mesasArray);
            }

            if (ErrorHandler.isSuccessResponse(categoriasData)) {
                const categoriasArray = Array.isArray(categoriasData.data) ? categoriasData.data : [];
                categoriasArray.sort((a: Categoria, b: Categoria) => (a.orden || 0) - (b.orden || 0) || a.nombre.localeCompare(b.nombre));
                setCategorias(categoriasArray);
                if (categoriasArray.length > 0) {
                    setActiveCategoria(categoriasArray[0].id);
                }
            }

            if (ErrorHandler.isSuccessResponse(productosData)) {
                const productosArray = Array.isArray(productosData.data) ? productosData.data : [];
                setProductos(productosArray.filter((p: Producto) => p.disponible));
            }
        } catch (error: any) {
            ErrorHandler.logError('cargar venta rápida', error);
            ErrorHandler.showErrorNotification(error, 'cargar venta rápida');
        } finally {
            setLoading(false);
        }
    };

    const mesasFiltradas = activeZona ? mesas.filter(m => m.zona_id === activeZona) : [];

    // Obtener la mesa seleccionada actualmente
    const mesaSeleccionada = pedidoActual ? mesas.find(m => m.id === pedidoActual.mesa_id) : null;
    const capacidadMesa = mesaSeleccionada?.capacidad || 0;
    const productosFiltrados = activeCategoria
        ? productos.filter(p => p.categoria_id === activeCategoria)
        : productos;

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'disponible': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
            case 'ocupada': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
            case 'limpieza': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
            case 'reservada': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
            case 'fuera_servicio': return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'disponible': return '✅';
            case 'ocupada': return '👥';
            case 'reservada': return '📅';
            case 'limpieza': return '🧹';
            case 'fuera_servicio': return '🔧';
            default: return '❓';
        }
    };

    const handleMesaClick = (mesa: Mesa) => {
        if (mesa.estado === 'disponible') {
            // Iniciar pedido con la capacidad de la mesa
            iniciarPedido(mesa.id, undefined, mesa.capacidad);
            toast.success(`Mesa ${mesa.numero} seleccionada para ${numComensales} comensales (máx: ${mesa.capacidad})`);
        } else {
            toast.error(`Mesa ${mesa.numero} está ${mesa.estado}`);
        }
    };

    const handleCambiarMesa = () => {
        limpiarPedido();
        toast.success('Pedido limpiado. Selecciona una nueva mesa.');
    };

    const handleEnviarComanda = async () => {
        if (!pedidoActual || pedidoActual.productos.length === 0) {
            toast.error('No hay productos en el pedido');
            return;
        }

        setIsSendingOrder(true);
        try {
            const success = await enviarPedido();
            if (success) {
                toast.success('✅ Comanda enviada a cocina exitosamente');
                setShowOrderSummary(true);
                setTimeout(() => {
                    setShowOrderSummary(false);
                    // Limpiar el pedido para una nueva orden
                    window.location.reload();
                }, 3000);
            } else {
                toast.error('❌ Error al enviar la comanda');
            }
        } catch (error) {
            toast.error('❌ Error al enviar la comanda');
        } finally {
            setIsSendingOrder(false);
        }
    };

    const handleProductoClick = (producto: Producto) => {
        if (!pedidoActual) {
            toast.error('Primero selecciona una mesa');
            return;
        }

        agregarProducto({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio
        });

        toast.success(`${producto.nombre} agregado al pedido`);
    };

    const handleRemoverProducto = (productoId: number) => {
        removerProducto(productoId);
        toast.success('Producto eliminado del pedido');
    };

    const handleActualizarCantidad = (productoId: number, nuevaCantidad: number) => {
        if (nuevaCantidad <= 0) {
            handleRemoverProducto(productoId);
        } else {
            actualizarCantidad(productoId, nuevaCantidad);
            toast.success('Cantidad actualizada');
        }
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
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-slate-800 dark:via-blue-900/30 dark:to-blue-800/40 rounded-b-2xl shadow-lg p-6 border-b-2 border-blue-200/50 dark:border-blue-700/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl">
                            <ShoppingBagIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-1">
                                ⚡ Venta Rápida
                            </h1>
                            <p className="text-slate-700 dark:text-slate-300 font-medium">
                                {pedidoActual
                                    ? `Mesa ${pedidoActual.mesa_id} • ${pedidoActual.num_comensales || numComensales} comensales (máx: ${capacidadMesa})${pedidoActual.es_por_persona ? ' (x persona)' : ''} • ${pedidoActual.productos.length} productos`
                                    : 'Selecciona una mesa para comenzar'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Botón Cambiar Mesa */}
                    {pedidoActual && (
                        <button
                            onClick={handleCambiarMesa}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            Cambiar Mesa
                        </button>
                    )}
                </div>
            </div>

            {/* Contenido Principal */}
            <div className="flex-1 flex overflow-hidden">
                {/* Panel Principal */}
                <div className="flex-1 flex flex-col">
                    {/* Panel de Mesas y Categorías */}
                    <div className="flex-1 overflow-auto p-6">
                        <div className="space-y-6">
                            {/* Zonas - Solo mostrar si no hay pedido activo */}
                            {!pedidoActual && zonas.length > 0 && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        🏢 Zonas Disponibles
                                    </h2>
                                    <div className="flex flex-wrap gap-3">
                                        {zonas.map((zona) => (
                                            <button
                                                key={zona.id}
                                                onClick={() => setActiveZona(zona.id)}
                                                className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                                                    activeZona === zona.id
                                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                            >
                                                {zona.nombre}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Grid de Mesas - Solo mostrar si no hay pedido activo */}
                            {!pedidoActual && mesasFiltradas.length > 0 && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        🍽️ Mesas {activeZona ? `- ${zonas.find(z => z.id === activeZona)?.nombre}` : '- Todas las Zonas'}
                                    </h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                        {mesasFiltradas.map((mesa) => (
                                            <motion.div
                                                key={mesa.id}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleMesaClick(mesa)}
                                                className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-300 shadow-lg ${
                                                    mesa.estado === 'disponible'
                                                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 border-2 border-emerald-500 text-white'
                                                        : mesa.estado === 'ocupada'
                                                        ? 'bg-gradient-to-br from-rose-400 to-rose-600 border-2 border-rose-500 text-white'
                                                        : mesa.estado === 'reservada'
                                                        ? 'bg-gradient-to-br from-sky-400 to-sky-600 border-2 border-sky-500 text-white'
                                                        : 'bg-gradient-to-br from-slate-400 to-slate-600 border-2 border-slate-500 text-white'
                                                }`}
                                            >
                                                <div className="text-center">
                                                    <div className="text-3xl font-black mb-2">
                                                        {mesa.numero}
                                                    </div>
                                                    <div className="text-sm font-bold">
                                                        {getEstadoIcon(mesa.estado)} {mesa.estado}
                                                    </div>
                                                    <div className="text-xs opacity-90 mt-1">
                                                        👥 {mesa.capacidad}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Área de Productos - Mostrar cuando hay pedido activo */}
                            {pedidoActual && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                                    {/* Header con info de mesa y selector de comensales */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                                🍽️ Productos - Mesa {pedidoActual.mesa_id}
                                            </h2>
                                            <p className="text-slate-600 dark:text-slate-400">
                                                Selecciona productos para agregar al pedido
                                            </p>
                                        </div>

                                        {/* Selector de Comensales */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                                                <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Comensales:</span>
                                                        <span className="text-sm text-slate-500 dark:text-slate-400">
                                                            Máx: {capacidadMesa}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            onClick={() => {
                                                                const newCount = Math.max(1, numComensales - 1);
                                                                setNumComensales(newCount);
                                                                actualizarComensales(newCount, capacidadMesa);
                                                            }}
                                                            disabled={numComensales <= 1}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                                                numComensales <= 1
                                                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                                                    : 'bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400'
                                                            }`}
                                                        >
                                                            <MinusIcon className="h-4 w-4" />
                                                        </button>
                                                        <span className="w-12 text-center font-bold text-lg text-slate-900 dark:text-white">
                                                            {numComensales}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                if (numComensales < capacidadMesa) {
                                                                    const newCount = numComensales + 1;
                                                                    setNumComensales(newCount);
                                                                    actualizarComensales(newCount, capacidadMesa);
                                                                } else {
                                                                    toast.error(`No se puede exceder la capacidad de ${capacidadMesa} comensales para esta mesa`);
                                                                }
                                                            }}
                                                            disabled={numComensales >= capacidadMesa}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                                                numComensales >= capacidadMesa
                                                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                                                    : 'bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400'
                                                            }`}
                                                        >
                                                            <PlusIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    {capacidadMesa > 0 && (
                                                        <div className="mt-2">
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                                    style={{ width: `${(numComensales / capacidadMesa) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                                <span>1</span>
                                                                <span>{capacidadMesa}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Interruptor para cálculo por persona */}
                                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                                                <div>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Cálculo por persona:</span>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Multiplica el precio por el número de comensales
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const nuevoEstado = !pedidoActual?.es_por_persona;
                                                        setPedidoActual(prev => prev ? {
                                                            ...prev,
                                                            es_por_persona: nuevoEstado
                                                        } : null);
                                                        toast.success(nuevoEstado ? 'Precio por persona activado' : 'Precio normal activado');
                                                    }}
                                                    className={`w-12 h-6 rounded-full transition-colors ${
                                                        pedidoActual?.es_por_persona
                                                            ? 'bg-green-500'
                                                            : 'bg-gray-300 dark:bg-gray-600'
                                                    } relative`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                                                        pedidoActual?.es_por_persona ? 'translate-x-6' : 'translate-x-1'
                                                    }`}></div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filtros de Categorías */}
                                    {categorias.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                                📂 Filtrar por Categoría
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                {categorias.map((categoria) => (
                                                    <button
                                                        key={categoria.id}
                                                        onClick={() => setActiveCategoria(categoria.id)}
                                                        className={`p-3 rounded-xl font-semibold transition-all duration-200 ${
                                                            activeCategoria === categoria.id
                                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                        }`}
                                                    >
                                                        <div className="text-xl mb-1">{categoria.icono}</div>
                                                        <div className="text-xs">{categoria.nombre}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Grid de Productos */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                            {activeCategoria
                                                ? `Productos - ${categorias.find(c => c.id === activeCategoria)?.nombre}`
                                                : 'Todos los Productos'
                                            }
                                        </h3>

                                        {productosFiltrados.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {productosFiltrados.slice(0, 12).map((producto, index) => (
                                                    <motion.div
                                                        key={producto.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleProductoClick(producto)}
                                                        className="bg-white dark:bg-slate-700 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-600"
                                                    >
                                                        <div className="relative h-32 bg-slate-100 dark:bg-slate-600">
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
                                                                <div className="text-2xl">
                                                                    {producto.categoria?.icono || '🍽️'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-3">
                                                            <h3 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">
                                                                {producto.nombre}
                                                            </h3>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
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
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="text-slate-400 dark:text-slate-500 text-4xl mb-3">🍽️</div>
                                                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                                                    No hay productos disponibles
                                                </h3>
                                                <p className="text-slate-500 dark:text-slate-400">
                                                    {activeCategoria ? 'No hay productos en esta categoría' : 'No hay productos en el sistema'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Mensaje cuando no hay mesa seleccionada */}
                            {!pedidoActual && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                                    <div className="text-center py-12">
                                        <div className="text-slate-400 dark:text-slate-500 text-6xl mb-4">🍽️</div>
                                        <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
                                            Selecciona una mesa para comenzar
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400">
                                            Haz clic en una mesa disponible para iniciar tu pedido
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel Lateral - Estado del Pedido */}
                <div className="w-96 bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            Pedido Actual
                        </h2>
                        {!pedidoActual && (
                            <p className="text-slate-600 dark:text-slate-400 mt-2">
                                Selecciona una mesa para comenzar
                            </p>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto p-6">
                        {pedidoActual ? (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            Mesa {pedidoActual.mesa_id}
                                        </span>
                                        <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-sm font-medium">
                                            {pedidoActual.num_comensales || numComensales} personas
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        S/ {pedidoActual.total.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        {pedidoActual.productos.length} producto{pedidoActual.productos.length !== 1 ? 's' : ''}
                                        {pedidoActual.es_por_persona && (
                                            <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                                                (x{pedidoActual.num_comensales} personas)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Productos en el pedido:</h3>
                                    {pedidoActual.productos.length > 0 ? (
                                        pedidoActual.productos.map((producto, index) => (
                                            <div key={index} className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                                                            {producto.nombre}
                                                        </h4>

                                                        {/* Precio por unidad y cantidad */}
                                                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                            <span>S/ {producto.precio.toFixed(2)} por unidad</span>
                                                            {pedidoActual.num_comensales && pedidoActual.num_comensales > 1 && (
                                                                <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                                                                    (x{pedidoActual.num_comensales} personas)
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Controles de cantidad */}
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => handleActualizarCantidad(producto.id, producto.cantidad - 1)}
                                                                className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors"
                                                            >
                                                                <MinusIcon className="h-4 w-4" />
                                                            </button>
                                                            <span className="w-12 text-center font-bold text-slate-900 dark:text-white">
                                                                {producto.cantidad}
                                                            </span>
                                                            <button
                                                                onClick={() => handleActualizarCantidad(producto.id, producto.cantidad + 1)}
                                                                className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center transition-colors"
                                                            >
                                                                <PlusIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoverProducto(producto.id)}
                                                                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-900/20 hover:bg-gray-200 dark:hover:bg-gray-900/40 text-gray-600 dark:text-gray-400 flex items-center justify-center transition-colors ml-2"
                                                                title="Eliminar producto"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Precio total */}
                                                    <div className="text-right">
                                                        <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                                                            S/ {(pedidoActual.es_por_persona
                                                                ? producto.precio * (pedidoActual.num_comensales || 1) * producto.cantidad
                                                                : producto.precio * producto.cantidad).toFixed(2)}
                                                        </span>
                                                        {pedidoActual.es_por_persona && (
                                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                {pedidoActual.num_comensales} x {producto.cantidad}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-slate-500 dark:text-slate-400 py-4">
                                            <ShoppingBagIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>No hay productos en el pedido</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
                                <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-lg font-medium">No hay pedido activo</p>
                                <p className="text-sm mt-2">Selecciona una mesa para comenzar</p>
                            </div>
                        )}
                    </div>

                    {/* Botón Enviar Comanda */}
                    {pedidoActual && pedidoActual.productos.length > 0 && (
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={handleEnviarComanda}
                                disabled={isSendingOrder}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
                            >
                                {isSendingOrder ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <PrinterIcon className="h-5 w-5" />
                                        Enviar Comanda a Cocina
                                        <ArrowRightIconSolid className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Notificación de Éxito */}
            <AnimatePresence>
                {showOrderSummary && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 right-6 bg-green-500 text-white p-6 rounded-2xl shadow-2xl z-50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                                <PrinterIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">✅ Comanda Enviada</h3>
                                <p className="text-green-100">
                                    La comanda ha sido enviada a cocina y se está imprimiendo
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VentaRapidaPage;


