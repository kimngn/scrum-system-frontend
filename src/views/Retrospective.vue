<template>
  <v-container fluid class="retro-page pa-0">

    <!-- ============================= -->
    <!-- Header -->
    <!-- ============================= -->

    <div class="retro-header px-6 py-4">

      <div>
        <div class="text-h6 font-weight-bold">
          Retrospective
        </div>

        <div
          v-if="selectedSprint"
          class="text-caption text-medium-emphasis mt-2"
        >
          {{ selectedSprint.name }}

          <span
            v-if="
              selectedSprint.startDate &&
              selectedSprint.endDate
            "
            class="ml-4"
          >
            {{ formatDate(selectedSprint.startDate) }}
            -
            {{ formatDate(selectedSprint.endDate) }}
          </span>
        </div>
      </div>


      <div class="d-flex align-center ga-3">

        <!-- Sprint selector -->

        <v-select
          v-model="selectedSprintId"
          :items="sprints"
          item-title="name"
          item-value="id"
          label="Sprint"
          variant="outlined"
          density="compact"
          hide-details
          style="width: 230px"
          @update:model-value="loadRetrospective"
        />


        <v-btn
          variant="outlined"
          @click="goBack"
        >
          Back to Board
        </v-btn>


        <v-btn
          color="primary"
          :loading="saving"
          @click="saveRetrospective"
        >
          Save Retro
        </v-btn>

      </div>

    </div>


    <!-- ============================= -->
    <!-- Retrospective Board -->
    <!-- ============================= -->

    <div class="retro-board pa-6">

      <v-row>

        <!-- ================================= -->
        <!-- WHAT WENT RIGHT -->
        <!-- ================================= -->

        <v-col
          cols="12"
          md="4"
        >

          <v-card
            class="retro-column right-column"
            elevation="1"
          >

            <!-- Header -->

            <div class="column-header right-header">

              <div class="d-flex align-center">

                <v-icon
                  color="success"
                  class="mr-2"
                >
                  mdi-check
                </v-icon>

                <span class="font-weight-bold">
                  What Went Right
                </span>

              </div>

              <v-chip
                size="x-small"
                color="success"
              >
                {{ wentWell.length }}
              </v-chip>

            </div>


            <!-- Items -->

            <div class="column-body">

              <div
                v-for="(item, index) in wentWell"
                :key="index"
                class="retro-item right-item"
              >

                <span>
                  {{ item }}
                </span>


                <v-btn
                  icon
                  variant="text"
                  size="x-small"
                  class="delete-button"
                  @click="removeItem('wentWell', index)"
                >
                  <v-icon size="16">
                    mdi-close
                  </v-icon>
                </v-btn>

              </div>

            </div>


            <!-- Add Item -->

            <div class="add-section">

              <div class="d-flex ga-2">

                <v-text-field
                  v-model="newWentWell"
                  placeholder="Something that worked well..."
                  density="compact"
                  variant="outlined"
                  hide-details
                  @keyup.enter="addWentWell"
                />

                <v-btn
                  icon
                  color="success"
                  size="small"
                  @click="addWentWell"
                >
                  <v-icon>
                    mdi-plus
                  </v-icon>
                </v-btn>

              </div>

              <div class="helper-text">
                Press Enter to add
              </div>

            </div>

          </v-card>

        </v-col>


        <!-- ================================= -->
        <!-- WHAT WENT WRONG -->
        <!-- ================================= -->

        <v-col
          cols="12"
          md="4"
        >

          <v-card
            class="retro-column wrong-column"
            elevation="1"
          >

            <div class="column-header wrong-header">

              <div class="d-flex align-center">

                <v-icon
                  color="error"
                  class="mr-2"
                >
                  mdi-close
                </v-icon>

                <span class="font-weight-bold">
                  What Went Wrong
                </span>

              </div>

              <v-chip
                size="x-small"
                color="error"
              >
                {{ wentWrong.length }}
              </v-chip>

            </div>


            <div class="column-body">

              <div
                v-for="(item, index) in wentWrong"
                :key="index"
                class="retro-item wrong-item"
              >

                <span>
                  {{ item }}
                </span>


                <v-btn
                  icon
                  variant="text"
                  size="x-small"
                  class="delete-button"
                  @click="removeItem('wentWrong', index)"
                >
                  <v-icon size="16">
                    mdi-close
                  </v-icon>
                </v-btn>

              </div>

            </div>


            <div class="add-section">

              <div class="d-flex ga-2">

                <v-text-field
                  v-model="newWentWrong"
                  placeholder="Something that could have gone better..."
                  density="compact"
                  variant="outlined"
                  hide-details
                  @keyup.enter="addWentWrong"
                />

                <v-btn
                  icon
                  color="error"
                  size="small"
                  @click="addWentWrong"
                >
                  <v-icon>
                    mdi-plus
                  </v-icon>
                </v-btn>

              </div>

              <div class="helper-text">
                Press Enter to add
              </div>

            </div>

          </v-card>

        </v-col>


        <!-- ================================= -->
        <!-- IMPROVEMENTS -->
        <!-- ================================= -->

        <v-col
          cols="12"
          md="4"
        >

          <v-card
            class="retro-column improvement-column"
            elevation="1"
          >

            <div class="column-header improvement-header">

              <div class="d-flex align-center">

                <v-icon
                  color="primary"
                  class="mr-2"
                >
                  mdi-arrow-right
                </v-icon>

                <span class="font-weight-bold">
                  Improvements
                </span>

              </div>

              <v-chip
                size="x-small"
                color="primary"
              >
                {{ improvements.length }}
              </v-chip>

            </div>


            <div class="column-body">

              <div
                v-for="(item, index) in improvements"
                :key="index"
                class="retro-item improvement-item"
              >

                <span>
                  {{ item }}
                </span>


                <v-btn
                  icon
                  variant="text"
                  size="x-small"
                  class="delete-button"
                  @click="removeItem('improvements', index)"
                >
                  <v-icon size="16">
                    mdi-close
                  </v-icon>
                </v-btn>

              </div>

            </div>


            <div class="add-section">

              <div class="d-flex ga-2">

                <v-text-field
                  v-model="newImprovement"
                  placeholder="An action item or process change..."
                  density="compact"
                  variant="outlined"
                  hide-details
                  @keyup.enter="addImprovement"
                />

                <v-btn
                  icon
                  color="primary"
                  size="small"
                  @click="addImprovement"
                >
                  <v-icon>
                    mdi-plus
                  </v-icon>
                </v-btn>

              </div>

              <div class="helper-text">
                Press Enter to add
              </div>

            </div>

          </v-card>

        </v-col>

      </v-row>

    </div>


    <!-- Snackbar -->

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="3000"
    >
      {{ snackbarMessage }}
    </v-snackbar>

  </v-container>
