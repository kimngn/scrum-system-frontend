import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createRouter, createMemoryHistory } from "vue-router";

import MenuBar from "./MenuBar.vue";
import UserServices from "../services/UserServices";

// ----------------------
// Mock logo
// ----------------------
vi.mock("/oc_logo.png", () => ({
  default: "mocked-logo-path.png",
}));

// ----------------------
// Mock service
// ----------------------
vi.mock("../services/UserServices", () => ({
  default: {
    logoutUser: vi.fn(() =>
      Promise.resolve({ data: "Logged out successfully" })
    ),
  },
}));

// ----------------------
// Router
// ----------------------
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: "/",
      name: "recipes",
      component: { template: "<div>Recipes Page</div>" },
    },
    {
      path: "/login",
      name: "login",
      component: { template: "<div>Login Page</div>" },
    },
    {
      path: "/ingredients",
      name: "ingredients",
      component: { template: "<div>Ingredients Page</div>" },
    },
    {
      path: "/storyboard",
      name: "storyboard",
      component: { template: "<div>Storyboard Page</div>" },
    },
    {
      path: "/admin",
      name: "admin",
      component: { template: "<div>Admin Page</div>" },
    },
  ],
});

// ----------------------
// Vuetify stubs
// ----------------------
const globalStubs = {
  "router-link": {
    template: "<a><slot /></a>",
  },
  "v-app-bar": {
    template: "<div><slot /></div>",
  },
  "v-img": {
    template: "<img />",
  },
  "v-toolbar-title": {
    template: "<div><slot /></div>",
  },
  "v-spacer": true,
  "v-btn": {
   template: "<button><slot /></button>",
 },
  "v-menu": {
    template: "<div><slot name='activator' /><slot /></div>",
  },
  "v-avatar": {
    template: "<div><slot /></div>",
  },
  "v-card": {
    template: "<div><slot /></div>",
  },
  "v-card-text": {
    template: "<div><slot /></div>",
  },
  "v-divider": true,
};

const mountComponent = async () => {
  router.push("/");
  await router.isReady();

  const wrapper = mount(MenuBar, {
    global: {
      plugins: [router],
      stubs: globalStubs,
    },
  });

  await nextTick();

  return wrapper;
};

describe("MenuBar.vue", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders login when user is not logged in", async () => {
    const wrapper = await mountComponent();

    expect(wrapper.text()).toContain("Login");

    expect(wrapper.text()).not.toContain("Ingredients");
    expect(wrapper.text()).not.toContain("Storyboard");
    expect(wrapper.text()).not.toContain("Admin");
  });

  it("renders authenticated menu when user exists", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
      })
    );

    const wrapper = await mountComponent();

    expect(wrapper.text()).toContain("JD");
    expect(wrapper.text()).not.toContain("Login");
  });

  it("calls logout service when logout button is clicked", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
      })
    );

    const wrapper = await mountComponent();

    const logoutButton = wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("Logout"));

    expect(logoutButton).toBeTruthy();

    await logoutButton.trigger("click");

    expect(UserServices.logoutUser).toHaveBeenCalledTimes(1);
  });
});