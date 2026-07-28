<template>
  <v-container fluid class="issues-page pa-0">
    <!-- Page header -->
    <div class="issues-header px-5 py-3">
      <div class="d-flex align-center ga-2">
        <span class="text-subtitle-1 font-weight-bold">
          Issues
        </span>

        <v-chip
          size="x-small"
          variant="tonal"
        >
          {{ filteredIssues.length }} Open
        </v-chip>
      </div>

      <div class="d-flex flex-wrap align-center ga-3">
        <!-- Project selector -->
        <v-select
          v-model="projectId"
          :items="userProjects"
          item-title="name"
          item-value="id"
          label="Project"
          density="compact"
          variant="outlined"
          hide-details
          style="width: 220px"
          :loading="loadingProjects"
          @update:model-value="changeProject"
        />

        <!-- Type filters -->
        <v-btn-toggle
          v-model="selectedType"
          mandatory
          density="compact"
          color="primary"
        >
          <v-btn value="All" size="small">
            All
          </v-btn>

          <v-btn value="Bug" size="small">
            Bug
          </v-btn>

          <v-btn value="Blocker" size="small">
            Blocker
          </v-btn>

          <v-btn value="Issue" size="small">
            Issue
          </v-btn>
        </v-btn-toggle>

        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          :disabled="!projectId"
          @click="openCreateDialog"
        >
          New Issue
        </v-btn>
      </div>
    </div>

    <!-- Error -->
    <v-alert
      v-if="pageError"
      type="error"
      variant="tonal"
      closable
      class="ma-4"
      @click:close="pageError = ''"
    >
      {{ pageError }}
    </v-alert>

    <!-- Main content -->
    <div class="issues-content pa-5">
      <v-progress-linear
        v-if="loadingIssues"
        indeterminate
        class="mb-4"
      />

      <div
        v-if="!loadingIssues && filteredIssues.length === 0"
        class="text-center text-grey py-12"
      >
        No issues were found.
      </div>

      <!-- Issue cards -->
      <v-card
        v-for="issue in filteredIssues"
        :key="issue.id"
        class="issue-card mb-3"
        variant="outlined"
      >
        <div class="d-flex align-center pa-4">
          <!-- Type icon -->
          <div class="issue-icon mr-4">
            <v-icon
              :color="typeColor(issue.type)"
              size="26"
            >
              {{ typeIcon(issue.type) }}
            </v-icon>
          </div>

          <!-- Issue information -->
          <div class="issue-main">
            <div class="d-flex align-center ga-2 mb-1">
              <span class="text-caption text-grey">
                ISS-{{ issue.id }}
              </span>

              <v-chip
                size="x-small"
                :color="typeColor(issue.type)"
                variant="outlined"
              >
                {{ issue.type || "Issue" }}
              </v-chip>
            </div>

            <div class="font-weight-medium issue-title">
              {{ issue.title }}
            </div>

            <div class="text-caption text-grey mt-1">
              {{ selectedProjectName }}
              <span v-if="issue.createdAt">
                · {{ formatDate(issue.createdAt) }}
              </span>
            </div>
          </div>

          <!-- Priority -->
          <div class="issue-field">
            <v-chip
              size="small"
              :color="priorityColor(issue.priority)"
              variant="outlined"
            >
              <v-icon
                start
                size="14"
              >
                mdi-arrow-up
              </v-icon>

              {{ issue.priority || "None" }}
            </v-chip>
          </div>

          <!-- Status -->
          <div class="issue-field">
            <v-chip
              size="small"
              :color="statusColor(getStoryStatus(issue))"
              variant="tonal"
            >
              <v-icon
                start
                size="10"
              >
                mdi-circle
              </v-icon>

              {{ getStoryStatus(issue) }}
            </v-chip>
          </div>

          <!-- Assignees -->
          <div class="issue-assignees">
            <v-avatar
              v-for="assignment in validAssignees(issue)"
              :key="assignment.id"
              size="28"
              color="teal"
              class="ml-n1"
            >
              <span class="text-caption text-white">
                {{ getInitials(assignment.user) }}
              </span>

              <v-tooltip activator="parent">
                {{ getUserName(assignment.user) }}
              </v-tooltip>
            </v-avatar>

            <span
              v-if="validAssignees(issue).length === 0"
              class="text-caption text-grey"
            >
              Unassigned
            </span>
          </div>

          <!-- Delete -->
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            size="small"
            color="grey"
            @click="confirmDelete(issue)"
          />
        </div>
      </v-card>
    </div>

    <!-- Create Issue Dialog -->
    <v-dialog
      v-model="createDialog"
      max-width="650"
      persistent
    >
      <v-card rounded="lg">
        <v-card-title
          class="d-flex justify-space-between align-center px-6 py-4"
        >
          <div>
            <div class="text-h6 font-weight-bold">
              Create Issue
            </div>

            <div class="text-caption text-grey">
              Project: {{ selectedProjectName }}
            </div>
          </div>

          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            :disabled="creatingIssue"
            @click="closeCreateDialog"
          />
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 pt-5">
          <v-form
            ref="issueFormRef"
            @submit.prevent="createIssue"
          >
            <v-text-field
              v-model="newIssue.title"
              label="Title"
              placeholder="Describe the problem..."
              variant="outlined"
              :rules="titleRules"
              autofocus
              class="mb-2"
            />

            <v-textarea
              v-model="newIssue.description"
              label="Description"
              placeholder="Provide more information about the issue..."
              variant="outlined"
              rows="3"
              auto-grow
              class="mb-2"
            />

            <v-row>
              <v-col cols="12" md="4">
                <v-select
                  v-model="newIssue.type"
                  :items="issueTypes"
                  label="Type"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="newIssue.priority"
                  :items="priorities"
                  label="Priority"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="newIssue.storyPoint"
                  :items="storyPointOptions"
                  label="Story Points"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <v-select
              v-model="newIssue.assigneeIds"
              :items="projectMembers"
              item-title="fullName"
              item-value="id"
              label="Assignees"
              variant="outlined"
              :loading="loadingMembers"
              multiple
              chips
              closable-chips
              clearable
            />

            <v-alert
              v-if="createError"
              type="error"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              {{ createError }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-end px-6 py-4">
          <v-btn
            variant="outlined"
            :disabled="creatingIssue"
            @click="closeCreateDialog"
          >
            Cancel
          </v-btn>

          <v-btn
            color="primary"
            :loading="creatingIssue"
            @click="createIssue"
          >
            Create Issue
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation -->
    <v-dialog
      v-model="deleteDialog"
      max-width="420"
    >
      <v-card>
        <v-card-title>
          Delete Issue
        </v-card-title>

        <v-card-text>
          Are you sure you want to delete
          <strong>{{ issueToDelete?.title }}</strong>?
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>

          <v-btn
            color="error"
            :loading="deletingIssue"
            @click="deleteIssue"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref,
} from "vue";

