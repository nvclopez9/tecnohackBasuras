# Sistema de Diseño — EcoChicharro

> Referencia del sistema de diseño **tal como está implementado** en el código.
> Cualquier desarrollador que amplíe el proyecto debe seguir estos tokens, componentes y
> patrones para mantener la coherencia visual. Los valores aquí documentados se extraen
> directamente del repositorio: `src/lib/theme.ts`, `src/lib/constants.ts`,
> `src/components/ui/`, `src/lib/pin.ts` y `src/styles/globals.css`.

---

## 1. Identidad

**EcoChicharro** es una PWA de gestión de incidencias en contenedores de basura de
**Santa Cruz de Tenerife**. El nombre juega con "chicharro", gentilicio popular de la ciudad.

La estética es **institucional, limpia y orientada al dato**, inspirada en los visores de
datos gubernamentales (tipo *infoDANA Recuperación*): mucho blanco, líneas finas, sin
gradientes llamativos ni decoración superflua. El mapa es siempre el protagonista.

La marca se construye alrededor del **azul institucional del Cabildo de Tenerife
(PANTONE 301)**, implementado como `#005A9C`. El logotipo en la interfaz es un cuadrado
azul con las iniciales "Ec" en blanco (radio 6 px) — ver `MunicipalShell.tsx` (Topbar).

Es un único producto con **dos interfaces de ergonomía opuesta** pero tono visual común:
la app del **ciudadano** (móvil, espaciosa, táctil) y el **panel municipal** (escritorio,
denso, multipanel).

---

## 2. Paleta de color

Todos los tokens viven en `src/lib/theme.ts` (objeto `THEME`) y un subconjunto se replica
como variables CSS en `:root` dentro de `src/styles/globals.css`.

**Regla de oro:** el color se usa **con intención** — para comunicar estado, tipo o alerta.
Nunca como decoración. La base de toda pantalla es neutra (blanco / gris claro).

### 2.1. Azules de marca

| Token (`THEME`) | Hex | Variable CSS | Uso |
|---|---|---|---|
| `primary` | `#005A9C` | `--primary` | Acciones primarias, navegación activa, marca, estado "En proceso" |
| `primaryDark` | `#004B87` | `--primary-dark` | Hover/pressed, botón central activo de la barra |
| `primaryDeep` | `#00345E` | — | Azul noche; énfasis fuerte / texto sobre claro |
| `primarySoft` | `#1F6FB2` | — | Azul medio; también color del contenedor "Papel" |
| `primaryTint` | `#D6E6F2` | `--primary-tint` | Fondo de selección: chips activos, fila activa, navegación activa |
| `primaryMist` | `#EEF4F9` | `--primary-mist` | Fondo de paneles informativos muy sutiles |
| `primarySky` | `#4A9BD4` | — | Azul cielo; iconos informativos, gráficos |

### 2.2. Neutros

| Token (`THEME`) | Hex | Variable CSS | Uso |
|---|---|---|---|
| `appBg` | `#F6F8FA` | `--app-bg` | Fondo general de la aplicación |
| `surface` | `#FFFFFF` | `--surface` | Tarjetas, paneles, barras, superficies |
| `border` | `#E2E6EA` | `--border` | Bordes de tarjeta y líneas divisorias |
| `borderSoft` | `#EEF2F5` | `--border-soft` | Separadores internos muy suaves |
| `ink` | `#1C2530` | `--ink` | Texto principal y títulos |
| `inkMid` | `#6B7480` | `--ink-mid` | Texto secundario, etiquetas, iconos inactivos |
| `inkLight` | `#A8B0B8` | `--ink-light` | Placeholders, estados deshabilitados |

### 2.3. Semánticos (estado / feedback)

| Token (`THEME`) | Hex | Uso |
|---|---|---|
| `success` | `#2E8B57` | Éxito, confirmaciones, estado "Resuelto" |
| `warn` | `#E8A317` | Aviso, estado "Pendiente", prioridad "Media" |
| `danger` | `#C0392B` | Error, prioridad "Alta", botón destructivo |

### 2.4. Colores de tipo de contenedor (8)

Definidos en `CONTAINERS` (`src/lib/constants.ts`). Se usan **solo** en pines de mapa,
chips de tipo, leyendas y badges redondos — **nunca como fondo de pantalla**. Saturación
moderada para convivir con el azul institucional.

