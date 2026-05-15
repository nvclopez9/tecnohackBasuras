# EcoChicharro

PWA mobile-first para tomar fotos geolocalizadas y visualizarlas como burbujas en un mapa interactivo.

## Características

- **Cámara integrada** — abre la cámara trasera del móvil directamente desde el navegador
- **Geolocalización automática** — cada foto se etiqueta con las coordenadas GPS del momento
- **Mapa Leaflet** — vista de mapa completa con tus fotos como burbujas circulares
- **Lightbox** — pulsa cualquier burbuja para ver la foto a tamaño completo con navegación Anterior / Siguiente
- **Almacenamiento local** — las fotos se guardan en IndexedDB del navegador (sin servidor, sin cuenta)
- **Instalable** — funciona como app nativa (PWA) en Android e iOS

## Stack

| Tecnología | Uso |
|---|---|
| Next.js 13 | Framework (pages router) |
| TypeScript | Tipado estático |
| Leaflet | Mapa interactivo |
| idb | IndexedDB tipado |
| next-pwa | Service worker (Workbox) |

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (sin service worker)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Producción con PWA completa

```bash
npm run build
npm start
```

En Chrome: DevTools → Application → Service Workers para verificar que está activo.

## Uso en móvil

1. Sirve la app con `npm start` y accede desde la misma red local (o usa un túnel HTTPS como [ngrok](https://ngrok.com/))
2. En Chrome Android: menú → *Añadir a pantalla de inicio*
3. La app se abre en modo pantalla completa sin barra de navegación

## Estructura del proyecto

```
src/
├── types/index.ts          # PhotoEntry, LightboxState
├── hooks/usePhotos.ts      # CRUD sobre IndexedDB
├── components/
│   ├── CameraButton.tsx    # Captura de foto + compresión + GPS
│   ├── MapView.tsx         # Mapa Leaflet con marcadores burbuja
│   └── PhotoLightbox.tsx   # Modal con navegación prev/next
├── pages/
│   ├── _document.tsx       # Meta tags PWA
│   ├── _app.tsx            # CSS globales + Leaflet CSS
│   └── index.tsx           # Página principal
└── styles/globals.css
```

## Control de versiones

Historial de commits por fase:

```
feat: add PWA manifest and SVG icons
feat: add pages and global styles
feat: add CameraButton, MapView and PhotoLightbox components
feat: add PhotoEntry types and usePhotos IndexedDB hook
chore: init project with Next.js 13 + Leaflet + PWA config
```

## Notas

- Las fotos se comprimen a máximo 800 px antes de guardarse (~100–300 KB cada una)
- El thumbnail del marcador es un cuadrado de 80×80 px para que el mapa sea fluido
- En desarrollo el service worker está desactivado (`disable: NODE_ENV === 'development'`)
- Para iconos en producción, reemplaza los SVG de `public/icons/` por PNGs reales (usa `pwa-asset-generator`)