import StoryboardServices from "../services/StoryboardServices.js";
import StoryAssigneeServices from "../services/StoryAssigneeServices.js";
import ProjectServices from "../services/ProjectServices.js";
// import ProjectMembershipService from "../services/ProjectMembershipService.js";

/*
 * Replace this with the exact user-loading code from StoryBoard.vue
 * when your storage key is different.
 */
const storedUser =
  localStorage.getItem("user") ||
  sessionStorage.getItem("user");

const user = ref(
  storedUser
    ? JSON.parse(storedUser)
    : null,
);

// Projects
const userProjects = ref([]);
const projectId = ref(null);
const projectMembers = ref([]);

// Issues
const issues = ref([]);
const selectedType = ref("All");

// Loading
const loadingProjects = ref(false);
const loadingIssues = ref(false);
const loadingMembers = ref(false);
const creatingIssue = ref(false);
const deletingIssue = ref(false);

// Errors
const pageError = ref("");
const createError = ref("");

// Dialogs
const createDialog = ref(false);
const deleteDialog = ref(false);
const issueFormRef = ref(null);
const issueToDelete = ref(null);

const issueTypes = [
  "Bug",
  "Blocker",
  "Issue",
];

const priorities = [
  "Critical",
  "High",
  "Medium",
  "Low",
];

