<script setup>
  import { onMounted } from "vue";
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { Tabs, Tab } from "super-vue3-tabs";
  import ProjectLogTab from "../components/ProjectLogTab.vue";
</script>

<template>
  <v-container>
    <Tabs>
      <Tab value="Admin"> </Tab>
      <Tab value="Auth"> </Tab>
      <Tab value="Project">
        <ProjectLogTab />
      </Tab>
    </Tabs>
  </v-container>
</template>

<style></style>
