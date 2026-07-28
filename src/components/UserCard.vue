<script setup>
  import { onMounted, ref } from "vue";
  import { useRouter } from "vue-router";
  import UserServices from "../services/UserServices";
  import ProjectServices from "../services/ProjectServices";

  // Props
  const props = defineProps({
    // props don't use value
    user: {
      required: true,
    },
  });

  // Dropdown options
  const roles = ref(["admin", "lead", "member"]);

  // Call back to parent
  const emit = defineEmits(["refresh"]);

  // Variables
  const router = useRouter();
  const loggedInUser = ref(null); // logged in user
  const user = ref(props.user); // existing user
  const userDetails = ref(false);
  const isEdit = ref(false);
  const newPassword = ref(null);
  const projects = ref([]);

  // Styling
  const buttonStyle = ref("buttonStyle");
  const subheaderStyle = ref("subheaderStyle");
  const vchipStyle = ref("vchipStyle");

  // Snackbar
  const snackbar = ref({
    value: false,
    color: "",
    text: "",
  });

  // New User
  const newUser = ref({
    firstName: "",
    lastName: "",
    role: "",
    email: "",
    password: "",
  });

  onMounted(async () => {
    await getProjectsByUserId();
    loggedInUser.value = JSON.parse(localStorage.getItem("user"));
  });

  async function updateUser() {
    newUser.value.id = user.value.id;
    await UserServices.updateUser(newUser.value)
      .then(async () => {
        // if the password is updated, grab the user ID and new password to send to backend
        if (newPassword.value) {
          await UserServices.updatePassword(user.value.id, newPassword.value);
        }
        snackbar.value.value = true;
        snackbar.value.color = "green";
        snackbar.value.text = `${newUser.value.firstName} ${newUser.value.lastName}  updated successfully!`;
        emit("refresh");
        isEdit.value = false;
      })
      .catch((error) => {
        console.log(error);
        snackbar.value.value = true;
        snackbar.value.color = "error";
        snackbar.value.text = error.response.data.message;
      });

    await getUser(user.value.id);
    emit("refresh");
  }

  async function deleteUser() {
    await UserServices.deleteUser(user.value)
      .then(async () => {
        snackbar.value.value = true;
        snackbar.value.color = "green";
        snackbar.value.text = `${user.value.firstName} deleted successfully!`;
        emit("refresh");
      })
      .catch((error) => {
        console.log(error);
        snackbar.value.value = true;
        snackbar.value.color = "error";
        snackbar.value.text = error.response.data.message;
      });

    emit("refresh");
  }

  async function getUser() {
    await UserServices.getUser(user.value.id)
      .then((response) => {
        user.value = response.data;
      })
      .catch((error) => {
        console.log(error);
        snackbar.value.value = true;
        snackbar.value.color = "error";
        snackbar.value.text = error.response.data.message;
      });
  }
  async function getProjectsByUserId() {
    await ProjectServices.getProjectsByUserId(user.value.id)
      .then((response) => {
        projects.value = response.data;
      })
      .catch((error) => {
        console.log(error);
        snackbar.value.value = true;
        snackbar.value.color = "error";
        snackbar.value.text = error.response.data.message;
      });
  }

  function openEdit() {
    newUser.value.firstName = user.value.firstName;
    newUser.value.lastName = user.value.lastName;
    newUser.value.role = user.value.role;
    newUser.value.email = user.value.email;
    newUser.value.password = user.value.password;
    isEdit.value = true;
  }

  function closeEdit() {
    isEdit.value = false;
  }

  function closeSnackBar() {
    snackbar.value.value = false;
  }
</script>

