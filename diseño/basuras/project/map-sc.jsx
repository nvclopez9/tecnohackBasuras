// Stylized abstract map of Santa Cruz de Tenerife.
// Coastline on the right, main streets, plazas, park. Used in both
// ciudadano and municipal views. Pins are positioned via report.x/y
// (normalized 0..1) within the map area.
//
// Props:
//   width, height
//   variant: 'light' | 'positron' | 'satellite'  (visual style)
//   showStreetNames: bool
//   heatmap: bool
//   reports: array
//   selectedId: string
//   onPinClick: fn
//   showRoutes: bool

const SCMap = ({
  width = 360, height = 480,
  variant = 'light',
  showStreetNames = false,
  heatmap = false,
  reports = [],
  selectedId,
  onPinClick,
  showRoutes = false,
  pinSize = 28,
  showCluster = false,
}) => {
  // Style palette per variant
  const palettes = {
    light: {
      land: '#F1EEE6',
      land2: '#E8E3D6',
      water: '#CFE2EE',
      waterDeep: '#B7D2E0',
      road: '#FFFFFF',
      roadHi: '#FFFFFF',
      roadStroke: '#D9D2C2',
      park: '#CFE0BC',
      block: '#F7F4EC',
      blockStroke: '#E4DED0',
      text: '#6F6856',
      coast: '#9DBDD1',
    },
    positron: {
      land: '#F5F7F9',
      land2: '#ECEFF3',
      water: '#D9E8F0',
      waterDeep: '#C2D7E4',
      road: '#FFFFFF',
      roadHi: '#FFFFFF',
      roadStroke: '#E2E6EA',
      park: '#D8E6CC',
      block: '#FAFBFC',
      blockStroke: '#E6EAEE',
      text: '#7A848F',
      coast: '#B8CED8',
    },
    satellite: {
      land: '#3B4A3C',
      land2: '#2E3B30',
      water: '#1B3A52',
      waterDeep: '#143049',
      road: '#D7C998',
      roadHi: '#F0E2B2',
      roadStroke: '#A89868',
      park: '#4A6B3E',
      block: '#39473A',
      blockStroke: '#2C3A2E',
      text: '#E6DFC8',
      coast: '#22425A',
    },
  };
  const p = palettes[variant] || palettes.light;

  // Internal coords: 1000 x 1333 (tall — Santa Cruz hugs the coast)
  const VB_W = 1000, VB_H = 1333;
  const dark = variant === 'satellite';

  // Helper: pin pixel position from normalized x,y
  const posPx = (nx, ny) => ({
    left: nx * width,
    top:  ny * height,
  });

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', background: p.land }}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice"
           width="100%" height="100%" style={{ display: 'block' }}>
        {/* ocean (right side, beyond coastline) */}
        <defs>
          <linearGradient id="ocean" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={p.water}/>
            <stop offset="100%" stopColor={p.waterDeep}/>
          </linearGradient>
          <pattern id="oceanDots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill={p.coast} opacity="0.45"/>
          </pattern>
        </defs>

        {/* Land base */}
        <rect width={VB_W} height={VB_H} fill={p.land}/>

        {/* Coastline curve: roughly NE-SW, sea is to the east */}
        <path d={`M ${VB_W} 0
                  L ${VB_W} ${VB_H}
                  L 760 ${VB_H}
                  Q 740 1180 720 1100
                  Q 700 1000 760 920
                  Q 820 840 800 740
                  Q 780 650 820 560
                  Q 860 470 820 380
                  Q 780 280 840 180
                  Q 880 100 920 0 Z`} fill="url(#ocean)"/>
        <path d={`M ${VB_W} 0
                  L 920 0 Q 880 100 840 180
                  Q 780 280 820 380
                  Q 860 470 820 560
                  Q 780 650 800 740
                  Q 820 840 760 920
                  Q 700 1000 720 1100
                  Q 740 1180 760 ${VB_H}`} fill="none" stroke={p.coast} strokeWidth="3"/>
        <rect width={VB_W} height={VB_H} fill="url(#oceanDots)" opacity="0.4"
              style={{ mixBlendMode: dark ? 'screen' : 'multiply' }}/>

        {/* Auditorio / Palmetum peninsula */}
        <path d="M 760 880 q 50 -20 80 10 q 25 30 -10 60 q -40 30 -90 10 z" fill={p.land2} stroke={p.coast} strokeWidth="1.5"/>

        {/* Parque García Sanabria — big green block */}
        <g>
          <rect x="240" y="540" width="180" height="160" rx="10" fill={p.park}/>
          <circle cx="290" cy="590" r="14" fill={p.park} stroke={dark ? '#5C7E50' : '#A8C58E'} strokeWidth="1.5"/>
          <circle cx="350" cy="610" r="12" fill={p.park} stroke={dark ? '#5C7E50' : '#A8C58E'} strokeWidth="1.5"/>
          <circle cx="380" cy="660" r="16" fill={p.park} stroke={dark ? '#5C7E50' : '#A8C58E'} strokeWidth="1.5"/>
          <circle cx="280" cy="660" r="10" fill={p.park} stroke={dark ? '#5C7E50' : '#A8C58E'} strokeWidth="1.5"/>
        </g>

        {/* City blocks — gridded */}
        <g fill={p.block} stroke={p.blockStroke} strokeWidth="1.2">
          {/* Centro grid (south of park) */}
          {[...Array(6)].map((_, r) =>
            [...Array(5)].map((__, c) => (
              <rect key={`c-${r}-${c}`}
                    x={120 + c * 92} y={760 + r * 70}
                    width={82} height={60} rx="2"/>
            ))
          )}
          {/* North blocks */}
          {[...Array(4)].map((_, r) =>
            [...Array(4)].map((__, c) => (
              <rect key={`n-${r}-${c}`}
                    x={120 + c * 92} y={300 + r * 56}
                    width={82} height={46} rx="2"/>
            ))
          )}
          {/* Hills west */}
          {[...Array(8)].map((_, i) => (
            <rect key={`w-${i}`}
                  x={20 + (i % 4) * 26} y={400 + Math.floor(i / 4) * 36}
                  width={22} height={26} rx="2"/>
          ))}
        </g>

        {/* MAJOR ROADS */}
        {/* Av. de Anaga — along the coast */}
        <g stroke={p.roadStroke} strokeWidth="14" fill="none">
          <path d="M 880 0 Q 820 250 780 480 Q 740 720 720 1000 Q 720 1200 760 ${VB_H}"/>
        </g>
        <g stroke={p.roadHi} strokeWidth="9" fill="none">
          <path d="M 880 0 Q 820 250 780 480 Q 740 720 720 1000 Q 720 1200 760 1333"/>
        </g>

        {/* Av. Tres de Mayo / Av. de la Constitución — main inland axis (south to centro) */}
        <g stroke={p.roadStroke} strokeWidth="14" fill="none">
          <path d="M 180 1333 L 220 1100 L 280 900 L 360 760 L 420 700"/>
        </g>
        <g stroke={p.roadHi} strokeWidth="9" fill="none">
          <path d="M 180 1333 L 220 1100 L 280 900 L 360 760 L 420 700"/>
        </g>

        {/* Rambla de Santa Cruz (N-S, inland) */}
        <g stroke={p.roadStroke} strokeWidth="11" fill="none">
          <path d="M 320 0 L 320 540 L 320 720"/>
        </g>
        <g stroke={p.roadHi} strokeWidth="7" fill="none">
          <path d="M 320 0 L 320 720"/>
        </g>

        {/* Calle Castillo (pedestrian, E-W) */}
        <g stroke={p.roadStroke} strokeWidth="8" fill="none" strokeDasharray="2 4">
          <path d="M 420 880 L 700 870"/>
        </g>
        <g stroke={p.roadHi} strokeWidth="4" fill="none" strokeDasharray="6 6">
          <path d="M 420 880 L 700 870"/>
        </g>

        {/* Cross streets in centro grid */}
        <g stroke={p.roadStroke} strokeWidth="7" fill="none" opacity="0.9">
          <path d="M 100 820 L 720 815"/>
          <path d="M 100 940 L 720 935"/>
          <path d="M 100 1010 L 720 1005"/>
          <path d="M 100 1080 L 720 1075"/>
        </g>
        <g stroke={p.roadHi} strokeWidth="4" fill="none">
          <path d="M 100 820 L 720 815"/>
          <path d="M 100 940 L 720 935"/>
          <path d="M 100 1010 L 720 1005"/>
          <path d="M 100 1080 L 720 1075"/>
        </g>

        {/* Plaza de España — circle at coast */}
        <g>
          <circle cx="660" cy="930" r="30" fill={p.block} stroke={p.roadStroke} strokeWidth="2"/>
          <circle cx="660" cy="930" r="10" fill={p.park}/>
        </g>

        {/* Plaza del Príncipe */}
        <circle cx="380" cy="780" r="14" fill={p.park} stroke={p.blockStroke}/>

        {/* Plaza Weyler */}
        <circle cx="320" cy="540" r="14" fill={p.park} stroke={p.blockStroke}/>

        {/* labels */}
        {showStreetNames && (
          <g fill={p.text} fontFamily="'Inter', system-ui, sans-serif" fontSize="22" fontWeight="500" letterSpacing="1.5">
            <text x="500" y="40" transform="rotate(72 500 40)">AV. DE ANAGA</text>
            <text x="240" y="1200" transform="rotate(-58 240 1200)">AV. 3 DE MAYO</text>
            <text x="330" y="280" transform="rotate(90 330 280)">RAMBLA</text>
            <text x="450" y="865" fontSize="16">C/ CASTILLO</text>
            <text x="600" y="980" fontSize="13" fontWeight="600">PZA. ESPAÑA</text>
            <text x="260" y="630" fontSize="14" fontWeight="600">PARQUE</text>
            <text x="240" y="650" fontSize="11" fontWeight="500">GARCÍA SANABRIA</text>
            <text x="830" y="40" fontSize="13" fill={p.text} opacity="0.7">OCÉANO ATLÁNTICO</text>
          </g>
        )}

        {/* Heatmap — soft gradient blobs over hotspots */}
        {heatmap && (
          <g style={{ mixBlendMode: dark ? 'screen' : 'multiply' }}>
            <defs>
              <radialGradient id="hot1">
                <stop offset="0%" stopColor="#C0392B" stopOpacity="0.55"/>
                <stop offset="50%" stopColor="#E8A317" stopOpacity="0.35"/>
                <stop offset="100%" stopColor="#005A9C" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="hot2">
                <stop offset="0%" stopColor="#E8A317" stopOpacity="0.5"/>
                <stop offset="50%" stopColor="#005A9C" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#005A9C" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="430" cy="640" r="220" fill="url(#hot1)"/>
            <circle cx="500" cy="900" r="180" fill="url(#hot1)"/>
            <circle cx="280" cy="900" r="160" fill="url(#hot2)"/>
            <circle cx="640" cy="430" r="140" fill="url(#hot2)"/>
            <circle cx="180" cy="1100" r="120" fill="url(#hot2)"/>
          </g>
        )}

        {/* Routes overlay */}
        {showRoutes && (
          <g fill="none" stroke="#005A9C" strokeWidth="4" strokeDasharray="8 6" opacity="0.8">
            <path d="M 180 1100 L 280 900 L 380 780 L 480 720 L 620 690"/>
            <path d="M 660 930 L 580 850 L 460 720"/>
          </g>
        )}
      </svg>

      {/* Pins as DOM elements (clickable) */}
      {reports.map(r => {
        const { left, top } = posPx(r.x, r.y);
        const isSelected = r.id === selectedId;
        return (
          <div key={r.id} style={{
            position: 'absolute', left, top,
            transform: `translate(-50%, -100%)`,
            cursor: 'pointer', zIndex: isSelected ? 5 : 2,
          }} onClick={(e) => { e.stopPropagation(); onPinClick && onPinClick(r); }}>
            <Pin type={r.container} status={r.status} size={pinSize} selected={isSelected}/>
          </div>
        );
      })}

      {/* Optional cluster overlay (top-left) */}
      {showCluster && (
        <>
          <div style={{ position: 'absolute', left: width * 0.20, top: height * 0.18 }}>
            <PinCluster count={12} size={38}/>
          </div>
          <div style={{ position: 'absolute', left: width * 0.78, top: height * 0.08 }}>
            <PinCluster count={5} size={32}/>
          </div>
        </>
      )}
    </div>
  );
};

Object.assign(window, { SCMap });
