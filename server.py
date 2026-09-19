"""
Simple HTTP Server for Concrete Mix Design Calculator
Runs at http://localhost:8000
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

def run_server():
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"=============================================================")
        print(f" Concrete Mix Design Calculator (IS 10262:2019)")
        print(f" Server running at: http://localhost:{PORT}")
        print(f" Press Ctrl+C to stop the server")
        print(f"=============================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    run_server()