</template>


<script setup>

import {
  ref,
  computed,
  onMounted,
} from "vue";

import { useRouter } from "vue-router";

import RetrospectiveServices from "../services/RetrospectiveServices.js";

import SprintServices from "../services/SprintServices.js";


const router = useRouter();


/* =====================================================
   Sprint
===================================================== */

const sprints = ref([]);

const selectedSprintId = ref(null);


const selectedSprint = computed(() => {

  return sprints.value.find(
    sprint =>
      sprint.ID === selectedSprintId.value ||
      sprint.id === selectedSprintId.value
  );

});


/* =====================================================
   Retrospective
===================================================== */

const wentWell = ref([]);

const wentWrong = ref([]);

const improvements = ref([]);


/* =====================================================
   New item inputs
===================================================== */

const newWentWell = ref("");

const newWentWrong = ref("");

const newImprovement = ref("");


/* =====================================================
   UI
===================================================== */

const saving = ref(false);

const snackbar = ref(false);

const snackbarMessage = ref("");

const snackbarColor = ref("success");


/* =====================================================
   Load Sprints
===================================================== */

const loadSprints = async () => {

  try {

    const response =
      await SprintServices.getSprints();

    sprints.value =
      response.data ?? response;
    
    console.log("sprint value", sprints.value)

    if (sprints.value.length > 0) {

      const firstSprint =
        sprints.value[0];

      selectedSprintId.value =
        firstSprint.ID ??
        firstSprint.id;


      await loadRetrospective();

    }

  } catch (error) {

    console.error(
      "Error loading sprints:",
      error
    );

    showMessage(
      "Could not load sprints.",
      "error"
    );

  }

};


/* =====================================================
   Load Retrospective
===================================================== */

const loadRetrospective = async () => {

  console.log("selectedSprintId:", selectedSprintId.value);
  if (!selectedSprintId.value)
    return;

   // Clear the previous sprint immediately
  wentWell.value = [];
  wentWrong.value = [];
  improvements.value = [];

  newWentWell.value = "";
  newWentWrong.value = "";
  newImprovement.value = "";


  try {

    const response =
      await RetrospectiveServices
        .getBySprint(
          selectedSprintId.value
        );


    const retro =
      response.data ?? response;


    if (!retro) {

      wentWell.value = [];

      wentWrong.value = [];

      improvements.value = [];

      return;
    }

    wentWell.value =
      retro.wentWell ?? [];

    wentWrong.value =
      retro.wentWrong ?? [];

    improvements.value =
      retro.improvements ?? [];

  } catch (error) {

    console.error(
      "Error loading retrospective:",
      error
    );
  }
};