const storyPointOptions = [
  1,
  2,
  3,
  5,
  8,
  13,
];

const titleRules = [
  (value) =>
    Boolean(value?.trim()) || "Title is required",
];

function defaultIssue() {
  return {
    title: "",
    description: "",
    type: "Issue",
    priority: "Medium",
    storyPoint: 3,
    assigneeIds: [],
  };
}

const newIssue = ref(defaultIssue());

const selectedProjectName = computed(() => {
  const project = userProjects.value.find(
    (item) => item.id === projectId.value,
  );

  return (
    project?.name ||
    project?.title ||
    "Unknown Project"
  );
});

const filteredIssues = computed(() => {
  if (selectedType.value === "All") {
    return issues.value;
  }

  return issues.value.filter(
    (issue) => issue.type === selectedType.value,
  );
});

async function retrieveUserProjects() {
  if (!user.value?.id) {
    throw new Error("The logged-in user could not be found.");
  }

  try {
    loadingProjects.value = true;

    const response =
      await ProjectServices.getProjectsByUserId(
        user.value.id,
      );

    userProjects.value = Array.isArray(response.data)
      ? response.data
      : [];

    if (userProjects.value.length > 0) {
      projectId.value = userProjects.value[0].id;
    }
  } finally {
    loadingProjects.value = false;
  }
}

async function changeProject() {
  issues.value = [];
  projectMembers.value = [];
  pageError.value = "";

  await Promise.all([
    retrieveIssues(),
    retrieveProjectMembers(),
  ]);
}

async function retrieveIssues() {
  if (!projectId.value) {
    return;
  }

  try {
    loadingIssues.value = true;

    const response =
      await StoryboardServices.getStoriesForProject(
        projectId.value,
      );

    const stories = Array.isArray(response.data)
      ? response.data
      : [];

    issues.value = stories.filter((story) =>
      ["Bug", "Blocker", "Issue"].includes(story.type),
    );
  } catch (error) {
    console.error("Failed to retrieve issues:", error);

    pageError.value =
      error.response?.data?.message ||
      "The issues could not be loaded.";
  } finally {
    loadingIssues.value = false;
  }
}

async function retrieveProjectMembers() {
  if (!projectId.value) {
    return;
  }

  try {
    loadingMembers.value = true;

    const response =
      await ProjectMembershipService
        .getMembershipsByProjectId(projectId.value);

    const memberships = Array.isArray(response.data)
      ? response.data
      : [];

    projectMembers.value = memberships
      .filter((membership) => membership.user)
      .map((membership) => ({
        id: membership.userId,
        fullName: getUserName(membership.user),
      }));
  } catch (error) {
    console.error(
      "Failed to retrieve project members:",
      error,
    );

    projectMembers.value = [];
  } finally {
    loadingMembers.value = false;
  }
}

async function openCreateDialog() {
  if (!projectId.value) {
    pageError.value =
      "Select a project before creating an issue.";

    return;
  }

  newIssue.value = defaultIssue();
  createError.value = "";
  createDialog.value = true;

  await retrieveProjectMembers();
}

function closeCreateDialog() {
  if (creatingIssue.value) {
    return;
  }

  createDialog.value = false;
  createError.value = "";
  newIssue.value = defaultIssue();

  issueFormRef.value?.resetValidation();
}

async function createIssue() {
  createError.value = "";

  const validation =
    await issueFormRef.value?.validate();

  if (validation && !validation.valid) {
    return;
  }

  if (!projectId.value) {
    createError.value =
      "A project must be selected.";

    return;
  }

  try {
    creatingIssue.value = true;

    const issue = {
      title: newIssue.value.title.trim(),
      description:
        newIssue.value.description?.trim() || "",
      type: newIssue.value.type,
      priority: newIssue.value.priority,
      storyPoint:
        Number(newIssue.value.storyPoint),
      projectId: projectId.value,

      /*
       * This places new issues in Backlog.
       * Change this if Backlog has a different ID.
       */
      columnId: 1,
    };

    const response =
      await StoryboardServices.createStory(issue);

    const issueId = response.data.id;

    for (const userId of newIssue.value.assigneeIds) {
      await StoryAssigneeServices.addAssignee({
        userStoryId: issueId,
        userId,
      });
    }

    creatingIssue.value = false;
    closeCreateDialog();

    await retrieveIssues();
  } catch (error) {
    console.error("Failed to create issue:", error);

    createError.value =
      error.response?.data?.message ||
      "The issue could not be created.";
  } finally {
    creatingIssue.value = false;
  }
}

