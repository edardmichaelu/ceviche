import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  QrCodeIcon,
  CurrencyDollarIcon,
  BoltIcon,
  ListBulletIcon,
  PlusIcon,
  MinusIcon,
  XMarkIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ClockIcon,
  StarIcon,
  TableCellsIcon,
  HomeIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../apiClient';
import { toast } from 'react-hot-toast';
import QuickNavigation from './QuickNavigation';

// URL del backend para cargar imágenes públicas (dinámico por IP)
const BACKEND_URL = (() => {
  try {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const port = 5000;
    return `${protocol}//${host}:${port}`;
  } catch {
    return 'http://localhost:5000';
  }
})();

// --- Interfaces ---
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  precio_original?: number;
  imagen?: string;
  categoria: string;
  descripcion?: string;
  destacado?: boolean;
  disponible?: boolean;
  tipo_estacion?: 'frio' | 'caliente' | 'bebida' | 'postre' | string;
}

interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  cantidad_items: number;
}

interface ItemCarrito {
  id: number;
  producto: Producto;
  cantidad: number;
  subtotal: number;
  notas?: string;
}

interface Mesa {
  id: number;
  numero: string;
  estado: string;
  capacidad: number;
  zona_nombre: string;
  items_carrito?: number;
  comensales?: number;
}