| Tipo | Etiqueta | Hex | Icono |
|---|---|---|---|
| `organico` | Orgánico | `#8C5A2B` | `leaf` |
| `envases` | Envases | `#F2B100` | `bottle` |
| `papel` | Papel | `#1F6FB2` | `news` |
| `vidrio` | Vidrio | `#2E8B57` | `bottle` |
| `resto` | Resto | `#5C6670` | `bag` |
| `ropa` | Ropa | `#E07A2C` | `shirt` |
| `aceite` | Aceite | `#C99700` | `drop` |
| `baterias` | Baterías | `#A4243B` | `battery` |

### 2.5. Colores de estado

Definidos en `STATUSES`. Se muestran como **badges** (texto + fondo del color a baja
opacidad) o como punto de color.

| Estado | Etiqueta | Hex |
|---|---|---|
| `pendiente` | Pendiente | `#E8A317` |
| `en_proceso` | En proceso | `#005A9C` |
| `resuelto` | Resuelto | `#2E8B57` |

### 2.6. Colores de prioridad

Definidos en `PRIORITIES`. La prioridad se asigna automáticamente según el tipo de
incidencia (ver `INCIDENTS`) y se muestra como etiqueta pequeña con punto de color.

| Prioridad | Etiqueta | Hex |
|---|---|---|
| `baja` | Baja | `#5A8FA8` |
| `media` | Media | `#E8A317` |
| `alta` | Alta | `#C0392B` |

---

## 3. Tipografía

La familia es **Inter** (con fallback a la pila de sistema), declarada en `globals.css`:
`'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`. Una sola familia para
todo. Render con `-webkit-font-smoothing: antialiased`.

Las cifras de KPI y tablas usan **números tabulares** (`fontVariantNumeric: 'tabular-nums'`)
para alineación limpia.

Escala usada en el código (los tamaños son los valores reales de las primitivas):

| Token | Tamaño | Peso | Uso |
|---|---|---|---|
| Display | 28 px | 700 | Valor numérico grande de la `KPI` card |
| H1 | 24 px | 700 | Título de pantalla / sección |
| H2 | 20 px | 600 | Título de panel / subsección |
| H3 | 14–16 px | 600–700 | Título de tarjeta, nombre de marca en topbar |
| Body | 13–14 px | 400–500 | Texto general, navegación, filas |
| Caption | 11.5–12.5 px | 500–600 | Etiquetas, controles de mapa, leyendas |
| Micro | 10.5–11 px | 500–700 | Etiquetas de barra de navegación, badges, sobre-títulos |

Las etiquetas cortas en mayúsculas usan `letter-spacing` ligero (`0.2`–`0.6`) — por
ejemplo el sobre-título "Panel Municipal" o las etiquetas de `Badge` y `KPI`.

---

## 4. Componentes (primitivas)

Todas las primitivas viven en `src/components/ui/primitives.tsx` y aplican estilos inline
a partir de `THEME`. Radio de borde estándar: **8 px** en botones/tarjetas, **999 px**
(pastilla) en chips y elementos redondos, **6 px** en badges.

### Button
`kind`: `primary` | `secondary` | `tertiary` | `ghost` | `danger`.
`size`: `sm` (alto 32) | `md` (alto 40) | `lg` (alto 48). Radio 8 px, peso 600.
Acepta `icon`, `full` (ancho 100%) y `disabled` (opacidad 0.5).

| `kind` | Fondo | Texto | Borde |
|---|---|---|---|
| `primary` | `#005A9C` | blanco | azul |
| `secondary` | blanco | azul | azul |
| `tertiary` | transparente | azul | sin borde |
| `ghost` | blanco | tinta | gris borde |
| `danger` | transparente | rojo | rojo |

### Chip
Pastilla de filtro (radio 999 px). `size`: `sm` | `md`. Estado `active` → fondo
`primaryTint` y borde/texto `primary`; inactivo → fondo blanco, borde gris.
Admite `dotColor` (punto de color a la izquierda, 8 px) e `icon`.

### ContainerChip
`Chip` especializado: recibe un `ContainerType` y pinta automáticamente la etiqueta y el
punto de color del contenedor (vía `containerMeta`).

### Badge
Etiqueta de estado en mayúsculas, radio 6 px, peso 600. Fondo = `color + '22'`
(el color al ~13% de opacidad), texto en el color pleno. `size`: `sm` | `md`. Admite `icon`.

### PriorityTag
Texto "Prioridad {nivel}" en `inkMid` precedido de un punto de 7 px con el color de
prioridad. `size`: `sm` | `md`. Sin fondo.

