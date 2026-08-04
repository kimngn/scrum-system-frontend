<script setup>
import MenuBar from "./components/MenuBar.vue";
import SideBar from "./components/SideBar.vue";
</script>

<template>
  <v-app :style="{ background: '#F4F4F4' }">
    <MenuBar />
    <SideBar :key="$route.fullPath" />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
