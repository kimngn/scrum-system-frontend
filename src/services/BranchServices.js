import apiClient from "./services";

export default {
  getBranchByStoryId(userStoryId) {
    return apiClient.get("branches/story/" + userStoryId);
  },

  getBranchesFromGithubAPI() {
    return apiClient.get("/api/githubClient/branches");
  },

  addBranch(branch) {
    return apiClient.post("branches/", history);
  },

  deleteAllBranches() {
    return apiClient.delete("branches/");
  },
};
