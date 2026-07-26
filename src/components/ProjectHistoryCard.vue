<script setup>
  import { onMounted, ref } from "vue";
  import { useRouter } from "vue-router";
  import { Tabs, Tab } from "super-vue3-tabs";
  import HistoryServices from "../services/HistoryServices";

  // Props
  const props = defineProps({
    // props don't use value
    project: {
      required: true,
    },
  });

  const projectId = props.project.id;
  const projectHistoryDetails = ref(false);
  const projectHistory = ref([]); // user info is already tagged along

  onMounted(async () => {
    await getProjectHistoryByProjectId();
  });

  async function getProjectHistoryByProjectId() {
    await HistoryServices.getProjectHistoryByProjectId(projectId)
      .then((response) => {
        projectHistory.value = response.data;
      })
      .catch((error) => {
        console.log(error);
      });
  }
</script>

<template>
  <v-container>
    <v-card
      class="rounded-lg elevation-5 mb-8"
      @click="projectHistoryDetails = !projectHistoryDetails"
    >
      <v-card-title class="headline">
        <v-row align="center">
          <v-col cols="10">
            ID {{ project.id }}: {{ project.name }}
            <v-chip class="ma-2" color="blue" label>
              <v-icon start icon="mdi-account-circle"></v-icon>
              {{ project.status }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-title>

      <v-expand-transition>
        <v-card-text v-show="projectHistoryDetails">
          <div @click.stop>
            <Tabs>
              <Tab value="Project Actions">
                <v-row class="mb-2, mt-2" align="center">
                  <!-- each column takes 1/2 of the row -->
                  <v-col class="pl-6" cols="6">
                    <!-- padding left: 4px -->

                    <ul>
                      <li class="mb-5" v-for="item in projectHistory">
                        <b class="mr-2"> {{ item.action }} </b>

                        {{ item.createdAt }}

                        <br />

                        Changed {{ item.fieldName }} from {{ item.oldValue }} to
                        {{ item.newValue }} by {{ item.user.firstName }}
                        {{ item.user.lastName }}.
                      </li>
                    </ul>
                  </v-col>
                </v-row>
              </Tab>
              <Tab value="Sprint Actions"> Hi </Tab>
            </Tabs>
          </div>
        </v-card-text>
      </v-expand-transition>
    </v-card>
  </v-container>
</template>
