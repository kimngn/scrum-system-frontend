<template>
  <v-container fluid>
    <!-- Header -->
    <div
      class="d-flex flex-wrap justify-space-between align-center ga-4 mb-4"
    >
      <div>
        <h2 class="text-h5 font-weight-bold">
          Backlog
        </h2>

        <div class="text-grey">
          {{ filteredStories.length }} Stories
        </div>
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
          :loading="loadingProjects"
          :disabled="loadingProjects || userProjects.length === 0"
          style="width: 260px"
          @update:model-value="changeProject"
        />

        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          :disabled="!projectId"
          @click="openCreateStoryDialog"
        >
          Create Story
        </v-btn>
      </div>
    </div>

    <!-- Page error -->
    <v-alert
      v-if="pageError"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="pageError = ''"
    >
      {{ pageError }}
    </v-alert>

    <!-- No projects -->
    <v-alert
      v-if="!loadingProjects && userProjects.length === 0"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      You do not currently belong to any projects.
    </v-alert>

    <!-- Filters -->
    <v-card class="pa-4 mb-4">
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search stories..."
            density="compact"
            variant="outlined"
            hide-details
            clearable
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="selectedStatus"
            :items="statuses"
            label="Status"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Story table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredStories"
        :loading="loadingStories"
        item-value="id"
      >
        <!-- ID -->
        <template v-slot:item.id="{ item }">
          {{ item.id }}
        </template>

        <!-- Title -->
        <template v-slot:item.title="{ item }">
          <div class="font-weight-medium">
            {{ item.title }}
          </div>
        </template>

        <!-- Priority -->
        <template v-slot:item.priority="{ item }">
          <v-chip
            size="small"
            :color="priorityColor(item.priority)"
            variant="outlined"
          >
            {{ item.priority || "None" }}
          </v-chip>
        </template>

        <!-- Status -->
        <template v-slot:item.status="{ item }">
          <v-chip
            size="small"
            :color="statusColor(getStoryStatus(item))"
          >
            {{ getStoryStatus(item) }}
          </v-chip>
        </template>

        <!-- Story points -->
        <template v-slot:item.storyPoint="{ item }">
          <v-chip
            size="small"
            variant="outlined"
          >
            {{ item.storyPoint ?? "-" }}
          </v-chip>
        </template>

        <!-- Assignees -->
        <template v-slot:item.assignee="{ item }">
          <span v-if="getAssigneeNames(item)">
            {{ getAssigneeNames(item) }}
          </span>

          <span
            v-else
            class="text-grey"
          >
            Unassigned
          </span>
        </template>

        <!-- Sprint -->
        <template v-slot:item.Sprint_id="{ item }">
          {{ item.Sprint_id || "Backlog" }}
        </template>

        <template v-slot:no-data>
          <div class="pa-6 text-center text-grey">
            No user stories were found for this project.
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create Story Dialog -->
    <v-dialog
      v-model="createStoryDialog"
      max-width="650"
      persistent
    >
      <v-card rounded="lg">
        <!-- Dialog header -->
        <v-card-title
          class="d-flex justify-space-between align-center px-6 py-4"
        >
          <div>
            <div class="text-h6 font-weight-bold">
              Create User Story
            </div>

            <div class="text-caption text-grey">
              Project: {{ selectedProjectName }}
            </div>
          </div>

          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            :disabled="creatingStory"
            @click="closeCreateStoryDialog"
          />
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 pt-5">
          <v-form
            ref="createStoryFormRef"
            @submit.prevent="createStory"
          >
            <!-- Title -->
            <v-text-field
              v-model="newStory.title"
              label="Title"
              placeholder="As a user, I want to..."
              variant="outlined"
              density="comfortable"
              :rules="titleRules"
              autofocus
              class="mb-2"
            />

            <!-- Description -->
            <v-textarea
              v-model="newStory.description"
              label="Description"
              placeholder="Describe the user story..."
              variant="outlined"
              rows="3"
              auto-grow
              class="mb-2"
            />

            <v-row>
              <!-- Priority -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="newStory.priority"
                  :items="priorities"
                  label="Priority"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <!-- Story points -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="newStory.storyPoint"
                  :items="storyPointOptions"
                  label="Story Points"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <!-- Assignees -->
              <v-col cols="12" md="4">
                <v-select
                  v-model="newStory.assigneeIds"
                  :items="projectMembers"
                  item-title="fullName"
                  item-value="id"
                  label="Assignees"
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingMembers"
                  multiple
                  chips
                  closable-chips
                  clearable
                />
              </v-col>
            </v-row>

            <v-alert
              v-if="createStoryError"
              type="error"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              {{ createStoryError }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-end px-6 py-4">
          <v-btn
            variant="outlined"
            :disabled="creatingStory"
            @click="closeCreateStoryDialog"
          >
            Cancel
          </v-btn>

          <v-btn
            color="primary"
            :loading="creatingStory"
            @click="createStory"
          >
            Create Story
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
import ProjectMembershipServices from "../services/ProjectMembershipServices.js";



const user = ref(
  JSON.parse(localStorage.getItem("user"))
);

// Project state
const userProjects = ref([]);
const projectId = ref(null);
const backlogColumnId = ref(null);

// Story state
const stories = ref([]);
const projectMembers = ref([]);

// Loading state
const loadingProjects = ref(false);
const loadingStories = ref(false);
const loadingMembers = ref(false);
const creatingStory = ref(false);

// Error state
const pageError = ref("");
const createStoryError = ref("");

// Dialog state
const createStoryDialog = ref(false);
const createStoryFormRef = ref(null);

// Filters
const search = ref("");
const selectedStatus = ref("All");

const statuses = [
  "All",
  "Backlog",
  "To Do",
  "In Progress",
  "Ready for Test",
  "Testing",
  "Done",
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

const headers = [
  {
    title: "ID",
    key: "id",
  },
  {
    title: "Title",
    key: "title",
  },
  {
    title: "Priority",
    key: "priority",
  },
  {
    title: "Status",
    key: "status",
  },
  {
    title: "PTS",
    key: "storyPoint",
  },
  {
    title: "Assignee",
    key: "assignee",
    sortable: false,
  },
  {
    title: "Sprint",
    key: "Sprint_id",
  },
];

const titleRules = [
  (value) =>
    Boolean(value?.trim()) || "Title is required",
];

function getDefaultStory() {
  return {
    title: "",
    description: "",
    priority: "Medium",
    storyPoint: 3,
    assigneeIds: [],
  };
}

const newStory = ref(getDefaultStory());

const selectedProjectName = computed(() => {
  const selectedProject = userProjects.value.find(
    (project) => project.id === projectId.value,
  );

  return selectedProject?.name ||
    selectedProject?.title ||
    "Unknown project";
});

const filteredStories = computed(() => {
  const searchText =
    search.value?.trim().toLowerCase() || "";

  return stories.value.filter((story) => {
    const title =
      story.title?.toLowerCase() || "";

    const description =
      story.description?.toLowerCase() || "";

    const matchesSearch =
      !searchText ||
      title.includes(searchText) ||
      description.includes(searchText);

    const matchesStatus =
      selectedStatus.value === "All" ||
      getStoryStatus(story) === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });
});

/*
 * Gets every project associated with the logged-in user.
 * The first project becomes the initial selection.
 */
async function retrieveUserProjects() {
  if (!user.value?.id) {
    throw new Error(
      "The logged-in user could not be found.",
    );
  }

  try {
    loadingProjects.value = true;

    const response =
      await ProjectServices.getProjectsByUserId(
        user.value.id,
      );

    userProjects.value =
      Array.isArray(response.data)
        ? response.data
        : [];

    if (userProjects.value.length > 0) {
      projectId.value = userProjects.value[0].id;
    }
  } finally {
    loadingProjects.value = false;
  }
}

/*
 * Runs whenever the user selects another project.
 */
async function changeProject() {
  pageError.value = "";
  createStoryError.value = "";

  stories.value = [];
  projectMembers.value = [];
  backlogColumnId.value = null;

  search.value = "";
  selectedStatus.value = "All";

  if (!projectId.value) {
    return;
  }

  await Promise.all([
    retrieveStories(),
    retrieveProjectMembers(),
    retrieveBacklogColumn(),
  ]);
}

/*
 * Gets stories only for the selected project.
 */
async function retrieveStories() {
  if (!projectId.value) {
    return;
  }

  try {
    loadingStories.value = true;

    const response =
      await StoryboardServices.getStoriesForProject(
        projectId.value,
      );
console.log("retrieve stories", response)
    stories.value =
      Array.isArray(response.data)
        ? response.data
        : [];

    findBacklogColumnFromStories();
  } catch (error) {
    console.error(
      "Failed to retrieve stories:",
      error,
    );

    pageError.value =
      error.response?.data?.message ||
      "The stories could not be loaded.";
  } finally {
    loadingStories.value = false;
  }
}

/*
 * Uses the column data included with each story to locate
 * the selected project's Backlog column.
 */
function findBacklogColumnFromStories() {
  const backlogStory = stories.value.find(
    (story) =>
      story.column?.title
        ?.trim()
        .toLowerCase() === "backlog",
  );

  if (backlogStory?.columnId) {
    backlogColumnId.value =
      backlogStory.columnId;
  }
}

/*
 * Gets members belonging to the selected project.
 */
async function retrieveProjectMembers() {
  if (!projectId.value) {
    return;
  }

  try {
    loadingMembers.value = true;

    const response =
      await ProjectMembershipServices.getMembershipsByProjectId(
        projectId.value,
      );
  console.log("project members",response.data )

    // const memberships =
    //   Array.isArray(response.data)
    //     ? response.data
    //     : [];

      projectMembers.value = response.data
        .filter((membership) => membership.user)
        .map((membership) => ({
          id: membership.userId,
          fullName:
            `${membership.user.firstName} ${membership.user.lastName}`.trim(),
        }));
        console.log("assignee dropdown", projectMembers.value)
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

/*
 * Gets the columns for the selected project and finds
 * the column named Backlog.
 */
async function retrieveBacklogColumn() {
  if (!projectId.value) {
    return;
  }

  try {
    const response =
      await StoryboardServices.getColumnsForProject(
        projectId.value,
      );

    const columns =
      Array.isArray(response.data)
        ? response.data
        : [];

    const backlogColumn = columns.find(
      (column) =>
        column.title
          ?.trim()
          .toLowerCase() === "backlog",
    );

    backlogColumnId.value =
      backlogColumn?.id ?? null;
  } catch (error) {
    console.error(
      "Failed to retrieve project columns:",
      error,
    );
  }
}

async function openCreateStoryDialog() {
  if (!projectId.value) {
    pageError.value =
      "Select a project before creating a story.";

    return;
  }

  newStory.value = getDefaultStory();
  createStoryError.value = "";
  createStoryDialog.value = true;

  await Promise.all([
    retrieveProjectMembers(),
    retrieveBacklogColumn(),
  ]);
}

function closeCreateStoryDialog() {
  if (creatingStory.value) {
    return;
  }

  createStoryDialog.value = false;
  createStoryError.value = "";
  newStory.value = getDefaultStory();

  createStoryFormRef.value?.resetValidation();
}

/*
 * Creates a story and then creates its storyAssignee
 * records separately.
 */
async function createStory() {
  createStoryError.value = "";

  const validation =
    await createStoryFormRef.value?.validate();

  if (validation && !validation.valid) {
    return;
  }

  if (!projectId.value) {
    createStoryError.value =
      "A project must be selected.";

    return;
  }

  // if (!backlogColumnId.value) {
  //   createStoryError.value =
  //     "The Backlog column could not be found.";

  //   return;
  // }

  try {
    creatingStory.value = true;

    const story = {
      title: newStory.value.title.trim(),
      description:
        newStory.value.description?.trim() || "",
      priority: newStory.value.priority,
      storyPoint:
        Number(newStory.value.storyPoint),
      projectId: projectId.value,
      columnId: 1,
    };

    const response =
      await StoryboardServices.createStory(story);

    const createdStoryId = response.data.id;

    for (
      const assigneeId of newStory.value.assigneeIds
    ) {
      await StoryAssigneeServices.addAssignee({
        userStoryId: createdStoryId,
        userId: assigneeId,
      });
    }

    creatingStory.value = false;
    closeCreateStoryDialog();

    await retrieveStories();
  } catch (error) {
    console.error(
      "Failed to create story:",
      error,
    );

    createStoryError.value =
      error.response?.data?.message ||
      "The user story could not be created.";
  } finally {
    creatingStory.value = false;
  }
}

function getStoryStatus(story) {
  return (
    story.status ||
    story.column?.title ||
    "Backlog"
  );
}

function getAssigneeNames(story) {
  if (!Array.isArray(story.assignee)) {
    return "";
  }

  return story.assignee
    .filter((assignment) => assignment.user)
    .map((assignment) => {
      const firstName =
        assignment.user.firstName || "";

      const lastName =
        assignment.user.lastName || "";

      return `${firstName} ${lastName}`.trim();
    })
    .filter(Boolean)
    .join(", ");
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
    pageError.value = "";

    await retrieveUserProjects();

    if (!projectId.value) {
      return;
    }

    await Promise.all([
      retrieveStories(),
      retrieveProjectMembers(),
      retrieveBacklogColumn(),
    ]);
  } catch (error) {
    console.error(
      "Failed to initialize backlog:",
      error,
    );

    pageError.value =
      error.response?.data?.message ||
      error.message ||
      "The backlog page could not be loaded.";
  }
});
</script>

<style scoped>
:deep(.v-data-table tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.025);
}
</style>