<script setup>
  import { onMounted } from "vue";
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { Tabs, Tab } from "super-vue3-tabs";
  import UserServices from "../services/UserServices.js";
  import ProjectList from "./ProjectList.vue";
  import UserTab from "../components/UserTab.vue";

  const router = useRouter();
  const users = ref([]);
  const user = ref(null);
  const snackbar = ref({ value: false, color: "", text: "" });

  onMounted(async () => {
    user.value = JSON.parse(localStorage.getItem("user"));
    if (!user.value || (user.value.role !== "admin" && user.value.role !== "lead")) {
      router.push({ name: "login" });
      return;
    }
    await getUsers();
  });

  async function getUsers() {
    await UserServices.getAllUsers()
      .then((response) => { users.value = response.data; })
      .catch((error) => { showSnackbar("error", error.response?.data?.message || "Failed to fetch users"); });
  }

  async function updateUserRole(userId, newRole) {
    await UserServices.updateUserRole(userId, { role: newRole })
      .then(() => { showSnackbar("green", "User role updated successfully!"); })
      .catch((error) => { showSnackbar("error", error.response?.data?.message || "Failed to update role"); });
    await getUsers();
  }

  function showSnackbar(color, text) {
    snackbar.value = { value: true, color, text };
  }
</script>

<template>
  <!-- https://mdsaban.com/packages/super-vue3-tabs-component/demo/ -->
  <v-container>
    <Tabs>
      <Tab value="Users">
        <template #icon>
          <i class="fas fa-home"></i>
        </template>
        <UserTab />
      </Tab>
      <Tab value="Projects">
        <template #icon>
          <i class="fas fa-user"></i>
        </template>
        <ProjectList />
      </Tab>
    </Tabs>

    <v-snackbar v-model="snackbar.value" rounded="pill">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn :color="snackbar.color" variant="text" @click="snackbar.value = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>