// src/lib/api.ts
import axios from "axios";
import { clearSession, getToken } from "./authSession";
import Router from "next/router";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL, // e.g. https://reportsbe.sharda.co.in
  withCredentials: false,
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler: force logout & redirect
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Token expired/invalid → clear and go to login
      clearSession();
      // Avoid infinite loops if already on /login
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        Router.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);