### KPI
Tarjeta de estadística: superficie blanca, borde gris, radio 8 px, padding `14px 16px`.
Etiqueta en mayúsculas (`inkMid`, 11.5 px) + valor grande (28 px, peso 700, números
tabulares). Opcionalmente `sub` (texto secundario) y `trend` (flecha ▲/▼ verde/roja).
`accent` permite teñir el valor.

### MapBtn
Botón flotante para controles de mapa: fondo blanco (o `primaryTint` si `active`), borde
gris, radio 8 px, sombra `0 1px 4px rgba(0,0,0,.08)`. Con `label` lleva padding `8px 12px`;
sin label es cuadrado (padding 9, solo icono).

### ContainerIconBadge
Insignia redonda (radio 999 px) con el icono del contenedor. Fondo = `color + '22'`,
icono en el color pleno. Tamaño configurable (por defecto 28 px); el icono ocupa el 55%.

---

## 5. Iconografía

El componente `Icon` (`src/components/ui/Icon.tsx`) dibuja iconos SVG de trazo
(`viewBox 0 0 24 24`, `fill: none`, `strokeWidth` 1.7 por defecto, extremos redondeados).
Props: `name`, `size` (por defecto 18), `color` (`currentColor` por defecto), `stroke`.

**Set completo de iconos** (`IconName`):
`home`, `camera`, `list`, `user`, `search`, `pin`, `locate`, `layers`, `filter`,
`chevron-r`, `chevron-d`, `arrow-l`, `arrow-r`, `check`, `x`, `edit`, `trash`, `image`,
`gallery`, `flash`, `flip`, `bell`, `globe`, `help`, `logout`, `route`, `leaf`, `bottle`,
`flame`, `shirt`, `drop`, `battery`, `bag`, `news`, `question`, `plus`, `export`, `sort`,
`cluster`, `dot`, `menu`, `kebab`, `send`.

**Icono por tipo de contenedor** (mapa `CONTAINER_ICON`, función `containerIconName`):

| Tipo | Icono |
|---|---|
| organico | `leaf` |
| envases | `bottle` |
| papel | `news` |
| vidrio | `bottle` |
| resto | `bag` |
| ropa | `shirt` |
| aceite | `drop` |
| baterias | `battery` |

**Icono por tipo de incidencia** (en `INCIDENTS`): lleno → `bag`, roto → `edit`,
sucio → `drop`, quemado → `flame`, desaparecido → `question`.

---

## 6. Mapa y pines

El mapa usa **Leaflet** con tiles claros tipo *Carto/positron* (base gris-blanca neutra
para que pines y heatmap destaquen). El `divIcon` de Leaflet se limpia en `globals.css`
(`.leaflet-div-icon` sin fondo ni borde); el contenedor de mapa hereda la familia Inter.
El centro por defecto es Plaza de España, Santa Cruz de Tenerife
(`SC_TENERIFE = { lat: 28.4682, lng: -16.2546 }` en `theme.ts`).

**Pines** (`src/lib/pin.ts`, función `pinHtml`): forma de **gota** SVG, relleno con el
**color del tipo de contenedor**, círculo blanco interior con el **icono del contenedor**
en el color del tipo. Tamaño base 32 px (alto = 1.25× el ancho). Opciones:

- `status` → **anillo de estado**: punto de 10 px, color del estado, borde blanco, en la
  esquina superior derecha del pin.
- `selected` → sombra más marcada (`drop-shadow(0 4px 10px rgba(0,0,0,.3))`) y aro de
  realce alrededor del círculo. Por defecto la sombra es `0 2px 4px rgba(0,0,0,.22)`.
- `faded` → opacidad 0.45 (pin atenuado al filtrar).

**Clústeres** (`clusterHtml`): círculo de 38 px, fondo `#005A9C`, número en blanco
(peso 700), borde blanco translúcido y sombra suave.

**Heatmap**: capa de puntos calientes en el mapa analítico municipal, con gradiente
frío→caliente (azul → ámbar → rojo) para identificar hot spots.

---

## 7. Layout y espaciado

**Radios de borde:** 8 px (botones, tarjetas, KPI, MapBtn), 6 px (badges, logo, items de
navegación), 3 px (checkbox), 999 px (chips, pines de color, avatares, botón central).

