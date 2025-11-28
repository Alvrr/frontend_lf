// API Configuration
const API_CONFIG = {
  // Production API (Railway)
  production: "https://web-production-dae5b.up.railway.app",
  
  // Development API (Local)
  development: "http://localhost:5000",
  
  // Get current API URL
  get baseURL() {
    // Otomatis detect: kalau buka dari localhost atau file:// → development
    // Kalau buka dari domain lain → production
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.protocol === 'file:') {
      return this.development;
    }
    return this.production;
  }
};

// Endpoint helpers
const API = {
  markers: `${API_CONFIG.baseURL}/api/markers`,
  markerById: (id) => `${API_CONFIG.baseURL}/api/markers/${id}`
};
