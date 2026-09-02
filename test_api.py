import httpx, asyncio, re

SPACE = 'https://kevinwang676-sadtalker.hf.space'

async def test():
    async with httpx.AsyncClient(timeout=30) as client:
        # Check config
        r = await client.get(f'{SPACE}/config')
        print('Config status:', r.status_code)
        txt = r.text
        v = re.search(r'"version":"([^"]+)"', txt)
        if v: print('Gradio version:', v.group(1))

        # Try queue/join
        r2 = await client.post(f'{SPACE}/queue/join', json={
            "data": [
                "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png",
                "https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav",
                "crop", False, True, 2, "256", 0
            ],
            "fn_index": 0
        })
        print('/queue/join:', r2.status_code, r2.text[:300])

        # Try /queue/push
        r3 = await client.post(f'{SPACE}/queue/push', json={
            "data": [
                "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png",
                "https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav",
                "crop", False, True, 2, "256", 0
            ],
            "fn_index": 0
        })
        print('/queue/push:', r3.status_code, r3.text[:300])

asyncio.run(test())