**Sombras (las reales del código):**
- Tarjeta de marco del ciudadano: `0 0 40px rgba(0,0,0,.12)`.
- Barra inferior: `0 -2px 12px rgba(0,0,0,.04)`.
- Botón central de la barra: `0 4px 12px rgba(0,90,156,.32)`.
- Control de mapa (`MapBtn`): `0 1px 4px rgba(0,0,0,.08)`.
- Drawer móvil del panel municipal: `4px 0 24px rgba(0,0,0,.2)`.

**Espaciado:** padding interno de tarjeta `14–16 px`; gaps entre elementos `4–10 px`;
secciones de filtro separadas con borde `borderSoft` y `padding-bottom` 12 px.

### Marco del ciudadano (mobile-first)
`CitizenLayout.tsx`: marco fijo centrado, `maxWidth: 480 px`, fondo `appBg`, sombra de
marco, sobre un fondo gris `#dde4ea` (simula dispositivo en pantallas anchas). La barra
inferior `BottomNav` es absoluta abajo. `NAV_HEIGHT = 80` px reserva el espacio de la
barra. El viewport usa `viewport-fit=cover` para respetar el área segura inferior.

`BottomNav` — 4 pestañas: **Inicio** (`home`), **Reportar** (`camera`, pestaña central
destacada), **Mis reportes** (`list`), **Cuenta** (`user`). Fondo blanco, borde superior
fino, `paddingBottom: 16` (área segura). Pestaña activa en `primary`; inactiva en `inkMid`.
La pestaña central "Reportar" es un **botón circular elevado** de 44 px (fondo `primary`,
o `primaryDark` si activo), con borde blanco de 3 px y `marginTop: -16` para sobresalir.

### Layout del panel municipal (web-first)
`MunicipalShell.tsx`: columna fija a pantalla completa.
- **Topbar** de 56 px: logo "Ec", título "EcoChicharro" + sobre-título "Panel Municipal",
  divisor, texto institucional ("Cabildo Insular de Tenerife · Servicios de Limpieza"),
  buscador global y avatar de usuario. En móvil se reduce y aparece un botón de menú.
- **Sidebar** izquierda de 270 px: navegación (Cuadro de mandos, Mapa analítico,
  Incidencias) + filtros colapsables (tipo de contenedor, estado, prioridad, zona) con
  contadores. Item de navegación activo con fondo `primaryTint`.
- **Área central** flexible para el contenido de cada vista.

---

## 8. Responsive

El breakpoint es **900 px**, gestionado por el hook `useIsMobile` (`src/hooks/useIsMobile.ts`),
que usa `matchMedia('(max-width: 899px)')` y devuelve `false` durante SSR.

La app del ciudadano es mobile-first y no necesita adaptación (marco fijo de 480 px de ancho).

El **panel municipal** sí se adapta por debajo de 900 px:
- La **sidebar fija desaparece** y su contenido (navegación + filtros) pasa a un
  **drawer** lateral que se abre con el botón de menú de la topbar.
- El drawer ocupa el 84% del ancho (máx. 300 px), sobre un **overlay** semitransparente
  (`rgba(0,0,0,.4)`); se cierra al pulsar fuera o al navegar.
- La topbar se compacta: oculta el texto institucional, el buscador y los datos de usuario,
  dejando solo logo y avatar.
- El drawer se cierra automáticamente al volver al modo escritorio.

Las vistas densas (tablas, dashboard) se reorganizan en tarjetas apiladas en móvil.

---

## 9. Principios de diseño

1. **El mapa es el protagonista.** En ambas interfaces el mapa ocupa la mayor superficie
   posible; la UI flota y se apoya sobre él, no lo tapa.
2. **Color con intención.** El color comunica significado —estado, tipo de contenedor,
   alerta— y nunca es decorativo. La base de toda pantalla es neutra (blanco / gris claro)
   con el azul institucional como único sello de marca.
3. **Densidad opuesta entre las dos interfaces.** El ciudadano es **espacioso y táctil**
   (una tarea por pantalla, áreas de toque grandes, barra inferior de 4 pestañas). El
   municipal es **denso y orientado al dato** (multipanel, tablas, KPIs, filtros).
4. **Consistencia entre dispositivos.** Misma paleta, iconografía y primitivas
   (`Chip`, `Badge`, `Button`, pines) en móvil y escritorio.
5. **Nunca depender solo del color.** Los estados y tipos siempre combinan color con icono
   y/o texto, para garantizar accesibilidad.
6. **Contenedores sobrios.** Superficie blanca sobre fondo gris claro, borde fino *o*
   sombra muy difusa, esquinas con radio moderado; sin gradientes ni adornos.
