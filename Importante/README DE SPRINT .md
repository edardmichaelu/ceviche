# Sistema de Gestión para Cevichería - Plan de Desarrollo

Bienvenido al proyecto "Ceviche", un sistema de gestión de restaurantes (POS) completo, construido con una arquitectura limpia y profesional.

Este documento sirve como la guía principal para el desarrollo, la organización del código y la implementación de funcionalidades futuras.
 DEBE HABER 2 TIPOS DE QR:

¡Sí, por supuesto! No solo se puede, sino que es una excelente idea implementar un sistema híbrido. Adaptar el proyecto para que soporte tanto un QR universal como un QR específico por mesa te da una flexibilidad enorme y mejora significativamente la experiencia.

Puedes mantener la estructura de tu base de datos casi como está. La clave es definir qué hace cada tipo de QR.

## Estrategia Híbrida: Combinando el QR Universal y el QR por Mesa
Así es como los dos sistemas pueden coexistir y potenciarse mutuamente:

1. El QR Universal (Acceso Rápido y General)
Propósito: Sirve para clientes que están esperando una mesa, para publicidad fuera del local o para consultas rápidas.

URL a la que apunta: tu-ceviche.com/menu

Funcionamiento:

Muestra el menú completo en modo "solo lectura".

El sistema no sabe quién es el cliente ni dónde está sentado.

Es perfecto para que la gente explore la carta sin compromiso.

2. El QR por Mesa (Experiencia Interactiva y Eficiente)
Propósito: Para los clientes que ya están sentados. Este QR crea un vínculo directo entre el cliente y su mesa en el sistema.

URL a la que apunta: tu-ceviche.com/menu?mesa=5 (o el número de mesa correspondiente).

Funcionamiento (Aquí está la magia):

Cuando el cliente escanea este QR, la aplicación sabe inmediatamente que están en la Mesa 5.
Debe incluirse el menu y la posibilidad de que el cliente haga la preorden osea escoger cosas del menu Y LE LLEGUE AL MESERO

Esto te permite implementar una funcionalidad avanzada que mencionaste: una comanda temporal o "pre-orden".



---ESPRINT MEJORAR ADEDCUAR

## 🏛️ Arquitectura del Proyecto

El proyecto sigue una arquitectura de **Separación de Responsabilidades (SoC)** para garantizar que el código sea mantenible, escalable y fácil de entender. Cada parte del sistema tiene un propósito claro:

* **/models:** Define la estructura de la base de datos. Cada archivo (`user.py`, `order.py`, etc.) representa una tabla y sus columnas. Es el **QUÉ** almacena el sistema.

* **/routes:** Define los puntos de entrada de la aplicación (URLs). Su única responsabilidad es recibir peticiones HTTP, validar permisos y llamar a los servicios correspondientes. Es el **DÓNDE** interactúa el usuario.

* **/services:** Contiene toda la lógica de negocio compleja. Si hay que calcular un total, generar un código o procesar un pago, la lógica vive aquí. Es el **CÓMO** funciona el sistema.

* **/templates:** Contiene los archivos HTML que se muestran al usuario. Se organizan en carpetas según el rol (`admin/`, `mozo/`, `cocina/`).

* **/static:** Contiene los archivos estáticos como CSS, JavaScript e imágenes.

* **app.py:** Es el corazón de la aplicación. Inicializa Flask, carga la configuración y registra todos los blueprints (rutas).

* **init_cevicheria.py:** Script de un solo uso para poblar la base de datos con datos iniciales de prueba.

* **.env:** Archivo de configuración local. **NUNCA** debe subirse a un repositorio. Contiene las contraseñas y claves secretas.

---

## 🚀 Plan de Desarrollo por Sprints

El desarrollo se basará estrictamente en los requisitos definidos en `cevicheria.txt`, incluyendo las mejoras solicitadas. Cada Sprint representa una funcionalidad completa y entregable.

