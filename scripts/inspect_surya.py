import inspect
try:
    from surya.layout import LayoutPredictor, LayoutModelLoader
    print("LayoutPredictor __init__:")
    print(inspect.signature(LayoutPredictor.__init__))
    print("\nLayoutModelLoader methods:")
    print(dir(LayoutModelLoader))
except ImportError as e:
    print(e)
