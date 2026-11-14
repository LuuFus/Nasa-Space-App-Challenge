"""Step 7 — the front line in Ukraine, month by month (2022–2026).

Source: DeepStateMap (deepstatemap.live), a Ukrainian open-source map of the war,
daily snapshots since 3 April 2022. © DeepStateMap — used with attribution for a
non-commercial educational project. We keep one snapshot per month (the first
one of the month) plus the latest one, and only the classes about Ukraine:

  occupied   territory occupied since 24 Feb 2022
  ordlo      parts of Donetsk and Luhansk oblasts occupied since 2014
  crimea     Crimea (occupied since 2014), incl. Tuzla island
  contested  "unknown status" — the grey zone along the front
  liberated  territory liberated by Ukraine's Defence Forces

Output: public/data/front.json  (polygons per month + occupied area in km²)
"""
from __future__ import annotations

import datetime as dt
import json

from common import download, log, parallel, ring_area_km2, signed_area, write_json

LIST = "https://deepstatemap.live/api/history/public"
SNAP = "https://deepstatemap.live/api/history/{id}/geojson"
QUANT = 2000
TOL = 0.004   # ~400 m
CLASSES = {
    "geoJSON.status.occupied": "occupied",
    "geoJSON.territories.ordlo": "ordlo",
    "geoJSON.territories.crimea": "crimea",
    "geoJSON.territories.tuzla": "crimea",
    "geoJSON.status.unknown": "contested",
    "geoJSON.status.dismissed": "liberated",
}


# DeepState also marks occupied regions of other countries; this project is about Ukraine
NOT_UKRAINE = ["Придністров", "Transnistria", "Петсамо", "Салла", "Естон", "Печор", "Латві", "Куриль",
               "Цхінвал", "Пруссі", "Абхаз", "Карелі", "Ічкері"]
FILL = {"#a52714": "occupied", "#bcaaa4": "contested", "#0f9d58": "liberated", "#0288d1": "liberated"}


def classify(name: str, fill: str | None):
    """New snapshots carry a machine tag; older ones only a free-text name and a colour."""
    n = name.replace("\n", " ")
    if any(k in n for k in NOT_UKRAINE):
        return None
    tag = n.split("///")[-1].strip().split(" {{")[0].replace("geoJSON.status.dismissed_at", "geoJSON.status.dismissed")
    if tag in CLASSES:
        return CLASSES[tag]
    if "ОРДЛО" in n or "CADR" in n:
        return "ordlo"
    if "Крим" in n or "Crimea" in n or "Тузл" in n:
        return "crimea"
    return FILL.get((fill or "").lower())


def dp(points, tol):
    """Douglas–Peucker for a closed ring (keeps first point)."""
    if len(points) < 5:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]
        bx, by = points[b]
        dx, dy = bx - ax, by - ay
        L2 = dx * dx + dy * dy or 1e-18
        best, idx = -1.0, -1
        for i in range(a + 1, b):
            px, py = points[i]
            t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L2))
            d2 = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2
            if d2 > best:
                best, idx = d2, i
        if best > tol * tol:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(points, keep) if k]


def encode(ring):
    out, px, py = [], 0, 0
    for i, (x, y) in enumerate(ring):
        qx, qy = round(x * QUANT), round(y * QUANT)
        out += [qx, qy] if i == 0 else [qx - px, qy - py]
        px, py = qx, qy
    return out


def polygons(geom):
    if geom is None:
        return []
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return geom["coordinates"]
    if geom["type"] == "GeometryCollection":   # used in the 2022 snapshots
        return [p for g in geom["geometries"] for p in polygons(g)]
    return []


def process(snapshot_id):
    data = download(SNAP.format(id=snapshot_id), timeout=180)
    if data is None:
        return None
    g = json.loads(data)
    feats = g["map"]["features"] if "map" in g else g["features"]
    out = {k: [] for k in set(CLASSES.values())}
    area = {k: 0.0 for k in out}
    for f in feats:
        cls = classify(f["properties"].get("name", ""), f["properties"].get("fill"))
        if not cls:
            continue
        for poly in polygons(f["geometry"]):
            rings = []
            for k, ring in enumerate(poly):
                pts = [(float(c[0]), float(c[1])) for c in ring]
                if len(pts) > 1 and pts[0] == pts[-1]:
                    pts = pts[:-1]
                if len(pts) < 3:
                    continue
                # exterior counter-clockwise, holes clockwise (so canvas "nonzero" fill works)
                if (signed_area(pts) > 0) != (k == 0):
                    pts.reverse()
                a = ring_area_km2(pts)
                area[cls] += a if k == 0 else -a
                pts = dp(pts + [pts[0]], TOL)[:-1]
                if len(pts) >= 3:
                    rings.append(encode(pts))
            if rings:
                out[cls].append(rings)
    return out, {k: round(v) for k, v in area.items()}


def main():
    lst = json.loads(download(LIST, cache=False, timeout=120))
    snaps = sorted((s["id"], dt.datetime.fromtimestamp(s["id"], dt.UTC)) for s in lst)
    chosen, seen = [], set()
    for sid, t in snaps:
        key = (t.year, t.month)
        if key not in seen:
            seen.add(key)
            chosen.append((sid, t))
    if chosen[-1][0] != snaps[-1][0]:
        chosen.append(snaps[-1])
    log(f"DeepStateMap: {len(snaps)} snapshots, keeping {len(chosen)} (one per month + latest)")
    results = parallel(lambda s: process(s[0]), chosen, workers=4, desc="snapshots")
    # early snapshots have no separate Crimea polygon: Crimea has been occupied since 2014
    crimea = next((r[0]["crimea"] for r in reversed(results) if r and r[0]["crimea"]), [])
    crimea_area = next((r[1]["crimea"] for r in reversed(results) if r and r[1]["crimea"]), 0)
    for r in results:
        if r and not r[0]["crimea"]:
            r[0]["crimea"] = crimea
            r[1]["crimea"] = crimea_area
    out = []
    for (sid, t), res in zip(chosen, results):
        if not res:
            continue
        polys, area = res
        out.append({"date": t.strftime("%Y-%m-%d"), "id": sid, "polys": polys, "area": area})
        log(f"  {t:%Y-%m-%d}: occupied {area['occupied'] + area['ordlo'] + area['crimea']:>8,} km²  (since 2022: {area['occupied']:,})")
    write_json("front.json", {
        "source": "© DeepStateMap (deepstatemap.live) — monthly snapshots",
        "quant": QUANT, "snapshots": out,
    })


if __name__ == "__main__":
    main()
