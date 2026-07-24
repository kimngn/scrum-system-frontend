import apiClient from "./services";

export default {
  getStoriesForProject(projectId) {
    return apiClient.get("projects/" + projectId + "/stories");
  },
  getAllStoriesInBacklog(){
    return apiClient.get("stories");
  },
  createStory(story) {
    return apiClient.post("stories", story);
  },
  updateStory(storyId, story) {
    return apiClient.put("stories/" + storyId, story);
  },
  deleteStory(storyId) {
    return apiClient.delete("stories/" + storyId);
  },
};
