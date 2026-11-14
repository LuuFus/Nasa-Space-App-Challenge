"""Step 4 — catalogue of NASA GIBS map layers shown on the globe.

The curated list below picks layers that a student can understand. For each one
the script reads the official GIBS WMTS capabilities (formats, zoom levels, the
dates that exist) and the official GIBS colour map, and stores a compact legend
so the website can (a) draw the legend and (b) turn a pixel colour back into a
number when you point at the map ("here it is 23 °C").

Output: public/data/layers.json
"""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET

from common import download, log, write_json

CAPS = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml"
NS = {"w": "http://www.opengis.net/wmts/1.0", "ows": "http://www.opengis.net/ows/1.1",
      "xlink": "http://www.w3.org/1999/xlink"}
MAX_LEVEL = {"16km": 2, "2km": 5, "1km": 6, "500m": 7, "250m": 8, "31.25m": 11, "15.625m": 12}

# id, GIBS identifier, category, default date, (uk title, en title), (uk text, en text), extra
CURATED = [
    # ------------------------------------------------------------------ base imagery
    ("bluemarble", "BlueMarble_ShadedRelief_Bathymetry", "base", None,
     ("Блакитний мармур (рельєф)", "Blue Marble (relief)"),
     ("Безхмарна мозаїка Землі зі знімків супутника Terra (MODIS) з тінями гір і глибинами океану. Найкраще для огляду планети.",
      "A cloud-free mosaic of Earth from the Terra satellite (MODIS) with shaded mountains and ocean depths. Best for exploring."),
     {"base": True}),
    ("bluemarble_ng", "BlueMarble_NextGeneration", "base", None,
     ("Блакитний мармур (справжні кольори)", "Blue Marble (true colour)"),
     ("Природні кольори планети без хмар: ліси, пустелі, льоди — такою Землю побачив би астронавт у ясний день.",
      "Earth's natural colours without clouds: forests, deserts and ice, as an astronaut would see it on a clear day."),
     {"base": True}),
    ("truecolor_modis", "MODIS_Terra_CorrectedReflectance_TrueColor", "base", "2025-08-15",
     ("Знімок дня — MODIS Terra (з 2000)", "Picture of the day — MODIS Terra (since 2000)"),
     ("Так Землю бачив супутник Terra саме в обраний день: хмари, дим від пожеж, пилові бурі, сніг. Щодня з 24 лютого 2000 року.",
      "What the Terra satellite saw on the chosen day: clouds, wildfire smoke, dust storms, snow. Every day since 24 Feb 2000."),
     {"base": True}),
    ("truecolor_viirs", "VIIRS_NOAA20_CorrectedReflectance_TrueColor", "base", "2025-08-15",
     ("Знімок дня — VIIRS NOAA-20 (з 2018)", "Picture of the day — VIIRS NOAA-20 (since 2018)"),
     ("Новіший супутник із меншими «щілинами» між смугами зйомки. Зручно дивитися на свіжі події.",
      "A newer satellite with fewer gaps between its imaging swaths. Good for recent events."),
     {"base": True}),
    ("falsecolor_721", "MODIS_Terra_CorrectedReflectance_Bands721", "base", "2022-08-28",
     ("Хибні кольори 7-2-1 (вода, гарі)", "False colour 7-2-1 (water, burn scars)"),
     ("Комбінація інфрачервоних каналів MODIS: вода й повені — темно-сині, рослини — яскраво-зелені, свіжі згарища — червоно-бурі, сніг і лід — блакитні.",
      "A mix of MODIS infrared bands: water and floods are dark blue, plants bright green, fresh burn scars reddish-brown, snow and ice cyan."),
     {"base": True}),
    ("landsat_weld", "Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual", "base", "1984-12-01",
     ("Landsat 1984–2000 (30 м)", "Landsat 1984–2000 (30 m)"),
     ("Детальні річні мозаїки Landsat: кожен піксель — 30 метрів. Дає змогу побачити, якою була Земля 40 років тому (Аральське море, ліси, міста).",
      "Detailed yearly Landsat mosaics, 30 m per pixel. Shows what Earth looked like 40 years ago (Aral Sea, forests, cities)."),
     {"base": True}),
    # ------------------------------------------------------------------ temperature
    ("t2m", "MERRA2_2m_Air_Temperature_Monthly", "temperature", "2025-07-01",
     ("Температура повітря (щомісяця, з 1980)", "Air temperature (monthly, since 1980)"),
     ("Середня температура повітря на висоті 2 м за місяць — як показав би термометр за вікном. Модель MERRA-2 NASA поєднує супутники й метеостанції.",
      "Average monthly air temperature 2 m above the ground, like a thermometer outside your window. NASA's MERRA-2 combines satellites and weather stations."),
     {}),
    ("lst_day", "MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day", "temperature", "2025-07-01",
     ("Температура поверхні суші вдень", "Land surface temperature, day"),
     ("Наскільки нагрівається сама земля (асфальт, пісок, поле) вдень. Влітку вона буває на 10–20 °C гарячіша за повітря — саме так виникають «острови тепла» в містах.",
      "How hot the ground itself (asphalt, sand, fields) gets in the daytime. In summer it can be 10–20 °C hotter than the air — that is how city 'heat islands' form."),
     {}),
    ("lst_night", "MODIS_Terra_L3_Land_Surface_Temp_Monthly_Night", "temperature", "2025-07-01",
     ("Температура поверхні суші вночі", "Land surface temperature, night"),
     ("Як швидко земля охолоджується вночі. Пустелі вночі холодні, а міста — теплі, бо бетон віддає накопичене тепло.",
      "How quickly the ground cools at night. Deserts get cold at night while cities stay warm because concrete releases stored heat."),
     {}),
    ("sst", "GHRSST_L4_MUR_Sea_Surface_Temperature", "temperature", "2025-08-15",
     ("Температура поверхні океану", "Sea surface temperature"),
     ("Температура верхнього шару води в океанах і морях щодня. Тепла вода живить урагани й змінює погоду на суші.",
      "Daily temperature of the top layer of oceans and seas. Warm water feeds hurricanes and changes the weather on land."),
     {}),
    ("sst_anom", "GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies", "climate", "2025-08-15",
     ("Аномалія температури океану", "Sea surface temperature anomaly"),
     ("Наскільки вода зараз тепліша (червоне) чи холодніша (синє), ніж зазвичай у цю пору року. Червоні плями — це «морські хвилі спеки».",
      "How much warmer (red) or colder (blue) the water is than normal for this time of year. Red patches are marine heatwaves."),
     {}),
    # ------------------------------------------------------------------ vegetation
    ("ndvi", "MODIS_Terra_L3_NDVI_Monthly", "vegetation", "2025-07-01",
     ("Рослинність — індекс NDVI", "Vegetation — NDVI"),
     ("Наскільки зелена й жива рослинність. Зелене — густий ліс чи поле в розпалі літа, коричневе — пустеля, сухий степ або зораний ґрунт.",
      "How green and healthy plants are. Green means dense forest or crops in mid-summer, brown means desert, dry steppe or bare soil."),
     {}),
    ("evi", "MODIS_Terra_L3_EVI_Monthly", "vegetation", "2025-07-01",
     ("Рослинність — індекс EVI", "Vegetation — EVI"),
     ("Покращений індекс рослинності: краще за NDVI розрізняє дуже густі ліси (Амазонія, Конго).",
      "Enhanced vegetation index: better than NDVI at telling apart very dense forests (Amazon, Congo)."),
     {}),
    ("landcover", "MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual", "vegetation", "2024-01-01",
     ("Тип поверхні (ліс, поле, місто…)", "Land cover (forest, cropland, city…)"),
     ("Карта того, що вкриває землю: ліси, луки, поля, міста, пустелі, лід. Порівняй роки — і побачиш, де ліс став полем.",
      "A map of what covers the land: forests, grasslands, crops, cities, deserts, ice. Compare years to see where forest became farmland."),
     {}),
    ("chlorophyll", "MODIS_Aqua_L2_Chlorophyll_A", "water", "2025-05-15",
     ("Хлорофіл в океані (Aqua MODIS)", "Ocean chlorophyll (Aqua MODIS)"),
     ("Скільки мікроскопічних водоростей (фітопланктону) у воді. Вони дають половину кисню на планеті. Біля гирл річок хлорофілу більше — річки несуть добрива з полів.",
      "How much microscopic algae (phytoplankton) is in the water. They produce half of Earth's oxygen. River mouths are greener — rivers carry fertiliser from fields."),
     {}),
    # ------------------------------------------------------------------ water & soil
    ("soil", "MERRA2_Soil_Water_Root_Zone_Monthly", "water", "2025-07-01",
     ("Вологість ґрунту (коренева зона, з 1980)", "Soil moisture, root zone (since 1980)"),
     ("Скільки води в ґрунті там, де ростуть корені (до ~1 м). Мало води — посуха і поганий урожай.",
      "How much water is in the soil where roots grow (down to ~1 m). Too little means drought and poor harvests."),
     {}),
    ("soil_smap", "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture", "water", "2025-07-15",
     ("Вологість ґрунту — SMAP (щодня, з 2015)", "Soil moisture — SMAP (daily, since 2015)"),
     ("Супутник SMAP «відчуває» воду в ґрунті мікрохвилями — навіть крізь хмари.",
      "The SMAP satellite senses water in the soil with microwaves — even through clouds."),
     {}),
    ("precip", "MERRA2_Precipitation_Bias_Corrected_Monthly", "water", "2025-07-01",
     ("Опади (щомісяця, з 1980)", "Precipitation (monthly, since 1980)"),
     ("Скільки дощу й снігу випадає в середньому за добу в цьому місяці.",
      "How much rain and snow falls per day on average in this month."),
     {}),
    ("precip_imerg", "IMERG_Precipitation_Rate", "water", "2025-08-15",
     ("Опади за день — IMERG", "Daily precipitation — IMERG"),
     ("Де саме йшов дощ чи сніг у вибраний день (мережа супутників GPM).",
      "Where exactly it rained or snowed on the chosen day (GPM satellite constellation)."),
     {}),
    ("humidity", "AIRS_L3_Surface_Relative_Humidity_Monthly_Day", "water", "2025-07-01",
     ("Вологість повітря (відносна)", "Air humidity (relative)"),
     ("Наскільки повітря насичене водяною парою: 100 % — туман, 20 % — суха пустеля.",
      "How saturated the air is with water vapour: 100% is fog, 20% is a dry desert."),
     {}),
    ("water_vapor", "MERRA2_Total_Precipitable_Water_Vapor_Monthly", "water", "2025-07-01",
     ("Водяна пара в атмосфері", "Water vapour in the air"),
     ("Скільки води «висить» у повітрі над кожним квадратним метром. Тепліше повітря тримає більше пари — тому злива сильніша.",
      "How much water is held in the air above each square metre. Warmer air holds more vapour — so downpours get heavier."),
     {}),
    ("snow", "MODIS_Terra_L3_Snow_Cover_Monthly_Average_Pct", "water", "2025-01-01",
     ("Сніговий покрив", "Snow cover"),
     ("Яка частка землі вкрита снігом у цьому місяці. Порівняй зими різних років.",
      "What share of the land is covered by snow this month. Compare winters of different years."),
     {}),
    ("seaice", "AMSRU2_Sea_Ice_Concentration_12km", "water", "2025-09-01",
     ("Морський лід", "Sea ice"),
     ("Де океан вкритий кригою. У вересні арктичного льоду найменше за рік.",
      "Where the ocean is covered by ice. Arctic ice is at its smallest each September."),
     {}),
    ("grace", "GRACE_Tellus_Liquid_Water_Equivalent_Thickness_Mascon_CRI", "water", None,
     ("Запаси води (GRACE)", "Water storage (GRACE)"),
     ("Супутники-близнюки GRACE «зважують» воду за силою тяжіння: червоне — води (у ґрунті, льодовиках, підземних шарах) стало менше, синє — більше.",
      "The GRACE twin satellites 'weigh' water using gravity: red means less water (soil, glaciers, aquifers), blue means more."),
     {}),
    # ------------------------------------------------------------------ fire
    ("fires", "VIIRS_SNPP_Thermal_Anomalies_375m_All", "fire", "2025-08-15",
     ("Пожежі — VIIRS (з 2012)", "Fires — VIIRS (since 2012)"),
     ("Точки, де супутник за добу помітив сильне тепло: лісові та степові пожежі, спалювання стерні, факели газу.",
      "Spots where the satellite detected intense heat that day: wildfires, crop burning, gas flares."),
     {"overlayOnly": True}),
    ("fires_noaa20", "VIIRS_NOAA20_Thermal_Anomalies_375m_All", "fire", "2022-09-10",
     ("Пожежі — VIIRS NOAA-20 (з 2020)", "Fires — VIIRS NOAA-20 (since 2020)"),
     ("Другий супутник із тим самим приладом VIIRS — допомагає, коли в першого є перерви в даних (наприклад, серпень 2022).",
      "A second satellite with the same VIIRS instrument — useful when the first one has data gaps (e.g. August 2022)."),
     {"overlayOnly": True}),
    ("fires_modis", "MODIS_Terra_Thermal_Anomalies_All", "fire", "2025-08-15",
     ("Пожежі — MODIS (з 2000)", "Fires — MODIS (since 2000)"),
     ("Найдовший супутниковий ряд пожеж — з 2000 року. Точки грубіші (1 км), зате можна дивитися 25 років назад.",
      "The longest satellite fire record, since 2000. Coarser dots (1 km) but 25 years of history."),
     {"overlayOnly": True}),
    # ------------------------------------------------------------------ night lights
    ("nightlights", "VIIRS_Black_Marble", "lights", "2016-01-01",
     ("Нічні вогні — Black Marble", "Night lights — Black Marble"),
     ("Земля вночі: світло міст, доріг, газових факелів. Яскравість показує, де живуть і працюють люди.",
      "Earth at night: lights of cities, roads and gas flares. Brightness shows where people live and work."),
     {"base": True}),
    ("nightlights_daily", "VIIRS_SNPP_GapFilled_BRDF_Corrected_DayNightBand_Radiance", "lights", "2025-01-15",
     ("Нічні вогні за конкретну ніч", "Night lights on a given night"),
     ("Світло вночі за обрану дату (продукт Black Marble). Видно відключення електрики — наприклад, після ударів по енергосистемі України восени 2022.",
      "Night light on the chosen date (Black Marble product). Shows blackouts, e.g. after strikes on Ukraine's power grid in autumn 2022."),
     {"base": True}),
    # ------------------------------------------------------------------ air
    ("no2", "OMI_Nitrogen_Dioxide_Tropo_Column", "air", "2025-01-15",
     ("Діоксид азоту NO₂ — OMI (з 2004)", "Nitrogen dioxide NO₂ — OMI (since 2004)"),
     ("Газ із вихлопних труб, ТЕС і заводів. Його найбільше над великими містами та промисловими районами.",
      "A gas from car exhausts, power plants and factories. Highest over big cities and industrial areas."),
     {}),
    ("no2_tropomi", "TROPOMI_L2_Nitrogen_Dioxide_Tropospheric_Column", "air", "2025-01-15",
     ("Діоксид азоту NO₂ — TROPOMI (детальніше)", "Nitrogen dioxide NO₂ — TROPOMI (sharper)"),
     ("Сучасніший прилад: видно навіть окремі міста й електростанції.",
      "A newer instrument: you can see individual cities and power plants."),
     {}),
    ("pm25", "MERRA2_Dust_Surface_Mass_Concentration_PM25_Monthly", "air", "2025-07-01",
     ("Пил PM2.5 у повітрі", "Dust PM2.5 near the ground"),
     ("Дрібний пил, яким ми дихаємо (частинки менші за 2,5 мікрометра — в 30 разів тонші за волосину). Більшість — із пустель (Сахара, Гобі).",
      "Fine dust we breathe (particles smaller than 2.5 micrometres — 30 times thinner than a hair). Most comes from deserts (Sahara, Gobi)."),
     {}),
    ("aod", "MERRA2_Total_Aerosol_Optical_Thickness_550nm_Extinction_Monthly", "air", "2025-07-01",
     ("Аерозолі (каламутність повітря)", "Aerosols (haze)"),
     ("Наскільки повітря «каламутне» від пилу, диму, сажі та смогу. Чим більше число — тим гірше видно Сонце.",
      "How hazy the air is from dust, smoke, soot and smog. Higher numbers mean the Sun is harder to see."),
     {}),
    ("so2", "MERRA2_SO2_Column_Mass_Density_Monthly", "air", "2025-01-01",
     ("Діоксид сірки SO₂", "Sulphur dioxide SO₂"),
     ("Газ від спалювання вугілля, плавлення металів і вулканів. Спричиняє кислотні дощі.",
      "A gas from burning coal, smelting metals and volcanoes. Causes acid rain."),
     {}),
    ("co", "MOPITT_CO_Monthly_Total_Column_Day", "air", "2024-08-01",
     ("Чадний газ CO", "Carbon monoxide CO"),
     ("Чадний газ від пожеж і неповного згоряння палива. Добре видно шлейфи від великих лісових пожеж.",
      "Carbon monoxide from fires and incomplete burning of fuel. Plumes from big wildfires are clearly visible."),
     {}),
    ("methane", "AIRS_L3_Methane_400hPa_Volume_Mixing_Ratio_Monthly_Day", "air", "2025-01-01",
     ("Метан CH₄", "Methane CH₄"),
     ("Парниковий газ, у 80 разів сильніший за CO₂ на перших 20 роках. Джерела: болота, худоба, рисові поля, витоки газу.",
      "A greenhouse gas 80 times stronger than CO₂ over 20 years. Sources: wetlands, cattle, rice paddies, gas leaks."),
     {}),
    # ------------------------------------------------------------------ ozone
    ("ozone", "OMPS_Ozone_Total_Column", "ozone", "2025-09-25",
     ("Озоновий шар (щодня)", "Ozone layer (daily)"),
     ("Кількість озону над кожною точкою в одиницях Добсона. Над Антарктидою у вересні–жовтні з'являється «озонова діра» (менше 220 DU).",
      "The amount of ozone above each point in Dobson Units. An 'ozone hole' (below 220 DU) opens over Antarctica in Sep–Oct."),
     {}),
    ("ozone_omi", "OMI_Ozone_TOMS_Total_Column", "ozone", "2006-09-25",
     ("Озоновий шар — OMI (з 2004)", "Ozone layer — OMI (since 2004)"),
     ("Довший ряд спостережень озону. 2006 рік — одна з найбільших озонових дір.",
      "A longer ozone record. 2006 had one of the largest ozone holes."),
     {}),
    ("ozone_merra", "MERRA2_Ozone_Mixing_Ratio_50hPa_Monthly", "ozone", "2025-10-01",
     ("Озон у стратосфері (щомісяця, з 1980)", "Stratospheric ozone (monthly, since 1980)"),
     ("Концентрація озону на висоті ~20 км, де він захищає нас від ультрафіолету.",
      "Ozone concentration at ~20 km altitude, where it shields us from ultraviolet light."),
     {}),
]


