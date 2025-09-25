import { useState, useEffect } from 'react';
import { apiClient } from '../apiClient';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BanknotesIcon, CreditCardIcon, DevicePhoneMobileIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

interface Orden {
    id: number;
    numero: string;
    mesa_id: number;
    mozo_id: number;
    tipo: string;
    estado: string;
    monto_total: number;
    cliente_nombre?: string;
    creado_en: string;
    items: ItemOrden[];
}

interface ItemOrden {
    id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    estado: string;
    producto?: {
        id: number;
        nombre: string;
        descripcion?: string;
    };
}

const PaymentMethodButton = ({ onClick, isSelected, icon, label, color, description }: any) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 shadow-md hover:shadow-lg ${
            isSelected
                ? `${color} ring-2 ring-white/50 scale-101 shadow-lg`
                : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 ring-2 ring-transparent hover:ring-slate-300 dark:hover:ring-slate-600'
        } text-white min-h-[100px] flex flex-col justify-between cursor-pointer`}
    >
        {/* Icono más pequeño */}
        <div className="text-center flex-1 flex items-center justify-center">
            <div className={`text-3xl mb-2 opacity-90 group-hover:scale-110 transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}>
        {icon}
            </div>
        </div>

        {/* Texto */}
        <div className="text-center">
            <h3 className={`font-bold text-base ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                {label}
            </h3>
            {description && (
                <p className={`text-xs mt-1 opacity-80 ${isSelected ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'}`}>
                    {description}
                </p>
            )}
        </div>

        {/* Efecto de brillo */}
        {isSelected && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        )}
    </motion.button>
);

