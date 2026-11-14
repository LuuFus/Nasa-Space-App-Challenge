"""Step 2 — climate time series for every country from NASA POWER.

NASA POWER (https://power.larc.nasa.gov) serves MERRA-2 / GEOS / CERES based
meteorology for any point on Earth, no login needed. A country is represented by
several sample points spread across its territory (more points for bigger
countries); the country value is the average of those points.

Outputs:
  public/data/countries/<ID>.json   monthly + annual series for one country
  public/data/power_annual.json     annual series for all countries (choropleths, rankings)
"""
from __future__ import annotations

import json
import math
import random

from common import OUT, download_json, log, parallel, point_in_polygons, read_json, write_json

API = "https://power.larc.nasa.gov/api/temporal/monthly/point"
START, END = 1981, 2025

# parameter -> (unit, how to aggregate months into a year)
PARAMS = {
    "T2M": ("°C", "mean"),            # air temperature at 2 m
    "T2M_MAX": ("°C", "mean"),        # mean daily maximum
    "T2M_MIN": ("°C", "mean"),        # mean daily minimum
    "PRECTOTCORR": ("mm", "sum"),     # precipitation (POWER gives mm/day -> we store mm per month / year)
    "GWETROOT": ("%", "mean"),        # root-zone soil wetness (0..1 -> %)
    "GWETTOP": ("%", "mean"),         # surface soil wetness (0..1 -> %)
    "RH2M": ("%", "mean"),            # relative humidity at 2 m
    "QV2M": ("g/kg", "mean"),         # specific humidity at 2 m
    "WS2M": ("m/s", "mean"),          # wind speed at 2 m
    "ALLSKY_SFC_SW_DWN": ("kWh/m²/day", "mean"),  # sunlight reaching the ground
}
DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def decode(flat, quant):
    pts, x, y = [], 0, 0
    for i in range(0, len(flat), 2):
        if i == 0:
            x, y = flat[0], flat[1]
        else:
            x += flat[i]
            y += flat[i + 1]
        pts.append((x / quant, y / quant))
    return pts


def sample_points(country, quant, max_points):
    """Spread up to max_points points over the country (farthest-point sampling on a grid)."""
    polys = [[decode(r, quant) for r in poly] for poly in country["polys"]]
    w, s, e, n = country["bbox"]
    k = max(1, min(max_points, round(math.sqrt(country["area"] / 15_000))))
    if k == 1:
        return [tuple(country["label"])]
    cand = []
    steps = 40
    for i in range(steps + 1):
        for j in range(steps + 1):
            x = w + (e - w) * (i + 0.5) / (steps + 1)
            y = s + (n - s) * (j + 0.5) / (steps + 1)
            if point_in_polygons(x, y, polys):
                cand.append((x, y))
    if not cand:
        return [tuple(country["label"])]
    def dist(a, b):  # rough km distance
        dx = (a[0] - b[0]) * 111 * math.cos(math.radians((a[1] + b[1]) / 2))
        dy = (a[1] - b[1]) * 111
        return math.hypot(dx, dy)

    # k-means on the grid points inside the country: each centre represents an
    # equal-ish part of the territory (better than picking points on the edges)
    k = min(k, len(cand))
    centres = [cand[int(i * len(cand) / k)] for i in range(k)]
    for _ in range(15):
        groups = [[] for _ in centres]
        for c in cand:
            gi = min(range(len(centres)), key=lambda i: dist(c, centres[i]))
            groups[gi].append(c)
        centres = [(sum(p[0] for p in g) / len(g), sum(p[1] for p in g) / len(g)) if g else centres[i]
                   for i, g in enumerate(groups)]
    # snap every centre to the nearest grid point that is really inside the country
    chosen = [min(cand, key=lambda c: dist(c, q)) for q in centres]
    return sorted({(round(x, 2), round(y, 2)) for x, y in chosen})


def fetch_point(pt):
    lon, lat = pt
    params = {
        "parameters": ",".join(PARAMS),
        "community": "AG",
        "longitude": f"{lon:.2f}",
        "latitude": f"{lat:.2f}",
        "start": START,
        "end": END,
        "format": "JSON",
    }
    data = download_json(API, params=params, timeout=180, retries=10, quiet=True)
    if not data:
        return None
    return data["properties"]["parameter"]


def to_series(param_blocks):
    """Average several POWER points -> {param: {"monthly": [...], "annual": [...]}}."""
    years = list(range(START, END + 1))
    out = {}
    for p, (unit, agg) in PARAMS.items():
        monthly = []
        for y in years:
            for m in range(1, 13):
                vals = []
                for blk in param_blocks:
                    v = blk.get(p, {}).get(f"{y}{m:02d}")
                    if v is not None and v > -900:
                        vals.append(v)
                monthly.append(sum(vals) / len(vals) if vals else None)
        # unit conversions
        if p in ("GWETROOT", "GWETTOP"):
            monthly = [None if v is None else v * 100 for v in monthly]
        if p == "PRECTOTCORR":
            monthly = [None if v is None else v * DAYS[i % 12] for i, v in enumerate(monthly)]
        annual = []
        for yi in range(len(years)):
            block = monthly[yi * 12:(yi + 1) * 12]
            if any(v is None for v in block):
                annual.append(None)
            else:
                annual.append(sum(block) if agg == "sum" else sum(block) / 12)
        r = 2 if p in ("QV2M", "WS2M", "ALLSKY_SFC_SW_DWN") else 1 if p != "PRECTOTCORR" else 0
        out[p] = {
            "unit": unit,
            "monthly": [None if v is None else round(v, r + 1) for v in monthly],
            "annual": [None if v is None else round(v, r + 1) for v in annual],
        }
    return out


def main():
    geo = read_json("geo/countries.json")
    quant = geo["quant"]
    countries = [c for c in geo["countries"] if c["area"] > 0]
    random.seed(7)
    jobs = []
    for c in countries:
        pts = sample_points(c, quant, 12 if c["id"] not in ("RUS", "CAN", "USA", "CHN", "BRA", "AUS", "ATA") else 16)
        jobs.append((c, pts))
    all_pts = sorted({p for _, pts in jobs for p in pts})
    log(f"{len(countries)} countries, {len(all_pts)} POWER points")
    res = parallel(fetch_point, all_pts, workers=3, desc="POWER")
    by_pt = dict(zip(all_pts, res))
    summary = {"years": [START, END], "params": {p: u for p, (u, _) in PARAMS.items()}, "countries": {}}
    for c, pts in jobs:
        blocks = [by_pt[p] for p in pts if by_pt.get(p)]
        if not blocks:
            log(f"  no data for {c['id']}")
            continue
        series = to_series(blocks)
        doc = {
            "id": c["id"],
            "name": c["name"],
            "points": pts,
            "source": "NASA POWER monthly point API (MERRA-2 / GEOS / CERES), community AG",
            "years": [START, END],
            "series": series,
        }
        path = OUT / "countries" / f"{c['id']}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        summary["countries"][c["id"]] = {p: s["annual"] for p, s in series.items()}
    write_json("power_annual.json", summary)
    log("done.")


if __name__ == "__main__":
    main()
