<script setup>
  import { onMounted, ref } from "vue";
  import { useRouter } from "vue-router";
  import { Tabs, Tab } from "super-vue3-tabs";

  // Props
  const props = defineProps({
    // props don't use value
    project: {
      required: true,
    },
  });

  const projectDetails = ref(false);
</script>

<template>
  <v-container>
    <v-card
      class="rounded-lg elevation-5 mb-8"
      @click="projectDetails = !projectDetails"
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
        <v-card-text v-show="projectDetails">
          <div @click.stop>
            <Tabs>
              <Tab value="Project Actions">
                <!-- ROW 1 -->
                <v-row class="mb-2, mt-2" align="center">
                  <!-- each column takes 1/2 of the row -->
                  <v-col class="pl-6" cols="6">
                    <!-- padding left: 4px -->
                    <v-row class="subheader">ACTION - ACTION DETAILS</v-row>
                    <v-row> USER - DATE - TIME</v-row>
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
