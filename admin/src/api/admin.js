import { api } from "./http";

export const adminLogin = async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
};

export const createRoom = async (payload) => {
  const { data } = await api.post("/admin/rooms", payload);
  return data;
};