/* =====================================================
   Add items
===================================================== */

const addWentWell = () => {

  const value =
    newWentWell.value.trim();

  if (!value)
    return;


  wentWell.value.push(value);

  newWentWell.value = "";

};


const addWentWrong = () => {

  const value =
    newWentWrong.value.trim();

  if (!value)
    return;


  wentWrong.value.push(value);

  newWentWrong.value = "";

};


const addImprovement = () => {

  const value =
    newImprovement.value.trim();

  if (!value)
    return;


  improvements.value.push(value);

  newImprovement.value = "";

};


/* =====================================================
   Remove Item
===================================================== */

const removeItem = (
  category,
  index
) => {

  if (category === "wentWell") {

    wentWell.value.splice(
      index,
      1
    );

  }


  if (category === "wentWrong") {

    wentWrong.value.splice(
      index,
      1
    );

  }


  if (category === "improvements") {

    improvements.value.splice(
      index,
      1
    );

  }

};


/* =====================================================
   Save
===================================================== */

const saveRetrospective = async () => {

  if (!selectedSprintId.value) {

    showMessage(
      "Please select a sprint.",
      "error"
    );

    return;

  }


  saving.value = true;


  try {

    const payload = {

      sprintId:
        selectedSprintId.value,

      wentWell:
        wentWell.value,

      wentWrong:
        wentWrong.value,

      improvements:
        improvements.value,

    };


    await RetrospectiveServices
      .saveRetrospective(
        payload
      );


    showMessage(
      "Retrospective saved successfully.",
      "success"
    );


  } catch (error) {

    console.error(
      "Error saving retrospective:",
      error
    );


    showMessage(
      "Could not save retrospective.",
      "error"
    );


  } finally {

    saving.value = false;

  }

};


/* =====================================================
   Helpers
===================================================== */

const showMessage = (
  message,
  color = "success"
) => {

  snackbarMessage.value =
    message;

  snackbarColor.value =
    color;

  snackbar.value =
    true;

};


const formatDate = date => {

  if (!date)
    return "";


  return new Date(date)
    .toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );

};


const goBack = () => {

  router.push("/storyboard");

};


/* =====================================================
   Mount
===================================================== */

onMounted(async () => {

  await loadSprints();

});

</script>


<style scoped>

.retro-page {
  background: #f7f7f8;
  min-height: 100vh;
}


/* Header */

.retro-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;

  display: flex;
  justify-content: space-between;
  align-items: center;
}


/* Board */

.retro-board {
  max-width: 1500px;
}


/* Columns */

.retro-column {
  border-radius: 14px;
  overflow: hidden;
  background: white;
}


/* colored top borders */

.right-column {
  border-top: 4px solid #22c55e;
}

.wrong-column {
  border-top: 4px solid #ef4444;
}

.improvement-column {
  border-top: 4px solid #3b82f6;
}


/* Headers */

.column-header {
  min-height: 58px;

  padding: 16px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  border-bottom: 1px solid #e5e7eb;
}


.right-header {
  background: #f0fdf4;
  color: #15803d;
}


.wrong-header {
  background: #fef2f2;
  color: #dc2626;
}


.improvement-header {
  background: #eff6ff;
  color: #2563eb;
}


/* Body */

.column-body {
  min-height: 235px;
  padding: 14px;
}


/* Cards */

.retro-item {
  position: relative;

  padding: 14px 42px 14px 14px;

  margin-bottom: 10px;

  border-radius: 10px;

  font-size: 14px;

  line-height: 1.45;

  border: 1px solid;
}


.right-item {
  background: #f0fdf4;
  border-color: #bbf7d0;
}


.wrong-item {
  background: #fef2f2;
  border-color: #fecaca;
}


.improvement-item {
  background: #eff6ff;
  border-color: #bfdbfe;
}


/* Delete button appears on hover */

.delete-button {
  position: absolute;

  top: 4px;
  right: 4px;

  opacity: 0;

  transition: opacity 0.15s ease;
}


.retro-item:hover
.delete-button {
  opacity: 1;
}


/* Bottom Add Area */

.add-section {
  padding: 12px;

  border-top: 1px solid #e5e7eb;

  background: #ffffff;
}


.helper-text {
  font-size: 11px;

  color: #9ca3af;

  margin-top: 5px;
}


/* Responsive */

@media (
  max-width: 960px
) {

  .retro-header {
    align-items: flex-start;

    flex-direction: column;

    gap: 15px;
  }

}

</style>