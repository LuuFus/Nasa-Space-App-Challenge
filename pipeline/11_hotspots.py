"""Step 11 — data for the "hot spots" on the map (src/content/hotspots.js).

A hot spot is a place where a layer shows something unusual: an algal bloom,
a haze of pollution, a dark country at night... For each one this step makes
  * a yearly series for the little chart in its card, from
      - NASA GIBS: a small piece of the layer around the place is fetched with
        WMS (a 48×48 picture instead of whole tiles), colours are turned back
        into numbers with the official GIBS colour map, the median is taken;
      - NASA POWER (point climate series), or
      - our global series (public/data/global.json: sea ice, ozone hole);
  * a satellite picture of the place on a telling day (NASA Worldview Snapshots).

Output: public/data/hotspots.json and public/data/hotspots/<id>.jpg
All imagery and data: NASA (public domain).
"""
from __future__ import annotations

import io
import json
import statistics
from urllib.parse import urlencode

import numpy as np
from PIL import Image

from common import OUT, download, log, parallel, read_json, write_json

WMS = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"
SNAP = "https://wvs.earthdata.nasa.gov/api/v1/snapshot"
POWER = "https://power.larc.nasa.gov/api/temporal/monthly/point"
TRUE = "MODIS_Terra_CorrectedReflectance_TrueColor"
AQUA = "MODIS_Aqua_CorrectedReflectance_TrueColor"
VIIRS = "VIIRS_NOAA20_CorrectedReflectance_TrueColor"
SNPP = "VIIRS_SNPP_CorrectedReflectance_TrueColor"
ARCTIC = "-4194304,-4194304,4194304,4194304"   # the whole Arctic in the polar projection EPSG:3413
NIGHT = "VIIRS_Black_Marble"


def L(uk, en):
    return {"uk": uk, "en": en}


