<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ProjectServices from "../services/ProjectServices.js";

const router = useRouter();
const projects = ref([]);
const user = ref(null);
const snackbar = ref({ value: false, color: "", text: "" });
const dialog = ref(false);
const project = ref({
  name: "",
  description: "",
  status: "active",
  startDate: null,
  endDate: null,
});

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  if (!user.value) {
    router.push({ name: "login" });
    return;
  }
  await getProjects();
});

async function getProjects() {
  await ProjectServices.getProjectsByUserId(user.value.id)
    .then((response) => { projects.value = response.data; })
    .catch((error) => { showSnackbar("error", error.response?.data?.message || "Failed to fetch projects"); });
}

async function createProject() {
  await ProjectServices.addProject({ ...project.value, userId: user.value.id })
    .then(() => { 
      showSnackbar("green", "Project created successfully!");
      dialog.value = false;
      resetProject();
    })
    .catch((error) => { showSnackbar("error", error.response?.data?.message || "Failed to create project"); });
  await getProjects();
}

async function deleteProject(projectId) {
  await ProjectServices.deleteProject(projectId)
    .then(() => { showSnackbar("green", "Project deleted successfully!"); })
    .catch((error) => { showSnackbar("error", error.response?.data?.message || "Failed to delete project"); });
  await getProjects();
}

function resetProject() {
  project.value = {
    name: "",
    description: "",
    status: "active",
    startDate: null,
    endDate: null,
  };
}

function showSnackbar(color, text) {
  snackbar.value = { value: true, color, text };
}
</script>

<template>
  <v-container>
    <div id="body">
      <v-card-title class="text-h4 font-weight-bold mb-4">Projects</v-card-title>
      
      <v-btn v-if="user && user.role !== 'member'" class="mb-4" color="primary" @click="dialog = true">Create Project</v-btn>
      <v-card class="rounded-lg elevation-3">
        <v-card-text>
          <v-table v-if="projects.length > 0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in projects" :key="p.id">
                <td>{{ p.name }}</td>
                <td>{{ p.description }}</td>
                <td>{{ p.status }}</td>
                <td>
                  <v-btn size="small" color="error" @click="deleteProject(p.id)">Delete</v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-alert v-else type="info">
            {{ user && user.role === 'member' ? 'No projects assigned yet.' : 'No projects found. Create your first project!' }}
          </v-alert>
        </v-card-text>
      </v-card>

      <v-dialog v-model="dialog" width="600">
        <v-card class="rounded-lg elevation-5">
          <v-card-title>Create Project</v-card-title>
          <v-card-text>
            <v-text-field v-model="project.name" label="Project Name" required></v-text-field>
            <v-text-field v-model="project.description" label="Description" required></v-text-field>
            <v-select v-model="project.status" :items="['active', 'inactive', 'completed']" label="Status"></v-select>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" @click="dialog = false">Cancel</v-btn>
            <v-btn color="primary" @click="createProject">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="snackbar.value" rounded="pill">
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn :color="snackbar.color" variant="text" @click="snackbar.value = false">Close</v-btn>
        </template>
      </v-snackbar>
    </div>
  </v-container>
</template>