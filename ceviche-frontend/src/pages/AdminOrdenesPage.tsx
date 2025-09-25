import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    MapPinIcon,
    UserIcon,
    ClockIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import {
    MagnifyingGlassIcon as MagnifyingGlassIconSolid,
    PlusIcon as PlusIconSolid,
    PencilIcon as PencilIconSolid,
    TrashIcon as TrashIconSolid,
    EyeIcon as EyeIconSolid
} from '@heroicons/react/24/solid';
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
    num_comensales: number;
    cliente_nombre: string;
    creado_en: string;
    actualizado_en: string;
    mesa?: {
        id: number;
        numero: string;
        zona: string;
        piso: string;
        capacidad: number;
        estado: string;
        activo: boolean;
    };
    mozo?: {
        id: number;
        usuario: string;
        correo: string;
        rol: string;
        activo: boolean;
        estacion: string;
    };
    items: ItemOrden[];
    pagos?: any[];
}

interface ItemOrden {
    id: number;
    orden_id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    estado: string;
    estacion: string;
    fecha_inicio: string;
    fecha_listo: string;
    fecha_servido: string;
    notas: string;
    creado_en: string;
    actualizado_en: string;
    producto?: {
        id: number;
        nombre: string;
        descripcion: string;
        precio: number;
        categoria_id: number;
        tipo_estacion: string;
        tiempo_preparacion: number;
        nivel_picante: string;
        ingredientes: string;
        etiquetas: string;
        disponible: boolean;
        stock: number;
        alerta_stock: number;
        es_favorito: boolean;
    };
}

interface Mesa {
    id: number;
    numero: string;
    zona: string;
    piso: string;
    estado: string;
}

interface Usuario {
    id: number;
    usuario: string;
    rol: string;
}

interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria_id: number;
    tipo_estacion: string;
    tiempo_preparacion: number;
    nivel_picante: string;
    ingredientes: string;
    etiquetas: string;
    disponible: boolean;
    stock: number;
    alerta_stock: number;
    es_favorito: boolean;
    imagen_url: string;
    creado_en: string;
    actualizado_en: string;
    categoria?: {
        id: number;
        nombre: string;
        descripcion: string;
        icono: string;
        color: string;
        activo: boolean;
    };
    imagenes?: any[];
}

interface OrdenForm {
    mesa_id: string;
    mozo_id: string;
    tipo: string;
    cliente_nombre: string;
    num_comensales: number;
}

interface ItemForm {
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
    estacion: string;
    notas: string;
}

interface Pago {
    id: number;
    orden_id: number;
    monto: number;
    metodo: string;
    estado: string;
    fecha: string;
    orden?: {
        numero: string;
        mesa_id: number;
        mozo_id: number;
    };
}

interface PagoForm {
    orden_id: string;
    metodo: string;
    monto: number;
}

