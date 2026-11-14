"""Step 9 — "why did it happen?" for the 2026 events.

For each event we take NASA POWER DAILY weather at the place from 1991 to the
event. Everything is computed the same way from daily values (so a 2026 month is
compared with exactly the same kind of number in 1991–2020):
  * the 12 months before the event: monthly mean vs the 1991–2020 normal, and the
    rank of that month among the same months of 1991–2026 (1 = lowest ever);
  * the last 60 days (+15 after) day by day with the day-of-year normal.
The website turns this into charts and a plain explanation.

Output: public/data/causes/<event>.json
"""
from __future__ import annotations

import datetime as dt

from common import download_json, log, write_json

DAILY = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMS = ["T2M", "T2M_MAX", "PRECTOTCORR", "GWETROOT", "RH2M", "WS2M", "PRECSNOLAND"]
LAST = dt.date(2026, 11, 8)

EVENTS = [
    # id, kind, lon, lat, event date
    ("morrill_fire_2026", "fire", -102.3, 41.4, "2026-03-12"),
    ("cottonwood_fire_2026", "fire", -112.38, 38.32, "2026-06-23"),
    ("europe_heat_2026", "heat", -0.58, 44.84, "2026-06-24"),
    ("isaias_2026", "hurricane", -86.5, 30.39, "2026-10-10"),
    ("lake_powell_2026", "drought", -106.4, 39.6, "2026-09-10"),
    ("thailand_floods_2026", "flood", 101.52, 13.99, "2026-10-02"),
]


def main():
    for eid, kind, lon, lat, date in EVENTS:
        ev = dt.date.fromisoformat(date)
        end = min(ev + dt.timedelta(days=15), LAST)
        data = download_json(DAILY, params={
            "community": "AG", "longitude": f"{lon:.2f}", "latitude": f"{lat:.2f}", "format": "JSON",
            "parameters": ",".join(PARAMS), "start": "19910101", "end": end.strftime("%Y%m%d")}, timeout=600, retries=10)
        par = data["properties"]["parameter"]
        # daily values as {date: value}
        series = {p: {dt.date(int(k[:4]), int(k[4:6]), int(k[6:])): v for k, v in par.get(p, {}).items() if v is not None and v > -900} for p in PARAMS}
        # monthly means for every year
        mon = {p: {} for p in PARAMS}
        for p in PARAMS:
            acc = {}
            for d, v in series[p].items():
                acc.setdefault((d.year, d.month), []).append(v)
            mon[p] = {k: sum(v) / len(v) for k, v in acc.items() if len(v) >= 20 or k == (ev.year, ev.month)}
        # day-of-year normal 1991–2020 (±7-day window)
        doy_norm = {}
        for p in PARAMS:
            acc = [[] for _ in range(367)]
            for d, v in series[p].items():
                if d.year <= 2020:
                    acc[d.timetuple().tm_yday].append(v)
            sm = []
            for i in range(367):
                w = [v for j in range(i - 7, i + 8) for v in acc[(j - 1) % 366 + 1]]
                sm.append(sum(w) / len(w) if w else None)
            doy_norm[p] = sm
        months = []
        y, m = ev.year - 1, ev.month
        for _ in range(13):
            row = {"month": f"{y}-{m:02d}"}
            for p in PARAMS:
                if (y, m) not in mon[p]:
                    continue
                val = mon[p][(y, m)]
                normals = [mon[p][(yy, m)] for yy in range(1991, 2021) if (yy, m) in mon[p]]
                same = sorted(mon[p][(yy, m)] for yy in range(1991, ev.year + 1) if (yy, m) in mon[p])
                row[p] = {"value": round(val, 3), "normal": round(sum(normals) / len(normals), 3),
                          "rankLow": 1 + sum(1 for v in same if v < val), "years": len(same)}
            months.append(row)
            m += 1
            if m == 13:
                y, m = y + 1, 1
        days = []
        d = ev - dt.timedelta(days=60)
        while d <= end:
            rec = {"date": d.isoformat()}
            for p in PARAMS:
                if d in series[p]:
                    rec[p] = round(series[p][d], 2)
                    n = doy_norm[p][d.timetuple().tm_yday]
                    if n is not None:
                        rec[p + "_n"] = round(n, 2)
            days.append(rec)
            d += dt.timedelta(days=1)
        write_json(f"causes/{eid}.json", {
            "event": eid, "kind": kind, "point": [lon, lat], "date": date, "months": months, "days": days,
            "source": "NASA POWER daily point data 1991–2026 (MERRA-2/GEOS meteorology, IMERG precipitation); normals 1991–2020",
        })
        ev_row = next((r for r in months if r["month"] == ev.strftime("%Y-%m")), {})
        log(f"{eid}: " + ", ".join(f"{p}={ev_row[p]['value']} (norm {ev_row[p]['normal']}, rank {ev_row[p]['rankLow']}/{ev_row[p]['years']})"
                                   for p in ("T2M_MAX", "PRECTOTCORR", "GWETROOT", "RH2M") if p in ev_row))


if __name__ == "__main__":
    main()
