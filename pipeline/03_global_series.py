"""Step 3 — planet-wide time series (the "big picture" charts).

  gistemp        NASA GISS GISTEMP v4 global surface temperature anomaly (vs 1951–1980)
  co2            NOAA GML Mauna Loa CO₂, annual mean (NASA partner data)
  ozone_area     NASA Ozone Watch: mean ozone-hole area, 7 Sep – 13 Oct
  ozone_min      NASA Ozone Watch: minimum total ozone, 21 Sep – 16 Oct
  arctic_ice     NSIDC Sea Ice Index v4: Arctic sea-ice extent in September (yearly minimum)
  antarctic_ice  NSIDC Sea Ice Index v4: Antarctic sea-ice extent in February (yearly minimum)

Output: public/data/global.json
"""
from __future__ import annotations

import csv
import io

from common import download, log, write_json


def gistemp():
    # NASA GISS directly; if the GISS server is unreachable use the mirror kept by
    # the open "datasets/global-temp" project (same GISTEMP numbers, CSV format).
    try:
        raw = download("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv", timeout=40, retries=2, quiet=True)
        lines = raw.decode("utf-8").splitlines()[1:]
        rows = list(csv.DictReader(lines))
        years, vals = [], []
        for r in rows:
            try:
                y, v = int(r["Year"]), float(r["J-D"])   # "***" for the unfinished year
            except (ValueError, KeyError, TypeError):
                continue
            years.append(y)
            vals.append(v)
        src = "NASA GISS GISTEMP v4 (data.giss.nasa.gov)"
    except Exception as e:
        log(f"  GISS unreachable ({e.__class__.__name__}), using the datasets/global-temp mirror of GISTEMP")
        raw = download("https://raw.githubusercontent.com/datasets/global-temp/main/data/annual.csv")
        rows = [r for r in csv.DictReader(io.StringIO(raw.decode("utf-8"))) if r["Source"] == "GISTEMP"]
        rows.sort(key=lambda r: int(r["Year"]))
        years = [int(r["Year"]) for r in rows]
        vals = [round(float(r["Mean"]), 3) for r in rows]
        src = "NASA GISS GISTEMP v4 (via github.com/datasets/global-temp mirror)"
    return {"years": years, "values": vals, "unit": "°C", "baseline": "1951–1980", "source": src}


def co2():
    raw = download("https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.csv").decode("utf-8")
    lines = [l for l in raw.splitlines() if l and not l.startswith("#")]
    rows = list(csv.DictReader(lines))
    return {"years": [int(r["year"]) for r in rows], "values": [float(r["mean"]) for r in rows], "unit": "ppm",
            "source": "NOAA Global Monitoring Laboratory, Mauna Loa Observatory"}


def ozone():
    raw = download("https://ozonewatch.gsfc.nasa.gov/statistics/annual_data.txt").decode("utf-8")
    years, area, mn = [], [], []
    for line in raw.splitlines():
        parts = line.split()
        if len(parts) >= 3 and parts[0].isdigit():
            years.append(int(parts[0]))
            area.append(float(parts[1]) if parts[1] not in ("-", "NaN") else None)
            mn.append(float(parts[2]) if parts[2] not in ("-", "NaN") else None)
    src = "NASA Ozone Watch (TOMS, OMI, OMPS; gaps filled from MERRA-2)"
    return ({"years": years, "values": area, "unit": "млн км²|million km²", "source": src},
            {"years": years, "values": mn, "unit": "DU", "source": src})


def sea_ice(hemi: str, month: int):
    url = f"https://noaadata.apps.nsidc.org/NOAA/G02135/{'north' if hemi == 'N' else 'south'}/monthly/data/{hemi}_{month:02d}_extent_v4.0.csv"
    raw = download(url).decode("utf-8")
    rows = list(csv.reader(io.StringIO(raw)))
    years, vals = [], []
    for r in rows[1:]:
        try:
            y, ext = int(r[0]), float(r[4])
        except (ValueError, IndexError):
            continue
        if ext < 0:   # -9999 = missing month
            continue
        years.append(y)
        vals.append(ext)
    return {"years": years, "values": vals, "unit": "млн км²|million km²", "source": "NSIDC Sea Ice Index v4 (G02135)"}


def main():
    log("global series…")
    out = {"gistemp": gistemp(), "co2": co2()}
    out["ozone_area"], out["ozone_min"] = ozone()
    out["arctic_ice"] = sea_ice("N", 9)
    out["antarctic_ice"] = sea_ice("S", 2)
    for k, v in out.items():
        log(f"  {k}: {v['years'][0]}–{v['years'][-1]} ({len(v['years'])} values)")
    write_json("global.json", out, compact=False)


if __name__ == "__main__":
    main()
