"""Step 5 — fires in Ukraine before and during the full-scale war (NASA FIRMS).

NASA FIRMS publishes every MODIS fire detection per country and year as open CSV
files (no key needed). We count detections per year and month, split by oblast,
and compare the oblasts on the front line with the rest of Ukraine and with
neighbouring countries. Agricultural burning (spring/autumn) is a big part of
Ukraine's fires, so the summer months and the front-line share matter most.

Output: public/data/firms_ukraine.json
"""
from __future__ import annotations

import csv
import io
import json

from common import download, log, parallel, point_in_polygons, read_json, write_json

BASE = "https://firms.modaps.eosdis.nasa.gov/data/country/modis/{y}/modis_{y}_{c}.csv"
YEARS = list(range(2001, 2026))
FRONT = {"UA-14": "Donetsk", "UA-09": "Luhansk", "UA-63": "Kharkiv", "UA-23": "Zaporizhzhia", "UA-65": "Kherson"}
NEIGHBOURS = ["Poland", "Belarus", "Moldova", "Romania"]


def decode(flat, quant):
    out, x, y = [], 0, 0
    for i in range(0, len(flat), 2):
        if i == 0:
            x, y = flat[0], flat[1]
        else:
            x += flat[i]
            y += flat[i + 1]
        out.append((x / quant, y / quant))
    return out


def rows(country, year):
    raw = download(BASE.format(y=year, c=country), timeout=300)
    if raw is None:
        return []
    out = []
    for r in csv.DictReader(io.StringIO(raw.decode("utf-8"))):
        try:
            conf = int(r["confidence"])
            typ = int(r.get("type") or 0)
        except ValueError:
            continue
        if conf < 30 or typ == 2:   # drop low-confidence points and static industrial heat sources
            continue
        out.append((float(r["longitude"]), float(r["latitude"]), int(r["acq_date"][5:7])))
    return out


def main():
    obl = read_json("geo/ukraine_oblasts.json")
    q = obl["quant"]
    oblasts = []
    for o in obl["oblasts"]:
        polys = [[decode(r, q) for r in p] for p in o["polys"]]
        xs = [p[0] for poly in polys for p in poly[0]]
        ys = [p[1] for poly in polys for p in poly[0]]
        oblasts.append({"id": o["id"], "name": o["name"], "polys": polys, "bbox": (min(xs), min(ys), max(xs), max(ys))})

    def oblast_of(lon, lat):
        for o in oblasts:
            b = o["bbox"]
            if b[0] <= lon <= b[2] and b[1] <= lat <= b[3] and point_in_polygons(lon, lat, o["polys"]):
                return o["id"]
        return None

    log("FIRMS MODIS detections for Ukraine…")
    per_year = parallel(lambda y: rows("Ukraine", y), YEARS, workers=4, desc="Ukraine")
    total, front, rest = [], [], []
    monthly_front, monthly_rest = [], []
    by_oblast = {o["id"]: [0] * len(YEARS) for o in oblasts}
    grid = {}
    for yi, pts in enumerate(per_year):
        mf, mr = [0] * 12, [0] * 12
        for lon, lat, m in pts:
            oid = oblast_of(lon, lat)
            if oid:
                by_oblast[oid][yi] += 1
            if oid in FRONT:
                mf[m - 1] += 1
            else:
                mr[m - 1] += 1
            key = (round(lon * 4) / 4, round(lat * 4) / 4)   # 0.25° cells for the map
            g = grid.setdefault(key, [0] * len(YEARS))
            g[yi] += 1
        total.append(len(pts))
        front.append(sum(mf))
        rest.append(sum(mr))
        monthly_front.append(mf)
        monthly_rest.append(mr)
        log(f"  {YEARS[yi]}: {len(pts):6d} fires, front-line oblasts {sum(mf):5d}")

    log("neighbouring countries…")
    neigh = {}
    for c in NEIGHBOURS:
        res = parallel(lambda y: len(rows(c, y)), YEARS, workers=4, desc=c)
        neigh[c] = res

    write_json("firms_ukraine.json", {
        "source": "NASA FIRMS, MODIS Collection 6.1 standard product, per-country archives (confidence ≥ 30, static sources excluded)",
        "years": YEARS,
        "total": total, "front": front, "rest": rest,
        "frontOblasts": FRONT,
        "monthlyFront": monthly_front, "monthlyRest": monthly_rest,
        "byOblast": {o["id"]: {"name": o["name"], "counts": by_oblast[o["id"]]} for o in oblasts},
        "neighbours": neigh,
        "grid": [[k[0], k[1], v] for k, v in grid.items()],
    })


if __name__ == "__main__":
    main()
