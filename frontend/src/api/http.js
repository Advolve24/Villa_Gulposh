// src/api/http.js
import axios from "axios";

// Default to local in dev, Render in prod if VITE_API_URL is missing.
const DEFAULT_API = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://villa-gulposh.onrender.com/api";

const baseURL = (import.meta.env.VITE_API_URL || DEFAULT_API).replace(/\/$/, "");

export const api = axios.create({
  baseURL,
  withCredentials: true,   // needed for cookie auth
  timeout: 15000,
});

if (import.meta.env.PROD) {
  // Helps you confirm on Netlify which base URL is baked into the build
  console.log("API baseURL:", baseURL);
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(err.response?.data || err.message);
    return Promise.reject(err);
  }
);
