import apiClient from "./services";

export default {
  getSprints() {
    return apiClient.get("sprints");
  },
  getSprintsByProjectId(projectId) {
    return apiClient.get("sprints/project/" + projectId);
  },
  getSprint(id) {
    return apiClient.get("sprints/" + id);
  },
  addSprint(sprint) {
    return apiClient.post("sprints", sprint);
  },
  updateSprint(sprintId, sprint) {
    return apiClient.put("sprints/" + sprintId, sprint);
  },
  deleteSprint(sprintId) {
    return apiClient.delete("sprints/" + sprintId);
  },
};