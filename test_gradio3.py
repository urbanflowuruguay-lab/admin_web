from gradio_client import Client
import tempfile, os

client = Client("kevinwang676/SadTalker")

job = client.submit(
    "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png",
    "https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav",
    "crop",
    False,
    True,
    2,
    "256",
    0,
    fn_index=0
)

print("Job submitted, waiting...")
result = job.result()
print("Result:", result)

# Try to download
if result:
    if isinstance(result, str):
        print("Video URL:", result)
    elif isinstance(result, dict) and "url" in result:
        print("Video URL:", result["url"])
    elif isinstance(result, dict) and "path" in result:
        print("Video path:", result["path"])
    else:
        print("Result type:", type(result))
        print("Result value:", result)
