import apiClient from "./services";

export default {
  getProjectHistoryByProjectId(projectId) {
    return apiClient.get("histories/project/" + projectId);
  },

  addHistory(history) {
    return apiClient.post("histories/");
  },

  deleteProject(projectId) {
    return apiClient.delete("histories/" + projectId);
  },
};

//http://localhost:3200/recipeapi/histories/project/1
