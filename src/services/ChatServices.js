import apiClient from "./services";

export default {
  sendMessage(message, projectId, history) {
    return apiClient.post("chat", { message: message, projectId: projectId, history: history });
  },
};
