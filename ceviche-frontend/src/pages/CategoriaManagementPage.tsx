import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  PlusIcon as PlusIconSolid,
  PencilIcon as PencilIconSolid,
  TrashIcon as TrashIconSolid,
  CheckIcon as CheckIconSolid
} from '@heroicons/react/24/solid';
import { apiClient } from '../apiClient';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../utils/errorHandler';
import { ThemeToggle } from '../components/ThemeToggle';
import { ConfirmModal } from '../components/ConfirmModal';

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  cantidad_productos: number;
  icono?: string;
  color?: string;
  activo?: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

// Función para formatear fechas
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Nunca';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

  // Iconos disponibles para categorías
  const ICONOS_DISPONIBLES = [
    { name: '🍽️', label: 'Restaurante' },
    { name: '🥘', label: 'Comida' },
    { name: '🍹', label: 'Bebida' },
    { name: '🍰', label: 'Postre' },
    { name: '🥗', label: 'Ensalada' },
    { name: '🍕', label: 'Pizza' },
    { name: '🍔', label: 'Hamburguesa' },
    { name: '🌮', label: 'Taco' },
    { name: '🍜', label: 'Sopa' },
    { name: '🥤', label: 'Refresco' },
    { name: '☕', label: 'Café' },
    { name: '🍺', label: 'Cerveza' },
    { name: '🍷', label: 'Vino' },
    { name: '🧁', label: 'Cupcake' },
    { name: '🍦', label: 'Helado' }
  ];

  // Colores disponibles para categorías con mapeo a clases Tailwind
  const COLORES_DISPONIBLES = [
    { name: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { name: 'green', label: 'Verde', class: 'bg-green-500' },
    { name: 'purple', label: 'Morado', class: 'bg-purple-500' },
    { name: 'red', label: 'Rojo', class: 'bg-red-500' },
    { name: 'yellow', label: 'Amarillo', class: 'bg-yellow-500' },
    { name: 'indigo', label: 'Índigo', class: 'bg-indigo-500' },
    { name: 'pink', label: 'Rosa', class: 'bg-pink-500' },
    { name: 'orange', label: 'Naranja', class: 'bg-orange-500' }
  ];

  // Función para obtener la clase de color correcta
  const getColorClass = (colorName?: string) => {
    if (!colorName) return 'bg-blue-500';
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'purple': 'bg-purple-500',
      'red': 'bg-red-500',
      'yellow': 'bg-yellow-500',
      'indigo': 'bg-indigo-500',
      'pink': 'bg-pink-500',
      'orange': 'bg-orange-500'
    };
    return colorMap[colorName] || 'bg-blue-500';
  };

