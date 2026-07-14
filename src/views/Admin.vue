<script setup>
  import { onMounted } from "vue";
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { Tabs, Tab } from "super-vue3-tabs";
  import UserTab from "../components/UserTab.vue";
</script>

<template>
  <!-- https://mdsaban.com/packages/super-vue3-tabs-component/demo/ -->
  <v-container>
    <Tabs>
      <Tab value="Users">
        <template #icon>
          <i class="fas fa-home"></i>
        </template>
        <UserTab />
      </Tab>
      <Tab value="Projects">
        <template #icon>
          <i class="fas fa-user"></i>
        </template>
        <ProjectList />
      </Tab>
      <Tab value="Sprints">
        <template #icon>
          <i class="fas fa-cog"></i>
        </template>
        <p>Put list of sprints here</p>
      </Tab>

      <Tab value="Teams">
        <template #icon>
          <i class="fas fa-cog"></i>
        </template>
        <p>Put list of teams here</p>
      </Tab>

      <Tab value="User Stories">
        <template #icon>
          <i class="fas fa-cog"></i>
        </template>
        <p>Put list of user stories here</p>
      </Tab>

      <Tab value="Acceptance Criterias">
        <template #icon>
          <i class="fas fa-cog"></i>
        </template>
        <p>Put list of acceptance criterias here</p>
      </Tab>
    </Tabs>

    <v-snackbar v-model="snackbar.value" rounded="pill">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn :color="snackbar.color" variant="text" @click="snackbar.value = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>