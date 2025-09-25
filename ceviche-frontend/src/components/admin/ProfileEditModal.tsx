import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../apiClient';
import { ImageUpload } from './ImageUpload';
import {
    UserIcon,
    EnvelopeIcon,
    KeyIcon,
    CameraIcon,
    CheckIcon,
    XMarkIcon,
    ShieldCheckIcon,
    EyeIcon,
    EyeSlashIcon,
    LockClosedIcon,
    UserCircleIcon,
    AtSymbolIcon,
    PhotoIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import {
    UserIcon as UserIconSolid,
    EnvelopeIcon as EnvelopeIconSolid,
    KeyIcon as KeyIconSolid
} from '@heroicons/react/24/solid';

// Interfaz para el perfil del usuario
interface UserProfile {
    id: number;
    usuario: string;
    correo: string;
    avatar?: string | null;
}

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedUser?: { usuario: string; avatar?: string | null; }) => void;
}

export function ProfileEditModal({ isOpen, onClose, onSuccess }: ProfileEditModalProps) {
    const [profile, setProfile] = useState<Partial<UserProfile>>({
        usuario: '',
        correo: '',
        avatar: null
    });
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);


    // Reset y cargar perfil cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            // Reset completo de todos los estados y SIEMPRE limpiar contraseñas al abrir
            setProfile({
                id: 0,
                usuario: '',
                correo: '',
                avatar: null
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);

            setHasChanges(false);
            setIsLoading(false);
            setIsLoadingProfile(true);

            // Cargar perfil actual
            loadCurrentProfile();
        }
    }, [isOpen]);

    // Verificar si hay cambios
    useEffect(() => {
        // Solo marcar cambios si hay valores reales (no vacíos)
        const hasRealChanges = !!(profile.usuario && profile.correo);
        setHasChanges(hasRealChanges);
    }, [profile, newPassword, confirmPassword]);

    const loadCurrentProfile = async () => {
        try {
            setIsLoadingProfile(true);

            const response = await apiClient.get('/auth/profile');

            // Asegurarnos de que los datos existan
            if (response && response.id && response.usuario && response.correo) {
                setProfile({
                    id: response.id,
                    usuario: response.usuario || '',
                    correo: response.correo || '',
                    avatar: response.avatar || null
                });
            } else {
                toast.error('Los datos del perfil están incompletos');
                onClose();
            }
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(`Error: ${error.response.data.error}`);
            } else {
                toast.error('Error al cargar el perfil');
            }
            onClose();
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setProfile(prev => {
            const newProfile = { ...prev, [field]: value };

            // Si se está cambiando usuario o correo, resetear contraseñas solo si están vacías
            if (field === 'usuario' || field === 'correo') {
                const shouldResetPasswords = !newPassword && !confirmPassword;
                if (shouldResetPasswords) {
                    setNewPassword('');
                    setConfirmPassword('');
                }
            }

            return newProfile;
        });
    };

    const handleAvatarChange = (avatarUrl: string) => {
        setProfile(prev => ({
            ...prev,
            avatar: avatarUrl
        }));

        // Resetear contraseñas cuando se cambia avatar, solo si están vacías
        const shouldResetPasswords = !newPassword && !confirmPassword;
        if (shouldResetPasswords) {
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    const validateForm = () => {
        if (!profile.usuario?.trim()) {
            toast.error('El nombre de usuario es requerido');
            return false;
        }

        if (!profile.correo?.trim()) {
            toast.error('El correo electrónico es requerido');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profile.correo)) {
            toast.error('El correo electrónico no es válido');
            return false;
        }

        if (newPassword && newPassword.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres');
            return false;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const updateData: any = {
                usuario: profile.usuario,
                correo: profile.correo
            };

            // Solo incluir avatar si cambió
            if (profile.avatar !== undefined) {
                updateData.avatar = profile.avatar;
            }

            // Solo incluir contraseña si se proporcionó
            if (newPassword) {
                updateData.contrasena = newPassword;
            }

            const response = await apiClient.put('/auth/profile', updateData);

            toast.success('Perfil actualizado exitosamente');

            // Llamar al callback con los datos actualizados del usuario
            if (onSuccess) {
                onSuccess({
                    usuario: profile.usuario || '',
                    avatar: profile.avatar
                });
            }
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(`Error: ${error.response.data.error}`);
            } else if (error.response?.data?.details) {
                toast.error(`Error: ${error.response.data.details}`);
            } else {
                toast.error('Error al actualizar el perfil. Verifica los datos e intenta nuevamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <UserCircleIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Editar Perfil</h2>
                                <p className="text-blue-100 text-sm mt-1">Gestiona tu información personal y seguridad</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {isLoadingProfile ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <p className="text-gray-600 dark:text-gray-400">Cargando perfil...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Columna Izquierda - Información Personal */}
                            <div className="space-y-6">
                                {/* Avatar Section */}
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 p-6 rounded-xl border border-blue-200 dark:border-slate-500">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                        <PhotoIcon className="h-5 w-5 text-blue-600" />
                                        Foto de Perfil
                                    </h3>
                                    <div className="flex flex-col items-center">
                                        {/* Componente ImageUpload para manejar la subida de archivos */}
                                        <ImageUpload
                                            currentImage={profile.avatar}
                                            onImageChange={handleAvatarChange}
                                            className="mb-4"
                                            uploadUrl="/api/upload/avatar"
                                        />


                                        <div className="text-center mt-4">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {profile.usuario || 'Usuario'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Usa el selector de arriba para cambiar tu foto
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Información Básica */}
                                <div className="bg-white dark:bg-slate-700 p-6 rounded-xl border border-gray-200 dark:border-slate-600 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                                        <UserIconSolid className="h-5 w-5 text-blue-600" />
                                        Información Personal
                                    </h3>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <UserIcon className="h-4 w-4 text-blue-500" />
                                                Nombre de Usuario
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={profile.usuario || ''}
                                                    onChange={(e) => handleInputChange('usuario', e.target.value)}
                                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                    placeholder="Tu nombre de usuario"
                                                />
                                                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <AtSymbolIcon className="h-4 w-4 text-green-500" />
                                                Correo Electrónico
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    value={profile.correo || ''}
                                                    onChange={(e) => handleInputChange('correo', e.target.value)}
                                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                                    placeholder="tu@email.com"
                                                />
                                                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha - Seguridad */}
                            <div className="space-y-6">
                                {/* Información de Seguridad */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 p-6 rounded-xl border border-green-200 dark:border-slate-500">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                        <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                                        Información de Seguridad
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="bg-white/50 dark:bg-slate-600/50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <LockClosedIcon className="h-4 w-4 text-green-500" />
                                                <span className="font-medium">Usuario ID:</span>
                                                <span className="font-mono bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded text-xs">
                                                    {profile.id}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-white/50 dark:bg-slate-600/50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                                                <span className="font-medium">Estado de cuenta:</span>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                                    Activo
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Cambiar Contraseña */}
                                <div className="bg-white dark:bg-slate-700 p-6 rounded-xl border border-gray-200 dark:border-slate-600 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                                        <KeyIconSolid className="h-5 w-5 text-purple-600" />
                                        Cambiar Contraseña
                                        <span className="text-sm font-normal text-gray-500">(Opcional)</span>
                                    </h3>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                <LockClosedIcon className="h-4 w-4 text-gray-500" />
                                                Contraseña Actual
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value="••••••••"
                                                    disabled
                                                autoComplete="off"
                                                name="current-password"
                                                    className="w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                                    placeholder="Contraseña actual"
                                                />
                                                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Tu contraseña actual no se muestra por seguridad
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Nueva Contraseña
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => {
                                                        setNewPassword(e.target.value);
                                                    }}
                                                    autoComplete="new-password"
                                                    name="new-password"
                                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                                    placeholder="Dejar en blanco para no cambiar"
                                                />
                                                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowNewPassword(!showNewPassword);
                                                    }}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                >
                                                    {showNewPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                                                <InformationCircleIcon className="h-3 w-3" />
                                                Mínimo 6 caracteres. Dejar en blanco para mantener actual.
                                            </p>
                                            {newPassword && (
                                                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                                                    Longitud actual: {newPassword.length} caracteres
                                                </p>
                                            )}
                                        </div>

                                        {newPassword && (
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Confirmar Nueva Contraseña
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        value={confirmPassword}
                                                        onChange={(e) => {
                                                            setConfirmPassword(e.target.value);
                                                        }}
                                                        autoComplete="new-password"
                                                        name="confirm-password"
                                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                                        placeholder="Repite la nueva contraseña"
                                                    />
                                                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowConfirmPassword(!showConfirmPassword);
                                                        }}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    >
                                                        {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                                {newPassword !== confirmPassword && confirmPassword && (
                                                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                                        <XMarkIcon className="h-3 w-3" />
                                                        Las contraseñas no coinciden
                                                    </p>
                                                )}
                                                {newPassword === confirmPassword && confirmPassword && (
                                                    <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                                                        <CheckIcon className="h-3 w-3" />
                                                        Las contraseñas coinciden
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-4 pt-8 mt-8 border-t border-gray-200 dark:border-slate-600">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:from-gray-200 hover:to-gray-300 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                            <XMarkIcon className="h-5 w-5" />
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading || !hasChanges}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <CheckIcon className="h-5 w-5" />
                                    <span>Guardar Cambios</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
