"""Production WSGI entry point."""
from backend.app import app

if __name__ == "__main__":
    app.run()
