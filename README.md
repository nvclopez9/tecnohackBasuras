# EcoChicharro

**PWA de gestión ciudadana de incidencias en los contenedores de basura de Santa Cruz de Tenerife.**

EcoChicharro cierra el ciclo entre la ciudadanía que detecta un problema en la vía pública —un contenedor desbordado, roto, quemado o desaparecido— y el personal municipal que gestiona la recogida y el mantenimiento. El nombre juega con *chicharro*, el gentilicio popular de Santa Cruz de Tenerife.

Es un proyecto desarrollado para un hackathon, con identidad visual basada en la paleta institucional del **Cabildo de Tenerife** (azul corporativo `#005A9C`).

---

## 1. El problema que resuelve

Hoy un contenedor estropeado o lleno suele pasar desapercibido hasta que alguien llama por teléfono o el problema se agrava. EcoChicharro convierte a cada ciudadano en un sensor: un reporte con foto y GPS llega de forma inmediata al municipio, que puede **priorizar, asignar y analizar** los avisos de forma agregada para optimizar las rutas de recogida y mantenimiento.

---

## 2. Alcance del proyecto

Son **dos productos en uno**, con la misma identidad visual pero ergonomía opuesta. Una pantalla de inicio (`/`) permite elegir el rol y dirige a cada interfaz.

### App Ciudadano (móvil, PWA instalable)

Diseño *mobile-first* con barra de navegación inferior de 4 pestañas.

| Pantalla | Ruta | Función |
|---|---|---|
| Home | `/ciudadano` | Mapa con ~12.000 contenedores reales (clustering de marcadores), filtros por tipo, buscador de calles, "mi ubicación", selector de estilo de mapa y planificador de rutas a pie |
| Reportar | `/ciudadano/reportar` | Capturar foto opcional, detectar GPS y contenedores cercanos, y enviar una incidencia |
| Mis incidencias | `/ciudadano/incidencias` | Lista de reportes propios, con estado, edición y borrado |
| Ranking | `/ciudadano/ranking` | Clasificación de ciudadanos y barrios por puntos |
| Cuenta | `/ciudadano/cuenta` | Perfil y estadísticas personales (enviadas / resueltas) |
| Acceso | `/ciudadano/login`, `/ciudadano/register` | Inicio de sesión y registro simulados (PMV, sin auth real) |

### Panel Municipal (escritorio, responsive)

Diseño *web-first* de alta densidad, tipo visor de datos institucional.

| Vista | Ruta | Función |
|---|---|---|
| Cuadro de mandos | `/municipal` | KPIs y gráficos Recharts (por estado, tipo, contenedor, zonas) sobre datos reales |
| Mapa analítico | `/municipal/mapa` | Mapa con capas: pines, **mapa de calor**, intensidad por zona y rutas de camiones |
| Análisis temporal | `/municipal/temporal` | Distribución de incidencias por hora del día |
| Lista / gestión | `/municipal/lista` | Tabla filtrable; cambio de estado, asignación y comentarios |

---

## 3. Uso y utilidad

- **Para la ciudadanía**: una vía rápida y visual para avisar de problemas en los contenedores de su barrio y hacer seguimiento de sus reportes hasta la resolución.
- **Para el personal municipal**: un cuadro de mandos que transforma avisos sueltos en información accionable —detección de **puntos calientes**, priorización automática, asignación a equipos y base para **optimizar las rutas de recogida**.
- **Valor para la ciudad**: menos contenedores desatendidos, recogida más eficiente y un canal de participación ciudadana medible.

---

## 4. Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| **Next.js** | 13.4 (pages router) | Framework full-stack: front + API en un solo proyecto |
| **React** | 18.2 | Capa de interfaz |
| **TypeScript** | 5.2 | Tipado estático en todo el código |
| **better-sqlite3** | 12.x | Base de datos SQLite embebida, síncrona y sin servidor |
| **Leaflet** + leaflet.heat | 1.9 | Mapas interactivos y mapa de calor |
| **next-pwa** | 5.6 | Service worker (Workbox), app instalable y offline-ready |
| **exifr** / **idb** | — | Lectura de EXIF de fotos y utilidades de almacenamiento en cliente |

