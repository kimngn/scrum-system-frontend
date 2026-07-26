import apiClient from "./services";

export default {
  getAssigneesByStoryId(userStoryId) {
    return apiClient.get("storyassignees/story/" + userStoryId);
  },
  addAssignee(assignee) {
    return apiClient.post("storyassignees", assignee);
  },
  deleteAssignee(id) {
    return apiClient.delete("storyassignees/" + id);
  },
};