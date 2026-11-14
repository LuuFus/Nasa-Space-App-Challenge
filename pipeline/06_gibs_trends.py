"""Step 6 — trend maps: where on Earth is it really changing?

For several NASA monthly layers (MERRA-2 since 1980, MODIS since 2000) we take
the whole-world GIBS tiles (0.5625° pixels), turn every colour back into a number
with the official GIBS colour map, build yearly means and run, for every pixel:
  * the least-squares trend (change per decade), and
  * the Mann–Kendall test (is the trend statistically significant, p < 0.05?).
Significant pixels are drawn bright, non-significant ones pale.

Outputs (public/data/trends/):
  <id>_trend.png            trend map (equirectangular, 640×320, transparent background)
  t2m_anom_<year>.png       yearly temperature anomaly vs 1991–2020
  trends.json               metadata (units, scales, legends, years)
  ../gibs_country_annual.json   yearly country means for NDVI and land-surface temperature
"""
from __future__ import annotations

import io
import json
import math

import numpy as np
from PIL import Image, ImageDraw

from common import OUT, download, log, parallel, read_json, write_json

W, H = 640, 320           # 0.5625° grid = GIBS level-0 resolution
TILE = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{gibs}/default/{date}/{tms}/{z}/{y}/{x}.png"

LAYERS = [
    # id, catalog id, first year, last year, how to convert the decoded number, unit, palette, title
    dict(id="t2m", cat="t2m", y0=1980, y1=2025, conv=lambda v: v - 273.15, unit="°C", pal="temp",
         title={"uk": "Тренд температури повітря", "en": "Air temperature trend"}, anomalies=True),
    dict(id="precip", cat="precip", y0=1980, y1=2025, conv=lambda v: v * 86400 * 365.25, unit="mm", pal="water",
         title={"uk": "Тренд опадів", "en": "Precipitation trend"}),
    dict(id="soil", cat="soil", y0=1980, y1=2025, conv=lambda v: v * 100, unit="%", pal="water",
         title={"uk": "Тренд вологості ґрунту", "en": "Soil moisture trend"}),
    dict(id="ndvi", cat="ndvi", y0=2001, y1=2025, conv=lambda v: v, unit="NDVI", pal="green",
         title={"uk": "Тренд зеленості рослин (NDVI)", "en": "Vegetation greenness trend (NDVI)"}, country=True, level=2),
    dict(id="lst_day", cat="lst_day", y0=2001, y1=2025, conv=lambda v: v - 273.15, unit="°C", pal="temp",
         title={"uk": "Тренд температури поверхні суші (вдень)", "en": "Daytime land-surface temperature trend"}, country=True, level=2),
]

PALETTES = {  # negative end, middle, positive end
    "temp": ([33, 102, 172], [247, 247, 247], [178, 24, 43]),
    "water": ([140, 81, 10], [245, 245, 245], [1, 102, 94]),
    "green": ([140, 81, 10], [245, 245, 245], [27, 120, 55]),
}


def colormap_lookup(legend):
    """rgb int -> value (middle of the colour's interval)."""
    lut = {}
    for e in legend["entries"]:
        r, g, b, lo, hi, transparent = e
        if transparent:
            continue
        if lo is None and hi is None:
            continue
        v = hi if lo is None else lo if hi is None else (lo + hi) / 2
        lut[(r << 16) | (g << 8) | b] = v
    keys = np.array(sorted(lut), dtype=np.int64)
    vals = np.array([lut[k] for k in keys], dtype=np.float32)
    return keys, vals


