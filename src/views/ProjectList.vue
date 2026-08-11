<script setup>
  import { ref, onMounted } from "vue";

  import ProjectTab from "../components/ProjectTab.vue";
  const user = ref(null);

  onMounted(async () => {
    user.value = JSON.parse(localStorage.getItem("user"));
  });
</script>

<template>
  <v-container fluid>
    <div id="body">
      <ProjectTab />
    </div>
  </v-container>
</template>
