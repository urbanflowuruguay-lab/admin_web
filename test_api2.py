import httpx, asyncio

SPACE = 'https://kevinwang676-sadtalker.hf.space'

async def test():
    async with httpx.AsyncClient(timeout=30) as client:
        paths = ["/run/predict", "/api/predict", "/run/", "/predict", "/call/0", "/api/", "/"]
        for p in paths:
            try:
                r = await client.post(f"{SPACE}{p}", json={"data": [], "fn_index": 0})
                print(f"POST {p}: {r.status_code} {r.text[:200]}")
            except Exception as e:
                print(f"POST {p}: ERROR {e}")

        # Also try GET on common paths
        for p in ["/api", "/info", "/config"]:
            r = await client.get(f"{SPACE}{p}")
            print(f"GET {p}: {r.status_code}")

asyncio.run(test())
