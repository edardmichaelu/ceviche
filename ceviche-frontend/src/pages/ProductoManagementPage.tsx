import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { ImageUpload, MultiImageUpload } from '../components/admin/ImageUpload';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { ErrorHandler } from '../utils/errorHandler';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  CubeIcon,
  TagIcon,
  StarIcon,
  PhotoIcon,
  CakeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline';

interface ProductoImagen {
  id: number;
  producto_id: number;
  imagen_url: string;
  orden: number;
  es_principal: boolean;
  descripcion?: string;
  creado_en?: string;
}

interface TipoIngrediente {
  id: number;
  nombre: string;
  descripcion?: string;
  color: string;
}

interface Ingrediente {
  id: number;
  nombre: string;
  descripcion?: string;
  stock: number;
  unidad: string;
  tipo_ingrediente_id: number;
  tipo_ingrediente?: TipoIngrediente;
}

interface ProductoIngredienteAsociado {
  id: number;
  producto_id: number;
  ingrediente_id: number;
  cantidad: number;
  producto?: Producto;
  ingrediente?: Ingrediente;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria_id: number;
  tipo_estacion: string;
  tiempo_preparacion?: number;
  nivel_picante?: string;
  ingredientes?: string;
  etiquetas?: string;
  disponible: boolean;
  stock?: number;
  alerta_stock?: number;
  es_favorito: boolean;
  imagen_url?: string;
  imagenes?: ProductoImagen[];
  ingredientes_asociados?: ProductoIngredienteAsociado[];
  categoria?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
}

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

const ProductoManagementPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByCategoria, setFilterByCategoria] = useState('all');
  const [filterByEstacion, setFilterByEstacion] = useState('all');
  const [filterByDisponibilidad, setFilterByDisponibilidad] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [productoToView, setProductoToView] = useState<Producto | null>(null);
  const [ingredientesAsociados, setIngredientesAsociados] = useState<ProductoIngredienteAsociado[]>([]);
  const [showGestionIngredientesModal, setShowGestionIngredientesModal] = useState(false);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [selectedIngredienteId, setSelectedIngredienteId] = useState<string>('');
  const [cantidadAsociacion, setCantidadAsociacion] = useState<string>('');
  const [savingAssoc, setSavingAssoc] = useState(false);
  const [deletingAssocId, setDeletingAssocId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria_id: '',
    tipo_estacion: 'frio',
    tiempo_preparacion: 10,
    nivel_picante: 'ninguno',
    ingredientes: '',
    etiquetas: '',
    disponible: true,
    stock: 0,
    alerta_stock: 5,
    es_favorito: false,
    imagen_url: ''
  });
  const [images, setImages] = useState<ProductoImagen[]>([]);
  const [originalImages, setOriginalImages] = useState<ProductoImagen[]>([]);

  // Debug: verificar cambios en el estado de imágenes
  useEffect(() => {
    console.log('Estado de imágenes actualizado:', images);
  }, [images]);

  const normalizeProductoToForm = (producto: Producto) => {
    // Inicializar imágenes al editar - esto debe hacerse después
    console.log('normalizeProductoToForm llamado con producto:', producto);
    console.log('Imágenes del producto:', producto.imagenes);
    console.log('Cantidad de imágenes:', producto.imagenes?.length || 0);
    if (producto.imagenes && producto.imagenes.length > 0) {
      console.log('Inicializando imágenes para edición:', producto.imagenes);
      setImages([...producto.imagenes]); // Copia para el estado mutable
      setOriginalImages([...producto.imagenes]); // Copia de las imágenes originales para comparación
      console.log('Imágenes inicializadas correctamente');
    } else {
      console.log('No hay imágenes para inicializar');
      setImages([]);
      setOriginalImages([]);
    }
    return {
      nombre: producto.nombre || '',
      descripcion: producto.descripcion ?? '',
      precio: typeof producto.precio === 'number' ? producto.precio : parseFloat((producto as any).precio || '0') || 0,
      categoria_id: String(producto.categoria_id || ''),
      tipo_estacion: producto.tipo_estacion || 'frio',
      tiempo_preparacion: typeof producto.tiempo_preparacion === 'number' ? producto.tiempo_preparacion : (parseInt(String((producto as any).tiempo_preparacion)) || 10),
      nivel_picante: producto.nivel_picante || 'ninguno',
      ingredientes: producto.ingredientes ?? '',
      etiquetas: producto.etiquetas ?? '',
      disponible: Boolean(producto.disponible),
      stock: typeof producto.stock === 'number' ? producto.stock : (parseInt(String((producto as any).stock)) || 0),
      alerta_stock: typeof producto.alerta_stock === 'number' ? producto.alerta_stock : (parseInt(String((producto as any).alerta_stock)) || 5),
      es_favorito: Boolean(producto.es_favorito),
      imagen_url: producto.imagen_url ?? ''
    };
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar productos, categorías e ingredientes asociados en paralelo
      const [productosResponse, categoriasResponse, ingredientesAsociadosResponse] = await Promise.all([
        apiClient.get('/api/producto/'),
        apiClient.get('/api/categoria/'),
        apiClient.get('/api/producto-ingrediente/')
      ]);

      const productosData = ErrorHandler.processApiResponse(productosResponse);
      const categoriasData = ErrorHandler.processApiResponse(categoriasResponse);
      const ingredientesAsociadosData = ErrorHandler.processApiResponse(ingredientesAsociadosResponse);

      if (ErrorHandler.isSuccessResponse(productosData)) {
        const productosArray = Array.isArray(productosData.data) ? productosData.data :
                              Array.isArray(productosData.productos) ? productosData.productos :
                              Array.isArray(productosData) ? productosData : [];
        const sanitized = productosArray.map((p: any) => {
          console.log('Procesando producto:', p.nombre, 'Imágenes:', p.imagenes);
          return {
            ...p,
            descripcion: p.descripcion ?? '',
            ingredientes: p.ingredientes ?? '',
            etiquetas: p.etiquetas ?? '',
            imagen_url: p.imagen_url ?? ''
          };
        });
        setProductos(sanitized);
      }

      if (ErrorHandler.isSuccessResponse(categoriasData)) {
        const categoriasArray = Array.isArray(categoriasData.data) ? categoriasData.data :
                               Array.isArray(categoriasData.categorias) ? categoriasData.categorias :
                               Array.isArray(categoriasData) ? categoriasData : [];
        setCategorias(categoriasArray);
      }

      if (ErrorHandler.isSuccessResponse(ingredientesAsociadosData)) {
        const ingredientesAsociadosArray = Array.isArray(ingredientesAsociadosData.data) ? ingredientesAsociadosData.data :
                                          Array.isArray(ingredientesAsociadosData.asociaciones) ? ingredientesAsociadosData.asociaciones :
                                          Array.isArray(ingredientesAsociadosData) ? ingredientesAsociadosData : [];
        setIngredientesAsociados(ingredientesAsociadosArray);
      }
    } catch (error: any) {
      ErrorHandler.logError('cargar productos', error);
      ErrorHandler.showErrorNotification(error, 'cargar productos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar todos los ingredientes (para gestionar asociaciones en el modal)
  const loadIngredientes = async () => {
    try {
      const response = await apiClient.get('/api/ingrediente/');
      const apiResponse = ErrorHandler.processApiResponse(response);
      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        const arr = Array.isArray(apiResponse.data) ? apiResponse.data : (Array.isArray(apiResponse.ingredientes) ? apiResponse.ingredientes : []);
        setIngredientes(arr);
      }
    } catch (error) {
      ErrorHandler.logError('cargar ingredientes', error);
    }
  };

  // Refrescar asociaciones (para todo, luego filtramos por producto visible)
  const refreshAsociaciones = async () => {
    try {
      const response = await apiClient.get('/api/producto-ingrediente/');
      const apiResponse = ErrorHandler.processApiResponse(response);
      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        const arr = Array.isArray(apiResponse.data) ? apiResponse.data : (Array.isArray(apiResponse.asociaciones) ? apiResponse.asociaciones : []);
        setIngredientesAsociados(arr);
      }
    } catch (error) {
      ErrorHandler.logError('refrescar asociaciones', error);
    }
  };

  // Cargar ingredientes cuando se abre el modal de gestión
  useEffect(() => {
    if (showGestionIngredientesModal) {
      loadIngredientes();
    }
  }, [showGestionIngredientesModal]);

  useEffect(() => {
    if (showCreateModal) {
      loadIngredientes();
    }
  }, [showCreateModal]);

  const handleAddAsociacion = async (productoId?: number) => {
    const targetProductoId = typeof productoId === 'number' ? productoId : (productoToView?.id);
    if (!targetProductoId || !selectedIngredienteId || !cantidadAsociacion) {
      toast.error('Selecciona ingrediente y cantidad');
      return;
    }
    const producto_id = targetProductoId;
    const ingrediente_id = parseInt(selectedIngredienteId);
    const cantidad = parseFloat(cantidadAsociacion);
    if (Number.isNaN(ingrediente_id) || Number.isNaN(cantidad) || cantidad <= 0) {
      toast.error('Cantidad inválida');
      return;
    }
    try {
      setSavingAssoc(true);
      const response = await apiClient.post('/api/producto-ingrediente/', { producto_id, ingrediente_id, cantidad });
      const apiResponse = ErrorHandler.processApiResponse(response);
      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        toast.success('Ingrediente asociado');
        setSelectedIngredienteId('');
        setCantidadAsociacion('');
        await refreshAsociaciones();
      } else {
        throw new Error(ErrorHandler.getFriendlyErrorMessage(apiResponse));
      }
    } catch (error: any) {
      ErrorHandler.showErrorNotification(error, 'asociar ingrediente');
    } finally {
      setSavingAssoc(false);
    }
  };

  const handleDeleteAsociacion = async (asociacionId: number) => {
    try {
      setDeletingAssocId(asociacionId);
      const response = await apiClient.del(`/api/producto-ingrediente/${asociacionId}`);
      const apiResponse = ErrorHandler.processApiResponse(response);
      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        toast.success('Asociación eliminada');
        await refreshAsociaciones();
      } else {
        throw new Error(ErrorHandler.getFriendlyErrorMessage(apiResponse));
      }
    } catch (error: any) {
      ErrorHandler.showErrorNotification(error, 'eliminar asociación');
    } finally {
      setDeletingAssocId(null);
    }
  };

  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategoria = filterByCategoria === 'all' || producto.categoria_id === parseInt(filterByCategoria);
    const matchesEstacion = filterByEstacion === 'all' || producto.tipo_estacion === filterByEstacion;
    const matchesDisponibilidad = filterByDisponibilidad === 'all' ||
                                  (filterByDisponibilidad === 'disponible' && producto.disponible) ||
                                  (filterByDisponibilidad === 'no_disponible' && !producto.disponible);

    return matchesSearch && matchesCategoria && matchesEstacion && matchesDisponibilidad;
  });

  const resetForm = () => {
    setImages([]);
    setOriginalImages([]);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria_id: '',
      tipo_estacion: 'frio',
      tiempo_preparacion: 10,
      nivel_picante: 'ninguno',
      ingredientes: '',
      etiquetas: '',
      disponible: true,
      stock: 0,
      alerta_stock: 5,
      es_favorito: false,
      imagen_url: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        precio: parseFloat(formData.precio.toString()),
        categoria_id: parseInt(formData.categoria_id),
        tiempo_preparacion: parseInt(formData.tiempo_preparacion.toString()),
        stock: parseInt(formData.stock.toString()),
        alerta_stock: parseInt(formData.alerta_stock.toString())
      };

      if (editingProducto) {
        // 1. Sincronizar imágenes en backend si existen cambios en memoria
        try {
          if (images && images.length >= 0) {
            // Usar originalImages para detectar imágenes eliminadas
            const originalImageIds = (originalImages || [])
              .map(img => img?.id)
              .filter((id): id is number => typeof id === 'number');
            const currentImageIds = (images || [])
              .map(img => img?.id)
              .filter((id): id is number => typeof id === 'number');

            console.log('Comparando imágenes para eliminación:');
            console.log('Original images:', originalImages);
            console.log('Current images:', images);
            console.log('Original IDs:', originalImageIds);
            console.log('Current IDs:', currentImageIds);

            const imagesToDelete = originalImageIds.filter(id => !currentImageIds.includes(id));
            console.log('Imágenes a eliminar:', imagesToDelete);

            // Eliminar imágenes que ya no están en la lista actual
            for (const imgId of imagesToDelete) {
              console.log('Eliminando imagen:', imgId);
              try {
                const deleteResponse = await apiClient.del(`/api/producto/imagenes/${imgId}`);
                console.log('Respuesta de eliminación:', deleteResponse);
                console.log('Imagen eliminada exitosamente:', imgId);
              } catch (imgErr: any) {
                console.error(`Error eliminando imagen ${imgId}:`, imgErr);
                console.error('Error details:', imgErr.message);
                // No mostrar error al usuario para no interrumpir el flujo, pero sí loguear
                toast.error(`Error eliminando imagen: ${imgErr.message || 'Error desconocido'}`);
              }
            }

            // Marcar imagen principal si existe
            const principalImage = (images || []).find(img => img.es_principal && typeof img.id === 'number');
            if (principalImage && typeof principalImage.id === 'number') {
              console.log('Marcando imagen principal:', principalImage.id);
              try {
                await apiClient.put(`/api/producto/imagenes/${principalImage.id}/principal`, {});
                console.log('Imagen principal marcada exitosamente:', principalImage.id);
              } catch (imgErr) {
                console.warn(`No se pudo marcar principal ${principalImage.id}:`, imgErr);
              }
            }
          }

          // 2. Guardar el producto
          const response = await apiClient.put(`/api/producto/${editingProducto.id}`, data);
        const apiResponse = ErrorHandler.processApiResponse(response);

        if (ErrorHandler.isSuccessResponse(apiResponse)) {
          toast.success('Producto actualizado correctamente');
          setShowCreateModal(false);
          setEditingProducto(null);
          resetForm();

          // Actualizar el producto en la lista local sin hacer una llamada adicional
          console.log('Actualizando producto en lista local...');
          setProductos(prevProductos =>
            prevProductos.map(p =>
              p.id === editingProducto.id ? {
                ...p,
                // Actualizar campos específicos que podrían haber cambiado
                nombre: formData.nombre,
                descripcion: formData.descripcion,
                precio: formData.precio,
                categoria_id: parseInt(formData.categoria_id) || p.categoria_id, // Convertir string a number
                tipo_estacion: formData.tipo_estacion,
                tiempo_preparacion: formData.tiempo_preparacion,
                nivel_picante: formData.nivel_picante,
                ingredientes: formData.ingredientes,
                etiquetas: formData.etiquetas,
                disponible: formData.disponible,
                stock: formData.stock,
                alerta_stock: formData.alerta_stock,
                es_favorito: formData.es_favorito,
                imagen_url: formData.imagen_url,
                // Las imágenes se actualizan a través de la API, pero no las necesitamos aquí
                imagenes: images // Usar las imágenes del estado local actualizadas
              } : p
            )
          );
          console.log('Producto actualizado en lista local exitosamente');
        } else {
          throw new Error(ErrorHandler.getFriendlyErrorMessage(apiResponse));
        }
        } catch (err) {
          throw err;
        }
      } else {
        // Crear producto
        const response = await apiClient.post('/api/producto/', data);
        const apiResponse = ErrorHandler.processApiResponse(response);

        if (ErrorHandler.isSuccessResponse(apiResponse)) {
          toast.success('Producto creado correctamente');
          setShowCreateModal(false);
          resetForm();

          // Actualizar la lista local agregando el nuevo producto
          console.log('Agregando nuevo producto a lista local...');
          setProductos(prevProductos => [...prevProductos, apiResponse.data]);
          console.log('Nuevo producto agregado exitosamente');
        } else {
          throw new Error(ErrorHandler.getFriendlyErrorMessage(apiResponse));
        }
      }
    } catch (error: any) {
      ErrorHandler.logError('guardar producto', error, { formData, editingProducto });
      ErrorHandler.showErrorNotification(error, 'guardar producto');
    }
  };

  const handleDelete = async () => {
    if (!productoToDelete) return;

    try {
      const response = await apiClient.del(`/api/producto/${productoToDelete.id}`);
      const apiResponse = ErrorHandler.processApiResponse(response);

      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        toast.success('Producto eliminado correctamente');
        setShowDeleteModal(false);
        setProductoToDelete(null);

        // Actualizar la lista local eliminando el producto
        console.log('Eliminando producto de lista local...');
        setProductos(prevProductos =>
          prevProductos.filter(p => p.id !== productoToDelete.id)
        );
        console.log('Producto eliminado de lista local exitosamente');
      } else {
        throw new Error(ErrorHandler.getFriendlyErrorMessage(apiResponse));
      }
    } catch (error: any) {
      ErrorHandler.logError('eliminar producto', error, { producto: productoToDelete });
      ErrorHandler.showErrorNotification(error, 'eliminar producto');
    }
  };

  const toggleFavorito = async (producto: Producto) => {
    try {
      const response = await apiClient.put(`/api/producto/${producto.id}/favorito`, {});
      const apiResponse = ErrorHandler.processApiResponse(response);

      if (ErrorHandler.isSuccessResponse(apiResponse)) {
        toast.success(`Producto ${producto.es_favorito ? 'desmarcado' : 'marcado'} como favorito`);

        // Actualizar el estado de favorito en la lista local
        console.log('Actualizando estado de favorito en lista local...');
        setProductos(prevProductos =>
          prevProductos.map(p =>
            p.id === producto.id ? { ...p, es_favorito: !p.es_favorito } : p
          )
        );
        console.log('Estado de favorito actualizado exitosamente');
      } else {
        throw new Error(ErrorHandler.getFriendlyErrorMessage(apiResponse));
      }
    } catch (error: any) {
      ErrorHandler.logError('toggle favorito', error, { producto });
      ErrorHandler.showErrorNotification(error, 'toggle favorito');
    }
  };

  const getEstacionColor = (estacion: string) => {
    switch (estacion) {
      case 'frio': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
      case 'caliente': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      case 'bebida': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      case 'postre': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getPicanteColor = (nivel?: string) => {
    switch (nivel) {
      case 'alto': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      case 'medio': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300';
      case 'bajo': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  // Normaliza texto para búsqueda: minúsculas + sin acentos
  const normalizeForSearch = (value: any): string => {
    try {
      return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
    } catch {
      return String(value || '').toLowerCase().replace(/[\u0300-\u036f]/g, '').trim();
    }
  };

  // Función helper para construir URLs completas
  const getFullImageUrl = (relativeUrl: string | null) => {
    if (!relativeUrl) return null;

    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }

    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = 5000;
    return `${protocol}//${host}:${port}${relativeUrl}`;
  };

  // Función para obtener la imagen principal del producto con URL completa
  const getImagenPrincipal = (producto: Producto) => {
    if (producto.imagenes && producto.imagenes.length > 0) {
      const imagenPrincipal = producto.imagenes.find(img => img.es_principal);
      const imagenUrl = imagenPrincipal ? imagenPrincipal.imagen_url : producto.imagenes[0].imagen_url;
      return getFullImageUrl(imagenUrl);
    }
    return null;
  };

  // Función para obtener los ingredientes asociados a un producto
  const getIngredientesAsociadosByProducto = (productoId: number): ProductoIngredienteAsociado[] => {
    return ingredientesAsociados.filter(asociacion => asociacion.producto_id === productoId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gestión de Productos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administra el catálogo de productos del restaurante
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingProducto(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo Producto
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filterByCategoria}
            onChange={(e) => setFilterByCategoria(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las categorías</option>
            {categorias.map(categoria => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>

          <select
            value={filterByEstacion}
            onChange={(e) => setFilterByEstacion(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las estaciones</option>
            <option value="frio">Frío</option>
            <option value="caliente">Caliente</option>
            <option value="bebida">Bebida</option>
            <option value="postre">Postre</option>
          </select>

          <select
            value={filterByDisponibilidad}
            onChange={(e) => setFilterByDisponibilidad(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="no_disponible">No disponible</option>
          </select>
        </div>
      </div>

      {/* Pestañas por categoría + Cards de productos */}
      <div className="px-6 py-6">
        {/* Tabs de categoría */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setFilterByCategoria('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${filterByCategoria === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              Todas
            </button>
            {categorias.map(c => (
              <button
                key={c.id}
                onClick={() => setFilterByCategoria(String(c.id))}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${filterByCategoria === String(c.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProductos.map((producto) => (
            <div
              key={producto.id}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden hover:bg-slate-50 dark:hover:bg-slate-700/70 cursor-pointer"
              onClick={() => {
                setProductoToView(producto);
                setShowViewModal(true);
              }}
            >
              {/* Imagen */}
              <div className="relative h-40 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                {(() => {
                  const imagenPrincipal = getImagenPrincipal(producto);
                  console.log(`Rendering image for ${producto.nombre}:`, {
                    hasImage: !!imagenPrincipal,
                    url: imagenPrincipal
                  });

                  return imagenPrincipal ? (
                    <img
                      src={imagenPrincipal}
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                      onLoad={(e) => console.log(`✅ Image loaded for ${producto.nombre}`)}
                      onError={(e) => {
                        console.error(`❌ Error loading image for ${producto.nombre}:`, imagenPrincipal);
                        e.currentTarget.style.display = 'none';
                        // Mostrar el ícono de fallback
                        const fallback = e.currentTarget.parentNode?.querySelector('.fallback-icon');
                        if (fallback) {
                          (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                      style={{ display: 'block' }}
                    />
                  ) : null;
                })()}
                <div className="fallback-icon w-full h-full flex items-center justify-center text-slate-400" style={{ display: 'none' }}>
                  <CakeIcon className="h-12 w-12" />
                </div>
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-full h-full bg-white/5 dark:bg-white/10 mix-blend-overlay" />
                </div>

                {/* Estado - Esquina superior derecha */}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    producto.disponible
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                  }`}>
                    {producto.disponible ? '✅' : '❌'}
                  </span>
                </div>

                {/* Favoritos - Esquina superior izquierda */}
                <div className="absolute top-2 left-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar que se dispare el clic de la tarjeta
                      toggleFavorito(producto);
                    }}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      producto.es_favorito
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                        : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                    title={producto.es_favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    <StarIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{producto.nombre}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{(producto.descripcion || '').slice(0, 80)}{(producto.descripcion || '').length > 80 ? '…' : ''}</p>
                  </div>
                  <div className="ml-3 text-right">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">S/ {Number(producto.precio).toFixed(2)}</div>
                    <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getEstacionColor(producto.tipo_estacion)}`}>
                      {producto.tipo_estacion}
                    </span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar que se dispare el clic de la tarjeta
                      console.log('Editando producto:', producto);
                      console.log('Imágenes del producto:', producto.imagenes);
                      console.log('Estado de imágenes antes:', images);
                      try {
                        const formData = normalizeProductoToForm(producto);
                        console.log('FormData normalizado:', formData);
                        console.log('Estado de imágenes después:', images);
                        console.log('Estado de originalImages después:', originalImages);
                        setEditingProducto(producto);
                        setFormData(formData);
                        setShowCreateModal(true);
                        console.log('Modal de edición abierto. showCreateModal:', true);
                      } catch (error) {
                        console.error('Error al editar producto:', error);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 transition-all duration-200"
                    title="Editar"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar que se dispare el clic de la tarjeta
                      setProductoToDelete(producto);
                      setShowDeleteModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:text-red-900 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 transition-all duration-200"
                    title="Eliminar"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Ver Detalles */}
      <AnimatePresence>
        {showViewModal && productoToView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="mb-4 rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-95"></div>
                <div className="relative p-6 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-white/80 mb-1">Producto</div>
                      <h2 className="text-2xl font-bold drop-shadow-sm">{productoToView.nombre}</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur">
                          <TagIcon className="h-4 w-4" />{productoToView.categoria?.nombre || 'Sin categoría'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur">
                          {productoToView.es_favorito ? '⭐ Favorito' : 'Producto'}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur`}>
                          {productoToView.tipo_estacion}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold tracking-tight drop-shadow">S/ {Number(productoToView.precio).toFixed(2)}</div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${productoToView.disponible ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-800'}`}>
                          {productoToView.disponible ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="absolute top-3 right-3 p-1 rounded-full text-white/80 hover:bg-white/20"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Contenido principal */}
              <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                {/* Carrusel de Imágenes */}
                <div className="lg:w-2/5 flex-shrink-0">
                  <ImageCarousel
                    images={productoToView.imagenes || []}
                    productName={productoToView.nombre}
                    className="h-80 lg:h-96"
                    autoPlay={false}
                    showControls={true}
                  />
                  {productoToView.descripcion && (
                    <div className="mt-4 hidden lg:block bg-gradient-to-br from-slate-50 to-white dark:from-slate-700/30 dark:to-slate-700/10 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm mb-2">
                        <TagIcon className="h-4 w-4" />
                        Descripción
                      </div>
                      <div className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap text-sm leading-relaxed">
                        {productoToView.descripcion}
                      </div>
                    </div>
                  )}
                </div>

                {/* Datos del producto */}
                <div className="lg:w-3/5 flex-1 overflow-y-auto">
                  <div className="space-y-5">
                    {/* Tarjetas de datos rápidas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-xl p-3 bg-white dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                          <TagIcon className="h-4 w-4" />
                          Categoría
                        </div>
                        <div className="text-slate-900 dark:text-white text-sm mt-1">{productoToView.categoria?.nombre || 'Sin categoría'}</div>
                      </div>
                      <div className="rounded-xl p-3 bg-white dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">Estación</div>
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getEstacionColor(productoToView.tipo_estacion)}`}>{productoToView.tipo_estacion}</span>
                      </div>
                      {typeof productoToView.tiempo_preparacion !== 'undefined' && (
                        <div className="rounded-xl p-3 bg-white dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                            <ClockIcon className="h-4 w-4" />Tiempo
                          </div>
                          <div className="text-slate-900 dark:text-white text-sm mt-1">{productoToView.tiempo_preparacion} min</div>
                        </div>
                      )}
                      {productoToView.nivel_picante && (
                        <div className="rounded-xl p-3 bg-white dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                            <FireIcon className="h-4 w-4" />Picante
                          </div>
                          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPicanteColor(productoToView.nivel_picante)}`}>{productoToView.nivel_picante}</span>
                        </div>
                      )}
                    </div>

                    {/* Estado y destacado */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="rounded-xl p-3 bg-white dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                        <div className="text-xs text-slate-500 dark:text-slate-300">Estado</div>
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-xs font-medium ${productoToView.disponible ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                          {productoToView.disponible ? '✅ Disponible' : '❌ No disponible'}
                        </span>
                      </div>
                      <div className="rounded-xl p-3 bg-white dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                        <div className="text-xs text-slate-500 dark:text-slate-300">Destacado</div>
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-xs font-medium ${productoToView.es_favorito ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {productoToView.es_favorito ? '⭐ Sí' : '❌ No'}
                        </span>
                      </div>
                    </div>
                 {(typeof productoToView.stock !== 'undefined' || typeof productoToView.alerta_stock !== 'undefined') && (
                   <div>
                     <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Inventario</div>
                     <div className="grid grid-cols-2 gap-3">
                       {typeof productoToView.stock !== 'undefined' && (
                         <div className="flex items-center gap-3 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
                           <CubeIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                           <div>
                             <div className="text-xs text-slate-500 dark:text-slate-300">Stock</div>
                             <div className="text-sm font-semibold text-slate-900 dark:text-white">{productoToView.stock}</div>
                           </div>
                         </div>
                       )}
                       {typeof productoToView.alerta_stock !== 'undefined' && (
                         <div className="flex items-center gap-3 rounded-lg p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                           <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                           <div>
                             <div className="text-xs text-yellow-700 dark:text-yellow-300">Alerta</div>
                             <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">{productoToView.alerta_stock}</div>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                {/* Descripción */}
                 {productoToView.descripcion && (
                   <div className="lg:hidden">
                     <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Descripción</div>
                     <div className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap">{productoToView.descripcion}</div>
                   </div>
                 )}

                {/* Ingredientes Asociados */}
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Ingredientes Asociados</div>
                  {(() => {
                    const ingredientesDelProducto = getIngredientesAsociadosByProducto(productoToView.id);
                    if (ingredientesDelProducto.length > 0) {
                      return (
                        <div className="space-y-2">
                        {ingredientesDelProducto.map((asociacion) => (
                            <div key={asociacion.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center gap-2">
                                {asociacion.ingrediente?.tipo_ingrediente && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: asociacion.ingrediente.tipo_ingrediente.color }}
                                  />
                                )}
                                <span className="text-gray-900 dark:text-white font-medium">
                                  {asociacion.ingrediente?.nombre || 'Ingrediente desconocido'}
                                </span>
                                {asociacion.ingrediente?.tipo_ingrediente && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ({asociacion.ingrediente.tipo_ingrediente.nombre})
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {asociacion.cantidad} {asociacion.ingrediente?.unidad || 'unidades'}
                                </div>
                                {asociacion.ingrediente && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Stock: {asociacion.ingrediente.stock} {asociacion.ingrediente.unidad}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    } else if (productoToView.ingredientes) {
                      // Si no hay ingredientes asociados pero hay el string de ingredientes, mostrar el string
                      return (
                        <div className="text-gray-900 dark:text-gray-200 italic">
                          {productoToView.ingredientes}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-gray-500 dark:text-gray-400 italic">
                          No hay ingredientes asociados definidos
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Etiquetas */}
                    {productoToView.etiquetas && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Etiquetas</div>
                        <div className="flex flex-wrap gap-2">
                          {productoToView.etiquetas.split(',').map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{tag.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Crear/Editar */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              {/* Debug: Renderizando modal de edición. showCreateModal: {showCreateModal}, editingProducto: {editingProducto ? 'si' : 'no'}, images: {images.length} */}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Precio *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.precio}
                      onChange={(e) => setFormData({...formData, precio: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoría *
                    </label>
                    <select
                      required
                      value={formData.categoria_id}
                      onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map(categoria => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estación *
                    </label>
                    <select
                      required
                      value={formData.tipo_estacion}
                      onChange={(e) => setFormData({...formData, tipo_estacion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="frio">Frío</option>
                      <option value="caliente">Caliente</option>
                      <option value="bebida">Bebida</option>
                      <option value="postre">Postre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tiempo de preparación (minutos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.tiempo_preparacion}
                      onChange={(e) => setFormData({...formData, tiempo_preparacion: parseInt(e.target.value) || 10})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nivel de picante
                    </label>
                    <select
                      value={formData.nivel_picante}
                      onChange={(e) => setFormData({...formData, nivel_picante: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="ninguno">Ninguno</option>
                      <option value="bajo">Bajo</option>
                      <option value="medio">Medio</option>
                      <option value="alto">Alto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Imágenes del producto
                  </label>
                  {editingProducto ? (
                    <div className="mt-1">
                      <MultiImageUpload
                        productId={editingProducto.id}
                        images={images}
                        onImagesChange={(newImages) => {
                          // Solo actualizar el estado de imágenes, NO tocar editingProducto
                          setImages(newImages);
                        }}
                        onImagesAdded={(ids) => {
                          console.log('Imágenes agregadas (IDs):', ids);
                          // Si fuera necesario, podemos acumular una lista de nuevas para sincronizar
                        }}
                        onImagesRemoved={(ids) => {
                          console.log('Imágenes marcadas para eliminar (IDs):', ids);
                          // Si fuera necesario, podemos acumular una lista de eliminadas
                        }}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Puedes subir múltiples imágenes. La primera imagen marcada como "Principal" se mostrará como imagen principal del producto.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Las imágenes se pueden agregar después de crear el producto.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ingredientes
                  </label>
                  <textarea
                    value={formData.ingredientes}
                    onChange={(e) => setFormData({...formData, ingredientes: e.target.value})}
                    rows={3}
                    placeholder="Lista los ingredientes principales separados por comas"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Etiquetas
                  </label>
                  <input
                    type="text"
                    value={formData.etiquetas}
                    onChange={(e) => setFormData({...formData, etiquetas: e.target.value})}
                    placeholder="nuevo, recomendado, vegetariano, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="disponible"
                    checked={formData.disponible}
                    onChange={(e) => setFormData({...formData, disponible: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="disponible" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Disponible para venta
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      📦 Stock Actual
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Cantidad en inventario"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ⚠️ Alerta de Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.alerta_stock}
                      onChange={(e) => setFormData({...formData, alerta_stock: parseInt(e.target.value) || 5})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Límite para alertas"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="es_favorito"
                    checked={formData.es_favorito}
                    onChange={(e) => setFormData({...formData, es_favorito: e.target.checked})}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <label htmlFor="es_favorito" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    ⭐ Producto destacado/favorito
                  </label>
                </div>

                {/* Gestionar ingredientes asociados directamente en edición */}
                {editingProducto && (
                  <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Ingredientes asociados</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Producto: {editingProducto.nombre}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            placeholder="Buscar ingrediente por nombre, tipo, stock o unidad..."
                            value={ingredientSearchTerm}
                            onChange={(e) => setIngredientSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          {ingredientSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setIngredientSearchTerm('')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <select
                          value={selectedIngredienteId}
                          onChange={(e) => setSelectedIngredienteId(e.target.value)}
                          className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">{ingredientSearchTerm ? 'Selecciona un ingrediente' : `Seleccionar ingrediente (${ingredientes.length} total)`}</option>
                          {ingredientes
                            .filter((i) => {
                              const term = ingredientSearchTerm.trim().toLowerCase();
                              if (!term) return true;
                              const tipoNombre = i.tipo_ingrediente?.nombre?.toLowerCase() || '';
                              return i.nombre.toLowerCase().includes(term) ||
                                i.unidad.toLowerCase().includes(term) ||
                                String(i.stock).includes(term) ||
                                tipoNombre.includes(term);
                            })
                            .slice(0, 50)
                            .map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.nombre} - Stock: {i.stock} {i.unidad}{i.tipo_ingrediente ? ` - ${i.tipo_ingrediente.nombre}` : ''}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          placeholder="Cantidad"
                          value={cantidadAsociacion}
                          onChange={(e) => setCantidadAsociacion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddAsociacion(editingProducto.id)}
                          disabled={savingAssoc}
                          className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                        >
                          {savingAssoc ? 'Agregando...' : 'Agregar'}
                        </button>
                      </div>
                    </div>

                    {/* Lista de asociados del producto en edición */}
                    <div className="mt-3">
                      {(() => {
                        const asociados = getIngredientesAsociadosByProducto(editingProducto.id);
                        if (asociados.length === 0) {
                          return (
                            <div className="text-sm text-gray-500 dark:text-gray-400">No hay ingredientes asociados aún</div>
                          );
                        }
                        return (
                          <div className="space-y-2">
                            {asociados.map((as) => (
                              <div key={as.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center gap-2">
                                  {as.ingrediente?.tipo_ingrediente && (
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: as.ingrediente.tipo_ingrediente.color }} />
                                  )}
                                  <span className="text-sm text-gray-900 dark:text-white font-medium">{as.ingrediente?.nombre}</span>
                                  {as.ingrediente?.tipo_ingrediente && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">({as.ingrediente.tipo_ingrediente.nombre})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-900 dark:text-white">{as.cantidad} {as.ingrediente?.unidad || 'unidades'}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAsociacion(as.id)}
                                    disabled={deletingAssocId === as.id}
                                    className="px-2 py-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 hover:text-red-900 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded"
                                  >
                                    {deletingAssocId === as.id ? 'Eliminando...' : 'Eliminar'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingProducto(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingProducto ? 'Actualizar' : 'Crear'} Producto
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Eliminar Producto
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  ¿Estás seguro de que deseas eliminar el producto "<strong>{productoToDelete?.nombre}</strong>"? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setProductoToDelete(null);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Gestión de Ingredientes Asociados */}
      <AnimatePresence>
        {showGestionIngredientesModal && productoToView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowGestionIngredientesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gestionar Ingredientes - {productoToView.nombre}
                </h2>
                <button
                  onClick={() => setShowGestionIngredientesModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {/* Agregar nuevo ingrediente */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Agregar Ingrediente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            placeholder="Buscar ingrediente por nombre, tipo, stock o unidad..."
                            value={ingredientSearchTerm}
                            onChange={(e) => setIngredientSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          {ingredientSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setIngredientSearchTerm('')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <select
                          value={selectedIngredienteId}
                          onChange={(e) => setSelectedIngredienteId(e.target.value)}
                          className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">{ingredientSearchTerm ? 'Selecciona un ingrediente' : `Seleccionar ingrediente (${ingredientes.length} total)`}</option>
                          {ingredientes
                            .filter((i) => {
                              const term = normalizeForSearch(ingredientSearchTerm);
                              if (!term) return true;
                              const nombre = normalizeForSearch(i.nombre);
                              const unidad = normalizeForSearch(i.unidad);
                              const stockStr = normalizeForSearch(String(i.stock));
                              const tipoNombre = normalizeForSearch(i.tipo_ingrediente?.nombre);
                              return nombre.includes(term) || unidad.includes(term) || stockStr.includes(term) || tipoNombre.includes(term);
                            })
                            .slice(0, 50)
                            .map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.nombre} - Stock: {i.stock} {i.unidad}{i.tipo_ingrediente ? ` - ${i.tipo_ingrediente.nombre}` : ''}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          placeholder="Cantidad"
                          value={cantidadAsociacion}
                          onChange={(e) => setCantidadAsociacion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddAsociacion()}
                          disabled={savingAssoc}
                          className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                        >
                          {savingAssoc ? 'Agregando...' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de ingredientes actuales */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Ingredientes Asociados Actuales
                    </h3>
                    {(() => {
                      const ingredientesDelProducto = getIngredientesAsociadosByProducto(productoToView.id);
                      if (ingredientesDelProducto.length > 0) {
                        return (
                          <div className="space-y-2">
                            {ingredientesDelProducto.map((asociacion) => (
                              <div key={asociacion.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {asociacion.ingrediente?.tipo_ingrediente && (
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: asociacion.ingrediente.tipo_ingrediente.color }}
                                    />
                                  )}
                                  <div>
                                    <div className="text-gray-900 dark:text-white font-medium">
                                      {asociacion.ingrediente?.nombre || 'Ingrediente desconocido'}
                                    </div>
                                    {asociacion.ingrediente?.tipo_ingrediente && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {asociacion.ingrediente.tipo_ingrediente.nombre}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {asociacion.cantidad} {asociacion.ingrediente?.unidad || 'unidades'}
                                    </div>
                                    {asociacion.ingrediente && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Stock: {asociacion.ingrediente.stock} {asociacion.ingrediente.unidad}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleDeleteAsociacion(asociacion.id)}
                                    disabled={deletingAssocId === asociacion.id}
                                    className="px-2 py-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 hover:text-red-900 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded transition-all duration-200"
                                  >
                                    {deletingAssocId === asociacion.id ? 'Eliminando...' : 'Eliminar'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <CubeIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No hay ingredientes asociados a este producto</p>
                            <p className="text-sm">Ve a la página de gestión de Producto-Ingrediente para agregar asociaciones</p>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  {/* Acciones rápidas */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Gestiona las asociaciones de ingredientes en la página dedicada
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowGestionIngredientesModal(false)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cerrar
                      </button>
                      <button
                        onClick={() => {
                          toast('Redirigiendo a gestión de Producto-Ingrediente...');
                          setShowGestionIngredientesModal(false);
                          // Aquí podrías navegar a la página de gestión de Producto-Ingrediente
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Gestionar en Página Dedicada
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductoManagementPage;