def parse_interval(v: str):
    v = v.strip()
    if v and v[0] not in "[(":   # a single number, e.g. sourceValue="3"
        try:
            x = float(v)
            return x, x
        except ValueError:
            return None, None
    m = re.match(r"^[\[\(]\s*([^,\]\)]*)\s*(?:,\s*([^\]\)]*))?\s*[\]\)]$", v)
    if not m:
        return None, None

    def num(s):
        if s is None or s == "":
            return None
        s = s.strip()
        if "INF" in s.upper():
            return None
        try:
            return float(s)
        except ValueError:
            return None
    lo = num(m.group(1))
    hi = num(m.group(2)) if m.group(2) is not None else lo
    return lo, hi


def parse_colormap(xml_bytes):
    root = ET.fromstring(xml_bytes)
    maps = []
    for cm in root.findall("ColorMap"):
        title = cm.get("title") or ""
        units = cm.get("units") or ""
        legend = cm.find("Legend")
        ltype = legend.get("type") if legend is not None else "continuous"
        tips = {}
        if legend is not None:
            for le in legend.findall("LegendEntry"):
                tips[le.get("id")] = le.get("tooltip")
        entries, labels = [], {}
        for e in cm.findall("Entries/ColorMapEntry"):
            if e.get("nodata") == "true":
                continue
            rgb = [int(c) for c in e.get("rgb").split(",")]
            lo, hi = parse_interval(e.get("value") or e.get("sourceValue") or "")
            transparent = e.get("transparent") == "true"
            entries.append(rgb + [lo, hi, 1 if transparent else 0])
            label = e.get("label") or (tips.get(e.get("ref")) if ltype == "classification" else None)
            if label:
                labels[len(entries) - 1] = label
        if not entries:
            continue
        tl = list(tips.values())
        maps.append({"title": title, "units": units, "type": ltype, "entries": entries,
                     "labels": labels or None, "first": tl[0] if tl else None, "last": tl[-1] if tl else None})
    maps.sort(key=lambda m: -len(m["entries"]))   # the real data colour map is the biggest one
    return maps


