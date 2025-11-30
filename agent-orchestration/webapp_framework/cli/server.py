"""Development server."""
from __future__ import annotations

class DevelopmentServer:
    """Development HTTP server."""
    def __init__(self, app, host: str = "127.0.0.1", port: int = 5000):
        self.app = app
        self.host = host
        self.port = port
        self.running = False
    
    def start(self) -> None:
        """Start server."""
        print(f"Starting server on http://{self.host}:{self.port}")
        self.running = True
    
    def stop(self) -> None:
        """Stop server."""
        print("Stopping server")
        self.running = False
    
    def restart(self) -> None:
        """Restart server."""
        self.stop()
        self.start()
    
    def is_running(self) -> bool:
        """Check if server is running."""
        return self.running
    
    def get_url(self) -> str:
        """Get server URL."""
        return f"http://{self.host}:{self.port}"
