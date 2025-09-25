import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface Reserva {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  fecha_reserva: string;
  hora_reserva: string;
  numero_personas: number;
  estado: string;
  zona_nombre?: string;
  mesa_numero?: string;
}

interface Bloqueo {
  id: number;
  titulo: string;
  tipo: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  zona_nombre?: string;
  mesa_numero?: string;
  piso_nombre?: string;
}

interface CalendarEvent {
  id: number;
  type: 'reserva' | 'bloqueo';
  title: string;
  start: Date;
  end: Date;
  data: Reserva | Bloqueo;
  color: string;
}

const CalendarioPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      console.log('🔍 Cargando eventos del calendario...');
      console.log('📅 Fecha inicio:', startDate.toISOString());
      console.log('📅 Fecha fin:', endDate.toISOString());

      const [reservasRes, bloqueosRes] = await Promise.all([
        apiClient.getPublic(`/api/reservas/public?fecha_desde=${startDate.toISOString()}&fecha_hasta=${endDate.toISOString()}`),
        apiClient.getPublic(`/api/bloqueos/public?fecha_inicio=${startDate.toISOString()}&fecha_fin=${endDate.toISOString()}`)
      ]);

      console.log('📊 Respuesta reservas completa:', reservasRes);
      console.log('📊 Respuesta bloqueos completa:', bloqueosRes);
      console.log('📊 Tipo de respuesta reservas:', typeof reservasRes);
      console.log('📊 Tipo de respuesta bloqueos:', typeof bloqueosRes);

      const reservas: Reserva[] = reservasRes.reservas || [];
      const bloqueos: Bloqueo[] = bloqueosRes.data?.bloqueos || bloqueosRes.bloqueos || [];

      console.log('📋 Reservas procesadas:', reservas.length);
      console.log('📋 Bloqueos procesados:', bloqueos.length);
      console.log('📋 Primera reserva:', reservas[0]);
      console.log('📋 Primer bloqueo:', bloqueos[0]);

      const calendarEvents: CalendarEvent[] = [];

      // Procesar reservas
      reservas.forEach(reserva => {
        const startDate = new Date(reserva.fecha_reserva);
        const [hours, minutes] = reserva.hora_reserva.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes));
        
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 2); // Duración por defecto 2 horas

        calendarEvents.push({
          id: reserva.id,
          type: 'reserva',
          title: `${reserva.cliente_nombre} (${reserva.numero_personas} personas)`,
          start: startDate,
          end: endDate,
          data: reserva,
          color: getReservaColor(reserva.estado)
        });
      });

      // Procesar bloqueos
      bloqueos.forEach(bloqueo => {
        const startDate = new Date(bloqueo.fecha_inicio);
        const endDate = new Date(bloqueo.fecha_fin);

        calendarEvents.push({
          id: bloqueo.id,
          type: 'bloqueo',
          title: bloqueo.titulo,
          start: startDate,
          end: endDate,
          data: bloqueo,
          color: getBloqueoColor(bloqueo.estado, bloqueo.tipo)
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      toast.error('Error cargando eventos del calendario');
    } finally {
      setLoading(false);
    }
  };

  const getReservaColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return '#FCD34D'; // yellow-300
      case 'confirmada': return '#10B981'; // emerald-500
      case 'cancelada': return '#EF4444'; // red-500
      case 'completada': return '#3B82F6'; // blue-500
      case 'no_show': return '#6B7280'; // gray-500
      default: return '#6B7280';
    }
  };

  const getBloqueoColor = (estado: string, tipo: string) => {
    if (estado === 'activo') return '#EF4444'; // red-500
    if (estado === 'programado') return '#F59E0B'; // amber-500
    
    switch (tipo) {
      case 'mantenimiento': return '#8B5CF6'; // violet-500
      case 'evento_privado': return '#EC4899'; // pink-500
      case 'limpieza_deep': return '#06B6D4'; // cyan-500
      case 'reparacion': return '#F97316'; // orange-500
      default: return '#6B7280'; // gray-500
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevMonth = new Date(year, month - 1, lastDay.getDate() - i);
      days.push({ date: prevMonth, isCurrentMonth: false });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      days.push({ date: currentDay, isCurrentMonth: true });
    }

    // Días del mes siguiente para completar la semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = new Date(year, month + 1, day);
      days.push({ date: nextMonth, isCurrentMonth: false });
    }

    return days;
  };

  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      return (event.start >= dayStart && event.start <= dayEnd) ||
             (event.end >= dayStart && event.end <= dayEnd) ||
             (event.start <= dayStart && event.end >= dayEnd);
    });
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
                Calendario de Reservas y Bloqueos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Vista mensual de eventos del restaurante
              </p>
            </div>
            
            {/* Navegación del calendario */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Reservas Confirmadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FCD34D' }}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Reservas Pendientes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Bloqueos Activos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Bloqueos Programados</span>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="px-6 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7">
            {getDaysInMonth(currentDate).map((day, index) => {
              const dayEvents = getEventsForDay(day.date);
              const isToday = day.date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-r border-b border-gray-200 dark:border-gray-700 p-2 ${
                    day.isCurrentMonth 
                      ? 'bg-white dark:bg-gray-800' 
                      : 'bg-gray-50 dark:bg-gray-900'
                  } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-400 dark:text-gray-500'
                  } ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    {day.date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate"
                        style={{ backgroundColor: event.color, color: 'white' }}
                        title={event.title}
                      >
                        {event.type === 'reserva' ? '📅' : '🚫'} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{dayEvents.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de Detalles del Evento */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedEvent.type === 'reserva' ? 'Detalles de Reserva' : 'Detalles de Bloqueo'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {selectedEvent.type === 'reserva' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Cliente:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedEvent.data as Reserva).cliente_nombre}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Hora:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Ubicación:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedEvent.data as Reserva).zona_nombre}
                    {(selectedEvent.data as Reserva).mesa_numero && 
                      ` - Mesa ${(selectedEvent.data as Reserva).mesa_numero}`
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Personas:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedEvent.data as Reserva).numero_personas}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Estado:</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    (selectedEvent.data as Reserva).estado === 'confirmada' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : (selectedEvent.data as Reserva).estado === 'pendiente'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                  }`}>
                    {(selectedEvent.data as Reserva).estado.charAt(0).toUpperCase() + 
                     (selectedEvent.data as Reserva).estado.slice(1)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Título:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedEvent.data as Bloqueo).titulo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Horario:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Ubicación:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedEvent.data as Bloqueo).piso_nombre || 
                     (selectedEvent.data as Bloqueo).zona_nombre || 
                     (selectedEvent.data as Bloqueo).mesa_numero ? 
                     `Mesa ${(selectedEvent.data as Bloqueo).mesa_numero}` : 
                     'Ubicación no especificada'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tipo:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedEvent.data as Bloqueo).tipo.charAt(0).toUpperCase() + 
                     (selectedEvent.data as Bloqueo).tipo.slice(1).replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Estado:</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    (selectedEvent.data as Bloqueo).estado === 'activo' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                      : (selectedEvent.data as Bloqueo).estado === 'programado'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                  }`}>
                    {(selectedEvent.data as Bloqueo).estado.charAt(0).toUpperCase() + 
                     (selectedEvent.data as Bloqueo).estado.slice(1)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioPage;

