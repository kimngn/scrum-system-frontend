import apiClient from "./services";

export default {

  getByStoryId(userStoryId) {
    return apiClient.get(
      "acceptancecriteria/story/" +
        userStoryId
    );
  },

  addAcceptanceCriteria(data) {
    return apiClient.post(
      "acceptancecriteria",
      data
    );
  },

  updateAcceptanceCriteria(
    id,
    data
  ) {
    return apiClient.put(
      "acceptancecriteria/" + id,
      data
    );
  },

  deleteAcceptanceCriteria(id) {
    return apiClient.delete(
      "acceptancecriteria/" + id
    );
  },
};