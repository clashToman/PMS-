
import api from "./api";

const taskService = {
  async getProjectTasks(projectId, skip = 0, limit = 50) {
    const response = await api.get(
      `/projects/${projectId}/tasks`,
      { params: { skip, limit } }
    );
    return response.data;
  },

  async getTaskById(taskId) {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  async createTask(projectId, taskData) {
    const response = await api.post(
      `/projects/${projectId}/tasks`,
      taskData
    );
    return response.data;
  },

  async updateTaskStatus(taskId, status) {
    const response = await api.patch(
      `/tasks/${taskId}/status`,
      { status }
    );
    return response.data;
  },

  async getComments(taskId) {
    const response = await api.get(
      `/tasks/${taskId}/comments`
    );
    return response.data;
  },

  async addComment(taskId, comment) {
    const response = await api.post(
      `/tasks/${taskId}/comments`,
      { comment }
    );
    return response.data;
  },

  async getActivities(taskId) {
    const response = await api.get(
      `/tasks/${taskId}/activities`
    );
    return response.data;
  },
};

export default taskService;
