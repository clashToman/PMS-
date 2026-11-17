
import api from "./api";

const userService = {
  async getUsers(skip = 0, limit = 100) {
    const response = await api.get("/users/", {
      params: { skip, limit },
    });
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post("/users/", userData);
    return response.data;
  },

  async updateUser(userId, userData) {
    const response = await api.put(
      `/users/${userId}`,
      userData
    );
    return response.data;
  },

  async updateUserStatus(userId, isActive) {
    const response = await api.patch(
      `/users/${userId}/status`,
      { is_active: isActive }
    );
    return response.data;
  },
};

export default userService;
