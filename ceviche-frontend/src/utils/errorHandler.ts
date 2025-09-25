/**
 * Sistema centralizado de manejo de errores para el frontend
 */

import { toast } from 'react-hot-toast';

export interface ApiError {
  success: false;
  error: string;
  details?: string;
  field?: string;
  code?: string;
  timestamp: string;
  message?: string; // Agregado para compatibilidad
}

export interface ApiSuccess<T = any> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
  [key: string]: any; // Agregado para flexibilidad
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError | any; // Agregado any para flexibilidad

export class ErrorHandler {
  /**
   * Procesar respuesta de la API y determinar si es exitosa
   */
  static processApiResponse<T>(response: any): ApiResponse<T> {
    console.log('🔍 ErrorHandler.processApiResponse - Input:', response);
    console.log('🔍 Tipo de response:', typeof response);
    console.log('🔍 Tiene success:', 'success' in response);
    console.log('🔍 Valor de success:', response?.success);

    // Si la respuesta ya tiene el formato correcto (ApiResponse estándar)
    if (typeof response === 'object' && 'success' in response && 'data' in response) {
      console.log('✅ Entrando en condición 1: respuesta ya tiene formato ApiResponse estándar');
      return response as ApiResponse<T>;
    }

    // Si es una respuesta exitosa con estructura {categorias: [...], success: true, total: 10}
    if (typeof response === 'object' && 'success' in response && response.success === true && 'categorias' in response) {
      console.log('✅ Entrando en condición 2: respuesta exitosa con estructura de categorías');
      return {
        success: true,
        data: response as T,
        timestamp: new Date().toISOString()
      };
    }

    // Si es una respuesta exitosa sin formato estándar (como la que retorna /categoria/public)
    if (response && !response.error && !response.success) {
      console.log('✅ Entrando en condición 3: respuesta exitosa sin formato estándar');
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      };
    }

    // Si es una respuesta exitosa sin formato estándar
    if (response && !response.error) {
      console.log('✅ Entrando en condición 4: respuesta exitosa sin formato estándar');
      return {
        success: true,
        data: response.data || response,
        timestamp: new Date().toISOString()
      };
    }

    // Si es un error, asegurar que tenga el formato correcto
    console.log('❌ Entrando en condición de error');
    const errorResponse: ApiError = {
      success: false,
      error: response.error || response.message || 'Error desconocido',
      details: response.details,
      field: response.field,
      code: response.code,
      timestamp: response.timestamp || new Date().toISOString()
    };

