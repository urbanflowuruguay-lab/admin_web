import os, uuid, asyncio, tempfile, base64, subprocess, json, re
from fastapi import FastAPI, Form
from fastapi.responses import FileResponse, JSONResponse
import edge_tts, httpx

app = FastAPI()
VOICE = "es-AR-TomasNeural"
SPACE = "https://kevinwang676-sadtalker.hf.space"

@app.get("/")
async def root():
    return FileResponse("personaje_server.html")

@app.post("/tts")
async def tts(text: str = Form(...)):
    uid = str(uuid.uuid4())[:8]
    out = os.path.join(tempfile.gettempdir(), f"tts_{uid}.mp3")
    comm = edge_tts.Communicate(text=text, voice=VOICE, rate="-5%")
    await comm.save(out)
    return FileResponse(out, media_type="audio/mpeg", filename="speech.mp3")

@app.post("/generate")
async def generate(
    image_data: str = Form(...),
    audio_data: str = Form(...),
    preprocess: str = Form("crop"),
    gfpgan: bool = Form(True),
):
    uid = str(uuid.uuid4())[:8]
    img_path = os.path.join(tempfile.gettempdir(), f"img_{uid}.jpg")
    aud_path = os.path.join(tempfile.gettempdir(), f"aud_{uid}.mp3")
    raw_path = os.path.join(tempfile.gettempdir(), f"raw_{uid}.mp4")
    crop_path = os.path.join(tempfile.gettempdir(), f"crop_{uid}.mp4")

    try:
        img_bytes = base64.b64decode(image_data.split(",")[1])
        aud_bytes = base64.b64decode(audio_data.split(",")[1])
        with open(img_path, "wb") as f: f.write(img_bytes)
        with open(aud_path, "wb") as f: f.write(aud_bytes)

        import websockets, base64 as b64mod

        # Wake space
        async with httpx.AsyncClient(timeout=15) as hc:
            try: await hc.get(SPACE)
            except: pass
        await asyncio.sleep(2)

        # Upload files via HTTP
        async with httpx.AsyncClient(timeout=60) as hc:
            r1 = await hc.post(f"{SPACE}/upload", files={"files": ("photo.jpg", img_bytes, "image/jpeg")})
            img_path_hf = r1.json()[0]
            r2 = await hc.post(f"{SPACE}/upload", files={"files": ("speech.mp3", aud_bytes, "audio/mpeg")})
            aud_path_hf = r2.json()[0]

        # Connect via WebSocket
        ws_url = SPACE.replace("https://", "wss://") + "/queue/join"
        async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
            # Step 1: Wait for send_hash
            resp = await asyncio.wait_for(ws.recv(), timeout=30)
            data = json.loads(resp)
            print(f"WS step 1: {data.get('msg')}")
            if data.get("msg") == "send_hash":
                await ws.send(json.dumps({"fn_index": 0, "session_hash": uid, "data": []}))

            # Step 2: Wait for send_data (may receive estimation/queue messages first)
            sent_data = False
            for _ in range(100):
                resp = await asyncio.wait_for(ws.recv(), timeout=120)
                data = json.loads(resp)
                msg = data.get("msg", "")
                print(f"WS waiting for send_data: {msg}")
                if msg == "send_data":
                    await ws.send(json.dumps({
                        "fn_index": 0,
                        "session_hash": uid,
                        "data": [
                            {"path": img_path_hf, "url": f"{SPACE}/file={img_path_hf}", "size": len(img_bytes), "orig_name": "photo.jpg", "mime_type": "image/jpeg", "is_file": False},
                            {"path": aud_path_hf, "url": f"{SPACE}/file={aud_path_hf}", "size": len(aud_bytes), "orig_name": "speech.mp3", "mime_type": "audio/mpeg", "is_file": False},
                            preprocess, False, gfpgan, 2, "256", 0
                        ]
                    }))
                    sent_data = True
                    break
                if msg == "queue_full":
                    return JSONResponse({"error": "Cola llena. Intenta en 1 min."}, status_code=503)
                if msg == "process_completed":
                    output = data.get("output", {}).get("data", [])
                    if output:
                        item = output[0]
                        if isinstance(item, dict) and "url" in item:
                            video_url = item["url"]
                        elif isinstance(item, str):
                            video_url = item
                    sent_data = True
                    break

            if not sent_data:
                return JSONResponse({"error": "No se pudo enviar datos al Space"}, status_code=500)

            # Step 3: Wait for result (process_completed)
            video_url = None
            for i in range(300):
                resp = await asyncio.wait_for(ws.recv(), timeout=120)
                data = json.loads(resp)
                msg = data.get("msg", "")
                if i % 10 == 0:
                    print(f"WS step 3 ({i}): {msg}")
                if msg == "process_completed":
                    output = data.get("output", {}).get("data", [])
                    if output:
                        item = output[0]
                        if isinstance(item, dict) and "url" in item:
                            video_url = item["url"]
                        elif isinstance(item, str):
                            video_url = item
                    break
                if msg == "queue_full":
                    return JSONResponse({"error": "Cola llena. Intenta en 1 min."}, status_code=503)

        if not video_url:
            return JSONResponse({"error": "No video URL received"}, status_code=500)

        # Download and crop
        async with httpx.AsyncClient(timeout=120, follow_redirects=True) as hc:
            vid = await hc.get(video_url)
            with open(raw_path, "wb") as f: f.write(vid.content)

        proc = subprocess.run([
            "ffmpeg", "-y", "-i", raw_path,
            "-vf", "crop=ih*9/16:ih",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac",
            crop_path
        ], capture_output=True, timeout=120)

        if not os.path.exists(crop_path):
            return JSONResponse({"error": "FFmpeg crop failed"}, status_code=500)

        return FileResponse(crop_path, media_type="video/mp4", filename="personaje_vertical.mp4")
    except Exception as e:
        tb = traceback.format_exc()
        print("=== ERROR ===")
        print(tb)
        print("=== END ERROR ===")
        return JSONResponse({"error": str(e) + " | " + tb[-500:]}, status_code=500)
    finally:
        for p in [img_path, aud_path, raw_path]:
            try: os.remove(p)
            except: pass

import traceback
if __name__ == "__main__":
    import uvicorn
    print("Personaje IA: http://localhost:8099")
    uvicorn.run(app, host="127.0.0.1", port=8099)
