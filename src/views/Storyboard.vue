<script setup>
import { onMounted, ref } from "vue";
import StoryboardServices from "../services/StoryboardServices.js";

// Column names
const columnTitles = [
  "Backlog",
  "To Do",
  "In Progress",
  "Ready for Test",
  "Testing",
  "Done",
];

// Hardcoded project id.
const projectId = 1;
// Stores stories from the backend.
const stories = ref([]);
// Stores columns used by template.
const columns = ref([]);

onMounted(async () => {
  // Gets the stories from the backend.
  await getStories();
});

// Gets stories for the project.
async function getStories() {
  await StoryboardServices.getStoriesForProject(projectId)
    .then((response) => {
      // Saves the backend story data into the stories ref.
      stories.value = response.data;
      buildColumns();
    })
    .catch((error) => {
      console.log(error);
    });
}

function buildColumns() {
  // Temp array to hold all columns before updating columns.value.
  const columnList = [];

  // Creates each storyboard column using the columnTitles array.
  for (let i = 0; i < columnTitles.length; i++) {
    columnList.push({
      // Sets the column title.
      title: columnTitles[i],

      // Starts columns with empty story list.
      stories: [],
    });
  }

  // Loops through every story returned from the backend.
  for (let i = 0; i < stories.value.length; i++) {
    const story = stories.value[i];

    // Checks each column to find where the story belongs.
    for (let j = 0; j < columnList.length; j++) {
      // If story's column title matches this column title add story to that column.
      if (columnList[j].title === story.column.title) {
        columnList[j].stories.push(story);
      }
    }
  }

  // Saves the finished columns so they show on the page.
  columns.value = columnList;
}

function getPriorityColor(priority) {
  if (priority === "Critical") {
    return "red";
  } else if (priority === "High") {
    return "orange";
  } else if (priority === "Medium") {
    return "amber";
  } else if (priority === "Low") {
    return "grey";
  } else {
    return "grey";
  }
}
</script>

<template>
  <!-- fluid makes it use the full width. -->
  <v-container fluid>

    <v-card-title class="pl-0 text-h4 font-weight-bold">
      Storyboard
    </v-card-title>

    <!-- Holds all storyboard columns in a horizontal row. -->
    <div class="storyboard-columns">
      <!-- Loops through each storyboard column and displays it. -->
      <div
        v-for="column in columns" :key="column.title"
        class="storyboard-column"
      >
        <div class="column-header">
          <span class="text-subtitle-1 font-weight-bold">
            {{ column.title }}
          </span>

          <!-- Displays the number of stories inside the column. -->
          <v-chip size="small" class="ml-2">
            {{ column.stories.length }}
          </v-chip>
        </div>

        <!-- If no stories. -->
        <div
          v-if="column.stories.length === 0"
          class="drop-here text-caption text-medium-emphasis"
        >
          Drop here
        </div>

        <!-- Loops through each story inside the current column. -->
        <v-card
          v-for="story in column.stories" :key="story.id"
          class="story-card"
          variant="elevated"
        >
          <!-- Story card content -->
          <v-card-text>
            <!-- Top row of the card -->
            <div class="d-flex align-center justify-space-between">
              <!-- Displays user story number. -->
              <span class="text-caption text-medium-emphasis">
                US-{{ story.id }}
              </span>

              <!-- Displays the priority with a color. -->
              <v-chip
                :color="getPriorityColor(story.priority)"
                size="small"
                label
              >
                {{ story.priority }}
              </v-chip>
            </div>

            <div class="text-body-1 font-weight-medium mt-2">
              {{ story.title }}
            </div>

            <div class="text-caption text-medium-emphasis mt-1">
              {{ story.description }}
            </div>

            <div class="mt-2">
              <v-chip size="small" variant="outlined">
                {{ story.storyPoint }} pts
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </v-container>
</template>

<style scoped>
.storyboard-columns {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  align-items: flex-start;
}

.storyboard-column {
  min-width: 280px;
  max-width: 280px;
}

.column-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.story-card {
  margin-bottom: 12px;
}

.drop-here {
  border: 1px dashed #ccc;
  border-radius: 4px;
  padding: 24px 8px;
  text-align: center;
}
</style>