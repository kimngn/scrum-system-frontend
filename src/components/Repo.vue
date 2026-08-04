<script setup>
  import { onMounted, ref } from "vue";
  import { useRouter } from "vue-router";

  const props = defineProps({
    repo: {
      required: true,
    },
  });

  const currentRepo = ref(props.repo);

  onMounted(async () => {});
</script>

<template>
  <a
    class="hover-link"
    :key="currentRepo.name"
    :href="currentRepo.repoUrl"
    target="_blank"
  >
    <v-chip class="hover-chip">
      {{ currentRepo.name }}
    </v-chip>
  </a>
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
