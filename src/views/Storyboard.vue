<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import StoryboardServices from "../services/StoryboardServices.js";
import ProjectServices from "../services/ProjectServices.js";
import ProjectMembershipServices from "../services/ProjectMembershipServices.js";
import StoryAssigneeServices from "../services/StoryAssigneeServices.js";
import ProjectColumnServices from "../services/ProjectColumnServices.js";

// Columns shown when the user isn't assigned to a project so the storyboard has the error snackbar.
const fallbackColumns = [
  { id: 1, title: "Backlog" },
  { id: 2, title: "To Do" },
  { id: 3, title: "In Progress" },
  { id: 4, title: "Ready for Test" },
  { id: 5, title: "Testing" },
  { id: 6, title: "Done" },
];

const priorityOptions = ["Critical", "High", "Medium", "Low"];

const router = useRouter();
const user = ref(null);
// Id of the logged in user's project, fetched from the backend.
const projectId = ref(null);
// Stores stories from the backend.
const stories = ref([]);
// Stores columns used by template.
const columns = ref([]);
// Stores the dragged story.
const draggedStory = ref(null);
// Stores the columnId being dragged over.
const hoverColumnId = ref(null);
const storyPoints = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89,];
// Shows snackbar error when there is no projectId.
const showProjectError = ref(false);
// Form popup state.
const showDialog = ref(false);
const isEditing = ref(false);
const editingStoryId = ref(null);
const selectedColumnId = ref(null);
const formTitle = ref("");
const formDescription = ref("");
const formPriority = ref("Medium");
const formStoryPoint = ref(null);
// Users assigned to the project, shown in the assignee dropdown.
const assigneeOptions = ref([]);
// Ids for the users selected in assignee dropdown.
const formAssignee = ref([]);
// Ids of the story's current assignee rows when editing.
const editingAssigneeIds = ref([]);
const projectColumns = ref([]);
const canManageColumns = ref(false);
const showColumnDialog = ref(false);
const newColumnTitle = ref("");
const draggedColumn = ref(null);
const hoverColumnRowId = ref(null);

onMounted(async () => {
  // Gets the logged in user from local storage.
  user.value = JSON.parse(localStorage.getItem("user"));
  if (!user.value) {
    router.push({ name: "login" });
    return;
  }
  canManageColumns.value = user.value.role === "lead" || user.value.role === "admin";

  // Gets the user's project from the backend.
  await ProjectServices.getProjectsByUserId(user.value.id)
    .then((response) => {
      // Saves the first project id.
      projectId.value = response.data[0].id;
    })
    .catch((error) => {
      console.log(error);
    });

  // Gets the project's columns from the backend.
  await getColumns();
  // Gets the user assignees from the backend
  await getAssignees();
  // Gets the stories from the backend.
  await getStories();
});

// Gets the columns for the project.
async function getColumns() {
  if (!projectId.value) {
    // if no project use fallback.
    projectColumns.value = fallbackColumns;
    buildColumns();
    return;
  }

  await ProjectColumnServices.getColumnsForProject(projectId.value)
    .then((response) => {
      projectColumns.value = response.data;
      buildColumns();
    })
    .catch((error) => {
      console.log(error);
    });
}

// Gets the members of the project so they can be picked as an assignee.
async function getAssignees() {
  if (!projectId.value) {
    return;
  }

  // Gets the members of the project from the backend.
  await ProjectMembershipServices.getMembershipsByProjectId(projectId.value)
    .then((response) => {
      const options = [];
      //loops through members and adds them to options array.
      for (let i = 0; i < response.data.length; i++) {
        const membership = response.data[i];
        options.push({
          title: membership.user.firstName + " " + membership.user.lastName,
          value: membership.user.id,
          email: membership.user.email,
        });
      }
      assigneeOptions.value = options;
    })
    .catch((error) => {
      console.log(error);
    });
}

