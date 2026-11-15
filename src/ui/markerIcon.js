import { createElement as lucideSvg, Cloud, Droplets, Flame, Shield, Snowflake, Thermometer, Tornado, Trees, Waves } from 'lucide';

// map markers of events: the same vector icons as in the panels (lucide, vanilla build)
const MARKER_ICONS = { war: Shield, water: Droplets, fire: Flame, ice: Snowflake, air: Cloud, land: Trees, heat: Thermometer, storm: Tornado, quake: Waves };

export function markerIcon(cat) {
  const svg = lucideSvg(MARKER_ICONS[cat] || Shield, { width: 14, height: 14, 'stroke-width': 1.9 });
  return svg.outerHTML;
}
