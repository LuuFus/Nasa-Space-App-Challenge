import { create } from 'zustand';

// One place for everything the user can switch on and off.
export const useStore = create((set, get) => ({
  lang: localStorage.getItem('lang') || 'uk',
  setLang: (lang) => { localStorage.setItem('lang', lang); set({ lang }); },

  // catalogue of map layers (public/data/layers.json)
  catalog: null,
  setCatalog: (catalog) => set({ catalog }),

  mode: 'globe',            // 'globe' | 'flat'
  flatStyle: 'contour',     // 'contour' (white land, blue sea) | 'imagery'
  setMode: (mode) => set({ mode }),
  setFlatStyle: (flatStyle) => set({ flatStyle }),

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

  toggles: { clouds: false, borders: true, capitals: true, rivers: true, labels: true, oceans: true, graticule: false, tint: false, events: true },
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
  setPanel: (panel) => set({ panel }),
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

  eventId: null,
  setEvent: (eventId) => set({ eventId }),
}));

if (import.meta.env.DEV) window.__store = useStore; // debugging helper
