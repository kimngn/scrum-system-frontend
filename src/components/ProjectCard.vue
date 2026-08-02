<script setup>
  import { ref, onMounted, computed, watch } from "vue";
  import Repo from "../components/Repo.vue";

  import ProjectServices from "../services/ProjectServices.js";
  import RepoServices from "../services/RepoServices.js";
  import UserServices from "../services/UserServices.js";
  import HistoryServices from "../services/HistoryServices.js";
  import ProjectMembershipServices from "../services/ProjectMembershipServices.js";

  const props = defineProps({
    project: {
      required: true,
    },
  });

  const project = ref(props.project);
  const projectDetails = ref(false);
  const user = ref(null);
  const isEdit = ref(false);
  const editingMembers = ref([]);
  const removedMembershipIds = ref([]);
  const editMemberSearch = ref("");
  const allUsers = ref([]);
  const beforeChanges = ref([]);
  const repos = ref([]);
  const newRepoInput = ref(null); // what the add new repo textfield in the edit dialog is referring to
  const newRepoTokenInput = ref("");
  const isAddRepo = ref(false); // toggle between "x" and textfield input for adding repo

  // for project and repo history
  const newAction = ref({});

  // New User
  const newProject = ref({
    id: null,
    name: "",
    description: "",
    status: "active",
    startDate: null,
    endDate: null,
    repoUrl: "",
  });

  // New Repo
  const newRepo = ref({
    name: undefined,
    repoUrl: undefined,
    projectId: undefined,
  });

  function getInitials(u) {
    return (u.firstName[0] + u.lastName[0]).toUpperCase();
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

  async function openEdit(p) {
    newProject.value.id = p.id;
    newProject.value.name = p.name;
    newProject.value.description = p.description;
    newProject.value.status = p.status;
    newProject.value.startDate = p.startDate ? p.startDate.split("T")[0] : null;
    newProject.value.endDate = p.endDate ? p.endDate.split("T")[0] : null;
    beforeChanges.value = JSON.parse(JSON.stringify(project.value)); // grabbing the original value for later history record
    newRepoTokenInput.value = repos.value?.[0]?.token ?? null;

    try {
      const res = await ProjectMembershipServices.getMembershipsByProjectId(
        p.id,
      );
      editingMembers.value = (Array.isArray(res.data) ? res.data : []).map(
        (m) => ({
          id: m.id,
          user: m.user,
          role: m.role,
          isNew: false,
        }),
      );
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
    isEdit.value = true;
  }

  // Snackbar
  const snackbar = ref({
    value: false,
    color: "",
    text: "",
  });

  async function recordAction() {
    await HistoryServices.addHistory(newAction.value)
      .then(() => {
        console.log("Action recorded!");
      })
      .catch((error) => {
        console.log("Failed to record action! Error: " + error.message);
      });
  }

  // when isEdit changes, update allUsers
  watch(isEdit, async (val) => {
    if (val && allUsers.value.length === 0) {
      await UserServices.getAllUsers()
        .then((res) => {
          allUsers.value = res.data;
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
    await getRepos();
  });

  async function getRepos() {
    await RepoServices.getReposByProjectId(project.value.id) // one project per card, so this should work
      .then((response) => {
        repos.value = response.data;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  async function saveChanges() {
    if (
      newProject.value.startDate &&
      newProject.value.endDate &&
      newProject.value.endDate <= newProject.value.startDate
    ) {
      showSnackbar("error", "End date must be after start date.");
      return;
    }
    // call updateRepo, addRepo, and updateProject all at once when Save Changes button is clicked
    console.log("New project:" + newProject.value.id);
    let hasError = false; // false by default, if errors are found along the way, toggled to true

    const projectId = newProject.value.id;

    try {
      for (const repo of repos.value) {
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
        await addRepo(newProject.value);
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

      // update memberships
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
      snackbar.value.text = error?.response?.data.message;
      hasError = true;
    }

    newRepoInput.value = ""; // reset input
    isAddRepo.value = false; // turn textfield back into the "Add" icon
    isEdit.value = hasError;

    // no errors = no need to keep the dialog open
    if (!hasError) {
      // no errors so display success message
      snackbar.value.value = true;
      snackbar.value.color = "green";
      snackbar.value.text =
        "Project and associated repo(s) have been modified.";

      console.log("Project Repos:" + repos.value[0]);
      const response = await RepoServices.getReposByProjectId(projectId); // refresh repos
      repos.value = response.data;
    }

    await getProjects();
  }

  // DELETE PROJECT
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

  function toggleIsAddRepo() {
    // toggle between "Add Repo" and "cancel" button in the Edit Project dialog
    isAddRepo.value = isAddRepo.value ? false : true;
  }

  // UPDATE PROJECT
  async function updateProject() {
    await ProjectServices.updateProject(newProject.value.id, newProject.value)
      .then(() => {
        showSnackbar("green", "Project updated successfully!");

        newAction.value.action = "edit";
        newAction.value.userId = user.value.id;
        newAction.value.entityName = newProject.value.name;
        newAction.value.entityId = newProject.value.id;
        newAction.value.entityType = "project";

        const projectBefore = beforeChanges.value;
        const projectAfter = newProject.value;
        // compare project before and after modifications
        for (const attribute in projectAfter) {
          if (projectBefore[attribute] !== projectAfter[attribute]) {
            newAction.value.fieldName = attribute;
            newAction.value.oldValue = projectBefore[attribute];
            newAction.value.newValue = projectAfter[attribute];
            recordAction();
          }
        }

        isEdit.value = false; // close editing dialog
      })
      .catch((error) => {
        console.log(error);
        isEdit.value = true; // close editing dialog
      });
  }

  // ADD REPO
  async function addRepo(project) {
    if (newRepoInput.value) {
      // extract repoName from the URL
      const urlParts = newRepoInput.value.split("/");
      const repoName = urlParts[urlParts.length - 1]; // repoName is at index 4
      console.log(repoName);

      // fill in newRepo
      newRepo.value.name = repoName;
      newRepo.value.repoUrl = newRepoInput.value;
      newRepo.value.projectId = project.id;

      // check for correct URL format
      const match = newRepo.value.repoUrl.match(
        /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/,
      ); // returns boolean

      if (!match) {
        throw new Error("Invalid GitHub URL format");
      }

      try {
        await RepoServices.addRepo(newRepo.value);
        newAction.value.action = "create";
        newAction.value.userId = user.value.id;
        newAction.value.entityName = newRepo.value.name;
        newAction.value.entityId = project.id;
        newAction.value.entityType = "repo";
        recordAction();

        // find project associated with projectId
      } catch (error) {
        throw error; // keep original backend error
      }
    }
  }

  // UPDATE REPO
  async function updateRepo(repo) {
    // extract repoName from the URL
    const urlParts = repo.repoUrl.split("/");
    const repoName = urlParts[urlParts.length - 1]; // repoName is at index 4
    console.log(repoName);

    // fill in repo being modified

    newRepo.value.id = repo.id;
    newRepo.value.name = repoName;
    newRepo.value.repoUrl = repo.repoUrl;
    newRepo.value.projectId = repo.projectId; // projectId should be the same
    newRepo.value.token = newRepoTokenInput;
    console.log("REPO ID:" + newRepo.value.name);
    console.log("REPO NAME:" + newRepo.value.name);
    console.log("NEW REPO URL:" + newRepo.value.repoUrl);
    console.log("REPO PROJECT ID:" + newRepo.value.projectId);
    await RepoServices.updateRepo(newRepo.value.id, newRepo.value)
      .then(() => {
        console.log("Updated repository");
      })
      .catch((error) => {
        console.log("Failed to update repo");
        throw error;
      });
  }

  // DELETE REPO
  async function deleteRepo(repo, projectId) {
    newAction.value.entityId = projectId; // grab this before project gets deleted
    await RepoServices.deleteRepo(repo.id)
      .then(() => {
        showSnackbar("green", "Repo deleted successfully!");

        newAction.value.action = "delete";
        newAction.value.userId = user.value.id;
        newAction.value.entityType = "repo";
        recordAction();
      })
      .catch((error) => {
        showSnackbar(
          "error",
          error.response?.data?.message || "Failed to delete repo",
        );
      });

    // fixes the bug where ALL repos get deleted (visually, not actually)
    const response = await RepoServices.getReposByProjectId(projectId);
    repos.value = response.data;
  }

  function closeEdit() {
    newRepoInput.value = ""; // clear out newRepoInput textfield
    isAddRepo.value = false;
    isEdit.value = false;
  }
  function showSnackbar(color, text) {
    snackbar.value = { value: true, color, text };
  }

  function closeSnackBar() {
    snackbar.value.value = false;
  }
</script>

<template>
  <v-card
    class="rounded-lg elevation-5 mb-4"
    @click="projectDetails = !projectDetails"
  >
    <v-card-title class="headline">
      <v-row align="center">
        <v-col cols="10">
          {{ project.name }}
          <v-chip class="ma-2" color="blue" label>
            <v-icon start icon="mdi-account-circle"></v-icon>
            {{ project.status }}
          </v-chip>
        </v-col>
      </v-row>
    </v-card-title>

    <v-expand-transition>
      <v-card-text v-show="projectDetails">
        <v-row class="mb-2 mt-2" align="center">
          <v-col class="pl-6" cols="6">
            <v-row class="subheader">DESCRIPTION</v-row>
            <v-row>{{ project.description || "—" }}</v-row>
          </v-col>
          <v-col class="pl-6" cols="6">
            <v-row class="subheader">STATUS</v-row>
            <v-row>{{ project.status }}</v-row>
          </v-col>
        </v-row>
        <v-row class="mb-2" align="center">
          <v-col class="pl-6" cols="6">
            <v-row class="mt-3 subheader">START DATE</v-row>
            <v-row>{{
              project.startDate
                ? new Date(project.startDate).toLocaleDateString(undefined, {
                    timeZone: "UTC",
                  })
                : "—"
            }}</v-row>
          </v-col>
          <v-col class="pl-6" cols="6">
            <v-row class="subheader">END DATE</v-row>
            <v-row>{{
              project.endDate
                ? new Date(project.endDate).toLocaleDateString(undefined, {
                    timeZone: "UTC",
                  })
                : "—"
            }}</v-row>
          </v-col>
        </v-row>
        <v-row class="mb-2" align="center">
          <v-col class="pl-6" cols="12">
            <v-row class="mt-3 subheader">REPOS</v-row>
            <div class="d-flex flex-wrap gap-2 mt-10">
              <Repo v-for="repo in repos" :repo="repo" />
            </div>
          </v-col>
        </v-row>
        <v-row class="mb-2" justify="space-between" align="center">
          <v-col cols="auto" class="d-flex ga-2">
            <button @click.stop="openEdit(project)" class="editButtonStyle">
              Edit
            </button>

            <button
              @click.stop="deleteProject(project.id, project.name)"
              class="deleteButtonStyle"
            >
              Delete
            </button>
          </v-col>
          <v-col
            v-if="$parent.user && $parent.user.role !== 'member'"
            cols="auto"
          >
            <v-btn color="primary" @click.stop="emit()"> View Workspace </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-expand-transition>
  </v-card>

  <v-dialog v-model="isEdit" max-width="550">
    <v-card class="rounded-xl pa-2">
      <v-card-title
        class="d-flex justify-space-between align-center px-4 pt-4 pb-2"
      >
        <span class="text-h6 font-weight-bold">Edit Project</span>
        <v-btn icon variant="text" @click="closeEdit()">
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
          bg-color="grey-lighten-4"
          class="mb-1"
          hide-details
        >
        </v-text-field>

        <div class="form-label mt-3">DESCRIPTION</div>
        <v-textarea
          v-model="newProject.description"
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
          v-model="newProject.status"
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
              v-model="newProject.startDate"
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
              v-model="newProject.endDate"
              type="date"
              :min="newProject.startDate || undefined"
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
              <div class="form-label">GITHUB REPOSITORY URL(S)</div>

              <v-text-field
                v-for="repo in repos"
                v-model="repo.repoUrl"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                bg-color="grey-lighten-4"
                hide-details
                append-icon="mdi-trash-can"
                @click:append="deleteRepo(repo, project.id)"
              ></v-text-field>

              <div class="mt-2" v-if="isAddRepo">
                <v-text-field
                  v-model="newRepoInput"
                  placeholder="https://github.com/owner/repositoryName"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  bg-color="grey-lighten-4"
                  append-icon="mdi-cancel"
                  @click:append="toggleIsAddRepo()"
                  hide-details
                >
                </v-text-field>
              </div>

              <v-icon
                v-else
                class="mt-3"
                size="small"
                icon="mdi-plus-circle-outline"
                @click="toggleIsAddRepo()"
              ></v-icon>
            </v-col>
          </v-row>
        </v-row>

        <div v-if="repos.length > 0 || isAddRepo" class="form-label mt-3">
          TEAM'S PERSONAL ACCESS TOKEN
        </div>
        <v-text-field
          v-if="repos.length > 0 || isAddRepo"
          v-model="newRepoTokenInput"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          placeholder="github_pat_XXX..."
          bg-color="grey-lighten-4"
          class="mb-1"
          hide-details
        ></v-text-field>

        <v-row class="mt-2">
          <v-col cols="12" class="pl-3">
            <div class="form-label d-flex justify-space-between align-center">
              <span>MEMBERS</span>
              <span
                v-if="editingMembers.length"
                class="text-caption text-grey-darken-1"
              >
                {{ editingMembers.length }} member{{
                  editingMembers.length > 1 ? "s" : ""
                }}
              </span>
            </div>

            <div
              v-for="(m, i) in editingMembers"
              :key="m.user.id"
              class="d-flex align-center mb-2 pa-2 rounded-lg mt-2"
              style="background: #f5f5f5"
            >
              <div class="member-avatar mr-3">
                {{ getInitials(m.user) }}
              </div>
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
              />
              <v-btn
                icon
                variant="text"
                size="small"
                @click="removeEditMember(i)"
              >
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

            <v-card
              v-if="filteredEditUsers.length"
              class="mt-1 rounded-lg"
              elevation="3"
            >
              <v-list density="compact">
                <v-list-item
                  v-for="u in filteredEditUsers"
                  :key="u.id"
                  @click="addEditMember(u)"
                  style="cursor: pointer"
                >
                  <template #prepend>
                    <div class="member-avatar mr-3">
                      {{ getInitials(u) }}
                    </div>
                  </template>
                  <v-list-item-title
                    >{{ u.firstName }} {{ u.lastName }}</v-list-item-title
                  >
                  <v-list-item-subtitle>{{ u.email }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="px-4 pb-4 justify-end">
        <v-btn variant="text" @click="closeEdit()">Cancel</v-btn>
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
