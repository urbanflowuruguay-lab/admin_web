import httpx, base64, asyncio, os, tempfile, traceback

async def test():
    # Create minimal valid files
    img_path = os.path.join(tempfile.gettempdir(), "test_photo.jpg")
    aud_path = os.path.join(tempfile.gettempdir(), "test_audio.mp3")
    
    # Use real test files if they exist, otherwise create minimal ones
    if not os.path.exists(img_path):
        # Create minimal JPEG
        import struct
        with open(img_path, "wb") as f:
            f.write(bytes([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9]))

    # Read and base64 encode
    with open(img_path, "rb") as f:
        img_b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()
    
    # Create a tiny MP3 with edge-tts first
    import edge_tts
    tts_path = os.path.join(tempfile.gettempdir(), "test_tts.mp3")
    comm = edge_tts.Communicate(text="Hola", voice="es-AR-TomasNeural")
    await comm.save(tts_path)
    print("TTS OK")
    
    with open(tts_path, "rb") as f:
        aud_b64 = "data:audio/mpeg;base64," + base64.b64encode(f.read()).decode()
    
    # Now test the local server endpoint
    async with httpx.AsyncClient(timeout=30) as client:
        print("Testing /tts endpoint...")
        r = await client.post("http://localhost:8099/tts", data={"text": "Hola mundo"})
        print(f"TTS: {r.status_code}")
        
        print("Testing /generate endpoint...")
        try:
            formData = {
                "image_data": img_b64,
                "audio_data": aud_b64,
                "preprocess": "crop",
                "gfpgan": "true"
            }
            r2 = await client.post("http://localhost:8099/generate", data=formData, timeout=600)
            print(f"Generate: {r2.status_code}")
            print(f"Content-Type: {r2.headers.get('content-type')}")
            print(f"Body (first 500): {r2.text[:500]}")
        except Exception as e:
            print(f"Generate error: {e}")

asyncio.run(test())
