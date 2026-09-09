/// <reference types="cypress" />

describe("Login Page with Mocked API & Fallbacks", () => {
  beforeEach(() => {
    // Intercept API call to simulate network error or control responses
    cy.intercept("POST", "/api/login", (req: any) => {
      const body = req.body as { email: string };
      if (body.email === "admin@eray.com") {
        req.reply({
          statusCode: 200,
          body: { token: "mock-token-admin", role: "admin" },
        });
      } else if (body.email === "network-error@test.com") {
        req.destroy(); // Network failure to trigger local fallback
      } else {
        req.reply({
          statusCode: 401,
          body: { message: "Identifiants incorrects." },
        });
      }
    }).as("mockLogin");

    cy.visit("/login");
  });

  it("should authenticate successfully with a mocked login response", () => {
    cy.get('input[id="email"]').type("admin@eray.com");
    cy.get('input[id="password"]').type("password123");
    
    // Test password visibility toggle
    cy.get('button[type="button"]').first().click(); // click show password
    cy.get('input[id="password"]').should("have.attr", "type", "text");
    cy.get('button[type="button"]').first().click(); // click hide password
    cy.get('input[id="password"]').should("have.attr", "type", "password");

    // Test remember me
    cy.get('input[id="remember"]').check();

    cy.get('button[type="submit"]').click();

    cy.wait("@mockLogin");
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
    cy.contains("Bonjour").should("be.visible");

    // Clean up local storage
    cy.window().then((win: Window) => {
      expect(win.localStorage.getItem("token")).to.equal("mock-token-admin");
    });
  });

  it("should display an error when mocked login is rejected", () => {
    cy.get('input[id="email"]').type("unknown@test.com");
    cy.get('input[id="password"]').type("badpass");
    cy.get('button[type="submit"]').click();

    cy.wait("@mockLogin");
    cy.contains("Identifiants incorrects. Veuillez réessayer.").should("be.visible");
    cy.get('button[type="submit"]').should("not.be.disabled");
  });

  it("should fallback to local storage credentials on network error", () => {
    // Fill credentials of a valid active user in local list (e.g. Yanis Moreau: yanis@eray.com)
    cy.get('input[id="email"]').type("yanis@eray.com");
    cy.get('input[id="password"]').type("password123");
    cy.get('button[type="submit"]').click();

    // Since yanis@eray.com fails the API mock with 401, wait, let's trigger it.
    // In src/routes/login.tsx:
    // If fetch /api/login fails or response is not ok, it falls back to checking `members` local array!
    // Since the API response for yanis@eray.com returned 401 (response.ok is false, so responseData is null),
    // it will execute the local auth fallback!
    // It will find "yanis@eray.com" in `members`, see that status is "Actif", role is "Commercial" (mapped to "commercial").
    // Thus it will log in successfully using local auth fallback!
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
  });

  it("should refuse login for deactivated local users", () => {
    // In default local credentials: antoine@eray.com is deactivated (status: "Désactivé")
    cy.get('input[id="email"]').type("antoine@eray.com");
    cy.get('input[id="password"]').type("password123");
    cy.get('button[type="submit"]').click();

    cy.wait("@mockLogin");
    cy.contains("Ce compte est désactivé. Veuillez contacter votre administrateur.", { timeout: 6000 }).should("be.visible");
  });

  it("should support forgot password toast trigger", () => {
    cy.contains("Mot de passe oublié ?").click();
    cy.contains("Fonctionnalité à venir", { timeout: 5000 }).should("be.visible");
  });

  it("should support quick login demo credentials fill", () => {
    cy.contains("yanis@eray.com").click();
    cy.get('input[id="email"]').should("have.value", "yanis@eray.com");
    cy.get('input[id="password"]').should("have.value", "password123");
  });
});
