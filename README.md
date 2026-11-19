# Paseo de mascotas

App web de paseo de mascotas. Monolito en capas (presentación, API, dominio, infraestructura) con Node.js, Express y MySQL 8.

## Requisitos
Node.js 18 o superior, MySQL 8 y (más adelante) una cuenta SMTP.

## Instalación
1. `npm install`
2. Copia `.env.example` como `.env` y completa los datos de MySQL, `DEV_PASSWORD` y `SESSION_SECRET`.
3. `npm run db:init` crea la base, las 11 tablas y los datos de ejemplo (con hashes bcrypt reales). `npm run db:reset` la recrea desde cero. Si ya tenías la base de una versión anterior, `npm run db:init` agrega las tablas nuevas (solicitudes) sin borrar tus datos.
4. `npm start` y abre http://localhost:3000. Comprobación: http://localhost:3000/api/salud
5. `npm test` ejecuta las pruebas.

## Estructura
| Carpeta | Capa | Contenido |
|---|---|---|
| `public/` | Presentación | Pantallas por rol |
| `api/` | API | Rutas, sesión, control de rol, errores |
| `dominio/` | Dominio | Entidades, servicios e interfaces de repositorio |
| `infraestructura/` | Infraestructura | `ConexionBD` (Singleton), repositorios MySQL, correo, planificador |
| `sql/` | — | `paseo_mascotas.sql` y futuros scripts numerados |
| `scripts/` | — | `db-init.js` |
| `tests/` | — | Pruebas automáticas |

`app.js` es el único archivo que conoce todas las capas.

## Cómo usar la app
Entra con los usuarios de ejemplo (contraseña = `DEV_PASSWORD` del `.env`): `admin@paseos.ec` (administrador), `carlos@paseos.ec` (paseador), `ana.mora@mail.com` (dueño). Cada rol ve solo su menú.
- **Página de inicio pública** (sin sesión): presenta el servicio, cómo funciona, horarios y las tarifas vigentes (`GET /api/publico/tarifas`), con botones a «Iniciar sesión» (`#/entrar`) y «Crear cuenta» (`#/registro`). Toda la app comparte este estilo (amarillo, azul y verde petróleo, tema claro).
- **Registro público**: en la pantalla de acceso, «Crea tu cuenta» permite que un dueño se registre solo (`POST /api/registro`): crea su usuario (siempre rol dueño) y su ficha en una transacción, y entra con sesión. Los paseadores y administradores los sigue creando el administrador.
- **Administrador**: agenda y filtros, programar paseo, planes recurrentes (3 días L-M-V o 5 días L-V, inicio en lunes), dueños y mascotas, paseadores y turnos, usuarios, cobros (por mes o rango, exportación CSV) y configuración (tarifas 3–8 USD, máximo de perros por grupo).
- **Paseador**: «Mi agenda»; inicia y completa sus paseos y marca si una mascota es apta para grupo.
- **Dueño**: «Mis paseos» (estado actualizado cada 30 s), «Mis mascotas» (registra y edita las suyas; si es apta para grupo lo define el paseador) y «Solicitar paseo» (elige fecha, hora y mascotas; ve el estado de sus solicitudes y puede cancelar las pendientes).
- **Fotos de mascotas**: el dueño sube la foto de cada mascota en «Mis mascotas» (se reduce y convierte a JPEG en el navegador; máximo 600 KB, se guarda en la base de datos). La ven el paseador en su agenda y el administrador; otro dueño no puede verla (`/api/fotos/:id`). La portada pública muestra una foto de perro al azar de la API gratuita Dog CEO y, si no hay internet o falla, el dibujo de respaldo.
- **Solicitudes**: el administrador las revisa en «Solicitudes»: **aprueba** eligiendo un paseador del turno (se crea el paseo con todas las reglas de cruces, turnos y grupo, y el dueño recibe un correo) o **rechaza** con un motivo (también por correo). La agenda avisa cuando hay pendientes.

## API (todo bajo sesión)
`/api/sesion`, `/api/registro` (público), `/api/usuarios`, `/api/duenos`, `/api/mascotas`, `/api/mis-mascotas` (dueño), `/api/solicitudes` (+ `/:id/aprobar`, `/:id/rechazar`, `/:id/cancelar`), `/api/paseadores`, `/api/paseos` (+ `/:id/estado`, `/:id/reprogramar`), `/api/mis-paseos`, `/api/planes`, `/api/cobros` (+ `/exportar`), `/api/configuracion`.

## Variables de entorno útiles
`TZ` (por defecto America/Guayaquil), `CSV_SEPARADOR` (`;`), `CSV_DECIMAL` (`,`), `SMTP_*` (sin `SMTP_HOST` el correo es simulado y se imprime en consola), `SESSION_SECRET`, `DEV_PASSWORD`.

## Pruebas
`npm test` (96 pruebas, sin base de datos) y `npm run humo` (27 comprobaciones contra el servidor y MySQL en marcha, incluye concurrencia, reversión y recordatorios).

## Avance
Todos los módulos de las Fases 1–5 están implementados: sesión, usuarios, dueños y mascotas, paseadores y turnos, paseos con reglas RN-07 a RN-10 y control de cruces, planes, notificaciones (recordatorio 30 min antes, reintento de fallidos), cobros y CSV, configuración, y la interfaz web responsiva (desde 360 px).

## Novedades: temperamento y cancelación por el paseador

- Cada mascota tiene un temperamento (tranquilo, tímido o agresivo). El dueño lo elige al registrarla y el paseador lo ve en su agenda, con una advertencia para los perros agresivos.
- El paseador puede cancelar un paseo Pendiente escribiendo el motivo (obligatorio). El dueño recibe un correo y el motivo queda en el historial del paseo, visible para el administrador.
- Base de datos ya creada: corre `npm run db:init` una vez para agregar la columna nueva sin perder datos.
