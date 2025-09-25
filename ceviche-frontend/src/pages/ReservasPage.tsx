import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { ValidationService } from '../utils/validation';
import { ErrorHandler } from '../utils/errorHandler';
import { ModalCancelacion } from '../components/ModalCancelacion';
import { ModalVerReserva } from '../components/ModalVerReserva';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  BuildingOffice2Icon,
  TableCellsIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

interface Reserva {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email?: string;
  fecha_reserva: string;
  hora_reserva: string;
  duracion_estimada: number;
  numero_personas: number;
  estado: string;
  tipo_reserva: string;
  mesa_id?: number;
  zona_id: number;
  notas?: string;
  requerimientos_especiales?: string;
  mesa_numero?: string;
  zona_nombre?: string;
  usuario_nombre?: string;
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

const ReservasPage: React.FC = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reservaToCancel, setReservaToCancel] = useState<Reserva | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [reservaToView, setReservaToView] = useState<Reserva | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reservaToDelete, setReservaToDelete] = useState<Reserva | null>(null);
  const [filtros, setFiltros] = useState({
    estado: '',
    zona_id: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    fecha_reserva: '',
    hora_reserva: '',
    duracion_estimada: 120,
    numero_personas: 1,
    tipo_reserva: 'normal',
    zona_id: '',
    mesa_id: '',
    notas: '',
    requerimientos_especiales: ''
  });
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [reservasResponse, zonasResponse, mesasResponse] = await Promise.all([
        apiClient.getPublic('/api/reservas/public'),
        apiClient.getPublic('/api/local/zonas/public'),
        apiClient.getPublic('/api/local/mesas/public')
      ]);

      const reservasData = ErrorHandler.processApiResponse(reservasResponse);
      const zonasData = ErrorHandler.processApiResponse(zonasResponse);
      const mesasData = ErrorHandler.processApiResponse(mesasResponse);

      if (ErrorHandler.isSuccessResponse(reservasData)) {
        // Extraer datos de reservas
        let reservasArray = [];

        if (reservasData && reservasData.reservas && Array.isArray(reservasData.reservas)) {
          reservasArray = reservasData.reservas;
        }
        // Fallback: buscar en data.reservas si está anidado
        else if (reservasData && reservasData.data && reservasData.data.reservas && Array.isArray(reservasData.data.reservas)) {
          reservasArray = reservasData.data.reservas;
        }
        // Fallback: buscar en cualquier propiedad que contenga arrays
        else {
          for (const [key, value] of Object.entries(reservasData)) {
            if (Array.isArray(value) && value.length > 0) {
              if (value.length > 0 && typeof value[0] === 'object' && 'cliente_nombre' in value[0]) {
                reservasArray = value;
                break;
              }
            } else if (value && typeof value === 'object' && value.reservas && Array.isArray(value.reservas)) {
              reservasArray = value.reservas;
              break;
            }
          }
        }

        setReservas(reservasArray);
      } else {
        throw new Error(ErrorHandler.getFriendlyErrorMessage(reservasData));
      }

      if (ErrorHandler.isSuccessResponse(zonasData)) {
        const zonasArray = Array.isArray(zonasData.data) ? zonasData.data :
                          Array.isArray(zonasData.zonas) ? zonasData.zonas :
                          Array.isArray(zonasData) ? zonasData : [];
        setZonas(zonasArray);
      } else {
        throw new Error(ErrorHandler.getFriendlyErrorMessage(zonasData));
      }

      if (ErrorHandler.isSuccessResponse(mesasData)) {
        const mesasArray = Array.isArray(mesasData.data) ? mesasData.data :
                          Array.isArray(mesasData.mesas) ? mesasData.mesas :
                          Array.isArray(mesasData) ? mesasData : [];
        setMesas(mesasArray);
      } else {
        throw new Error(ErrorHandler.getFriendlyErrorMessage(mesasData));
      }
    } catch (error: any) {
      ErrorHandler.logError('cargar datos de reservas', error);
      const errorMessage = ErrorHandler.showErrorNotification(error, 'cargar datos');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        zona_id: formData.zona_id ? parseInt(formData.zona_id) : undefined,
        mesa_id: formData.mesa_id ? parseInt(formData.mesa_id) : undefined,
        duracion_estimada: parseInt(formData.duracion_estimada?.toString() || '120'),
        numero_personas: parseInt(formData.numero_personas?.toString() || '1')
      };

      // Validar datos usando el sistema robusto con datos procesados
      const validation = ValidationService.validateReserva(data);
      if (!validation.isValid) {
        const errorMessages = ValidationService.displayValidationErrors(validation.errors);
        errorMessages.forEach(message => toast.error(`❌ ${message}`));
        return;
      }

      let response;
      if (editingReserva) {
        response = await apiClient.put(`/api/reservas/${editingReserva.id}`, data);
        const apiResponse = ErrorHandler.processApiResponse(response);

        if (ErrorHandler.isSuccessResponse(apiResponse)) {
          toast.success('Reserva actualizada correctamente');
          setShowModal(false);
          setEditingReserva(null);
          resetForm();
          loadData();
        } else {
          throw new Error(ErrorHandler.getFriendlyErrorMessage(apiResponse));
        }
      } else {
        response = await apiClient.postPublic('/api/reservas/public', data);
        const apiResponse = ErrorHandler.processApiResponse(response);
        
        if (ErrorHandler.isSuccessResponse(apiResponse)) {
          toast.success('Reserva creada correctamente');
          setShowModal(false);
          setEditingReserva(null);
          resetForm();
          await loadData();
        } else {
          throw new Error(ErrorHandler.getFriendlyErrorMessage(apiResponse));
        }
      }
    } catch (error: any) {
      ErrorHandler.logError('guardar reserva', error, { formData, editingReserva });
      const errorMessage = ErrorHandler.showErrorNotification(error, 'guardar reserva');
      toast.error(errorMessage);
    }
  };

  const handleEdit = (reserva: Reserva) => {
    setEditingReserva(reserva);
    
    const newFormData = {
      cliente_nombre: reserva.cliente_nombre,
      cliente_telefono: reserva.cliente_telefono,
      cliente_email: reserva.cliente_email || '',
      fecha_reserva: reserva.fecha_reserva.split('T')[0],
      hora_reserva: reserva.hora_reserva,
      duracion_estimada: reserva.duracion_estimada,
      numero_personas: reserva.numero_personas,
      tipo_reserva: reserva.tipo_reserva,
      zona_id: reserva.zona_id?.toString() || '',
      mesa_id: reserva.mesa_id?.toString() || '',
      notas: reserva.notas || '',
      requerimientos_especiales: reserva.requerimientos_especiales || ''
    };
    
    console.log('🔍 Datos del formulario a cargar:', newFormData);
    setFormData(newFormData);
    setFormKey(prev => prev + 1); // Forzar re-renderización
    setShowModal(true);
  };

  const handleDelete = (reserva: Reserva) => {
    setReservaToDelete(reserva);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reservaToDelete || !reservaToDelete.id) {
      toast.error('❌ Reserva inválida para eliminar');
      return;
    }

    try {
      await apiClient.delPublic(`/api/reservas/public/${reservaToDelete.id}`);
      toast.success('✅ Reserva eliminada correctamente');
      setShowDeleteModal(false);
      setReservaToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error eliminando reserva:', error);
      toast.error('❌ No se pudo eliminar la reserva');
    }
  };

  const handleConfirmar = async (id: number) => {
    try {
      await apiClient.post(`/api/reservas/${id}/confirmar`, {});
      toast.success('Reserva confirmada exitosamente');
      loadData();
    } catch (error) {
      console.error('Error confirmando reserva:', error);
      toast.error('Error confirmando reserva');
    }
  };

  const handleCancelar = (reserva: Reserva) => {
    setReservaToCancel(reserva);
    setShowCancelModal(true);
  };

  const handleConfirmCancelacion = async (motivo: string) => {
    if (!reservaToCancel || !reservaToCancel.id) {
      toast.error('❌ Reserva inválida para cancelar');
      return;
    }

    try {
      await apiClient.post(`/api/reservas/${reservaToCancel.id}/cancelar`, { motivo });
      toast.success('✅ Reserva cancelada correctamente');
      setShowCancelModal(false);
      setReservaToCancel(null);
      loadData();
    } catch (error: any) {
      console.error('Error cancelando reserva:', error);
      toast.error('❌ No se pudo cancelar la reserva');
    }
  };

  const handleView = (reserva: Reserva) => {
    setReservaToView(reserva);
    setShowViewModal(true);
  };

  const resetForm = () => {
    console.log('🔄 Reseteando formulario');
    setFormData({
      cliente_nombre: '',
      cliente_telefono: '',
      cliente_email: '',
      fecha_reserva: '',
      hora_reserva: '',
      duracion_estimada: 120,
      numero_personas: 1,
      tipo_reserva: 'normal',
      zona_id: '',
      mesa_id: '',
      notas: '',
      requerimientos_especiales: ''
    });
    setFormKey(prev => prev + 1); // Forzar re-renderización
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'confirmada': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'completada': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'no_show': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return '⏳';
      case 'confirmada': return '✅';
      case 'cancelada': return '❌';
      case 'completada': return '🎉';
      case 'no_show': return '👻';
      default: return '❓';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'normal': return '🍽️';
      case 'especial': return '⭐';
      case 'corporativa': return '🏢';
      case 'celebracion': return '🎂';
      default: return '📅';
    }
  };

  const filteredReservas = Array.isArray(reservas) ? reservas.filter(reserva => {
    if (filtros.estado && reserva.estado !== filtros.estado) return false;
    if (filtros.zona_id && parseInt(filtros.zona_id) && reserva.zona_id !== parseInt(filtros.zona_id)) return false;

    // Comparación de fechas correcta usando objetos Date
    if (filtros.fecha_desde) {
      const reservaDate = new Date(reserva.fecha_reserva);
      const filtroDate = new Date(filtros.fecha_desde);
      if (reservaDate < filtroDate) return false;
    }

    if (filtros.fecha_hasta) {
      const reservaDate = new Date(reserva.fecha_reserva);
      const filtroDate = new Date(filtros.fecha_hasta);
      if (reservaDate > filtroDate) return false;
    }

    return true;
  }) : [];

  const mesasDisponibles = Array.isArray(mesas) ? mesas.filter(mesa => 
    !formData.zona_id || mesa.zona_id === parseInt(formData.zona_id)
  ) : [];

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
                Gestión de Reservas
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administra las reservas del restaurante
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  loadData();
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recargar
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingReserva(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Nueva Reserva
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
              <option value="completada">Completada</option>
              <option value="no_show">No Show</option>
            </select>

            <select
              value={filtros.zona_id}
              onChange={(e) => setFiltros({...filtros, zona_id: e.target.value})}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todas las zonas</option>
              {zonas.map(zona => (
                <option key={zona.id} value={zona.id}>{zona.nombre}</option>
              ))}
            </select>

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

        {/* Tabla de Reservas */}
        <div className="px-6 py-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha y Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Personas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Zona/Mesa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredReservas.map((reserva) => (
                      <tr key={reserva.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {reserva.cliente_nombre}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <PhoneIcon className="h-3 w-3" />
                              {reserva.cliente_telefono}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {new Date(reserva.fecha_reserva).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {reserva.hora_reserva}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {reserva.numero_personas}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                            <BuildingOffice2Icon className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{reserva.zona_nombre}</span>
                          </div>
                          {reserva.mesa_numero && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                              <TableCellsIcon className="h-3 w-3 text-gray-400" />
                              <span>Mesa {reserva.mesa_numero}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(reserva.estado)}`}>
                            <span>{getEstadoIcon(reserva.estado)}</span>
                            {reserva.estado.charAt(0).toUpperCase() + reserva.estado.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <span className="flex items-center gap-1">
                            <span>{getTipoIcon(reserva.tipo_reserva)}</span>
                            {reserva.tipo_reserva.charAt(0).toUpperCase() + reserva.tipo_reserva.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(reserva)}
                              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-900/30 transition-all duration-200"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(reserva)}
                              className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 transition-all duration-200"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>

                        {reserva.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => handleConfirmar(reserva.id)}
                              className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:text-green-900 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30 transition-all duration-200"
                              title="Confirmar"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelar(reserva)}
                              className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:text-red-900 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 transition-all duration-200"
                              title="Cancelar"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}

                            <button
                              onClick={() => handleDelete(reserva)}
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

              {filteredReservas.length === 0 && reservas.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay reservas
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    No se encontraron reservas. Crea una nueva reserva para empezar.
                  </p>
                </div>
              )}

              {filteredReservas.length === 0 && reservas.length > 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No se encontraron reservas
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay reservas que coincidan con los filtros aplicados.
                  </p>
                  <button
                    onClick={() => setFiltros({ estado: '', zona_id: '', fecha_desde: '', fecha_hasta: '' })}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
        </div>

        {/* Contenedor principal de modales con AnimatePresence */}
        <AnimatePresence>
        {/* Modal de Crear/Editar Reserva */}
          {showModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => {
                setShowModal(false);
                setEditingReserva(null);
                resetForm();
              }}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingReserva ? 'Editar Reserva' : 'Nueva Reserva'}
                </h2>
                
                <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre del Cliente *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.cliente_nombre}
                        onChange={(e) => {
                          console.log('🔍 Cambiando cliente_nombre:', e.target.value);
                          setFormData({...formData, cliente_nombre: e.target.value});
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.cliente_telefono}
                        onChange={(e) => setFormData({...formData, cliente_telefono: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.cliente_email}
                        onChange={(e) => setFormData({...formData, cliente_email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Reserva *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.fecha_reserva}
                        onChange={(e) => setFormData({...formData, fecha_reserva: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hora de Reserva *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.hora_reserva}
                        onChange={(e) => setFormData({...formData, hora_reserva: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número de Personas *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.numero_personas}
                        onChange={(e) => setFormData({...formData, numero_personas: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duración Estimada (minutos)
                      </label>
                      <input
                        type="number"
                        min="30"
                        step="30"
                        value={formData.duracion_estimada}
                        onChange={(e) => setFormData({...formData, duracion_estimada: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Reserva
                      </label>
                      <select
                        value={formData.tipo_reserva}
                        onChange={(e) => setFormData({...formData, tipo_reserva: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="normal">Normal</option>
                        <option value="especial">Especial</option>
                        <option value="corporativa">Corporativa</option>
                        <option value="celebracion">Celebración</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Zona *
                      </label>
                      <select
                        required
                        value={formData.zona_id}
                        onChange={(e) => {
                          console.log('🔍 Cambiando zona_id:', e.target.value);
                          setFormData({...formData, zona_id: e.target.value, mesa_id: ''});
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Seleccionar zona *</option>
                        {zonas.map(zona => (
                          <option key={zona.id} value={zona.id}>{zona.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mesa Específica (Opcional)
                      </label>
                      <select
                        value={formData.mesa_id}
                        onChange={(e) => setFormData({...formData, mesa_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Sin mesa específica</option>
                        {mesasDisponibles.map(mesa => (
                          <option key={mesa.id} value={mesa.id}>
                            Mesa {mesa.numero} (Capacidad: {mesa.capacidad})
                          </option>
                        ))}
                      </select>
                    </div>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Requerimientos Especiales
                    </label>
                    <textarea
                      value={formData.requerimientos_especiales}
                      onChange={(e) => setFormData({...formData, requerimientos_especiales: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingReserva(null);
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
                      {editingReserva ? 'Actualizar' : 'Crear'} Reserva
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de Cancelación */}
          {showCancelModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => {
                setShowCancelModal(false);
                setReservaToCancel(null);
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
              >
                <ModalCancelacion
                  isOpen={showCancelModal}
                  onClose={() => {
                    setShowCancelModal(false);
                    setReservaToCancel(null);
                  }}
                  onConfirm={handleConfirmCancelacion}
                  reservaInfo={reservaToCancel ? {
                    cliente_nombre: reservaToCancel.cliente_nombre,
                    fecha_reserva: reservaToCancel.fecha_reserva,
                    hora_reserva: reservaToCancel.hora_reserva
                  } : undefined}
                />
              </div>
            </div>
          )}


          {/* Modal de Ver Reserva */}
          {showViewModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => {
                setShowViewModal(false);
                setReservaToView(null);
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
              >
                <ModalVerReserva
                  isOpen={showViewModal}
                  onClose={() => {
                    setShowViewModal(false);
                    setReservaToView(null);
                  }}
                  reserva={{
                    ...reservaToView,
                    mesa_numero: reservaToView?.mesa_numero ? Number(reservaToView.mesa_numero) : undefined
                  }}
                />
              </div>
            </div>
          )}

          {/* Modal de Confirmación de Eliminación */}
          {showDeleteModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 cursor-pointer"
              onClick={() => {
                setShowDeleteModal(false);
                setReservaToDelete(null);
              }}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Confirmar eliminación
                    </h3>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    ¿Estás seguro de que deseas eliminar la reserva de <strong>{reservaToDelete?.cliente_nombre}</strong>?
                    Esta acción no se puede deshacer.
                  </p>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setReservaToDelete(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
    </div>

    </div>
  );
};

export default ReservasPage;