export function AdminOrdenesPage() {
    // Debug: Verificar autenticación
    const userData = sessionStorage.getItem('userData');
    const user = userData ? JSON.parse(userData) : null;
    console.log('🔍 AdminOrdenesPage - Usuario actual:', user);
    console.log('🔍 AdminOrdenesPage - URL actual:', window.location.href);
    console.log('🔍 AdminOrdenesPage - Token:', sessionStorage.getItem('accessToken'));
    console.log('🔍 AdminOrdenesPage - Pathname:', window.location.pathname);
    console.log('🔍 AdminOrdenesPage - Hash:', window.location.hash);

    // Determinar qué funcionalidades mostrar según el rol
    const getRolePermissions = () => {
        if (!user) return { canCreate: false, canUpdate: false, canDelete: false, canProcessPayments: false, canViewPayments: false, canViewAll: false };

        switch (user.rol) {
            case 'admin':
                return {
                    canCreate: true,
                    canUpdate: true,
                    canDelete: true,
                    canProcessPayments: true,
                    canViewPayments: true,
                    canViewAll: true
                };
            case 'mozo':
                return {
                    canCreate: true,
                    canUpdate: true,
                    canDelete: false,
                    canProcessPayments: false,
                    canViewPayments: false,
                    canViewAll: false
                };
            case 'cocina':
                return {
                    canCreate: false,
                    canUpdate: false,
                    canDelete: false,
                    canProcessPayments: false,
                    canViewPayments: false,
                    canViewAll: true
                };
            case 'caja':
                return {
                    canCreate: false,
                    canUpdate: false,
                    canDelete: false,
                    canProcessPayments: true,
                    canViewPayments: true,
                    canViewAll: true
                };
            default:
                return {
                    canCreate: false,
                    canUpdate: false,
                    canDelete: false,
                    canProcessPayments: false,
                    canViewPayments: false,
                    canViewAll: false
                };
        }
    };

    const permissions = getRolePermissions();
    console.log('🔍 Permisos del usuario:', permissions);

    // Verificar si el usuario tiene permisos de acceso
    if (!user || !permissions.canViewAll) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-red-200 dark:from-slate-900 dark:via-red-800/60 dark:to-red-700/70">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
                    <div className="text-6xl mb-4">🚫</div>
                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                        Acceso Denegado
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Esta página requiere permisos de Admin, Mesero, Cocina o Caja.
                        <br />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                            Usuario actual: {user?.usuario || 'No autenticado'}
                        </span>
                        <br />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                            Rol: {user?.rol || 'Sin rol'}
                        </span>
                        <br />
                        <br />
                        <strong>¿Cómo acceder?</strong>
                        <br />
                        1. Asegúrate de estar logueado con uno de estos roles: <strong>admin, mozo, cocina, caja</strong>
                        <br />
                        2. Ve al sidebar izquierdo y busca "Gestión de Órdenes"
                        <br />
                        3. O accede directamente: <code>/admin/ordenes</code>
                        <br />
                        <br />
                        <strong>Si no ves el sidebar:</strong>
                        <br />
                        • El sidebar podría estar colapsado (clic en las barras)
                        <br />
                        • Verifica que tu sesión no haya expirado
                        <br />
                        • Intenta recargar la página
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Ir al Login
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Recargar Página
                        </button>
                        <button
                            onClick={() => {
                                console.log('🔍 Debug - SessionStorage:', sessionStorage);
                                console.log('🔍 Debug - LocalStorage:', localStorage);
                                console.log('🔍 Debug - Cookies:', document.cookie);
                                console.log('🔍 Debug - Current URL:', window.location.href);
                                console.log('🔍 Debug - Pathname:', window.location.pathname);
                            }}
                            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Debug Info
                        </button>
                        <button
                            onClick={() => {
                                // Intentar acceder directamente
                                window.location.href = '/admin/ordenes';
                            }}
                            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Acceder Directamente
                        </button>
                        <button
                            onClick={() => {
                                // Verificar rutas disponibles
                                console.log('🔍 Rutas disponibles:', [
                                    '/admin',
                                    '/admin/usuarios',
                                    '/admin/ordenes',
                                    '/admin/productos',
                                    '/admin/categorias',
                                    '/admin/local',
                                    '/admin/auditoria',
                                    '/admin/reservas',
                                    '/admin/bloqueos',
                                    '/admin/calendario',
                                    '/admin/ingredientes',
                                    '/admin/tipos-ingrediente',
                                    '/admin/producto-ingrediente'
                                ]);
                                alert('Rutas disponibles verificadas en consola. Revisa la consola del navegador.');
                            }}
                            className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Ver Rutas Disponibles
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [mozos, setMozos] = useState<Usuario[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterTipo, setFilterTipo] = useState('');

    // Estados de búsqueda para modales
    const [mesaSearchTerm, setMesaSearchTerm] = useState('');
    const [mozoSearchTerm, setMozoSearchTerm] = useState('');
    const [productSearchTerm, setProductSearchTerm] = useState('');

    // Estados para modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedOrdenToDelete, setSelectedOrdenToDelete] = useState<Orden | null>(null);
    const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAuxiliary, setLoadingAuxiliary] = useState(false);

    // Form states
    const [ordenForm, setOrdenForm] = useState<OrdenForm>({
        mesa_id: '',
        mozo_id: '',
        tipo: 'local',
        cliente_nombre: '',
        num_comensales: 1
    });
    const [itemForm, setItemForm] = useState<ItemForm>({
        producto_id: '',
        cantidad: 1,
        precio_unitario: 0,
        estacion: '',
        notas: ''
    });

    // Estados para pagos
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [cuentasAbiertas, setCuentasAbiertas] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'ordenes' | 'pagos'>('ordenes');
    const [pagoForm, setPagoForm] = useState<PagoForm>({
        orden_id: '',
        metodo: 'efectivo',
        monto: 0
    });
    const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
    const [isPagoViewModalOpen, setIsPagoViewModalOpen] = useState(false);
    const [isAnularPagoModalOpen, setIsAnularPagoModalOpen] = useState(false);
    const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
    const [pagoStats, setPagoStats] = useState<any>(null);
    const [pagoSearchTerm, setPagoSearchTerm] = useState('');
    const [pagoFilterMetodo, setPagoFilterMetodo] = useState('');
    const [pagoFilterEstado, setPagoFilterEstado] = useState('');

    // Form states

    // Funciones para cargar datos de pagos
    const loadPagos = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/orden/pagos');
            console.log('💳 Pagos cargados:', response);

            if (response && typeof response === 'object') {
                let pagosData: Pago[] = [];

                if (Array.isArray(response)) {
                    pagosData = response as Pago[];
                } else if ((response as any)?.success && (response as any)?.data) {
                    pagosData = (response as any).data;
                } else if ((response as any)?.data && Array.isArray((response as any).data)) {
                    pagosData = (response as any).data;
                }

                console.log('💳 Pagos procesados:', pagosData.length);
                setPagos(pagosData);
            }
        } catch (error) {
            console.error('❌ Error cargando pagos:', error);
            toast.error('Error al cargar pagos');
        }
    }, []);

    const loadCuentasAbiertas = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/orden/cuentas-abiertas');
            console.log('💳 Cuentas abiertas:', response);

            if (response && typeof response === 'object') {
                let cuentasData: any[] = [];

                if (Array.isArray(response)) {
                    cuentasData = response;
                } else if ((response as any)?.success && (response as any)?.data) {
                    cuentasData = (response as any).data;
                } else if ((response as any)?.data && Array.isArray((response as any).data)) {
                    cuentasData = (response as any).data;
                }

                console.log('💳 Cuentas procesadas:', cuentasData.length);
                setCuentasAbiertas(cuentasData);
            }
        } catch (error) {
            console.error('❌ Error cargando cuentas abiertas:', error);
            toast.error('Error al cargar cuentas abiertas');
        }
    }, []);

    const loadPagoStats = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/orden/pagos/estadisticas');
            console.log('📊 Estadísticas de pagos:', response);

            if (response && typeof response === 'object') {
                let statsData: any = null;

                if ((response as any)?.success && (response as any)?.data) {
                    statsData = (response as any).data;
                } else if ((response as any)?.data) {
                    statsData = (response as any).data;
                }

                console.log('📊 Estadísticas procesadas:', statsData);
                setPagoStats(statsData);
            }
        } catch (error) {
            console.error('❌ Error cargando estadísticas de pagos:', error);
            toast.error('Error al cargar estadísticas');
        }
    }, []);

    const loadOrdenes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/orden/');

            let ordenesData;
            if (Array.isArray(response)) {
                ordenesData = response;
            } else if ((response as any)?.success && (response as any)?.data) {
                ordenesData = (response as any).data;
            } else if ((response as any)?.data && Array.isArray((response as any).data)) {
                ordenesData = (response as any).data;
            } else {
                console.error('❌ Error en respuesta de órdenes:', response);
                setOrdenes([]);
                toast.error('Error al cargar órdenes');
                return;
            }

            // Sanitizar datos
            const ordenesSanitizadas = ordenesData.map((orden: any) => ({
                id: orden.id || 0,
                numero: orden.numero || '',
                mesa_id: orden.mesa_id || 0,
                mozo_id: orden.mozo_id || 0,
                tipo: orden.tipo || '',
                estado: orden.estado || 'pendiente',
                monto_total: orden.monto_total || 0,
                cliente_nombre: orden.cliente_nombre || '',
                creado_en: orden.creado_en || new Date().toISOString(),
                actualizado_en: orden.actualizado_en || new Date().toISOString(),
                mesa: orden.mesa || { numero: '', zona: '', piso: '' },
                mozo: orden.mozo || { usuario: '' },
                items: orden.items || []
            }));

            console.log('📋 Órdenes cargadas:', ordenesSanitizadas.length);
            setOrdenes(ordenesSanitizadas);
        } catch (error) {
            console.error('❌ Error cargando órdenes:', error);
            toast.error('Error al cargar órdenes');
            setOrdenes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar mesas
    const loadMesas = useCallback(async () => {
        try {
            const mesasResponse = await apiClient.get('/api/local/mesas');
            console.log('📋 Mesas cargadas:', (mesasResponse as any)?.data?.length || 0);

            let mesasData;
            if (Array.isArray(mesasResponse)) {
                mesasData = mesasResponse;
            } else if ((mesasResponse as any)?.success && (mesasResponse as any)?.data) {
                mesasData = (mesasResponse as any).data;
            } else if ((mesasResponse as any)?.data && Array.isArray((mesasResponse as any).data)) {
                mesasData = (mesasResponse as any).data;
            } else {
                console.error('❌ Error en respuesta de mesas:', mesasResponse);
                return;
            }

            setMesas(mesasData);
        } catch (error) {
            console.error('❌ Error cargando mesas:', error?.message);
        }
    }, []);

    // Cargar mozos
    const loadMozos = useCallback(async () => {
        try {
            const mozosResponse = await apiClient.get('/api/admin/users');

            let usuariosData;
            if (Array.isArray(mozosResponse)) {
                usuariosData = mozosResponse;
            } else if ((mozosResponse as any)?.success && (mozosResponse as any)?.data) {
                usuariosData = (mozosResponse as any).data;
            } else if ((mozosResponse as any)?.data && Array.isArray((mozosResponse as any).data)) {
                usuariosData = (mozosResponse as any).data;
            } else {
                console.error('❌ Error en respuesta de mozos:', mozosResponse);
                return;
            }

            // Filtrar usuarios con rol 'mozo' o 'mesero'
            const usuariosMozos = usuariosData.filter((u: any) => u.rol === 'mozo' || u.rol === 'mesero');
            console.log('👤 Mozos cargados:', usuariosMozos.length);

            setMozos(usuariosMozos);
        } catch (error) {
            console.error('❌ Error cargando mozos:', error?.message);
        }
    }, []);

    // Cargar productos
    const loadProductos = useCallback(async () => {
        try {
            const productosResponse = await apiClient.get('/api/producto/');

            let productosData;
            if (Array.isArray(productosResponse)) {
                productosData = productosResponse;
            } else if ((productosResponse as any)?.success && (productosResponse as any)?.data) {
                productosData = (productosResponse as any).data;
            } else if ((productosResponse as any)?.data && Array.isArray((productosResponse as any).data)) {
                productosData = (productosResponse as any).data;
            } else {
                console.error('❌ Error en respuesta de productos:', productosResponse);
                return;
            }

            console.log('🥘 Productos cargados:', productosData.length);
            setProductos(productosData);
        } catch (error) {
            console.error('❌ Error cargando productos:', error?.message);
        }
    }, []);

    useEffect(() => {
        // Verificar autenticación básica
        const token = sessionStorage.getItem('accessToken');
        const userData = sessionStorage.getItem('userData');

        if (!userData) {
            console.error('❌ No hay sesión activa');
            toast.error('No hay sesión activa. Redirigiendo al login...');
            window.location.href = '/login';
            return;
        }

        try {
            const user = JSON.parse(userData);
            if (!user?.rol || !['admin', 'mozo', 'cocina', 'caja'].includes(user?.rol)) {
                console.error('❌ Usuario no tiene rol autorizado:', user?.rol);
                toast.error('Acceso denegado. Se requiere rol de Admin, Mozo, Cocina o Caja.');
                return;
            }
        } catch (e) {
            console.error('❌ Error parsing userData:', e);
            toast.error('Error de sesión. Redirigiendo al login...');
            window.location.href = '/login';
            return;
        }

        console.log('✅ Cargando datos para Admin...');
        loadOrdenes();
        loadMesas();
        loadMozos();
        loadProductos();
        loadPagos();
        loadCuentasAbiertas();
        loadPagoStats();
    }, [loadOrdenes, loadMesas, loadMozos, loadProductos, loadPagos, loadCuentasAbiertas, loadPagoStats]);


    // Mostrar resumen de datos cargados
    useEffect(() => {
        if (mesas.length > 0 || mozos.length > 0 || productos.length > 0 || ordenes.length > 0) {
            console.log('✅ Datos cargados exitosamente:',
                `📋 Mesas: ${mesas.length}`,
                `👤 Mozos: ${mozos.length}`,
                `🥘 Productos: ${productos.length}`,
                `📝 Órdenes: ${ordenes.length}`);
        }
    }, [mesas, mozos, productos, ordenes]);

    // Filtrar mesas disponibles (solo para crear órdenes)
    const mesasDisponibles = useMemo(() => {
        return mesas.filter(mesa => mesa.estado === 'disponible' && mesa.activo);
    }, [mesas]);

    // Filtrar mesas basadas en el término de búsqueda (incluyendo todas las mesas)
    const filteredMesas = useMemo(() => {
        if (!mesaSearchTerm.trim()) return mesas;

        return mesas.filter(mesa => {
            const numero = (mesa.numero || '').toLowerCase();
            const zona = (mesa.zona || '').toLowerCase();
            const piso = (mesa.piso || '').toLowerCase();

            return numero.includes(mesaSearchTerm.toLowerCase()) ||
                   zona.includes(mesaSearchTerm.toLowerCase()) ||
                   piso.includes(mesaSearchTerm.toLowerCase());
        });
    }, [mesas, mesaSearchTerm]);

    // Filtrar mesas disponibles basadas en el término de búsqueda
    const filteredMesasDisponibles = useMemo(() => {
        if (!mesaSearchTerm.trim()) return mesasDisponibles;

        return mesasDisponibles.filter(mesa => {
            const numero = (mesa.numero || '').toLowerCase();
            const zona = (mesa.zona || '').toLowerCase();
            const piso = (mesa.piso || '').toLowerCase();

            return numero.includes(mesaSearchTerm.toLowerCase()) ||
                   zona.includes(mesaSearchTerm.toLowerCase()) ||
                   piso.includes(mesaSearchTerm.toLowerCase());
        });
    }, [mesasDisponibles, mesaSearchTerm]);

    // Filtrar pagos basados en los términos de búsqueda
    const filteredPagos = useMemo(() => {
        let filtered = pagos;

        if (pagoSearchTerm.trim()) {
            const searchLower = pagoSearchTerm.toLowerCase();
            filtered = filtered.filter(pago =>
                (pago.orden?.numero || '').toLowerCase().includes(searchLower) ||
                pago.metodo.toLowerCase().includes(searchLower) ||
                pago.estado.toLowerCase().includes(searchLower)
            );
        }

        if (pagoFilterMetodo) {
            filtered = filtered.filter(pago => pago.metodo === pagoFilterMetodo);
        }

        if (pagoFilterEstado) {
            filtered = filtered.filter(pago => pago.estado === pagoFilterEstado);
        }

        return filtered;
    }, [pagos, pagoSearchTerm, pagoFilterMetodo, pagoFilterEstado]);

    // Filtrar mozos basados en el término de búsqueda
    const filteredMozos = useMemo(() => {
        if (!mozoSearchTerm.trim()) return mozos;

        return mozos.filter(mozo => {
            const usuario = (mozo.usuario || '').toLowerCase();
            const rol = (mozo.rol || '').toLowerCase();

            return usuario.includes(mozoSearchTerm.toLowerCase()) ||
                   rol.includes(mozoSearchTerm.toLowerCase());
        });
    }, [mozos, mozoSearchTerm]);

    // Filtrar productos basados en el término de búsqueda
    const filteredProductos = useMemo(() => {
        if (!productSearchTerm.trim()) return productos;

        return productos.filter(producto => {
            const nombre = (producto.nombre || '').toLowerCase();
            const precio = (producto.precio || 0).toString();

            return nombre.includes(productSearchTerm.toLowerCase()) ||
                   precio.includes(productSearchTerm.toLowerCase());
        });
    }, [productos, productSearchTerm]);

    // Filtrar órdenes
    const ordenesFiltradas = ordenes.filter((orden) => {
        const matchesSearch = searchTerm === '' ||
            (orden.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (orden.cliente_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (orden.mesa?.numero || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesEstado = filterEstado === '' || orden.estado === filterEstado;
        const matchesTipo = filterTipo === '' || orden.tipo === filterTipo;

        return matchesSearch && matchesEstado && matchesTipo;
    });

    // Funciones CRUD
    const handleCreateOrden = async () => {
        // Validaciones previas
        if (!ordenForm.mesa_id) {
            toast.error('⚠️ Debes seleccionar una mesa disponible');
            return;
        }

        // Verificar que la mesa seleccionada esté disponible
        const mesaSeleccionada = mesasDisponibles.find(m => m.id.toString() === ordenForm.mesa_id);
        if (!mesaSeleccionada) {
            toast.error('⚠️ La mesa seleccionada no está disponible. Por favor, selecciona otra mesa.');
            return;
        }

        if (!ordenForm.mozo_id) {
            toast.error('⚠️ Debes seleccionar un mozo');
            return;
        }

        if (!ordenForm.tipo) {
            toast.error('⚠️ Debes seleccionar un tipo de orden');
            return;
        }

        if (!ordenForm.num_comensales || ordenForm.num_comensales < 1) {
            toast.error('⚠️ El número de comensales debe ser al menos 1');
            return;
        }

        try {
            setIsLoading(true);
            console.log('📝 Creando orden con datos:', ordenForm);

            const response = await apiClient.post('/api/orden/', ordenForm);
            console.log('📝 Respuesta de crear orden:', response);

            if ((response as any)?.success) {
                toast.success('✅ Orden creada exitosamente');
                setIsCreateModalOpen(false);
                setOrdenForm({
                    mesa_id: '',
                    mozo_id: '',
                    tipo: 'local',
                    cliente_nombre: '',
                    num_comensales: 1
                });
                setMesaSearchTerm('');
                setMozoSearchTerm('');
                loadOrdenes();
            } else {
                const errorMessage = (response as any)?.error || 'Error al crear orden';
                toast.error(`❌ ${errorMessage}`);
            }
        } catch (error: any) {
            console.error('Error creando orden:', error);

            // Manejo específico de diferentes tipos de errores
            let errorMessage = 'Error al crear orden';

            if (error?.response?.status === 400) {
                // Error de validación (Bad Request)
                const backendError = error?.response?.data?.error;
                if (backendError) {
                    errorMessage = backendError;
                } else if (error?.response?.data?.details) {
                    errorMessage = error.response.data.details;
                } else {
                    errorMessage = 'Datos inválidos para crear la orden';
                }
            } else if (error?.response?.status === 403) {
                errorMessage = 'No tienes permisos para crear órdenes';
            } else if (error?.response?.status === 409) {
                errorMessage = 'Conflicto: la mesa ya está ocupada';
            } else if (error?.response?.status === 500) {
                errorMessage = 'Error interno del servidor. Intenta nuevamente';
            } else if (!error?.response) {
                errorMessage = 'Error de conexión. Verifica tu conexión a internet';
            }

            toast.error(`❌ ${errorMessage}`, {
                duration: 5000,
                style: {
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca'
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditOrden = async () => {
        if (!selectedOrden) return;

        // Validaciones previas
        if (!ordenForm.mesa_id) {
            toast.error('⚠️ Debes seleccionar una mesa');
            return;
        }

        if (!ordenForm.mozo_id) {
            toast.error('⚠️ Debes seleccionar un mozo');
            return;
        }

        try {
            setIsLoading(true);
            console.log('📝 Editando orden con datos:', ordenForm);

            const response = await apiClient.put(`/api/orden/${selectedOrden.id}`, ordenForm);
            console.log('📝 Respuesta de editar orden:', response);

            if ((response as any)?.success) {
                toast.success('✅ Orden editada exitosamente');
                setIsEditModalOpen(false);
                setSelectedOrden(null);
                loadOrdenes();
            } else {
                const errorMessage = (response as any)?.error || 'Error al editar orden';
                toast.error(`❌ ${errorMessage}`);
            }
        } catch (error: any) {
            console.error('Error editando orden:', error);

            // Manejo específico de diferentes tipos de errores
            let errorMessage = 'Error al editar orden';

            if (error?.response?.status === 400) {
                const backendError = error?.response?.data?.error;
                if (backendError) {
                    errorMessage = backendError;
                } else {
                    errorMessage = 'Datos inválidos para editar la orden';
                }
            } else if (error?.response?.status === 403) {
                errorMessage = 'No tienes permisos para editar órdenes';
            } else if (error?.response?.status === 404) {
                errorMessage = 'Orden no encontrada';
            } else if (error?.response?.status === 409) {
                errorMessage = 'Conflicto: la mesa ya está ocupada';
            } else if (!error?.response) {
                errorMessage = 'Error de conexión. Verifica tu conexión a internet';
            }

            toast.error(`❌ ${errorMessage}`, {
                duration: 5000,
                style: {
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca'
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Funciones CRUD para pagos
    const handleProcesarPago = async () => {
        if (!pagoForm.orden_id) {
            toast.error('⚠️ Debes seleccionar una orden');
            return;
        }

        if (!pagoForm.metodo) {
            toast.error('⚠️ Debes seleccionar un método de pago');
            return;
        }

        if (pagoForm.monto <= 0) {
            toast.error('⚠️ El monto debe ser mayor a 0');
            return;
        }

        try {
            setIsLoading(true);
            console.log('💳 Procesando pago:', pagoForm);

            const response = await apiClient.post(`/api/orden/${pagoForm.orden_id}/pagar`, pagoForm);
            console.log('💳 Respuesta de procesar pago:', response);

            if ((response as any)?.success) {
                toast.success('✅ Pago procesado exitosamente');
                setIsPagoModalOpen(false);
                setPagoForm({
                    orden_id: '',
                    metodo: 'efectivo',
                    monto: 0
                });
                loadPagos();
                loadCuentasAbiertas();
                loadOrdenes();
            } else {
                const errorMessage = (response as any)?.error || 'Error al procesar pago';
                toast.error(`❌ ${errorMessage}`);
            }
        } catch (error: any) {
            console.error('Error procesando pago:', error);

            let errorMessage = 'Error al procesar pago';
            if (error?.response?.status === 400) {
                const backendError = error?.response?.data?.error;
                if (backendError) {
                    errorMessage = backendError;
                } else {
                    errorMessage = 'Datos inválidos para procesar el pago';
                }
            } else if (error?.response?.status === 403) {
                errorMessage = 'No tienes permisos para procesar pagos';
            } else if (error?.response?.status === 409) {
                errorMessage = 'La orden ya está pagada o no está lista para pagar';
            } else if (!error?.response) {
                errorMessage = 'Error de conexión. Verifica tu conexión a internet';
            }

            toast.error(`❌ ${errorMessage}`, {
                duration: 5000,
                style: {
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca'
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    const openAnularPagoModal = (pago: Pago) => {
        setSelectedPago(pago);
        setIsPagoViewModalOpen(false); // Cerrar el modal de vista si está abierto
        setIsAnularPagoModalOpen(true); // Abrir el modal de anulación
    };

    const handleAnularPago = async () => {
        if (!selectedPago) return;

        // Validaciones antes de anular
        if (selectedPago.estado !== 'pagado') {
            toast.error('⚠️ Solo se pueden anular pagos que estén en estado "pagado"');
            return;
        }

        // Validar que no haya pasado mucho tiempo (ejemplo: 24 horas)
        const pagoFecha = new Date(selectedPago.fecha);
        const ahora = new Date();
        const horasTranscurridas = (ahora.getTime() - pagoFecha.getTime()) / (1000 * 60 * 60);

        if (horasTranscurridas > 24) {
            toast.error('⚠️ No se puede anular un pago después de 24 horas');
            return;
        }

        // Nota: Las validaciones adicionales (orden modificada, etc.) se manejan en el backend

        try {
            setIsLoading(true);
            console.log('💳 Anulando pago ID:', selectedPago.id);

            const response = await apiClient.put(`/api/orden/pagos/${selectedPago.id}/anular`, {});
            console.log('💳 Respuesta de anular pago:', response);

            if ((response as any)?.success) {
                toast.success('✅ Pago anulado exitosamente');
                setSelectedPago(null);
                setIsAnularPagoModalOpen(false);
                loadPagos();
                loadCuentasAbiertas();
                loadOrdenes();
            } else {
                const errorMessage = (response as any)?.error || 'Error al anular pago';
                toast.error(`❌ ${errorMessage}`);
            }
            } catch (error: any) {
                console.error('Error anulando pago:', error);

                let errorMessage = 'Error al anular pago';
                if (error?.response?.status === 403) {
                    errorMessage = 'No tienes permisos para anular pagos';
                } else if (error?.response?.status === 404) {
                    errorMessage = 'Pago no encontrado';
                } else if (error?.response?.status === 409) {
                    const backendError = error?.response?.data?.error || error?.response?.data?.details;
                    if (backendError) {
                        errorMessage = backendError;
                    } else {
                        errorMessage = 'No se puede anular este pago (validaciones de seguridad)';
                    }
                } else if (!error?.response) {
                    errorMessage = 'Error de conexión. Verifica tu conexión a internet';
                }

                toast.error(`❌ ${errorMessage}`, {
                    duration: 5000,
                    style: {
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca'
                    }
                });
            } finally {
                setIsLoading(false);
                setIsAnularPagoModalOpen(false);
            }
    };

    const openPagoModal = (cuenta: any) => {
        setPagoForm({
            orden_id: cuenta.id_orden.toString(),
            metodo: 'efectivo',
            monto: cuenta.total_orden
        });
        setIsPagoModalOpen(true);
    };

    const openPagoViewModal = (pago: Pago) => {
        setSelectedPago(pago);
        setIsPagoViewModalOpen(true);
    };

    const openDeleteModal = (orden: Orden) => {
        setSelectedOrdenToDelete(orden);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteOrden = async () => {
        if (!selectedOrdenToDelete) return;

        try {
            setIsLoading(true);
            console.log('🗑️ Eliminando orden ID:', selectedOrdenToDelete.id);

            const response = await apiClient.del(`/api/orden/${selectedOrdenToDelete.id}`);
            console.log('🗑️ Respuesta de eliminar orden:', response);

            if ((response as any)?.success) {
                toast.success('✅ Orden eliminada exitosamente');
                setIsDeleteModalOpen(false);
                setSelectedOrdenToDelete(null);
                loadOrdenes();
            } else {
                const errorMessage = (response as any)?.error || 'Error al eliminar orden';
                toast.error(`❌ ${errorMessage}`);
            }
        } catch (error: any) {
            console.error('Error eliminando orden:', error);

            // Manejo específico de diferentes tipos de errores
            let errorMessage = 'Error al eliminar orden';

            if (error?.response?.status === 403) {
                errorMessage = 'No tienes permisos para eliminar órdenes';
            } else if (error?.response?.status === 404) {
                errorMessage = 'Orden no encontrada';
            } else if (error?.response?.status === 409) {
                errorMessage = 'No se puede eliminar: la orden está en proceso';
            } else if (!error?.response) {
                errorMessage = 'Error de conexión. Verifica tu conexión a internet';
            } else {
                const backendError = error?.response?.data?.error;
                if (backendError) {
                    errorMessage = backendError;
                }
            }

            toast.error(`❌ ${errorMessage}`, {
                duration: 5000,
                style: {
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca'
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!selectedOrden) return;

        // Validaciones previas
        if (!itemForm.producto_id) {
            toast.error('⚠️ Debes seleccionar un producto');
            return;
        }

        if (!itemForm.cantidad || itemForm.cantidad <= 0) {
            toast.error('⚠️ La cantidad debe ser mayor a 0');
            return;
        }

        if (!itemForm.estacion) {
            toast.error('⚠️ Debes seleccionar una estación');
            return;
        }

        try {
            setIsLoading(true);
            console.log('🥘 Agregando producto a orden:', itemForm);

            const itemData = {
                ...itemForm,
                orden_id: selectedOrden.id
            };

            const response = await apiClient.post(`/api/orden/${selectedOrden.id}/productos`, itemData);
            console.log('🥘 Respuesta de agregar producto:', response);

            if ((response as any)?.success) {
                toast.success('✅ Producto agregado exitosamente');
                setIsItemModalOpen(false);
                setItemForm({
                    producto_id: '',
                    cantidad: 1,
                    precio_unitario: 0,
                    estacion: '',
                    notas: ''
                });
                setProductSearchTerm('');
                loadOrdenes();
            } else {
                const errorMessage = (response as any)?.error || 'Error al agregar producto';
                toast.error(`❌ ${errorMessage}`);
            }
        } catch (error: any) {
            console.error('Error agregando producto:', error);

            // Manejo específico de diferentes tipos de errores
            let errorMessage = 'Error al agregar producto';

            if (error?.response?.status === 400) {
                const backendError = error?.response?.data?.error;
                if (backendError) {
                    errorMessage = backendError;
                } else {
                    errorMessage = 'Datos inválidos para agregar el producto';
                }
            } else if (error?.response?.status === 403) {
                errorMessage = 'No tienes permisos para agregar productos';
            } else if (error?.response?.status === 404) {
                errorMessage = 'Orden o producto no encontrado';
            } else if (error?.response?.status === 409) {
                errorMessage = 'No se puede agregar: la orden está en proceso';
            } else if (!error?.response) {
                errorMessage = 'Error de conexión. Verifica tu conexión a internet';
            }

            toast.error(`❌ ${errorMessage}`, {
                duration: 5000,
                style: {
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca'
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    const openEditModal = (orden: Orden) => {
        setSelectedOrden(orden);
        setOrdenForm({
            mesa_id: orden.mesa_id.toString(),
            mozo_id: orden.mozo_id.toString(),
            tipo: orden.tipo,
            cliente_nombre: orden.cliente_nombre
        });
        setIsEditModalOpen(true);
    };

    const openViewModal = (orden: Orden) => {
        setSelectedOrden(orden);
        setIsViewModalOpen(true);
    };

    const openItemModal = (orden: Orden) => {
        setSelectedOrden(orden);
        setIsItemModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-slate-900 dark:via-blue-800/60 dark:to-blue-700/70">
                <div className="relative">
                    <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-300 dark:border-blue-600 border-t-blue-600 dark:border-t-blue-400 shadow-2xl"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl animate-bounce">📋</div>
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white/90 dark:bg-slate-800/90 px-6 py-3 rounded-2xl shadow-xl border-2 border-blue-300 dark:border-blue-500 backdrop-blur-sm">
                            <p className="text-lg text-blue-700 dark:text-blue-300 font-bold">Cargando órdenes...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
        >
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                📋 Gestión de Órdenes y Pagos
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                Sistema completo de gestión con órdenes y procesamiento de pagos
                            </p>
                        </div>
                    </div>

                    {/* Pestañas */}
                    <div className="flex gap-2 mt-6 border-b border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setActiveTab('ordenes')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                                activeTab === 'ordenes'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            📋 Órdenes ({ordenes.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('pagos')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                                activeTab === 'pagos'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            💳 Pagos ({pagos.length})
                        </button>
                    </div>

                    {/* Contenido de pestañas */}
                    {activeTab === 'ordenes' && (
                        <div className="text-right">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Total: {ordenes.length} órdenes
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Filtradas: {ordenesFiltradas.length}
                            </p>
                        </div>
                    )}

                    {activeTab === 'pagos' && (
                        <div className="text-right">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Total: {pagos.length} pagos
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {filteredPagos.length} mostrados
                            </p>
                            {pagoStats && (
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                    💰 Ingresos hoy: S/ {pagoStats.ingresos_hoy.toFixed(2)}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Toolbar */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex-1 w-full lg:w-auto">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por número, cliente o mesa..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full lg:w-96 pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                />
                                <MagnifyingGlassIcon className="h-6 w-6 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="flex gap-3 w-full lg:w-auto">
                            <select
                                value={filterEstado}
                                onChange={(e) => setFilterEstado(e.target.value)}
                                className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-lg"
                            >
                                <option value="">Todos los estados</option>
                                <option value="pendiente">⏳ Pendiente</option>
                                <option value="confirmada">✅ Confirmada</option>
                                <option value="preparando">🔄 Preparando</option>
                                <option value="lista">🍽️ Lista</option>
                                <option value="servida">✅ Servida</option>
                                <option value="pagada">💰 Pagada</option>
                                <option value="cancelada">❌ Cancelada</option>
                            </select>

                            <select
                                value={filterTipo}
                                onChange={(e) => setFilterTipo(e.target.value)}
                                className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-lg"
                            >
                                <option value="">Todos los tipos</option>
                                <option value="local">🏠 Local</option>
                                <option value="llevar">🥡 Para llevar</option>
                                <option value="delivery">🚚 Delivery</option>
                            </select>

                            <div className="flex gap-2">
                                {permissions.canCreate && (
                                    <button
                                        onClick={() => {
                                            setOrdenForm({
                                                mesa_id: '',
                                                mozo_id: '',
                                                tipo: 'local',
                                                cliente_nombre: '',
                                                num_comensales: 1
                                            });
                                            setMesaSearchTerm('');
                                            setMozoSearchTerm('');
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        <PlusIcon className="h-5 w-5" />
                                        Nueva Orden
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        loadMesas();
                                        loadMozos();
                                        loadProductos();
                                    }}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                    title="Recargar datos auxiliares"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Recargar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenido de pestañas - PAGOS */}
                {activeTab === 'pagos' && (
                    <div className="space-y-6">
                        {/* Toolbar para Pagos */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                <div className="flex-1 w-full lg:w-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Búsqueda */}
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                            <input
                                                type="text"
                                                placeholder="Buscar pagos..."
                                                value={pagoSearchTerm}
                                                onChange={(e) => setPagoSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* Filtro por método */}
                                        <select
                                            value={pagoFilterMetodo}
                                            onChange={(e) => setPagoFilterMetodo(e.target.value)}
                                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Todos los métodos</option>
                                            <option value="efectivo">💵 Efectivo</option>
                                            <option value="tarjeta">💳 Tarjeta</option>
                                            <option value="yape">📱 Yape</option>
                                            <option value="plin">📱 Plin</option>
                                            <option value="transferencia">🏦 Transferencia</option>
                                        </select>

                                        {/* Filtro por estado */}
                                        <select
                                            value={pagoFilterEstado}
                                            onChange={(e) => setPagoFilterEstado(e.target.value)}
                                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Todos los estados</option>
                                            <option value="pendiente">⏳ Pendiente</option>
                                            <option value="pagado">✅ Pagado</option>
                                            <option value="anulado">❌ Anulado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={loadPagos}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Recargar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Estadísticas de Pagos */}
                        {pagoStats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-800/10 rounded-xl p-6 border border-green-200 dark:border-green-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                                            <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-600 dark:text-green-400">Ingresos Hoy</p>
                                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                                S/ {pagoStats.ingresos_hoy.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-800/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                            <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-600 dark:text-blue-400">Pagos Activos</p>
                                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                                {pagoStats.pagos_activos}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-800/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                                            <DocumentTextIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-purple-600 dark:text-purple-400">Total Pagos</p>
                                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                                {pagoStats.total_pagos}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-800/10 rounded-xl p-6 border border-red-200 dark:border-red-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                                            <XMarkIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-red-600 dark:text-red-400">Anulados</p>
                                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                                                {pagoStats.pagos_anulados}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Cuentas abiertas para pagar - Solo visible para usuarios que pueden procesar pagos */}
                        {permissions.canProcessPayments && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                                        <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            💳 Cuentas Abiertas
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Órdenes listas para procesar pago
                                        </p>
                                    </div>
                                </div>

                            {cuentasAbiertas.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3">💰</div>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        No hay cuentas abiertas para pagar
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {cuentasAbiertas.map((cuenta) => (
                                        <motion.div
                                            key={cuenta.id_orden}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-800/10 rounded-xl p-4 border border-green-200 dark:border-green-800"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-green-800 dark:text-green-200">
                                                        Mesa {cuenta.numero_mesa}
                                                    </h4>
                                                    <p className="text-sm text-green-600 dark:text-green-300">
                                                        Mozo: {cuenta.mozo}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                                        S/ {cuenta.total_orden.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-green-600 dark:text-green-400">
                                                        {cuenta.items.length} productos
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => openPagoModal(cuenta)}
                                                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CurrencyDollarIcon className="h-4 w-4" />
                                                Procesar Pago
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                        )}

                        {/* Lista de Pagos - Solo visible para usuarios que pueden ver pagos */}
                        {permissions.canViewPayments && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                    <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        📊 Historial de Pagos
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Todos los pagos procesados y anulados
                                    </p>
                                </div>
                            </div>

                            {filteredPagos.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3">💳</div>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        No se encontraron pagos
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredPagos.map((pago) => (
                                        <motion.div
                                            key={pago.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">
                                                        Pago #{pago.id}
                                                    </h4>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        Orden #{pago.orden?.numero || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    pago.estado === 'pagado'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                                        : pago.estado === 'anulado'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                                                }`}>
                                                    {pago.estado.toUpperCase()}
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">Monto:</span>
                                                    <span className="font-medium text-slate-900 dark:text-white">
                                                        S/ {pago.monto.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">Método:</span>
                                                    <span className="font-medium text-slate-900 dark:text-white">
                                                        {pago.metodo}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">Fecha:</span>
                                                    <span className="font-medium text-slate-900 dark:text-white">
                                                        {new Date(pago.fecha).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openPagoViewModal(pago)}
                                                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                    Ver
                                                </button>
                                                {pago.estado === 'pagado' && (
                                                    <button
                                                        onClick={() => openAnularPagoModal(pago)}
                                                        className="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                        )}
                    </div>
                )}

                {/* Resultados */}
                {activeTab === 'ordenes' && ordenesFiltradas.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            No se encontraron órdenes
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {searchTerm || filterEstado || filterTipo
                                ? 'Ajusta los filtros para ver más resultados'
                                : 'Las órdenes aparecerán aquí cuando se creen desde el sistema'}
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
                                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300"
                                    >
                                        {/* Header */}
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

                                                <div className="flex items-center gap-2 mb-3">
                                                    <ClockIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                            Creada: {dateTime.dateTime}
                                                        </p>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            Cliente: {orden.cliente_nombre || 'Sin nombre'}
                                                        </p>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            👥 {orden.num_comensales} comensal{orden.num_comensales !== 1 ? 'es' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    S/ {(orden.monto_total || 0).toFixed(2)}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {orden.items.length} producto{orden.items.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Productos */}
                                        {orden.items.length > 0 && (
                                            <div className="space-y-2 mb-4">
                                                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                    <DocumentTextIcon className="h-4 w-4" />
                                                    Productos ({orden.items.length})
                                                </h4>
                                                {orden.items.slice(0, 3).map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white">
                                                                {item.producto?.nombre || `Producto #${item.producto_id}`}
                                                            </p>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                Cant: {item.cantidad} • S/ {item.precio_unitario}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColorGlobal(item.estado)}`}>
                                                            {getEstadoIconGlobal(item.estado)} {getEstadoDisplayNameGlobal(item.estado)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {orden.items.length > 3 && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                                                        +{orden.items.length - 3} productos más...
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-600">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openViewModal(orden)}
                                                    className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                    title="Ver detalles"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(orden)}
                                                    className="px-3 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
                                                    title="Editar orden"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
            <button
                onClick={() => {
                    setItemForm({
                        producto_id: '',
                        cantidad: 1,
                        precio_unitario: 0,
                        estacion: '',
                        notas: ''
                    });
                    setProductSearchTerm('');
                    openItemModal(orden);
                }}
                className="px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                title="Agregar producto"
            >
                <PlusIcon className="h-4 w-4" />
            </button>
                                            </div>
                                            <button
                                                onClick={() => openDeleteModal(orden)}
                                                disabled={isLoading}
                                                className="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                                                title="Eliminar orden"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                    </div>
                )}

                {/* Panel de Debug (solo visible cuando hay problemas) */}
                {(mesas.length === 0 || mozos.length === 0 || productos.length === 0) && !loading && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                        <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
                            🔍 Debug - Datos Auxiliares
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <strong className="text-yellow-700 dark:text-yellow-300">Mesas:</strong>
                                <p className="text-yellow-600 dark:text-yellow-400">
                                    {mesas.length} cargadas
                                </p>
                                {mesas.length > 0 && (
                                    <p className="text-xs text-yellow-500">
                                        Ej: Mesa {mesas[0].numero} ({mesas[0].zona})
                                    </p>
                                )}
                            </div>
                            <div>
                                <strong className="text-yellow-700 dark:text-yellow-300">Mozos:</strong>
                                <p className="text-yellow-600 dark:text-yellow-400">
                                    {mozos.length} cargados
                                </p>
                                {mozos.length > 0 && (
                                    <p className="text-xs text-yellow-500">
                                        Ej: {mozos[0].usuario} ({mozos[0].rol})
                                    </p>
                                )}
                                {mozos.length === 0 && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        ⚠️ No se encontraron mozos con rol 'mozo' o 'mesero'
                                    </p>
                                )}
                            </div>
                            <div>
                                <strong className="text-yellow-700 dark:text-yellow-300">Productos:</strong>
                                <p className="text-yellow-600 dark:text-yellow-400">
                                    {productos.length} cargados
                                </p>
                                {productos.length > 0 && (
                                    <p className="text-xs text-yellow-500">
                                        Ej: {productos[0].nombre}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Crear Orden */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsCreateModalOpen(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Crear Nueva Orden
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Mesa
                                    </label>
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                        <input
                                            type="text"
                                            placeholder="Buscar mesa por número, zona o piso..."
                                            value={mesaSearchTerm}
                                            onChange={(e) => setMesaSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        />
                                        {mesaSearchTerm && (
                                            <button
                                                type="button"
                                                onClick={() => setMesaSearchTerm('')}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <select
                                        value={ordenForm.mesa_id}
                                        onChange={(e) => setOrdenForm({...ordenForm, mesa_id: e.target.value})}
                                        className="w-full mt-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="">
                                            {mesaSearchTerm
                                                ? `Seleccionar mesa disponible (${filteredMesasDisponibles.length} disponibles)`
                                                : `Seleccionar mesa disponible (${mesasDisponibles.length} de ${mesas.length} total)`
                                            }
                                        </option>
                                        {filteredMesasDisponibles.slice(0, 50).map((mesa) => (
                                            <option key={mesa.id} value={mesa.id}>
                                                Mesa {mesa.numero} - {mesa.zona} ({mesa.piso}) - Cap: {mesa.capacidad}
                                            </option>
                                        ))}
                                    </select>
                                    {mesas.length === 0 && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                            ⚠️ No hay mesas en el sistema
                                        </p>
                                    )}
                                    {mesas.length > 0 && mesasDisponibles.length === 0 && (
                                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                                            ⚠️ No hay mesas disponibles en este momento
                                            {mesas.filter(m => m.estado === 'ocupada').length > 0 &&
                                                ` (${mesas.filter(m => m.estado === 'ocupada').length} ocupadas)`
                                            }
                                            {mesas.filter(m => m.estado === 'reservada').length > 0 &&
                                                ` (${mesas.filter(m => m.estado === 'reservada').length} Reservadas)`
                                            }
                                        </p>
                                    )}
                                    {filteredMesasDisponibles.length > 50 && mesaSearchTerm && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Mostrando 50 de {filteredMesasDisponibles.length} mesas disponibles. Refina la búsqueda.
                                        </p>
                                    )}
                                    {mesasDisponibles.length > 0 && mesasDisponibles.length <= 10 && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            ✅ {mesasDisponibles.length} mesa{mesasDisponibles.length !== 1 ? 's' : ''} disponible{mesasDisponibles.length !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Mozo
                                    </label>
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                        <input
                                            type="text"
                                            placeholder="Buscar mozo por usuario o rol..."
                                            value={mozoSearchTerm}
                                            onChange={(e) => setMozoSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        />
                                        {mozoSearchTerm && (
                                            <button
                                                type="button"
                                                onClick={() => setMozoSearchTerm('')}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <select
                                        value={ordenForm.mozo_id}
                                        onChange={(e) => setOrdenForm({...ordenForm, mozo_id: e.target.value})}
                                        className="w-full mt-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="">
                                            {mozoSearchTerm
                                                ? `Seleccionar mozo (${filteredMozos.length} disponibles)`
                                                : `Seleccionar mozo (${mozos.length} total)`
                                            }
                                        </option>
                                        {filteredMozos.slice(0, 50).map((mozo) => (
                                            <option key={mozo.id} value={mozo.id}>
                                                {mozo.usuario} ({mozo.rol})
                                            </option>
                                        ))}
                                    </select>
                                    {mozos.length === 0 && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                            ⚠️ No hay mozos disponibles
                                        </p>
                                    )}
                                    {filteredMozos.length > 50 && mozoSearchTerm && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Mostrando 50 de {filteredMozos.length} mozos. Refina la búsqueda.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Tipo
                                    </label>
                                    <select
                                        value={ordenForm.tipo}
                                        onChange={(e) => setOrdenForm({...ordenForm, tipo: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="local">Local</option>
                                        <option value="llevar">Para llevar</option>
                                        <option value="delivery">Delivery</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Cliente (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={ordenForm.cliente_nombre}
                                        onChange={(e) => setOrdenForm({...ordenForm, cliente_nombre: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        placeholder="Nombre del cliente"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Número de Comensales *
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={ordenForm.num_comensales}
                                            onChange={(e) => setOrdenForm({...ordenForm, num_comensales: parseInt(e.target.value) || 1})}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                            placeholder="Número de personas"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Especifica cuántas personas hay en esta orden
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCreateOrden}
                                    disabled={isLoading || !ordenForm.mesa_id || !ordenForm.mozo_id || mesasDisponibles.length === 0}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
                                    title={mesasDisponibles.length === 0 ? 'No hay mesas disponibles' : ''}
                                >
                                    {isLoading ? 'Creando...' : 'Crear Orden'}
                                </button>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal de Editar Orden */}
            {isEditModalOpen && selectedOrden && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsEditModalOpen(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Editar Orden #{selectedOrden.numero}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Cliente
                                    </label>
                                    <input
                                        type="text"
                                        value={ordenForm.cliente_nombre}
                                        onChange={(e) => setOrdenForm({...ordenForm, cliente_nombre: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        placeholder="Nombre del cliente"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleEditOrden}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-300 text-white rounded-lg font-medium transition-colors"
                                >
                                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal de Ver Detalles */}
            {isViewModalOpen && selectedOrden && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Detalles de Orden #{selectedOrden.numero}
                                </h3>
                                <button
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Información General</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Estado:</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getEstadoColorGlobal(selectedOrden.estado)}`}>
                                                {selectedOrden.estado.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Mesa:</span>
                                            <span className="text-slate-900 dark:text-white">Mesa {selectedOrden.mesa?.numero || selectedOrden.mesa_id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Mozo:</span>
                                            <span className="text-slate-900 dark:text-white">{selectedOrden.mozo?.usuario || 'Mozo'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Tipo:</span>
                                            <span className="text-slate-900 dark:text-white">{selectedOrden.tipo}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Cliente:</span>
                                            <span className="text-slate-900 dark:text-white">{selectedOrden.cliente_nombre || 'Sin nombre'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Total:</span>
                                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">S/ {(selectedOrden.monto_total || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Productos</h4>
                                    <div className="max-h-64 overflow-y-auto">
                                        {selectedOrden.items.length === 0 ? (
                                            <p className="text-slate-500 dark:text-slate-400">No hay productos en esta orden</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {selectedOrden.items.map((item) => (
                                                    <div key={item.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <h5 className="font-medium text-slate-900 dark:text-white">
                                                                    {item.producto?.nombre || `Producto #${item.producto_id}`}
                                                                </h5>
                                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                    Cantidad: {item.cantidad} • Precio: S/ {item.precio_unitario}
                                                                </p>
                                                                {item.notas && (
                                                                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                                                        📝 {item.notas}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColorGlobal(item.estado)}`}>
                                                                {getEstadoIconGlobal(item.estado)} {getEstadoDisplayNameGlobal(item.estado)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal de Agregar Producto */}
            {isItemModalOpen && selectedOrden && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsItemModalOpen(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Agregar Producto a Orden #{selectedOrden.numero}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Producto
                                    </label>
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                        <input
                                            type="text"
                                            placeholder="Buscar producto por nombre o precio..."
                                            value={productSearchTerm}
                                            onChange={(e) => setProductSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        />
                                        {productSearchTerm && (
                                            <button
                                                type="button"
                                                onClick={() => setProductSearchTerm('')}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <select
                                        value={itemForm.producto_id}
                                        onChange={(e) => {
                                            const producto = filteredProductos.find(p => p.id.toString() === e.target.value);
                                            setItemForm({
                                                ...itemForm,
                                                producto_id: e.target.value,
                                                precio_unitario: producto ? producto.precio : 0,
                                                estacion: producto ? producto.tipo_estacion : ''
                                            });
                                        }}
                                        className="w-full mt-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="">
                                            {productSearchTerm
                                                ? `Seleccionar producto (${filteredProductos.length} disponibles)`
                                                : `Seleccionar producto (${productos.length} total)`
                                            }
                                        </option>
                                        {filteredProductos.slice(0, 50).map((producto) => (
                                            <option key={producto.id} value={producto.id}>
                                                {producto.nombre} - S/ {producto.precio}
                                            </option>
                                        ))}
                                    </select>
                                    {productos.length === 0 && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                            ⚠️ No hay productos disponibles
                                        </p>
                                    )}
                                    {filteredProductos.length > 50 && productSearchTerm && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Mostrando 50 de {filteredProductos.length} productos. Refina la búsqueda.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={itemForm.cantidad}
                                        onChange={(e) => setItemForm({...itemForm, cantidad: parseInt(e.target.value) || 1})}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Estación
                                    </label>
                                    <select
                                        value={itemForm.estacion}
                                        onChange={(e) => setItemForm({...itemForm, estacion: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="">Seleccionar estación</option>
                                        <option value="frio">❄️ Frío</option>
                                        <option value="caliente">🔥 Caliente</option>
                                        <option value="bebida">🥤 Bebida</option>
                                        <option value="postre">🍰 Postre</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Notas (opcional)
                                    </label>
                                    <textarea
                                        value={itemForm.notas}
                                        onChange={(e) => setItemForm({...itemForm, notas: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        placeholder="Notas especiales..."
                                        rows={3}
                                    />
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-400">Total del producto:</span>
                                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                            S/ {(itemForm.cantidad * itemForm.precio_unitario).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleAddItem}
                                    disabled={isLoading || !itemForm.producto_id}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg font-medium transition-colors"
                                >
                                    {isLoading ? 'Agregando...' : 'Agregar Producto'}
                                </button>
                                <button
                                    onClick={() => setIsItemModalOpen(false)}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación Moderno */}
            {isDeleteModalOpen && selectedOrdenToDelete && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsDeleteModalOpen(false)}
                >
                    <motion.div
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                                    <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Eliminar Orden
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Esta acción no se puede deshacer
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-1 bg-red-100 dark:bg-red-900/20 rounded">
                                        <DocumentTextIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                                            Orden #{selectedOrdenToDelete.numero}
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-300">
                                            Mesa {selectedOrdenToDelete.mesa_id} • {selectedOrdenToDelete.tipo}
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-300">
                                            {selectedOrdenToDelete.items?.length || 0} productos • S/ {(selectedOrdenToDelete as any).total || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteOrden}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Eliminando...
                                        </>
                                    ) : (
                                        <>
                                            <TrashIcon className="h-4 w-4" />
                                            Eliminar
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal de Procesar Pago */}
            {isPagoModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsPagoModalOpen(false)}
                >
                    <motion.div
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                                    <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Procesar Pago
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Orden #{pagoForm.orden_id}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Método de Pago
                                    </label>
                                    <select
                                        value={pagoForm.metodo}
                                        onChange={(e) => setPagoForm({...pagoForm, metodo: e.target.value})}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="efectivo">💵 Efectivo</option>
                                        <option value="tarjeta">💳 Tarjeta</option>
                                        <option value="yape">📱 Yape</option>
                                        <option value="plin">📱 Plin</option>
                                        <option value="transferencia">🏦 Transferencia</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Monto a Pagar
                                    </label>
                                    <div className="relative">
                                        <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={pagoForm.monto}
                                            onChange={(e) => setPagoForm({...pagoForm, monto: parseFloat(e.target.value) || 0})}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleProcesarPago}
                                    disabled={isLoading || pagoForm.monto <= 0}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <CurrencyDollarIcon className="h-4 w-4" />
                                            Procesar Pago
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsPagoModalOpen(false)}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal de Ver Detalles de Pago */}
            {isPagoViewModalOpen && selectedPago && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsPagoViewModalOpen(false)}
                >
                    <motion.div
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                    <EyeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Detalles del Pago
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Pago #{selectedPago.id}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">ID de Pago</p>
                                        <p className="font-medium text-slate-900 dark:text-white">#{selectedPago.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Orden</p>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            #{selectedPago.orden?.numero || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Monto</p>
                                        <p className="font-medium text-green-600 dark:text-green-400">
                                            S/ {selectedPago.monto.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Método</p>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {selectedPago.metodo}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Estado</p>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                            selectedPago.estado === 'pagado'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                                : selectedPago.estado === 'anulado'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                                        }`}>
                                            {selectedPago.estado.toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Fecha</p>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {new Date(selectedPago.fecha).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsPagoViewModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <EyeIcon className="h-4 w-4" />
                                    Cerrar
                                </button>
                                {selectedPago.estado === 'pagado' && (
                                    <button
                                        onClick={() => {
                                            setIsPagoViewModalOpen(false);
                                            setIsAnularPagoModalOpen(true);
                                        }}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                        Anular
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Modal de Anular Pago Moderno */}
            {isAnularPagoModalOpen && selectedPago && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        setIsAnularPagoModalOpen(false);
                        setSelectedPago(null);
                    }}
                >
                    <motion.div
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ zIndex: 60 }}
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                                    <XMarkIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Anular Pago
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Esta acción revertirá el estado de la orden
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-1 bg-red-100 dark:bg-red-900/20 rounded">
                                        <CurrencyDollarIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                                            Pago #{selectedPago.id}
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-300">
                                            Orden #{selectedPago.orden?.numero || 'N/A'} • {selectedPago.metodo}
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-300">
                                            Monto: S/ {selectedPago.monto.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                                            ⚠️ Esta acción revertirá la orden a estado "servida"
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                                            ⚠️ Validaciones aplicadas:
                                        </p>
                                        <ul className="text-xs text-red-600 dark:text-red-300 mt-1 ml-3">
                                            <li>• Solo pagos en estado "pagado"</li>
                                            <li>• Máximo 24 horas desde el pago</li>
                                            <li>• Orden no modificada después del pago</li>
                                            <li>• Verificación antifraude</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleAnularPago}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Anulando...
                                        </>
                                    ) : (
                                        <>
                                            <XMarkIcon className="h-4 w-4" />
                                            Anular Pago
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAnularPagoModalOpen(false);
                                        setSelectedPago(null);
                                    }}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}

export default AdminOrdenesPage;
