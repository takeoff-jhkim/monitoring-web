import axios from "axios";
import { ENV } from "../config/env";

const API_URL = ENV.API_URL || "http://localhost:8080";
const ADMIN_KEY = ENV.ADMIN_KEY || "";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "X-Admin-Key": ADMIN_KEY,
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      const { state } = JSON.parse(authData);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