<template>
  <v-card
    class="rounded-lg elevation-5 mb-8"
    @click="userDetails = !userDetails"
  >
    <v-card-title class="headline">
      <v-row align="center">
        <v-col cols="10">
          {{ user.id }} {{ user.firstName }} {{ user.lastName }}
          <v-chip class="ma-2" color="blue" label>
            <v-icon start icon="mdi-account-circle"></v-icon>
            {{ user.role }}
          </v-chip>
        </v-col>
      </v-row>
    </v-card-title>

    <v-expand-transition>
      <v-card-text v-show="userDetails">
        <!-- ROW 1 -->
        <v-row class="mb-2, mt-2" align="center">
          <!-- each column takes 1/2 of the row -->
          <v-col class="pl-6" cols="6">
            <!-- padding left: 4px -->
            <v-row class="subheader">EMAIL</v-row>
            <v-row>{{ user.email }}</v-row>
          </v-col>

          <v-col class="pl-6" cols="6">
            <!-- padding left: 6px -->
            <v-row class="subheader">ROLE</v-row>
            <v-row>{{ user.role }}</v-row>
          </v-col>
        </v-row>

        <!-- ROW 2 -->
        <v-row class="mb-2" align="center">
          <!-- each column takes 1/2 of the row -->
          <v-col class="pl-6" cols="6">
            <!-- padding left: 6px -->
            <v-row class="mt-3 subheader">CREATED AT</v-row>
            <v-row>{{ user.createdAt }}</v-row>
          </v-col>

          <v-col class="pl-6" cols="6">
            <!-- padding left: 6px -->
            <v-row class="subheader">UPDATED AT</v-row>
            <v-row>{{ user.updatedAt }}</v-row>
          </v-col>
        </v-row>

        <!-- ROW 3 -->
        <v-row class="mb-2" align="center">
          <!-- each column takes up the whole row -->
          <v-col class="pl-6" cols="12">
            <v-row class="mt-3 mb-3 subheader">PROJECTS</v-row>

            <v-col class="mt-4" cols="12">
              <div class="d-flex flex-wrap ga-2">
                <v-chip class="vchipStyle" v-for="project in projects">{{
                  project.name
                }}</v-chip>
              </div></v-col
            >
          </v-col>
        </v-row>

        <!-- ROW 4 -->

        <v-row class="mb-2" justify="space-between" align="center">
          <v-col cols="auto" class="d-flex ga-2">
            <button @click.stop="openEdit()" class="editButtonStyle">
              Edit
            </button>
            <button @click.stop="deleteUser()" class="deleteButtonStyle">
              Delete
            </button>
          </v-col>
        </v-row>
      </v-card-text>
    </v-expand-transition>
  </v-card>

  <v-dialog persistent v-model="isEdit" width="800">
    <v-card class="rounded-lg elevation-5">
      <v-card-title class="headline mb-2">Edit user </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="newUser.firstName"
          label="First name"
          required
        ></v-text-field>

        <v-text-field
          v-model="newUser.lastName"
          label="Last name"
          required
        ></v-text-field>

        <v-select
          v-model="newUser.role"
          label="Role"
          :items="roles"
          required
        ></v-select>

        <v-text-field
          v-model="newUser.email"
          label="Email"
          required
        ></v-text-field>

        <v-text-field
          v-model.number="user.password"
          v-model="newPassword"
          type="password"
          label="Password"
          required
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="secondary" @click="closeEdit()"
          >Close</v-btn
        >
        <v-btn variant="flat" color="primary" @click="updateUser()">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.value" rounded="pill">
    {{ snackbar.text }}

    <template v-slot:actions>
      <v-btn :color="snackbar.color" variant="text" @click="closeSnackBar()">
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<style>
  .editButtonStyle {
    background-color: rgb(239, 239, 239);
    border-width: 2px;
    border-color: black; /* why is there no outline? */
    color: black;
    padding: 5px 5px;
    width: 100px;
    text-align: center;
    display: inline-block;
    border-radius: 6%;
  }

  .deleteButtonStyle {
    background-color: maroon;
    color: white;
    padding: 5px 5px;
    width: 100px;
    text-align: center;
    display: inline-block;
    border-radius: 6%;
  }

  .subheader {
    font-weight: bolder;
    color: maroon;
  }

  /* try not to affect all v-chips */
  .vchipStyle.v-chip {
    background-color: transparent;
    color: black;
  }
</style>
