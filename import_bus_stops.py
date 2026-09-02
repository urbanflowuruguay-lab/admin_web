#!/usr/bin/env python3
"""
import_bus_stops.py — Importa paradas de bus a Supabase desde Overpass o SHP IMM
Uso: python import_bus_stops.py --bbox -34.95,-56.25,-34.85,-56.10  (o sin args para Montevideo entero)
Requiere: SUPABASE_URL y SUPABASE_SERVICE_KEY en env
"""
import os, sys, json, requests, argparse

SUPA_URL = os.getenv("SUPABASE_URL") or input("SUPABASE_URL: ").strip()
SUPA_KEY = os.getenv("SUPABASE_SERVICE_KEY") or input("SUPABASE_SERVICE_KEY: ").strip()
TABLE = "bus_stops"
OVERPASS = "https://overpass-api.de/api/interpreter"

def upsert_stop(session, name, lat, lon, lines, source="overpass"):
    r = session.post(f"{SUPA_URL}/rest/v1/{TABLE}",
        headers={"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}", "Content-Type":"application/json", "Prefer":"return=minimal"},
        json={"name": name, "lat": lat, "lon": lon, "lines": lines, "source": source})
    if r.status_code not in (200,201,204):
        print(f"ERR {r.status_code}: {r.text[:200]}")
        return False
    return True

def fetch_overpass(bbox):
    minLat,minLon,maxLat,maxLon = bbox
    q = f'[out:json][timeout:25][bbox:{minLat},{minLon},{maxLat},{maxLon}];nwr["highway"="bus_stop"];out body center 2000;'
    print(f"Overpass query bbox {bbox} ...")
    r = requests.post(OVERPASS, data={"data": q}, timeout=60)
    r.raise_for_status()
    j = r.json()
    els = j.get("elements", [])
    print(f"Got {len(els)} elements")
    stops=[]
    for e in els:
        lat = e.get("lat") or (e.get("center") or {}).get("lat")
        lon = e.get("lon") or (e.get("center") or {}).get("lon")
        if lat is None or lon is None: continue
        tags = e.get("tags") or {}
        name = tags.get("name") or tags.get("ref") or "Parada"
        ref = tags.get("route_ref") or tags.get("ref") or ""
        lines = [x.strip() for x in ref.split(";") if x.strip()]
        stops.append((name, lat, lon, lines))
    return stops

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bbox", help="minLat,minLon,maxLat,maxLon")
    args = ap.parse_args()
    if args.bbox:
        bbox = list(map(float, args.bbox.split(",")))
    else:
        # Montevideo aprox
        bbox = [-34.95, -56.35, -34.75, -56.05]
    stops = fetch_overpass(bbox)
    print(f"Importando {len(stops)} paradas a {SUPA_URL} ...")
    import requests as req
    s = req.Session()
    ok=0
    for name,lat,lon,lines in stops:
        if upsert_stop(s, name, lat, lon, lines): ok+=1
    print(f"Listo: {ok}/{len(stops)} insertadas. Ejecuta el SQL sql_create_bus_stops.sql antes si no existe la tabla.")

if __name__=="__main__":
    main()
