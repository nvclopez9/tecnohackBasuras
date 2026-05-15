# Brief de Diseño — EcoChicharro

> Documento de dirección de diseño para generar la interfaz visual del proyecto en **Claude Design**.
> Escrito para que un diseñador o IA pueda producir directamente las pantallas y componentes.

---

## 1. Resumen del proyecto

**EcoChicharro** es una **PWA de gestión de incidencias en contenedores y papeleras de basura**, desarrollada para un hackathon en **Tenerife (España)**. El nombre juega con "chicharro", gentilicio popular de Santa Cruz de Tenerife.

**Propósito.** Cerrar el ciclo entre el ciudadano que detecta un problema en la vía pública (un contenedor desbordado, roto, quemado o desaparecido) y el personal municipal que gestiona la recogida y el mantenimiento. El ciudadano reporta con foto y geolocalización; el municipio analiza, prioriza y optimiza rutas a partir de los datos agregados.

**Dos productos en uno**, con tono visual común pero ergonomía opuesta:

| | App Ciudadano | Panel Municipal |
|---|---|---|
| Plataforma | Móvil (PWA instalable) | Escritorio / pantalla grande |
| Enfoque | Acción rápida en la calle | Análisis y toma de decisiones |
| Densidad | Baja, una tarea por pantalla | Alta, multipanel orientado a datos |
| Navegación | Barra inferior de 4 pestañas | Layout de escritorio con paneles laterales |

Ambos comparten **identidad institucional del Cabildo de Tenerife**: limpio, ordenado, fiable, centrado en el dato y el mapa.

---

## 2. Dominio de datos

Estos valores deben representarse de forma consistente en ambas interfaces (chips, leyendas de mapa, filtros, iconos).

### 2.1. Tipos de contenedor (8)
Cada tipo tiene un color propio para pines de mapa, chips y leyendas.

| Tipo | Color | Hex | Icono sugerido |
|---|---|---|---|
| Orgánico | Marrón | `#8C5A2B` | Hoja / restos |
| Envases | Amarillo | `#F2B100` | Botella plástico |
| Papel / cartón | Azul medio | `#1F6FB2` | Periódico |
| Vidrio | Verde | `#2E8B57` | Botella |
| Resto | Gris oscuro | `#5C6670` | Bolsa genérica |
| Ropa | Naranja | `#E07A2C` | Camiseta |
| Aceite | Ocre / dorado | `#C99700` | Gota |
| Baterías | Rojo granate | `#A4243B` | Pila |

> Nota: estos colores se mantienen "de marca de reciclaje" para que sean reconocibles, pero se usan con saturación moderada para no chocar con la base azul institucional. Se aplican como pin/chip, nunca como fondo de pantalla.

### 2.2. Tipos de incidencia (5)
| Incidencia | Icono sugerido | Prioridad automática por defecto |
|---|---|---|
| Lleno / desbordado | Contenedor rebosando | Media |
| Roto / dañado | Grieta / herramienta | Media |
| Sucio / mal olor | Gotas / ondas de olor | Baja |
| Quemado / vandalizado | Llama / spray | Alta |
| Desaparecido / desplazado | Pin tachado / flecha | Alta |

### 2.3. Estados y prioridad
| Estado | Color | Hex |
|---|---|---|
| Pendiente | Ámbar | `#E8A317` |
| En proceso | Azul institucional | `#005A9C` |
| Resuelto | Verde | `#2E8B57` |

| Prioridad | Color | Hex |
|---|---|---|
| Baja | Verde azulado suave | `#5A8FA8` |
| Media | Ámbar | `#E8A317` |
| Alta | Rojo | `#C0392B` |

La prioridad se asigna **automáticamente** según el tipo de incidencia; se muestra como etiqueta pequeña, nunca editable por el ciudadano.

---

## 3. Interfaz 1 — App Ciudadano (mobile-first, PWA)

Diseño **mobile-first**. Lienzo de referencia: 390 × 844 px (iPhone 13/14). Debe escalar a 360 px de ancho como mínimo. Pensada para usarse con una mano, de pie en la calle.

### 3.1. Sistema de navegación
**Barra de navegación inferior fija**, siempre visible, con **4 pestañas** en este orden exacto:

```
┌─────────────────────────────────────────────┐
│                                             │
│            CONTENIDO DE LA PANTALLA         │
│                                             │
├─────────────────────────────────────────────┤
│   [Home]   [Cámara]   [Incidencias] [Cuenta]│  ← barra inferior fija
└─────────────────────────────────────────────┘
```

