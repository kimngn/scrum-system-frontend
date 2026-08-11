<template>
  <div class="acceptance-criteria-section">
    <!-- Header -->
    <div
      class="d-flex justify-space-between align-center mb-3"
    >
      <div class="text-subtitle-2 font-weight-bold">
        ACCEPTANCE CRITERIA
      </div>

      <v-btn
        size="small"
        variant="outlined"
        prepend-icon="mdi-plus"
        @click="openAddForm"
      >
        Add AC
      </v-btn>
    </div>

    <!-- Loading -->
    <v-progress-linear
      v-if="loading"
      indeterminate
      class="mb-3"
    />

    <!-- Existing Acceptance Criteria -->
    <v-card
      v-for="criterion in acceptanceCriteria"
      :key="criterion.id"
      variant="outlined"
      class="acceptance-card pa-3 mb-3"
    >
      <div class="d-flex align-start ga-3">
        <!-- Complete / Incomplete -->
        <v-btn
          :icon="
            criterion.completed
              ? 'mdi-check-circle'
              : 'mdi-checkbox-blank-circle-outline'
          "
          :color="
            criterion.completed
              ? 'success'
              : 'primary'
          "
          variant="text"
          size="small"
          class="mt-n1"
          @click="toggleCompleted(criterion)"
        />

        <!-- AC Text -->
        <div class="flex-grow-1">
          <div
            :class="{
              'text-decoration-line-through text-grey':
                criterion.completed,
            }"
            class="text-body-2"
          >
            {{ criterion.description }}
          </div>

          <div
            v-if="criterion.useGivenWhenThen"
            class="text-caption text-grey mt-1"
          >
            Given / When / Then
          </div>
        </div>

        <!-- Edit -->
        <v-btn
          icon="mdi-pencil-outline"
          variant="text"
          size="small"
          color="grey"
          @click="openEditForm(criterion)"
        />

        <!-- Delete -->
        <v-btn
          icon="mdi-delete-outline"
          variant="text"
          size="small"
          color="grey"
          @click="confirmDelete(criterion)"
        />
      </div>
    </v-card>

    <!-- Empty State -->
    <div
      v-if="
        !loading &&
        acceptanceCriteria.length === 0
      "
      class="text-caption text-grey mb-3"
    >
      No acceptance criteria added yet.
    </div>

    <!-- Add / Edit Form -->
    <v-card
      v-if="showForm"
      variant="outlined"
      class="pa-4 mt-3"
    >
      <div class="text-subtitle-2 font-weight-bold mb-3">
        {{
          editingId
            ? "Edit Acceptance Criteria"
            : "Add Acceptance Criteria"
        }}
      </div>

      <!-- Toggle -->
      <v-switch
        v-model="useGivenWhenThen"
        label="Use Given / When / Then format"
        color="primary"
        hide-details
        class="mb-4"
      />

      <!-- Given / When / Then -->
      <div v-if="useGivenWhenThen">
        <v-textarea
          v-model="form.given"
          label="Given"
          placeholder="Given..."
          variant="outlined"
          rows="2"
          auto-grow
          class="mb-2"
        />

        <v-textarea
          v-model="form.when"
          label="When"
          placeholder="When..."
          variant="outlined"
          rows="2"
          auto-grow
          class="mb-2"
        />

        <v-textarea
          v-model="form.then"
          label="Then"
          placeholder="Then..."
          variant="outlined"
          rows="2"
          auto-grow
          class="mb-2"
        />
      </div>

      <!-- Plain Text Mode -->
      <v-textarea
        v-else
        v-model="form.description"
        label="Acceptance Criteria"
        placeholder="Describe the acceptance criteria..."
        variant="outlined"
        rows="3"
        auto-grow
      />

      <!-- Error -->
      <v-alert
        v-if="formError"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ formError }}
      </v-alert>

      <!-- Form buttons -->
      <div class="d-flex justify-end ga-2">
        <v-btn
          variant="text"
          :disabled="saving"
          @click="closeForm"
        >
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          :loading="saving"
          @click="saveAcceptanceCriteria"
        >
          {{
            editingId
              ? "Save Changes"
              : "Add"
          }}
        </v-btn>
      </div>
    </v-card>

    <!-- Delete Confirmation -->
    <v-dialog
      v-model="deleteDialog"
      max-width="420"
    >
      <v-card>
        <v-card-title>
          Delete Acceptance Criteria
        </v-card-title>

        <v-card-text>
          Are you sure you want to delete this
          acceptance criterion?
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
            :loading="deleting"
            @click="deleteSelected"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import {
  onMounted,
  ref,
  watch,
} from "vue";

import AcceptanceCriteriaServices
  from "../services/AcceptanceCriteriaServices.js";

const props = defineProps({
  storyId: {
    type: Number,
    required: true,
  },
});

// ---------------------------------------------------------
// State
// ---------------------------------------------------------
const acceptanceCriteria = ref([]);

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const showForm = ref(false);
const editingId = ref(null);

const deleteDialog = ref(false);
const criterionToDelete = ref(null);

const useGivenWhenThen = ref(false);
const formError = ref("");

const form = ref({
  description: "",
  given: "",
  when: "",
  then: "",
});

// ---------------------------------------------------------
// Load AC
// ---------------------------------------------------------
async function retrieveAcceptanceCriteria() {
  if (!props.storyId) {
    acceptanceCriteria.value = [];
    return;
  }

  try {
    loading.value = true;

    const response =
      await AcceptanceCriteriaServices
        .getByStoryId(
          props.storyId
        );

    acceptanceCriteria.value =
      Array.isArray(response.data)
        ? response.data
        : [];
  } catch (error) {
    console.error(
      "Failed to retrieve acceptance criteria:",
      error
    );

    acceptanceCriteria.value = [];
  } finally {
    loading.value = false;
  }
}

