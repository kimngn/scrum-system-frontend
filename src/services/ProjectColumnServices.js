import apiClient from "./services";

export default {
  getColumnsForProject(projectId) {
    return apiClient.get("projects/" + projectId + "/columns");
  },
  addColumn(column) {
    return apiClient.post("columns", column);
  },
  updateColumn(id, column) {
    return apiClient.put("columns/" + id, column);
  },
  deleteColumn(id, role) {
    return apiClient.delete("columns/" + id, { data: { role: role } });
  },
};
