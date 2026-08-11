import apiClient from "./services";

export default {
  getBranchByStoryId(userStoryId) {
    return apiClient.get("branches/story/" + userStoryId);
  },

  getBranchesFromGithubAPI(repo) {
    return apiClient.post("/api/github/branches", {
      repoUrl: repo.repoUrl,
      token: repo.token,
    });
  },

  getPRsFromGithubAPI(repo, branch) {
    return apiClient.post("/api/github/pulls", {
      repoUrl: repo.repoUrl,
      token: repo.token,
      branchName: branch.name,
    });
  },

  getShaFromMain(repo) {
    return apiClient.post("/api/github/main", {
      repoUrl: repo.repoUrl,
      token: repo.token,
    });
  },

  updateBranch(branch) {
    return apiClient.put("branches/" + branch.id, branch);
  },

  addBranch(branch) {
    return apiClient.post("branches/", branch);
  },

  deleteBranches(branch) {
    return apiClient.delete("branches/" + branch.id);
  },
};