### Sprint 0: Cimientos y Autenticación Segura
**Objetivo Principal:** Establecer la estructura base del proyecto, la conexión con la base de datos y un sistema de autenticación y redirección por roles que funcione a la perfección. Esta es la zapata sobre la que se construirá todo lo demás.

**Requisitos Clave:**
* [cite_start]El sistema debe tener roles definidos: `mozo`, `cocina`, `caja`, `administrador`[cite: 46, 52, 54, 56, 57].
* [cite_start]El login debe redirigir a la vista correspondiente según el rol del usuario[cite: 49].
* [cite_start]El sistema de login ya está parcialmente implementado, pero solo muestra un mensaje[cite: 48].

**Tareas Backend:**
1.  **Configuración del Proyecto:** Inicializar la aplicación Flask (`app.py`), configurar `SQLAlchemy` y conectar a la base de datos `ceviche_db` usando las credenciales del archivo `.env`.
2.  **Creación de Modelos:** Definir todos los modelos de la base de datos en la carpeta `/models` basándose en el archivo `ceviche_db.sql` (`User`, `Product`, `Order`, `Table`, etc.).
3.  **Lógica de Autenticación:** Crear el `AuthService` para manejar el `login` y `logout`. La función de login debe verificar la contraseña con `bcrypt` y, si es exitosa, devolver el rol del usuario.
4.  **Rutas de Autenticación:** Implementar la ruta `/login` en `/routes/auth_routes.py`. Esta ruta recibirá las credenciales, llamará al `AuthService` y, basándose en el rol, redirigirá a `/mozo`, `/cocina` o `/admin`.

**Tareas Frontend:**
1.  Crear la plantilla `templates/auth/login.html` con un formulario de usuario y contraseña.

**Criterios de Aceptación:**
* Un usuario con rol `mozo` ingresa sus credenciales y es redirigido a la ruta `/mozo`.
* Un usuario con rol `cocina` es redirigido a `/cocina`.
* Un usuario con credenciales incorrectas recibe un mensaje de error y no es redirigido.

---

### Sprint 1: La Experiencia del Cliente y la Vista del Mozo
**Objetivo Principal:** Implementar el menú virtual público y la vista inicial del mozo, sentando las bases del sistema híbrido de QR.

**Requisitos Clave:**
* [cite_start]Debe existir un **QR universal** que redirija al menú virtual sin necesidad de login[cite: 60].
* Se debe mantener la funcionalidad del **QR por mesa** para una experiencia interactiva.
* [cite_start]El menú debe mostrar productos por categorías, con todos sus detalles[cite: 5].
* [cite_start]El mozo debe poder visualizar un plano de las mesas por pisos y zonas[cite: 10, 11].

**Tareas Backend:**
1.  **Ruta del Menú Híbrido:** Desarrollar la ruta `/menu` para que sea pública. Debe manejar un parámetro opcional `?mesa=<id>`.
2.  **Lógica de Sesión Temporal:** En el `MenuService`, si se recibe el parámetro `mesa`, crear una "pre-orden" o "lista de deseos" temporal asociada a esa mesa. Cambiar el estado de la mesa a `pending_customer`.
3.  **API de Datos:** Crear las APIs `/api/menu-data` (para el menú) y `/api/mesas-layout` (para el plano de mesas del mozo).
4.  **Proteger Rutas del Mozo:** Asegurar que todas las rutas bajo `/mozo` requieran el rol `waiter` o `admin`.

**Tareas Frontend:**
1.  Diseñar `templates/menu/virtual_menu.html`. El JavaScript de esta página deberá detectar si existe el parámetro `?mesa` para habilitar la funcionalidad de "lista de deseos".
2.  Crear `templates/mozo/dashboard.html` que llame a `/api/mesas-layout` y renderice el plano completo del local, mostrando el estado de cada mesa con colores.

**Criterios de Aceptación:**
* Cualquier persona puede acceder a `/menu` y ver la carta.
* Al acceder a `/menu?mesa=5`, un mozo puede ver en su dashboard que la mesa 5 cambió de estado.
* Un mozo puede iniciar sesión y ver el mapa completo y actualizado de las mesas.