export function CajaPage() {
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
    const [activePaymentMethod, setActivePaymentMethod] = useState('efectivo');
    const [montoRecibido, setMontoRecibido] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadOrdenesPendientes();
        // Actualizar cada 30 segundos
        const interval = setInterval(loadOrdenesPendientes, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadOrdenesPendientes = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get('/api/orden/caja/pendientes');

            if (response && typeof response === 'object' && 'success' in response && response.success && 'data' in response) {
                setOrdenes((response as any).data);
            }
        } catch (error: any) {
            toast.error(error.message || 'No se pudieron cargar las órdenes.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectOrden = (orden: Orden) => {
        setSelectedOrden(orden);
        setMontoRecibido(orden.monto_total);
        setActivePaymentMethod('efectivo');
    };

    const handleProcesarPago = async () => {
        if (!selectedOrden) return;

        if (activePaymentMethod === 'efectivo' && montoRecibido < selectedOrden.monto_total) {
            toast.error('El monto recibido debe ser mayor o igual al total');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await apiClient.post(`/api/orden/${selectedOrden.id}/pagar`, {
                metodo: activePaymentMethod,
                monto: montoRecibido
            });

            if (response && typeof response === 'object' && 'success' in response && response.success) {
                toast.success('Pago procesado correctamente');
                setSelectedOrden(null);
                await loadOrdenesPendientes(); // Recargar lista
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al procesar el pago');
        } finally {
            setIsProcessing(false);
        }
    };

    const cambio = activePaymentMethod === 'efectivo' ? montoRecibido - (selectedOrden?.monto_total || 0) : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full w-full grid grid-cols-1 xl:grid-cols-4 gap-3 overflow-hidden p-3 sm:p-4">
            {/* Columna de Órdenes Pendientes */}
            <section className="xl:col-span-1 bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 sm:p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Órdenes para Pagar</h2>
                    <button
                        onClick={loadOrdenesPendientes}
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        title="Actualizar"
                    >
                        🔄
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {ordenes.length > 0 ? (
                        ordenes.map(orden => (
                            <motion.div key={orden.id} layoutId={`orden-${orden.id}`}>
                                <div
                                    onClick={() => handleSelectOrden(orden)}
                                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                                        selectedOrden?.id === orden.id
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg">Orden #{orden.numero}</span>
                                        <span className="font-bold text-xl">S/ {orden.monto_total.toFixed(2)}</span>
                                    </div>
                                    <div className="text-sm mt-1 opacity-80">
                                        Mesa #{orden.mesa_id} • {orden.cliente_nombre || 'Cliente'}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-center py-8">No hay órdenes pendientes de pago.</p>
                    )}
                </div>
            </section>

            {/* Panel de Detalle y Pago */}
            <section className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6 flex flex-col min-h-0">
                {selectedOrden ? (
                    <div className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 h-full overflow-hidden">
                        <div className="lg:col-span-2 flex flex-col">
                            <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <h2 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-200">
                                    Orden #{selectedOrden.numero}
                                </h2>
                                <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded-full text-sm">
                                    {selectedOrden.estado.toUpperCase()}
                                </span>
                            </div>

                            <div className="flex-grow space-y-2 overflow-y-auto pr-2 border-b dark:border-slate-700">
                                {selectedOrden.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center py-2 border-t dark:border-slate-700 first:border-t-0">
                                        <div>
                                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                                                {item.producto?.nombre || `Producto #${item.producto_id}`}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {item.cantidad} x S/ {item.precio_unitario.toFixed(2)}
                                            </p>
                                        </div>
                                        <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                                            S/ {(item.cantidad * item.precio_unitario).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Resumen de Pago - JUSTO ENCIMA DEL TOTAL */}
                            <div className="mt-4 mb-2">
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-inner">
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <div className="flex justify-between items-center p-1.5 sm:p-2 bg-white dark:bg-slate-800 rounded-md sm:rounded-lg shadow-sm">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                                                <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Total a Pagar:</span>
                                            </div>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                                                S/ {selectedOrden.monto_total.toFixed(2)}
                                            </span>
                                        </div>

                                        {activePaymentMethod === 'efectivo' && (
                                            <div className="flex justify-between items-center p-1.5 sm:p-2 bg-white dark:bg-slate-800 rounded-md sm:rounded-lg shadow-sm">
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                                                    <span className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">Monto Recibido:</span>
                                                </div>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                                                    S/ {montoRecibido.toFixed(2)}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-md sm:rounded-lg border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">✓</span>
                                                </div>
                                                <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm">
                                                    {activePaymentMethod === 'efectivo' ? 'Cambio:' : 'Método:'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-green-600 dark:text-green-400 text-sm sm:text-base lg:text-lg block">
                                                    {activePaymentMethod === 'efectivo'
                                                        ? `S/ ${cambio >= 0 ? cambio.toFixed(2) : '0.00'}`
                                                        : activePaymentMethod.charAt(0).toUpperCase() + activePaymentMethod.slice(1)
                                                    }
                                                </span>
                                                {activePaymentMethod === 'efectivo' && cambio < 0 && (
                                                    <span className="text-red-500 text-xs font-medium">
                                                        Faltan: S/ {Math.abs(cambio).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 pt-2 flex justify-between items-center">
                                <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">TOTAL:</span>
                                <span className="text-2xl sm:text-3xl font-bold text-blue-500">S/ {selectedOrden.monto_total.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="lg:col-span-3 flex flex-col bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 lg:p-6 rounded-lg min-h-0">
                            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-700 dark:text-slate-300">Método de Pago</h3>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <PaymentMethodButton
                                    onClick={() => { setActivePaymentMethod('efectivo'); setMontoRecibido(0); }}
                                    isSelected={activePaymentMethod === 'efectivo'}
                                    icon={<BanknotesIcon className="h-6 w-6 text-green-500" />}
                                    label="Efectivo"
                                    color="bg-gradient-to-br from-green-400 to-green-600 hover:from-green-300 hover:to-green-500"
                                    description="Billetes y monedas"
                                />
                                <PaymentMethodButton
                                    onClick={() => { setActivePaymentMethod('tarjeta'); setMontoRecibido(selectedOrden.monto_total); }}
                                    isSelected={activePaymentMethod === 'tarjeta'}
                                    icon={<CreditCardIcon className="h-6 w-6 text-sky-500" />}
                                    label="Tarjeta"
                                    color="bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500"
                                    description="Débito o crédito"
                                />
                                <PaymentMethodButton
                                    onClick={() => { setActivePaymentMethod('yape'); setMontoRecibido(selectedOrden.monto_total); }}
                                    isSelected={activePaymentMethod === 'yape'}
                                    icon={<DevicePhoneMobileIcon className="h-6 w-6 text-green-600" />}
                                    label="Yape"
                                    color="bg-gradient-to-br from-purple-400 to-purple-600 hover:from-purple-300 hover:to-purple-500"
                                    description="App de pagos"
                                />
                                <PaymentMethodButton
                                    onClick={() => { setActivePaymentMethod('plin'); setMontoRecibido(selectedOrden.monto_total); }}
                                    isSelected={activePaymentMethod === 'plin'}
                                    icon={<DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />}
                                    label="Plin"
                                    color="bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500"
                                    description="App de pagos"
                                />
                            </div>

                            {activePaymentMethod === 'efectivo' && (
                                <div className="mb-3 sm:mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                                        💰 Calculadora Rápida
                                    </label>

                                    {/* Botones de Billetes Modernos */}
                                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                                        {[
                                            { value: 200, label: 'S/ 200', color: 'from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500' },
                                            { value: 100, label: 'S/ 100', color: 'from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500' },
                                            { value: 50, label: 'S/ 50', color: 'from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500' },
                                            { value: 20, label: 'S/ 20', color: 'from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500' },
                                            { value: 10, label: 'S/ 10', color: 'from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500' },
                                            { value: 5, label: 'S/ 5', color: 'from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500' }
                                        ].map((billete) => (
                                            <motion.button
                                                key={billete.value}
                                                onClick={() => setMontoRecibido(prev => prev + billete.value)}
                                                whileHover={{ scale: 1.03, y: -1 }}
                                                whileTap={{ scale: 0.97 }}
                                                className={`bg-gradient-to-br ${billete.color} text-white rounded-lg p-3 font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 min-h-[45px] flex items-center justify-center border border-white/20`}
                                            >
                                                {billete.label}
                                            </motion.button>
                                        ))}
                                    </div>

                                    {/* Botones Especiales */}
                                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                                        <motion.button
                                            onClick={() => setMontoRecibido(selectedOrden.monto_total)}
                                            whileHover={{ scale: 1.02, y: -1 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-lg p-2 sm:p-3 font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 min-h-[36px] sm:min-h-[40px] flex items-center justify-center border border-white/20"
                                        >
                                            <span className="hidden sm:inline">Monto </span>Exacto
                                        </motion.button>
                                        <motion.button
                                            onClick={() => setMontoRecibido(0)}
                                            whileHover={{ scale: 1.02, y: -1 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="bg-gradient-to-br from-slate-400 to-slate-500 hover:from-slate-300 hover:to-slate-400 text-white rounded-lg p-2 sm:p-3 font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 min-h-[36px] sm:min-h-[40px] flex items-center justify-center border border-white/20"
                                        >
                                            Limpiar
                                        </motion.button>
                                    </div>

                                    {/* Input Manual */}
                                    <div className="relative mb-4 sm:mb-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                                            <span className="hidden sm:inline">Monto </span>Manual <span className="text-xs text-gray-500">(opcional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="recibido-input"
                                        onChange={(e) => setMontoRecibido(parseFloat(e.target.value) || 0)}
                                        value={montoRecibido}
                                            className="w-full p-2 sm:p-3 text-right text-base sm:text-lg font-semibold bg-white dark:bg-slate-800 border-2 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                                        placeholder="S/ 0.00"
                                            step="0.01"
                                    />
                                        <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                                            <span className="text-xs sm:text-sm font-medium">S/</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Botón de Confirmar Moderno - DEBAJO DEL INPUT */}
                            <motion.button
                                onClick={handleProcesarPago}
                                disabled={isProcessing || (activePaymentMethod === 'efectivo' && montoRecibido < selectedOrden.monto_total)}
                                whileHover={!isProcessing && activePaymentMethod === 'efectivo' && montoRecibido >= selectedOrden.monto_total ? { scale: 1.01, y: -1 } : {}}
                                whileTap={!isProcessing && activePaymentMethod === 'efectivo' && montoRecibido >= selectedOrden.monto_total ? { scale: 0.99 } : {}}
                                className={`w-full font-bold py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl text-base sm:text-lg lg:text-xl shadow-lg sm:shadow-2xl transition-all duration-300 min-h-[50px] sm:min-h-[60px] lg:min-h-[70px] flex items-center justify-center gap-2 sm:gap-3 ${
                                    isProcessing || (activePaymentMethod === 'efectivo' && montoRecibido < selectedOrden.monto_total)
                                        ? 'bg-slate-400 text-slate-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-green-500/25 hover:shadow-green-500/40'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 border-b-2 border-white"></div>
                                        <span className="hidden sm:inline">Procesando </span>Pago...
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg sm:text-xl lg:text-2xl">✅</span>
                                        <span className="hidden sm:inline">Confirmar </span>Pago
                                        <span className="text-sm sm:text-base lg:text-lg opacity-80">
                                            (S/ {selectedOrden.monto_total.toFixed(2)})
                                        </span>
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-center max-w-sm sm:max-w-md mx-auto"
                        >
                            <div className="relative mb-6 sm:mb-8">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center shadow-lg">
                                    <div className="text-4xl sm:text-6xl opacity-60">💳</div>
                                </div>
                                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                    <span className="text-white text-sm sm:text-lg lg:text-xl">📋</span>
                                </div>
                            </div>

                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-700 dark:text-slate-300 mb-3 sm:mb-4">
                                ¡Listo para Cobrar!
                            </h3>
                            <p className="text-sm sm:text-base lg:text-lg text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 leading-relaxed px-2">
                                Selecciona una orden de la lista para comenzar el proceso de pago
                            </p>

                            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                                <div className="flex items-center gap-2 p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-green-700 dark:text-green-300">Órdenes pendientes</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-blue-700 dark:text-blue-300">Métodos de pago</span>
                                </div>
                            </div>

                            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg sm:rounded-xl">
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                    💡 <strong>Tip:</strong> Las órdenes aparecen automáticamente cuando los meseros marcan los pedidos como "servidos"
                                </p>
                        </div>
                        </motion.div>
                    </div>
                )}
            </section>
        </div>
    );
}