# box = (west, south, east, north); photo = (layer, date, (south, west, north, east))
SPOTS = {
    # ---- ocean colour
    "baltic_bloom": dict(
        photo=(AQUA, "2018-07-26", (54.0, 14.0, 61.0, 25.0)),
        series=dict(src="gibs", layer="chlorophyll", box=(18, 56, 21, 58.5), md=["07-15", "07-25", "08-05", "08-15"], years=(2003, 2025),
                    unit="mg/m³", label=L("Хлорофіл улітку (медіана)", "Chlorophyll in summer (median)"))),
    "erie_bloom": dict(
        photo=(AQUA, "2011-10-09", (41.2, -83.8, 42.6, -80.8)),
        series=dict(src="gibs", layer="chlorophyll", box=(-83.4, 41.4, -82.0, 42.0), md=["08-10", "08-25", "09-10", "09-25"], years=(2003, 2025),
                    unit="mg/m³", label=L("Хлорофіл наприкінці літа", "Chlorophyll in late summer"))),
    "gulf_deadzone": dict(
        photo=(TRUE, "2019-06-02", (27.5, -93.5, 30.5, -88.0)),
        series=dict(src="gibs", layer="chlorophyll", box=(-92.5, 28.4, -89.5, 29.3), md=["06-01", "06-15", "07-01", "07-15"], years=(2003, 2025),
                    unit="mg/m³", label=L("Хлорофіл біля гирла Міссісіпі", "Chlorophyll off the Mississippi")),),
    "mauritania_upwelling": dict(
        photo=(TRUE, "2021-03-10", (16.0, -20.0, 23.0, -14.5)),
        series=dict(src="gibs", layer="chlorophyll", box=(-18.5, 19.0, -17.0, 21.5), md=["03-01", "03-15", "04-01", "04-15"], years=(2003, 2025),
                    unit="mg/m³", label=L("Хлорофіл навесні", "Chlorophyll in spring"))),
    "sargasso_desert": dict(
        series=dict(src="gibs", layer="chlorophyll", box=(-60, 25, -50, 31), md=["01-15", "04-15", "07-15", "10-15"], years=(2003, 2025),
                    unit="mg/m³", label=L("Хлорофіл протягом року", "Chlorophyll through the year"))),
    # ---- land
    "rondonia_forest": dict(
        photo=(TRUE, "2022-07-27", (-11.5, -65.0, -8.5, -61.0)),
        series=dict(src="gibs", layer="ndvi", box=(-63.5, -10.5, -62.0, -9.5), md=["08-01"], years=(2001, 2025),
                    unit="NDVI", label=L("Зеленість рослин у серпні (NDVI)", "Plant greenness in August (NDVI)"))),
    "sahel_greening": dict(
        photo=(TRUE, "2020-10-05", (12.0, -17.5, 17.5, -11.0)),
        series=dict(src="gibs", layer="ndvi", box=(-16, 14, -13, 15.5), md=["09-01"], years=(2001, 2025),
                    unit="NDVI", label=L("Зеленість у вересні (NDVI)", "Greenness in September (NDVI)"))),
    "lut_heat": dict(
        photo=(TRUE, "2021-07-15", (29.0, 57.5, 32.5, 61.0)),
        series=dict(src="gibs", layer="lst_day", box=(58.8, 29.8, 59.8, 30.8), md=["07-01"], years=(2001, 2025),
                    unit="°C", label=L("Температура поверхні вдень, липень", "Daytime surface temperature, July"))),
    "arctic_warming": dict(
        photo=(TRUE, "2020-07-25", (76.0, 8.0, 80.5, 28.0)),
        series=dict(src="power", param="T2M", lon=15.6, lat=78.2, years=(1981, 2025), agg="mean",
                    unit="°C", label=L("Середня температура року, Шпіцберген", "Mean yearly temperature, Svalbard"))),
    # ---- sea
    "med_heatwave": dict(
        series=dict(src="gibs", layer="sst", box=(3, 39, 7, 42), md=["08-05", "08-20"], years=(2003, 2025),
                    unit="°C", label=L("Температура води в серпні", "Water temperature in August"))),
    "reef_bleaching": dict(
        photo=(AQUA, "2016-02-24", (-20.5, 145.5, -16.0, 150.0)),
        series=dict(src="gibs", layer="sst", box=(146.5, -19, 148.5, -17), md=["02-15", "03-01"], years=(2003, 2025),
                    unit="°C", label=L("Температура води в лютому–березні", "Water temperature in February–March"))),
    "arctic_sea_ice": dict(
        photo=(TRUE, "2020-09-15", ARCTIC, "EPSG:3413"),
        series=dict(src="global", key="arctic_ice", unit=L("млн км²", "million km²"),
                    label=L("Площа льоду Арктики у вересні", "Arctic sea ice in September"))),
    # ---- fire and smoke
    "siberia_fires": dict(
        photo=(TRUE, "2021-08-06", (58.0, 115.0, 68.0, 140.0)),
        series=dict(src="power", param="T2M_MAX", lon=129.7, lat=62.0, years=(1981, 2025), agg="max",
                    unit="°C", label=L("Найвища температура року, Якутськ", "Highest temperature of the year, Yakutsk"))),
    "africa_burning": dict(
        photo=(TRUE, "2019-08-10", (-14.0, 15.0, -4.0, 30.0)),
        series=dict(src="gibs", layer="co", box=(18, -12, 26, -6), md=["08-01"], years=(2001, 2024), scale=1e-18,
                    unit=L("×10¹⁸ молекул/см²", "×10¹⁸ molecules/cm²"), label=L("Чадний газ CO у серпні", "Carbon monoxide CO in August"))),
    # ---- air
    "highveld_no2": dict(
        series=dict(src="gibs", layer="no2", box=(28.5, -26.8, 30.0, -25.6), md=["06-05", "06-12", "06-19", "06-26", "07-03", "07-10", "07-17", "07-24"], years=(2005, 2025), scale=1e-15,
                    unit=L("×10¹⁵ молекул/см²", "×10¹⁵ molecules/cm²"), label=L("NO₂ узимку (червень–липень)", "NO₂ in winter (June–July)"))),
    "po_valley": dict(
        photo=(TRUE, "2017-01-25", (43.5, 6.5, 47.0, 14.5)),
        series=dict(src="gibs", layer="no2", box=(8.5, 44.8, 12.0, 45.8), md=["01-05", "01-12", "01-19", "01-26", "02-02", "02-09", "02-16", "02-23"], years=(2005, 2025), scale=1e-15,
                    unit=L("×10¹⁵ молекул/см²", "×10¹⁵ molecules/cm²"), label=L("NO₂ узимку", "NO₂ in winter"))),
    "gangetic_haze": dict(
        photo=(SNPP, "2017-11-07", (24.0, 72.0, 32.0, 88.0)),
        series=dict(src="gibs", layer="aod", box=(77, 25, 83, 29), md=["11-01"], years=(1980, 2025),
                    unit="AOD", label=L("Каламутність повітря в листопаді (AOD)", "Haze in November (AOD)"))),
    "bodele_dust": dict(
        photo=(TRUE, "2005-12-12", (14.0, 13.0, 20.0, 22.0)),
        # dust PM2.5 is above the top of its colour scale here all the time, so the haze (AOD) is used
        series=dict(src="gibs", layer="aod", box=(16, 16, 19, 18), md=["01-01", "02-01", "03-01"], years=(1980, 2025),
                    unit="AOD", label=L("Каламутність повітря від пилу (AOD), січень–березень", "Haze from dust (AOD), January–March"))),
    "norilsk_so2": dict(
        photo=(TRUE, "2016-07-05", (68.5, 86.0, 70.2, 91.0)),
        series=dict(src="gibs", layer="so2", box=(86.5, 68.8, 90.0, 70.0), md=["01-01", "07-01"], years=(1980, 2025), scale=1e6,
                    unit=L("мг/м²", "mg/m²"), label=L("Діоксид сірки SO₂ (середнє січня й липня)", "Sulphur dioxide SO₂ (January and July)"))),
    # ---- ozone, water
    "ozone_hole": dict(
        series=dict(src="global", key="ozone_area", unit=L("млн км²", "million km²"), label=L("Площа озонової діри (вересень–жовтень)", "Ozone hole area (September–October)"))),
    "india_groundwater": dict(
        photo=(SNPP, "2021-02-20", (27.0, 72.5, 32.0, 80.5)),
        series=dict(src="gibs", layer="grace", box=(74.5, 28.5, 78.5, 31.0), md=["any"], years=(2003, 2025),
                    unit=L("см води", "cm of water"), label=L("Запас води під землею (GRACE)", "Water stored underground (GRACE)"))),
    "cherrapunji_rain": dict(
        series=dict(src="power", param="PRECTOTCORR", lon=91.7, lat=25.3, years=(1981, 2025), agg="sum",
                    unit=L("мм за рік", "mm per year"), label=L("Опади за рік у клітинці ~50 км навколо Черрапунджі (на самій станції — утричі більше)", "Rain per year in a ~50 km cell around Cherrapunji (three times more at the station itself)"))),
    "atacama_dry": dict(
        photo=(TRUE, "2021-04-10", (-26.0, -71.5, -22.0, -67.5)),
        series=dict(src="power", param="PRECTOTCORR", lon=-69.9, lat=-23.9, years=(1981, 2025), agg="sum",
                    unit=L("мм за рік", "mm per year"), label=L("Опади за рік, пустеля Атакама", "Rain per year, Atacama Desert"))),
    # ---- night lights
    "korea_night": dict(photo=(NIGHT, "2016-01-01", (33.5, 123.5, 43.0, 131.5))),
    "nile_night": dict(photo=(NIGHT, "2016-01-01", (22.0, 28.0, 32.0, 35.0))),
    "bakken_flares": dict(photo=(NIGHT, "2016-01-01", (45.5, -106.0, 50.0, -98.0))),
}