# Numbers in GIBS colour maps are in SI units; show them in units students know.
DISPLAY = {
    "K": {"offset": -273.15, "units": "°C"},
    "kg/m²/s": {"scale": 86400, "units": "мм/добу|mm/day"},
    "kg/m³": {"scale": 1e9, "units": "мкг/м³|µg/m³"},
    "m³/m³": {"scale": 100, "units": "%"},
    "kg/kg": {"scale": 1e6, "units": "мг/кг|mg/kg"},
}
DISPLAY_BY_LAYER = {
    "so2": {"scale": 1e6, "units": "мг/м²|mg/m²"},
    "water_vapor": {"scale": 1, "units": "мм|mm"},
}


def main():
    log("GIBS capabilities…")
    root = ET.fromstring(download(CAPS, timeout=300))
    layers = {}
    for L in root.findall(".//w:Contents/w:Layer", NS):
        ident = L.find("ows:Identifier", NS).text
        layers[ident] = L
    out = []
    for lid, gibs, cat, default_date, titles, texts, extra in CURATED:
        L = layers.get(gibs)
        if L is None:
            log(f"  !! {gibs} not in capabilities — skipped")
            continue
        fmt = L.find("w:Format", NS).text
        tms = L.find("w:TileMatrixSetLink/w:TileMatrixSet", NS).text
        dim = L.find("w:Dimension", NS)
        ranges, default = [], None
        if dim is not None:
            default = dim.find("w:Default", NS).text
            ranges = [v.text for v in dim.findall("w:Value", NS)]
        period = None
        if ranges:
            p = ranges[-1].split("/")[-1]
            period = {"P1D": "daily", "P1M": "monthly", "P1Y": "yearly", "P8D": "8day"}.get(p, p)
        cmap_url = None
        for m in L.findall("ows:Metadata", NS):
            href = m.get("{http://www.w3.org/1999/xlink}href") or ""
            if "/colormaps/v1.3/" in href:
                cmap_url = href
        legend = None
        if cmap_url:
            raw = download(cmap_url, timeout=60)
            if raw:
                maps = parse_colormap(raw)
                if maps:
                    legend = maps[0] if len(maps) == 1 else {**maps[0], "extra": maps[1:]}
        date = default_date
        if ranges and date and not any(r.split("/")[0] <= date <= r.split("/")[1] for r in ranges):
            log(f"  {lid}: default {date} not available, using {default}")
            date = default
        if ranges and not date:
            date = default
        transform = None
        if legend:
            transform = DISPLAY_BY_LAYER.get(lid) or DISPLAY.get(legend.get("units"))
        out.append({
            "id": lid, "gibs": gibs, "cat": cat,
            "title": {"uk": titles[0], "en": titles[1]},
            "desc": {"uk": texts[0], "en": texts[1]},
            "format": "png" if "png" in fmt else "jpg",
            "tms": tms, "maxLevel": MAX_LEVEL.get(tms, 5),
            "period": period, "ranges": ranges, "date": date, "latest": default,
            "legend": legend, "transform": transform,
            "legendImage": f"https://gibs.earthdata.nasa.gov/legends/{gibs}_H.svg" if legend else None,
            **extra,
        })
        log(f"  {lid:18s} {gibs[:55]:55s} {tms:7s} {period or 'static':8s} {date or ''}  legend={'yes' if legend else 'no'}")
    write_json("layers.json", {"source": "NASA GIBS WMTS (EPSG:4326, best)", "tileUrl":
               "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{layer}/default/{time}/{tms}/{z}/{y}/{x}.{ext}",
               "layers": out})


if __name__ == "__main__":
    main()
