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
      path: "/backlogs",
      name: "backlogs",
      component: () => import("./views/Backlogs.vue"),
    },
  ],
});

export default router;
