from gradio_client import Client
import asyncio

client = Client("kevinwang676/SadTalker")

result = client.predict(
    "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png",
    "https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav",
    "crop",
    False,   # still mode
    True,    # gfpgan
    2,       # batch size
    "256",   # face model resolution
    0,       # pose style
    fn_index=0
)
print("Result:", result)
