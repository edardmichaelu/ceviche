import {
    SunIcon,
    MoonIcon,
    Bars3Icon
} from '@heroicons/react/24/outline';

interface MeseroHeaderProps {
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onToggleSidebar: () => void;
    user: { usuario: string; };
}

export function MeseroHeader({ isDarkMode, setIsDarkMode, onToggleSidebar, user }: MeseroHeaderProps) {
    return (
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Bars3Icon className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Panel del Mesero
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Bienvenido, {user.usuario}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                        {isDarkMode ? (
                            <SunIcon className="h-5 w-5" />
                        ) : (
                            <MoonIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
