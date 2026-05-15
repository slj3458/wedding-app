// src/config.js
// Centralized API configuration

const isDevelopment = import.meta.env.MODE === "development";

export const API_BASE_URL = isDevelopment
  ? import.meta.env.VITE_API_URL || "http://localhost:8001"
  : ""; // Empty string means relative URLs in production

export const WS_BASE_URL = isDevelopment
  ? import.meta.env.VITE_WS_URL || "ws://localhost:8001"
  : `${window.location.protocol === "https:" ? "wss:" : "ws:"}://${window.location.host}`;

export const API = {
  // Gallery endpoints
  GALLERY_PHOTOS: `${API_BASE_URL}/api/gallery/photos`,
  GALLERY_UPLOAD: `${API_BASE_URL}/api/gallery/upload`,
  GALLERY_PHOTO: (filename) => `${API_BASE_URL}/api/gallery/photo/${filename}`,
  GALLERY_THUMBNAIL: (filename) =>
    `${API_BASE_URL}/api/gallery/thumbnail/${filename}`,
  GALLERY_LIKE: (id) => `${API_BASE_URL}/api/gallery/photo/${id}/like`,

  // Guestbook endpoints
  GUESTBOOK_ENTRIES: `${API_BASE_URL}/api/guestbook/entries`,
  GUESTBOOK_SUBMIT: `${API_BASE_URL}/api/guestbook/entry`,

  // Caricature endpoints
  CARICATURE_SUBMIT: `${API_BASE_URL}/api/caricature/submit`,
  CARICATURE_IMAGE: (filename) => `${API_BASE_URL}/api/caricature/${filename}`,
  CARICATURE_DOWNLOAD: (filename) =>
    `${API_BASE_URL}/api/caricature/${filename}/download`,

  // Admin endpoints
  ADMIN_LOGIN: `${API_BASE_URL}/api/admin/login`,
  ADMIN_LOGOUT: `${API_BASE_URL}/api/admin/logout`,
  ADMIN_ACTION: `${API_BASE_URL}/api/admin/action`,

  // WebSocket
  WEBSOCKET: `${WS_BASE_URL}/ws`,
};