export const MenuPrincipal: React.FC = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('todas');
  const [estacionActiva, setEstacionActiva] = useState<string>('todas');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [comensales, setComensales] = useState<number>(1);
  const [busqueda, setBusqueda] = useState('');
  const [vistaActual, setVistaActual] = useState<string>('mesas');
  const [mostrarComensales, setMostrarComensales] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      
      // Cargar mesas
      const mesasResponse = await apiClient.getPublic('/api/mesero/public/layout');
      const mesasData = (mesasResponse as any).data || mesasResponse;
      
      // Procesar mesas para el menú
      const mesasProcesadas: Mesa[] = [];
      mesasData.forEach((piso: any) => {
        piso.zonas.forEach((zona: any) => {
          zona.mesas.forEach((mesa: any) => {
            mesasProcesadas.push({
              id: mesa.id,
              numero: mesa.numero,
              estado: mesa.estado,
              capacidad: mesa.capacidad,
              zona_nombre: zona.nombre,
              items_carrito: Math.floor(Math.random() * 5), // Simulado
              comensales: mesa.estado === 'ocupada' ? Math.floor(Math.random() * mesa.capacidad) + 1 : 0
            });
          });
        });
      });
      
      setMesas(mesasProcesadas);

      // Cargar categorías reales
      const categoriasResponse = await apiClient.getPublic('/api/categoria/public');
      const categoriasData = (categoriasResponse as any).categorias || [];
      
      // Mapear categorías reales con iconos y colores
      const categoriasProcesadas: Categoria[] = categoriasData.map((cat: any, index: number) => {
        const iconos = ['🐟', '🥤', '🍽️', '🍰', '🥗', '🍔', '🌮', '🍎', '🔥'];
        const colores = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-gray-500'];
        
        return {
          id: cat.id.toString(),
          nombre: cat.nombre,
          icono: iconos[index % iconos.length],
          color: colores[index % colores.length],
          cantidad_items: cat.cantidad_productos || 0
        };
      });
      
      setCategorias(categoriasProcesadas);

      // Cargar productos reales
      const productosResponse = await apiClient.getPublic('/api/producto/public');
      const productosData = (productosResponse as any).data || productosResponse;

      const productosProcesados: Producto[] = (productosData || []).map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio) || 0,
        precio_original: undefined,
        imagen: p.imagen_url || undefined,
        categoria: p.categoria?.id ? String(p.categoria.id) : String(p.categoria_id),
        descripcion: p.descripcion || '',
        destacado: typeof p.etiquetas === 'string' ? p.etiquetas.toLowerCase().includes('destacado') : false,
        disponible: p.disponible !== false,
        tipo_estacion: p.tipo_estacion
      }));

      setProductos(productosProcesados);

    } catch (error: any) {
      toast.error(`❌ Error cargando datos: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar productos por categoría y búsqueda
  const productosFiltrados = productos.filter(producto => {
    const coincideCategoria = categoriaActiva === 'todas' || String(producto.categoria) === String(categoriaActiva);
    const coincideEstacion = estacionActiva === 'todas' || (producto.tipo_estacion || '').toString() === estacionActiva;
    const coincideBusqueda = busqueda === '' || 
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideEstacion && coincideBusqueda && producto.disponible;
  });

  // Calcular total del carrito
  const totalCarrito = carrito.reduce((sum, item) => sum + (item.subtotal || (item.cantidad * (item.producto?.precio || 0))), 0);
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const mesasOcupadas = mesas.filter(mesa => mesa.estado === 'ocupada').length;

  // Funciones del carrito
  const agregarAlCarrito = (producto: Producto) => {
    const itemExistente = carrito.find(item => item.producto.id === producto.id);
    
    if (itemExistente) {
      setCarrito(carrito.map(item => 
        item.id === itemExistente.id 
          ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * producto.precio }
          : item
      ));
    } else {
      const nuevoItem: ItemCarrito = {
        id: Date.now(),
        producto,
        cantidad: 1,
        subtotal: producto.precio
      };
      setCarrito([...carrito, nuevoItem]);
    }
    
    toast.success(`✅ ${producto.nombre} agregado al carrito`);
  };

  const actualizarCantidad = (itemId: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      setCarrito(carrito.filter(item => item.id !== itemId));
    } else {
      setCarrito(carrito.map(item => 
        item.id === itemId 
          ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.producto.precio }
          : item
      ));
    }
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    toast.success('✅ Carrito limpiado');
  };

  const eliminarDelCarrito = (itemId: number) => {
    setCarrito(carrito.filter(item => item.id !== itemId));
    toast.success('✅ Item eliminado del carrito');
  };

  // Seleccionar mesa
  const seleccionarMesa = (mesa: Mesa) => {
    setMesaSeleccionada(mesa);
    setComensales(mesa.comensales || 1);
    setVistaActual('categorias');
    setCarrito([]);
  };

  // Renderizar vista de mesas
  const renderVistaMesas = () => (
    <div className="space-y-6">
      {/* Filtros de zona (simplificado) */}
      <div className="flex space-x-1 overflow-x-auto py-1"></div>

      {/* Barra de acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-2" />
      </div>

      {/* Grid de mesas responsive - TARJETAS MÁS GRANDES Y BONITAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {mesas.map((mesa) => (
          <motion.div
            key={mesa.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => seleccionarMesa(mesa)}
            className={`rounded-2xl p-6 cursor-pointer transition-all duration-300 shadow-xl hover:shadow-2xl ${
              mesa.estado === 'ocupada'
                ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white border-2 border-blue-400'
                : 'bg-white text-gray-900 hover:from-gray-50 hover:to-gray-100 border-2 border-gray-200'
            }`}
          >
            <div className="text-center">
              {/* Número de mesa MÁS PEQUEÑO */}
              <div className="text-lg lg:text-xl xl:text-2xl font-black mb-3 drop-shadow-lg">
                {mesa.numero}
              </div>

              {/* Estado de la mesa */}
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
                mesa.estado === 'ocupada'
                  ? 'bg-white bg-opacity-20 backdrop-blur-sm'
                  : 'bg-blue-600 text-white'
              }`}>
                {mesa.estado === 'ocupada' ? 'OCUPADA' : 'DISPONIBLE'}
              </div>

              {/* Información de la mesa */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
                  <ShoppingCartIcon className="h-5 w-5" />
                  <span className="font-semibold">{mesa.items_carrito} ítems</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
                  <UserGroupIcon className="h-5 w-5" />
                  <span className="font-semibold">{mesa.comensales || 0} comensales</span>
                </div>
              </div>

              {/* Indicador de selección */}
              {mesaSeleccionada?.id === mesa.id && (
                <div className="mt-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                  ✓ SELECCIONADA
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Renderizar vista de categorías
  const renderVistaCategorias = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setVistaActual('mesas')}
            className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-900">Mesa {mesaSeleccionada?.numero}</h1>
        </div>
        <div className="flex items-center gap-2" />
      </div>

      {/* Barra de acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-2" />
      </div>

      {/* Grid de categorías responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
        {categorias.map((categoria) => (
          <motion.div
            key={categoria.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.08, y: -8, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setCategoriaActiva(categoria.id);
              setVistaActual('productos');
            }}
            className={`${categoria.color} text-white rounded-2xl p-6 sm:p-7 lg:p-8 cursor-pointer transition-all duration-300 shadow-xl hover:shadow-2xl transform border-2 border-white border-opacity-20`}
          >
            <div className="text-center">
              {/* Icono más grande y con efecto */}
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-5 lg:mb-6 drop-shadow-2xl transform hover:scale-110 transition-transform duration-300">
                {categoria.icono}
              </div>

              {/* Nombre de la categoría UN POQUITO MÁS GRANDE */}
              <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-3 lg:mb-4 drop-shadow-lg">
                {categoria.nombre}
              </div>

              {/* Contador de ítems con estilo */}
              <div className="bg-white bg-opacity-30 backdrop-blur-sm rounded-full px-3 py-1.5 inline-block">
                <span className="text-sm font-bold">
                  {categoria.cantidad_items} ítems
                </span>
              </div>

              {/* Indicador de selección */}
              {categoriaActiva === categoria.id && (
                <div className="mt-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold animate-bounce">
                  ✓ ACTIVA
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Renderizar vista de productos
  const renderVistaProductos = () => {
    const categoria = categorias.find(c => c.id === categoriaActiva);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVistaActual('categorias')}
              className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">{categoria?.nombre}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarComensales(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 font-medium"
            >
              + Cliente
            </button>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-2 border border-gray-200">
              <UserGroupIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{comensales}</span>
            </div>
          </div>
        </div>

        {/* Filtros por estación */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {['todas','frio','caliente','bebida','postre'].map(est => (
              <button
                key={est}
                onClick={() => setEstacionActiva(est)}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  estacionActiva === est ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {est === 'todas' ? 'Todas las estaciones' : `Estación ${est}`}
              </button>
            ))}
          </div>
          <div />
        </div>

        {/* Grid de productos responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {productosFiltrados.map((producto) => (
            <motion.div
              key={producto.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => agregarAlCarrito(producto)}
              className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-blue-300"
            >
              <div className="relative">
                {/* Badge de destacado */}
                {producto.destacado && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full p-2 shadow-lg animate-pulse">
                    <StarIcon className="h-4 w-4" />
                  </div>
                )}

                {/* Imagen del producto */}
                <div className="w-full h-28 sm:h-32 lg:h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 lg:mb-4 flex items-center justify-center relative overflow-hidden">
                  {producto.imagen ? (
                    <img
                      src={producto.imagen.startsWith('http') ? producto.imagen : `${BACKEND_URL}${producto.imagen}`}
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50"></div>
                      <span className="text-gray-500 text-lg font-medium relative z-10">🍽️</span>
                    </>
                  )}
                  {producto.destacado && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                      DESTACADO
                    </div>
                  )}
                </div>

                {/* Nombre del producto UN POQUITO MÁS GRANDE */}
                <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-3 lg:mb-4 line-clamp-2 min-h-[3rem] lg:min-h-[3.5rem] flex items-center">
                  {producto.nombre}
                </div>

                {/* Precio */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl lg:text-2xl font-black text-blue-600">
                      ${producto.precio.toFixed(2)}
                    </span>
                    {producto.precio_original && (
                      <span className="text-sm text-gray-500 line-through">
                        ${producto.precio_original.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botón de agregar */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-3 px-4 text-center font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105">
                  + AGREGAR AL CARRITO
                </div>
              </div>
            </motion.div>
          ))}

          {/* Eliminado botón de agregar manual para menú público */}
        </div>
      </div>
    );
  };

  // Renderizar vista del carrito
  const renderVistaCarrito = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setVistaActual('productos')}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            ←
          </button>
          <h1 className="text-xl font-bold">Carrito</h1>
        </div>
        <button 
          onClick={limpiarCarrito}
          className="text-red-500 text-sm"
        >
          Limpiar
        </button>
      </div>

      {/* Lista de items - TARJETAS MÁS GRANDES Y BONITAS */}
      <div className="space-y-4">
        {carrito.map((item) => (
          <motion.div 
            key={item.id} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-3">{item.producto.nombre}</h3>
                <p className="text-sm text-gray-500 mb-2">${item.producto.precio.toFixed(2)} c/u</p>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold inline-block">
                  Total: ${item.subtotal.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-2">
                  <button 
                    onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                    className="w-10 h-10 rounded-lg bg-white text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm"
                  >
                    <MinusIcon className="h-5 w-5" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{item.cantidad}</span>
                  <button 
                    onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                    className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={() => eliminarDelCarrito(item.id)}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-3 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total y acciones */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium">Total:</span>
          <span className="text-2xl font-bold text-blue-600">${totalCarrito.toFixed(2)}</span>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium">
            Imprimir Pre-cuenta
          </button>
          <button className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium">
            Enviar a Cocina
          </button>
        </div>
      </div>
    </div>
  );

  // Modal de comensales
  const renderModalComensales = () => (
    <AnimatePresence>
      {mostrarComensales && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setMostrarComensales(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Comensales</h2>
              <p className="text-gray-500">Cantidad de personas en la mesa</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad:
              </label>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setComensales(Math.max(1, comensales - 1))}
                  className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center"
                >
                  <MinusIcon className="h-6 w-6" />
                </button>
                <input
                  type="number"
                  value={comensales}
                  onChange={(e) => setComensales(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center text-2xl font-bold border-2 border-purple-300 rounded-lg py-2"
                  min="1"
                  max="20"
                />
                <button 
                  onClick={() => setComensales(Math.min(20, comensales + 1))}
                  className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center"
                >
                  <PlusIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setMostrarComensales(false)}
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={() => setMostrarComensales(false)}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando menú...</p>
        </div>
      </div>
    );
  }

  // Renderizar vista de clientes
  const renderVistaClientes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Clientes</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
          + Nuevo Cliente
        </button>
      </div>
      <div className="text-center py-12">
        <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">Gestión de Clientes</h3>
        <p className="text-gray-400">Próximamente</p>
      </div>
    </div>
  );

  // Renderizar vista de tiempo
  const renderVistaTiempo = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Tiempos</h1>
      </div>
      <div className="text-center py-12">
        <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">Control de Tiempos</h3>
        <p className="text-gray-400">Próximamente</p>
      </div>
    </div>
  );

  // Renderizar vista de estadísticas
  const renderVistaEstadisticas = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Estadísticas</h1>
      </div>
      <div className="text-center py-12">
        <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">Estadísticas de Ventas</h3>
        <p className="text-gray-400">Próximamente</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 overflow-x-hidden">
      {/* Contenedor responsive */}
      <div className="mx-auto bg-white min-h-screen shadow-lg">
        <div className="flex h-screen max-h-screen overflow-hidden">
          {/* Sidebar colapsable */}
          <div className={`${sidebarCollapsed ? 'hidden' : 'hidden lg:block'} w-72 xl:w-80 bg-white border-r border-gray-300 p-4 xl:p-6`}>
            <div className="space-y-6">
              {/* Header del sidebar */}
              <div className="text-center">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">🐟 Cevichería</h1>
                <p className="text-lg text-gray-600 font-semibold">Sistema de Ventas</p>
              </div>

              {/* Estadísticas rápidas */}
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Resumen</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Mesas:</span>
                    <span className="font-medium text-gray-900">{mesas.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ocupadas:</span>
                    <span className="font-medium text-blue-600">{mesasOcupadas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Items en Carrito:</span>
                    <span className="font-medium text-orange-600">{totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="font-bold text-green-600">${totalCarrito.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Navegación del sidebar */}
              <div className="space-y-2">
                {[
                  { id: 'mesas', label: 'Mesas', icon: TableCellsIcon, color: 'blue' },
                  { id: 'categorias', label: 'Categorías', icon: HomeIcon, color: 'green' },
                  { id: 'carrito', label: 'Carrito', icon: ShoppingCartIcon, color: 'orange' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = vistaActual === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setVistaActual(item.id as any)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isActive
                          ? `bg-${item.color}-500 text-white`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Header superior */}
            <div className="bg-white border-b border-gray-300 p-3 md:p-4 shadow-sm">
              <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
                    title={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'}
                  >
                    {sidebarCollapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
                  </button>
                  <h2 className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900">
                    {vistaActual === 'mesas' && 'Gestión de Mesas'}
                    {vistaActual === 'categorias' && 'Categorías de Productos'}
                    {vistaActual === 'productos' && 'Productos'}
                    {vistaActual === 'carrito' && 'Carrito de Compras'}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  {mesaSeleccionada && (
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Mesa {mesaSeleccionada.numero}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMostrarComensales(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 font-medium"
                    >
                      + Cliente
                    </button>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-2 border border-gray-200">
                      <UserGroupIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{comensales}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 min-h-0 bg-gray-50">
              {vistaActual === 'mesas' && renderVistaMesas()}
              {vistaActual === 'categorias' && renderVistaCategorias()}
              {vistaActual === 'productos' && renderVistaProductos()}
              {/* carrito oculto en menú público */}
              {vistaActual === 'clientes' && renderVistaClientes()}
              {vistaActual === 'tiempo' && renderVistaTiempo()}
              {vistaActual === 'estadisticas' && renderVistaEstadisticas()}
            </div>
          </div>
        </div>

          {/* Navegación móvil: sin carrito y solo pestañas relevantes */}
          <div className="lg:hidden">
            <QuickNavigation
              activeTab={vistaActual}
              onTabChange={setVistaActual}
              totalItems={0}
              totalMesas={mesas.length}
              showCart={false}
            />
          </div>
      </div>

      {renderModalComensales()}
    </div>
  );
};

export default MenuPrincipal;
