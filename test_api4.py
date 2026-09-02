import httpx, asyncio, json

SPACE = 'https://kevinwang676-sadtalker.hf.space'

async def test():
    async with httpx.AsyncClient(timeout=60) as client:
        # Wake up
        try: await client.get(SPACE)
        except: pass
        await asyncio.sleep(2)
        
        # Get config to understand the API
        r = await client.get(f"{SPACE}/config")
        config = r.json()
        
        # Check available routes
        print("Available routes in config:")
        if "components" in config:
            for c in config["components"]:
                if "props" in c and "api_info" in str(c):
                    print(c)
        
        # Check if there's an api_info endpoint
        r2 = await client.get(f"{SPACE}/info")
        info = r2.json()
        print("\nInfo endpoints:")
        print(json.dumps(info, indent=2)[:1000])
        
        # Try queue-based approach for Gradio 3.x
        # Step 1: push to queue
        push_data = {
            "data": [
                "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png",
                "https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav",
                "crop", False, True, 2, "256", 0
            ],
            "fn_index": 0,
            "session_hash": "abc123"
        }
        
        r3 = await client.post(f"{SPACE}/queue/push", json=push_data)
        print(f"\nqueue/push: {r3.status_code} {r3.text[:300]}")
        
        # Try with /api prefix
        r4 = await client.post(f"{SPACE}/api/predict/", json=push_data)
        print(f"api/predict/: {r4.status_code} {r4.text[:300]}")

asyncio.run(test())
