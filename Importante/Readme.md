# 🍤 Sistema Integral de Gestión para Cevichería — README Principal
Bienvenido al proyecto de gestión POS para cevichería, una solución modular, escalable, segura y detalladamente documentada. Este README expone la planificación, la relación de tablas principales, los sprints de desarrollo y el desglose de funcionalidades frontend y backend, garantizando el cumplimiento estricto de los requerimientos cliente.

---

## ⚡ Resumen Ejecutivo
- Sistema **Multi-rol** (admin, mozo, cocina/estación, caja, cliente)  
- **16 tablas principales** documentadas, con **45+ índices** y **200+ campos** validados y constraints  
- **Kanban Cocina avanzado** (drag&drop, filtrado automático por estación, asignación por chef)  
- **QR híbrido**: menú virtual público y menú con pre-orden/mesa  
- **Trazabilidad y auditoría total** en cada módulo, sesión y acción  
- **Reportes en tiempo real**, dashboard animado y modular  
- **Gestión avanzada de inventario** y productos multietiqueta por temporada/estado  
- **Permisos temporales, multi-sesión**, seguridad y control de acceso granular  

---

## 📊 Desglose de las 16 Tablas Principales
- **usuario**: gestión de usuarios, roles, multi-sesión y tracking de accesos  
- **sesion_usuario**: control avanzado de sesiones, dispositivos, expiración y auditoría  
- **permiso_temporal**: permisos temporales y asignaciones por módulo/área  
- **auditoria**: log de trazabilidad completo para acciones, cambios y operaciones  
- **piso**: niveles físicos del local para organización de zonas y mesas  
- **zona**: zonas configurables del restaurante por tipo/capacidad/piso  
- **mesa**: mesas físicas, QR híbrido, tracking estado, reservas y conectividad a órdenes  
- **categoria**: categorías de productos/menu  
- **producto**: productos con metadatos extensos, preparación, estación, alérgenos, etc.  
- **ingrediente**: inventario al detalle, stock/medidas y manejo vinculado a receta  
- **producto_ingrediente**: relación producto-ingrediente, control de stock dinámico  
- **orden**: pedido principal, tracking de estados, pagos, relación mozo/mesa  
- **item_orden**: ítems Kanban del pedido, tracking estación/chef/estado/tiempos/feedback  
- **pago**: pagos multiformato, tracking histórico y control de caja  
- **wishlist**: pre-órdenes/pendientes QR por mesa cliente, integración directa a pedido formal  
- **resena**: reviews de producto, validadas por admin, con fecha y comentarios  

---

## 🚦 Planificación de SPRINTS y Funcionalidad

### Sprint 1: Base del Sistema y Estructura de Usuarios
- Modelado e implementación: **usuario, sesion_usuario, permiso_temporal, auditoria**  
- Flujo de login/logout, recuperación y validaciones  
- Gestión de roles y permisos, asignación y expiración automática  
- Panel de auditoría y log para admins  
- **Frontend**: formularios de login, registro, panel auditoría  

### Sprint 2: Organización y Contexto Físico del Local
- Implementación de **piso, zona, mesa** (QR híbrido, estado, historial)  
- CRUD completo y vistas de zonas/pisos/mesas  
- Mapas de mesa dinámicos para mozo y cocina  
- Soporte de reservas, bloqueos y mantenimiento
- **Frontend**: editor visual local, dashboard mozo, visualización mapa del restaurante  

### Sprint 3: Catálogo, Menú Avanzado y Relación Inventario
- Abstracción de **categoria, producto, ingrediente, producto_ingrediente**  
- CRUD con validaciones, importación y carga masiva  
- Relación flexible de productos, estaciones (frio, caliente, barra, postre) y asignación de ingredientes  
- Filtros por temporada, categoría, estado y etiquetas visuales ("nuevo", "recomendado", etc.)  
- Menú QR universal y vista enriquecida de productos  
- **Frontend**: menú responsivo, panel admin productos y stock real  

