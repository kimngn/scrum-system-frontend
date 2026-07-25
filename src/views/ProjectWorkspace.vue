<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProjectServices from "../services/ProjectServices.js";
import ProjectMembershipServices from "../services/ProjectMembershipServices.js";
import RepoServices from "../services/RepoServices.js";
import SprintServices from "../services/SprintServices.js";

const route = useRoute();
const router = useRouter();
const projectId = route.params.id;

const project = ref(null);
const members = ref([]);
const repos = ref([]);
const sprints = ref([]);
const tab = ref("Summary");
const newRepoUrl = ref("");

const editDialog = ref(false);
const editingProject = ref({
  id: null,
  name: "",
  description: "",
  status: "active",
  startDate: null,
  endDate: null,
});

const projectInitials = computed(() => {
  if (!project.value?.name) return "P";
  return project.value.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
});

function getInitials(u) {
  return (u.firstName[0] + u.lastName[0]).toUpperCase();
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : "—";
}

function openEdit() {
  editingProject.value = {
    id: project.value.id,
    name: project.value.name,
    description: project.value.description,
    status: project.value.status,
    startDate: project.value.startDate
      ? project.value.startDate.split("T")[0]
      : null,
    endDate: project.value.endDate
      ? project.value.endDate.split("T")[0]
      : null,
  };
  editDialog.value = true;
}

async function saveProject() {
  try {
    await ProjectServices.updateProject(editingProject.value.id, {
      name: editingProject.value.name,
      description: editingProject.value.description,
      status: editingProject.value.status,
      startDate: editingProject.value.startDate,
      endDate: editingProject.value.endDate,
    });

    editDialog.value = false;
    await loadProject();
  } catch (error) {
    console.error(error);
  }
}

async function addRepo() {
  if (!newRepoUrl.value) return;
  const match = newRepoUrl.value.match(
    /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/,
  );
  if (!match) {
    console.error("Invalid GitHub URL format");
    return;
  }
  const repoName = newRepoUrl.value.split("/").pop();
  try {
    await RepoServices.addRepo({
      name: repoName,
      repoUrl: newRepoUrl.value,
      projectId,
    });
    newRepoUrl.value = "";
    await loadRepos();
  } catch (error) {
    console.error(error);
  }
}

async function deleteRepo(repoId) {
  try {
    await RepoServices.deleteRepo(repoId);
    await loadRepos();
  } catch (error) {
    console.error(error);
  }
}

async function updateRepo(repo) {
  const match = repo.repoUrl.match(
    /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/,
  );
  if (!match) {
    console.error("Invalid GitHub URL format");
    await loadRepos();
    return;
  }
  const name = repo.repoUrl.split("/").pop();
  try {
    await RepoServices.updateRepo(repo.id, {
      name,
      repoUrl: repo.repoUrl,
      projectId,
    });
  } catch (error) {
    console.error(error);
    await loadRepos();
  }
}

async function loadProject() {
  const res = await ProjectServices.getProject(projectId);
  const data = Array.isArray(res.data) ? res.data[0] : res.data;
  project.value = data;
}

async function loadMembers() {
  const res = await ProjectMembershipServices.getMembershipsByProjectId(
    projectId,
  );
  members.value = Array.isArray(res.data) ? res.data : [];
}

async function loadRepos() {
  const res = await RepoServices.getReposByProjectId(projectId);
  repos.value = Array.isArray(res.data) ? res.data : [];
}

async function loadSprints() {
  const res = await SprintServices.getSprintsByProjectId(projectId);
  sprints.value = Array.isArray(res.data) ? res.data : [];
}

onMounted(async () => {
  await Promise.all([loadProject(), loadMembers(), loadRepos(), loadSprints()]);
});
</script>

