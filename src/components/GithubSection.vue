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

  // emits lets child component communicate with parent
  const emit = defineEmits(["updateBranch"]);

  const dbBranch = ref(null); // actual branch oboject pulled from database and to be pushed to database
  const selectedBranch = ref(null); // dropdown holds entire object
  const branches = ref([]); // from Github
  const user = ref(null);

  // from database
  async function getBranch() {
    try {
      // only edit needs to fetch branch from database, create wouldn't even have anything to fetch
      await BranchServices.getBranchByStoryId(props.storyId).then(
        (response) => {
          dbBranch.value = response.data;
          if (!response.data.title) {
            // if no branch was saved during creation, then dropdown should just be blank
            selectedBranch.value = null;
          } else {
            selectedBranch.value = {
              name: response.data.name ?? response.data.title,
              repoId: response.data.repoId ?? null,
              ...response.data,
            };
            console.log("Selected branch:", selectedBranch.value);
          }
        },
      );
    } catch (error) {
      console.error("Failed to fetch branch from database:", error);
    }
  }

  // from Github
  async function getBranches(repo) {
    try {
      await BranchServices.getBranchesFromGithubAPI(repo).then((response) => {
        for (const branch of response.data) {
          branches.value.push({ ...branch, repoId: repo.id }); // copy existing attributes and add new repo attribute
        }
        console.log("Branches:", branches.value);
      });
    } catch (err) {
      console.error("Failed to fetch branch from Github:", err);
    }
  }
  // https://vuejs.org/guide/essentials/watchers.html
  watch(
    // triggers when props.storyId changes
    () => props.storyId,
    async (storyId) => {
      console.log("New story id from prop:", storyId);
      if (storyId) {
        await getBranch(); // get branch if a new story is selected
      }
    },
    { immediate: true }, // eager watching: runs immediately to get initial value, runs again to get new value
  );

  watch(
    // triggers when props.repos value changes
    () => props.repos,
    async (newRepos) => {
      for (const repo of newRepos) {
        await getBranches(repo); // get new repos if a new project is selected
      }
    },
    { immediate: true },
  );

  watch(
    // triggers when dropdown value changes
    () => selectedBranch.value,

    async (newBranch) => {
      await emit("updateBranch", {
        name: newBranch.name,
        dbBranch: dbBranch?.value,
        repoId: newBranch.repoId,
      }); // sends the new title and the branch object to parent

      console.log("Dropdown value changed to:" + newBranch.name);
      console.log("Dropdown value changed to:" + newBranch.repoId);
    },
  );

  onMounted(async () => {
    //repos.value = props.repos;
    user.value = JSON.parse(localStorage.getItem("user"));
  });
</script>

<template>
  <v-select
    v-model="selectedBranch"
    :items="branches"
    item-title="name"
    return-object
    placeholder="Select a branch"
  />
</template>
