from deepgram import DeepgramClient
import os

key = "67aa1f83ddbb57aada100813e5e8f3d51ffc2518"
try:
    dg = DeepgramClient(api_key=key)
    print("DeepgramClient dir:", dir(dg))
    try:
        import inspect
        sig = inspect.signature(dg.listen.v1.media.transcribe_file)
        print("transcribe_file sig:", str(sig))
        print("transcribe_file params:", list(sig.parameters.keys()))
    except Exception as e:
        print("transcribe_file sig error:", e)


except Exception as e:
    print("Init failed:", e)


