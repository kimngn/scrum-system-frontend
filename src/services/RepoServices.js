import apiClient from "./services";

export default {
  getReposByProjectId(projectId) {
    return apiClient.get("repos/project/" + projectId);
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
};