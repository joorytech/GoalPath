import os
import sys

# Add project root and server to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
SERVER_DIR = os.path.join(ROOT_DIR, "server")

for p in [ROOT_DIR, SERVER_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app import app

# Expose WSGI handler for Vercel
# Vercel looks for 'app' or handler
