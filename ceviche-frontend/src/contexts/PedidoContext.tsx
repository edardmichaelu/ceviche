import React, { createContext, useContext, useState, useCallback, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../apiClient';

interface Producto {
    id: number;
    nombre: string;
    precio: number;
    cantidad: number;
}

interface Pedido {
    id?: number;
    mesa_id: number;
    productos: Producto[];
    total: number;
    estado: 'pendiente' | 'enviado' | 'preparando' | 'listo' | 'entregado';
    fecha_creacion: Date;
    observaciones?: string;
    cliente_nombre?: string;
    num_comensales?: number;
    es_por_persona?: boolean; // Indica si el precio se calcula por persona
}

interface PedidoContextType {
    pedidoActual: Pedido | null;
    iniciarPedido: (mesaId: number, clienteNombre?: string, capacidadMesa?: number) => void;
    agregarProducto: (producto: Omit<Producto, 'cantidad'>) => void;
    actualizarCantidad: (productoId: number, cantidad: number) => void;
    removerProducto: (productoId: number) => void;
    limpiarPedido: () => void;
    enviarPedido: () => Promise<boolean>;
    actualizarEstado: (estado: Pedido['estado']) => void;
    actualizarComensales: (numComensales: number, capacidadMesa?: number) => void;
    setPedidoActual: Dispatch<SetStateAction<Pedido | null>>;
}

const PedidoContext = createContext<PedidoContextType | undefined>(undefined);

export const usePedido = () => {
    const context = useContext(PedidoContext);
    if (!context) {
        throw new Error('usePedido debe usarse dentro de un PedidoProvider');
    }
    return context;
};

interface PedidoProviderProps {
    children: ReactNode;
}

export const PedidoProvider: React.FC<PedidoProviderProps> = ({ children }) => {
    const [pedidoActual, setPedidoActual] = useState<Pedido | null>(null);

    const iniciarPedido = useCallback((mesaId: number, clienteNombre?: string, capacidadMesa?: number) => {
        // Si se proporciona capacidad, limitar los comensales al máximo
        const maxComensales = capacidadMesa || 1;
        const validNumComensales = Math.min(1, maxComensales);

        setPedidoActual({
            mesa_id: mesaId,
            productos: [],
            total: 0,
            estado: 'pendiente',
            fecha_creacion: new Date(),
            cliente_nombre: clienteNombre,
            num_comensales: validNumComensales,
            es_por_persona: false // Por defecto, los precios no se calculan por persona
        });
    }, []);

    const agregarProducto = useCallback((producto: Omit<Producto, 'cantidad'>) => {
        setPedidoActual(prev => {
            if (!prev) return null;

            const existingProduct = prev.productos.find(p => p.id === producto.id);
            if (existingProduct) {
                existingProduct.cantidad += 1;
                // Recalcular total completo
                const nuevoTotal = prev.productos.reduce((total, prod) => {
                    return total + (prev.es_por_persona
                        ? prod.precio * (prev.num_comensales || 1) * prod.cantidad
                        : prod.precio * prod.cantidad);
                }, 0);
                return { ...prev, total: nuevoTotal };
            } else {
                const newProduct: Producto = { ...producto, cantidad: 1 };
                const precioConComensales = prev.es_por_persona
                    ? producto.precio * (prev.num_comensales || 1)
                    : producto.precio;
                return {
                    ...prev,
                    productos: [...prev.productos, newProduct],
                    total: prev.total + precioConComensales
                };
            }
        });
    }, []);

    const actualizarCantidad = useCallback((productoId: number, cantidad: number) => {
        setPedidoActual(prev => {
            if (!prev) return null;

            if (cantidad <= 0) {
                const product = prev.productos.find(p => p.id === productoId);
                if (product) {
                    const precioAEliminar = prev.es_por_persona
                        ? product.precio * (prev.num_comensales || 1) * product.cantidad
                        : product.precio * product.cantidad;
                    return {
                        ...prev,
                        productos: prev.productos.filter(p => p.id !== productoId),
                        total: prev.total - precioAEliminar
                    };
                }
                return prev;
            } else {
                const product = prev.productos.find(p => p.id === productoId);
                if (product) {
                    const diferenciaCantidad = cantidad - product.cantidad;
                    const diferenciaPrecio = prev.es_por_persona
                        ? product.precio * (prev.num_comensales || 1) * diferenciaCantidad
                        : product.precio * diferenciaCantidad;

                    product.cantidad = cantidad;
                    return {
                        ...prev,
                        total: prev.total + diferenciaPrecio
                    };
                }
                return prev;
            }
        });
    }, []);

    const removerProducto = useCallback((productoId: number) => {
        setPedidoActual(prev => {
            if (!prev) return null;

            const product = prev.productos.find(p => p.id === productoId);
            if (product) {
                const precioAEliminar = prev.es_por_persona
                    ? product.precio * (prev.num_comensales || 1) * product.cantidad
                    : product.precio * product.cantidad;
                return {
                    ...prev,
                    productos: prev.productos.filter(p => p.id !== productoId),
                    total: prev.total - precioAEliminar
                };
            }
            return prev;
        });
    }, []);

    const limpiarPedido = useCallback(() => {
        setPedidoActual(null);
    }, []);

    const enviarPedido = useCallback(async (): Promise<boolean> => {
        if (!pedidoActual || pedidoActual.productos.length === 0) {
            return false;
        }

        try {
            // Crear la orden en el backend
            const ordenResponse = await apiClient.post('/api/orden', {
                mesa_id: pedidoActual.mesa_id,
                mozo_id: 1, // TODO: Obtener del usuario actual
                tipo: 'local',
                cliente_nombre: pedidoActual.cliente_nombre,
                num_comensales: pedidoActual.num_comensales || 1
            });

            if (ordenResponse && typeof ordenResponse === 'object' && 'success' in ordenResponse && ordenResponse.success && 'data' in ordenResponse && ordenResponse.data && typeof ordenResponse.data === 'object' && 'id' in ordenResponse.data) {
                const ordenId = (ordenResponse.data as any).id;

                // Agregar productos a la orden
                for (const producto of pedidoActual.productos) {
                    await apiClient.post(`/api/orden/${ordenId}/productos`, {
                        producto_id: producto.id,
                        cantidad: producto.cantidad,
                        precio_unitario: producto.precio
                    });
                }

                // Limpiar el pedido local
                setPedidoActual(null);

                // Notificar a la cocina que hay una nueva orden
                localStorage.setItem('new_order', Date.now().toString());
                window.dispatchEvent(new CustomEvent('newOrder', { detail: { ordenId } }));

                // Mostrar notificación de éxito
                toast.success('✅ ¡Comanda enviada a cocina exitosamente!');

                return true;
            } else {
                throw new Error('Error al crear la orden');
            }
        } catch (error) {
            console.error('Error enviando pedido:', error);
            return false;
        }
    }, [pedidoActual]);

    const actualizarComensales = useCallback((numComensales: number, capacidadMesa?: number) => {
        setPedidoActual(prev => {
            if (!prev) return null;

            // Validar que no exceda la capacidad de la mesa si se proporciona
            const maxComensales = capacidadMesa || Infinity;
            const validNumComensales = Math.min(Math.max(1, numComensales), maxComensales);

            if (numComensales !== validNumComensales) {
                toast.error(`El número de comensales debe estar entre 1 y ${maxComensales}`);
            }

            // Recalcular el total considerando el nuevo número de comensales
            const nuevoTotal = prev.productos.reduce((total, producto) => {
                return total + (prev.es_por_persona
                    ? producto.precio * validNumComensales * producto.cantidad
                    : producto.precio * producto.cantidad);
            }, 0);

            return {
                ...prev,
                num_comensales: validNumComensales,
                total: nuevoTotal
            };
        });
    }, []);

    const actualizarEstado = useCallback((estado: Pedido['estado']) => {
        setPedidoActual(prev => prev ? { ...prev, estado } : null);
    }, []);

    const value: PedidoContextType = {
        pedidoActual,
        setPedidoActual,
        iniciarPedido,
        agregarProducto,
        actualizarCantidad,
        removerProducto,
        limpiarPedido,
        enviarPedido,
        actualizarEstado,
        actualizarComensales
    };

    return (
        <PedidoContext.Provider value={value}>
            {children}
        </PedidoContext.Provider>
    );
};
