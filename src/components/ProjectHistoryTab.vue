<script setup>
  import { onMounted } from "vue";
  import { computed } from "vue";
  import { ref } from "vue";
  import ProjectServices from "../services/ProjectServices.js";
  import HistoryServices from "../services/HistoryServices.js";
  import ProjectHistoryCard from "./ProjectHistoryCard.vue";

  // Variables
  const user = ref(null); // logged in user
  const projectHistory = ref([]);
  const projectIds = ref([]);

  // Dropdown options
  const roles = ref(["admin", "lead", "member"]);

  // Snackbar
  const snackbar = ref({
    value: false,
    color: "",
    text: "",
  });

  onMounted(async () => {
    await getProjectHistory();

    await getProjectIds();
    console.log("PROJECT IDs:", projectIds.value);
    user.value = JSON.parse(localStorage.getItem("user"));
  });

  async function getProjectIds() {
    const ids = []; // could probably also use a set here

    for (var i = 0; i < projectHistory.value.length; ++i) {
      const action = projectHistory.value[i];

      if (action) {
        // if action exists
        if (ids.indexOf(action.entityId) === -1) {
          // if the value doesn't exist in ids yet, push it in
          ids.push(action.entityId);
        }
      }
    }
    projectIds.value = ids;
  }

  async function getProjectHistory() {
    await HistoryServices.getProjectHistory()
      .then((response) => {
        projectHistory.value = response.data;
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

      <ProjectHistoryCard
        v-for="projectId in projectIds"
        :key="projectId"
        :projectId="projectId"
      />
    </div>
  </v-container>
</template>
