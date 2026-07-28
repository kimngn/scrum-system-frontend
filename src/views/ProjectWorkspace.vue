<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProjectServices from "../services/ProjectServices.js";
import ProjectMembershipServices from "../services/ProjectMembershipServices.js";
import UserServices from "../services/UserServices.js";
import RepoServices from "../services/RepoServices.js";
import SprintServices from "../services/SprintServices.js";
import TeamServices from "../services/TeamServices.js";

const route = useRoute();
const router = useRouter();
const projectId = route.params.id;

const project = ref(null);
const members = ref([]);
const repos = ref([]);
const sprints = ref([]);
const sprintDialog = ref(false);
const sprintFormError = ref("");
const sprintForm = ref({
  id: null,
  name: "",
  startDate: null,
  endDate: null,
  status: "planned",
});
const today = new Date().toISOString().split("T")[0];
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
const editingMembers = ref([]);
const removedMembershipIds = ref([]);
const editMemberSearch = ref("");
const allUsers = ref([]);

const filteredEditUsers = computed(() => {
  if (!editMemberSearch.value) return [];
  const q = editMemberSearch.value.toLowerCase();
  const currentIds = editingMembers.value.map((m) => m.user.id);
  return allUsers.value.filter(
    (u) =>
      u.role !== "admin" &&
      !currentIds.includes(u.id) &&
      (u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q))
  );
});

function addEditMember(u) {
  editingMembers.value.push({ user: u, role: "member", isNew: true });
  editMemberSearch.value = "";
}

function removeEditMember(i) {
  const m = editingMembers.value[i];
  if (m.id) removedMembershipIds.value.push(m.id);
  editingMembers.value.splice(i, 1);
}

// --- Team state ---
const teams = ref([]);
const expandedTeamId = ref(null);
const teamDialog = ref(false);
const teamDialogMode = ref("create");
const memberSearch = ref("");
const teamForm = ref({ id: null, name: "", description: "", members: [] });

const filteredProjectMembers = computed(() => {
  if (!memberSearch.value) return [];
  const q = memberSearch.value.toLowerCase();
  return members.value.filter(
    (m) =>
      !teamForm.value.members.includes(m.userId) &&
      (m.user.firstName.toLowerCase().includes(q) ||
        m.user.lastName.toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q))
  );
});

const selectedTeamMemberDetails = computed(() =>
  teamForm.value.members
    .map((uid) => members.value.find((m) => m.userId === uid))
    .filter(Boolean)
);

function addTeamMember(m) {
  teamForm.value.members.push(m.userId);
  memberSearch.value = "";
}

function removeTeamMember(userId) {
  const idx = teamForm.value.members.indexOf(userId);
  if (idx !== -1) teamForm.value.members.splice(idx, 1);
}

function getInitialsFromUser(u) {
  return (u.firstName[0] + u.lastName[0]).toUpperCase();
}

async function loadTeams() {
  const res = await TeamServices.getTeamsByProjectId(projectId);
  teams.value = Array.isArray(res.data) ? res.data : [];
}

function toggleExpandTeam(teamId) {
  expandedTeamId.value = expandedTeamId.value === teamId ? null : teamId;
}

function openNewTeamDialog() {
  teamDialogMode.value = "create";
  teamForm.value = { id: null, name: "", description: "", members: [] };
  memberSearch.value = "";
  teamDialog.value = true;
}

function openEditTeamDialog(team) {
  teamDialogMode.value = "edit";
  teamForm.value = {
    id: team.id,
    name: team.name,
    description: team.description || "",
    members: team.member.map((m) => m.userId),
  };
  memberSearch.value = "";
  teamDialog.value = true;
}

async function saveTeam() {
  if (!teamForm.value.name) return;
  try {
    if (teamDialogMode.value === "create") {
      await TeamServices.createTeam({
        name: teamForm.value.name,
        description: teamForm.value.description || null,
        projectId,
        members: teamForm.value.members,
      });
    } else {
      await TeamServices.updateTeam(teamForm.value.id, {
        name: teamForm.value.name,
        description: teamForm.value.description || null,
      });
      const existing = teams.value.find((t) => t.id === teamForm.value.id);
      const existingIds = existing?.member?.map((m) => m.userId) || [];
      const toAdd = teamForm.value.members.filter((id) => !existingIds.includes(id));
      const toRemove = existing?.member?.filter((m) => !teamForm.value.members.includes(m.userId)) || [];
      await Promise.all(toAdd.map((uid) => TeamServices.addMember({ teamId: teamForm.value.id, userId: uid })));
      await Promise.all(toRemove.map((m) => TeamServices.removeMember(m.id)));
    }
    teamDialog.value = false;
    await loadTeams();
  } catch (err) {
    console.error(err);
  }
}

