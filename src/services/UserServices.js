import apiClient from "./services";

export default {
  getUsers() {
    return apiClient.get("users");
  },

  addUser(user) {
    return apiClient.post("users", user);
  },

  updateUser(user) {
    return apiClient.put("users/" + user.id, user);
  },

  // Lance's solution to password issue
  updatePassword(id, password) {
    return apiClient.put("users/" + id + "/password", { password: password });
  },

  deleteUser(user) {
    return apiClient.delete("users/" + user.id);
  },

  loginUser(user) {
    console.log(user);
    return apiClient.post("login", user.value, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        crossDomain: true,
        Authorization:
          "Basic " + btoa(user.value.email + ":" + user.value.password),
      },
    });
  },

  logoutUser() {
    return apiClient.post("logout");
  },
  getAllUsers() {
    return apiClient.get("users");
  },
  updateUserRole(userId, roleData) {
    return apiClient.put("users/" + userId, roleData);
  },
};



