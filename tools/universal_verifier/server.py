
import http.server
import socketserver
import json
import os
import urllib.parse

PORT = 8000
INDEX_PATH = r"c:\Users\Jonathan\Desktop\RKM\media_index.json"

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # API: List all files
        if path == "/api/list":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            if os.path.exists(INDEX_PATH):
                with open(INDEX_PATH, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"[]")
            return

        # API: Serve a specific file by absolute path (for media/transcripts)
        # Usage: /api/file?path=C:/Users/...
        if path == "/api/file":
            query = urllib.parse.parse_qs(parsed_path.query)
            file_path = query.get('path', [None])[0]
            
            if file_path and os.path.exists(file_path):
                self.send_response(200)
                # Guess mime type roughly
                ext = os.path.splitext(file_path)[1].lower()
                if ext == ".json":
                    self.send_header('Content-type', 'application/json')
                elif ext == ".mp3":
                    self.send_header('Content-type', 'audio/mpeg')
                elif ext == ".mp4":
                    self.send_header('Content-type', 'video/mp4')
                self.end_headers()
                
                with open(file_path, 'rb') as f:
                    # Serve in chunks
                    try:
                        self.copyfile(f, self.wfile)
                    except BrokenPipeError:
                        pass
                return
            else:
                self.send_error(404, "File not found")
                return

        # Serve static files (HTML/JS/CSS)
        # Map / to index.html
        if path == "/":
            path = "/index.html"
            
        # Check if it's a known static file
        static_files = ["/index.html", "/editor.html", "/style.css"]
        if path in static_files:
            # Serve from the directory where this script is located
            script_dir = os.path.dirname(os.path.abspath(__file__))
            file_name = path.lstrip("/")
            file_path = os.path.join(script_dir, file_name)
            
            if os.path.exists(file_path):
                self.send_response(200)
                if path.endswith(".html"):
                    self.send_header('Content-type', 'text/html')
                elif path.endswith(".css"):
                    self.send_header('Content-type', 'text/css')
                self.end_headers()
                
                with open(file_path, 'rb') as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_error(404, f"Static file not found: {file_path}")
                return

        return super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # API: Save Transcript
        if path == "/api/save":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            target_file = data.get('path')
            content = data.get('content')
            
            if target_file and content:
                # Save the file
                try:
                    with open(target_file, 'w', encoding='utf-8') as f:
                        json.dump(content, f, indent=2)
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
                except Exception as e:
                    self.send_error(500, str(e))
            else:
                self.send_error(400, "Missing path or content")
            return

        # API: Update Status
        if path == "/api/update_status":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            file_id = data.get('id')
            new_status = data.get('status')
            
            if file_id and new_status:
                try:
                    # Read index
                    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
                        index = json.load(f)
                    
                    # Update
                    found = False
                    for item in index:
                        if item['id'] == file_id:
                            item['status'] = new_status
                            found = True
                            break
                    
                    if found:
                        with open(INDEX_PATH, 'w', encoding='utf-8') as f:
                            json.dump(index, f, indent=2)
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
                    else:
                        self.send_error(404, "ID not found")
                except Exception as e:
                    self.send_error(500, str(e))
            return

print(f"Server started at http://localhost:{PORT}")
print(f"Serving tool from: {os.getcwd()}")
with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
    httpd.serve_forever()
