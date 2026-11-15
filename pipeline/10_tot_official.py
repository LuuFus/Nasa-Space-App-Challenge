"""Step 10 — front line in Ukraine from OFFICIAL open data (replaces DeepStateMap).

Inputs
  * The official "List of territories where hostilities are (were) conducted or
    which are temporarily occupied by the Russian Federation" — order of the
    Ministry of Development No. 376 of 28.02.2025 (current edition). Its annexes
    (.docx, one per group of oblasts) are downloaded by hand from
    https://zakon.rada.gov.ua/laws/show/z0380-25 into pipeline/data/tot/.
    Official documents are not subject to copyright (Law of Ukraine
    "On Copyright and Related Rights", art. 8).
  * Borders of Ukrainian territorial communities (hromadas): OCHA COD-AB
    Ukraine, admin level 3, Humanitarian Data Exchange — licence CC BY-IGO.

Every row of the list has a KATOTTG code, its kind (possible hostilities /
active hostilities / temporarily occupied) and dates (start / end). Since the
edition of 26.05.2026 (order No. 987) the list goes settlement by settlement and
the kind is written in every row. From it we rebuild, for 23 February 2022 and
the 1st of every month after it, which communities were occupied, which had
active hostilities and which had been liberated. Precision is one community
(on average ~300 km²): a community is "occupied" when at least half of its
listed settlements are, "partly occupied" when fewer are (not counted in the
occupied area).

Output: public/data/front.json (format "communities", read by src/engine/Front.js)
"""
from __future__ import annotations

import datetime as dt
import importlib.util
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree

from common import CACHE, ROOT, download, download_json, log, write_json

TOT_DIR = ROOT / "pipeline" / "data" / "tot"
OCHA_ZIP = CACHE / "ocha" / "ukr_admin.geojson.zip"
OCHA_URL = "https://data.humdata.org/dataset/cod-ab-ukr"
OCHA_API = "https://data.humdata.org/api/3/action/package_show?id=cod-ab-ukr"
LIST_URL = "https://zakon.rada.gov.ua/laws/show/z0380-25"
CODE = re.compile(r"UA\d{17}")
DATE = re.compile(r"(\d{2})\.(\d{2})\.(\d{4})")
NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
CRIMEA = ("UA01", "UA85")             # Autonomous Republic of Crimea, Sevastopol
CRIMEA_SINCE = dt.date(2014, 2, 20)
TOL = 0.004                          # simplification, degrees (~400 m)

# re-use the topology-preserving simplification of step 1
_spec = importlib.util.spec_from_file_location("geo1", Path(__file__).with_name("01_geography.py"))
geo1 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(geo1)


# ---------------------------------------------------------------- the list
def _text(el):
    return "".join(t.text or "" for t in el.iter(NS + "t")).strip()


def read_rows(path):
    """Table rows (list of cell texts) and free paragraphs, in document order."""
    with zipfile.ZipFile(path) as z:
        root = ElementTree.fromstring(z.read("word/document.xml"))
    for el in root.find(NS + "body"):
        if el.tag == NS + "tbl":
            for tr in el.iter(NS + "tr"):
                yield [" ".join(_text(p) for p in tc.iter(NS + "p")).strip() for tc in tr.findall(NS + "tc")]
        elif el.tag == NS + "p":
            t = _text(el)
            if t:
                yield [t]


def section_of(text, current):
    """Headings of the list: II. occupied; I.1 possible / I.2 active hostilities."""
    t = text.lower()
    if len(t) > 250:
        return current
    if "тимчасово окупован" in t:
        return "occupied"
    if "активних бойових" in t:
        return "active"
    if "можливих бойових" in t:
        return "possible"
    return current


def row_kind(cell):
    """kind of territory written in one table cell (short cells only, not the header)"""
    t = cell.lower()
    if not t or len(t) > 90:
        return None
    if "тимчасово окупован" in t:
        return "occupied"
    if "активних бойових" in t:
        return "active"
    if "можливих бойових" in t:
        return "possible"
    return None


