import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { ValidationService } from '../utils/validation';
import { ErrorHandler } from '../utils/errorHandler';
import { ModalCancelacion } from '../components/ModalCancelacion';
import { ModalVerBloqueo } from '../components/ModalVerBloqueo';
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  BuildingOffice2Icon,
  TableCellsIcon,
  HomeIcon,
  UserIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface Bloqueo {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  mesa_id?: number;
  zona_id?: number;
  piso_id?: number;
  notas?: string;
  motivo?: string;
  mesa_numero?: string;
  zona_nombre?: string;
  piso_nombre?: string;
  usuario_nombre?: string;
  duracion_horas: number;
  creado_en: string;
}

interface Zona {
  id: number;
  nombre: string;
  tipo: string;
}

interface Mesa {
  id: number;
  numero: string;
  capacidad: number;
  zona_id: number;
  estado: string;
}

interface Piso {
  id: number;
  nombre: string;
}

const BloqueosPage: React.FC = () => {
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBloqueo, setEditingBloqueo] = useState<Bloqueo | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bloqueoToCancel, setBloqueoToCancel] = useState<Bloqueo | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [bloqueoToView, setBloqueoToView] = useState<Bloqueo | null>(null);
  const [filtros, setFiltros] = useState({
    estado: '',
    tipo: '',
    ubicacion: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'mantenimiento',
    fecha_inicio: '',
    fecha_fin: '',
    ubicacion_tipo: 'mesa', // mesa, zona, piso
    mesa_id: '',
    zona_id: '',
    piso_id: '',
    notas: '',
    motivo: ''
  });

  // Forzar re-render del formulario
  const [formKey, setFormKey] = useState(0);

  // Debug: Log cuando cambia el estado del formulario
  // useEffect(() => {
  //   console.log('🔍 Estado del formulario actualizado:', formData);
  // }, [formData]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bloqueosRes, zonasRes, mesasRes, pisosRes] = await Promise.all([
        apiClient.getPublic('/api/bloqueos/public'),
        apiClient.getPublic('/api/local/zonas/public'),
        apiClient.getPublic('/api/local/mesas/public'),
        apiClient.getPublic('/api/local/pisos/public')
      ]);

      setBloqueos((bloqueosRes as any)?.bloqueos || []);
      setZonas((zonasRes as any)?.data || []);
      setMesas((mesasRes as any)?.data || []);
      setPisos((pisosRes as any)?.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error(' Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar datos usando el sistema robusto
      const validation = ValidationService.validateBloqueo(formData);
      if (!validation.isValid) {
        const errorMessages = ValidationService.displayValidationErrors(validation.errors);
        errorMessages.forEach(message => toast.error(`❌ ${message}`));
        return;
      }
      
      // Formatear fechas para el backend (sin zona horaria)
      const fechaInicio = new Date(formData.fecha_inicio);
      const fechaFin = new Date(formData.fecha_fin);
      
      // Convertir a formato ISO sin zona horaria (remover la 'Z' final)
      const fechaInicioISO = fechaInicio.toISOString().replace('Z', '');
      const fechaFinISO = fechaFin.toISOString().replace('Z', '');
      
      const data: any = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        fecha_inicio: fechaInicioISO,
        fecha_fin: fechaFinISO,
        notas: formData.notas,
        motivo: formData.motivo,
        usuario_id: 1 // ID del usuario admin por defecto
      };

      // Agregar ubicación según el tipo seleccionado
      // Solo enviar el campo que corresponde al tipo seleccionado
      if (formData.ubicacion_tipo === 'mesa' && formData.mesa_id) {
        data.mesa_id = parseInt(formData.mesa_id);
        data.zona_id = null;
        data.piso_id = null;
      } else if (formData.ubicacion_tipo === 'zona' && formData.zona_id) {
        data.zona_id = parseInt(formData.zona_id);
        data.mesa_id = null;
        data.piso_id = null;
      } else if (formData.ubicacion_tipo === 'piso' && formData.piso_id) {
        data.piso_id = parseInt(formData.piso_id);
        data.mesa_id = null;
        data.zona_id = null;
      } else {
        // Si no hay selección válida, limpiar todos
        data.mesa_id = null;
        data.zona_id = null;
        data.piso_id = null;
      }

      let response;
      if (editingBloqueo) {
        response = await apiClient.put(`/api/bloqueos/${editingBloqueo.id}`, data);
        const apiResponse = ErrorHandler.processApiResponse(response);
        
        if (ErrorHandler.isSuccessResponse(apiResponse)) {
          ErrorHandler.showSuccessNotification('Bloqueo actualizado correctamente');
          setShowModal(false);
          setEditingBloqueo(null);
          await loadData();
        } else {
          throw new Error(ErrorHandler.getFriendlyErrorMessage(apiResponse));
        }
      } else {
        response = await apiClient.postPublic('/api/bloqueos/public', data);
        const apiResponse = ErrorHandler.processApiResponse(response);
        
        if (ErrorHandler.isSuccessResponse(apiResponse)) {
          ErrorHandler.showSuccessNotification('Bloqueo creado correctamente');
          setShowModal(false);
          setEditingBloqueo(null);
          resetForm();
          loadData();
        } else {
          throw new Error(ErrorHandler.getFriendlyErrorMessage(apiResponse));
        }
      }
    }catch (error: any) {
      ErrorHandler.logError('guardar bloqueo', error, { formData, editingBloqueo });
      ErrorHandler.showErrorNotification(error, 'guardar bloqueo');
    } 
  };

  const handleEdit = (bloqueo: Bloqueo) => {

    
    // Determinar el tipo de ubicación (prioridad: piso > zona > mesa)
    let ubicacion_tipo = 'mesa';
    if (bloqueo.piso_id) {
      ubicacion_tipo = 'piso';
    } else if (bloqueo.zona_id) {
      ubicacion_tipo = 'zona';
    } else if (bloqueo.mesa_id) {
      ubicacion_tipo = 'mesa';
    }
    
    console.log('🔍 Tipo de ubicación detectado:', ubicacion_tipo);
    console.log('🔍 IDs del bloqueo:', {
      mesa_id: bloqueo.mesa_id,
      zona_id: bloqueo.zona_id,
      piso_id: bloqueo.piso_id
    });
    
    // Formatear fechas para datetime-local
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (error) {
        console.error('Error formateando fecha:', error);
        return '';
      }
    };

    const newFormData = {
      titulo: bloqueo.titulo,
      descripcion: bloqueo.descripcion || '',
      tipo: bloqueo.tipo,
      fecha_inicio: formatDateForInput(bloqueo.fecha_inicio),
      fecha_fin: formatDateForInput(bloqueo.fecha_fin),
      ubicacion_tipo,
      mesa_id: bloqueo.mesa_id?.toString() || '',
      zona_id: bloqueo.zona_id?.toString() || '',
      piso_id: bloqueo.piso_id?.toString() || '',
      notas: bloqueo.notas || '',
      motivo: bloqueo.motivo || ''
    };
    
    
    // Resetear y configurar todo de una vez
    setEditingBloqueo(bloqueo);
    setFormData(newFormData);
    setFormKey(prev => prev + 1);
    setShowModal(true);
  };

  const handleDelete = (bloqueo: Bloqueo) => {
    setBloqueoToCancel(bloqueo);
    setShowCancelModal(true);
  };

  const handleConfirmCancelacion = async (motivo: string) => {
    if (!bloqueoToCancel) return;
    
    try {
      await apiClient.delPublic(`/api/bloqueos/public/${bloqueoToCancel.id}`);
      toast.success('✅ Bloqueo eliminado correctamente');
      loadData();
    } catch (error: any) {
      console.error('Error eliminando bloqueo:', error);

      // Manejar diferentes tipos de errores
      if (error.response?.status === 404) {
        toast.error('❌ Bloqueo no encontrado. Es posible que ya haya sido eliminado.');
      } else {
        toast.error('❌ No se pudo eliminar el bloqueo');
      }
    }
  };

  const handleView = (bloqueo: Bloqueo) => {
    setBloqueoToView(bloqueo);
    setShowViewModal(true);
  };

  const handleActivar = async (id: number) => {
    try {
      await apiClient.post(`/api/bloqueos/${id}/activar`, {});
      toast.success('✅ Bloqueo activado correctamente');
      loadData();
    } catch (error) {
      console.error('Error activando bloqueo:', error);
      toast.error('❌ Error al activar el bloqueo');
    }
  };

  const handleCompletar = async (id: number) => {
    try {
      await apiClient.post(`/api/bloqueos/${id}/completar`, {});
      toast.success('✅ Bloqueo completado correctamente');
      loadData();
    } catch (error) {
      console.error('Error completando bloqueo:', error);
      toast.error('❌ Error al completar el bloqueo');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'mantenimiento',
      fecha_inicio: '',
      fecha_fin: '',
      ubicacion_tipo: 'mesa',
      mesa_id: '',
      zona_id: '',
      piso_id: '',
      notas: '',
      motivo: ''
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBloqueo(null);
    resetForm();
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'programado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'activo': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'completado': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'cancelado': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'programado': return '⏰';
      case 'activo': return '🔴';
      case 'completado': return '✅';
      case 'cancelado': return '❌';
      default: return '❓';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'mantenimiento': return '🔧';
      case 'evento': return '🎉';
      case 'reserva_privada': return '🔒';
      case 'otro': return '📝';
      default: return '🚫';
    }
  };

  const getUbicacionTexto = (bloqueo: Bloqueo) => {
    if (bloqueo.mesa_numero) return `Mesa ${bloqueo.mesa_numero}`;
    if (bloqueo.zona_nombre) return `Zona ${bloqueo.zona_nombre}`;
    if (bloqueo.piso_nombre) return `Piso ${bloqueo.piso_nombre}`;
    return 'Ubicación no especificada';
  };

  const filteredBloqueos = bloqueos.filter(bloqueo => {
    if (filtros.estado && bloqueo.estado !== filtros.estado) return false;
    if (filtros.tipo && bloqueo.tipo !== filtros.tipo) return false;
    if (filtros.fecha_desde && bloqueo.fecha_inicio < filtros.fecha_desde) return false;
    if (filtros.fecha_hasta && bloqueo.fecha_inicio > filtros.fecha_hasta) return false;
    
    if (filtros.ubicacion) {
      const ubicacion = getUbicacionTexto(bloqueo).toLowerCase();
      if (!ubicacion.includes(filtros.ubicacion.toLowerCase())) return false;
    }
    
    return true;
  });

  const mesasDisponibles = mesas.filter(mesa => 
    !formData.zona_id || mesa.zona_id === parseInt(formData.zona_id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
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
                Gestión de Bloqueos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administra los bloqueos y mantenimientos del restaurante
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingBloqueo(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo Bloqueo
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los estados</option>
            <option value="programado">Programado</option>
            <option value="activo">Activo</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los tipos</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="evento">Evento</option>
            <option value="reserva_privada">Reserva Privada</option>
            <option value="otro">Otro</option>
          </select>

          <input
            type="text"
            value={filtros.ubicacion}
            onChange={(e) => setFiltros({...filtros, ubicacion: e.target.value})}
            placeholder="Buscar ubicación..."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <input
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) => setFiltros({...filtros, fecha_desde: e.target.value})}
            placeholder="Fecha desde"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <input
            type="date"
            value={filtros.fecha_hasta}
            onChange={(e) => setFiltros({...filtros, fecha_hasta: e.target.value})}
            placeholder="Fecha hasta"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Tabla de Bloqueos */}
      <div className="px-6 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBloqueos.map((bloqueo) => (
                  <tr key={bloqueo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {bloqueo.titulo}
                        </div>
                        {bloqueo.descripcion && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {bloqueo.descripcion}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                        <span>{getTipoIcon(bloqueo.tipo)}</span>
                        {bloqueo.tipo.charAt(0).toUpperCase() + bloqueo.tipo.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(bloqueo.fecha_inicio).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {new Date(bloqueo.fecha_inicio).toLocaleTimeString()} - {new Date(bloqueo.fecha_fin).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                        {bloqueo.piso_nombre && (
                          <>
                            <HomeIcon className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">{bloqueo.piso_nombre}</span>
                          </>
                        )}
                        {bloqueo.zona_nombre && (
                          <>
                            <BuildingOffice2Icon className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{bloqueo.zona_nombre}</span>
                          </>
                        )}
                        {bloqueo.mesa_numero && (
                          <div className="flex items-center gap-1 ml-2">
                            <TableCellsIcon className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Mesa {bloqueo.mesa_numero}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(bloqueo.estado)}`}>
                        <span>{getEstadoIcon(bloqueo.estado)}</span>
                        {bloqueo.estado.charAt(0).toUpperCase() + bloqueo.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {bloqueo.duracion_horas}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(bloqueo)}
                          className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-900/30 transition-all duration-200"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(bloqueo)}
                          className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 transition-all duration-200"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>

                        {bloqueo.estado === 'programado' && (
                          <button
                            onClick={() => handleActivar(bloqueo.id)}
                            className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:text-green-900 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30 transition-all duration-200"
                            title="Activar"
                          >
                            <PlayIcon className="h-4 w-4" />
                          </button>
                        )}

                        {bloqueo.estado === 'activo' && (
                          <button
                            onClick={() => handleCompletar(bloqueo.id)}
                            className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:text-green-900 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30 transition-all duration-200"
                            title="Completar"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(bloqueo)}
                          className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:text-red-900 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 transition-all duration-200"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contenedor principal de modales con AnimatePresence */}
      <AnimatePresence>
        {/* Modal de Crear/Editar Bloqueo */}
      {showModal && (
        <motion.div
          key="edit-create-modal"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => {
            handleCloseModal();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingBloqueo ? 'Editar Bloqueo' : 'Nuevo Bloqueo'}
            </h2>
            
            <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo *
                  </label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="evento">Evento</option>
                    <option value="reserva_privada">Reserva Privada</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha y Hora de Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.fecha_inicio}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha y Hora de Fin *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.fecha_fin}
                    min={formData.fecha_inicio || new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Ubicación
                  </label>
                  <select
                    value={formData.ubicacion_tipo}
                    onChange={(e) => {
                      const newTipo = e.target.value;
                      // Solo resetear los IDs si no estamos editando
                      if (!editingBloqueo) {
                        setFormData({...formData, ubicacion_tipo: newTipo, mesa_id: '', zona_id: '', piso_id: ''});
                      } else {
                        setFormData({...formData, ubicacion_tipo: newTipo});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="mesa">Mesa Específica</option>
                    <option value="zona">Zona Completa</option>
                    <option value="piso">Piso Completo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ubicación
                  </label>
                  {formData.ubicacion_tipo === 'mesa' && (
                    <motion.div key="mesa-selection">
                      <select
                        value={formData.mesa_id}
                        onChange={(e) => setFormData({...formData, mesa_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Seleccionar mesa</option>
                        {mesas.map(mesa => (
                          <option key={mesa.id} value={mesa.id}>
                            Mesa {mesa.numero} - {zonas.find(z => z.id === mesa.zona_id)?.nombre || 'Sin zona'}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {formData.ubicacion_tipo === 'zona' && (
                    <motion.div key="zona-selection">
                      <select
                        value={formData.zona_id}
                        onChange={(e) => setFormData({...formData, zona_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Seleccionar zona</option>
                        {zonas.map(zona => (
                          <option key={zona.id} value={zona.id}>{zona.nombre}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {formData.ubicacion_tipo === 'piso' && (
                    <motion.div key="piso-selection">
                      <select
                        value={formData.piso_id}
                        onChange={(e) => setFormData({...formData, piso_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Seleccionar piso</option>
                        {pisos.map(piso => (
                          <option key={piso.id} value={piso.id}>{piso.nombre}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </div>
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
                  Motivo
                </label>
                <input
                  type="text"
                  value={formData.motivo}
                  onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({...formData, notas: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {editingBloqueo ? 'Actualizar' : 'Crear'} Bloqueo
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de Cancelación */}
      {showCancelModal && (
        <motion.div key="cancel-modal">
          <ModalCancelacion
            isOpen={showCancelModal}
            onClose={() => {
              setShowCancelModal(false);
              setBloqueoToCancel(null);
            }}
            onConfirm={handleConfirmCancelacion}
            reservaInfo={bloqueoToCancel ? {
              cliente_nombre: bloqueoToCancel.titulo,
              fecha_reserva: bloqueoToCancel.fecha_inicio.split('T')[0],
              hora_reserva: new Date(bloqueoToCancel.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            } : undefined}
          />
        </motion.div>
      )}

      {/* Modal de Ver Bloqueo */}
      {showViewModal && (
        <motion.div key="view-modal">
          <ModalVerBloqueo
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false);
              setBloqueoToView(null);
            }}
            bloqueo={bloqueoToView}
          />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default BloqueosPage;