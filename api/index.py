import sys
import os

# Add parent directory to path so Vercel can import main.py and modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

# Vercel serverless function entrypoint
app = app
