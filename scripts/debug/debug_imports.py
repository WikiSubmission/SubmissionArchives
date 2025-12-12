import sys

paths_to_try = [
    "surya.layout.LayoutModelLoader",
    "surya.models.layout.LayoutModelLoader",
    "surya.models.layout.model.LayoutModelLoader",
    "surya.layout.model.LayoutModelLoader",
    "surya.layout.loader.LayoutModelLoader",
    "surya.model.layout.model.load_model",
    "surya.models.layout.model.load_model",
    "surya.layout.load_model",
    "surya.layout.batch_layout_detection",
    "surya.detection.batch_text_detection",
]

print("Starting Import Brute Force...")
for p in paths_to_try:
    try:
        parts = p.split('.')
        module_name = ".".join(parts[:-1])
        obj_name = parts[-1]
        
        # print(f"Trying from {module_name} import {obj_name}")
        mod = __import__(module_name, fromlist=[obj_name])
        if hasattr(mod, obj_name):
            print(f"SUCCESS: from {module_name} import {obj_name}")
        else:
            print(f"FAILED: {module_name} has no {obj_name}")
    except ImportError as e:
        print(f"Error {p}: {e}")
    except Exception as e:
        print(f"Crash {p}: {e}")

# Also just try to import surya.models and see what's inside
try:
    import surya.models
    print(f"surya.models content: {dir(surya.models)}")
except ImportError:
    print("surya.models not importable")