// Gets stories for the project.
async function getStories() {
  await StoryboardServices.getStoriesForProject(projectId.value)
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

  // Creates each storyboard column using the project's columns.
  for (let i = 0; i < projectColumns.value.length; i++) {
    columnList.push({
      id: projectColumns.value[i].id,
      title: projectColumns.value[i].title,

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
  // Clears values for the form.
  isEditing.value = false;
  editingStoryId.value = null;
  // Saves columnId.
  selectedColumnId.value = columnId;
  formTitle.value = "";
  formDescription.value = "";
  formPriority.value = "";
  formStoryPoint.value = null;
  formAssignee.value = [];
  editingAssigneeIds.value = [];
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

  const userIds = [];
  const assigneeIds = [];
  // Loads the story's currentassignees into the form.
  for (let i = 0; i < story.assignee.length; i++) {
    userIds.push(story.assignee[i].user.id);
    assigneeIds.push(story.assignee[i].id);
  }
  // Select current user and save the assignee row ids.
  formAssignee.value = userIds;
  editingAssigneeIds.value = assigneeIds;

  showDialog.value = true;
}

// Save story being dragged.
  function startDrag(story){
  draggedStory.value = story;
}

// Clears drag values.
function endDrag() {
  draggedStory.value = null;
  hoverColumnId.value = null;
}

// Outlines the column being dragged over.
function dragEnter(columnId) {
  hoverColumnId.value = columnId;
}

async function dropStory(columnId){
  hoverColumnId.value = null;

  // If story is dropped in the same column do nothing.
  if (draggedStory.value.columnId === columnId) {
    draggedStory.value = null;
    return;
  }

  const updatedStory = {
    title: draggedStory.value.title,
    description: draggedStory.value.description,
    priority: draggedStory.value.priority,
    storyPoint: draggedStory.value.storyPoint,
    projectId: draggedStory.value.projectId,
    columnId: columnId,
  };

  try {
    // Updates story new column id.
    await StoryboardServices.updateStory(
      draggedStory.value.id,
      updatedStory,
    );

    // Refresh story board.
    await getStories();
  } catch (error) {
    console.log(error);
  }

  draggedStory.value = null;
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
    projectId: projectId.value,
    columnId: selectedColumnId.value,
  };
  // Get storyId.
  let storyId = editingStoryId.value;

  if (isEditing.value) {
    // Updates the existing story.
    await StoryboardServices.updateStory(storyId, story);

    // Deletes the story's old assignee records.
    for (let i = 0; i < editingAssigneeIds.value.length; i++) {
      await StoryAssigneeServices.deleteAssignee(
        editingAssigneeIds.value[i],
      );
    }
  } else {
    // Creates the new story and saves its id.
    const response = await StoryboardServices.createStory(story);
    storyId = response.data.id;
  }

  // Adds the currently selected assignees.
  for (let i = 0; i < formAssignee.value.length; i++) {
    await StoryAssigneeServices.addAssignee({
      userStoryId: storyId,
      userId: formAssignee.value[i],
    });
  }

  // Refreshes the board and closes the dialog.
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

// Saves a column's edited title.
async function saveColumnTitle(column) {
  await ProjectColumnServices.updateColumn(column.id, {
    title: column.title,
    role: user.value.role,
  });
  await getColumns();
}

// Adds a new column at the end.
async function addColumn() {
  if (newColumnTitle.value === "") {
    return;
  }

  await ProjectColumnServices.addColumn({
    title: newColumnTitle.value,
    displayOrder: projectColumns.value.length + 1,
    projectId: projectId.value,
    role: user.value.role,
  });

  newColumnTitle.value = "";
  await getColumns();
}

// Deletes a column.
async function deleteColumn(columnId) {
  await ProjectColumnServices.deleteColumn(columnId, user.value.role);
  await getColumns();
}

// Saves the column being dragged, for reordering.
function startColumnDrag(column) {
  draggedColumn.value = column;
}

// Outlines the column row being dragged over.
function dragEnterColumn(columnId) {
  hoverColumnRowId.value = columnId;
}



// Reorders columns when one is dropped onto another.
async function dropColumn(targetColumn) {
  hoverColumnRowId.value = null;

  if (draggedColumn.value === null || draggedColumn.value.id === targetColumn.id) {
    draggedColumn.value = null;
    return;
  }

  const fromIndex = projectColumns.value.indexOf(draggedColumn.value);
  const toIndex = projectColumns.value.indexOf(targetColumn);

  // Take 1 column out of the array and insert it at the new index.
  // Splice: https://www.w3schools.com/jsref/jsref_splice.asp
  projectColumns.value.splice(fromIndex, 1);
  projectColumns.value.splice(toIndex, 0, draggedColumn.value);

  // Saves the new display order for every column.
  for (let i = 0; i < projectColumns.value.length; i++) {
    await ProjectColumnServices.updateColumn(projectColumns.value[i].id, {
      title: projectColumns.value[i].title,
      displayOrder: i + 1,
      role: user.value.role,
    });
  }

  draggedColumn.value = null;
  await getColumns();
}
</script>

<template>
  <!-- fluid makes it use the full width. -->
  <v-container fluid>

    <div class="d-flex align-center">
      <v-card-title class="pl-0 text-h4 font-weight-bold">
        Storyboard
      </v-card-title>

      <!-- Only leads and admins can manage columns. -->
      <v-btn
        v-if="canManageColumns"
        color="primary"
        variant="outlined"
        class="ml-4"
        @click="showColumnDialog = true"
      >
        Manage Columns
      </v-btn>
    </div>

    <!-- Holds all storyboard columns in a horizontal row. -->
    <div class="storyboard-columns">
      <!-- Loops through each storyboard column and displays it. -->
      <div
        :class="{ 'dragging-active': hoverColumnId === column.id }"
        v-for="column in columns" :key="column.id"
        class="storyboard-column"
        @dragover.prevent="dragEnter(column.id)"
        @drop="dropStory(column.id)"
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

          <!-- Shows a red X when there is no project. -->
          <v-btn
            v-if="!projectId"
            icon="mdi-close"
            color="red"
            size="small"
            variant="text"
            @click="showProjectError = true"
          ></v-btn>
         
          <!-- Button for the create dialog. -->
          <v-btn
            v-else
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
          draggable="true"
          @dragstart="startDrag(story)"
          @dragend="endDrag()"
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
          <div class="d-flex align-center justify-space-between mt-2">
            <!-- Shows assignees on the card. -->
            <div v-if="story.assignee.length > 0">
              <v-chip
                v-for="assignee in story.assignee" :key="assignee.id"
                size="small"
              >
                {{ assignee.user.firstName }} {{ assignee.user.lastName }}
              </v-chip>
            </div>
            
            <div v-if="story.storyPoint !== null">
              <v-chip size="small" variant="outlined">
                {{ story.storyPoint }} pts
              </v-chip>
            </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Popup dialog. -->
    <v-dialog v-model="showDialog" width="500">
      <v-card class="story-dialog-card">
        
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

          <v-row>
            <!-- Priority dropdown -->
            <v-col cols="6">
              <v-select
                v-model="formPriority" :items="priorityOptions"
                label="Priority"
              ></v-select>
            </v-col>
            <!-- Story point dropdown -->
            <v-col cols="6">
              <v-select
                v-model="formStoryPoint" :items="storyPoints"
                label="Story Points"
              ></v-select>
            </v-col>
          </v-row>

          <!-- Shows assignees email under name -->
          <v-select
            v-model="formAssignee"
            :items="assigneeOptions"
            label="Assignee"
            multiple
            chips
          >
            <!-- Assignee items -->
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :subtitle="item.raw.email"
              ></v-list-item>
            </template>
          </v-select>
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

    <!-- Manage Columns dialog, leads only. -->
    <v-dialog v-model="showColumnDialog" width="500">
      <v-card>
        <v-card-title>Manage Columns</v-card-title>

        <v-card-text>
          <!-- Existing columns. -->
          <div
            v-for="column in projectColumns" :key="column.id"
            :class="{ 'dragging-active': hoverColumnRowId === column.id }"
            class="d-flex align-center mb-2 column-row"
            draggable="true"
            @dragstart="startColumnDrag(column)"
            @dragover.prevent="dragEnterColumn(column.id)"
            @drop="dropColumn(column)"
          >
            <v-icon icon="mdi-drag" class="mr-2" style="cursor: grab;"></v-icon>

            <v-text-field
              v-model="column.title"
              density="compact"
              hide-details
              @blur="saveColumnTitle(column)"
            ></v-text-field>

            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="red"
              class="ml-2"
              @click="deleteColumn(column.id)"
            ></v-btn>
          </div>

          <!-- Adds a new column at the end. -->
          <div class="d-flex align-center mt-4">
            <v-text-field
              v-model="newColumnTitle"
              label="New column title"
              density="compact"
              hide-details
            ></v-text-field>

            <v-btn
              color="primary"
              variant="text"
              class="ml-2"
              @click="addColumn"
            >
              Add
            </v-btn>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showColumnDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Error snackbar for project errors. -->
    <v-snackbar
      v-model="showProjectError"
      location="bottom"
      timeout="3000"
      color="red"
    >
      You must be in a project before creating a user story.
    </v-snackbar>

  </v-container>
</template>

<style scoped>
.storyboard-columns {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  align-items: flex-start;
  width: 100%;
  max-width: 100%;
  /* Fills screen so scrollbar is at the bottom. */
  height: calc(100vh - 135px);
}

.storyboard-column {
  min-width: 280px;
  max-width: 280px;
  flex-shrink: 0;
  /* Lets each column scroll down. */
  height: 100%;
  overflow-y: auto;
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

.dragging-active {
  border: 2px solid #0a3158;
  background-color: rgba(12, 57, 103, 0.08);
  padding-bottom: 35px;
  padding-left: 10px;
  padding-right: 10px;
}

.column-row.dragging-active {
  padding-bottom: 4px;
}
.story-dialog-card {  
transform: translateY(-56px);
}
</style>