<script setup>
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import ocLogo from "/oc_logo.png";
import UserServices from "../services/UserServices";

const router = useRouter();
const route = useRoute();

const user = ref(JSON.parse(localStorage.getItem("user")));

watch(
  () => route.fullPath,
  () => {
    user.value = JSON.parse(localStorage.getItem("user"));
  }
);

const isVisible = computed(() => {
  return route.name !== "login" && user.value !== null;
});

const navItems = computed(() => {
  if (!user.value) return [];

  if (user.value.role === "admin" || user.value.role === "lead") {
    return [
      {
        title: "Users",
        icon: "mdi-account-group-outline",
        routeName: "admin",
        query: { tab: "Users" },
        isActive:
          route.name === "admin" &&
          (!route.query.tab || route.query.tab === "Users"),
      },
      {
        title: "Projects",
        icon: "mdi-folder-multiple-outline",
        routeName: "admin",
        query: { tab: "Projects" },
        isActive:
          (route.name === "admin" && route.query.tab === "Projects") ||
          route.name === "project-workspace",
      },
      {
        title: "System Logs",
        icon: "mdi-clipboard-text-clock-outline",
        routeName: "systemlogs",
        query: {},
        isActive: route.name === "systemlogs",
      },
    ];
  }

  if (user.value.role === "member") {
    return [
      {
        title: "Projects",
        icon: "mdi-folder-outline",
        routeName: "projects",
        query: {},
        isActive:
          route.name === "projects" || route.name === "project-workspace",
      },
      {
        title: "Storyboard",
        icon: "mdi-view-column-outline",
        routeName: "storyboard",
        query: {},
        isActive: route.name === "storyboard",
      },
      {
        title: "Backlogs",
        icon: "mdi-format-list-checks",
        routeName: "backlogs",
        query: {},
        isActive: route.name === "backlogs",
      },
      {
        title: "Issues",
        icon: "mdi-alert-circle-outline",
        routeName: "issues",
        query: {},
        isActive: route.name === "issues",
      },
    ];
  }

  return [];
});

function navigate(item) {
  router.push({ name: item.routeName, query: item.query });
}

function logout() {
  UserServices.logoutUser().catch(() => {});
  localStorage.removeItem("user");
  user.value = null;
  router.push({ name: "login" });
}

const userInitials = computed(() => {
  if (!user.value) return "";
  return `${user.value.firstName.charAt(0)}${user.value.lastName.charAt(0)}`;
});

const userFullName = computed(() => {
  if (!user.value) return "";
  return `${user.value.firstName} ${user.value.lastName}`;
});
</script>

<template>
  <v-navigation-drawer
    v-if="isVisible"
    permanent
    width="260"
    color="primary"
    style="top: 0 !important; height: 100vh !important; border-right: 1px solid rgba(0,0,0,0.1);"
  >
    <!-- Logo / App name -->
    <div class="d-flex align-center px-5 pt-5 pb-3">
      <v-img
        :src="ocLogo"
        height="36"
        width="36"
        contain
        class="mr-3 flex-shrink-0"
      ></v-img>
      <span class="text-white text-h6 font-weight-bold">VELO</span>
    </div>

    <!-- Role badge -->
    <div class="px-5 pb-4">
      <v-chip
        size="small"
        variant="outlined"
        prepend-icon="mdi-shield-account-outline"
        style="color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.25);"
        class="text-capitalize"
      >
        {{ user?.role }}
      </v-chip>
    </div>

    <v-divider
      style="border-color: rgba(255,255,255,0.12);"
      class="mx-4 mb-3"
    ></v-divider>

    <!-- Navigation items -->
    <div class="px-3">
      <div
        v-for="item in navItems"
        :key="item.title"
        class="nav-item d-flex align-center rounded-lg px-3 mb-1"
        :class="{ 'nav-item--active': item.isActive }"
        @click="navigate(item)"
      >
        <v-icon :icon="item.icon" size="20" class="nav-icon mr-3"></v-icon>
        <span class="text-body-2">{{ item.title }}</span>
      </div>
    </div>

    <!-- User info + Logout at bottom -->
    <template v-slot:append>
      <v-divider
        style="border-color: rgba(255,255,255,0.12);"
        class="mx-4 mb-1"
      ></v-divider>
      <div class="d-flex align-center px-4 py-4" style="gap: 10px">
        <v-avatar color="accent" size="38">
          <span class="text-white text-caption font-weight-bold">
            {{ userInitials }}
          </span>
        </v-avatar>
        <div class="flex-grow-1 overflow-hidden">
          <div class="text-white text-body-2 font-weight-medium text-truncate">
            {{ userFullName }}
          </div>
          <div
            class="text-caption text-capitalize text-truncate"
            style="color: rgba(255,255,255,0.55)"
          >
            {{ user?.role }}
          </div>
        </div>
        <v-btn
          icon
          size="small"
          variant="text"
          style="color: rgba(255,255,255,0.65)"
          @click="logout"
        >
          <v-icon size="18">mdi-logout</v-icon>
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<style scoped>
.nav-item {
  height: 42px;
  color: rgba(255, 255, 255, 0.68);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  user-select: none;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.95);
}

.nav-item--active {
  background-color: rgba(255, 255, 255, 0.16);
  color: white;
  font-weight: 600;
}

.nav-icon {
  color: inherit;
  opacity: 0.85;
}

.nav-item--active .nav-icon {
  opacity: 1;
}
</style>
