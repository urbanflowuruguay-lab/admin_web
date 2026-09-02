from gradio_client import Client
import traceback

try:
    client = Client("kevinwang676/SadTalker")
    print("Connected!")
    print("API info:", client.view_api(print_info=False, return_format="dict"))
except Exception as e:
    traceback.print_exc()
