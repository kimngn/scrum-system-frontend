<script setup>
  import { onMounted, ref, computed, watch } from "vue";
  import { useRouter } from "vue-router";
  import ProjectServices from "../services/ProjectServices.js";
  import RepoServices from "../services/RepoServices.js";
  import UserServices from "../services/UserServices.js";
  import ProjectMembershipServices from "../services/ProjectMembershipServices.js";
  import Repo from "../components/Repo.vue";

  const router = useRouter();
  const projects = ref([]);
  const user = ref(null);
  const snackbar = ref({ value: false, color: "", text: "" });
  const dialog = ref(false);
  const allUsers = ref([]);
  const selectedMembers = ref([]);
  const memberSearch = ref("");
  const project = ref({
    name: "",
    description: "",
    status: "active",
    startDate: null,
    endDate: null,
    repoUrl: "",
  });

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

  function openEdit(p) {
    editingProject.value = {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      startDate: p.startDate ? p.startDate.split("T")[0] : null,
      endDate: p.endDate ? p.endDate.split("T")[0] : null,
    };
    editDialog.value = true;
  }

  async function updateProject() {
    await ProjectServices.updateProject(
      editingProject.value.id,
      editingProject.value,
    )
      .then(() => {
        showSnackbar("green", "Project updated successfully!");
        editDialog.value = false;
      })
      .catch((error) => {
        showSnackbar(
          "error",
          error.response?.data?.message || "Failed to update project",
        );
      });
    await getProjects();
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

  async function createProject() {
    try {
      // create project and get projectId from response
      const response = await ProjectServices.addProject({
        ...project.value,
        userId: user.value.id,
      });
      const projectId = response.data.id;
      console.log("PROJECT.VALUE HAS : " + project.value.repoUrl);
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

  async function deleteProject(projectId) {
    await ProjectServices.deleteProject(projectId)
      .then(() => {
        showSnackbar("green", "Project deleted successfully!");
      })
      .catch((error) => {
        showSnackbar(
          "error",
          error.response?.data?.message || "Failed to delete project",
        );
      });
    await getProjects();
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

  function showSnackbar(color, text) {
    snackbar.value = { value: true, color, text };
  }
</script>

<template>
  <v-container>
    <div id="body">
      <v-card-title class="text-h4 font-weight-bold mb-4"
        >Projects</v-card-title
      >

      <v-btn
        v-if="user && user.role !== 'member'"
        class="mb-4"
        color="primary"
        @click="dialog = true"
        >Create Project</v-btn
      >

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
                  p.startDate ? new Date(p.startDate).toLocaleDateString() : "—"
                }}</v-row>
              </v-col>
              <v-col class="pl-6" cols="6">
                <v-row class="subheader">END DATE</v-row>
                <v-row>{{
                  p.endDate ? new Date(p.endDate).toLocaleDateString() : "—"
                }}</v-row>
              </v-col>
            </v-row>

            <v-row class="mb-2" align="center">
              <v-col class="pl-6" cols="6">
                <v-row class="mt-3 subheader">REPOS</v-row>
                <v-row>
                  <!-- todo: put repositories component here -->
                  <Repo :projectId="p.id" />
                </v-row>
              </v-col>
            </v-row>

            <v-row class="mb-2" v-if="user && user.role !== 'member'">
              <v-col cols="2">
                <button @click.stop="openEdit(p)" class="editButtonStyle">
                  Edit
                </button>
              </v-col>
              <v-col cols="2">
                <button
                  @click.stop="deleteProject(p.id)"
                  class="deleteButtonStyle"
                >
                  Delete
                </button>
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
              placeholder="org/repo-name"
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
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  bg-color="grey-lighten-4"
                  hide-details
                >
                </v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions class="px-4 pb-4 justify-end">
            <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>
            <v-btn
              style="background-color: #9b7d8c"
              variant="flat"
              class="text-white rounded-lg px-6"
              @click="updateProject"
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
