<script setup>
  import { onMounted, ref } from "vue";
  import { useRouter } from "vue-router";
  import RepoServices from "../services/RepoServices";

  const props = defineProps({
    repos: {
      required: true,
    },
  });

  onMounted(async () => {});
</script>

<template>
  <v-col class="mt-4" cols="12">
    <div class="d-flex gap-2">
      <a
        class="hover-link"
        v-for="repo in props.repos"
        :key="repo.name"
        :href="repo.repoUrl"
        target="_blank"
      >
        <v-chip class="hover-chip">
          {{ repo.name }}
        </v-chip>
      </a>
    </div>
  </v-col>
</template>

<style>
  .hover-chip {
    background-color: transparent; /* initial background color */
  }

  .hover-link:hover .hover-chip {
    background-color: #b16e6e;
    color: white;
  }
</style>