- Altura ~64 px + área segura inferior (safe-area-inset-bottom).
- Cada pestaña: icono + etiqueta corta debajo.
- Pestaña activa: icono y texto en **azul institucional `#005A9C`**, fondo de pastilla muy sutil; inactivas en gris neutro `#6B7480`.
- La pestaña **Cámara** puede destacarse ligeramente (icono central algo mayor o botón circular elevado) por ser la acción principal.
- Fondo de la barra: blanco `#FFFFFF` con borde superior fino `#E2E6EA` y sombra suave hacia arriba.

### 3.2. Pantalla 1 — Home (mapa de papeleras cercanas)
Objetivo: encontrar las papeleras/contenedores más cercanos.

- **Mapa a pantalla completa** como protagonista absoluto (ocupa todo el viewport salvo barra inferior).
- Cabecera flotante translúcida arriba: logo/título "EcoChicharro" + barra de búsqueda de ubicación o dirección.
- **Pines de contenedor** coloreados según el tipo (ver tabla 2.1). Agrupación en clústeres al alejar el zoom.
- **Chip-filtros horizontales** deslizables sobre el mapa (justo bajo la cabecera): "Todos", y uno por cada tipo de contenedor con su color. Multi-selección.
- Botón flotante circular "Mi ubicación" (centrar en GPS), abajo a la derecha sobre la barra.
- Al tocar un pin: **bottom sheet** que sube con ficha del contenedor — tipo, dirección, distancia, estado actual, botón "Reportar incidencia aquí" (lleva a la pestaña Cámara precargada).
- Leyenda de colores accesible (icono "i" o dentro del bottom sheet de filtros).

### 3.3. Pantalla 2 — Cámara de incidencias
Objetivo: sacar foto y reportar una incidencia. Flujo en pasos cortos.

1. **Vista de cámara** a pantalla completa con botón obturador grande circular abajo (azul institucional). Opción de subir foto desde galería.
2. Tras la captura: **formulario de reporte** en tarjeta scrollable con miniatura de la foto arriba:
   - Selector de **tipo de papelera/contenedor** (grid de 8 chips con color e icono).
   - Selector de **tipo de incidencia** (lista de 5 opciones con icono).
   - Ubicación detectada automáticamente por GPS, editable arrastrando un mini-mapa.
   - Campo de comentario opcional (texto libre).
   - Aviso de la **prioridad** que se asignará (etiqueta informativa, no editable).
3. Botón primario fijo abajo: **"Enviar incidencia"**. Confirmación con animación de éxito y resumen.

Mantener un paso visible por vez; usar barra de progreso o pasos numerados si se separa en varias vistas.

### 3.4. Pantalla 3 — Lista de incidencias (mis reportes)
Objetivo: ver y gestionar las incidencias creadas por el usuario.

- **Lista vertical de tarjetas**, una por incidencia, ordenada por fecha (más reciente arriba).
- Cada tarjeta de incidencia muestra:
  - Miniatura de la foto a la izquierda.
  - Tipo de contenedor (chip de color) + tipo de incidencia (icono + texto).
  - **Badge de estado**: Pendiente / En proceso / Resuelto (colores tabla 2.3).
  - Fecha y dirección abreviada.
  - Si está resuelta: bloque de **comentario de resolución** del municipio (cita con fondo verde muy suave).
- Filtros superiores por estado (chips: Todas / Pendientes / En proceso / Resueltas).
- Acciones por tarjeta: **editar** y **borrar** (swipe lateral o menú de tres puntos). Borrar pide confirmación en diálogo.
- Estado vacío ilustrado y amable cuando no hay incidencias ("Aún no has reportado nada").

### 3.5. Pantalla 4 — Cuenta
Objetivo: perfil y estadísticas personales.

- Cabecera con avatar/iniciales y **nombre de usuario**.
- **Tarjetas de estadística** (2 destacadas):
  - Incidencias enviadas (número grande).
  - Incidencias resueltas (número grande + porcentaje o barra de progreso).
- Posible insignia/nivel de "ciudadano colaborador" como gamificación ligera (opcional).
- Lista de ajustes: notificaciones, idioma, ayuda.
- Botón **"Cerrar sesión"** al final, en estilo secundario/destructivo discreto.

---

## 4. Interfaz 2 — Panel Municipal (web-first, escritorio)

Diseño **web-first** para pantalla grande. Lienzo de referencia: 1440 × 900 px, escalable hasta 1920 px. Alta densidad de información. Pensado para personal técnico que analiza y decide.

