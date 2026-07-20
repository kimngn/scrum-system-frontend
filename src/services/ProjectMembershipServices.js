import apiClient from "./services";

export default {
  getMembershipsByProjectId(projectId) {
    return apiClient.get("projectmemberships/project/" + projectId);
  },
  addMembership(membership) {
    return apiClient.post("projectmemberships", membership);
  },
  deleteMembership(id) {
    return apiClient.delete("projectmemberships/" + id);
  },
};