function confirmDelete(issue) {
  issueToDelete.value = issue;
  deleteDialog.value = true;
}

async function deleteIssue() {
  if (!issueToDelete.value?.id) {
    return;
  }

  try {
    deletingIssue.value = true;

    await StoryboardServices.deleteStory(
      issueToDelete.value.id,
    );

    deleteDialog.value = false;
    issueToDelete.value = null;

    await retrieveIssues();
  } catch (error) {
    console.error("Failed to delete issue:", error);

    pageError.value =
      error.response?.data?.message ||
      "The issue could not be deleted.";
  } finally {
    deletingIssue.value = false;
  }
}

function validAssignees(issue) {
  if (!Array.isArray(issue.assignee)) {
    return [];
  }

  return issue.assignee.filter(
    (assignment) => assignment.user,
  );
}

function getUserName(userData) {
  if (!userData) {
    return "";
  }

  return `${userData.firstName || ""} ${
    userData.lastName || ""
  }`.trim();
}

function getInitials(userData) {
  if (!userData) {
    return "?";
  }

  const firstInitial =
    userData.firstName?.charAt(0) || "";

  const lastInitial =
    userData.lastName?.charAt(0) || "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function getStoryStatus(issue) {
  return (
    issue.status ||
    issue.column?.title ||
    "Backlog"
  );
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function typeIcon(type) {
  switch (type) {
    case "Bug":
      return "mdi-bug";

    case "Blocker":
      return "mdi-cancel";

    case "Issue":
      return "mdi-information";

    default:
      return "mdi-alert-circle";
  }
}

function typeColor(type) {
  switch (type) {
    case "Bug":
      return "red";

    case "Blocker":
      return "orange";

    case "Issue":
      return "blue";

    default:
      return "grey";
  }
}

function priorityColor(priority) {
  switch (priority) {
    case "Critical":
      return "red";

    case "High":
      return "orange";

    case "Medium":
      return "amber";

    case "Low":
      return "grey";

    default:
      return "grey";
  }
}

function statusColor(status) {
  switch (status) {
    case "Done":
      return "green";

    case "In Progress":
      return "purple";

    case "Testing":
      return "orange";

    case "Ready for Test":
      return "blue";

    case "To Do":
      return "red";

    case "Backlog":
      return "grey";

    default:
      return "grey";
  }
}

onMounted(async () => {
  try {
    await retrieveUserProjects();

    if (!projectId.value) {
      return;
    }

    await Promise.all([
      retrieveIssues(),
      retrieveProjectMembers(),
    ]);
  } catch (error) {
    console.error("Failed to initialize Issues page:", error);

    pageError.value =
      error.response?.data?.message ||
      error.message ||
      "The Issues page could not be loaded.";
  }
});
</script>

<style scoped>
.issues-page {
  min-height: calc(100vh - 64px);
  background: #f7f8fa;
}

.issues-header {
  min-height: 64px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.issues-content {
  max-width: 1050px;
}

.issue-card {
  background: white;
  border-color: #e5e7eb;
  border-radius: 12px;
}

.issue-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.issue-main {
  flex: 1;
  min-width: 250px;
}

.issue-title {
  color: #1f2937;
}

.issue-field {
  min-width: 130px;
  display: flex;
  justify-content: center;
}

.issue-assignees {
  min-width: 90px;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 900px) {
  .issue-field,
  .issue-assignees {
    display: none;
  }

  .issues-header {
    align-items: flex-start;
  }
}
</style>