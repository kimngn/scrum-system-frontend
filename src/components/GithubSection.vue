<script setup>
  import { onMounted, ref, watch } from "vue";

  import BranchServices from "../services/BranchServices";

  // Props
  const props = defineProps({
    storyId: {
      required: true,
    },
    repos: {
      required: true,
    },
  });

  const repos = ref(props.repos);
  const currentBranch = ref(null); // from database
  const branches = ref([]); // from Github - might run into duplicate issues later, fix with a set?
  const user = ref(null);
  const storyId = props.storyId; // need this for updating the branch

  // from database
  async function getBranch() {
    try {
      await BranchServices.getBranchByStoryId(storyId).then((response) => {
        currentBranch.value = response.data;
        console.log("Current branch:" + currentBranch.value.title);
      });
    } catch (error) {
      console.error("Failed to fetch branch from database:", error);
    }
  }

  // from Github
  async function getBranches(repo) {
    try {
      await BranchServices.getBranchFromGithubAPI().then((response) => {
        for (const branch of response.data) {
          branches.value.push(branch.name); // don't replace branches value, just add to it
          console.log("Current branch:" + branches.value[i].title);
        }
      });
    } catch (err) {
      console.error("Failed to fetch branch from Github:", err);
    }
  }

  // https://vuejs.org/guide/essentials/watchers.html
  watch(
    () => props.storyId,
    (storyId) => {
      console.log("New story id from prop:", storyId);
      if (storyId) getBranch();
    },
    { immediate: true }, // eager watching: runs immediately to get initial value, runs again to get new value
  );

  onMounted(async () => {
    user.value = JSON.parse(localStorage.getItem("user"));

    console.log("Repos:" + repos.value);

    for (repo of repos) {
      await getBranches(repo); // get branches from all repos associated with this project
    }
  });
</script>

<template>
  <v-select v-model="currentBranch" :items="branches"> Github Branch </v-select>
</template>
