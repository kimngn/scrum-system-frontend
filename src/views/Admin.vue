<script setup>
  import { onMounted } from "vue";
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import UserServices from "../services/UserServices.js";
  import UserTab from "../components/UserTab.vue";

  const router = useRouter();
  const users = ref([]);
  const user = ref(null);
  const snackbar = ref({ value: false, color: "", text: "" });

  const systemLogsButtonStyle = ref("systemLogsButton");

  onMounted(async () => {
    user.value = JSON.parse(localStorage.getItem("user"));
    if (
      !user.value ||
      (user.value.role !== "admin" && user.value.role !== "lead")
    ) {
      router.push({ name: "login" });
      return;
    }
    await getUsers();
  });

  async function getUsers() {
    await UserServices.getAllUsers()
      .then((response) => {
        users.value = response.data;
      })
      .catch((error) => {
        showSnackbar(
          "error",
          error.response?.data?.message || "Failed to fetch users",
        );
      });
  }

  async function updateUserRole(userId, newRole) {
    await UserServices.updateUserRole(userId, { role: newRole })
      .then(() => {
        showSnackbar("green", "User role updated successfully!");
      })
      .catch((error) => {
        showSnackbar(
          "error",
          error.response?.data?.message || "Failed to update role",
        );
      });
    await getUsers();
  }

  function navigateToSystemLogs() {
    router.push({ name: "systemlogs" });
  }
  function showSnackbar(color, text) {
    snackbar.value = { value: true, color, text };
  }
</script>

<template>
  <v-container fluid>
    <UserTab />

    <v-btn class="systemLogsButton" @click="navigateToSystemLogs()"
      >System Logs</v-btn
    >

    <v-snackbar v-model="snackbar.value" rounded="pill">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          :color="snackbar.color"
          variant="text"
          @click="snackbar.value = false"
          >Close</v-btn
        >
      </template>
    </v-snackbar>
  </v-container>
</template>

<style>
  .systemLogsButton {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgb(155, 55, 55);
    color: azure;
  }
</style>
