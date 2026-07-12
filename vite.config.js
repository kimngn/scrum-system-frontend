import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dns from "dns";
dns.setDefaultResultOrder("verbatim");
// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from "vite-plugin-vuetify";

export default () => {
  const baseURL =
    process.env.APP_ENV === "development" ? "/" : "/recipe-frontend/";

  return defineConfig({
    plugins: [vue(), vuetify({ autoImport: true })],
    
    test: {
      // This activates browser-like globals such as 'window' and 'document'
      environment: 'jsdom',
      
      // Tells Vitest to find any files ending in .spec.js or .test.js
      include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      
      // CRITICAL: Turn off CSS parsing inside Vitest entirely
      css: false,
      
      // Move the dependency inlining inside the test block
      server: {
        deps: {
          inline: ['vuetify']
        }
      }
    },

    server: {
      // This remains here for your normal local browser development server
      host: "localhost",
      port: 8081,
    },
    base: baseURL,
  });
};