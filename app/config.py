# app/config.py
"""
Configuration settings for the wedding app.
"""
import os

# Admin password - change this to something secure!
# In production, use environment variable: os.getenv("ADMIN_PASSWORD", "wedding2026")
ADMIN_PASSWORD = "wedding2026"

# You can also set it via environment variable:
# ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "wedding2026")