def decode_month(layer, date, keys, vals, z=0):
    """Whole world at 0.5625°. Fine-resolution products (1 km MODIS) are read at a
    deeper zoom level and averaged, otherwise every big pixel would be one random
    1 km sample and the maps would be noisy."""
    S = 288 / 2 ** z
    nx, ny = math.ceil(360 / S), math.ceil(180 / S)
    rows = []
    for y in range(ny):
        row = []
        for x in range(nx):
            raw = download(TILE.format(gibs=layer["gibs"], date=date, tms=layer["tms"], z=z, y=y, x=x), timeout=90, quiet=True)
            if raw is None:
                return None
            row.append(np.array(Image.open(io.BytesIO(raw)).convert("RGBA")))
        rows.append(np.concatenate(row, axis=1))
    f = 2 ** z
    img = np.concatenate(rows, axis=0)[:H * f, :W * f]
    rgb = (img[..., 0].astype(np.int64) << 16) | (img[..., 1].astype(np.int64) << 8) | img[..., 2]
    out = np.full(rgb.shape, np.nan, dtype=np.float32)
    ok = img[..., 3] > 0
    idx = np.clip(np.searchsorted(keys, rgb[ok]), 0, len(keys) - 1)
    hit = keys[idx] == rgb[ok]
    vv = np.full(idx.shape, np.nan, dtype=np.float32)
    vv[hit] = vals[idx[hit]]
    out[ok] = vv
    if f > 1:
        with np.errstate(all="ignore"):
            out = np.nanmean(out.reshape(H, f, W, f), axis=(1, 3))
    return out


def normal_cdf(z):
    t = 1 / (1 + 0.3275911 * np.abs(z) / math.sqrt(2))
    y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * np.exp(-z * z / 2)
    return np.where(z >= 0, (1 + y) / 2, (1 - y) / 2)


def trend_maps(years, cube):
    """cube: [n_years, H, W] -> slope per decade, Mann-Kendall p-value."""
    n = len(years)
    x = np.array(years, dtype=np.float32)
    xc = x - x.mean()
    valid = np.all(np.isfinite(cube), axis=0)
    y = np.where(valid, cube, 0)
    slope = np.tensordot(xc, y - y.mean(axis=0), axes=1) / (xc ** 2).sum()
    S = np.zeros((H, W), dtype=np.float32)
    for i in range(n - 1):
        S += np.sign(y[i + 1:] - y[i]).sum(axis=0)
    var = n * (n - 1) * (2 * n + 5) / 18
    Z = np.where(S > 0, (S - 1) / math.sqrt(var), np.where(S < 0, (S + 1) / math.sqrt(var), 0))
    p = 2 * (1 - normal_cdf(np.abs(Z)))
    slope = np.where(valid, slope * 10, np.nan)
    p = np.where(valid, p, np.nan)
    return slope, p