### Por qué Next.js

Para un hackathon, Next.js con el **pages router** es la opción más eficiente:

- **Front y back en un solo proyecto**: las rutas de `src/pages/api/` son endpoints de backend que conviven con las páginas de la interfaz. No hace falta montar ni desplegar un servidor aparte.
- **Routing por sistema de archivos**: cada archivo en `src/pages/` es una ruta; no hay configuración de rutas manual.
- **SSR/SSG integrados** y recarga en caliente, lo que acelera la iteración durante el desarrollo.
- **Despliegue sencillo** con un único `npm run build` / `npm start`.
- Combinado con **SQLite vía better-sqlite3** se obtiene una base de datos real sin instalar nada, y con **next-pwa** la app se vuelve instalable en el móvil sin esfuerzo extra.

---

## 5. Estructura de carpetas

```
tecnohackBasuras/
├── data/                  # Base de datos SQLite (autogenerada, gitignored)
├── public/                # Estáticos: manifest PWA, iconos, service worker
├── src/
│   ├── pages/             # Rutas (pages router) y API
│   │   ├── index.tsx          # Landing: selección de rol
│   │   ├── _app.tsx           # Wrapper global y estilos
│   │   ├── _document.tsx      # Meta tags PWA
│   │   ├── ciudadano/         # Páginas de la app ciudadano
│   │   ├── municipal/         # Páginas del panel municipal
│   │   └── api/               # Endpoints backend (reports, bins, stats, me)
│   ├── components/        # Componentes React
│   │   ├── ui/                # Primitivas e iconos compartidos
│   │   ├── citizen/           # Layout y navegación de la app ciudadano
│   │   ├── municipal/         # Shell y panel de detalle del panel municipal
│   │   └── MapView.tsx        # Componente de mapa Leaflet
│   ├── lib/               # Lógica compartida: constantes, tema, prioridad,
│   │                      #   captura de foto, almacenamiento, pines
│   ├── server/            # Capa de servidor
│   │   └── db.ts              # SQLite: esquema, semilla y consultas
│   ├── hooks/             # Hooks de datos (useReports, useBins, useMe)
│   └── types/             # Tipos TypeScript del dominio
├── next.config.js         # Config de Next.js + next-pwa
├── tsconfig.json          # Config de TypeScript (alias @/* → src/*)
└── package.json
```

### Cómo conviven front y API

El **pages router** mapea cada archivo a una ruta:

- Los archivos `.tsx` bajo `src/pages/` (salvo `api/`) son **páginas** que se renderizan en el navegador. Ej.: `src/pages/ciudadano/index.tsx` → `/ciudadano`. Los corchetes indican rutas dinámicas: `src/pages/ciudadano/incidencias/[id].tsx` → `/ciudadano/incidencias/:id`.
- Los archivos bajo `src/pages/api/` son **API routes**: funciones que se ejecutan solo en el servidor y exponen un endpoint HTTP. Ej.: `src/pages/api/reports/index.ts` → `GET/POST /api/reports`.

Así, **front y back viven en el mismo proyecto**: la interfaz consume sus propios endpoints de `/api`, que a su vez hablan con SQLite a través de `src/server/db.ts`. La carpeta `data/` (la base de datos) está en `.gitignore` porque se regenera sola.

---

## 6. Cómo funciona

```
Ciudadano ──reporta (foto + GPS)──► API /api/reports ──► SQLite (data/ecochicharro.db)
                                                              │
Personal municipal ──gestiona estado/asignación/comentarios──┘
```

1. El ciudadano captura una foto de un contenedor con problema; la app detecta su ubicación por GPS y asigna automáticamente una **prioridad** según el tipo de incidencia (p. ej. *quemado* → alta).
2. El reporte se envía a `/api/reports` y se guarda en **SQLite**.
3. El personal municipal lo ve en el panel: cambia su estado (*pendiente → en proceso → resuelto*), lo asigna a un equipo y añade comentarios de resolución.
4. El ciudadano ve el estado actualizado y el comentario de resolución en *Mis incidencias*.

