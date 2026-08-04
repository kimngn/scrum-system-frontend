<script setup>
  import { onMounted, ref } from "vue";
  import { useRouter } from "vue-router";
  import { Tabs, Tab } from "super-vue3-tabs";
  import HistoryServices from "../services/HistoryServices";

  // Props
  const props = defineProps({
    projectId: {
      required: true,
    },
  });

  const projectId = props.projectId;
  const projectHistoryDetails = ref(false);
  const projectHistory = ref([]); // user info is already tagged along

  // Styles
  const createStyle = ref("createStyle");

  const editStyle = ref("editStyle");
  const deleteStyle = ref("deleteStyle");

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
            ID {{ projectId }} - {{ projectHistory[0]?.entityName }}</v-col
          >
        </v-row>
      </v-card-title>
      <v-expand-transition>
        <v-card-text v-show="projectHistoryDetails">
          <div @click.stop>
            <Tabs>
              <Tab value="Project Actions">
                <v-row class="mb-2, mt-2" align="center">
                  <!-- each column takes 1/2 of the row -->
                  <v-col class="pl-6" cols="12">
                    <ul>
                      <li class="mb-5" v-for="item in projectHistory">
                        <!-- CREATE -->
                        <template v-if="item.action === 'create'">
                          <v-icon
                            class="mx-2"
                            size="x-small"
                            icon="mdi-plus-outline"
                          ></v-icon
                          ><b class="mr-2 createStyle">
                            Created {{ item.entityType }}</b
                          >
                          {{ item.createdAt }}
                          <br />
                          <div class="ml-8">
                            {{
                              item.entityType.charAt(0).toUpperCase() +
                              item.entityType.slice(1)
                            }}
                            {{ item.entityName }} was created by
                            {{ item.user.firstName }} {{ item.user.lastName }}.
                          </div>
                        </template>
                        <!-- EDIT -->
                        <template v-else-if="item.action === 'edit'">
                          <v-icon
                            class="mx-2"
                            size="x-small"
                            icon="mdi-pencil"
                          ></v-icon
                          ><b class="mr-2 editStyle">
                            Modified {{ item.entityType }}
                          </b>
                          {{ item.createdAt }}
                          <br />
                          <div class="ml-8">
                            {{
                              item.entityType.charAt(0).toUpperCase() +
                              item.entityType.slice(1)
                            }}
                            {{ item.entityName }}
                            had the {{ item.fieldName }} changed from
                            {{ item.oldValue }} to {{ item.newValue }} by
                            {{ item.user.firstName }} {{ item.user.lastName }}.
                          </div>
                        </template>
                        <!-- DELETE -->
                        <template v-else-if="item.action === 'delete'">
                          <v-icon
                            class="mx-2"
                            size="x-small"
                            icon="mdi-trash-can"
                          ></v-icon
                          ><b class="mr-2 deleteStyle">
                            Deleted {{ item.entityType }}
                          </b>
                          {{ item.createdAt }}
                          <br />
                          <div class="ml-8">
                            {{
                              item.entityType.charAt(0).toUpperCase() +
                              item.entityType.slice(1)
                            }}
                            {{ item.entityName }} was deleted by
                            {{ item.user.firstName }} {{ item.user.lastName }}.
                          </div>
                        </template>

                        <!-- ADD -->

                        <template v-else-if="item.action === 'add'">
                          <v-icon
                            class="mx-2"
                            size="x-small"
                            icon="mdi-plus-outline"
                          ></v-icon
                          ><b class="mr-2 createStyle">
                            Added {{ item.entityType }}</b
                          >
                          {{ item.createdAt }}
                          <br />
                          <div class="ml-8">
                            A new membership was added by
                            {{ item.user.firstName }} {{ item.user.lastName }}.
                          </div>
                        </template>

                        <!-- REMOVE -->
                        <template v-else-if="item.action === 'remove'">
                          <v-icon
                            class="mx-2"
                            size="x-small"
                            icon="mdi-trash-can"
                          ></v-icon
                          ><b class="mr-2 deleteStyle">
                            Removed {{ item.entityType }}
                          </b>
                          {{ item.createdAt }}
                          <br />
                          <div class="ml-8">
                            A membership was removed by
                            {{ item.user.firstName }} {{ item.user.lastName }}.
                          </div>
                        </template>
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

<style>
  .createStyle {
    color: rgb(0, 147, 34);
  }
  .editStyle {
    color: rgb(31, 128, 214);
  }

  .deleteStyle {
    color: rgb(250, 28, 28);
  }
</style>
