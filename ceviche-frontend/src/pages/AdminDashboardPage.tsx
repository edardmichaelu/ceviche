import { motion } from 'framer-motion';

// --- Iconos mejorados para las tarjetas ---
const ICONS = {
    ventas: (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10"/>
                <path d="M18 20V4"/>
                <path d="M6 20V16"/>
            </svg>
        </div>
    ),
    pedidos: (
        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
        </div>
    ),
    mesas: (
        <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
        </div>
    ),
    ticket: (
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 5.25H5.25A2.25 2.25 0 003 7.5v9A2.25 2.25 0 005.25 18.75h13.5" />
            </svg>
        </div>
    ),
};

// --- Componente de Tarjeta de Estadística ---
const StatCard = ({ icon, title, value }: { icon: React.ReactElement, title: string, value: string }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-6 hover:shadow-xl transition-shadow duration-300">
        {icon}
        <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-semibold text-sm uppercase tracking-wide">{title}</h3>
            <p className="text-3xl font-bold mt-1 text-slate-700 dark:text-slate-200">{value}</p>
        </div>
    </div>
);

export function AdminDashboardPage() {
  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
    >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={ICONS.ventas} title="Ingresos Hoy" value="S/ 1,250.50" />
            <StatCard icon={ICONS.pedidos} title="Pedidos Hoy" value="38" />
            <StatCard icon={ICONS.mesas} title="Mesas Activas" value="8 / 15" />
            <StatCard icon={ICONS.ticket} title="Ticket Promedio" value="S/ 32.90" />
        </div>

        {/* Aquí irían los gráficos y otras secciones del dashboard */}
        <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="font-semibold text-xl mb-4">Actividad Reciente</h3>
            <p className="text-slate-500">Gráficos y tablas de actividad en desarrollo...</p>
        </div>
    </motion.div>
  );
}
