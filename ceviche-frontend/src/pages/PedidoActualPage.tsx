import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { usePedido } from '../contexts/PedidoContext';
import {
    PlusIcon,
    MinusIcon,
    TrashIcon,
    ShoppingCartIcon,
    PaperAirplaneIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const PedidoActualPage: React.FC = () => {
    const { pedidoActual, agregarProducto, actualizarCantidad, removerProducto, limpiarPedido, enviarPedido } = usePedido();
    const navigate = useNavigate();

    const handleEnviarPedido = async () => {
        if (!pedidoActual || pedidoActual.productos.length === 0) {
            toast.error('No hay productos en el pedido');
            return;
        }

        const success = await enviarPedido();
        if (success) {
            toast.success('Pedido enviado a cocina correctamente');
            limpiarPedido();
            navigate('/mesero/mesas');
        } else {
            toast.error('Error al enviar el pedido');
        }
    };

    const handleRegresar = () => {
        navigate('/mesero/productos');
    };

    if (!pedidoActual) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <ShoppingCartIcon className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                        No hay pedido activo
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                        Selecciona una mesa para comenzar un pedido
                    </p>
                    <button
                        onClick={() => navigate('/mesero/mesas')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Ir a Mesas
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleRegresar}
                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Pedido Actual
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                Mesa {pedidoActual.mesa_id} - {pedidoActual.productos.length} productos
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            S/ {pedidoActual.total.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Acciones del pedido */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/mesero/productos')}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                        Agregar Productos
                    </button>
                    <button
                        onClick={limpiarPedido}
                        className="px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleEnviarPedido}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                    >
                        <PaperAirplaneIcon className="h-5 w-5" />
                        Enviar
                    </button>
                </div>
            </div>

            {/* Lista de productos */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Productos en el Pedido
                </h2>

                {pedidoActual.productos.length === 0 ? (
                    <div className="text-center py-12">
                        <ShoppingCartIcon className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                            El pedido está vacío
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            Agrega productos desde el catálogo
                        </p>
                        <button
                            onClick={() => navigate('/mesero/productos')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Agregar Productos
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pedidoActual.productos.map((producto) => (
                            <motion.div
                                key={producto.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                            >
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        {producto.nombre}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        S/ {producto.precio.toFixed(2)} cada uno
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => actualizarCantidad(producto.id, producto.cantidad - 1)}
                                            className="p-1 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                                        >
                                            <MinusIcon className="h-4 w-4" />
                                        </button>

                                        <span className="px-3 py-1 bg-white dark:bg-slate-600 rounded font-medium min-w-[3rem] text-center">
                                            {producto.cantidad}
                                        </span>

                                        <button
                                            onClick={() => actualizarCantidad(producto.id, producto.cantidad + 1)}
                                            className="p-1 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="text-right min-w-[4rem]">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            S/ {(producto.precio * producto.cantidad).toFixed(2)}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => removerProducto(producto.id)}
                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Resumen del pedido */}
            {pedidoActual.productos.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Resumen del Pedido
                    </h2>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">
                                Subtotal ({pedidoActual.productos.length} productos)
                            </span>
                            <span className="text-slate-900 dark:text-white">
                                S/ {pedidoActual.total.toFixed(2)}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">IGV (18%)</span>
                            <span className="text-slate-900 dark:text-white">
                                S/ {(pedidoActual.total * 0.18).toFixed(2)}
                            </span>
                        </div>

                        <hr className="border-slate-200 dark:border-slate-600" />

                        <div className="flex justify-between text-lg font-bold">
                            <span className="text-slate-900 dark:text-white">Total</span>
                            <span className="text-blue-600 dark:text-blue-400">
                                S/ {(pedidoActual.total * 1.18).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => navigate('/mesero/productos')}
                            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            Agregar Más
                        </button>
                        <button
                            onClick={handleEnviarPedido}
                            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Enviar Pedido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PedidoActualPage;
