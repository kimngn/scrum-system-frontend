import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "login",
      component: () => import("./views/Login.vue"),
    },
    {
      path: "/projects",
      name: "projects",
      component: () => import("./views/ProjectList.vue"),
    },
    {
      path: "/storyboard",
      name: "storyboard",
      component: () => import("./views/Storyboard.vue"),
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("./views/Admin.vue"),
    },
    {
      path: "/systemlogs",
      name: "systemlogs",
      component: () => import("./views/SystemLogs.vue"),
    },
    {
      path: "/backlogs",
      name: "backlogs",
      component: () => import("./views/Backlogs.vue"),
    },
    {
      path: "/issues",
      name: "issues",
      component: () => import("./views/Issues.vue"),
    },
    {
      path: "/retro",
      name: "retro",
      component: () => import("./views/Retrospective.vue"),
    },
    {
      path: "/projects/:id",
      name: "project-workspace",
      component: () => import("./views/ProjectWorkspace.vue"),
    },
  ],
});

export default router;
