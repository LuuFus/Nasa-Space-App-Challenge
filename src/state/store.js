import { create } from 'zustand';

// One place for everything the user can switch on and off.
export const useStore = create((set, get) => ({
  lang: localStorage.getItem('lang') || 'uk',
  setLang: (lang) => { localStorage.setItem('lang', lang); set({ lang }); },

  // catalogue of map layers (public/data/layers.json)
  catalog: null,
  setCatalog: (catalog) => set({ catalog }),

  mode: 'globe',            // 'globe' | 'flat' (contour map of the 3D engine) | 'osm' (OpenStreetMap, src/map/)
  flatStyle: 'contour',     // 'contour' (white land, blue sea) | 'imagery'
  setMode: (mode) => set({ mode }),
  setFlatStyle: (flatStyle) => set({ flatStyle }),

  // OpenStreetMap view: base map and the windy.com-style weather forecast
  basemap: localStorage.getItem('basemap') || 'osm',   // osm | light | dark | satellite
  setBasemap: (basemap) => { localStorage.setItem('basemap', basemap); set({ basemap }); },
  // the OSM map as a 3D globe (MapLibre globe projection) or flat (web Mercator)
  osmGlobe: localStorage.getItem('osmGlobe') === '1',
  setOsmGlobe: (osmGlobe) => { localStorage.setItem('osmGlobe', osmGlobe ? '1' : '0'); set({ osmGlobe }); },
  wx: { layer: null, t: null, particles: true, playing: false },   // t = index of the 3-hour step
  setWx: (w) => set({ wx: { ...get().wx, ...w } }),
  // colour of countries by trend (Compare tab): fn(countryId) -> CSS colour, or null
  choropleth: null,
  // value of the data layer under the mouse, for the arrow on the legend: { layer, value, text }
  probe: null,
  // the open card of a hot spot (src/ui/Hotspots.jsx): { id, x, y, pinned }
  hotspot: null,
  spot: null,               // { lon, lat } of the point forecast card
  setSpot: (spot) => set({ spot }),

  baseId: 'bluemarble',
  overlayId: null,          // the active data layer
  overlayOpacity: 0.85,
  dates: {},                // layerId -> 'YYYY-MM-DD'
  setBase: (baseId) => set({ baseId }),
  setOverlay: (overlayId) => set({ overlayId }),
  setOverlayOpacity: (overlayOpacity) => set({ overlayOpacity }),
  setDate: (id, date) => set({ dates: { ...get().dates, [id]: date } }),

  // our own computed maps (trend maps / anomalies)
  trendMap: null,           // { id, year? }
  setTrendMap: (trendMap) => set({ trendMap }),

  toggles: { clouds: false, borders: true, capitals: true, rivers: true, labels: true, oceans: true, graticule: false, tint: false, events: true, hotspots: true },
  toggle: (k, v) => set({ toggles: { ...get().toggles, [k]: v ?? !get().toggles[k] } }),
  cloudDate: '2025-08-15',
  setCloudDate: (cloudDate) => set({ cloudDate }),

  // countries picked for comparison
  selA: 'UKR',
  selB: 'POL',
  pickTarget: 'a',          // which slot the next click on the map fills
  setSel: (slot, id) => set(slot === 'a' ? { selA: id } : { selB: id }),
  setPickTarget: (pickTarget) => set({ pickTarget }),

  panel: 'layers',          // layers | compare | planet | swipe | events | glossary | about
  setPanel: (panel) => set({ panel: panel === 'report' ? 'compare' : panel }),   // 'report' was merged into 'compare'
  chartFullscreen: false,
  setChartFullscreen: (chartFullscreen) => set({ chartFullscreen }),

  // before/after
  swipe: { enabled: false, split: 0.5, left: null, right: null, preset: null },
  setSwipe: (s) => set({ swipe: { ...get().swipe, ...s } }),

  // ask before switching to the contour map
  consent: null,            // { reason: {uk,en}, onYes }
  askConsent: (consent) => set({ consent }),
  consentRemember: null,    // 'yes' | 'no' for the rest of the session

  glossaryTerm: null,
  openGlossary: (glossaryTerm) => set({ glossaryTerm, panel: 'glossary' }),

  planetChart: 'gistemp',
  compareVar: 'T2M',
  setCompareVar: (compareVar) => set({ compareVar }),

  eventId: null,
  setEvent: (eventId) => set({ eventId }),
  // what an event switched on, so "close event" can undo it
  eventApplied: null,

  // front line in Ukraine (monthly snapshots, see src/engine/Front.js)
  front: { on: false, idx: null, compare: null },
  // day-by-day fire playback { id, day, playing }
  fire: null,
  setFire: (fire) => set({ fire }),
  setFront: (f) => set({ front: { ...get().front, ...f } }),
}));

if (import.meta.env.DEV) window.__store = useStore; // debugging helper