### 4.1. Sistema de navegación y layout
Layout de **escritorio con paneles**, inspirado en visores de datos institucionales:

```
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR: logo · EcoChicharro Panel Municipal · usuario/sesión  │
├────────────┬─────────────────────────────────┬───────────────┤
│            │                                 │               │
│  SIDEBAR   │        MAPA INTERACTIVO         │  PANEL DETALLE│
│  Filtros   │      (a pantalla / área)        │  / Dashboard  │
│            │      con pines y hot spots      │  tarjetas KPI │
│            │                                 │               │
├────────────┴─────────────────────────────────┴───────────────┤
│ LISTA DESPLEGABLE FILTRABLE de incidencias (tabla expandible) │
└──────────────────────────────────────────────────────────────┘
```

- **Topbar** fina (~56 px): logo institucional, título del panel, buscador global, usuario y cierre de sesión a la derecha.
- **Sidebar izquierda de filtros** (~280 px): bloques colapsables — rango de fechas, tipo de contenedor (8 checkboxes con color), tipo de incidencia (5), estado, prioridad, municipio/zona. Botón "Aplicar" y "Limpiar".
- **Mapa central** como elemento dominante: pines de incidencias, **mapa de calor (heatmap) de hot spots**, capas conmutables (incidencias / densidad / rutas propuestas).
- **Panel derecho contextual**: cuando no hay selección, muestra el **dashboard de KPIs**; al seleccionar una incidencia o zona, muestra su **ficha de detalle**.
- **Lista desplegable filtrable inferior**: tabla de incidencias que se puede contraer/expandir; sincronizada con el mapa y los filtros.

### 4.2. Vista — Cuadro de mandos (Dashboard)
Conjunto de **tarjetas de estadística (KPI cards)** y gráficos para sacar conclusiones:

- KPIs en fila: total de incidencias, pendientes, en proceso, resueltas, tiempo medio de resolución, % alta prioridad.
- Gráfico de **barras** por tipo de incidencia y por tipo de contenedor.
- Gráfico de **líneas / área** de evolución temporal de incidencias.
- Gráfico de **donut** de reparto por estado o por zona.
- **Ranking de hot spots**: lista de las zonas/calles con más incidencias.
- Cada gráfico en su tarjeta, con título, periodo y opción de exportar.

### 4.3. Vista — Mapa analítico
- Mapa grande con conmutador de capas: pines individuales, clústeres, **heatmap de puntos calientes**.
- Capa de **rutas de recogida propuestas** (líneas que conectan puntos prioritarios) para optimización.
- Filtros aplicados se reflejan en vivo.
- Tooltip al pasar sobre un pin; clic abre la ficha en el panel derecho.

### 4.4. Vista — Lista / detalle de incidencias
- **Tabla densa filtrable y ordenable**: columnas tipo, incidencia, estado, prioridad, fecha, zona, reportante.
- Fila expandible o panel lateral con: foto, mapa de ubicación, historial de estado, campo para **escribir el comentario de resolución** y cambiar estado/prioridad.
- Acciones masivas (cambiar estado de varias incidencias, asignar a ruta).

---

## 5. Dirección estética

### 5.1. Inspiración: visores institucionales tipo "infoDANA Recuperación"
La referencia es el visor gubernamental **infoDANA Recuperación** y, en general, los **visores de datos institucionales**: interfaces serias, ordenadas y orientadas al dato. Características a replicar:

- **El mapa es el centro de la experiencia**, ocupando la mayor superficie posible.
- **Paneles laterales de filtros** claros y agrupados, con jerarquía evidente.
- **Tarjetas de estadísticas / cifras** sobrias: número grande, etiqueta pequeña, sin adornos.
- **Puntos geolocalizados** y mapas de calor como lenguaje visual principal.
- Comparativas y datos cuantitativos presentados con honestidad y sin "marketing".
- Estética **institucional, limpia, neutra**: mucho blanco, líneas finas, azul corporativo como sello, ningún gradiente llamativo ni decoración superflua.

### 5.2. Principios visuales
1. **Mapa primero.** En ambas interfaces el mapa es protagonista; la UI se apoya y flota sobre él.
2. **Calma institucional.** Fondos neutros, contraste medido, color usado con intención (estado, tipo, alerta), no como decoración.
3. **Datos legibles.** Números grandes y claros, leyendas siempre presentes, jerarquía tipográfica fuerte.
4. **Consistencia entre dispositivos.** Misma paleta, iconografía y lenguaje de chips/badges en móvil y escritorio.
5. **Tarjetas y paneles** como contenedores: superficie blanca, esquina redondeada moderada, borde fino o sombra muy sutil.
6. **Accesibilidad.** Contraste AA mínimo; nunca depender solo del color (icono + texto en estados y tipos).