---

### Sprint 2: El Flujo del Pedido y Notificaciones en Tiempo Real
**Objetivo Principal:** Conectar al mozo con la cocina. Implementar la toma de pedidos y asegurar que las nuevas comandas aparezcan en la vista de cocina instantáneamente.

**Requisitos Clave:**
* [cite_start]El mozo debe poder seleccionar una mesa, tomar un pedido y enviarlo a cocina[cite: 12].
* [cite_start]El pedido debe aparecer en la vista de cocina en tiempo real[cite: 23].
* [cite_start]El mozo debe recibir alertas visuales discretas si cocina modifica un plato[cite: 15].

**Tareas Backend:**
1.  **Servicio de Órdenes:** Crear el `OrderService` con la lógica para crear una comanda, asociarle `order_items` y asignar cada ítem a su estación correcta basándose en el `product.station_type`.
2.  **API para Pedidos:** Implementar la API `POST /api/mozo/crear-pedido`.
3.  **Implementar Notificaciones (Mejora 4):** Integrar `Flask-SocketIO` o `Flask-SSE` (Server-Sent Events). Crear un canal de comunicación para la cocina y otro para los mozos.
4.  **Lógica de Eventos:** Cuando se crea un nuevo pedido, el `OrderService` debe emitir un evento `nuevo_pedido` al canal de la cocina.

**Tareas Frontend:**
1.  Crear `templates/mozo/tomar_pedido.html`. Esta vista mostrará el menú y un resumen de la comanda actual.
2.  Crear la versión inicial de `templates/cocina/dashboard.html`.
3.  Implementar el cliente de **SSE/Socket.IO** en el JavaScript de la cocina para "escuchar" el evento `nuevo_pedido` y añadir la nueva comanda a la vista sin recargar la página.

**Criterios de Aceptación:**
* Un mozo puede crear un pedido para la mesa 8, y este se guarda correctamente en la base de datos.
* Inmediatamente después, el usuario de cocina ve aparecer el nuevo pedido en su pantalla.

---

### Sprint 3: La Línea de Producción (Kanban Interactivo)
**Objetivo Principal:** Transformar la vista de cocina en un tablero Kanban completamente funcional e interactivo, permitiendo una gestión visual y eficiente de los platos.

**Requisitos Clave:**
* [cite_start]La vista de cocina debe ser un tablero Kanban con columnas por estado del plato (En cola, En preparación, Listo)[cite: 29, 30, 31].
* [cite_start]Cada usuario de cocina solo ve los platos de su estación[cite: 63].
* [cite_start]Se debe poder cambiar el estado de un plato con **drag & drop**[cite: 64].

**Tareas Backend:**
1.  **API de Datos para Kanban:** Crear la API `GET /api/cocina/items` que devuelva los `order_items` filtrados por la `estacion` del usuario autenticado.
2.  **API de Actualización de Estado:** Crear la API `POST /api/cocina/items/<int:item_id>/actualizar-estado`.
3.  **Lógica de Eventos:** Cuando se actualiza el estado de un ítem (ej. a "listo"), emitir un evento SSE/Socket.IO al canal del mozo correspondiente (`alerta_mozo`) para la notificación visual discreta.

**Tareas Frontend:**
1.  Mejorar `templates/cocina/dashboard.html` para renderizar los ítems como tarjetas en columnas.
2.  Integrar la librería **`SortableJS`** para habilitar el drag & drop entre columnas.
3.  Al soltar una tarjeta en una nueva columna, el JavaScript debe llamar a la API de actualización de estado.
4.  En la vista del mozo, el cliente de SSE/Socket.IO debe "escuchar" el evento `alerta_mozo` y resaltar visualmente el plato correspondiente.

**Criterios de Aceptación:**
* El usuario `cocina1` (fríos) solo ve ceviches en su Kanban.
* Al arrastrar un plato de "En preparación" a "Listo", el cambio se guarda y el mozo ve el estado del plato cambiar a rojo (🔴) en su propia interfaz.

