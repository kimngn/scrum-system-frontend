<script setup>
  import { onMounted, ref, computed, watch } from "vue";
  import { useRouter } from "vue-router";
  import ProjectCard from "./ProjectCard.vue";
  import ProjectServices from "../services/ProjectServices.js";
  import RepoServices from "../services/RepoServices.js";
  import UserServices from "../services/UserServices.js";
  import HistoryServices from "../services/HistoryServices.js";
  import ProjectMembershipServices from "../services/ProjectMembershipServices.js";

  const router = useRouter();
  const user = ref(null); // currently logged in user

  const projects = ref([]);
  const allUsers = ref([]);

  const isAdd = ref(false);

  // current date
  const today = new Date().toISOString().split("T")[0];

  // Snackbar
  const snackbar = ref({
    value: false,
    color: "",
    text: "",
  });

  // for creating a new project
  const newProject = ref({
    name: "",
    description: "",
    status: "active",
    startDate: null,
    endDate: null,
    repoUrl: "",
    token: "",
  });

  // for creating a new repo
  const newRepo = ref({
    name: undefined,
    repoUrl: undefined,
    projectId: undefined,
  });

  // for project and repo history
  const newAction = ref({});

  // filter members to add to a project
  const filteredUsers = computed(() => {
    if (!memberSearch.value) return [];
    const q = memberSearch.value.toLowerCase();
    return allUsers.value.filter(
      (u) =>
        u.id !== user.value.id &&
        u.role !== "admin" &&
        !selectedMembers.value.find((m) => m.user.id === u.id) &&
        (`${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)),
    );
  });

  const selectedMembers = ref([]);
  const memberSearch = ref("");
  const removedMembershipIds = ref([]);

  watch(isAdd, async (val) => {
    if (val && allUsers.value.length === 0) {
      await UserServices.getAllUsers()
        .then((res) => {
          allUsers.value = res.data;

          console.log("All Users:" + allUsers.value);
        })
        .catch(() => {});
    }
  });

  onMounted(async () => {
    user.value = JSON.parse(localStorage.getItem("user"));
    if (!user.value) {
      router.push({ name: "login" });
      return;
    }
    await getProjects();
  });

  // GET PROJECTS
  async function getProjects() {
    const call =
      user.value?.role === "member"
        ? ProjectServices.getProjectsByUserId(user.value.id)
        : ProjectServices.getProjects();
    await call
      .then(async (response) => {
        projects.value = response.data;
      })
      .catch((error) => {
        showSnackbar(
          "error",
          error.response?.data?.message || "Failed to fetch projects",
        );
      });
  }

  // GET USERS
  async function getUsers() {
    console.log("getUsers called");
    await UserServices.getUsers()
      .then((response) => {
        users.value = response.data;
      })
      .catch((error) => {
        console.log(error);
        snackbar.value.value = true;
        snackbar.value.color = "error";
        snackbar.value.text = error.response.data.message;
      });
  }

  // CREATE PROJECT

  async function createProject() {
    let projectId;
    if (newProject.value.startDate && newProject.value.startDate < today) {
      showSnackbar("error", "Start date cannot be in the past.");
      return;
    }
    if (
      newProject.value.startDate &&
      newProject.value.endDate &&
      newProject.value.endDate <= newProject.value.startDate
    ) {
      showSnackbar("error", "End date must be after start date.");
      return;
    }

    try {
      // create project and get project attributes from response
      const response = await ProjectServices.addProject({
        ...newProject.value,
        userId: user.value.id,
      });
      projectId = response.data.id;
      const projectName = response.data.name;
      console.log("RESPONDED WITH PROJECT: " + projectId);

      // add to project history
      newAction.value = {
        action: "create",
        userId: user.value.id,
        entityName: projectName,
        entityId: projectId,
        entityType: "project",
      };
      await recordAction();

      if (newProject.value.repoUrl) {
        // validate repo URL
        const match = newProject.value.repoUrl.match(
          /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/,
        );
        if (!match) {
          // delete project and show error if there is an issue
          await ProjectServices.deleteProject(projectId);
          showSnackbar("error", "Please enter a valid Github Repo URL.");
          return;
        }

        // extract repo name
        const urlParts = newProject.value.repoUrl.split("/");
        const repoName = urlParts[urlParts.length - 1];
        newRepo.value.name = repoName;
        newRepo.value.repoUrl = newProject.value.repoUrl;
        newRepo.value.projectId = projectId;
        newRepo.value.token = newProject.value.token;

        // validate repo URL with token
        await RepoServices.validateRepo(
          newProject.value.repoUrl,
          newProject.value.token,
        );

        // create repo
        await RepoServices.addRepo(newRepo.value);

        // add to project history
        newAction.value = {
          action: "create",
          userId: user.value.id,
          entityName: repoName,
          entityId: projectId, // or the new repo id if returned
          entityType: "repo",
        };
        await recordAction();
      }

      // add members to the project
      for (const m of selectedMembers.value) {
        await ProjectMembershipServices.addMembership({
          userId: m.user.id,
          projectId,
          role: m.role,
        });
      }

      showSnackbar("green", "Project created successfully!");
      closeAdd();
    } catch (error) {
      // delete project if there's issues
      if (projectId) {
        await ProjectServices.deleteProject(projectId);
      }
      showSnackbar(
        "error",
        error.response?.data?.message || "Failed to create project",
      );
    }

    await getProjects();
  }

  // ADD REPO
  async function addRepo(editingProject) {
    if (!newRepo.value.repoUrl) return;
    try {
      // extract repo name
      const urlParts = newRepo.value.repoUrl.split("/");
      const repoName = urlParts[urlParts.length - 1];

      newRepo.value.name = repoName;
      newRepo.value.projectId = editingProject.id;

      // validate URL
      const match = newRepo.value.repoUrl.match(
        /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/,
      );
      if (!match) throw new Error("Invalid GitHub URL");

      // add repo
      await RepoServices.addRepo(newRepo.value);

      // save to project history
      newAction.value = {
        action: "create",
        userId: user.value.id,
        entityName: repoName,
        entityId: editingProject.id,
        entityType: "repo",
      };
      recordAction();

      // await getRepos(editingProject.id);
    } catch (err) {
      console.error(err);
      showSnackbar("error", err.message || "Failed to add repository");
    }
  }

  // functions for member selection
  function getInitials(u) {
    return (u.firstName[0] + u.lastName[0]).toUpperCase();
  }
  function addMember(u) {
    selectedMembers.value.push({ user: u, role: "member" });
    memberSearch.value = "";
  }
  function removeMember(i) {
    selectedMembers.value.splice(i, 1);
  }

  // create a history object
  async function recordAction() {
    await HistoryServices.addHistory(newAction.value)
      .then(() => {
        console.log("Action recorded!");
      })
      .catch((error) => {
        console.log("Failed to record action! Error: " + error.message);
      });
  }

  function openAdd() {
    // clear out fields from previous use
    newProject.value = {
      name: "",
      description: "",
      status: "active",
      startDate: null,
      endDate: null,
      repoUrl: "",
    };
    selectedMembers.value = [];
    memberSearch.value = "";

    isAdd.value = true;
  }

  function closeAdd() {
    isAdd.value = false;
  }

  function navigateToWorkspace(projectId) {
    router.push({ name: "project-workspace", params: { id: projectId } });
  }

  function showSnackbar(color, text) {
    snackbar.value = { value: true, color, text };
    console.log("SHOW SNACKBAR");
  }
</script>

<template>
  <v-container>
    <v-row align="center" class="mb-4">
      <v-col cols="6">
        <v-card-title class="pl-0 text-h4 font-weight-bold"
          >Projects</v-card-title
        >
      </v-col>
      <v-col class="d-flex justify-end" cols="6">
        <v-btn
          v-if="user && user.role !== 'member'"
          color="accent"
          @click="openAdd()"
          >Add Project</v-btn
        >
      </v-col>
    </v-row>

    <div>
      <ProjectCard
        v-for="p in projects"
        :key="p.id"
        :project="p"
        @refresh="getProjects"
      />
    </div>

    <!-- CREATE PROJECT DIALOG -->
    <v-dialog persistent v-model="isAdd" max-width="550">
      <v-card class="rounded-xl pa-2">
        <v-card-title
          class="d-flex justify-space-between align-center px-4 pt-4 pb-2"
        >
          <span class="text-h6 font-weight-bold">Create Project</span>
          <v-btn icon variant="text" @click="closeAdd()">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="px-4">
          <div class="form-label">PROJECT NAME</div>
          <v-text-field
            v-model="newProject.name"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            placeholder="e.g. SEV Final Project"
            bg-color="grey-lighten-4"
            class="mb-1"
            hide-details
          ></v-text-field>

          <div class="form-label mt-3">DESCRIPTION</div>
          <v-textarea
            v-model="newProject.description"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            placeholder="What does this project accomplish?"
            bg-color="grey-lighten-4"
            rows="3"
            class="mb-1"
            hide-details
          ></v-textarea>

          <div class="form-label mt-3">STATUS</div>
          <v-select
            v-model="newProject.status"
            :items="['active', 'inactive', 'completed']"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            bg-color="grey-lighten-4"
            class="mb-1"
            hide-details
          ></v-select>

          <v-row class="mt-2" no-gutters>
            <v-col cols="6" class="pr-2">
              <div class="form-label">START DATE</div>
              <v-text-field
                v-model="newProject.startDate"
                type="date"
                :min="today"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                bg-color="grey-lighten-4"
                hide-details
              ></v-text-field>
            </v-col>
            <v-col cols="6" class="pl-2">
              <div class="form-label">END DATE</div>
              <v-text-field
                v-model="newProject.endDate"
                type="date"
                :min="newProject.startDate || undefined"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                bg-color="grey-lighten-4"
                hide-details
              ></v-text-field>
            </v-col>
          </v-row>

          <div class="form-label mt-3">GITHUB REPOSITORY</div>
          <v-text-field
            v-model="newProject.repoUrl"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            placeholder="https://github.com/owner/repositoryName"
            bg-color="grey-lighten-4"
            class="mb-1"
            hide-details
          ></v-text-field>

          <div class="form-label mt-3">TEAM'S PERSONAL ACCESS TOKEN</div>
          <v-text-field
            v-model="newProject.token"
            type="password"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            placeholder="github_pat_XXX..."
            bg-color="grey-lighten-4"
            class="mb-1"
            hide-details
          ></v-text-field>

          <div
            class="form-label mt-3 d-flex justify-space-between align-center"
          >
            <span>MEMBERS</span>
            <span
              v-if="selectedMembers.length"
              class="text-caption text-grey-darken-1"
            >
              {{ selectedMembers.length }} member{{
                selectedMembers.length > 1 ? "s" : ""
              }}
              added
            </span>
          </div>

          <div
            v-for="(m, i) in selectedMembers"
            :key="m.user.id"
            class="d-flex align-center mb-2 pa-2 rounded-lg"
            style="background: #f5f5f5"
          >
            <div class="member-avatar mr-3">{{ getInitials(m.user) }}</div>
            <span class="flex-grow-1 text-body-2"
              >{{ m.user.firstName }} {{ m.user.lastName }}</span
            >
            <v-select
              v-model="m.role"
              :items="['lead', 'member']"
              variant="outlined"
              density="compact"
              rounded="lg"
              hide-details
              style="max-width: 145px"
              class="mr-2"
            >
            </v-select>
            <v-btn icon variant="text" size="small" @click="removeMember(i)">
              <v-icon size="18">mdi-close</v-icon>
            </v-btn>
          </div>

          <v-text-field
            v-model="memberSearch"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            placeholder="Search by name or email..."
            bg-color="grey-lighten-4"
            class="mb-1"
            hide-details
          >
          </v-text-field>

          <v-card
            v-if="filteredUsers.length"
            class="mt-1 rounded-lg"
            elevation="3"
          >
            <v-list density="compact">
              <v-list-item
                v-for="u in filteredUsers"
                :key="u.id"
                @click="addMember(u)"
                style="cursor: pointer"
              >
                <template #prepend>
                  <div class="member-avatar mr-3">{{ getInitials(u) }}</div>
                </template>
                <v-list-item-title
                  >{{ u.firstName }} {{ u.lastName }}</v-list-item-title
                >
                <v-list-item-subtitle>{{ u.email }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-card-text>

        <v-card-actions class="px-4 pb-4 justify-end">
          <v-btn variant="flat" color="secondary" @click="closeAdd()"
            >Close</v-btn
          >
          <v-btn
            style="background-color: #9b7d8c"
            variant="flat"
            class="text-white rounded-lg px-6"
            @click="createProject()"
          >
            Create Project
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-alert v-if="projects.length === 0" type="info">
      {{
        user && user.role === "member"
          ? "No projects assigned yet."
          : "No projects found. Create your first project!"
      }}
    </v-alert>
  </v-container>

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
</template>

<style scoped>
  .form-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    color: #8b1a35;
    margin-bottom: 4px;
  }
  .member-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #9e9e9e;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }
</style>
