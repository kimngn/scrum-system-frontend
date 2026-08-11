<script setup>
  import { onMounted } from "vue";
  import { ref } from "vue";
  import UserServices from "../services/UserServices";
  import UserCard from "./UserCard.vue";

  // Variables
  const loggedInUser = ref(null); // logged in user
  const users = ref([]);
  const user = ref(null);
  const isAdd = ref(false); // open dialog box

  // Search and filter
  const searchName = ref("");
  const filterRole = ref("");

  // Dropdown options
  const roles = ref(["admin", "lead", "member"]);

  // Snackbar
  const snackbar = ref({
    value: false,
    color: "",
    text: "",
  });

  // New User
  const newUser = ref({
    firstName: undefined,
    lastName: undefined,
    role: undefined,
    email: undefined,
    password: undefined,
  });

  onMounted(async () => {
    loggedInUser.value = JSON.parse(localStorage.getItem("user"));
    await getUsers();

    console.log("USERS:", users.value);
    console.log("Roles at setup:", roles.value);
  });

  async function getUsers() {
    console.log("getUsers called");
    const params = {};
    if (searchName.value) params.name = searchName.value;
    if (filterRole.value) params.role = filterRole.value;

    // When filter is applied, search all users. Otherwise, use role-based access.
    const hasFilter = searchName.value || filterRole.value;

    const call =
      loggedInUser.value?.role === "admin" || hasFilter
        ? UserServices.getAllUsers(params)
        : UserServices.getRelatedUsers(loggedInUser.value?.id, params);
    await call
      .then((response) => {
        users.value = response.data;
      })
      .catch((error) => {
        console.log(error);
        snackbar.value.value = true;
        snackbar.value.color = "error";
        snackbar.value.text = error.response?.data?.message;
      });
  }

  function applyFilters() {
    getUsers();
  }

  async function addUser() {
    await UserServices.addUser(newUser.value)
      .then(() => {
        snackbar.value.value = true;
        snackbar.value.color = "green";
        snackbar.value.text = `${newUser.value.firstName} ${newUser.value.lastName} added successfully!`;
        isAdd.value = false;
      })
      .catch((error) => {
        console.log(error);
        snackbar.value.value = true;
        snackbar.value.color = "error";
        snackbar.value.text = error.response.data.message;
      });

    await getUsers();
  }

  function openAdd() {
    // clear out fields from previous use
    newUser.value.firstName = undefined;
    newUser.value.lastName = undefined;
    newUser.value.role = undefined;
    newUser.value.email = undefined;
    newUser.value.password = undefined;
    isAdd.value = true;
  }

  function closeAdd() {
    isAdd.value = false;
  }

  function closeSnackBar() {
    snackbar.value.value = false;
  }
</script>

<template>
  <v-container>
    <div id="body">
      <v-row align="center" class="mb-4">
        <v-col cols="6"
          ><v-card-title class="pl-0 text-h4 font-weight-bold"
            >Users
          </v-card-title>
        </v-col>
        <v-col class="d-flex justify-end" cols="6">
          <v-btn color="accent" @click="openAdd()">Add User</v-btn>
        </v-col>
      </v-row>

      <!-- Search and Filter Section -->
      <v-card class="mb-4 pa-4 rounded-lg elevation-2">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchName"
              label="Search by name"
              placeholder="First or last name"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filterRole"
              label="Filter by role"
              :items="['', 'admin', 'lead', 'member']"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-center ga-2">
            <v-btn color="primary" variant="flat" @click="applyFilters" block>
              Search
            </v-btn>
          </v-col>
        </v-row>
      </v-card>

      <!---->
      <UserCard
        v-for="user in users"
        :key="user.id"
        :user="user"
        @refresh="getUsers"
      />
      <!---->

      <v-dialog persistent v-model="isAdd" width="800">
        <v-card class="rounded-lg elevation-5">
          <v-card-title class="headline mb-2">Add new user </v-card-title>
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

            <v-text-field
              v-model="newUser.email"
              label="Email"
              required
            ></v-text-field>

            <v-text-field
              v-model="newUser.password"
              label="Password"
              required
            ></v-text-field>

            <v-select
              v-model="newUser.role"
              label="Role"
              :items="roles"
            ></v-select>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="flat" color="secondary" @click="closeAdd()"
              >Close</v-btn
            >
            <v-btn variant="flat" color="primary" @click="addUser()"
              >Save</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="snackbar.value" rounded="pill">
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn
            :color="snackbar.color"
            variant="text"
            @click="closeSnackBar()"
          >
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </div>
  </v-container>
</template>
