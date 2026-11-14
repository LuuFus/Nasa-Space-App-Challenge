"""Step 8 — how big fires grew, moved and died out (NASA FIRMS detections).

For every fire event on the map we keep each satellite fire detection inside the
event's box and dates: where it was, on which day, how strong (FRP, megawatts).
The website plays them day by day, draws the daily "centre of fire" track (which
way the fire spread) and a small chart of detections per day.

Output: public/data/fires/<event>.json
"""
from __future__ import annotations

import csv
import datetime as dt
import io
import math

from common import download, log, write_json

BASE = "https://firms.modaps.eosdis.nasa.gov/data/country/{sensor}/{y}/{sensor}_{y}_{c}.csv"

EVENTS = [
    # id, sensor, country file(s), bbox [w, s, e, n], first day, last day
    ("chornobyl_2020", "viirs-snpp", ["Ukraine"], [29.2, 50.85, 30.85, 51.75], "2020-03-28", "2020-04-30"),
    ("front_fires_2022", "viirs-snpp", ["Ukraine"], [35.6, 48.6, 39.2, 50.4], "2022-08-20", "2022-10-10"),
    ("south_front_2023", "viirs-snpp", ["Ukraine"], [33.8, 46.6, 37.8, 48.1], "2023-06-01", "2023-09-30"),
    ("australia", "modis", ["Australia"], [144.0, -39.0, 152.5, -32.5], "2019-11-01", "2020-02-29"),
    ("canada2023", "modis", ["Canada"], [-80.5, 45.5, -68.0, 55.5], "2023-05-25", "2023-07-31"),
]


def rows(sensor, country, year):
    raw = download(BASE.format(sensor=sensor, y=year, c=country), timeout=600)
    if raw is None:
        log(f"  no file for {sensor} {country} {year}")
        return []
    return list(csv.DictReader(io.StringIO(raw.decode("utf-8"))))


def bearing(lon1, lat1, lon2, lat2):
    y = math.sin(math.radians(lon2 - lon1)) * math.cos(math.radians(lat2))
    x = math.cos(math.radians(lat1)) * math.sin(math.radians(lat2)) - math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(math.radians(lon2 - lon1))
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def km(lon1, lat1, lon2, lat2):
    dlat, dlon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(a))


def main():
    for eid, sensor, countries, (w, s, e, n), d0, d1 in EVENTS:
        t0, t1 = dt.date.fromisoformat(d0), dt.date.fromisoformat(d1)
        years = range(t0.year, t1.year + 1)
        pts = []
        for c in countries:
            for y in years:
                for r in rows(sensor, c, y):
                    try:
                        lon, lat = float(r["longitude"]), float(r["latitude"])
                        day = dt.date.fromisoformat(r["acq_date"])
                    except (KeyError, ValueError):
                        continue
                    if not (w <= lon <= e and s <= lat <= n and t0 <= day <= t1):
                        continue
                    conf = (r.get("confidence") or "").strip().lower()
                    if conf in ("l", "low") or (conf.isdigit() and int(conf) < 30):
                        continue
                    if (r.get("type") or "0").strip() == "2":   # static industrial heat source
                        continue
                    frp = float(r.get("frp") or 0)
                    pts.append((round(lon, 4), round(lat, 4), (day - t0).days, round(frp, 1)))
        ndays = (t1 - t0).days + 1
        daily = [0] * ndays
        sx, sy, sw = [0.0] * ndays, [0.0] * ndays, [0.0] * ndays
        for lon, lat, d, frp in pts:
            daily[d] += 1
            wgt = max(1.0, frp)
            sx[d] += lon * wgt
            sy[d] += lat * wgt
            sw[d] += wgt
        centre = [[round(sx[d] / sw[d], 4), round(sy[d] / sw[d], 4)] if sw[d] else None for d in range(ndays)]
        active = [d for d in range(ndays) if daily[d]]
        summary = {}
        if active:
            peak = max(range(ndays), key=lambda d: daily[d])
            first, last = active[0], active[-1]
            # where the fire was in its first and last quarter of active days -> spread direction
            q = max(1, len(active) // 4)
            def mean_centre(days):
                xs = [centre[d] for d in days if centre[d]]
                return [sum(p[0] for p in xs) / len(xs), sum(p[1] for p in xs) / len(xs)]
            a, b = mean_centre(active[:q]), mean_centre(active[-q:])
            summary = {
                "total": len(pts), "firstDay": first, "lastDay": last, "peakDay": peak, "peakCount": daily[peak],
                "from": [round(a[0], 3), round(a[1], 3)], "to": [round(b[0], 3), round(b[1], 3)],
                "bearing": round(bearing(a[0], a[1], b[0], b[1])), "shiftKm": round(km(a[0], a[1], b[0], b[1])),
                "sumFrp": round(sum(p[3] for p in pts)),
            }
        write_json(f"fires/{eid}.json", {
            "event": eid, "sensor": sensor.upper(), "bbox": [w, s, e, n], "start": d0, "days": ndays,
            "points": [list(p) for p in pts], "daily": daily, "centre": centre, "summary": summary,
            "source": f"NASA FIRMS {sensor.upper()} archive ({', '.join(countries)}), confidence ≥ nominal",
        })
        log(f"{eid}: {len(pts)} detections, summary {summary}")


if __name__ == "__main__":
    main()
