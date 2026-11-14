// Small helpers for the front-line data (public/data/front.json), shared by the
// map layer, its controls, the legend and the "occupied area" chart.

/** occupied area of a snapshot in km² (communities occupied only in part are not counted) */
export const frontTotal = (area) => (area.occupied || 0) + (area.ordlo || 0) + (area.crimea || 0);

/** area of Ukraine in km², for percentages */
export const UKRAINE_KM2 = 603628;

/** where the data comes from: { uk, en, short: {uk, en}, url } */
export function frontSource(d) {
  if (d?.attribution) return d.attribution;
  return { uk: '© DeepStateMap (щомісячні знімки)', en: '© DeepStateMap (monthly snapshots)', short: { uk: '© DeepStateMap', en: '© DeepStateMap' }, url: 'https://deepstatemap.live' };
}

/** true when the data is the official community-level list (order No. 376) */
export const isOfficial = (d) => d?.format === 'communities';
