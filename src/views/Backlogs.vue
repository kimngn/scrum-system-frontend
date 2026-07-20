<script setup>
import { onMounted, ref } from "vue";
import StoryboardServices from "../services/StoryboardServices.js";

// Column ids to match the seeded columns in the backend.
const columnDefinitions = [
  { id: 1, title: "Backlog" },
  { id: 2, title: "To Do" },
  { id: 3, title: "In Progress" },
  { id: 4, title: "Ready for Test" },
  { id: 5, title: "Testing" },
  { id: 6, title: "Done" },
];

const priorityOptions = ["Critical", "High", "Medium", "Low"];

// Hardcoded project id.
const projectId = 1;
// Stores stories from the backend.
const stories = ref([]);
// Stores columns used by template.
const columns = ref([]);

// Form popup state.
const showDialog = ref(false);
const isEditing = ref(false);
const editingStoryId = ref(null);
const selectedColumnId = ref(null);
const formTitle = ref("");
const formDescription = ref("");
const formPriority = ref("Medium");
const formStoryPoint = ref(null);

onMounted(async () => {
  // Gets the stories from the backend.
  await getStories();
});

// Gets stories for the project.
async function getStories() {
  await StoryboardServices.getStoriesForProject(projectId)
    .then((response) => {
      // Saves the stories from the backend.
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

  // Creates each storyboard column using columnDefinitions.
  for (let i = 0; i < columnDefinitions.length; i++) {
    columnList.push({
      id: columnDefinitions[i].id,
      title: columnDefinitions[i].title,

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
      if (columnList[j].id === story.column.id) {
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
    return "yellow";
  } else if (priority === "Low") {
    return "grey";
  }
}

// Opens the dialog empty.
function openCreateDialog(columnId) {
  isEditing.value = false;
  editingStoryId.value = null;
  selectedColumnId.value = columnId;
  formTitle.value = "";
  formDescription.value = "";
  formPriority.value = "";
  formStoryPoint.value = null;
  showDialog.value = true;
}

// Opens the dialog filled with the selected story's info
function openEditDialog(story) {
  isEditing.value = true;
  editingStoryId.value = story.id;
  selectedColumnId.value = story.columnId;
  formTitle.value = story.title;
  formDescription.value = story.description;
  formPriority.value = story.priority;
  formStoryPoint.value = story.storyPoint;
  showDialog.value = true;
}

async function saveStory() {
  // Title can't be empty.
  if (formTitle.value === "") {
    return;
  }

  const story = {
    title: formTitle.value,
    description: formDescription.value,
    priority: formPriority.value,
    storyPoint: formStoryPoint.value,
    projectId: projectId,
    columnId: selectedColumnId.value,
  };

  if (isEditing.value) {
    await StoryboardServices.updateStory(editingStoryId.value, story);
  } else {
    await StoryboardServices.createStory(story);
  }

  await getStories();
  showDialog.value = false;
}

async function deleteStory() {
  try {
    // Send story id to backend to delete it.
    await StoryboardServices.deleteStory(editingStoryId.value);
    // Refresh the stories.
    await getStories();
    showDialog.value = false;
  } catch (error) {
    console.log(error);
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

          <v-spacer></v-spacer>

          <!-- Button for the create dialog. -->
          <v-btn
            icon="mdi-plus"
            size="small"
            variant="text"
            @click="openCreateDialog(column.id)"
          ></v-btn>
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
          @click="openEditDialog(story)"
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
                v-if="story.priority" :color="getPriorityColor(story.priority)"
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

            <div class="mt-2" v-if="story.storyPoint !== null">
              <v-chip size="small" variant="outlined">
                {{ story.storyPoint }} pts
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Popup dialog. -->
    <v-dialog v-model="showDialog" width="500">
      <v-card>
        <v-card-title>
          {{ isEditing ? "Edit User Story" : "New User Story" }}
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="formTitle"
            label="Title"
            required
          ></v-text-field>

          <v-textarea
            v-model="formDescription"
            label="Description"
          ></v-textarea>

           <!-- Priority dropdown -->
          <v-select
            v-model="formPriority" :items="priorityOptions"
            label="Priority"
          ></v-select>

          <v-text-field
            v-model.number="formStoryPoint"
            label="Story Points"
            type="number"
          ></v-text-field>
        </v-card-text>
        <!-- If a user clicks edit show delete/save button. -->
        <v-card-actions>
          <v-btn
            v-if="isEditing"
            color="red"
            variant="text"
            @click="deleteStory()"
          >
            Delete
          </v-btn>
          <!-- Spacing for save button. -->
          <v-spacer></v-spacer>

          <v-btn color="green" variant="text" @click="saveStory">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
  cursor: pointer;
}

.drop-here {
  border: 1px dashed #ccc;
  border-radius: 4px;
  padding: 24px 8px;
  text-align: center;
}
</style>