import apiClient from "./services";

export default {
  getStoriesForProject(projectId) {
    return apiClient.get("projects/" + projectId + "/stories");
  },
};
