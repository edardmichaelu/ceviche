import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiClient } from '../apiClient';
import { toast } from 'react-hot-toast';
import {
  FireIcon,
  SparklesIcon,
  StarIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

type Categoria = {
  id: number | string;
  nombre: string;
  icono?: string;
  cantidad_items?: number;
};

type Producto = {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url?: string | null;
  etiquetas?: string | null;
  nivel_picante?: 'ninguno' | 'bajo' | 'medio' | 'alto' | null;
  categoria_id: number;
  categoria?: { id: number; nombre: string } | null;
};

const BACKEND_URL = 'http://localhost:5000';

export default function CartaPublicaPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [activo, setActivo] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const [catRes, prodRes] = await Promise.all([
          apiClient.getPublic('/api/categoria/public'),
          apiClient.getPublic('/api/producto/public')
        ]);

        const catData: Categoria[] = ((catRes as any).categorias || []).map((c: any) => ({
          id: String(c.id),
          nombre: c.nombre,
          icono: c.icono,
          cantidad_items: c.cantidad_productos
        }));
        setCategorias(catData);

        const prodData: Producto[] = ((prodRes as any).data || []).map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: Number(p.precio) || 0,
          imagen_url: p.imagen_url || null,
          etiquetas: p.etiquetas || null,
          nivel_picante: p.nivel_picante || null,
          categoria_id: p.categoria_id,
          categoria: p.categoria
        }));
        setProductos(prodData);
      } catch (e: any) {
        toast.error(`No se pudo cargar el menú: ${e.message}`);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const productosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return productos.filter(p => {
      const byCat = activo === 'todas' || String(p.categoria_id) === String(activo);
      const byQuery = query === '' || p.nombre.toLowerCase().includes(query) || (p.descripcion || '').toLowerCase().includes(query);
      return byCat && byQuery;
    });
  }, [productos, activo, busqueda]);

  const getImgUrl = (img?: string | null) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${BACKEND_URL}${img}`;
  };

  // Estado para modal de detalle
  const [detalle, setDetalle] = useState<null | Producto>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Encabezado */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/80 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} className="h-8 w-8" alt="logo" />
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800">
              Carta del Restaurante
            </h1>
          </div>

          {/* Buscador */}
          <div className="ml-auto flex-1 max-w-xl hidden sm:block">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar platos, bebidas..."
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Chips de categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActivo('todas')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm border ${
              activo === 'todas' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setActivo(String(c.id))}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm border ${
                String(activo) === String(c.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              {c.icono ? <span className="mr-1">{c.icono}</span> : null}
              {c.nombre}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        {cargando ? (
          <div className="py-24 text-center text-slate-500">Cargando menú...</div>
        ) : (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {productosFiltrados.map((p) => {
              const etiquetas = (p.etiquetas || '').toLowerCase();
              const isRecomendado = etiquetas.includes('recomend');
              const isNuevo = etiquetas.includes('nuevo');
              const isTop = etiquetas.includes('vendido') || etiquetas.includes('top');
              const pic = p.nivel_picante && p.nivel_picante !== 'ninguno';

              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden cursor-pointer" onClick={() => setDetalle(p)}>
                  <div className="relative h-32 sm:h-40 bg-slate-100">
                    {getImgUrl(p.imagen_url) ? (
                      <img src={getImgUrl(p.imagen_url) as string} alt={p.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {isRecomendado && (
                        <span className="bg-emerald-500/90 text-white text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <SparklesIcon className="h-3 w-3" /> Recomendado
                        </span>
                      )}
                      {isNuevo && (
                        <span className="bg-blue-600/90 text-white text-[10px] px-2 py-0.5 rounded-full">Nuevo</span>
                      )}
                    </div>
                    {pic && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-red-500/90 text-white text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <FireIcon className="h-3 w-3" /> Picante
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-slate-800 line-clamp-2 min-h-[2.5rem]">{p.nombre}</h3>
                    {p.descripcion && (
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{p.descripcion}</p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-blue-600 font-extrabold text-lg">${p.precio.toFixed(2)}</div>
                      {isTop && (
                        <span className="text-amber-500 inline-flex items-center gap-1 text-xs font-semibold">
                          <StarIcon className="h-4 w-4" /> Popular
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {(!cargando && productosFiltrados.length === 0) && (
          <div className="py-16 text-center text-slate-500">No hay productos que coincidan.</div>
        )}
      </main>

      {/* Modal de detalle */}
      <AnimatePresence>
        {detalle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDetalle(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-48 bg-slate-100">
                {getImgUrl(detalle.imagen_url) ? (
                  <img src={getImgUrl(detalle.imagen_url) as string} alt={detalle.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                )}
                <button className="absolute top-2 right-2 bg-white/90 rounded-full px-3 py-1 text-sm" onClick={() => setDetalle(null)}>Cerrar</button>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-extrabold text-slate-800">{detalle.nombre}</h3>
                {detalle.descripcion && (
                  <p className="mt-2 text-slate-600 whitespace-pre-line">{detalle.descripcion}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-blue-600 font-extrabold text-2xl">${detalle.precio.toFixed(2)}</div>
                  {detalle.nivel_picante && detalle.nivel_picante !== 'ninguno' && (
                    <span className="text-red-500 text-sm font-semibold">Picante: {detalle.nivel_picante}</span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pie simple */}
      <footer className="mt-10 py-8 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <FunnelIcon className="h-4 w-4" /> Menú público • Escaneable por QR • {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}


