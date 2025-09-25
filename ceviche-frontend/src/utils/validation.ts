import { BloqueoFormData } from '../types/Bloqueo'; // Assuming you have this type defined

interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export class ValidationService {
  static validateBloqueo(formData: BloqueoFormData): ValidationResult {
    const errors: { [key: string]: string } = {};

    if (!formData.titulo.trim()) {
      errors.titulo = 'El título es requerido.';
    }
    if (!formData.tipo) {
      errors.tipo = 'El tipo es requerido.';
    }
    if (!formData.fecha_inicio) {
      errors.fecha_inicio = 'La fecha de inicio es requerida.';
    }
    if (!formData.fecha_fin) {
      errors.fecha_fin = 'La fecha de fin es requerida.';
    }

    const fechaInicio = new Date(formData.fecha_inicio);
    const fechaFin = new Date(formData.fecha_fin);
    const ahora = new Date();

    if (fechaInicio.toString() === 'Invalid Date') {
      errors.fecha_inicio = 'Formato de fecha de inicio inválido.';
    }
    if (fechaFin.toString() === 'Invalid Date') {
      errors.fecha_fin = 'Formato de fecha de fin inválido.';
    }

    if (!errors.fecha_inicio && fechaInicio < ahora) {
      errors.fecha_inicio = 'No se pueden crear bloqueos en fechas pasadas.';
    }

    if (!errors.fecha_inicio && !errors.fecha_fin && fechaInicio >= fechaFin) {
      errors.fecha_fin = 'La fecha de inicio debe ser anterior a la fecha de fin.';
    }

    if (!formData.mesa_id && !formData.zona_id && !formData.piso_id) {
      errors.ubicacion = 'Debe seleccionar al menos una ubicación (mesa, zona o piso).';
    } else {
      if (formData.ubicacion_tipo === 'mesa' && !formData.mesa_id) {
        errors.mesa_id = 'Debe seleccionar una mesa.';
      }
      if (formData.ubicacion_tipo === 'zona' && !formData.zona_id) {
        errors.zona_id = 'Debe seleccionar una zona.';
      }
      if (formData.ubicacion_tipo === 'piso' && !formData.piso_id) {
        errors.piso_id = 'Debe seleccionar un piso.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateReserva(formData: any): ValidationResult {
    const errors: { [key: string]: string } = {};

    if (!formData.cliente_nombre?.trim()) {
      errors.cliente_nombre = 'El nombre del cliente es requerido.';
    }
    if (!formData.cliente_telefono?.trim()) {
      errors.cliente_telefono = 'El teléfono del cliente es requerido.';
    }
    if (!formData.fecha_reserva) {
      errors.fecha_reserva = 'La fecha de reserva es requerida.';
    }
    if (!formData.hora_reserva) {
      errors.hora_reserva = 'La hora de reserva es requerida.';
    }
    if (!formData.numero_personas || formData.numero_personas <= 0) {
      errors.numero_personas = 'El número de personas debe ser mayor a 0.';
    }

    // Validar que al menos una ubicación esté seleccionada (zona_id o mesa_id)
    if (!formData.zona_id && !formData.mesa_id) {
      errors.ubicacion = 'Debe seleccionar una zona o una mesa específica.';
    }

    // Validar fechas
    if (formData.fecha_reserva) {
      const fechaReserva = new Date(formData.fecha_reserva);
      const ahora = new Date();

      if (fechaReserva.toString() === 'Invalid Date') {
        errors.fecha_reserva = 'Formato de fecha inválido.';
      } else if (fechaReserva < ahora) {
        errors.fecha_reserva = 'No se pueden hacer reservas en fechas pasadas.';
      }
    }

    // Validar duración estimada
    if (formData.duracion_estimada && formData.duracion_estimada <= 0) {
      errors.duracion_estimada = 'La duración debe ser mayor a 0 minutos.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static displayValidationErrors(errors: { [key: string]: string }): string[] {
    return Object.values(errors);
  }
}