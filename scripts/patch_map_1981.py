import json

MAP_PATH = r"c:\Users\Jonathan\Desktop\RKM\data\chapter_map_1981.json"

def patch():
    with open(MAP_PATH, 'r') as f:
        data = json.load(f)
        
    print("Patching Chapter 36...")
    
    # Fix Ch 35 End
    if "35" in data:
        data["35"]["end_page"] = 312
        data["35"]["end_y"] = 150 # Estimated
        
    # Insert Ch 36
    data["36"] = {
        "start_page": 312,
        "start_y": 150,
        "end_page": 316,
        "end_y": 335.89 # Matches Ch 37 start
    }
    
    with open(MAP_PATH, 'w') as f:
        json.dump(data, f, indent=2)
        
    print("Map patched.")

if __name__ == "__main__":
    patch()
