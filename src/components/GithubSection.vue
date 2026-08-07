<script setup>
  import { onMounted, ref, watch } from "vue";

  import BranchServices from "../services/BranchServices";

  import RepoServices from "../services/RepoServices";

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
  const PRs = ref([]);
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

  // from Github
  async function getPullRequests(repo, selectedBranch) {
    try {
      console.log("Current repo:" + repo.id);
      console.log("Current repo:" + selectedBranch.name);

      await BranchServices.getPRsFromGithubAPI(repo, selectedBranch).then(
        (response) => {
          PRs.value = response.data;
          console.log("PRs:", PRs.value);
        },
      );
    } catch (err) {
      console.error("Failed to fetch pull requests from Github:", err);
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
        console.log("Repo passed into getBranches:", repo);
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
      }); // sends the new title, repoId, and branch object to parent

      console.log("Pull request repo ID:", selectedBranch.value.repoId);
      await RepoServices.getRepo(selectedBranch.value.repoId).then(
        async (response) => {
          var repo = response.data; // store repo object
          console.log("Response data repo:", response.data);
          console.log("Pull request repoURL:", repo.repoUrl);

          await getPullRequests(repo, selectedBranch.value);
        },
      );

      console.log("Dropdown value changed to:" + newBranch.name);
      console.log("Dropdown value changed to:" + newBranch.repoId);
    },
  );

  async function navigateToUrl() {}

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

  <v-row class="ml-1 form-label">PULL REQUEST(S)</v-row>
  <v-container class="mt-2 rounded-lg prInfo" v-for="pr in PRs">
    <v-row class="prStyle ml-1 mt-1">
      <div class="d-flex align-center">
        {{ pr.title }}
      </div>

      <v-chip class="d-flex ml-2" color="blue">
        {{ pr.state }}
      </v-chip>

      <v-btn
        size="small"
        color="primary"
        variant="outlined"
        class="ml-auto mr-4"
        :href="pr.url"
        target="_blank"
      >
        <v-icon size="small" icon="mdi-source-branch" class="mr-1" />
        PR #{{ pr.number }}
      </v-btn>
    </v-row>

    <v-row class="pb-4">
      <v-col class="dateInfo">
        <v-row class="ml-1">
          Created at {{ pr.createdAt }} by {{ pr.author }}
        </v-row>
        <!--
        <v-row v-if="pr.mergedBy" class="ml-1">
          Merged at {{ pr.mergedAt }} by {{ pr.mergedBy }}
        </v-row>
      -->
      </v-col>
    </v-row>
  </v-container>
</template>
<style>
  .prInfo {
    border-radius: 1%;
    border-color: rgb(170, 170, 170);
    border-style: solid;
  }

  .form-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    color: #8b1a35;
    margin-bottom: 4px;
  }

  .prStyle {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    color: #8b1a35;
    margin-bottom: 4px;
  }

  .dateInfo {
    font-size: 13px;
    color: grey;
  }
</style>