---

## 6. Paleta de color

Construida alrededor del **azul institucional del Cabildo de Tenerife (PANTONE 301)**, aproximado a `#005A9C`.

### 6.1. Azules institucionales (marca)
| Rol | Nombre | Hex | Uso |
|---|---|---|---|
| Primario | Azul Cabildo (PANTONE 301) | `#005A9C` | Acciones primarias, navegación activa, marca |
| Primario oscuro | Azul profundo | `#004B87` | Hover/pressed, topbar, énfasis |
| Primario muy oscuro | Azul noche | `#00345E` | Texto sobre claro, headers fuertes |
| Secundario | Azul medio | `#1F6FB2` | Enlaces, elementos secundarios, capa "papel" |
| Azul claro | Azul cielo | `#4A9BD4` | Iconos informativos, gráficos |
| Azul tinte | Azul bruma | `#D6E6F2` | Fondos de selección, chips suaves, hover de fila |
| Azul fondo | Azul niebla | `#EEF4F9` | Fondo de sección, paneles muy sutiles |

### 6.2. Neutros
| Rol | Nombre | Hex | Uso |
|---|---|---|---|
| Fondo app | Blanco roto | `#F6F8FA` | Fondo general de pantallas |
| Superficie | Blanco | `#FFFFFF` | Tarjetas, paneles, barras |
| Borde | Gris borde | `#E2E6EA` | Líneas divisorias, bordes de tarjeta |
| Texto principal | Gris tinta | `#1C2530` | Títulos y cuerpo principal |
| Texto secundario | Gris medio | `#6B7480` | Subtítulos, etiquetas, iconos inactivos |
| Texto deshabilitado | Gris claro | `#A8B0B8` | Placeholders, estados inactivos |

### 6.3. Acentos funcionales (estados y feedback)
| Rol | Hex | Uso |
|---|---|---|
| Éxito / Resuelto | `#2E8B57` | Estado resuelto, confirmaciones |
| Aviso / Pendiente | `#E8A317` | Estado pendiente, prioridad media |
| Error / Alta prioridad | `#C0392B` | Errores, prioridad alta, incidencias críticas |
| Info / En proceso | `#005A9C` | Estado en proceso (usa el azul primario) |

### 6.4. Colores de tipo de contenedor
Ver tabla 2.1. Se usan **solo** en pines de mapa, chips de tipo, leyendas y bordes de acento — nunca como fondo de pantalla. Saturación moderada para convivir con el azul institucional.

### 6.5. Colores de estado y prioridad
Ver tablas 2.3. Estados como **badges** (texto + fondo del color al 12-15% de opacidad + texto en el color pleno). Prioridad como **etiqueta pequeña** con punto de color.

---

## 7. Tipografía

- **Familia principal**: una sans-serif humanista, neutra e institucional. Recomendadas: **Inter**, **Source Sans 3** o **IBM Plex Sans** (esta última refuerza el aire de visor de datos). Una sola familia para todo.
- **Cifras / datos**: usar variante tabular (números de ancho fijo) en KPIs y tablas para alineación limpia.
- Escala tipográfica sugerida:

| Token | Tamaño | Peso | Uso |
|---|---|---|---|
| Display | 32–40 px | 700 | Números KPI grandes del dashboard |
| H1 | 24 px | 700 | Título de pantalla / sección |
| H2 | 20 px | 600 | Subsección, título de panel |
| H3 | 16 px | 600 | Título de tarjeta |
| Body | 14–15 px | 400 | Texto general |
| Caption | 12–13 px | 500 | Etiquetas, badges, leyendas |
| Micro | 11 px | 500 | Texto de barra de navegación |

- Interlineado cómodo (1.4–1.5 en cuerpo). Mayúsculas solo en etiquetas cortas con tracking ligero.

---

## 8. Tratamiento de componentes

### 8.1. Tarjetas y paneles
- Superficie blanca `#FFFFFF` sobre fondo `#F6F8FA`.
- Radio de esquina: **10–12 px** (móvil) / **8 px** (escritorio, más sobrio).
- Borde fino `#E2E6EA` **o** sombra muy difusa (`0 1px 3px rgba(0,0,0,0.06)`), no ambas.
- Padding interno generoso (16–20 px).
- Cabecera de tarjeta con título H3 + acción opcional alineada a la derecha.