---

### Sprint 4: El Administrador y Control de Inventario
**Objetivo Principal:** Darle al administrador el control total sobre la configuración del restaurante y la gestión del menú, incluyendo un sistema de inventario básico.

**Requisitos Clave:**
* [cite_start]El administrador puede supervisar todo el sistema en tiempo real[cite: 42].
* [cite_start]Puede agregar, editar, eliminar y marcar productos como "agotados"[cite: 43].
* [cite_start]Puede configurar las zonas y mesas del local[cite: 44].
* [cite_start]Puede gestionar usuarios y roles[cite: 46].

**Tareas Backend:**
1.  **Modelos de Inventario (Mejora 2):** Crear los modelos `Ingredient` y `ProductIngredient` en la base de datos.
2.  **Servicios de Administración:** Crear los `AdminService` para manejar la lógica de negocio de la gestión de productos, zonas, mesas y usuarios.
3.  **APIs de Administración:** Desarrollar todos los endpoints CRUD (Crear, Leer, Actualizar, Borrar) necesarios para las tareas del administrador (ej. `POST /api/admin/productos`, `DELETE /api/admin/usuarios/<id>`).
4.  **Lógica de Descuento de Stock:** En el `OrderService`, al completar un pedido, añadir la lógica para descontar el stock de los ingredientes correspondientes.

**Tareas Frontend:**
1.  Crear el dashboard principal `templates/admin/dashboard.html`.
2.  Desarrollar las plantillas para cada sección: `gestion_menu.html`, `gestion_mesas.html`, `gestion_usuarios.html`, y `gestion_inventario.html`.
3.  Implementar formularios y tablas interactivas para que el administrador pueda realizar todas sus tareas.

**Criterios de Aceptación:**
* El administrador puede marcar el "Ceviche Clásico" como "agotado" y este deja de ser visible en la interfaz del mozo.
* El administrador puede crear un nuevo usuario con rol "mozo".
* Cuando se vende un Pisco Sour, el stock de "Pisco" y "Limón" se reduce en la base de datos.

---

### Sprint 5: Funcionalidades Avanzadas y Cierre
**Objetivo Principal:** Implementar las mejoras de alto valor que refinan la experiencia y proporcionan inteligencia de negocio, como la división de cuentas y los reportes avanzados.

**Requisitos Clave:**
* [cite_start]Se requiere un historial de transacciones para auditorías[cite: 40].
* **(Mejora 1)** Implementar la división de cuentas.
* **(Mejora 3)** Implementar reportes avanzados.

**Tareas Backend:**
1.  **Lógica de División de Cuentas (Mejora 1):** En el `PaymentService`, desarrollar la lógica para manejar pagos parciales. Modificar la tabla `Payment` si es necesario (ej. añadiendo una columna `split_details` de tipo JSON).
2.  **API para División de Cuentas:** Crear el endpoint `POST /api/pagos/dividir`.
3.  **Servicio de Reportes (Mejora 3):** Crear un `ReportService` con métodos que ejecuten consultas complejas con SQLAlchemy para obtener métricas (platos más vendidos, horas pico, etc.).
4.  **API para Reportes:** Crear los endpoints `/api/reportes/ventas-por-plato`, `/api/reportes/horas-pico`, etc.

**Tareas Frontend:**
1.  (Aunque Caja no se implementa completamente) Crear un prototipo o una lógica en la vista del mozo para seleccionar ítems y enviarlos a la API de división de cuentas.
2.  Crear la plantilla `templates/admin/reportes.html`.
3.  Usar **Chart.js** o una librería similar para llamar a las APIs de reportes y visualizar los datos en gráficos interactivos.

**Criterios de Aceptación:**
* Un pedido de S/100 puede ser pagado en dos transacciones de S/50, cada una cubriendo ítems específicos.
* El administrador puede ver un gráfico de barras que muestra los 5 platos más vendidos del último mes.