<script setup>
  import { onMounted } from "vue";
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { Tabs, Tab } from "super-vue3-tabs";
  import ProjectHistoryTab from "../components/ProjectHistoryTab.vue";

  const router = useRouter();

  function navigateToAdmin() {
    router.push({ name: "admin" });
  }
</script>

<template>
  <v-icon
    class="ml-10 mt-10"
    size="large"
    icon="mdi-arrow-left"
    @click="navigateToAdmin()"
  ></v-icon>
  <v-container>
    <div id="body">
      <Tabs>
        <Tab value="Project">
          <ProjectHistoryTab />
        </Tab>
        <Tab value="Admin"> </Tab>
        <Tab value="Auth"> </Tab>
      </Tabs>
    </div>
  </v-container>
</template>

<style></style>
