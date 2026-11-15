// Daily data layers have holes: between the passes of a satellite and under
// clouds. Other satellites of the same day (other orbits, other hours) fill
// many of them, the previous day fills more. Used by the 3D engine and the
// OpenStreetMap view: the main picture is drawn on top, the fillers under it.

export function prevDay(date) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const chl = (gibs, from) => ({ id: gibs, gibs, tms: '1km', format: 'png', maxLevel: 6, from });
// ocean colour: the same chlorophyll product from other NASA / NOAA sensors
const SAME_DAY = {
  MODIS_Aqua_L2_Chlorophyll_A: [chl('VIIRS_NOAA20_Chlorophyll_a', '2018-02-24'), chl('VIIRS_NOAA21_Chlorophyll_a', '2023-03-31'),
    chl('VIIRS_SNPP_L2_Chlorophyll_A', '2012-01-02'), chl('MODIS_Terra_L2_Chlorophyll_A', '2000-02-24')],
};
const PREV_DAY = new Set(['OMI_Nitrogen_Dioxide_Tropo_Column', 'TROPOMI_L2_Nitrogen_Dioxide_Tropospheric_Column',
  'OMPS_Ozone_Total_Column', 'OMI_Ozone_TOMS_Total_Column', 'MODIS_Aqua_L2_Chlorophyll_A']);

/** up to 3 fillers for a data layer on a date: [{ layer, date }], the best first */
export function fillersFor(layer, date) {
  if (!layer || !date) return [];
  const out = (SAME_DAY[layer.gibs] || []).filter((f) => date >= f.from).slice(0, 2).map((f) => ({ layer: f, date }));
  if (PREV_DAY.has(layer.gibs)) out.push({ layer, date: prevDay(date) });
  return out.slice(0, 3);
}
