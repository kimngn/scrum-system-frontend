import apiClient from "./services";

export default {
  getProjects(params) {
    return apiClient.get("projects", { params });
  },
  getProjectsByUserId(userId, params) {
    return apiClient.get("projects/user/" + userId, { params });
  },
  getProject(id) {
    return apiClient.get("projects/" + id);
  },
  addProject(project) {
    return apiClient.post("projects", project);
  },
  updateProject(projectId, project) {
    return apiClient.put("projects/" + projectId, project);
  },
  deleteProject(projectId) {
    return apiClient.delete("projects/" + projectId);
  },
};