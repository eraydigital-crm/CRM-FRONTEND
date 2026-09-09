// cypress/support/e2e.ts
import "@cypress/code-coverage/support";

console.log("=== Cypress e2e.ts loaded ===");

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to visit a page while seeding localStorage with CRM mock data
       * and a default authenticated session token.
       * @example cy.visitWithSeed('/activities', mockData)
       */
      visitWithSeed(
        url: string,
        seedData: any,
        auth?: { token: string; role: string; name: string }
      ): Chainable<AUTWindow>;
    }
  }
}

// Prevent Cypress from failing tests when uncaught exceptions occur in the application under test
Cypress.on("uncaught:exception", (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  return false;
});

// Register custom command
Cypress.Commands.add(
  "visitWithSeed",
  (
    url: string,
    seedData: any,
    auth: { token: string; role: string; name: string } = {
      token: "mock-token-cypress",
      role: "admin",
      name: "Adem Eray",
    }
  ) => {
    return cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem("eray_crm_data", JSON.stringify(seedData));
        win.localStorage.setItem("token", auth.token);
        win.localStorage.setItem("role", auth.role);
        win.localStorage.setItem("name", auth.name);
      },
    });
  }
);

export {};