<template>
  <v-container>
    <v-btn
      variant="text"
      prepend-icon="mdi-arrow-left"
      @click="router.go(-1)"
      class="mb-4"
    >
      Back
    </v-btn>

    <v-card v-if="project" class="rounded-lg elevation-5 pa-6 mb-6">
      <div class="d-flex justify-space-between align-start flex-wrap">
        <div>
          <div class="subheader mb-1">PROJECTS</div>
          <div class="d-flex align-center" style="gap: 12px">
            <v-avatar
              color="primary"
              size="48"
              class="font-weight-bold"
            >
              {{ projectInitials }}
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ project.name }}</div>
              <div class="text-body-1 text-grey-darken-1">
                {{ project.description || "—" }}
              </div>
            </div>
          </div>
          <div class="mt-2 text-body-2 text-grey-darken-1">
            <span class="subheader">START</span>
            {{ formatDate(project.startDate) }}
            &nbsp;|&nbsp;
            <span class="subheader">END</span>
            {{ formatDate(project.endDate) }}
          </div>
        </div>
        <div class="d-flex mt-2" style="gap: 8px">
          <v-btn variant="outlined" @click="openEdit">Edit Project</v-btn>
        </div>
      </div>

      <v-tabs v-model="tab" color="primary" class="mt-4">
        <v-tab value="Summary">Summary</v-tab>
        <v-tab value="Sprints">Sprints</v-tab>
        <v-tab value="Team">Teams</v-tab>
        <v-tab value="Repositories">Repositories</v-tab>
        <v-tab value="Activity">Activity</v-tab>
      </v-tabs>
    </v-card>

    <v-window v-model="tab" v-if="project">
      <v-window-item value="Summary">
        <v-row>
          <v-col cols="12" md="4">
            <v-card class="rounded-lg elevation-5 pa-4">
              <div class="subheader">
                TEAMS
              </div>
              <div class="text-h4 font-weight-bold">—</div>
              <div class="text-body-2 text-grey-darken-1">
                working on this project
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="rounded-lg elevation-5 pa-4">
              <div class="subheader">
                TOTAL MEMBERS
              </div>
              <div class="text-h4 font-weight-bold">{{ members.length }}</div>
              <div class="text-body-2 text-grey-darken-1">
                across all teams
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="rounded-lg elevation-5 pa-4">
              <div class="subheader">
                REPOSITORIES
              </div>
              <div class="text-h4 font-weight-bold">{{ repos.length }}</div>
              <div class="text-body-2 text-grey-darken-1">
                {{ repos.map((r) => r.name).slice(0, 3).join(", ") || "—" }}
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-card class="rounded-lg elevation-5 pa-4 mt-4">
          <div class="subheader mb-4">
            MEMBERS
          </div>
          <v-row>
            <v-col v-for="m in members" :key="m.id" cols="12" md="6">
              <v-card class="pa-4 rounded-lg elevation-5 d-flex align-center">
                <v-avatar
                  :color="m.role === 'lead' ? 'primary' : 'grey'"
                  class="font-weight-bold mr-4"
                >
                  {{ getInitials(m.user) }}
                </v-avatar>
                <div>
                  <div class="font-weight-bold">
                    {{ m.user.firstName }} {{ m.user.lastName }}
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    {{ m.user.email }} · {{ m.role }}
                  </div>
                </div>
              </v-card>
            </v-col>
            <v-col v-if="members.length === 0" cols="12">
              <v-alert type="info" variant="tonal"
                >No members assigned yet.</v-alert
              >
            </v-col>
          </v-row>
        </v-card>
      </v-window-item>

      <v-window-item value="Sprints">
        <v-card class="rounded-lg elevation-5 pa-4">
          <div v-if="sprints.length">
            <v-list>
              <v-list-item v-for="s in sprints" :key="s.id">
                <v-list-item-title>
                  {{ s.name || `Sprint ${s.id}` }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDate(s.startDate) }} – {{ formatDate(s.endDate) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
          <v-alert v-else type="info" variant="tonal">
            No sprints yet. Sprint creation will be handled in a separate
            ticket.
          </v-alert>
        </v-card>
      </v-window-item>

      <v-window-item value="Team">
        <v-card class="rounded-lg elevation-5 pa-4">
          <v-list>
            <v-list-item v-for="m in members" :key="m.id">
              <template #prepend>
                <v-avatar
                  :color="m.role === 'lead' ? 'primary' : 'grey'"
                  class="font-weight-bold"
                >
                  {{ getInitials(m.user) }}
                </v-avatar>
              </template>
              <v-list-item-title
                >{{ m.user.firstName }} {{ m.user.lastName }}</v-list-item-title
              >
              <v-list-item-subtitle
                >{{ m.user.email }} · {{ m.role }}</v-list-item-subtitle
              >
            </v-list-item>
            <v-list-item v-if="members.length === 0">
              <v-list-item-title>No members assigned yet.</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-window-item>

      <v-window-item value="Repositories">
        <v-card class="rounded-lg elevation-5 pa-4">
          <div class="subheader mb-4">LINKED REPOSITORIES</div>

          <div v-for="r in repos" :key="r.id" class="mb-3">
            <v-text-field
              v-model="r.repoUrl"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              append-icon="mdi-delete"
              @blur="updateRepo(r)"
              @keyup.enter="updateRepo(r)"
              @click:append="deleteRepo(r.id)"
            ></v-text-field>
          </div>

          <div
            v-if="repos.length === 0"
            class="text-body-2 text-grey-darken-1 mb-4"
          >
            No repositories connected.
          </div>

          <v-row align="center" no-gutters>
            <v-col cols="auto">
              <v-btn
                icon="mdi-plus"
                variant="outlined"
                color="primary"
                @click="addRepo"
              ></v-btn>
            </v-col>
            <v-col class="pl-3">
              <v-text-field
                v-model="newRepoUrl"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                placeholder="https://github.com/org/repo"
                hide-details
                @keyup.enter="addRepo"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card>
      </v-window-item>

      <v-window-item value="Activity">
        <v-alert type="info" variant="tonal"
          >Activity feed will be handled in a separate ticket.</v-alert
        >
      </v-window-item>
    </v-window>

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
        <div class="subheader mb-1">PROJECT NAME</div>
        <v-text-field
          v-model="editingProject.name"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          bg-color="grey-lighten-4"
          class="mb-1"
          hide-details
        ></v-text-field>

        <div class="subheader mt-3 mb-1">DESCRIPTION</div>
        <v-textarea
          v-model="editingProject.description"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          bg-color="grey-lighten-4"
          rows="3"
          class="mb-1"
          hide-details
        ></v-textarea>

        <div class="subheader mt-3 mb-1">STATUS</div>
        <v-select
          v-model="editingProject.status"
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
            <div class="subheader mb-1">START DATE</div>
            <v-text-field
              v-model="editingProject.startDate"
              type="date"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              bg-color="grey-lighten-4"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="6" class="pl-2">
            <div class="subheader mb-1">END DATE</div>
            <v-text-field
              v-model="editingProject.endDate"
              type="date"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              bg-color="grey-lighten-4"
              hide-details
            ></v-text-field>
          </v-col>
        </v-row>

      </v-card-text>

      <v-card-actions class="px-4 pb-4 justify-end">
        <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="rounded-lg px-6"
          @click="saveProject"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  </v-container>
</template>

