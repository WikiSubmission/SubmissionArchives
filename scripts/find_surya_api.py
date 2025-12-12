import surya
import pkgutil
import importlib

print(f"Surya Path: {surya.__path__}")

def find_load_functions(package):
    for _, name, is_pkg in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
        # print(f"Scanning: {name}") 
        if 'layout' in name or 'model' in name:
            try:
                mod = importlib.import_module(name)
                # print(f"Imported: {name}")
                for attr in dir(mod):
                    if 'load_model' in attr or 'load_processor' in attr or 'batch_' in attr:
                        print(f"FOUND: {attr} in {name}")
            except Exception as e:
                print(f"Failed to import {name}: {e}")

find_load_functions(surya)
