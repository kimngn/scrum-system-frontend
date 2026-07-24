<template>
  <v-container fluid>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h2 class="text-h5 font-weight-bold">Backlog</h2>
        <div class="text-grey">
          {{ filteredStories.length }} Stories
        </div>
      </div>

      <v-btn color="primary">
        Create Story
      </v-btn>
    </div>

    <!-- Filters -->
    <v-card class="pa-4 mb-4">
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search stories..."
            density="compact"
            hide-details
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="selectedStatus"
            :items="statuses"
            label="Status"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredStories"
        :loading="loading"
      >
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
            {{ item.priority }}
          </v-chip>
        </template>

        <!-- Status -->
        <template v-slot:item.status="{ item }">
          <v-chip
            size="small"
            :color="statusColor(item.status)"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Story Points -->
        <template v-slot:item.storyPoint="{ item }">
          <v-chip size="small">
            {{ item.storyPoint }}
          </v-chip>
        </template>

        <!-- Assignee -->
        <template v-slot:item.assignedUser_id="{ item }">
          {{ item.assignedUser_id }}
        </template>

        <!-- Sprint -->
        <template v-slot:item.Sprint_id="{ item }">
          {{ item.Sprint_id }}
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import StoryboardServices from "../services/StoryboardServices.js";

const loading = ref(false);

const search = ref("");
const selectedStatus = ref("All");

const statuses = [
  "All",
  "Backlog",
  "To Do",
  "In Progress",
  "Ready for Test",
  "Testing",
  "Done"
];

const stories = ref([]);

const headers = [
  {
    title: "ID",
    key: "story_id",
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
    key: "assignedUser_id",
  },
  {
    title: "Sprint",
    key: "Sprint_id",
  },
];

async function retrieveStories() {
  try {
    loading.value = true;
    const response = await StoryboardServices.getAllStoriesInBacklog();
    stories.value = response.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

const filteredStories = computed(() => {
  return stories.value.filter((story) => {
    const matchesSearch =
      !search.value ||
      story.title
        ?.toLowerCase()
        .includes(search.value.toLowerCase());

    const matchesStatus =
      selectedStatus.value === "All" ||
      story.status === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });
});

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
    case "To Do":
      return "red";
    default:
      return "grey";
  }
}

onMounted(() => {
  retrieveStories();
});
</script>