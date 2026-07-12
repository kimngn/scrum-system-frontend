<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ProjectServices from "../services/ProjectServices.js";

const router = useRouter();
const projects = ref([]);
const user = ref(null);
const isAdd = ref(false);
const isEdit = ref(false);
const snackbar = ref({ value: false, color: "", text: "" });
const newProject = ref({ name: "", description: "", status: "active", startDate: "", endDate: "" });
const editProject = ref({});

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem("user"));
  await getProjects();
});

async function getProjects() {
  await ProjectServices.getProjectsByUserId(user.value.id)
    .then((response) => { projects.value = response.data; })
    .catch((error) => { showSnackbar("error", error.response.data.message); });
}

async function addProject() {
  newProject.value.userId = user.value.id;
  await ProjectServices.addProject(newProject.value)
    .then(() => { showSnackbar("green", `${newProject.value.name} added successfully!`); })
    .catch((error) => { showSnackbar("error", error.response.data.message); });
  isAdd.value = false;
  newProject.value = { name: "", description: "", status: "active", startDate: "", endDate: "" };
  await getProjects();
}

async function updateProject() {
  await ProjectServices.updateProject(editProject.value.id, editProject.value)
    .then(() => { showSnackbar("green", `${editProject.value.name} updated successfully!`); })
    .catch((error) => { showSnackbar("error", error.response.data.message); });
  isEdit.value = false;
  await getProjects();
}

async function deleteProject(project) {
  await ProjectServices.deleteProject(project.id)
    .then(() => { showSnackbar("green", `${project.name} deleted successfully!`); })
    .catch((error) => { showSnackbar("error", error.response.data.message); });
  await getProjects();
}

function openEdit(project) {
  editProject.value = { ...project };
  isEdit.value = true;
}

function showSnackbar(color, text) {
  snackbar.value = { value: true, color, text };
}
</script>

<template>
  <v-container>
    <div id="body">
      <v-row align="center" class="mb-4">
        <v-col cols="10">
          <v-card-title class="pl-0 text-h4 font-weight-bold">Projects</v-card-title>
        </v-col>
        <v-col class="d-flex justify-end" cols="2">
          <v-btn color="accent" @click="isAdd = true">Add</v-btn>
        </v-col>
      </v-row>

      <v-card
        v-for="project in projects"
        :key="project.id"
        class="rounded-lg elevation-3 mb-4"
      >
        <v-card-title>{{ project.name }}</v-card-title>
        <v-card-subtitle>Status: {{ project.status }}</v-card-subtitle>
        <v-card-text>{{ project.description }}</v-card-text>
        <v-card-actions>
          <v-btn color="primary" variant="flat" @click="openEdit(project)">Edit</v-btn>
          <v-btn color="error" variant="flat" @click="deleteProject(project)">Delete</v-btn>
        </v-card-actions>
      </v-card>

      <!-- Add Dialog -->
      <v-dialog persistent v-model="isAdd" width="800">
        <v-card class="rounded-lg elevation-5">
          <v-card-title class="headline mb-2">Add Project</v-card-title>
          <v-card-text>
            <v-text-field v-model="newProject.name" label="Name" required></v-text-field>
            <v-textarea v-model="newProject.description" label="Description"></v-textarea>
            <v-select v-model="newProject.status" :items="['active', 'inactive', 'completed']" label="Status"></v-select>
            <v-text-field v-model="newProject.startDate" label="Start Date" type="date"></v-text-field>
            <v-text-field v-model="newProject.endDate" label="End Date" type="date"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="flat" color="secondary" @click="isAdd = false">Close</v-btn>
            <v-btn variant="flat" color="primary" @click="addProject()">Add Project</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Edit Dialog -->
      <v-dialog persistent v-model="isEdit" width="800">
        <v-card class="rounded-lg elevation-5">
          <v-card-title class="headline mb-2">Edit Project</v-card-title>
          <v-card-text>
            <v-text-field v-model="editProject.name" label="Name" required></v-text-field>
            <v-textarea v-model="editProject.description" label="Description"></v-textarea>
            <v-select v-model="editProject.status" :items="['active', 'inactive', 'completed']" label="Status"></v-select>
            <v-text-field v-model="editProject.startDate" label="Start Date" type="date"></v-text-field>
            <v-text-field v-model="editProject.endDate" label="End Date" type="date"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="flat" color="secondary" @click="isEdit = false">Close</v-btn>
            <v-btn variant="flat" color="primary" @click="updateProject()">Save</v-btn>
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