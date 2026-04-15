# app/config.py
"""
Configuration settings for the wedding app.
"""
import os

from dotenv import load_dotenv

load_dotenv()

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "wedding2026")

STABILITY_API_KEY: str | None = os.getenv("STABILITY_API_KEY")
