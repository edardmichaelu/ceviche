import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { ErrorHandler } from '../utils/errorHandler';
import { usePedido } from '../contexts/PedidoContext';
import { useNavigate } from 'react-router-dom';
import { ModalVerMesa } from '../components/ModalVerMesa';
import {
    UsersIcon,
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    WrenchScrewdriverIcon,
    SparklesIcon,
    PencilIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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

const MesasPage: React.FC = () => {
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeZona, setActiveZona] = useState<number | null>(null);
    const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mesaDetails, setMesaDetails] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const { iniciarPedido } = usePedido();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Cargar zonas y mesas en paralelo
            const [zonasResponse, mesasResponse] = await Promise.all([
                apiClient.get('/api/local/zonas/public'),
                apiClient.get('/api/local/mesas/public')
            ]);

            const zonasData = ErrorHandler.processApiResponse(zonasResponse);
            const mesasData = ErrorHandler.processApiResponse(mesasResponse);

            if (ErrorHandler.isSuccessResponse(zonasData)) {
                const zonasArray = Array.isArray(zonasData.data) ? zonasData.data :
                                 Array.isArray(zonasData.zonas) ? zonasData.zonas :
                                 Array.isArray(zonasData) ? zonasData : [];
                setZonas(zonasArray);
                if (zonasArray.length > 0 && !activeZona) {
                    setActiveZona(zonasArray[0].id);
                }
            }

            if (ErrorHandler.isSuccessResponse(mesasData)) {
                const mesasArray = Array.isArray(mesasData.data) ? mesasData.data :
                                 Array.isArray(mesasData.mesas) ? mesasData.mesas :
                                 Array.isArray(mesasData) ? mesasData : [];
                setMesas(mesasArray);
            }
        } catch (error: any) {
            ErrorHandler.logError('cargar mesas', error);
            const errorMessage = ErrorHandler.showErrorNotification(error, 'cargar mesas');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const mesasFiltradas = activeZona ? mesas.filter(m => m.zona_id === activeZona) : mesas;

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'disponible': return 'bg-emerald-300 dark:bg-emerald-600 text-emerald-900 dark:text-emerald-100 border-emerald-400 dark:border-emerald-500'; // Verde esmeralda sólido
            case 'ocupada': return 'bg-rose-300 dark:bg-rose-600 text-rose-900 dark:text-rose-100 border-rose-400 dark:border-rose-500'; // Rojo rosado sólido
            case 'reservada': return 'bg-sky-300 dark:bg-sky-600 text-sky-900 dark:text-sky-100 border-sky-400 dark:border-sky-500'; // Azul cielo sólido
            case 'limpieza': return 'bg-amber-300 dark:bg-amber-600 text-amber-900 dark:text-amber-100 border-amber-400 dark:border-amber-500'; // Amarillo dorado sólido
            case 'fuera_servicio': return 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-500'; // Gris elegante sólido
            default: return 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100';
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'disponible': return CheckCircleIcon; // Ícono de check verde
            case 'ocupada': return UsersIcon; // Ícono de usuarios
            case 'reservada': return ClockIcon; // Ícono de reloj
            case 'limpieza': return SparklesIcon; // Ícono de limpieza mágica
            case 'fuera_servicio': return WrenchScrewdriverIcon; // Ícono de herramientas
            default: return XCircleIcon;
        }
    };

    const handleMesaClick = async (mesa: Mesa) => {
        try {
            // Cargar detalles completos de la mesa
            const detailsResponse = await apiClient.get(`/api/mesero/mesas/${mesa.id}/details`);
            const detailsData = ErrorHandler.processApiResponse(detailsResponse);

            if (ErrorHandler.isSuccessResponse(detailsData)) {
                setMesaDetails(detailsData.data);
                setSelectedMesa(mesa);
                setIsModalOpen(true);
            } else {
                toast.error('Error al cargar detalles de la mesa');
            }
        } catch (error: any) {
            ErrorHandler.logError('cargar detalles de mesa', error);
            toast.error('Error al cargar detalles de la mesa');
        }
    };

    const handleTomarPedido = (clienteNombre?: string) => {
        if (selectedMesa) {
            iniciarPedido(selectedMesa.id, clienteNombre);
            toast.success(`Mesa ${selectedMesa.numero} seleccionada para tomar pedido`);
            navigate('/mesero/productos');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMesa(null);
        setMesaDetails(null);
    };

    const handleEditEstado = () => {
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
    };

    const handleUpdateEstado = async (nuevoEstado: Mesa['estado']) => {
        if (!selectedMesa) return;

        setIsUpdating(true);
        try {
            const response = await apiClient.put(`/api/mesero/mesas/${selectedMesa.id}/estado`, {
                estado: nuevoEstado
            });

            const result = ErrorHandler.processApiResponse(response);

            if (ErrorHandler.isSuccessResponse(result)) {
                // Actualizar el estado de la mesa en el estado local
                setMesas(prevMesas =>
                    prevMesas.map(mesa =>
                        mesa.id === selectedMesa.id
                            ? { ...mesa, estado: nuevoEstado }
                            : mesa
                    )
                );

                // Actualizar la mesa seleccionada si está en el modal
                setSelectedMesa(prev => prev ? { ...prev, estado: nuevoEstado } : null);

                toast.success(`Estado de mesa ${selectedMesa.numero} actualizado a ${nuevoEstado}`);
                setIsEditModalOpen(false);
            } else {
                toast.error('Error al actualizar el estado de la mesa');
            }
        } catch (error: any) {
            ErrorHandler.logError('actualizar estado de mesa', error);
            toast.error('Error al actualizar el estado de la mesa');
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-300 dark:from-slate-900 dark:via-emerald-800/60 dark:to-emerald-700/70">
                <div className="relative">
                    <div className="animate-spin rounded-full h-32 w-32 border-4 border-emerald-300 dark:border-emerald-600 border-t-emerald-600 dark:border-t-emerald-400 shadow-2xl"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl animate-bounce">🍽️</div>
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white/90 dark:bg-slate-800/90 px-6 py-3 rounded-2xl shadow-xl border-2 border-emerald-300 dark:border-emerald-500 backdrop-blur-sm">
                            <p className="text-lg text-emerald-700 dark:text-emerald-300 font-bold">Cargando mesas...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Modal de Detalles de Mesa - debe estar al inicio para z-index correcto */}
            <ModalVerMesa
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                mesa={mesaDetails}
                onTomarPedido={handleTomarPedido}
            />

            {/* Header */}
            <div className="bg-gradient-to-br from-white via-emerald-100 to-emerald-200 dark:from-slate-800 dark:via-emerald-700/60 dark:to-emerald-600/70 rounded-2xl shadow-lg p-8 border-2 border-emerald-300/50 dark:border-emerald-500/40">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
                            <UsersIcon className="h-8 w-8 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
                            🍽️ Vista de Mesas
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
                            Gestiona las mesas del restaurante con estilo ✨
                        </p>
                    </div>
                </div>
            </div>

            {/* Zonas */}
            {zonas.length > 0 && (
                <div className="bg-gradient-to-br from-white via-blue-100 to-blue-200 dark:from-slate-800 dark:via-blue-700/60 dark:to-blue-600/70 rounded-2xl shadow-lg p-6 border-2 border-blue-300/50 dark:border-blue-500/40">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-md">
                            <span className="text-white text-lg">📍</span>
                        </div>
                        Zonas Disponibles
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setActiveZona(null)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg ${
                                activeZona === null
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-blue-500/25'
                                    : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-500'
                            }`}
                        >
                            🌟 Todas las zonas
                        </button>
                        {zonas.map((zona) => (
                            <button
                                key={zona.id}
                                onClick={() => setActiveZona(zona.id)}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg ${
                                    activeZona === zona.id
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-blue-500/25'
                                        : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-500'
                                }`}
                            >
                                🏢 {zona.nombre}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid de Mesas */}
            <div className="bg-gradient-to-br from-white via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700/60 dark:to-slate-600/70 rounded-2xl shadow-lg p-8 border-2 border-slate-300/50 dark:border-slate-500/40">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 shadow-lg">
                        <span className="text-white text-xl">🪑</span>
                    </div>
                    Mesas {activeZona ? `- ${zonas.find(z => z.id === activeZona)?.nombre}` : '- Todas las Zonas'}
                </h2>

                {mesasFiltradas.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {mesasFiltradas.map((mesa) => (
                            <motion.div
                                key={mesa.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleMesaClick(mesa)}
                                className={`group relative cursor-pointer rounded-2xl p-6 transition-all duration-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 overflow-hidden ${
                                    mesa.estado === 'disponible'
                                        ? 'bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-400 dark:from-emerald-700 dark:via-emerald-600 dark:to-emerald-500 border-2 border-emerald-400 dark:border-emerald-500 hover:border-emerald-500 dark:hover:border-emerald-400'
                                        : mesa.estado === 'ocupada'
                                        ? 'bg-gradient-to-br from-rose-200 via-rose-300 to-rose-400 dark:from-rose-700 dark:via-rose-600 dark:to-rose-500 border-2 border-rose-400 dark:border-rose-500 hover:border-rose-500 dark:hover:border-rose-400'
                                        : mesa.estado === 'reservada'
                                        ? 'bg-gradient-to-br from-sky-200 via-sky-300 to-sky-400 dark:from-sky-700 dark:via-sky-600 dark:to-sky-500 border-2 border-sky-400 dark:border-sky-500 hover:border-sky-500 dark:hover:border-sky-400'
                                        : mesa.estado === 'limpieza'
                                        ? 'bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 dark:from-amber-700 dark:via-amber-600 dark:to-amber-500 border-2 border-amber-400 dark:border-amber-500 hover:border-amber-500 dark:hover:border-amber-400'
                                        : 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 dark:from-slate-700 dark:via-slate-600 dark:to-slate-500 border-2 border-slate-400 dark:border-slate-500 hover:border-slate-500 dark:hover:border-slate-400'
                                }`}
                            >
                                <div className="text-center relative z-10">
                                    {/* Número de mesa grande y elegante */}
                                    <div className="text-4xl font-black text-slate-900 dark:text-white mb-3 drop-shadow-lg">
                                        {mesa.numero}
                                    </div>

                                    {/* Icono y estado */}
                                    <div className="flex flex-col items-center gap-3 mb-4">
                                        <div className={`p-4 rounded-2xl ${getEstadoColor(mesa.estado).replace('text-', 'bg-').replace('dark:text-', 'dark:bg-').replace('border-', 'border-2 border-')} shadow-xl`}>
                                            {React.createElement(getEstadoIcon(mesa.estado), {
                                                className: `h-8 w-8 ${getEstadoColor(mesa.estado).split(' ')[1].replace('text-', 'text-').replace('dark:text-', 'dark:text-').replace('bg-', 'text-').replace('dark:bg-', 'dark:text-')}`
                                            })}
                                        </div>
                                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
                                            {mesa.estado === 'disponible' ? 'Disponible' :
                                             mesa.estado === 'ocupada' ? 'Ocupada' :
                                             mesa.estado === 'reservada' ? 'Reservada' :
                                             mesa.estado === 'limpieza' ? 'En Limpieza' : 'Fuera de Servicio'}
                                        </div>
                                    </div>

                                    {/* Capacidad */}
                                    <div className="text-base text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-800/95 rounded-xl px-4 py-3 inline-block shadow-lg border-2 border-slate-300/70 dark:border-slate-600/70">
                                        👥 Capacidad: {mesa.capacidad}
                                    </div>

                                    {/* Indicador de personas si está ocupada */}
                                    {mesa.estado === 'ocupada' && (
                                        <div className="flex items-center justify-center gap-3 mt-4 text-lg font-bold text-slate-800 dark:text-slate-200 bg-white/95 dark:bg-slate-800/95 rounded-xl px-5 py-4 shadow-xl border-2 border-slate-300/70 dark:border-slate-600/70">
                                            <div className="flex -space-x-1">
                                                <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800 shadow-md"></div>
                                                <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 shadow-md"></div>
                                                <div className="w-5 h-5 bg-purple-500 rounded-full border-2 border-white dark:border-slate-800 shadow-md"></div>
                                                <div className="w-5 h-5 bg-pink-500 rounded-full border-2 border-white dark:border-slate-800 shadow-md"></div>
                                            </div>
                                            <span>{mesa.capacidad} personas</span>
                                        </div>
                                    )}

                                    {/* Botón de Editar Estado */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedMesa(mesa);
                                            handleEditEstado();
                                        }}
                                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Editar Estado
                                    </button>
                                </div>

                                {/* Indicador de estado en esquina superior derecha */}
                                <div className="absolute top-4 right-4">
                                    <div className={`w-6 h-6 rounded-full shadow-2xl border-3 border-white dark:border-slate-800 ${
                                        mesa.estado === 'disponible' ? 'bg-emerald-700 animate-pulse' :
                                        mesa.estado === 'ocupada' ? 'bg-rose-700' :
                                        mesa.estado === 'reservada' ? 'bg-sky-700' :
                                        mesa.estado === 'limpieza' ? 'bg-amber-700' : 'bg-slate-700'
                                    }`}>
                                        <div className="w-full h-full rounded-full bg-white/40 animate-ping"></div>
                                    </div>
                                </div>

                                {/* Efecto de brillo en hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:translate-x-full transition-all duration-1000 rounded-2xl"></div>

                                {/* Patrón de fondo sutil */}
                                <div className="absolute inset-0 opacity-3 group-hover:opacity-8 transition-opacity duration-300">
                                    <div className="w-full h-full" style={{
                                        backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 2px, transparent 2px)`,
                                        backgroundSize: '20px 20px'
                                    }}></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700/60 dark:to-slate-600/70 rounded-2xl border-2 border-dashed border-slate-400 dark:border-slate-500">
                        <div className="relative">
                            <div className="text-slate-400 dark:text-slate-500 text-8xl mb-6 animate-bounce">
                                🍽️
                            </div>
                            <div className="absolute -top-2 -right-2 text-2xl animate-spin">✨</div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            No hay mesas disponibles
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            {activeZona ? 'No hay mesas en esta zona' : 'No hay zonas configuradas aún'}
                        </p>
                        <div className="mt-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-full text-sm text-slate-600 dark:text-slate-300">
                                <span>💡</span>
                                <span>Contacta al administrador para configurar las mesas</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Edición de Estado */}
            <AnimatePresence>
                {isEditModalOpen && selectedMesa && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={handleCloseEditModal}
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-8 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                            <PencilIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                Cambiar Estado de Mesa
                                            </h3>
                                            <p className="text-base text-slate-500 dark:text-slate-400">
                                                Mesa {selectedMesa.numero} • Capacidad: {selectedMesa.capacidad} personas • Estado actual: {selectedMesa.estado}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCloseEditModal}
                                        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                        aria-label="Cerrar modal"
                                    >
                                        <XCircleIcon className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                                    </button>
                                </div>

                                {/* Contenido */}
                                <div className="p-8 overflow-y-auto max-h-[calc(95vh-250px)]">
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <p className="text-lg text-slate-600 dark:text-slate-300 mb-2">
                                                Selecciona el nuevo estado para la mesa:
                                            </p>
                                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                    Estado actual:
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                    selectedMesa.estado === 'disponible' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300' :
                                                    selectedMesa.estado === 'ocupada' ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300' :
                                                    selectedMesa.estado === 'reservada' ? 'bg-sky-100 dark:bg-sky-900/20 text-sky-800 dark:text-sky-300' :
                                                    selectedMesa.estado === 'limpieza' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                                                    'bg-slate-100 dark:bg-slate-900/20 text-slate-800 dark:text-slate-300'
                                                }`}>
                                                    {selectedMesa.estado === 'disponible' ? '🟢 Disponible' :
                                                     selectedMesa.estado === 'ocupada' ? '🔴 Ocupada' :
                                                     selectedMesa.estado === 'reservada' ? '🔵 Reservada' :
                                                     selectedMesa.estado === 'limpieza' ? '🟡 En Limpieza' :
                                                     '⚫ Fuera de Servicio'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[
                                                { estado: 'disponible', label: 'Disponible', icon: CheckCircleIcon, color: 'emerald' },
                                                { estado: 'ocupada', label: 'Ocupada', icon: UsersIcon, color: 'rose' },
                                                { estado: 'reservada', label: 'Reservada', icon: ClockIcon, color: 'sky' },
                                                { estado: 'limpieza', label: 'En Limpieza', icon: SparklesIcon, color: 'amber' },
                                                { estado: 'fuera_servicio', label: 'Fuera de Servicio', icon: WrenchScrewdriverIcon, color: 'slate' }
                                            ].map(({ estado, label, icon: Icon, color }) => (
                                                <button
                                                    key={estado}
                                                    onClick={() => handleUpdateEstado(estado as Mesa['estado'])}
                                                    disabled={isUpdating || selectedMesa.estado === estado}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                                                        selectedMesa.estado === estado
                                                            ? `bg-${color}-100 dark:bg-${color}-900/20 border-${color}-300 dark:border-${color}-700 text-${color}-800 dark:text-${color}-300 cursor-not-allowed`
                                                            : `bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-${color}-400 dark:hover:border-${color}-500 text-slate-700 dark:text-slate-300 hover:bg-${color}-50 dark:hover:bg-${color}-900/20`
                                                    }`}
                                                >
                                                    <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
                                                        <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-semibold text-base">{label}</div>
                                                        <div className="text-sm opacity-70">
                                                            {selectedMesa.estado === estado ? 'Estado actual' : 'Cambiar a este estado'}
                                                        </div>
                                                    </div>
                                                    {selectedMesa.estado === estado && (
                                                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                                            ✓ Actual
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-8 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleCloseEditModal}
                                            disabled={isUpdating}
                                            className="flex-1 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-xl hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors font-semibold disabled:opacity-50"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                    {isUpdating && (
                                        <div className="mt-4 flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                            <span className="font-medium">Actualizando estado de la mesa...</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MesasPage;
