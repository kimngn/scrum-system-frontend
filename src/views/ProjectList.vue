<script setup>
  import { onMounted, ref, computed, watch } from "vue";
  import { useRouter } from "vue-router";
  import ProjectServices from "../services/ProjectServices.js";
  import RepoServices from "../services/RepoServices.js";
  import UserServices from "../services/UserServices.js";
  import HistoryServices from "../services/HistoryServices.js";
  import ProjectMembershipServices from "../services/ProjectMembershipServices.js";
  import Repo from "../components/Repo.vue";

  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const projects = ref([]);
  const user = ref(null);
  const snackbar = ref({ value: false, color: "", text: "" });
  const dialog = ref(false);
  const allUsers = ref([]);
  const selectedMembers = ref([]);
  const memberSearch = ref("");
  const addingRepo = ref(false); // for adding a new repo in the Editing dialog
  const newRepoInput = ref(""); // for adding a new repoUrl in the Editing dialog
  const project = ref({
    name: "",
    description: "",
    status: "active",
    startDate: null,
    endDate: null,
    repoUrl: "",
  });

  const beforeChanges = ref({});

  // for project history log
  const newAction = ref({});
  const newRepo = ref({
    name: undefined,
    repoUrl: undefined,
    projectId: undefined,
  });

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

  watch(dialog, async (val) => {
    if (val && allUsers.value.length === 0) {
      await UserServices.getAllUsers()
        .then((res) => {
          allUsers.value = res.data;
        })
        .catch(() => {});
    }
  });

  const expandedProjects = ref({});
  function toggleProject(id) {
    expandedProjects.value[id] = !expandedProjects.value[id];
  }

  const editDialog = ref(false);

  const editingProject = ref({
    id: null,
    name: "",
    description: "",
    status: "active",
    startDate: null,
    endDate: null,
  });

  const editingRepos = ref([]); // there can be more than one repo per project. Fetches existing repos for a specific project
  const editingMembers = ref([]);
  const removedMembershipIds = ref([]);
  const editMemberSearch = ref("");

  const filteredEditUsers = computed(() => {
    if (!editMemberSearch.value) return [];
    const q = editMemberSearch.value.toLowerCase();
    return allUsers.value.filter(
      (u) =>
        u.id !== user.value?.id &&
        u.role !== "admin" &&
        !editingMembers.value.find((m) => m.user.id === u.id) &&
        (`${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)),
    );
  });

  const editingRepo = ref({
    // the repo being modified and to be sent to the database
    id: null,
    name: "",
    repoUrl: "",
    projectId: null,
  });

  async function openEdit(p) {
    editingProject.value = {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      startDate: p.startDate ? p.startDate.split("T")[0] : null,
      endDate: p.endDate ? p.endDate.split("T")[0] : null,
    };
    beforeChanges.value = JSON.parse(JSON.stringify(editingProject.value));
    RepoServices.getReposByProjectId(p.id)
      .then((response) => {
        editingRepos.value = response.data; // store existing repos for a specific project into an array ref
      })
      .catch((error) => {
        console.log(error);
      });
    try {
      const res = await ProjectMembershipServices.getMembershipsByProjectId(p.id);
      editingMembers.value = (Array.isArray(res.data) ? res.data : []).map((m) => ({
        id: m.id,
        user: m.user,
        role: m.role,
        isNew: false,
      }));
    } catch (err) {
      editingMembers.value = [];
    }
    if (allUsers.value.length === 0) {
      try {
        const res = await UserServices.getAllUsers();
        allUsers.value = res.data;
      } catch (err) {}
    }
    removedMembershipIds.value = [];
    editMemberSearch.value = "";
    editDialog.value = true;
  }

  async function updateProject() {
    console.log("Project: " + editingProject.value.name);
    console.log("Project: " + editingProject.value.description);
    console.log("Project: " + editingProject.value.status);
    await ProjectServices.updateProject(
      editingProject.value.id,
      editingProject.value,
    )
      .then(() => {
        showSnackbar("green", "Project updated successfully!");

        newAction.value.action = "edit";
        newAction.value.userId = user.value.id;
        newAction.value.entityName = editingProject.value.name;
        newAction.value.entityId = editingProject.value.id;
        newAction.value.entityType = "project";

        const oldProject = beforeChanges.value;
        const newProject = editingProject.value;
        // compare project before and after modifications
        for (const attribute in newProject) {
          if (oldProject[attribute] !== newProject[attribute]) {
            newAction.value.fieldName = attribute;
            newAction.value.oldValue = oldProject[attribute];
            newAction.value.newValue = newProject[attribute];

            console.log(newAction.value);
            recordAction();
          }
        }

        editDialog.value = false;
      })
      .catch((error) => {
        console.log(error);
        editDialog.value = true;
      });
  }

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
  function addEditMember(u) {
    editingMembers.value.push({ user: u, role: "member", isNew: true });
    editMemberSearch.value = "";
  }
  function removeEditMember(i) {
    const m = editingMembers.value[i];
    if (m.id) removedMembershipIds.value.push(m.id);
    editingMembers.value.splice(i, 1);
  }

  onMounted(async () => {
    user.value = JSON.parse(localStorage.getItem("user"));
    if (!user.value) {
      router.push({ name: "login" });
      return;
    }
    await getProjects();
  });

  async function saveChanges() {
    if (editingProject.value.startDate && editingProject.value.endDate && editingProject.value.endDate <= editingProject.value.startDate) {
      showSnackbar("error", "End date must be after start date.");
      return;
    }
    // call updateRepo, addRepo, and updateProject all at once when Save Changes button is clicked
    console.log("Editing project:" + editingProject.value.id);
    let hasError = false; // false by default, if errors are found along the way, toggled to true

    const projectId = editingProject.value.id;

    try {
      for (const repo of editingRepos.value) {
        // check repo URL format
        const match = repo.repoUrl.match(
          /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/,
        );
        if (!match) {
          snackbar.value.value = true;
          snackbar.value.color = "error";
          snackbar.value.text = "Invalid Github URL format.";
          hasError = true;
          break;
        }
        // update and validate Repo if URL format is correct
        await updateRepo(repo);
        console.log("Update repo success!");
      }
      // addRepo if updating repo is successful
      try {
        await addRepo(projectId);
      } catch (error) {
        console.log(error);
        snackbar.value.value = true;
        snackbar.value.color = "error";
        snackbar.value.text = error.response?.data?.message || error.message;
        hasError = true;
        return;
      }
      // updateProject if updating and adding repo is successful
      await updateProject();
      console.log("Update project success!");
      for (const id of removedMembershipIds.value) {
        await ProjectMembershipServices.deleteMembership(id);
      }
      for (const m of editingMembers.value.filter((m) => m.isNew)) {
        await ProjectMembershipServices.addMembership({
          userId: m.user.id,
          projectId,
          role: m.role,
        });
      }
      removedMembershipIds.value = [];
    } catch (error) {
      console.log(error);
      snackbar.value.value = true;
      snackbar.value.color = "error";
      snackbar.value.text = error.response.data.message;
      hasError = true;
    }
    // no errors = no need to keep the dialog open

    newRepoInput.value = ""; // reset input
    addingRepo.value = false; // turn textfield back into the "Add" icon
    editDialog.value = hasError;

    if (!hasError) {
      // no errors so display success message
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text =
        "Project and associated repo(s) have been modified.";
    }
  }

  async function getProjects() {
    const call =
      user.value?.role === "member"
        ? ProjectServices.getProjectsByUserId(user.value.id)
        : ProjectServices.getProjects();
    await call
      .then((response) => {
        projects.value = response.data;
      })
      .catch((error) => {
        showSnackbar(
          "error",
          error.response?.data?.message || "Failed to fetch projects",
        );
      });
  }

  async function addRepo(projectId) {
    if (newRepoInput.value) {
      // extract repoName from the URL
      const urlParts = newRepoInput.value.split("/");
      const repoName = urlParts[urlParts.length - 1]; // repoName is at index 4
      console.log(repoName);

      // fill in newRepo
      newRepo.value.name = repoName;
      newRepo.value.repoUrl = newRepoInput.value;
      newRepo.value.projectId = projectId;

      console.log("FLAG: NEW REPO VALUE REPOURL: " + newRepoInput.value);
      // check for correct URL format
      const match = newRepo.value.repoUrl.match(
        /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/,
      ); // returns boolean

      if (!match) {
        throw new Error("Invalid GitHub URL format");
      }

      try {
        await RepoServices.addRepo(newRepo.value);
      } catch (error) {
        throw new Error(
          error.response?.data?.message || "Failed to create repo",
        );
      }
    }
  }

  async function createProject() {
    if (project.value.startDate && project.value.startDate < today) {
      showSnackbar("error", "Start date cannot be in the past.");
      return;
    }
    if (project.value.startDate && project.value.endDate && project.value.endDate <= project.value.startDate) {
      showSnackbar("error", "End date must be after start date.");
      return;
    }
    try {
      // create project and get projectId from response
      const response = await ProjectServices.addProject({
        ...project.value,
        userId: user.value.id,
      });
      const projectId = response.data.id;
      const projectName = response.data.name;
      console.log("RESPONDED WITH PROJECT: " + projectId);
      if (project.value.repoUrl) {
        try {
          // extract repoName from the URL
          const urlParts = project.value.repoUrl.split("/");
          const repoName = urlParts[urlParts.length - 1]; // repoName is at index 4
          console.log(repoName);

          // fill in newRepo
          newRepo.value.name = repoName;
          newRepo.value.repoUrl = project.value.repoUrl;
          newRepo.value.projectId = projectId;

          // check for correct URL format
          const match = project.value.repoUrl.match(
            /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/,
          ); // returns boolean

          if (!match) {
            throw new Error("Invalid GitHub URL format");
          }

          try {
            await RepoServices.addRepo(newRepo.value);
          } catch (error) {
            throw new Error(
              error.response?.data?.message || "Failed to create repo",
            );
          }
        } catch (error) {
          // if there's an error creating repo/validating URL, delete the ProjectService
          await ProjectServices.deleteProject(projectId);

          showSnackbar(
            "error",
            error.response?.data?.message ||
              "Please enter a valid Github Repo URL.",
          );
          return;
        }
      }
      for (const m of selectedMembers.value) {
        await ProjectMembershipServices.addMembership({
          userId: m.user.id,
          projectId,
          role: m.role,
        });
      }
      newAction.value.action = "create";
      newAction.value.userId = user.value.id;
      newAction.value.entityName = projectName;
      newAction.value.entityId = projectId;
      newAction.value.entityType = "project";

      recordAction();

      showSnackbar("green", "Project created successfully!");
      dialog.value = false;
      resetProject();
    } catch (error) {
      showSnackbar(
        "error",
        error.response?.data?.message || "Failed to create project",
      );
    }

    await getProjects();
  }

  async function updateRepo(repo) {
    // extract repoName from the URL
    const urlParts = repo.repoUrl.split("/");
    const repoName = urlParts[urlParts.length - 1]; // repoName is at index 4
    console.log(repoName);

    // fill in editingRepo
    editingRepo.value.id = repo.id;
    editingRepo.value.name = repoName;
    editingRepo.value.repoUrl = repo.repoUrl;
    editingRepo.value.projectId = repo.projectId; // projectId should be the same

    console.log("REPO ID:" + editingRepo.value.name);
    console.log("REPO NAME:" + editingRepo.value.name);
    console.log("NEW REPO URL:" + editingRepo.value.repoUrl);
    console.log("REPO PROJECT ID:" + editingRepo.value.projectId);
    await RepoServices.updateRepo(editingRepo.value.id, editingRepo.value)
      .then(() => {
        console.log("Updated repository");
      })
      .catch((error) => {
        console.log("Failed to update repo");
        throw error;
      });
  }

  async function deleteProject(projectId, projectName) {
    newAction.value.entityId = projectId; // grab this before project gets deleted
    newAction.value.entityName = projectName; // grab this before project gets deleted
    await ProjectServices.deleteProject(projectId)
      .then(() => {
        showSnackbar("green", "Project deleted successfully!");

        console.log("Project deleted");

        newAction.value.action = "delete";
        newAction.value.userId = user.value.id;
        newAction.value.entityType = "project";

        console.log("Record action!");
        recordAction();
      })
      .catch((error) => {
        showSnackbar(
          "error",
          error.response?.data?.message || "Failed to delete project",
        );
      });
    await getProjects();
  }

  async function deleteRepo(repoId) {
    await RepoServices.deleteRepo(repoId)
      .then(() => {
        showSnackbar("green", "Repo deleted successfully!");
      })
      .catch((error) => {
        showSnackbar(
          "error",
          error.response?.data?.message || "Failed to delete repo",
        );
      });
  }

  function resetProject() {
    project.value = {
      name: "",
      description: "",
      status: "active",
      startDate: null,
      endDate: null,
      repoUrl: "",
    };
    selectedMembers.value = [];
    memberSearch.value = "";
  }

  async function recordAction() {
    await HistoryServices.addHistory(newAction.value)
      .then(() => {
        console.log("Action recorded!");
      })
      .catch((error) => {
        console.log("Failed to record action! Error: " + error.message);
      });
  }

  function showSnackbar(color, text) {
    snackbar.value = { value: true, color, text };
  }

  function toggleAddRepo() {
    // toggle between the "Add repo" button and textfield in the editting project dialog
    console.log("ADDING REPO VALUE:" + addingRepo.value);
    newRepoInput.value = "";
    addingRepo.value = addingRepo.value ? false : true;
  }
</script>

<template>
  <v-container>
    <div id="body">
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
            @click="dialog = true"
            >Create Project</v-btn
          >
        </v-col>
      </v-row>

      <v-card
        v-for="p in projects"
        :key="p.id"
        class="rounded-lg elevation-5 mb-4"
        @click="toggleProject(p.id)"
      >
        <v-card-title class="headline">
          <v-row align="center">
            <v-col cols="10">
              {{ p.name }}
              <v-chip class="ma-2" color="blue" label>
                <v-icon start icon="mdi-account-circle"></v-icon>
                {{ p.status }}
              </v-chip>
            </v-col>
          </v-row>
        </v-card-title>

        <v-expand-transition>
          <v-card-text v-show="expandedProjects[p.id]">
            <v-row class="mb-2 mt-2" align="center">
              <v-col class="pl-6" cols="6">
                <v-row class="subheader">DESCRIPTION</v-row>
                <v-row>{{ p.description || "—" }}</v-row>
              </v-col>
              <v-col class="pl-6" cols="6">
                <v-row class="subheader">STATUS</v-row>
                <v-row>{{ p.status }}</v-row>
              </v-col>
            </v-row>
            <v-row class="mb-2" align="center">
              <v-col class="pl-6" cols="6">
                <v-row class="mt-3 subheader">START DATE</v-row>
                <v-row>{{
                  p.startDate ? new Date(p.startDate).toLocaleDateString(undefined, { timeZone: "UTC" }) : "—"
                }}</v-row>
              </v-col>
              <v-col class="pl-6" cols="6">
                <v-row class="subheader">END DATE</v-row>
                <v-row>{{
                  p.endDate ? new Date(p.endDate).toLocaleDateString(undefined, { timeZone: "UTC" }) : "—"
                }}</v-row>
              </v-col>
            </v-row>

            <v-row class="mb-2" align="center">
              <v-col class="pl-6" cols="6">
                <v-row class="mt-3 subheader">REPOS</v-row>
                <v-row>
                  <Repo :projectId="p.id" />
                </v-row>
              </v-col>
            </v-row>

            <v-row class="mb-2" justify="space-between" align="center">
              <v-col cols="auto" class="d-flex ga-2">
                <button
                  v-if="user && user.role !== 'member'"
                  @click.stop="openEdit(p)"
                  class="editButtonStyle"
                >
                  Edit
                </button>
                <button
                  v-if="user && user.role !== 'member'"
                  @click.stop="deleteProject(p.id, p.name)"
                  class="deleteButtonStyle"
                >
                  Delete
                </button>
              </v-col>
              <v-col v-if="user && user.role !== 'member'" cols="auto">
                <v-btn
                  color="primary"
                  @click.stop="
                    router.push({
                      name: 'project-workspace',
                      params: { id: p.id },
                    })
                  "
                >
                  View Workspace
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-expand-transition>
      </v-card>

      <v-alert v-if="projects.length === 0" type="info">
        {{
          user && user.role === "member"
            ? "No projects assigned yet."
            : "No projects found. Create your first project!"
        }}
      </v-alert>

      <v-dialog v-model="dialog" max-width="550">
        <v-card class="rounded-xl pa-2">
          <v-card-title
            class="d-flex justify-space-between align-center px-4 pt-4 pb-2"
          >
            <span class="text-h6 font-weight-bold">Create Project</span>
            <v-btn
              icon
              variant="text"
              @click="
                dialog = false;
                resetProject();
              "
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="px-4">
            <div class="form-label">PROJECT NAME</div>
            <v-text-field
              v-model="project.name"
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
              v-model="project.description"
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
              v-model="project.status"
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
                  v-model="project.startDate"
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
                  v-model="project.endDate"
                  type="date"
                  :min="project.startDate || undefined"
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
              v-model="project.repoUrl"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              placeholder="https://github.com/owner/repositoryName"
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
            <v-btn
              variant="text"
              @click="
                dialog = false;
                resetProject();
              "
              >Cancel</v-btn
            >
            <v-btn
              style="background-color: #9b7d8c"
              variant="flat"
              class="text-white rounded-lg px-6"
              @click="createProject"
            >
              Create Project
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="editDialog" max-width="550">
        <v-card class="rounded-xl pa-2">
          <v-card-title
            class="d-flex justify-space-between align-center px-4 pt-4 pb-2"
          >
            <span class="text-h6 font-weight-bold">Edit Project</span>
            <v-btn icon variant="text" @click="editDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="px-4">
            <div class="form-label">PROJECT NAME</div>
            <v-text-field
              v-model="editingProject.name"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              bg-color="grey-lighten-4"
              class="mb-1"
              hide-details
            >
            </v-text-field>

            <div class="form-label mt-3">DESCRIPTION</div>
            <v-textarea
              v-model="editingProject.description"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              bg-color="grey-lighten-4"
              rows="3"
              class="mb-1"
              hide-details
            >
            </v-textarea>

            <div class="form-label mt-3">STATUS</div>
            <v-select
              v-model="editingProject.status"
              :items="['active', 'inactive', 'completed']"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              bg-color="grey-lighten-4"
              class="mb-1"
              hide-details
            >
            </v-select>

            <v-row class="mt-2" no-gutters>
              <v-col cols="6" class="pr-2">
                <div class="form-label">START DATE</div>
                <v-text-field
                  v-model="editingProject.startDate"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  bg-color="grey-lighten-4"
                  hide-details
                >
                </v-text-field>
              </v-col>
              <v-col cols="6" class="pl-2">
                <div class="form-label">END DATE</div>
                <v-text-field
                  v-model="editingProject.endDate"
                  type="date"
                  :min="editingProject.startDate || undefined"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  bg-color="grey-lighten-4"
                  hide-details
                >
                </v-text-field>
              </v-col>

              <v-row class="mt-2">
                <v-col cols="12" class="pl-3">
                  <!-- iterate by index rather than id or name -->
                  <!-- index is being increased, repo just gets assigned the item in the editingRepos array -->
                  <div class="form-label">REPO URL(S)</div>
                  <div
                    v-for="(repo, index) in editingRepos"
                    :key="index"
                    class="mt-2"
                  >
                    <v-text-field
                      v-model="repo.repoUrl"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      bg-color="grey-lighten-4"
                      hide-details
                      append-icon="mdi-trash-can"
                      @click:append="deleteRepo(repo.id)"
                    ></v-text-field>
                  </div>

                  <div class="mt-2" v-if="addingRepo">
                    <v-text-field
                      v-model="newRepoInput"
                      placeholder="https://github.com/owner/repositoryName"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      bg-color="grey-lighten-4"
                      append-icon="mdi-cancel"
                      @click:append="toggleAddRepo()"
                      hide-details
                    >
                    </v-text-field>
                  </div>

                  <v-icon
                    v-else
                    class="mt-3"
                    size="small"
                    icon="mdi-plus-circle-outline"
                    @click="toggleAddRepo()"
                  ></v-icon>
                </v-col>
              </v-row>
            </v-row>

            <v-row class="mt-2">
              <v-col cols="12" class="pl-3">
                <div class="form-label d-flex justify-space-between align-center">
                  <span>MEMBERS</span>
                  <span v-if="editingMembers.length" class="text-caption text-grey-darken-1">
                    {{ editingMembers.length }} member{{ editingMembers.length > 1 ? "s" : "" }}
                  </span>
                </div>

                <div
                  v-for="(m, i) in editingMembers"
                  :key="m.user.id"
                  class="d-flex align-center mb-2 pa-2 rounded-lg mt-2"
                  style="background: #f5f5f5"
                >
                  <div class="member-avatar mr-3">{{ getInitials(m.user) }}</div>
                  <span class="flex-grow-1 text-body-2">{{ m.user.firstName }} {{ m.user.lastName }}</span>
                  <v-select
                    v-model="m.role"
                    :items="['lead', 'member']"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    style="max-width: 145px"
                    class="mr-2"
                  />
                  <v-btn icon variant="text" size="small" @click="removeEditMember(i)">
                    <v-icon size="18">mdi-close</v-icon>
                  </v-btn>
                </div>

                <v-text-field
                  v-model="editMemberSearch"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  placeholder="Search by name or email..."
                  bg-color="grey-lighten-4"
                  class="mt-2 mb-1"
                  hide-details
                />

                <v-card v-if="filteredEditUsers.length" class="mt-1 rounded-lg" elevation="3">
                  <v-list density="compact">
                    <v-list-item
                      v-for="u in filteredEditUsers"
                      :key="u.id"
                      @click="addEditMember(u)"
                      style="cursor: pointer"
                    >
                      <template #prepend>
                        <div class="member-avatar mr-3">{{ getInitials(u) }}</div>
                      </template>
                      <v-list-item-title>{{ u.firstName }} {{ u.lastName }}</v-list-item-title>
                      <v-list-item-subtitle>{{ u.email }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions class="px-4 pb-4 justify-end">
            <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>
            <v-btn
              color="primary"
              variant="flat"
              class="text-white rounded-lg px-6"
              @click="saveChanges()"
            >
              Save Changes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

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
    </div>
  </v-container>
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
