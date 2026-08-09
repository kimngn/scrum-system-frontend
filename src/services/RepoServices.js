import apiClient from "./services";

export default {
  getReposByProjectId(projectId) {
    return apiClient.get("repos/project/" + projectId);
  },

  getRepo(id) {
    return apiClient.get("repos/" + id);
  },
  addRepo(repo) {
    return apiClient.post("repos", repo);
  },
  updateRepo(repoId, repo) {
    return apiClient.put("repos/" + repoId, repo);
  },
  deleteRepo(repoId) {
    return apiClient.delete("repos/" + repoId);
  },

  validateRepo(repoUrl, token) {
    return apiClient.post("github/validate", { repoUrl, token }); // passing in raw parameters because this isn't saved in the database
  },
};
