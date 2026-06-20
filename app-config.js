// app-config.js
// Frontend configuration for Tropical Gardens Hotel.
// Customize TGH_API_BASE to point to your deployed backend API.
// In production, set window.TGH_API_BASE before loading the frontend (e.g. via environment injection or a build step).

window.TGH_API_BASE = window.TGH_API_BASE || "https://tropical-gardens-hotel-api.onrender.com"; // set your backend API URL
window.TGH_GA_MEASUREMENT_ID = window.TGH_GA_MEASUREMENT_ID || ""; // optional Google Analytics Measurement ID (G-XXXXXXX)

// Note: It's safer to inject these values at deploy time rather than committing live credentials into the repository.