# ---------------------------------------------------------------- GIBS values
def lut(legend):
    keys, vals = [], []
    for r, g, b, lo, hi, transparent in legend["entries"]:
        if transparent or (lo is None and hi is None):
            continue
        keys.append((r, g, b))
        vals.append(hi if lo is None else lo if hi is None else (lo + hi) / 2)
    return np.array(keys, dtype=np.float32), np.array(vals, dtype=np.float32)


def box_value(layer, date, box, keys, vals):
    """median value of a layer in a box on a date (None if no data)"""
    w, s, e, n = box
    params = dict(SERVICE="WMS", REQUEST="GetMap", VERSION="1.3.0", STYLES="", LAYERS=layer["gibs"], CRS="EPSG:4326",
                  BBOX=f"{s},{w},{n},{e}", WIDTH=48, HEIGHT=48, FORMAT="image/png", TRANSPARENT="TRUE", TIME=date)
    # the full URL (not `params`): the cache names its file after the URL's last part
    raw = download(f"{WMS}?{urlencode(params)}", timeout=90, quiet=True)
    if not raw:
        return None
    img = np.array(Image.open(io.BytesIO(raw)).convert("RGBA")).reshape(-1, 4)
    px = img[img[:, 3] > 0][:, :3].astype(np.float32)
    if len(px) < 8:
        return None
    # nearest colour of the colour map (WMS may smooth a little); far colours are dropped
    d = ((px[:, None, :] - keys[None, :, :]) ** 2).sum(-1)
    k = d.argmin(1)
    ok = d[np.arange(len(k)), k] < 300
    if ok.sum() < 8:
        return None
    return float(np.median(vals[k[ok]]))


