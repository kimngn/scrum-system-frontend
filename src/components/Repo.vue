<script setup>
  import { onMounted, ref } from "vue";
  import { useRouter } from "vue-router";
  import RepoServices from "../services/RepoServices";

  const props = defineProps({
    projectId: {
      required: true,
    },
  });
  const repos = ref([]);
  const projectId = props.projectId;

  onMounted(async () => {
    await getRepos(projectId);
  });

  async function getRepos(projectId) {
    console.log("ProjectID:" + projectId);
    await RepoServices.getReposByProjectId(projectId).then((response) => {
      repos.value = response.data;
    });
  }
</script>

<template>
  <v-col class="mt-4" cols="12">
    <div class="d-flex gap-2">
      <a
        class="hover-link"
        v-for="repo in repos"
        :key="repo.name"
        :href="repo.repoUrl"
        target="_blank"
      >
        <v-chip class="hover-chip">
          {{ repo.repoUrl }}
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
