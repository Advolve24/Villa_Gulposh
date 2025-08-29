import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

api.interceptors.response.use(
  res => res,
  err => {
    console.error(err.response?.data || err.message);
    return Promise.reject(err);
  }
);
