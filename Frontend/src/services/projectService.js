
import api from "./api";

const projectService = {
  async getProjects() {
    const response = await api.get("/projects/");
    return response.data;
  },

  async getProjectById(projectId) {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  async getProjectTasks(projectId, skip = 0, limit = 10) {
    const response = await api.get(
      `/projects/${projectId}/tasks`,
      {
        params: { skip, limit },
      }
    );
    return response.data;
  },

  async getUsers() {
    const response = await api.get("/users/");
    return response.data;
  },

  async createProject(projectData) {
    const response = await api.post("/projects/", projectData);
    return response.data;
  },
};

export default projectService;