### 8.2. Mapas
- Estilo de mapa **claro y neutro** (base gris/blanca tipo "light/positron"), sin saturación, para que pines y heatmap destaquen.
- Pines: forma de gota con icono de contenedor; color = tipo de contenedor; aro o badge pequeño = estado.
- Clústeres como círculos azules con número.
- Heatmap en gradiente azul→ámbar→rojo (frío a caliente) para hot spots.
- Controles de mapa (zoom, capas, ubicación) en botones blancos flotantes con sombra suave.

### 8.3. Gráficos y estadísticas
- Paleta de gráficos derivada de los azules (6.1) como serie principal; acentos funcionales para resaltar.
- Gráficos limpios: sin sombras 3D, sin degradados llamativos, rejilla fina gris, etiquetas legibles.
- KPI card: número Display + etiqueta Caption + indicador de tendencia opcional (flecha verde/roja).
- Tooltips blancos con borde fino.

### 8.4. Chips, badges y botones
- **Chips de filtro**: pastilla con borde; activo = relleno azul tinte `#D6E6F2` + texto/borde azul; los de tipo de contenedor llevan punto del color del tipo.
- **Badges de estado**: fondo del color de estado al 12-15%, texto en color pleno, icono pequeño.
- **Botón primario**: relleno `#005A9C`, texto blanco, radio 8 px; hover `#004B87`.
- **Botón secundario**: contorno azul sobre blanco.
- **Botón terciario/texto**: solo texto azul.
- **Destructivo**: texto/contorno en rojo `#C0392B`.
- Altura de toque mínima 44 px en móvil.

---

## 9. Inventario de componentes UI clave

**Comunes a ambas interfaces**
- Pin de mapa por tipo de contenedor (8 variantes) + estado.
- Clúster de mapa.
- Chip de filtro (neutro y con punto de color).
- Badge de estado (Pendiente / En proceso / Resuelto).
- Etiqueta de prioridad (Baja / Media / Alta).
- Tarjeta de incidencia (con foto, tipo, estado, fecha).
- KPI card / tarjeta de estadística.
- Bottom sheet / panel de detalle de incidencia.
- Botones (primario, secundario, terciario, destructivo, flotante circular).
- Leyenda de colores.
- Estado vacío ilustrado.
- Diálogo de confirmación.
- Toast / notificación de éxito y error.

**App Ciudadano**
- Barra de navegación inferior fija de 4 pestañas (Home, Cámara, Incidencias, Cuenta).
- Cabecera flotante translúcida con buscador.
- Fila de chip-filtros deslizable sobre el mapa.
- Botón flotante "Mi ubicación".
- Vista de cámara con obturador grande.
- Formulario de reporte por pasos (grid de tipos, selector de incidencia, mini-mapa, comentario).
- Tarjeta de incidencia con acciones editar/borrar (swipe o menú).
- Bloque de comentario de resolución (cita verde suave).
- Cabecera de perfil con avatar + estadísticas.

**Panel Municipal**
- Topbar institucional con buscador global y sesión.
- Sidebar de filtros con bloques colapsables (fechas, tipo, incidencia, estado, prioridad, zona).
- Mapa analítico con conmutador de capas (pines / heatmap / rutas).
- Panel derecho contextual (dashboard ↔ ficha de detalle).
- Tabla densa filtrable y ordenable, con filas expandibles.
- Conjunto de gráficos: barras, líneas/área, donut, ranking de hot spots.
- Ficha de gestión de incidencia (cambiar estado/prioridad, escribir comentario de resolución).
- Acciones masivas sobre la tabla.

---

## 10. Resumen para el diseñador

Genera **dos interfaces con la misma alma institucional** pero ergonomía opuesta: una **app móvil ciudadana** ligera, de una tarea por pantalla, con barra inferior de 4 pestañas y el mapa como protagonista; y un **panel municipal de escritorio** denso, multipanel, tipo visor de datos institucional (estilo infoDANA), con sidebar de filtros, mapa central con hot spots, dashboard de KPIs y tabla filtrable. Base de color: **azul Cabildo de Tenerife `#005A9C`** sobre neutros claros, con los colores de tipo de contenedor y de estado usados con disciplina solo donde aportan significado. Estética limpia, ordenada, fiable y orientada al dato.
