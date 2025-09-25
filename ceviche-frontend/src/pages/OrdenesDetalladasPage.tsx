import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, MapPinIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { formatDateTimeGlobal, getEstadoColorGlobal, getEstadoIconGlobal, getEstadoDisplayNameGlobal } from '../utils/auxiliaryFunctions';

interface Orden {
    id: number;
    numero: string;
    mesa_id: number;
    mozo_id: number;
    tipo: string;
    estado: string;
    monto_total: number;
    cliente_nombre: string;
    creado_en: string;
    actualizado_en: string;
    mesa: {
        numero: string;
        zona: string;
        piso: string;
    };
    mozo: {
        usuario: string;
    };
    items: ItemOrden[];
}

interface ItemOrden {
    id: number;
    orden_id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    estado: string;
    estacion: string;
    notas: string;
    fecha_inicio: string;
    producto: {
        nombre: string;
        categoria: string;
        tipo_estacion: string;
    };
}

const OrdenesDetalladasPage: React.FC = () => {
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterEstacion, setFilterEstacion] = useState('');
    const [userRole, setUserRole] = useState<string>('');

    const loadOrdenes = useCallback(async (role?: string) => {
        try {
            console.log('📋 Cargando órdenes detalladas...', { role });

            // Determinar el endpoint según el rol (usar test-simple para debugging)
            let endpoint;
            if (role === 'cocina') {
                endpoint = '/api/orden/cocina/pendientes';
                console.log('🍳 Usando endpoint de COCINA:', endpoint);
            } else if (role === 'mesero') {
                endpoint = '/api/orden/mesero/detalladas';
                console.log('👤 Usando endpoint de MESERO:', endpoint);
            } else if (role === 'admin') {
                endpoint = '/api/orden/';
                console.log('⚡ Usando endpoint de ADMIN:', endpoint);
            } else {
                // Si no hay rol específico, intentar determinar desde la URL
                const currentPath = window.location.pathname;
                if (currentPath.includes('/cocina/')) {
                    endpoint = '/api/orden/cocina/pendientes';
                    console.log('🍳 Detectado desde URL - Usando endpoint de COCINA:', endpoint);
                } else {
                    endpoint = '/api/orden/mesero/detalladas';
                    console.log('👤 Detectado desde URL - Usando endpoint de MESERO:', endpoint);
                }
            }

            console.log('📋 Endpoint final:', endpoint);
            const response = await apiClient.get(endpoint);

            console.log('📋 Respuesta completa de la API:', response);
            console.log('📋 Tipo de respuesta:', typeof response);
            console.log('📋 Keys de respuesta:', Object.keys(response || {}));

            if (response && typeof response === 'object' && 'success' in response && response.success && 'data' in response) {
                const responseData = (response as any).data;
                console.log('📋 Data extraída:', responseData);
                console.log('📋 Tipo de data:', typeof responseData);
                console.log('📋 Keys de data:', Object.keys(responseData || {}));

                // La API puede devolver diferentes estructuras según el endpoint
                let ordenesData;

                if (Array.isArray(responseData)) {
                    // Estructura directa: array de órdenes (nueva estructura simplificada)
                    ordenesData = responseData;
                    console.log('✅ Usando estructura directa (array)');
                } else if (responseData.ordenes && Array.isArray(responseData.ordenes)) {
                    // Estructura con objeto: { ordenes: [...], total_ordenes: 3, ... }
                    ordenesData = responseData.ordenes;
                    console.log('✅ Usando estructura con objeto (responseData.ordenes)');
                } else if (responseData.data && Array.isArray(responseData.data)) {
                    // Estructura anidada: { data: [...] }
                    ordenesData = responseData.data;
                    console.log('✅ Usando estructura anidada (responseData.data)');
                } else {
                    // Estructura desconocida
                    console.error('❌ Estructura de respuesta desconocida:', responseData);
                    console.error('❌ Tipo de responseData:', typeof responseData);
                    ordenesData = [];
                }

                console.log('📋 Órdenes detalladas extraídas:', ordenesData);
                console.log('📋 Tipo de ordenesData:', typeof ordenesData);
                console.log('📋 Es array:', Array.isArray(ordenesData));
                console.log('📋 Longitud:', ordenesData.length);

                if (Array.isArray(ordenesData)) {
                    console.log('✅ Configurando órdenes como array válido');

                    // Validar y sanitizar los datos para asegurarse de que tengan todas las propiedades requeridas
                    const ordenesSanitizadas = ordenesData.map((orden: any) => ({
                        id: orden.id || 0,
                        numero: orden.numero || '',
                        mesa_id: orden.mesa_id || 0,
                        mozo_id: orden.mozo_id || 0,
                        tipo: orden.tipo || '',
                        estado: orden.estado || 'pendiente',
                        monto_total: orden.monto_total || 0, // ← Asegurar que monto_total nunca sea undefined
                        cliente_nombre: orden.cliente_nombre || '',
                        creado_en: orden.creado_en || new Date().toISOString(),
                        actualizado_en: orden.actualizado_en || new Date().toISOString(),
                        mesa: orden.mesa || { numero: '', zona: '', piso: '' },
                        mozo: orden.mozo || { usuario: '' },
                        items: orden.items || []
                    }));

                    console.log('✅ Órdenes sanitizadas:', ordenesSanitizadas);
                    setOrdenes(ordenesSanitizadas);
                } else {
                    console.error('❌ ordenesData no es un array válido:', ordenesData);
                    setOrdenes([]);
                }
            } else {
                console.error('❌ Respuesta no válida:', response);
                console.error('❌ Success:', response?.success);
                console.error('❌ Has data:', 'data' in (response || {}));
                setOrdenes([]);
            }
        } catch (error) {
            console.error('Error cargando órdenes detalladas:', error);
            toast.error('Error al cargar órdenes detalladas');
        } finally {
            setLoading(false);
        }
    }, []);

    // Función para obtener el rol del usuario
    const getUserRole = useCallback(async () => {
        try {
            console.log('🔍 Obteniendo perfil del usuario...');
            const response = await apiClient.get('/auth/profile');
            console.log('🔍 Respuesta del perfil:', response);

            if (response && response.data && response.data.rol) {
                const role = response.data.rol;
                console.log('👤 Rol del usuario:', role);
                setUserRole(role);
                // Cargar órdenes con el rol correcto
                console.log('🔄 Cargando órdenes con rol:', role);
                await loadOrdenes(role);
            } else {
                console.warn('⚠️ No se pudo obtener el rol del usuario');
                // Si no podemos obtener el rol, intentar cargar con endpoint de mesero
                console.log('🔄 Intentando cargar con endpoint de mesero por defecto');
                await loadOrdenes();
            }
        } catch (error) {
            console.error('❌ Error obteniendo perfil de usuario:', error);
            console.log('🔄 Intentando cargar con endpoint de mesero por defecto');
            // Si no podemos obtener el rol, intentar cargar con endpoint de mesero
            await loadOrdenes();
        }
    }, [loadOrdenes]);

    useEffect(() => {
        getUserRole();
    }, [getUserRole]);

    // Detectar rol desde la URL (cocina vs mesero/admin)
    useEffect(() => {
        const currentPath = window.location.pathname;
        console.log('📍 Ruta actual:', currentPath);

        if (currentPath.includes('/cocina/')) {
            console.log('🍳 Detectado rol COCINA desde la URL');
            console.log('🍳 Intentando cargar órdenes para cocina...');
            setUserRole('cocina');
            // Intentar cargar directamente sin esperar autenticación
            loadOrdenes('cocina');
        } else {
            console.log('👤 Detectado rol MESERO/ADMIN desde la URL');
            // Para mesero/admin, necesitamos obtener el rol real
            getUserRole();
        }
    }, []);

    useEffect(() => {
        // Actualizar cada 30 segundos con el rol actual
        const interval = setInterval(() => {
            if (userRole) {
                console.log('🔄 Actualizando órdenes con rol:', userRole);
                loadOrdenes(userRole);
            } else {
                console.log('🔄 Actualizando órdenes sin rol específico');
                loadOrdenes();
            }
        }, 30000);

        // Escuchar eventos de nuevas órdenes en tiempo real
        const handleNewOrder = (event: CustomEvent) => {
            console.log('🔔 Nueva orden recibida en Órdenes Detalladas:', event.detail);
            if (userRole) {
                console.log('🔄 Recargando órdenes por nueva orden...');
                loadOrdenes(userRole);
            } else {
                loadOrdenes();
            }
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'new_order') {
                console.log('🔄 Storage change detectado en Órdenes Detalladas, recargando...');
                if (userRole) {
                    loadOrdenes(userRole);
                } else {
                    loadOrdenes();
                }
            }
        };

        window.addEventListener('newOrder', handleNewOrder as EventListener);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('newOrder', handleNewOrder as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [loadOrdenes, userRole]);

    const handleActualizarEstadoItem = async (item: ItemOrden) => {
        try {
            const nuevosEstados = {
                'en_cola': 'preparando',
                'preparando': 'listo',
                'listo': 'servido'
            };

            const nuevoEstado = nuevosEstados[item.estado as keyof typeof nuevosEstados];
            if (!nuevoEstado) {
                toast.error('Estado no válido para avanzar');
                return;
            }

            await apiClient.put(`/api/orden/items/${item.id}/estado`, { estado: nuevoEstado });
            toast.success(`✅ Item avanzado a ${nuevoEstado}`);
            loadOrdenes();
        } catch (error) {
            console.error('Error actualizando item:', error);
            toast.error('Error al actualizar item');
        }
    };

    const handleCancelarItem = async (item: ItemOrden) => {
        try {
            await apiClient.put(`/api/orden/items/${item.id}/estado`, { estado: 'cancelado' });
            toast.success('❌ Item cancelado');
            loadOrdenes();
        } catch (error) {
            console.error('Error cancelando item:', error);
            toast.error('Error al cancelar item');
        }
    };

    // Filtrar órdenes
    const ordenesFiltradas = ordenes.filter((orden) => {
        const matchesSearch = searchTerm === '' ||
            orden.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
            orden.items.some(item =>
                item.producto?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const matchesEstado = filterEstado === '' ||
            orden.items.some(item => item.estado === filterEstado);

        const matchesEstacion = filterEstacion === '' ||
            orden.items.some(item => item.estacion === filterEstacion);

        return matchesSearch && matchesEstado && matchesEstacion;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-300 dark:from-slate-900 dark:via-emerald-800/60 dark:to-emerald-700/70">
                <div className="relative">
                    <div className="animate-spin rounded-full h-32 w-32 border-4 border-emerald-300 dark:border-emerald-600 border-t-emerald-600 dark:border-t-emerald-400 shadow-2xl"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl animate-bounce">📋</div>
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white/90 dark:bg-slate-800/90 px-6 py-3 rounded-2xl shadow-xl border-2 border-emerald-300 dark:border-emerald-500 backdrop-blur-sm">
                            <p className="text-lg text-emerald-700 dark:text-emerald-300 font-bold">Cargando órdenes...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                📋 Órdenes Detalladas
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                Vista completa de todas las órdenes con información detallada
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Total: {ordenes.length} órdenes
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Filtradas: {ordenesFiltradas.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Buscador y filtros */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por número de orden o producto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                />
                                <MagnifyingGlassIcon className="h-6 w-6 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <select
                                value={filterEstado}
                                onChange={(e) => setFilterEstado(e.target.value)}
                                className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-lg"
                            >
                                <option value="">Todos los estados</option>
                                <option value="en_cola">🟢 En cola</option>
                                <option value="preparando">🟡 Preparando</option>
                                <option value="listo">🔴 Listo</option>
                                <option value="servido">⚪ Servido</option>
                                <option value="cancelado">🟠 Cancelado</option>
                            </select>

                            <select
                                value={filterEstacion}
                                onChange={(e) => setFilterEstacion(e.target.value)}
                                className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-lg"
                            >
                                <option value="">Todas las estaciones</option>
                                <option value="frio">❄️ Frío</option>
                                <option value="caliente">🔥 Caliente</option>
                                <option value="bebida">🥤 Bebida</option>
                                <option value="postre">🍰 Postre</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Resultados */}
                {ordenesFiltradas.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            No se encontraron órdenes
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {searchTerm || filterEstado || filterEstacion
                                ? 'Ajusta los filtros para ver más resultados'
                                : 'Las órdenes aparecerán aquí cuando se envíen desde Venta Rápida'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {ordenesFiltradas
                            .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())
                            .map((orden) => {
                                const dateTime = formatDateTimeGlobal(orden.creado_en);
                                return (
                                    <motion.div
                                        key={orden.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                                    >
                                        {/* Header de la Orden */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                        Orden #{orden.numero}
                                                    </h3>
                                                    <div className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getEstadoColorGlobal(orden.estado)}`}>
                                                        {orden.estado.toUpperCase()}
                                                    </div>
                                                </div>

                                                {/* Información de Mesa y Zona */}
                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <MapPinIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                Mesa {orden.mesa?.numero || orden.mesa_id}
                                                            </p>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                {orden.mesa?.zona || 'Zona'} • {orden.mesa?.piso || 'Piso 1'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {orden.mozo?.usuario || 'Mozo'}
                                                            </p>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                ID: {orden.mozo_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Información de Tiempo */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <ClockIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                            Creada: {dateTime.dateTime}
                                                        </p>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            Cliente: {orden.cliente_nombre || 'Sin nombre'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Total */}
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    S/ {(orden.monto_total || 0).toFixed(2)}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {orden.items.length} producto{orden.items.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Productos de la Orden */}
                                        <div className="space-y-3 mb-4">
                                            {orden.items && orden.items.map((item) => (
                                                <div key={item.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${getEstadoColorGlobal(item.estado)}`} />
                                                            <div>
                                                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                                                    {item.producto?.nombre || `Producto #${item.producto_id}`}
                                                                </h4>
                                                                <div className="flex items-center gap-4 mt-1">
                                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                                        Cant: {item.cantidad}
                                                                    </span>
                                                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                                        S/ {item.precio_unitario}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {item.estacion}
                                                                    </span>
                                                                </div>
                                                                {item.notas && (
                                                                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                                                        📝 {item.notas}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColorGlobal(item.estado)}`}>
                                                            {getEstadoIconGlobal(item.estado)}
                                                            {getEstadoDisplayNameGlobal(item.estado)}
                                                        </span>

                                                        {item.estado !== 'servido' && item.estado !== 'cancelado' && (
                                                            <>
                                                                {userRole === 'cocina' || userRole === 'admin' ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleActualizarEstadoItem(item)}
                                                                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                                        >
                                                                            Avanzar
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleCancelarItem(item)}
                                                                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                                        >
                                                                            ❌ Cancelar
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1">
                                                                        Solo lectura
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdenesDetalladasPage;