### Sprint 4: Flujo de Pedidos, Comandas y Kanban
- Implementación de **orden** e **item_orden**: relación con mesa/mozo/cocina  
- Estados avanzados: pending, inqueue, preparing, ready, served, cancelled  
- Kanban animado por estación, drag&drop, tracking por chef  
- Timing estimado y real de preparación, push a mozo al mover tarjeta  
- Conversión automática de wishlist en orden formal al confirmar cliente/mozo  
- **Frontend**: Kanban con animación, dashboard de cocina, panel seguimiento mozo, alertas visuales  

### Sprint 5: Gestión de Pagos y Reseñas
- Modelo de **pago** multiformato, caja, historial y división de cuentas  
- CRUD de pagos, validación antifraude, acceso por caja/admin  
- Modelo y flujo workflow de **resena**: ingreso por cliente, validación/edición por admin  
- Integración de pagos con cierre de comandas y auditoría automática  
- **Frontend**: panel de caja, tickets, impresión, historial de reseñas, listado público  

### Sprint 6: Wishlist, QR y Pre-orden Cliente
- Modelo **wishlist**: pre-órdenes por QR mesa/cliente, integración directa a sistema de pedidos  
- Flujo de notificación y push a mozo/cocina en tiempo real al confirmar  
- Optimización de experiencia QR (UI móvil, tablas, animaciones de feedback)  
- Vinculación caja-Kanban-mozo para experiencia fluida end-to-end cliente-real  
- **Frontend**: QR interactivo, vista pública para cliente y feedback directo  

### Sprint 7: Seguridad, Optimización y Reportes
- Protección de rutas, validación integral de roles y permisos dinámicos  
- Auditoría, triggers y backups, monitoreo real de estados y acciones  
- Reportes administrativos: ventas, platos populares, uso de zonas, eficiencia de personal  
- Panel de métricas integrales y graficado avanzado  
- **Frontend**: dashboards animados, report builder, exportaciones  

### Sprint 8: Refino, Accesibilidad y Documentación
- Dark mode, accesibilidad, internacionalización (i18n)  
- Refino de animaciones, efectos y feedback UX  
- Manuales para usuarios finales y textos de ayuda  
- Testing/QA y checklist de producción  
- **Frontend**: mensajes de validación, ayuda visual, onboarding, simulador manual  

---

## 🗂️ Relación Sprint / Tabla / Funcionalidad
| Sprint | Tabla(s)                                 | Funcionalidad basada en tabla                        |
|--------|------------------------------------------|-----------------------------------------------------|
| 1      | usuario, sesion_usuario, permiso_temporal, auditoria | Autenticación avanzada, auditoría de acciones, RBAC  |
| 2      | piso, zona, mesa                          | Organización física, edición zonas/mesas, QR híbrido |
| 3      | categoria, producto, ingrediente, producto_ingrediente | Catálogo menú, relación producto-ingrediente, stock |
| 4      | orden, item_orden                          | Comandas y detalle Kanban, drag&drop por cocina/estación |
| 5      | pago, resena                               | Flujo completo caja, historial, reviews validadas    |
| 6      | wishlist                                   | Pre-órdenes, integración QR, workflow de cliente a mozo |
| 7      | (todas)                                   | Seguridad integral, reportes, optimización, métricas |
| 8      | (todas)                                   | UX final, accesibilidad, documentación, QA           |

---

## 📑 Notas Finales
- Cada sprint incluye revisiones, pruebas y ajustes antes de avanzar.  
- El desarrollo respeta separación **Backend** (servicio de datos, lógica y sockets) y **Frontend** (UI SPA Kanban, dashboards, animaciones).  
- Todas las funcionalidades, pantallas y flujos están cubiertos por tablas y casos de uso; cualquier falta específica puede documentarse o versionarse en migraciones futuras.
- Backend y forntend     
'''flask run
 '''npm run dev
