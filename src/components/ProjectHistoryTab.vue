<script setup>
  import { onMounted } from "vue";
  import { ref } from "vue";
  import ProjectServices from "../services/ProjectServices.js";
  import ProjectHistoryCard from "./ProjectHistoryCard.vue";

  // Variables
  const user = ref(null); // logged in user
  const projects = ref([]);

  // Dropdown options
  const roles = ref(["admin", "lead", "member"]);

  // Snackbar
  const snackbar = ref({
    value: false,
    color: "",
    text: "",
  });

  onMounted(async () => {
    await getProjects();
    user.value = JSON.parse(localStorage.getItem("user"));
  });

  async function getProjects() {
    await ProjectServices.getProjects()
      .then((response) => {
        projects.value = response.data;
      })
      .catch((error) => {
        console.log(error);
        snackbar.value.value = true;
        snackbar.value.color = "error";
        snackbar.value.text = error.response.data.message;
      });
  }
</script>

<template>
  <v-container>
    <div id="body">
      <v-row align="center" class="mb-4">
        <v-col cols="6"
          ><v-card-title class="pl-0 text-h4 font-weight-bold"
            >Project Logs
          </v-card-title>
        </v-col>
      </v-row>

      <!---->
      <ProjectHistoryCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
      />
      <!---->
    </div>
  </v-container>
</template>
