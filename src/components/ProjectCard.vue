<script setup>
  import { defineProps } from "vue";
  import { ref, onMounted, computed } from "vue";
  import Repo from "../components/Repo.vue";

  const props = defineProps({
    project: {
      required: true,
    },
  });

  const project = ref(props.project); // existing user
  const projectDetails = ref(false);

  const isEdit = ref(false);

  // New User
  const newProject = ref({
    name: "",
    description: "",
    status: "active",
    startDate: null,
    endDate: null,
    repoUrl: "",
    token: "",
  });

  function openEdit() {
    newProject.value.name = project.value.name;
    newProject.value.description = project.value.description;
    newProject.value.status = project.value.status;
    newProject.value.startDate = project.value.startDate;
    newProject.value.endDate = project.value.endDate;

    isEdit.value = true;
  }

  // Snackbar
  const snackbar = ref({
    value: false,
    color: "",
    text: "",
  });

  function closeEdit() {
    isEdit.value = false;
  }

  function closeSnackBar() {
    snackbar.value.value = false;
  }
</script>

<template>
  <v-card
    class="rounded-lg elevation-5 mb-4"
    @click="projectDetails = !projectDetails"
  >
    <v-card-title class="headline">
      <v-row align="center">
        <v-col cols="10">
          {{ project.name }}
          <v-chip class="ma-2" color="blue" label>
            <v-icon start icon="mdi-account-circle"></v-icon>
            {{ project.status }}
          </v-chip>
        </v-col>
      </v-row>
    </v-card-title>

    <v-expand-transition>
      <v-card-text v-show="projectDetails">
        <v-row class="mb-2 mt-2" align="center">
          <v-col class="pl-6" cols="6">
            <v-row class="subheader">DESCRIPTION</v-row>
            <v-row>{{ project.description || "—" }}</v-row>
          </v-col>
          <v-col class="pl-6" cols="6">
            <v-row class="subheader">STATUS</v-row>
            <v-row>{{ project.status }}</v-row>
          </v-col>
        </v-row>
        <v-row class="mb-2" align="center">
          <v-col class="pl-6" cols="6">
            <v-row class="mt-3 subheader">START DATE</v-row>
            <v-row>{{
              project.startDate
                ? new Date(project.startDate).toLocaleDateString(undefined, {
                    timeZone: "UTC",
                  })
                : "—"
            }}</v-row>
          </v-col>
          <v-col class="pl-6" cols="6">
            <v-row class="subheader">END DATE</v-row>
            <v-row>{{
              project.endDate
                ? new Date(project.endDate).toLocaleDateString(undefined, {
                    timeZone: "UTC",
                  })
                : "—"
            }}</v-row>
          </v-col>
        </v-row>
        <v-row class="mb-2" align="center">
          <v-col class="pl-6" cols="6">
            <v-row class="mt-3 subheader">REPOS</v-row>
            <v-row>
              <Repo :repos="project.repos" />
            </v-row>
          </v-col>
        </v-row>
        <v-row class="mb-2" justify="space-between" align="center">
          <v-col cols="auto" class="d-flex ga-2">
            <button @click.stop="openEdit()" class="editButtonStyle">
              Edit
            </button>

            <button @click.stop="openEdit()" class="deleteButtonStyle">
              Delete
            </button>
          </v-col>
          <v-col
            v-if="$parent.user && $parent.user.role !== 'member'"
            cols="auto"
          >
            <v-btn color="primary" @click.stop="$emit('view', project.id)">
              View Workspace
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-expand-transition>
  </v-card>

  <v-dialog v-model="isEdit" max-width="550">
    <v-card class="rounded-xl pa-2">
      <v-card-title
        class="d-flex justify-space-between align-center px-4 pt-4 pb-2"
      >
        <span class="text-h6 font-weight-bold">Edit Project</span>
        <v-btn icon variant="text" @click="isEdit = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="px-4">
        <div class="form-label">PROJECT NAME</div>
        <v-text-field
          v-model="newProject.name"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          bg-color="grey-lighten-4"
          class="mb-1"
          hide-details
        >
        </v-text-field>

        <div class="form-label mt-3">DESCRIPTION</div>
        <v-textarea
          v-model="newProject.description"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          bg-color="grey-lighten-4"
          rows="3"
          class="mb-1"
          hide-details
        >
        </v-textarea>

        <div class="form-label mt-3">STATUS</div>
        <v-select
          v-model="newProject.status"
          :items="['active', 'inactive', 'completed']"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          bg-color="grey-lighten-4"
          class="mb-1"
          hide-details
        >
        </v-select>

        <v-row class="mt-2" no-gutters>
          <v-col cols="6" class="pr-2">
            <div class="form-label">START DATE</div>
            <v-text-field
              v-model="newProject.startDate"
              type="date"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              bg-color="grey-lighten-4"
              hide-details
            >
            </v-text-field>
          </v-col>
          <v-col cols="6" class="pl-2">
            <div class="form-label">END DATE</div>
            <v-text-field
              v-model="newProject.endDate"
              type="date"
              :min="newProject.startDate || undefined"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              bg-color="grey-lighten-4"
              hide-details
            >
            </v-text-field>
          </v-col>

          <v-row class="mt-2">
            <v-col cols="12" class="pl-3">
              <!-- iterate by index rather than id or name -->
              <!-- index is being increased, repo just gets assigned the item in the editingRepos array -->
              <div class="form-label">REPO URL(S)</div>

              <v-text-field
                v-model="newProject.description"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                bg-color="grey-lighten-4"
                hide-details
                append-icon="mdi-trash-can"
              ></v-text-field>

              <div class="mt-2" v-if="addingRepo">
                <v-text-field
                  v-model="newProject.description"
                  placeholder="https://github.com/owner/repositoryName"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  bg-color="grey-lighten-4"
                  append-icon="mdi-cancel"
                  @click:append="toggleAddRepo()"
                  hide-details
                >
                </v-text-field>
              </div>

              <v-icon
                v-else
                class="mt-3"
                size="small"
                icon="mdi-plus-circle-outline"
                @click="toggleAddRepo()"
              ></v-icon>
            </v-col>
          </v-row>
        </v-row>

        <v-row class="mt-2">
          <v-col cols="12" class="pl-3">
            <div class="form-label d-flex justify-space-between align-center">
              <span>MEMBERS</span>
              <span
                v-if="editingMembers.length"
                class="text-caption text-grey-darken-1"
              >
                {{ editingMembers.length }} member{{
                  editingMembers.length > 1 ? "s" : ""
                }}
              </span>
            </div>

            <div
              v-for="(m, i) in editingMembers"
              :key="m.user.id"
              class="d-flex align-center mb-2 pa-2 rounded-lg mt-2"
              style="background: #f5f5f5"
            >
              <div class="member-avatar mr-3">
                {{ getInitials(m.user) }}
              </div>
              <span class="flex-grow-1 text-body-2"
                >{{ m.user.firstName }} {{ m.user.lastName }}</span
              >
              <v-select
                v-model="m.role"
                :items="['lead', 'member']"
                variant="outlined"
                density="compact"
                rounded="lg"
                hide-details
                style="max-width: 145px"
                class="mr-2"
              />
              <v-btn
                icon
                variant="text"
                size="small"
                @click="removeEditMember(i)"
              >
                <v-icon size="18">mdi-close</v-icon>
              </v-btn>
            </div>

            <v-text-field
              v-model="editMemberSearch"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              placeholder="Search by name or email..."
              bg-color="grey-lighten-4"
              class="mt-2 mb-1"
              hide-details
            />

            <v-card
              v-if="filteredEditUsers.length"
              class="mt-1 rounded-lg"
              elevation="3"
            >
              <v-list density="compact">
                <v-list-item
                  v-for="u in filteredEditUsers"
                  :key="u.id"
                  @click="addEditMember(u)"
                  style="cursor: pointer"
                >
                  <template #prepend>
                    <div class="member-avatar mr-3">
                      {{ getInitials(u) }}
                    </div>
                  </template>
                  <v-list-item-title
                    >{{ u.firstName }} {{ u.lastName }}</v-list-item-title
                  >
                  <v-list-item-subtitle>{{ u.email }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="px-4 pb-4 justify-end">
        <v-btn variant="text" @click="isEdit = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-white rounded-lg px-6"
          @click="saveChanges()"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
