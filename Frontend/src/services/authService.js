
import api from "./api";

const authService = {
  async login(email, password) {
    const response = await api.post("/auth/login", {
      email: email,
      password: password,
    });

    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("access_token");
    }
  },
};

export default authService;
