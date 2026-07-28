import apiClient from "./services";

export default {
  getTeamsByProjectId(projectId) {
    return apiClient.get("teams/project/" + projectId);
  },
  getTeam(id) {
    return apiClient.get("teams/" + id);
  },
  createTeam(team) {
    return apiClient.post("teams", team);
  },
  updateTeam(id, team) {
    return apiClient.put("teams/" + id, team);
  },
  deleteTeam(id) {
    return apiClient.delete("teams/" + id);
  },
  addMember(payload) {
    return apiClient.post("teammembers", payload);
  },
  removeMember(id) {
    return apiClient.delete("teammembers/" + id);
  },
};