async function deleteTeam(teamId) {
  if (!window.confirm("Are you sure you want to delete this team?")) return;
  try {
    await TeamServices.deleteTeam(teamId);
    if (expandedTeamId.value === teamId) {
      expandedTeamId.value = null;
    }
    await loadTeams();
  } catch (err) {
    console.error(err);
  }
}
// --- End team ---

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
  return date
    ? new Date(date).toLocaleDateString(undefined, { timeZone: "UTC" })
    : "—";
}

async function openEdit() {
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
  try {
    const res = await ProjectMembershipServices.getMembershipsByProjectId(project.value.id);
    editingMembers.value = (Array.isArray(res.data) ? res.data : []).map((m) => ({
      id: m.id,
      user: m.user,
      role: m.role,
      isNew: false,
    }));
  } catch {
    editingMembers.value = [];
  }
  if (allUsers.value.length === 0) {
    try {
      const res = await UserServices.getAllUsers();
      allUsers.value = res.data;
    } catch {}
  }
  removedMembershipIds.value = [];
  editMemberSearch.value = "";
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
    for (const id of removedMembershipIds.value) {
      await ProjectMembershipServices.deleteMembership(id);
    }
    for (const m of editingMembers.value.filter((m) => m.isNew)) {
      await ProjectMembershipServices.addMembership({
        userId: m.user.id,
        projectId: editingProject.value.id,
        role: m.role,
      });
    }
    editDialog.value = false;
    await loadProject();
    await loadMembers();
    await loadTeams();
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

  const todayStr = new Date().toISOString().split("T")[0];
  if (
    data &&
    data.endDate &&
    data.status !== "completed" &&
    data.endDate.split("T")[0] < todayStr
  ) {
    await ProjectServices.updateProject(data.id, { status: "completed" });
    const res2 = await ProjectServices.getProject(projectId);
    project.value = Array.isArray(res2.data) ? res2.data[0] : res2.data;
  } else {
    project.value = data;
  }
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
  const data = Array.isArray(res.data) ? res.data : [];

  const todayStr = new Date().toISOString().split("T")[0];
  const expired = [];
  for (const s of data) {
    const endDate = s.endDate ? s.endDate.split("T")[0] : "";
    if (s.status !== "completed" && endDate < todayStr) {
      expired.push(s);
    }
  }

  for (const s of expired) {
    await SprintServices.updateSprint(s.id, { status: "completed" });
  }

  if (expired.length > 0) {
    const res2 = await SprintServices.getSprintsByProjectId(projectId);
    sprints.value = Array.isArray(res2.data) ? res2.data : [];
  } else {
    sprints.value = data;
  }
}

function sprintStatusColor(status) {
  if (status === "active") return "success";
  if (status === "completed") return "grey";
  return "warning";
}

function sprintStatusLabel(status) {
  if (status === "active") return "Active";
  if (status === "completed") return "Completed";
  return "Planned";
}

const sprintStatusError = ref("");

function openSprintDialog(sprint) {
  if (sprint) {
    sprintForm.value = {
      id: sprint.id,
      name: sprint.name,
      startDate: sprint.startDate ? sprint.startDate.split("T")[0] : null,
      endDate: sprint.endDate ? sprint.endDate.split("T")[0] : null,
      status: sprint.status || "planned",
    };
  } else {
    sprintForm.value = {
      id: null,
      name: "",
      startDate: null,
      endDate: null,
      status: "planned",
    };
  }
  sprintFormError.value = "";
  sprintDialog.value = true;
}

async function saveSprint() {
  const start = sprintForm.value.startDate;
  const end = sprintForm.value.endDate;
  const name = sprintForm.value.name || "";

  if (name.trim() === "") {
    sprintFormError.value = "Sprint name cannot be empty.";
    return;
  }

  if (end < start) {
    window.alert("End date must be on or after the start date.");
    return;
  }

  if (!sprintForm.value.id && (start < today || end < today)) {
    window.alert("New sprints cannot be created with past dates.");
    return;
  }

  const payload = {
    name: sprintForm.value.name,
    startDate: sprintForm.value.startDate,
    endDate: sprintForm.value.endDate,
    projectId: projectId,
  };

  if (sprintForm.value.id) {
    payload.status = sprintForm.value.status;
  }

  sprintFormError.value = "";
  try {
    if (sprintForm.value.id) {
      await SprintServices.updateSprint(sprintForm.value.id, payload);
    } else {
      await SprintServices.addSprint(payload);
    }
    sprintDialog.value = false;
    await loadSprints();
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      sprintFormError.value = error.response.data.message;
    } else {
      sprintFormError.value = "Failed to save sprint.";
    }
  }
}

async function deleteSprint(id) {
  if (!window.confirm("Are you sure you want to delete this sprint?")) return;
  try {
    await SprintServices.deleteSprint(id);
    await loadSprints();
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      sprintStatusError.value = error.response.data.message;
    } else {
      sprintStatusError.value = "Failed to delete sprint.";
    }
  }
}

