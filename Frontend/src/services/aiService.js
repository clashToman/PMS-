
import api from "./api";

const aiService = {
  analyzeProject: async (projectId, question = "") => {
    const response = await api.post(
      `/ai/projects/${projectId}/analyze`,
      {
        question: question.trim() || null,
      }
    );

    return response.data;
  },
};

export default aiService;