const CategoriaManagementPage: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    icono: '🍽️',
    color: 'blue',
    activo: true
  });

  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByActive, setFilterByActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Estados para loading de acciones
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(null);

  // Cargar categorías
  const loadCategorias = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getPublic('/api/categoria/public');
      const result = ErrorHandler.processApiResponse(response);
      
      if ((result as any).success) {
        setCategorias((result as any).data?.categorias || (result as any).categorias || []);
      } else {
        toast.error((result as any).message || (result as any).error || 'Error cargando categorías');
        setCategorias([]); // Asegurar que siempre sea un array
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      toast.error('Error cargando categorías');
      setCategorias([]); // Asegurar que siempre sea un array
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  // Filtrar y buscar categorías
  const filteredCategorias = useMemo(() => {
    let filtered = categorias || [];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(categoria =>
        categoria &&
        (categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoria.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrar por estado activo/inactivo
    if (filterByActive !== 'all') {
      filtered = filtered.filter(categoria =>
        categoria &&
        (filterByActive === 'active' ? categoria.activo === true : categoria.activo === false)
      );
    }

    return filtered;
  }, [categorias, searchTerm, filterByActive]);

  // Debug: Verificar cambios en formData
  useEffect(() => {
    console.log('formData cambió:', formData);
  }, [formData]);

  // Debug: Verificar cambios en editingCategoria
  useEffect(() => {
    console.log('editingCategoria cambió:', editingCategoria);
  }, [editingCategoria]);

  // Debug: Verificar cambios en showModal
  useEffect(() => {
    console.log('showModal cambió:', showModal);
  }, [showModal]);

  // Manejar cuando se cambia editingCategoria
  useEffect(() => {
    if (editingCategoria && showModal) {
      console.log('Actualizando formData desde editingCategoria:', editingCategoria);
      const newFormData = {
        nombre: editingCategoria.nombre,
        descripcion: editingCategoria.descripcion || '',
        icono: editingCategoria.icono || '🍽️',
        color: editingCategoria.color || 'blue',
        activo: editingCategoria.activo ?? true
      };
      console.log('Nuevos datos del formulario:', newFormData);
      setFormData(newFormData);
    }
  }, [editingCategoria, showModal]);

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = editingCategoria
        ? `/api/categoria/${editingCategoria.id}`
        : '/api/categoria/';
      
      const method = editingCategoria ? 'PUT' : 'POST';
      
      const response = await apiClient[method.toLowerCase() as keyof typeof apiClient](
        endpoint,
        formData
      );
      
      const result = ErrorHandler.processApiResponse(response);
      
      if (result.success) {
        toast.success(editingCategoria ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
        setShowModal(false);
        resetForm();
        loadCategorias();
      } else {
        const errorMsg = (result as any).message || (result as any).error || `Error ${editingCategoria ? 'actualizando' : 'creando'} categoría`;
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error guardando categoría:', error);
      const errorMsg = error.message || 'Error inesperado guardando categoría';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar edición
  const handleEdit = (categoria: Categoria) => {
    if (!categoria || !categoria.id) {
      console.error('Categoría inválida para editar:', categoria);
      toast.error('Categoría inválida');
      return;
    }
    console.log('Editando categoría:', categoria);
    setEditingCategoria(categoria);
    const newFormData = {
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
      icono: categoria.icono || '🍽️',
      color: categoria.color || 'blue',
      activo: categoria.activo ?? true
    };
    console.log('Nuevos datos del formulario:', newFormData);
    setFormData(newFormData);
    setShowModal(true);
  };

  // Manejar eliminación con confirmación modal
  const handleDelete = (categoria: Categoria) => {
    if (!categoria || !categoria.id) {
      console.error('Categoría inválida para eliminar:', categoria);
      toast.error('Categoría inválida');
      return;
    }
    setCategoriaToDelete(categoria);
    setShowConfirmModal(true);
  };

  // Limpiar modales
  const closeAllModals = () => {
    setShowModal(false);
    setShowConfirmModal(false);
    setCategoriaToDelete(null);
    resetForm();
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (!categoriaToDelete) return;

    setIsDeleting(categoriaToDelete.id);

    try {
      const response = await apiClient.del(`/api/categoria/${categoriaToDelete.id}`);

      // Verificar si la respuesta es HTML (error 500 que devuelve página HTML)
      if (typeof response === 'string') {
        if (response.includes('<!doctype') || response.includes('<html')) {
          console.error('Respuesta HTML recibida en lugar de JSON:', response.substring(0, 200));
          toast.error('Error interno del servidor. Intente más tarde.');
          return;
        }

        // Si es una string pero no HTML, intentar parsear como JSON
        try {
          const parsedResponse = JSON.parse(response);
          const result = ErrorHandler.processApiResponse(parsedResponse);
          if (result.success) {
            toast.success('Categoría eliminada exitosamente');
            setShowConfirmModal(false);
            setCategoriaToDelete(null);
            loadCategorias();
          } else {
            const errorResponse = result as any;
            let errorMsg = 'Error eliminando categoría';
            if (errorResponse.code === 'INTEGRITY_ERROR' || errorResponse.error?.includes('productos')) {
              errorMsg = 'No se puede eliminar la categoría porque tiene productos asociados. Elimine primero los productos o desasocie la categoría.';
            } else if (errorResponse.code === 'NOT_FOUND') {
              errorMsg = 'La categoría no existe o ya fue eliminada.';
            } else if (errorResponse.code === 'PERMISSION_DENIED') {
              errorMsg = 'No tiene permisos para eliminar esta categoría.';
            } else {
              errorMsg = errorResponse.message || errorResponse.error || 'Error eliminando categoría';
            }
            toast.error(errorMsg);
          }
        } catch (parseError) {
          console.error('Error parseando respuesta como JSON:', parseError);
          toast.error('Error del servidor. La respuesta no es válida. Intente más tarde.');
          return;
        }
      } else {
        // Si es un objeto, procesar normalmente
        const result = ErrorHandler.processApiResponse(response);
        if (result.success) {
          toast.success('Categoría eliminada exitosamente');
          setShowConfirmModal(false);
          setCategoriaToDelete(null);
          loadCategorias();
        } else {
          const errorResponse = result as any;
          let errorMsg = 'Error eliminando categoría';
          if (errorResponse.code === 'INTEGRITY_ERROR' || errorResponse.error?.includes('productos')) {
            errorMsg = 'No se puede eliminar la categoría porque tiene productos asociados. Elimine primero los productos o desasocie la categoría.';
          } else if (errorResponse.code === 'NOT_FOUND') {
            errorMsg = 'La categoría no existe o ya fue eliminada.';
          } else if (errorResponse.code === 'PERMISSION_DENIED') {
            errorMsg = 'No tiene permisos para eliminar esta categoría.';
          } else {
            errorMsg = errorResponse.message || errorResponse.error || 'Error eliminando categoría';
          }
          toast.error(errorMsg);
        }
      }
    } catch (error: any) {
      console.error('Error eliminando categoría:', error);
      // Verificar si el error es por parsing de JSON
      if (error.message && error.message.includes('JSON')) {
        toast.error('Error del servidor. La respuesta no es válida. Intente más tarde.');
      } else {
        const errorMsg = error.message || 'Error inesperado eliminando categoría';
        toast.error(errorMsg);
      }
    } finally {
      setIsDeleting(null);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    const resetData = {
      nombre: '',
      descripcion: '',
      icono: '🍽️',
      color: 'blue',
      activo: true
    };
    console.log('Reseteando formulario:', resetData);
    setFormData(resetData);
    setEditingCategoria(null);
  };

  // Abrir modal para nueva categoría
  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  // Debug: Verificar si hay categorías cargadas
  console.log('Categorías cargadas:', categorias.length);
  console.log('filteredCategorias:', filteredCategorias.length);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                🍽️ Gestión de Categorías
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Administra las categorías de productos del menú con estilo y facilidad
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {filteredCategorias.length} categoría{filteredCategorias.length !== 1 ? 's' : ''}
              </div>
              <ThemeToggle size="sm" />
            </div>
          </div>
        </motion.div>

        {/* Barra de búsqueda y filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
        </div>

            {/* Filtros */}
            <div className="flex gap-3">
              <select
                value={filterByActive}
                onChange={(e) => setFilterByActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">Todas las categorías</option>
                <option value="active">Solo activas</option>
                <option value="inactive">Solo inactivas</option>
              </select>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => loadCategorias()}
                disabled={isLoading}
                className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Actualizar datos"
              >
                <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            onClick={openNewModal}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
                <PlusIconSolid className="h-5 w-5" />
            Nueva Categoría
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Estadísticas rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Total Categorías</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{(categorias || []).length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <PlusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Categorías Activas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(categorias || []).filter(c => c && c.activo === true).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
        </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Total Productos</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {(categorias || []).reduce((sum, c) => sum + (c && c.cantidad_productos || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <InformationCircleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista de categorías */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredCategorias.filter(categoria => categoria && categoria.id).map((categoria, index) => (
            <motion.div
              key={categoria.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden hover:bg-slate-100 dark:hover:bg-slate-700/70"
            >
              {/* Header con icono y color */}
              <div className={`h-20 flex items-center justify-between px-6 ${getColorClass(categoria && categoria.color)} text-white relative overflow-hidden`}>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {categoria && categoria.icono || '🍽️'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold truncate">{categoria && categoria.nombre || 'Sin nombre'}</h3>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <span>{categoria && categoria.cantidad_productos || 0} productos</span>
                      {categoria && categoria.activo === true ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-200" />
                      ) : categoria && categoria.activo === false ? (
                        <ClockIcon className="h-4 w-4 text-yellow-200" />
                      ) : (
                        <ClockIcon className="h-4 w-4 text-gray-200" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Badge de estado */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    categoria && categoria.activo === true
                      ? 'bg-green-600 text-white'
                      : categoria && categoria.activo === false
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-600 text-white'
                  }`}>
                    {categoria && categoria.activo === true ? 'Activa' : categoria && categoria.activo === false ? 'Inactiva' : 'Desconocido'}
                  </span>
                </div>

                {/* Overlay de hover: brillo leve y sin capturar eventos */}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-full h-full bg-white/5 dark:bg-white/10 mix-blend-overlay" />
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6">
                {categoria.descripcion && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                    {categoria.descripcion}
                  </p>
                )}

                {/* Información adicional */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-6">
                  <span>ID: {categoria.id}</span>
                  {categoria.creado_en && (
                    <span>Creada: {formatDate(categoria.creado_en)}</span>
                  )}
                </div>

                {/* Botones de acción */}
              <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  onClick={() => categoria && handleEdit(categoria)}
                    disabled={categoria && isDeleting === categoria.id}
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-yellow-300 disabled:to-yellow-400 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <PencilIconSolid className="h-4 w-4" />
                  Editar
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  onClick={() => categoria && handleDelete(categoria)}
                    disabled={categoria && isDeleting === categoria.id}
                    className="flex-1 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 disabled:from-red-300 disabled:to-red-400 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {categoria && isDeleting === categoria.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <TrashIconSolid className="h-4 w-4" />
                    )}
                    {categoria && isDeleting === categoria.id ? 'Eliminando...' : 'Eliminar'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredCategorias.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-400 dark:text-slate-500 mb-6">
                <PlusIcon className="h-20 w-20 mx-auto" />
        </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {searchTerm || filterByActive !== 'all' ? 'No se encontraron categorías' : 'No hay categorías'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                {searchTerm || filterByActive !== 'all'
                  ? 'Intenta ajustar tus filtros de búsqueda para encontrar más categorías.'
                  : 'Comienza creando tu primera categoría para organizar tu menú de forma elegante.'
                }
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openNewModal}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl"
              >
                <PlusIconSolid className="h-5 w-5" />
                Crear Primera Categoría
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de Crear/Editar */}
      <AnimatePresence>
        {showModal && (
          <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={closeAllModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {editingCategoria ? '✏️ Editar Categoría' : '🆕 Nueva Categoría'}
                  {editingCategoria && <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">({editingCategoria.nombre})</span>}
                </h2>
                <button
                  onClick={closeAllModals}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Campo Nombre */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre de la Categoría *
                  </label>
                  <input
                    key={editingCategoria ? 'editing' : 'new'}
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => {
                      console.log('Cambiando nombre a:', e.target.value);
                      setFormData({ ...formData, nombre: e.target.value });
                    }}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Ej: Platos Principales, Bebidas, Postres..."
                    required
                  />
                </div>

                {/* Campo Descripción */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Describe brevemente qué tipo de productos contiene esta categoría..."
                    rows={3}
                  />
                </div>

                {/* Selector de Icono */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Icono
                  </label>
                  <div className="grid grid-cols-8 gap-2 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700">
                    {ICONOS_DISPONIBLES.map((icono) => (
                      <button
                        key={icono.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icono: icono.name })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.icono === icono.name
                            ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
                            : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                        title={icono.label}
                      >
                        <span className="text-xl">{icono.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector de Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Color del Tema
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLORES_DISPONIBLES.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.name })}
                        className={`w-full py-2 px-3 rounded-lg border-2 transition-all ${
                          formData.color === color.name
                            ? 'border-slate-900 dark:border-slate-100'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${color.class}`}></div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {color.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estado Activo */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 text-blue-500 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="activo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Categoría activa
                  </label>
                </div>
                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={closeAllModals}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <>
                        <CheckIconSolid className="h-4 w-4" />
                    {editingCategoria ? 'Actualizar' : 'Crear'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

        {/* Modal de Confirmación de Eliminación */}
        <AnimatePresence>
          {showConfirmModal && (
            <ConfirmModal
              isOpen={showConfirmModal}
              onClose={() => setShowConfirmModal(false)}
              onConfirm={confirmDelete}
              title="🗑️ Eliminar Categoría"
              message={`¿Estás seguro de que deseas eliminar la categoría "${categoriaToDelete?.nombre}"? Esta acción no se puede deshacer y eliminará todos los productos asociados.`}
              confirmText={isDeleting ? "Eliminando..." : "Eliminar"}
              cancelText="Cancelar"
              type="danger"
              isLoading={isDeleting !== null}
            />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoriaManagementPage;