def dates_for(layer, md, year):
    if md == ["any"]:   # irregular dates (GRACE): the first available date of the year
        for r in layer["ranges"]:
            a, b, _ = r.split("/")
            if a[:4] <= str(year) <= b[:4]:
                return [max(a, f"{year}-01-01")]
        return []
    return [f"{year}-{x}" for x in md]


def gibs_series(spec, catalog):
    layer = catalog[spec["layer"]]
    keys, vals = lut(layer["legend"])
    tr = layer.get("transform") or {}
    scale = spec.get("scale", tr.get("scale", 1))
    offset = tr.get("offset", 0) if "scale" not in spec else 0
    years = list(range(spec["years"][0], spec["years"][1] + 1))
    jobs = [(y, d) for y in years for d in dates_for(layer, spec["md"], y)]
    got = parallel(lambda j: box_value(layer, j[1], spec["box"], keys, vals), jobs, workers=8, desc=spec["layer"])
    by = {}
    for (y, _), v in zip(jobs, got):
        if v is not None:
            by.setdefault(y, []).append(v * scale + offset)
    return [y for y in years if y in by], [round(statistics.median(by[y]), 4) for y in years if y in by]


def power_series(spec):
    y0, y1 = spec["years"]
    url = f"{POWER}?parameters={spec['param']}&community=RE&longitude={spec['lon']}&latitude={spec['lat']}&start={y0}&end={y1}&format=JSON"
    data = json.loads(download(url, timeout=180))
    p = data["properties"]["parameter"][spec["param"]]
    years, values = [], []
    for y in range(y0, y1 + 1):
        months = [p.get(f"{y}{m:02d}") for m in range(1, 13)]
        months = [v for v in months if v is not None and v > -900]
        if len(months) < 12:
            continue
        v = {"mean": statistics.mean(months), "max": max(months), "sum": sum(months) * 30.44}[spec["agg"]]
        years.append(y)
        values.append(round(v, 2))
    return years, values


def global_series(spec):
    g = read_json("global.json")[spec["key"]]
    vals = g.get("values") or g.get("value") or g.get("y")
    return g["years"], vals


def photo(id_, spec):
    layer, date, box = spec[:3]
    if len(spec) > 3:   # a polar projection: box is already "minx,miny,maxx,maxy" in metres
        params = dict(REQUEST="GetSnapshot", TIME=date, BBOX=box, CRS=spec[3], LAYERS=f"{layer},Coastlines",
                      FORMAT="image/jpeg", WIDTH=520, HEIGHT=520)
    else:
        s, w, n, e = box
        ratio = (e - w) / max(0.1, n - s)
        W = 640
        H = int(max(300, min(480, W / ratio)))
        # WRAP needs one value per layer
        params = dict(REQUEST="GetSnapshot", TIME=date, BBOX=f"{s},{w},{n},{e}", CRS="EPSG:4326",
                      LAYERS=f"{layer},Coastlines_15m", WRAP="day,x", FORMAT="image/jpeg", WIDTH=W, HEIGHT=H)
    raw = download(f"{SNAP}?{urlencode(params)}", timeout=180)
    if not raw:
        return None
    (OUT / "hotspots").mkdir(exist_ok=True)
    Image.open(io.BytesIO(raw)).convert("RGB").save(OUT / "hotspots" / f"{id_}.jpg", quality=82, optimize=True)
    return {"file": f"hotspots/{id_}.jpg", "date": date, "layer": layer}


def main():
    catalog = {l["id"]: l for l in read_json("layers.json")["layers"]}
    out = {}
    for id_, spec in SPOTS.items():
        rec = {}
        try:
            if "photo" in spec:
                rec["photo"] = photo(id_, spec["photo"])
            s = spec.get("series")
            if s:
                if s["src"] == "gibs":
                    years, values = gibs_series(s, catalog)
                elif s["src"] == "power":
                    years, values = power_series(s)
                else:
                    years, values = global_series(s)
                unit = s["unit"] if isinstance(s["unit"], dict) else {"uk": s["unit"], "en": s["unit"]}
                rec["series"] = {"years": years, "values": values, "unit": unit, "label": s["label"]}
                log(f"  {id_}: {len(years)} years" + (f", {values[0]} → {values[-1]}" if values else ""))
        except Exception as e:  # one bad place must not stop the rest
            log(f"  {id_}: FAILED {e}")
        out[id_] = rec
    write_json("hotspots.json", out)


if __name__ == "__main__":
    main()
