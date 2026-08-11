import apiClient from "./services";

export default {

  getBySprint(sprintId) {
    return apiClient.get(
      `/retrospectives/sprint/${sprintId}`
    );
  },

  saveRetrospective(retrospective) {
    return apiClient.post(
      "/retrospectives",
      retrospective
    );
  },

};