def parse_list():
    files = sorted(TOT_DIR.glob("*.docx"))
    if not files:
        sys.exit(f"No .docx files in {TOT_DIR}.\nDownload the annexes of order No. 376 from {LIST_URL} first.")
    entries = []
    for f in files:
        section, n0 = None, len(entries)
        for cells in read_rows(f):
            joined = " | ".join(cells)
            codes = CODE.findall(joined)
            if not codes:
                section = section_of(joined, section)
                continue
            dates = [dt.date(int(y), int(m), int(d)) for d, m, y in DATE.findall(joined)]
            name = next((c for c in cells if c and not CODE.search(c) and not DATE.search(c) and not c.isdigit()), "")
            # newer editions name the kind of territory in the row itself
            kind = next((k for k in map(row_kind, cells) if k), None)
            entries.append({"code": codes[0], "section": kind or section, "name": name[:120],
                            "start": dates[0] if dates else None, "end": dates[1] if len(dates) > 1 else None})
        log(f"  {f.name}: {len(entries) - n0} rows with a KATOTTG code")
    by = {}
    for e in entries:
        by[e["section"]] = by.get(e["section"], 0) + 1
    log(f"  rows by section: {by}")
    if not by.get("occupied"):
        sys.exit("No 'temporarily occupied' section found — check the headings of the .docx files.")
    return entries


