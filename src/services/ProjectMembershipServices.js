import apiClient from "./services";

export default {
  getMembershipsByProjectId(projectId) {
    return apiClient.get("projectmemberships/project/" + projectId);
  },
  addMembership(membership) {
    return apiClient.post("projectmemberships", membership);
  },
  updateMembership(id, membership) {
    return apiClient.put("projectmemberships/" + id, membership);
  },
  deleteMembership(id) {
    return apiClient.delete("projectmemberships/" + id);
  },
};