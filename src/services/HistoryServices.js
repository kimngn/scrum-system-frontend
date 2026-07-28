import apiClient from "./services";

export default {
  getProjectHistoryByProjectId(projectId) {
    return apiClient.get("histories/project/" + projectId);
  },

  getProjectHistory() {
    return apiClient.get("histories/project");
  },

  addHistory(history) {
    return apiClient.post("histories/", history);
  },

  deleteAllHistory() {
    return apiClient.delete("histories/");
  },
};
