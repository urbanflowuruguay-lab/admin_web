import httpx, asyncio, base64

SPACE = 'https://kevinwang676-sadtalker.hf.space'

async def test():
    async with httpx.AsyncClient(timeout=60) as client:
        # Gradio 3.x format
        payload = {
            "data": [
                "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png",
                "https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav",
                "crop",      # preprocess
                False,       # still mode
                True,        # gfpgan
                2,           # batch size
                "256",       # face model resolution
                0            # pose style
            ],
            "fn_index": 0,
            "session_hash": "test123"
        }
        
        r = await client.post(f"{SPACE}/run/predict", json=payload)
        print(f"POST /run/predict: {r.status_code}")
        print(f"Response: {r.text[:500]}")

asyncio.run(test())