**Base de datos autogenerada y sembrada.** En el primer arranque, `src/server/db.ts` crea el archivo `data/ecochicharro.db`, define el esquema y lo siembra con datos de ejemplo de Santa Cruz de Tenerife: **8 contenedores** (uno por cada tipo de residuo), **12 incidencias** en distintos estados y zonas, y comentarios de resolución. No hay que configurar nada.

---

## 7. Endpoints de la API

Todos viven en `src/pages/api/` y hablan con SQLite vía `src/server/db.ts`.

| Endpoint | Métodos | Función |
|---|---|---|
| `/api/reports` | `GET`, `POST` | Listar reportes (con filtros) / crear uno nuevo |
| `/api/reports/:id` | `GET`, `PUT`, `PATCH`, `DELETE` | Detalle; `PUT` edición ciudadana, `PATCH` gestión municipal, borrado |
| `/api/reports/:id/comments` | `GET`, `POST` | Comentarios de un reporte |
| `/api/bins` | `GET` | Listar contenedores (filtros por tipo, bbox, búsqueda; `?count=1`) |
| `/api/bins/:id` | `GET` | Detalle de un contenedor |
| `/api/stats` | `GET` | Estadísticas agregadas para el cuadro de mandos |
| `/api/me` | `GET` | Usuario por defecto y sus estadísticas personales |
| `/api/leaderboard` | `GET` | Clasificación de ciudadanos y barrios por puntos |
| `/api/geocode` | `GET` | Proxy de geocodificación sobre Nominatim (`?q=...`) |
| `/api/uploadthing` | `GET`, `POST` | Subida de fotos vía UploadThing |

---

## 8. Cómo arrancar

Requisito: **Node.js** instalado (probado con la v24).

```bash
# 1. Instalar dependencias
npm install

# 2. Servidor de desarrollo (recarga en caliente; PWA desactivada)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y elige un rol.

```bash
# Build de producción + PWA completa
npm run build
npm start
```

En desarrollo el service worker está deshabilitado a propósito (`disable: NODE_ENV === 'development'` en `next.config.js`); para probar la PWA instalable usa `npm run build` + `npm start`.

La subida de fotos requiere la variable de entorno `UPLOADTHING_SECRET` (UploadThing). Sin ella, los reportes con foto fallan; los reportes sin foto siguen funcionando.

---

## 9. Notas y limitaciones del PMV

Al ser un prototipo de hackathon, hay simplificaciones deliberadas:

- **Sin autenticación real**: el login y el registro son simulados; el rol elegido se guarda en `localStorage` y todos los reportes se asocian a un usuario por defecto (`user-maria`).
- **Base de datos local**: SQLite en `data/ecochicharro.db`, autogenerada y sembrada en el primer arranque. La carpeta `data/` está en `.gitignore`.
- **Geocodificación con límites**: `/api/geocode` usa Nominatim (OpenStreetMap), que limita la frecuencia de peticiones; el endpoint cachea resultados en memoria para mitigarlo.
- La subida de fotos depende de un servicio externo (UploadThing) y de su clave de entorno.

---

## 10. Cómo queremos ampliarlo

Líneas de evolución previstas más allá del hackathon:

- **Autenticación real** de ciudadanos y personal, sustituyendo el usuario por defecto actual.
- **Roles y permisos municipales** (administrador, supervisor de zona, equipos de campo) con vistas y acciones diferenciadas.
- **Notificaciones push** al ciudadano cuando su incidencia cambia de estado, y al municipio ante avisos de alta prioridad.
- **Rutas de recogida optimizadas**: cálculo automático de itinerarios a partir de los puntos calientes y la prioridad de las incidencias.
- **Migración de base de datos** de SQLite a PostgreSQL/PostGIS para escalar a producción y soportar consultas geoespaciales.
- **App nativa** (o capa nativa sobre la PWA) para mejor acceso a cámara, GPS y notificaciones.
- **Integración con sistemas del Cabildo de Tenerife** y datos abiertos municipales (callejero oficial, inventario real de contenedores).
- **Analítica avanzada**: predicción de saturación de contenedores e indicadores de tiempo de resolución por equipo.
- **Accesibilidad e idiomas**: revisión de contraste y soporte multilingüe.

---

*EcoChicharro · Hackathon · Santa Cruz de Tenerife · Cabildo de Tenerife*
