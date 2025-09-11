from http.server import SimpleHTTPRequestHandler, HTTPServer

HOST = '127.0.0.1'
PORT = 8000

class SeverHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = 'index.html'
        return super().do_GET()

with HTTPServer((HOST, PORT), SeverHandler) as server:
    print(f"Server running at http://{HOST}:{PORT}")
    server.serve_forever()