onMounted(async () => {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  if (!currentUser || currentUser.role === "member") {
    router.push({ name: "projects" });
    return;
  }
  await Promise.all([loadProject(), loadMembers(), loadRepos(), loadSprints(), loadTeams()]);
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
        <v-tab value="User Stories">User Stories</v-tab>
        <v-tab value="Acceptance Criteria">Acceptance Criteria</v-tab>
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
              <div class="text-h4 font-weight-bold">{{ teams.length }}</div>
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
        <div class="d-flex justify-end mb-4">
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="openSprintDialog()"
          >
            Add Sprint
          </v-btn>
        </div>

        <v-row>
          <v-col v-for="s in sprints" :key="s.id" cols="12" md="6" lg="4">
            <v-card class="rounded-lg elevation-2 pa-4">
              <div class="d-flex justify-space-between align-start">
                <div>
                  <div class="text-h6 font-weight-bold">
                    {{ s.name || `Sprint ${s.id}` }}
                  </div>
                  <v-chip
                    size="small"
                    :color="sprintStatusColor(s.status)"
                    class="mt-2 mb-2"
                  >
                    {{ sprintStatusLabel(s.status) }}
                  </v-chip>
                  <div class="text-body-2 text-grey-darken-1">
                    {{ formatDate(s.startDate) }} – {{ formatDate(s.endDate) }}
                  </div>
                </div>
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                      v-bind="props"
                    ></v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="openSprintDialog(s)">
                      <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      v-if="s.status !== 'active'"
                      @click="deleteSprint(s.id)"
                    >
                      <v-list-item-title class="text-error">
                        Delete
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-alert
          v-if="sprintStatusError"
          type="error"
          variant="tonal"
          class="mt-4"
          closable
          @click:close="sprintStatusError = ''"
        >
          {{ sprintStatusError }}
        </v-alert>

        <v-alert
          v-if="sprints.length === 0"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          No sprints yet.
        </v-alert>
      </v-window-item>

      <v-window-item value="Team">
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <div class="text-h6 font-weight-bold">Teams on this project</div>
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewTeamDialog">New Team</v-btn>
        </div>

        <v-alert v-if="teams.length === 0" type="info" variant="tonal">No teams yet.</v-alert>

        <v-card v-for="team in teams" :key="team.id" class="rounded-lg elevation-2 mb-3" @click="toggleExpandTeam(team.id)" style="cursor: pointer">
          <div class="d-flex align-center pa-4">
            <v-avatar color="secondary" size="40" class="mr-4">
              <v-icon>mdi-account-group</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="font-weight-bold">{{ team.name }}</div>
              <div class="text-caption text-grey-darken-1">{{ team.description || "No description" }}</div>
            </div>
          </div>

          <v-expand-transition>
            <div v-show="expandedTeamId === team.id">
              <v-divider />
              <div v-if="(team.member || []).length === 0" class="px-4 py-3 text-body-2 text-grey-darken-1">
                No members in this team.
              </div>
              <div
                v-for="m in (team.member || [])"
                :key="m.id"
                class="d-flex align-center px-4 py-3"
              >
                <v-avatar color="primary" size="36" class="font-weight-bold mr-3">
                  {{ getInitialsFromUser(m.user) }}
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="font-weight-bold">{{ m.user.firstName }} {{ m.user.lastName }}</div>
                  <div class="text-caption text-grey-darken-1">{{ m.user.email }}</div>
                </div>
                <v-chip size="small" variant="tonal">Team Member</v-chip>
              </div>
              <div class="d-flex ga-2 px-4 pb-4">
                <button @click.stop="openEditTeamDialog(team)" class="editButtonStyle">Edit</button>
                <button @click.stop="deleteTeam(team.id)" class="deleteButtonStyle">Delete</button>
              </div>
            </div>
          </v-expand-transition>
        </v-card>
      </v-window-item>

      <v-window-item value="User Stories">
      </v-window-item>

      <v-window-item value="Acceptance Criteria">
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

        <div class="subheader mt-4 mb-1 d-flex justify-space-between align-center">
          <span>MEMBERS</span>
          <span v-if="editingMembers.length" class="text-caption text-grey-darken-1">
            {{ editingMembers.length }} member{{ editingMembers.length > 1 ? "s" : "" }}
          </span>
        </div>

        <div
          v-for="(m, i) in editingMembers"
          :key="m.user.id"
          class="d-flex align-center mb-2 pa-2 rounded-lg"
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
            style="max-width: 130px"
            class="mr-2"
          />
          <v-btn icon variant="text" size="small" @click="removeEditMember(i)">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-text-field
          v-model="editMemberSearch"
          placeholder="Search to add members..."
          variant="outlined"
          density="comfortable"
          rounded="lg"
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

  <v-dialog v-model="sprintDialog" max-width="550">
    <v-card class="rounded-xl pa-2">
      <v-card-title
        class="d-flex justify-space-between align-center px-4 pt-4 pb-2"
      >
        <span class="text-h6 font-weight-bold">
          {{ sprintForm.id ? "Edit Sprint" : "New Sprint" }}
        </span>
        <v-btn icon variant="text" @click="sprintDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="px-4">
        <v-alert
          v-if="sprintFormError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
          closable
          @click:close="sprintFormError = ''"
        >
          {{ sprintFormError }}
        </v-alert>

        <div class="subheader mb-1">SPRINT NAME</div>
        <v-text-field
          v-model="sprintForm.name"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          bg-color="grey-lighten-4"
          class="mb-1"
          :error="sprintFormError !== '' && sprintForm.name.trim() === ''"
          hide-details
        ></v-text-field>

        <v-row class="mt-2" no-gutters>
          <v-col cols="6" class="pr-2">
            <div class="subheader mb-1">START DATE</div>
            <v-text-field
              v-model="sprintForm.startDate"
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
            <div class="subheader mb-1">END DATE</div>
            <v-text-field
              v-model="sprintForm.endDate"
              type="date"
              :min="sprintForm.startDate || today"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              bg-color="grey-lighten-4"
              hide-details
            ></v-text-field>
          </v-col>
        </v-row>

        <template v-if="sprintForm.id">
          <div class="subheader mt-3 mb-1">STATUS</div>
          <v-select
            v-model="sprintForm.status"
            :items="[
              { title: 'Planned', value: 'planned' },
              { title: 'Active', value: 'active' },
              { title: 'Completed', value: 'completed' },
            ]"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            bg-color="grey-lighten-4"
            hide-details
          ></v-select>
        </template>
      </v-card-text>

      <v-card-actions class="px-4 pb-4 justify-end">
        <v-btn variant="text" @click="sprintDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="rounded-lg px-6"
          @click="saveSprint"
        >
          {{ sprintForm.id ? "Save Changes" : "Create Sprint" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="teamDialog" max-width="520">
    <v-card class="rounded-xl pa-2">
      <v-card-title class="d-flex justify-space-between align-center px-4 pt-4 pb-2">
        <span class="text-h6 font-weight-bold">{{ teamDialogMode === "create" ? "New Team" : "Edit Team" }}</span>
        <v-btn icon variant="text" @click="teamDialog = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text class="px-4">
        <div class="subheader mb-1">TEAM NAME</div>
        <v-text-field
          v-model="teamForm.name"
          placeholder="e.g. Frontend Group"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          bg-color="grey-lighten-4"
          class="mb-1"
          hide-details
        />
        <div class="subheader mt-3 mb-1">DESCRIPTION</div>
        <v-text-field
          v-model="teamForm.description"
          placeholder="What does this team focus on?"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          bg-color="grey-lighten-4"
          class="mb-1"
          hide-details
        />
        <div class="subheader mt-3 mb-1">MEMBERS</div>

        <div
          v-for="m in selectedTeamMemberDetails"
          :key="m.userId"
          class="d-flex align-center mb-2 pa-2 rounded-lg"
          style="background: #f5f5f5"
        >
          <div class="member-avatar mr-3">{{ getInitialsFromUser(m.user) }}</div>
          <span class="flex-grow-1 text-body-2">{{ m.user.firstName }} {{ m.user.lastName }}</span>
          <v-btn icon variant="text" size="small" @click="removeTeamMember(m.userId)">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-alert
          v-if="members.length === 0"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-2"
        >
          No members assigned to this project yet. Add members to the project first.
        </v-alert>

        <v-text-field
          v-else
          v-model="memberSearch"
          placeholder="Search by name or email..."
          variant="outlined"
          density="comfortable"
          rounded="lg"
          bg-color="grey-lighten-4"
          class="mb-1"
          hide-details
        />

        <v-card v-if="filteredProjectMembers.length" class="mt-1 rounded-lg" elevation="3">
          <v-list density="compact">
            <v-list-item
              v-for="m in filteredProjectMembers"
              :key="m.id"
              @click="addTeamMember(m)"
              style="cursor: pointer"
            >
              <template #prepend>
                <div class="member-avatar mr-3">{{ getInitialsFromUser(m.user) }}</div>
              </template>
              <v-list-item-title>{{ m.user.firstName }} {{ m.user.lastName }}</v-list-item-title>
              <v-list-item-subtitle>{{ m.user.email }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-card-text>
      <v-card-actions class="px-4 pb-4 justify-end">
        <v-btn variant="text" @click="teamDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="rounded-lg px-6" @click="saveTeam">
          {{ teamDialogMode === "create" ? "Create Team" : "Save Changes" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  </v-container>
</template>

<style scoped>
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