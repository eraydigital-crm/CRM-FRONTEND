import { defineConfig } from "cypress";
import codeCoverageTask from "@cypress/code-coverage/task";

export default defineConfig({
  projectId: 'uuknsk',
  e2e: {
    baseUrl: "http://localhost:5173",

    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",

    supportFile: "cypress/support/e2e.ts",

    viewportWidth: 1280,
    viewportHeight: 720,

    video: false,
    screenshotOnRunFailure: true,

    setupNodeEvents(on, config) {
      return codeCoverageTask(on, config);
    },
  },
});