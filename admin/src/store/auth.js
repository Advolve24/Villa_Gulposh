import { create } from "zustand";
import { api } from "../api/http";

export const useAuth = create((set) => ({
  user: null,
  ready: false,

  init: async () => {
    try {
      const { data } = await api.get("/auth/me");  
      set({ user: data, ready: true });
    } catch {
      set({ user: null, ready: true });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (!data.isAdmin) throw new Error("Not authorized for admin");
    set({ user: data });
  },

  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null });
  },
}));
