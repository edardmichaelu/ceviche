import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import ModalEliminarPiso from '../components/ModalEliminarPiso';
import ModalEliminarZona from '../components/ModalEliminarZona';
import ModalEliminarMesa from '../components/ModalEliminarMesa';
import ModalCrearEditarPiso from '../components/ModalCrearEditarPiso';
import ModalCrearEditarZona from '../components/ModalCrearEditarZona';
import ModalCrearEditarMesa from '../components/ModalCrearEditarMesa';
import { ErrorHandler } from '../utils/errorHandler';
import {
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  BuildingOffice2Icon,
  MapIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

// Importar componentes separados
import LocalTabs from '../components/admin/LocalTabs';
import LocalFilters from '../components/admin/LocalFilters';
import LocalDataTable from '../components/admin/LocalDataTable';
import LocalCategories from '../components/admin/LocalCategories';

// Tipos de datos
interface Piso {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  activo: boolean;
  creado_en: string;
  total_zonas: number;
}

interface Zona {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  capacidad_maxima: number;
  piso_id: number;
  piso_nombre: string;
  orden: number;
  activo: boolean;
  color: string;
  icono: string;
  total_mesas: number;
  mesas_ocupadas: number;
}

interface Mesa {
  id: number;
  numero: string;
  capacidad: number;
  zona_id: number;
  zona_nombre: string;
  estado: 'disponible' | 'ocupada' | 'limpieza' | 'reservada' | 'fuera_servicio';
  qr_code: string;
  posicion_x: number;
  posicion_y: number;
  activo: boolean;
  notas: string;
  total_ordenes: number;
}

const LocalManagementPage: React.FC = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState<string>('pisos');
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  
  // Estados para modales de eliminación específicos
  const [showDeletePisoModal, setShowDeletePisoModal] = useState(false);
  const [showDeleteZonaModal, setShowDeleteZonaModal] = useState(false);
  const [showDeleteMesaModal, setShowDeleteMesaModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  
  // Estados para modales de crear/editar
  const [showCreateEditPisoModal, setShowCreateEditPisoModal] = useState(false);
  const [showCreateEditZonaModal, setShowCreateEditZonaModal] = useState(false);
  const [showCreateEditMesaModal, setShowCreateEditMesaModal] = useState(false);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByStatus, setFilterByStatus] = useState<string>('all');
  const [filterByPiso, setFilterByPiso] = useState<string | number>('all');
  
  // Estados para pestañas de categorías
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Función para normalizar datos al formulario
  const normalizeItemToForm = (item: any) => {
    if (activeTab === 'pisos') {
      const piso = item as Piso;
      return {
        nombre: piso.nombre || '',
        descripcion: piso.descripcion || '',
        orden: piso.orden || 1,
        activo: piso.activo !== false
      };
    } else if (activeTab === 'zonas') {
      const zona = item as Zona;
      return {
        nombre: zona.nombre || '',
        descripcion: zona.descripcion || '',
        tipo: zona.tipo || '',
        piso_id: zona.piso_id || '',
        capacidad_maxima: zona.capacidad_maxima || 0,
        orden: zona.orden || 1,
        activo: zona.activo !== false,
        color: zona.color || '#6B7280',
        icono: zona.icono || '🏢'
      };
    } else if (activeTab === 'mesas') {
      const mesa = item as Mesa;
      return {
        numero: mesa.numero || '',
        capacidad: mesa.capacidad || 1,
        zona_id: mesa.zona_id || '',
        estado: mesa.estado || 'disponible',
        activo: mesa.activo !== false,
        qr_code: mesa.qr_code || '',
        posicion_x: mesa.posicion_x || 0,
        posicion_y: mesa.posicion_y || 0,
        notas: mesa.notas || ''
      };
    }
    return {};
  };

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoints = {
        pisos: '/api/local/pisos/public',
        zonas: '/api/local/zonas/public',
        mesas: '/api/local/mesas/public'
      };

      const response = await apiClient.getPublic(endpoints[activeTab]) as any;
      if (response.success) {
        if (activeTab === 'pisos') {
          setPisos(response.data || []);
        } else if (activeTab === 'zonas') {
          setZonas(response.data || []);
        } else {
          setMesas(response.data || []);
        }
      } else {
        const errorMessage = response.error || `Error cargando ${activeTab}`;
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      if (err.response?.status === 404) {
        const errorMessage = `No se encontró información de ${activeTab}`;
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (err.response?.status === 403) {
        const errorMessage = 'No tienes permisos para acceder a esta información';
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (err.response?.status >= 500) {
        const errorMessage = 'Error del servidor. Inténtalo de nuevo más tarde';
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        const errorMessage = `Error cargando ${activeTab}. Verifica tu conexión`;
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Funciones de filtrado
  const getFilteredData = (): (Piso | Zona | Mesa)[] => {
    let data: (Piso | Zona | Mesa)[] = activeTab === 'pisos' ? pisos : activeTab === 'zonas' ? zonas : mesas;
    
    // Filtro por búsqueda
    if (searchTerm) {
      data = data.filter(item => {
        const searchLower = searchTerm.toLowerCase();
    if (activeTab === 'pisos') {
          const piso = item as Piso;
          return piso.nombre.toLowerCase().includes(searchLower) ||
                 (piso.descripcion?.toLowerCase().includes(searchLower) ?? false);
    } else if (activeTab === 'zonas') {
          const zona = item as Zona;
          return zona.nombre.toLowerCase().includes(searchLower) ||
                 zona.tipo.toLowerCase().includes(searchLower) ||
                 zona.piso_nombre.toLowerCase().includes(searchLower);
        } else {
          const mesa = item as Mesa;
          return mesa.numero.toLowerCase().includes(searchLower) ||
                 mesa.zona_nombre.toLowerCase().includes(searchLower);
        }
      });
    }

    // Filtro por piso (para zonas y mesas)
    if (filterByPiso !== 'all' && (activeTab === 'zonas' || activeTab === 'mesas')) {
      const pisoId = filterByPiso as number;
      data = data.filter(item => {
        if (activeTab === 'zonas') {
          return (item as Zona).piso_id === pisoId;
        } else {
          return (item as Mesa).zona_id === pisoId;
        }
      });
    }

    // Filtro por estado (solo para mesas)
    if (filterByStatus !== 'all' && activeTab === 'mesas') {
      data = data.filter(item => (item as Mesa).estado === filterByStatus);
    }

    // Filtro por categoría
    if (activeCategory !== 'all') {
      if (activeTab === 'mesas') {
        data = data.filter(item => (item as Mesa).estado === activeCategory);
      } else if (activeTab === 'zonas') {
        data = data.filter(item => (item as Zona).tipo === activeCategory);
      }
    }
    
    return data;
  };

  // Función para obtener colores de estado
  const getEstadoColor = (estado: string, variant: 'pills' | 'table' = 'table') => {
    if (variant === 'pills') {
      const colorMap: Record<string, string> = {
        'disponible': 'bg-green-600 text-white',
        'ocupada': 'bg-red-600 text-white',
        'limpieza': 'bg-yellow-600 text-white',
        'reservada': 'bg-blue-600 text-white',
        'fuera_servicio': 'bg-gray-600 text-white',
        'activo': 'bg-green-600 text-white',
        'inactivo': 'bg-red-600 text-white',
        'programado': 'bg-blue-600 text-white',
        'completado': 'bg-green-600 text-white',
        'cancelado': 'bg-red-600 text-white',
        'salon': 'bg-blue-600 text-white',
        'barra': 'bg-green-600 text-white',
        'terraza': 'bg-orange-600 text-white',
        'privada': 'bg-purple-600 text-white',
        'vip': 'bg-yellow-600 text-white',
        'interior': 'bg-indigo-600 text-white',
        'rapida': 'bg-pink-600 text-white',
        'business': 'bg-teal-600 text-white',
        'infantil': 'bg-cyan-600 text-white',
        'recepcion': 'bg-gray-600 text-white'
      };
      return colorMap[estado] || 'bg-gray-600 text-white';
    } else {
      const colorMap: Record<string, string> = {
        'disponible': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'ocupada': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        'limpieza': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'reservada': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'fuera_servicio': 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
        'activo': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'inactivo': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        'programado': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'completado': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'cancelado': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        'salon': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'barra': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'terraza': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        'privada': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        'vip': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'interior': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
        'rapida': 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
        'business': 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
        'infantil': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
        'recepcion': 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
      };
      return colorMap[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  // Función para verificar si hay filtros activos
  const hasActiveFilters: boolean = searchTerm.length > 0 || filterByStatus !== 'all' || filterByPiso !== 'all' || activeCategory !== 'all';

  // Funciones de reset de filtros
  const resetFilters = () => {
    setSearchTerm('');
    setFilterByStatus('all');
    setFilterByPiso('all');
    setActiveCategory('all');
  };


  // Cargar datos
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Funciones de manejo de modales y acciones
  const handleCreate = () => {
    setModalType('create');
    setSelectedItem(null);
    setIsModalOpen(false);
      if (activeTab === 'pisos') {
      setShowCreateEditPisoModal(true);
      } else if (activeTab === 'zonas') {
      setShowCreateEditZonaModal(true);
      } else if (activeTab === 'mesas') {
      setShowCreateEditMesaModal(true);
    }
  };

  const handleView = (item: any) => {
    setModalType('view');
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setModalType('edit');
    setFormData(normalizeItemToForm(item));
    setSelectedItem(item);
    setIsModalOpen(false);
    if (activeTab === 'pisos') {
      setShowCreateEditPisoModal(true);
    } else if (activeTab === 'zonas') {
      setShowCreateEditZonaModal(true);
    } else if (activeTab === 'mesas') {
      setShowCreateEditMesaModal(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const endpoints = {
        pisos: '/api/local/pisos',
        zonas: '/api/local/zonas',
        mesas: '/api/local/mesas'
      };

      const method = modalType === 'create' ? 'post' : 'put';
      const endpoint = modalType === 'create'
        ? endpoints[activeTab]
        : `${endpoints[activeTab]}/${selectedItem?.id}`;

      const response = await apiClient[method](endpoint, formData);
      const apiResponse = ErrorHandler.processApiResponse(response);

      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        const successMessage = modalType === 'create'
          ? `${activeTab === 'pisos' ? 'Piso' : activeTab === 'zonas' ? 'Zona' : 'Mesa'} creado correctamente`
          : `${activeTab === 'pisos' ? 'Piso' : activeTab === 'zonas' ? 'Zona' : 'Mesa'} actualizado correctamente`;

        toast.success(ErrorHandler.showSuccessNotification(successMessage));
        setIsModalOpen(false);
        loadData();
      } else {
        const errorMessage = ErrorHandler.getFriendlyErrorMessage(apiResponse);
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (err: any) {
      ErrorHandler.logError(`guardar ${activeTab}`, err, { formData, modalType });
      const errorMessage = ErrorHandler.showErrorNotification(err, `guardar ${activeTab}`);
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const handleDeletePiso = (piso: Piso) => {
    setItemToDelete(piso);
    setShowDeletePisoModal(true);
  };

  const handleDeleteZona = (zona: Zona) => {
    setItemToDelete(zona);
    setShowDeleteZonaModal(true);
  };

  const handleDeleteMesa = (mesa: Mesa) => {
    setItemToDelete(mesa);
    setShowDeleteMesaModal(true);
  };

  const handleDelete = (item: any) => {
    if (activeTab === 'pisos') {
      handleDeletePiso(item as Piso);
    } else if (activeTab === 'zonas') {
      handleDeleteZona(item as Zona);
    } else if (activeTab === 'mesas') {
      handleDeleteMesa(item as Mesa);
    }
  };

  const handleConfirmDeletePiso = async () => {
    if (!itemToDelete) return;

    try {
      const response = await apiClient.del(`/api/local/pisos/${itemToDelete.id}`);
      const apiResponse = ErrorHandler.processApiResponse(response);
      
      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        toast.success(ErrorHandler.showSuccessNotification('Piso eliminado correctamente'));
        loadData();
      } else {
        const errorMessage = ErrorHandler.getFriendlyErrorMessage(apiResponse);
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (err: any) {
      ErrorHandler.logError('eliminar piso', err, { piso: itemToDelete });
      const errorMessage = ErrorHandler.showErrorNotification(err, 'eliminar piso');
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setShowDeletePisoModal(false);
      setItemToDelete(null);
    }
  };

  const handleConfirmDeleteZona = async () => {
    if (!itemToDelete) return;

    try {
      const response = await apiClient.del(`/api/local/zonas/${itemToDelete.id}`);
      const apiResponse = ErrorHandler.processApiResponse(response);
      
      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        toast.success(ErrorHandler.showSuccessNotification('Zona eliminada correctamente'));
        loadData();
      } else {
        const errorMessage = ErrorHandler.getFriendlyErrorMessage(apiResponse);
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (err: any) {
      ErrorHandler.logError('eliminar zona', err, { zona: itemToDelete });
      const errorMessage = ErrorHandler.showErrorNotification(err, 'eliminar zona');
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setShowDeleteZonaModal(false);
      setItemToDelete(null);
    }
  };

  const handleConfirmDeleteMesa = async () => {
    if (!itemToDelete) return;

    try {
      const response = await apiClient.del(`/api/local/mesas/${itemToDelete.id}`);
      const apiResponse = ErrorHandler.processApiResponse(response);
      
      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        toast.success(ErrorHandler.showSuccessNotification('Mesa eliminada correctamente'));
        loadData();
      } else {
        const errorMessage = ErrorHandler.getFriendlyErrorMessage(apiResponse);
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (err: any) {
      ErrorHandler.logError('eliminar mesa', err, { mesa: itemToDelete });
      const errorMessage = ErrorHandler.showErrorNotification(err, 'eliminar mesa');
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setShowDeleteMesaModal(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-3">
          <XMarkIcon className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Header con botón Crear */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configurar Local
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona pisos, zonas y mesas del restaurante
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Crear {activeTab === 'pisos' ? 'Piso' : activeTab === 'zonas' ? 'Zona' : 'Mesa'}
          </button>
        </div>
      </div>

      {/* Componentes separados */}
      <LocalTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pisosCount={pisos.length}
        zonasCount={zonas.length}
        mesasCount={mesas.length}
      />

      <LocalCategories
        activeTab={activeTab}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        pisos={pisos}
        zonas={zonas}
        mesas={mesas}
        searchTerm={searchTerm}
        filterByStatus={filterByStatus}
        filterByPiso={filterByPiso}
      />

      <LocalFilters
        activeTab={activeTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterByStatus={filterByStatus}
        onStatusChange={setFilterByStatus}
        filterByPiso={filterByPiso}
        onPisoChange={setFilterByPiso}
        onClearFilters={resetFilters}
        pisos={pisos}
      />

      {/* Vista de Tarjetas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getFilteredData().map((item) => (
            <div key={item.id} className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-700/70">
              {/* Imagen/Ícono */}
              <div className="relative h-32 bg-slate-100 dark:bg-slate-700">
                {activeTab === 'pisos' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <BuildingOffice2Icon className="h-12 w-12 text-blue-500" />
                  </div>
                )}
                {activeTab === 'zonas' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapIcon className="h-12 w-12 text-green-500" />
                  </div>
                )}
                {activeTab === 'mesas' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <TableCellsIcon className="h-12 w-12 text-purple-500" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-full h-full bg-white/5 dark:bg-white/10 mix-blend-overlay" />
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {activeTab === 'pisos' && (item as Piso).nombre}
                      {activeTab === 'zonas' && (item as Zona).nombre}
                      {activeTab === 'mesas' && `Mesa ${(item as Mesa).numero}`}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {activeTab === 'pisos' && ((item as Piso).descripcion || 'Sin descripción')}
                      {activeTab === 'zonas' && `${(item as Zona).tipo} - Capacidad: ${(item as Zona).capacidad_maxima}`}
                      {activeTab === 'mesas' && `Zona: ${(item as Mesa).zona_nombre} - Capacidad: ${(item as Mesa).capacidad}`}
                    </p>
                  </div>
                  <div className="ml-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      activeTab === 'pisos' ? getEstadoColor((item as Piso).activo ? 'activo' : 'inactivo') :
                      activeTab === 'zonas' ? getEstadoColor((item as Zona).activo ? 'activo' : 'inactivo') :
                      getEstadoColor((item as Mesa).estado)
                    }`}>
                      {activeTab === 'pisos' && ((item as Piso).activo ? 'Activo' : 'Inactivo')}
                      {activeTab === 'zonas' && ((item as Zona).activo ? 'Activo' : 'Inactivo')}
                      {activeTab === 'mesas' && (item as Mesa).estado}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(item)}
                      className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-900/30 transition-all duration-200"
                      title="Ver detalles"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 transition-all duration-200"
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:text-red-900 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 transition-all duration-200"
                      title="Eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modales */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {modalType === 'create' && `Crear ${activeTab === 'pisos' ? 'Piso' : activeTab === 'zonas' ? 'Zona' : 'Mesa'}`}
                    {modalType === 'edit' && `Editar ${activeTab === 'pisos' ? 'Piso' : activeTab === 'zonas' ? 'Zona' : 'Mesa'}`}
                    {modalType === 'view' && `Ver ${activeTab === 'pisos' ? 'Piso' : activeTab === 'zonas' ? 'Zona' : 'Mesa'}`}
                  </h3>
            <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
                    <XMarkIcon className="h-6 w-6" />
            </button>
        </div>

                {/* Formulario específico según el tipo - Vista de detalles */}
                {modalType === 'view' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeTab === 'pisos' && selectedItem && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Nombre del Piso
                            </label>
                            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {(selectedItem as Piso).nombre}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción
                            </label>
                            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {(selectedItem as Piso).descripcion || 'Sin descripción'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Orden
                            </label>
                            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {(selectedItem as Piso).orden}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado
                            </label>
                            <p className={`p-3 rounded-lg font-medium ${
                              (selectedItem as Piso).activo
                                ? 'text-green-800 bg-green-50 dark:bg-green-900/20 dark:text-green-300'
                                : 'text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-300'
                            }`}>
                              {(selectedItem as Piso).activo ? 'Activo' : 'Inactivo'}
                            </p>
                          </div>
                    </>
                  )}

                      {activeTab === 'zonas' && selectedItem && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Nombre de la Zona
                            </label>
                            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {(selectedItem as Zona).nombre}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Tipo de Zona
                            </label>
                            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {(selectedItem as Zona).tipo}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Piso
                            </label>
                            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {(selectedItem as Zona).piso_nombre}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Capacidad Máxima
                            </label>
                            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {(selectedItem as Zona).capacidad_maxima} personas
                            </p>
                          </div>
                    </>
                  )}

                      {activeTab === 'mesas' && selectedItem && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Número de Mesa
                            </label>
                            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {(selectedItem as Mesa).numero}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Zona
                            </label>
                            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {(selectedItem as Mesa).zona_nombre}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Capacidad
                            </label>
                            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {(selectedItem as Mesa).capacidad} personas
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado
                            </label>
                            <p className={`p-3 rounded-lg font-medium ${
                              getEstadoColor((selectedItem as Mesa).estado)
                            }`}>
                              {(selectedItem as Mesa).estado.charAt(0).toUpperCase() +
                               (selectedItem as Mesa).estado.slice(1).replace('_', ' ')}
                            </p>
                      </div>
                        </>
          )}
        </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cerrar
                      </button>
                    </div>
      </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTab === 'pisos' && (
                    <>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Nombre del Piso *
                        </label>
                        <input
                          type="text"
                          value={formData.nombre || ''}
                          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ej: Planta Baja, Primer Piso"
                          required
                        />
                      </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Descripción
                        </label>
                        <textarea
                          value={formData.descripcion || ''}
                          onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                          rows={3}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Descripción del piso..."
                        />
                      </div>
                      <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Orden
                        </label>
                        <input
                          type="number"
                              value={formData.orden || ''}
                          onChange={(e) => setFormData({...formData, orden: parseInt(e.target.value)})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="1"
                              min="1"
                        />
                      </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Estado
                            </label>
                            <select
                              value={formData.activo !== undefined ? formData.activo : true}
                              onChange={(e) => setFormData({...formData, activo: e.target.value === 'true'})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="true">Activo</option>
                              <option value="false">Inactivo</option>
                            </select>
                      </div>
                    </>
                  )}
                  
                  {activeTab === 'zonas' && (
                    <>
                      <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Nombre de la Zona *
                        </label>
                        <input
                          type="text"
                          value={formData.nombre || ''}
                          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ej: Zona Norte, Terraza"
                          required
                        />
                      </div>
                      <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Tipo de Zona *
                        </label>
                        <select
                          value={formData.tipo || ''}
                          onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Seleccionar tipo</option>
                              <option value="interior">Interior</option>
                              <option value="exterior">Exterior</option>
                              <option value="vip">VIP</option>
                          <option value="barra">Barra</option>
                              <option value="terraza">Terraza</option>
                              <option value="salon">Salón</option>
                              <option value="privado">Privado</option>
                              <option value="familiar">Familiar</option>
                              <option value="business">Business</option>
                              <option value="infantil">Infantil</option>
                              <option value="rapida">Rápida</option>
                              <option value="recepcion">Recepción</option>
                        </select>
                      </div>
                      <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Piso Asociado
                        </label>
                        <select
                          value={formData.piso_id || ''}
                          onChange={(e) => setFormData({...formData, piso_id: parseInt(e.target.value)})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Seleccionar piso</option>
                          {pisos.map((piso) => (
                            <option key={piso.id} value={piso.id}>
                              {piso.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Capacidad Máxima *
                        </label>
                        <input
                          type="number"
                              value={formData.capacidad_maxima || ''}
                          onChange={(e) => setFormData({...formData, capacidad_maxima: parseInt(e.target.value)})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="50"
                              min="1"
                              required
                        />
                      </div>
                    </>
                  )}
                  
                  {activeTab === 'mesas' && (
                    <>
                      <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Número de Mesa *
                        </label>
                        <input
                          type="text"
                          value={formData.numero || ''}
                          onChange={(e) => setFormData({...formData, numero: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Ej: M001, Mesa 1"
                          required
                        />
                      </div>
                      <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Zona
                        </label>
                        <select
                          value={formData.zona_id || ''}
                          onChange={(e) => setFormData({...formData, zona_id: parseInt(e.target.value)})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Seleccionar zona</option>
                          {zonas.map((zona) => (
                            <option key={zona.id} value={zona.id}>
                                  {zona.nombre} ({zona.tipo})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Capacidad *
                            </label>
                            <input
                              type="number"
                              value={formData.capacidad || ''}
                              onChange={(e) => setFormData({...formData, capacidad: parseInt(e.target.value)})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="4"
                              min="1"
                              max="20"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estado
                        </label>
                        <select
                          value={formData.estado || 'disponible'}
                          onChange={(e) => setFormData({...formData, estado: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="disponible">Disponible</option>
                          <option value="ocupada">Ocupada</option>
                          <option value="reservada">Reservada</option>
                              <option value="limpieza">En limpieza</option>
                              <option value="fuera_servicio">Fuera de servicio</option>
                        </select>
                      </div>
                    </>
                  )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                        className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        {modalType === 'create' ? (
                          <>
                            <PlusIcon className="h-5 w-5" />
                            Crear
                          </>
                        ) : (
                          <>
                            <PencilIcon className="h-5 w-5" />
                            Guardar Cambios
                          </>
                        )}
                    </button>
                  </div>
                  </form>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modales de eliminación */}
      <ModalEliminarPiso
        isOpen={showDeletePisoModal}
        onClose={() => setShowDeletePisoModal(false)}
        onConfirm={handleConfirmDeletePiso}
        piso={itemToDelete}
      />

      <ModalEliminarZona
        isOpen={showDeleteZonaModal}
        onClose={() => setShowDeleteZonaModal(false)}
        onConfirm={handleConfirmDeleteZona}
        zona={itemToDelete}
      />

      <ModalEliminarMesa
        isOpen={showDeleteMesaModal}
        onClose={() => setShowDeleteMesaModal(false)}
        onConfirm={handleConfirmDeleteMesa}
        mesa={itemToDelete}
      />

      <ModalEliminarPiso
        isOpen={showDeletePisoModal}
        onClose={() => setShowDeletePisoModal(false)}
        onConfirm={handleConfirmDeletePiso}
        piso={itemToDelete}
      />

      <ModalCrearEditarPiso
        isOpen={showCreateEditPisoModal && modalType !== 'view'}
        onClose={() => setShowCreateEditPisoModal(false)}
        onSuccess={loadData}
        piso={selectedItem}
        mode={modalType === 'view' ? 'edit' : modalType}
      />

      <ModalCrearEditarZona
        isOpen={showCreateEditZonaModal && modalType !== 'view'}
        onClose={() => setShowCreateEditZonaModal(false)}
        onSuccess={loadData}
        zona={selectedItem}
        mode={modalType === 'view' ? 'edit' : modalType}
        pisos={pisos}
      />

      <ModalCrearEditarMesa
        isOpen={showCreateEditMesaModal && modalType !== 'view'}
        onClose={() => setShowCreateEditMesaModal(false)}
        onSuccess={loadData}
        mesa={selectedItem}
        mode={modalType === 'view' ? 'edit' : modalType}
        zonas={zonas}
      />
    </div>
  );
};

export default LocalManagementPage;