# ---------------------------------------------------------------- borders
def load_hromadas():
    if not OCHA_ZIP.exists():  # the current GeoJSON package of the dataset
        res = download_json(OCHA_API, cache=False)["result"]["resources"]
        url = next(r["url"] for r in res if r["url"].endswith("geojson.zip"))
        log(f"  downloading {url}")
        OCHA_ZIP.parent.mkdir(parents=True, exist_ok=True)
        OCHA_ZIP.write_bytes(download(url, timeout=600))
    with zipfile.ZipFile(OCHA_ZIP) as z:
        feats = json.loads(z.read("ukr_admin3.geojson"))["features"]
    out = {}
    for f in feats:
        p, g = f["properties"], f["geometry"]
        out[p["adm3_pcode"]] = {
            "name": {"uk": p.get("adm3_name1") or p["adm3_name"], "en": p["adm3_name"]},
            "oblast": p["adm1_pcode"], "area": p.get("area_sqkm") or 0,
            "polys": [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"],
        }
    return out


def targets(code, hrom):
    """KATOTTG code -> [(community pcode, partial?)].

    KATOTTG: UA + oblast(2) + raion(2) + community(3) + settlement(3) + id(7).
    OCHA pcode of a community = the first 9 characters.
    """
    oblast, raion, comm, settl = code[2:4], code[4:6], code[6:9], code[9:12]
    if comm != "000":
        pc = "UA" + oblast + raion + comm
        return [(pc, settl != "000")] if pc in hrom else []
    prefix = "UA" + oblast + (raion if raion != "00" else "")
    return [(pc, False) for pc in hrom if pc.startswith(prefix)]


def build_geometry(hrom, used):
    """Simplify all used communities together, so shared borders stay identical
    (the website finds the front line by dropping edges two communities share)."""
    rings, owner = [], []
    for pc in used:
        for pi, poly in enumerate(hrom[pc]["polys"]):
            for ri, ring in enumerate(poly):
                rings.append(geo1.clean_ring(ring))
                owner.append((pc, pi, ri))
    geom = {}
    for (pc, pi, ri), r in zip(owner, geo1.simplify_topological(rings, TOL)):
        if len(r) >= 3:
            geom.setdefault(pc, {}).setdefault(pi, {})[ri] = geo1.orient(r, ri == 0)
    out = {}
    for pc in used:
        polys = [[geo1.encode_ring(r) for _, r in sorted(rs.items())]
                 for _, rs in sorted(geom.get(pc, {}).items()) if 0 in rs]
        out[pc] = {"name": hrom[pc]["name"], "area": round(hrom[pc]["area"]), "polys": polys}
    return out


# ---------------------------------------------------------------- snapshots
def classify(spans, hrom, day):
    """class of every listed community on `day`, from the state of its settlements"""
    st = {}
    for pc, section, start, end, partial, code in spans:
        s = st.setdefault(pc, {"all": set(), "occ": set(), "old": set(), "act": set(), "lib": set(), "whole": False})
        s["all"].add(code)
        active = start is not None and start <= day and (end is None or end > day)
        if section == "occupied":
            if active:
                s["occ"].add(code)
                if start < dt.date(2022, 2, 24):
                    s["old"].add(code)
                if not partial:            # the row names the whole community
                    s["whole"] = True
            elif end is not None and end <= day:
                s["lib"].add(code)
        elif section == "active" and active:
            s["act"].add(code)
    cls = {}
    for pc, s in st.items():
        occ = len(s["occ"])
        if s["whole"] or occ >= 0.5 * len(s["all"]):
            if occ or s["whole"]:
                if len(s["old"]) >= 0.5 * max(1, occ):
                    cls[pc] = "crimea" if hrom[pc]["oblast"] in CRIMEA else "ordlo"
                else:
                    cls[pc] = "occupied"
                continue
        if occ:
            cls[pc] = "partial"
        elif s["act"]:
            cls[pc] = "contested"
        elif s["lib"] - s["occ"]:
            cls[pc] = "liberated"
    return cls


def month_starts(first, last):
    d = first
    while d <= last:
        yield d
        d = (d.replace(day=28) + dt.timedelta(days=4)).replace(day=1)


def main():
    log("official list of occupied and combat territories (order No. 376)…")
    entries = parse_list()
    hrom = load_hromadas()
    log(f"  {len(hrom)} community borders (OCHA COD-AB)")

    spans, missing = [], []
    for e in entries:
        ts = targets(e["code"], hrom)
        if not ts:
            missing.append(e["code"])
        for pc, partial in ts:
            spans.append((pc, e["section"], e["start"], e["end"], partial, e["code"]))
    if missing:
        log(f"  {len(missing)} codes without a community polygon, e.g. {missing[:5]}")
    # Crimea may live in another annex: it has been occupied since 2014 in any case
    if not any(hrom[s[0]]["oblast"] in CRIMEA and s[1] == "occupied" for s in spans):
        log("  Crimea is not in the files — adding it as occupied since 20.02.2014")
        spans += [(pc, "occupied", CRIMEA_SINCE, None, False, pc) for pc, h in hrom.items() if h["oblast"] in CRIMEA]

    used = sorted({s[0] for s in spans})
    hromadas = build_geometry(hrom, used)
    log(f"  {len(used)} communities appear in the list")

    today = dt.date.today()
    days = [dt.date(2022, 2, 23)] + list(month_starts(dt.date(2022, 3, 1), today))
    snaps = []
    for day in days:
        cls = classify(spans, hrom, day)
        groups = {}
        for pc, k in sorted(cls.items()):
            groups.setdefault(k, []).append(pc)
        area = {k: round(sum(hromadas[pc]["area"] for pc in groups.get(k, [])))
                for k in ("occupied", "ordlo", "crimea", "partial", "contested", "liberated")}
        snaps.append({"date": day.isoformat(), "groups": groups, "area": area})
        if day.month == 3 or day == days[0] or day == days[-1]:
            occ = area["occupied"] + area["ordlo"] + area["crimea"]
            log(f"  {day}: occupied {occ:,} km² (+ partly {area['partial']:,}), "
                f"hostilities {area['contested']:,}, liberated {area['liberated']:,}")

    write_json("front.json", {
        "source": f"Official list of occupied & combat territories, order No. 376 ({LIST_URL}); "
                  f"community borders OCHA COD-AB Ukraine, CC BY-IGO ({OCHA_URL})",
        "attribution": {
            "uk": "Офіційний перелік ТОТ і територій бойових дій (наказ Мінрозвитку № 376) · межі громад © OCHA COD-AB (CC BY-IGO)",
            "en": "Official list of occupied & combat territories (Ministry of Development order No. 376) · community borders © OCHA COD-AB (CC BY-IGO)",
            "short": {"uk": "Наказ № 376 · © OCHA", "en": "Order No. 376 · © OCHA"},
            "url": LIST_URL,
        },
        "format": "communities", "quant": geo1.QUANT, "hromadas": hromadas, "snapshots": snaps,
    })


if __name__ == "__main__":
    main()