// ---------------------------------------------------------
// Open Add Form
// ---------------------------------------------------------
function openAddForm() {
  editingId.value = null;

  useGivenWhenThen.value = false;

  form.value = {
    description: "",
    given: "",
    when: "",
    then: "",
  };

  formError.value = "";
  showForm.value = true;
}

// ---------------------------------------------------------
// Open Edit Form
// ---------------------------------------------------------
function openEditForm(criterion) {
  editingId.value = criterion.id;

  useGivenWhenThen.value =
    Boolean(
      criterion.useGivenWhenThen
    );

  formError.value = "";

  if (useGivenWhenThen.value) {
    const parsed =
      parseGivenWhenThen(
        criterion.description
      );

    form.value = {
      description:
        criterion.description || "",

      given:
        parsed.given,

      when:
        parsed.when,

      then:
        parsed.then,
    };
  } else {
    form.value = {
      description:
        criterion.description || "",

      given: "",
      when: "",
      then: "",
    };
  }

  showForm.value = true;
}

function resetForm() {
  showForm.value = false;
  editingId.value = null;
  useGivenWhenThen.value = false;
  formError.value = "";

  form.value = {
    description: "",
    given: "",
    when: "",
    then: "",
  };
}

// ---------------------------------------------------------
// Close Form
// ---------------------------------------------------------
function closeForm() {
  if (saving.value) {
    return;
  }

  showForm.value = false;
  editingId.value = null;

  useGivenWhenThen.value = false;

  formError.value = "";

  form.value = {
    description: "",
    given: "",
    when: "",
    then: "",
  };
}

// ---------------------------------------------------------
// Build saved text
// ---------------------------------------------------------
function buildDescription() {
  if (!useGivenWhenThen.value) {
    return (
      form.value.description?.trim() ||
      ""
    );
  }

  const parts = [];

  if (form.value.given?.trim()) {
    parts.push(
      `Given ${form.value.given.trim()}`
    );
  }

  if (form.value.when?.trim()) {
    parts.push(
      `When ${form.value.when.trim()}`
    );
  }

  if (form.value.then?.trim()) {
    parts.push(
      `Then ${form.value.then.trim()}`
    );
  }

  return parts.join("\n");
}

// ---------------------------------------------------------
// Save Add / Edit
// ---------------------------------------------------------
async function saveAcceptanceCriteria() {
  formError.value = "";

  const description =
    buildDescription();

  if (!description) {
    formError.value =
      "Acceptance criteria cannot be empty.";

    return;
  }

  try {
    saving.value = true;

    const data = {
      userStoryId:
        props.storyId,

      description,

      useGivenWhenThen:
        useGivenWhenThen.value,
    };

    if (editingId.value) {
      await AcceptanceCriteriaServices
        .updateAcceptanceCriteria(
          editingId.value,
          data
        );
    } else {
      await AcceptanceCriteriaServices
        .addAcceptanceCriteria(
          data
        );
    }

    resetForm();

    await retrieveAcceptanceCriteria();

  } catch (error) {
    console.error(
      "Failed to save acceptance criteria:",
      error
    );

    formError.value =
      error.response?.data?.message ||
      "The acceptance criteria could not be saved.";

  } finally {
    saving.value = false;
  }
}

// ---------------------------------------------------------
// Toggle complete
// ---------------------------------------------------------
async function toggleCompleted(
  criterion
) {
  try {
    await AcceptanceCriteriaServices
      .updateAcceptanceCriteria(
        criterion.id,
        {
          completed:
            !criterion.completed,
        }
      );

    await retrieveAcceptanceCriteria();

  } catch (error) {
    console.error(
      "Failed to update acceptance criteria:",
      error
    );
  }
}

// ---------------------------------------------------------
// Delete
// ---------------------------------------------------------
function confirmDelete(criterion) {
  criterionToDelete.value =
    criterion;

  deleteDialog.value = true;
}

async function deleteSelected() {
  if (
    !criterionToDelete.value?.id
  ) {
    return;
  }

  try {
    deleting.value = true;

    await AcceptanceCriteriaServices
      .deleteAcceptanceCriteria(
        criterionToDelete.value.id
      );

    deleteDialog.value = false;
    criterionToDelete.value = null;

    await retrieveAcceptanceCriteria();

  } catch (error) {
    console.error(
      "Failed to delete acceptance criteria:",
      error
    );

  } finally {
    deleting.value = false;
  }
}

// ---------------------------------------------------------
// Parse previously saved Given/When/Then text
// ---------------------------------------------------------
function parseGivenWhenThen(description) {
  const result = {
    given: "",
    when: "",
    then: "",
  };

  if (!description) {
    return result;
  }

  const lines =
    description.split("\n");

  for (const line of lines) {
    const trimmed =
      line.trim();

    if (
      trimmed
        .toLowerCase()
        .startsWith("given ")
    ) {
      result.given =
        trimmed.substring(6).trim();
    }

    else if (
      trimmed
        .toLowerCase()
        .startsWith("when ")
    ) {
      result.when =
        trimmed.substring(5).trim();
    }

    else if (
      trimmed
        .toLowerCase()
        .startsWith("then ")
    ) {
      result.then =
        trimmed.substring(5).trim();
    }
  }

  return result;
}

// ---------------------------------------------------------
// Reload if another story is selected
// ---------------------------------------------------------
watch(
  () => props.storyId,
  async () => {
    closeForm();

    await retrieveAcceptanceCriteria();
  }
);

onMounted(async () => {
  await retrieveAcceptanceCriteria();
});
</script>

<style scoped>
.acceptance-criteria-section {
  width: 100%;
}

.acceptance-card {
  border-radius: 10px;
}
</style>