    return errorResponse;
  }

  /**
   * Manejar errores de red
   */
  static handleNetworkError(error: any): string {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return 'Error de conexión. Verifique su conexión a internet.';
    }
    
    if (error.name === 'AbortError') {
      return 'La solicitud fue cancelada.';
    }

    return 'Error de red. Intente nuevamente.';
  }

  /**
   * Manejar errores HTTP
   */
  static handleHttpError(status: number, error: any): string {
    switch (status) {
      case 400:
        return error.details || error.error || 'Datos inválidos enviados.';
      case 401:
        return 'No autorizado. Inicie sesión nuevamente.';
      case 403:
        return 'No tiene permisos para realizar esta acción.';
      case 404:
        return 'Recurso no encontrado.';
      case 409:
        return error.details || 'Conflicto con datos existentes.';
      case 422:
        return error.details || 'Datos de validación incorrectos.';
      case 500:
        return 'Error interno del servidor. Intente más tarde.';
      case 503:
        return 'Servicio no disponible. Intente más tarde.';
      default:
        return error.error || error.message || 'Error inesperado.';
    }
  }

  /**
   * Obtener mensaje de error amigable para el usuario
   */
  static getFriendlyErrorMessage(error: any): string {
    // Si es un error de integridad (no se puede eliminar por dependencias)
    if (error.code === 'INTEGRITY_ERROR') {
      return error.error || 'No se puede eliminar el elemento porque tiene dependencias asociadas.';
    }

    // Si es un error de validación con campo específico
    if (error.field && error.message) {
      return `${error.field}: ${error.message}`;
    }

    // Si es un error de negocio
    if (error.code === 'BUSINESS_LOGIC_ERROR') {
      return error.details || error.error || 'Error de lógica de negocio.';
    }

    // Si es un error de validación
    if (error.code === 'VALIDATION_ERROR') {
      return error.details || error.error || 'Error de validación.';
    }

    // Si es un error de permisos
    if (error.code === 'PERMISSION_DENIED') {
      return 'No tiene permisos para realizar esta acción.';
    }

    // Si es un error de entidad no encontrada
    if (error.code === 'NOT_FOUND') {
      return error.error || 'Recurso no encontrado.';
    }

    // Si es un error de integridad
    if (error.code === 'INTEGRITY_ERROR') {
      return error.details || error.error || 'Error de integridad de datos.';
    }

    // Si es un error de datos
    if (error.code === 'DATA_ERROR') {
      return error.details || error.error || 'Error en los datos proporcionados.';
    }

    // Error genérico
    return error.error || error.message || 'Error inesperado.';
  }

  /**
   * Log de errores para debugging
   */
  static logError(context: string, error: any, additionalInfo?: any): void {
    console.group(`🚨 Error en ${context}`);
    console.error('Error:', error);
    if (additionalInfo) {
      console.error('Información adicional:', additionalInfo);
    }
    console.error('Stack trace:', error.stack);
    console.groupEnd();
  }

  /**
   * Mostrar notificación de error
   */
  static showErrorNotification(error: any, context: string = 'operación'): void {
    const message = this.getFriendlyErrorMessage(error);
    this.logError(context, error);
    toast.error(message, {
      duration: 6000,
      style: {
        background: '#EF4444',
        color: '#fff',
        borderRadius: '8px',
        fontWeight: '500'
      }
    });
  }

  /**
   * Mostrar notificación de éxito
   */
  static showSuccessNotification(message: string): void {
    toast.success(message, {
      duration: 4000,
      style: {
        background: '#10B981',
        color: '#fff',
        borderRadius: '8px',
        fontWeight: '500'
      }
    });
  }

  /**
   * Validar si una respuesta es exitosa
   */
  static isSuccessResponse(response: any): response is ApiSuccess {
    return response && response.success === true;
  }

  /**
   * Validar si una respuesta es un error
   */
  static isErrorResponse(response: any): response is ApiError {
    return response && response.success === false;
  }

  /**
   * Extraer datos de una respuesta exitosa
   */
  static extractData<T>(response: ApiSuccess<T>): T | undefined {
    return response.data;
  }

  /**
   * Extraer mensaje de una respuesta exitosa
   */
  static extractMessage(response: ApiSuccess): string | undefined {
    return response.message;
  }

  /**
   * Manejar errores de API de forma centralizada
   */
  static handleApiError(error: any, context: string = 'operación'): void {
    console.error(`🚨 Error en ${context}:`, error);

    // Si es un error de red
    if (!navigator.onLine) {
      this.showErrorNotification({
        error: 'Sin conexión a internet'
      }, context);
      return;
    }

    // Si es un error HTTP
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 404) {
        this.showErrorNotification({
          error: 'Recurso no encontrado'
        }, context);
      } else if (status === 401) {
        this.showErrorNotification({
          error: 'No autorizado. Inicie sesión nuevamente.'
        }, context);
      } else if (status === 403) {
        this.showErrorNotification({
          error: 'No tiene permisos para realizar esta acción.'
        }, context);
      } else if (status === 500) {
        this.showErrorNotification({
          error: 'Error interno del servidor. Intente más tarde.'
        }, context);
      } else {
        this.showErrorNotification(errorData || error, context);
      }
    } else if (error.request) {
      // Error de red
      this.showErrorNotification({
        error: 'Error de conexión. Verifique su conexión a internet.'
      }, context);
    } else {
      // Otro tipo de error
      this.showErrorNotification({
        error: error.message || 'Error inesperado'
      }, context);
    }
  }
}
