import stable_whisper
import inspect

try:
    from stable_whisper import load_faster_whisper_model
    print("Found load_faster_whisper_model via import")
except ImportError:
    print("Could not import load_faster_whisper_model")

print("\nload_model signature:")
print(inspect.signature(stable_whisper.load_model))