def colorize(field, vmax, pal, sig=None):
    neg, mid, pos = (np.array(c, dtype=np.float32) for c in PALETTES[pal])
    k = np.clip(field / vmax, -1, 1)
    k0 = np.nan_to_num(k)[..., None]
    rgb = np.where(k0 < 0, mid + (neg - mid) * -k0, mid + (pos - mid) * k0)
    a = np.where(np.isfinite(field), 235, 0).astype(np.float32)
    if sig is not None:   # not significant: keep the colour but wash it out
        weak = np.isfinite(field) & (sig >= 0.05)
        rgb = np.where(weak[..., None], mid + (rgb - mid) * 0.35, rgb)
        a = np.where(weak, 150, a)
    img = np.dstack([rgb, a]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(img, "RGBA").quantize(colors=96, method=Image.Quantize.FASTOCTREE)


def nice(v):
    e = 10 ** math.floor(math.log10(v))
    for m in (1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10):
        if v <= m * e:
            return m * e
    return 10 * e


def country_raster():
    geo = read_json("geo/countries.json")
    q = geo["quant"]
    img = Image.new("I", (W, H), 0)
    d = ImageDraw.Draw(img)
    ids = []
    for i, c in enumerate(geo["countries"], start=1):
        ids.append(c["id"])
        for poly in c["polys"]:
            pts, x, y = [], 0, 0
            r = poly[0]
            for j in range(0, len(r), 2):
                if j == 0:
                    x, y = r[0], r[1]
                else:
                    x += r[j]
                    y += r[j + 1]
                pts.append(((x / q + 180) / 360 * W, (90 - y / q) / 180 * H))
            if len(pts) >= 3:
                d.polygon(pts, fill=i)
    return np.array(img), ids


def main():
    catalog = {l["id"]: l for l in read_json("layers.json")["layers"]}
    (OUT / "trends").mkdir(exist_ok=True)
    lat = 90 - (np.arange(H) + 0.5) * 180 / H
    weights = np.cos(np.radians(lat))[:, None] * np.ones((1, W))
    raster, ids = country_raster()
    meta, country_series = [], {}
    for L in LAYERS:
        layer = catalog[L["cat"]]
        keys, vals = colormap_lookup(layer["legend"])
        months = [(y, m) for y in range(L["y0"], L["y1"] + 1) for m in range(1, 13)]
        log(f"{L['id']}: {len(months)} months of {layer['gibs']}")
        grids = parallel(lambda ym: decode_month(layer, f"{ym[0]}-{ym[1]:02d}-01", keys, vals, L.get("level", 0)), months, workers=8, desc=L["id"])
        years, cube = [], []
        for yi, y in enumerate(range(L["y0"], L["y1"] + 1)):
            block = [g for g in grids[yi * 12:(yi + 1) * 12] if g is not None]
            if len(block) < 10:
                log(f"  {y}: only {len(block)} months, skipped")
                continue
            with np.errstate(all="ignore"):
                annual = np.nanmean(np.stack(block), axis=0)
                cnt = np.sum(np.isfinite(np.stack(block)), axis=0)
            annual[cnt < max(6, len(block) - 3)] = np.nan
            years.append(y)
            cube.append(L["conv"](annual))
        cube = np.stack(cube)
        slope, p = trend_maps(years, cube)
        vmax = nice(float(np.nanpercentile(np.abs(slope), 97)))
        colorize(slope, vmax, L["pal"], p).save(OUT / "trends" / f"{L['id']}_trend.png", optimize=True)
        sig_share = float(np.nansum(weights * (p < 0.05)) / np.nansum(weights * np.isfinite(p)))
        entry = {"id": L["id"] + "_trend", "kind": "trend", "layer": L["cat"], "title": L["title"], "unit": L["unit"],
                 "years": [years[0], years[-1]], "vmax": vmax, "palette": PALETTES[L["pal"]],
                 "url": f"trends/{L['id']}_trend.png", "significantShare": round(sig_share, 3)}
        meta.append(entry)
        log(f"  trend map: ±{vmax} {L['unit']}/decade, significant on {sig_share:.0%} of the mapped area")
        if L.get("anomalies"):
            base = np.nanmean(cube[[i for i, y in enumerate(years) if 1991 <= y <= 2020]], axis=0)
            amax = 3.0
            for i, y in enumerate(years):
                colorize(cube[i] - base, amax, L["pal"]).save(OUT / "trends" / f"{L['id']}_anom_{y}.png", optimize=True)
            meta.append({"id": L["id"] + "_anom", "kind": "anomaly", "layer": L["cat"],
                         "title": {"uk": "Аномалія температури за рік (від норми 1991–2020)", "en": "Yearly temperature anomaly (vs 1991–2020)"},
                         "unit": L["unit"], "years": [years[0], years[-1]], "vmax": amax, "palette": PALETTES[L["pal"]],
                         "url": f"trends/{L['id']}_anom_{{year}}.png"})
            # global (area-weighted) mean anomaly, for a quick check against GISTEMP
            g = [float(np.nansum(weights * (cube[i] - base)) / np.nansum(weights * np.isfinite(cube[i] - base))) for i in range(len(years))]
            log("  global mean anomaly: " + ", ".join(f"{y}:{v:+.2f}" for y, v in zip(years[-6:], g[-6:])))
        if L.get("country"):
            ser = {}
            for ci, cid in enumerate(ids, start=1):
                mask = raster == ci
                if mask.sum() < 2:
                    continue
                vals_c = []
                for i in range(len(years)):
                    v = cube[i][mask]
                    w = weights[mask]
                    ok = np.isfinite(v)
                    vals_c.append(round(float(np.sum(v[ok] * w[ok]) / np.sum(w[ok])), 4) if ok.sum() >= max(1, 0.5 * mask.sum()) else None)
                ser[cid] = vals_c
            country_series[L["id"]] = {"years": years, "unit": L["unit"], "source": f"NASA GIBS {layer['gibs']} (decoded with the GIBS colour map, 0.5625° grid)", "countries": ser}
    write_json("trends/trends.json", meta, compact=False)
    write_json("gibs_country_annual.json", country_series)


if __name__ == "__main__":
    main()
