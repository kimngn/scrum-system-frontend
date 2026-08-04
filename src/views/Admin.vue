<script setup>
  import { onMounted, ref, watch } from "vue";
  import { useRouter, useRoute } from "vue-router";
  import UserServices from "../services/UserServices.js";
  import ProjectTab from "../components/ProjectTab.vue";
  import UserTab from "../components/UserTab.vue";

  const router = useRouter();
  const route = useRoute();
  const users = ref([]);
  const user = ref(null);
  const snackbar = ref({ value: false, color: "", text: "" });

  const tab = ref(route.query.tab || "Users");

  watch(
    () => route.query.tab,
    (newTab) => {
      if (newTab) tab.value = newTab;
    }
  );

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

  function showSnackbar(color, text) {
    snackbar.value = { value: true, color, text };
  }
</script>

<template>
  <v-container>
    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="Users">Users</v-tab>
      <v-tab value="Projects">Projects</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="Users">
        <UserTab />
      </v-window-item>
      <v-window-item value="Projects">
        <ProjectTab />
      </v-window-item>
    </v-window>

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

<style></style>
