/// <reference types="cypress" />

describe("App Topbar and Quick Create Dialogs", () => {
  const mockCRMData = {
    clients: [],
    activities: [],
    deals: [],
    projects: [],
    clientEvents: [],
    members: [],
  };

  beforeEach(() => {
    cy.visitWithSeed("/", mockCRMData, {
      token: "admin-cypress-token",
      role: "admin",
      name: "Antoine Roy",
    });
  });

  it("should render topbar elements, including user info, notifications, and companies", () => {
    cy.contains("Antoine Roy").should("be.visible");
    cy.contains("Administrateur").should("be.visible");
    cy.get('img[alt="Eray Logo"]').should("be.visible");
  });

  it("should support search query and update search parameters in URL", () => {
    cy.get('input[id="topbar-search"]').type("test search query");
    cy.url().should("match", /\?q=test(%20|\+)search(%20|\+)query$/);
  });

  it("should switch companies from company dropdown", () => {
    cy.get('[data-cy="company-menu-trigger"]').click();
    cy.get('[data-cy="company-menu-content"]').should("be.visible");
    cy.contains("Eray Digital EU").should("be.visible");
    cy.contains("Atelier Interne").should("be.visible").click();
  });

  it("should toggle application theme (Clair / Sombre)", () => {
    // Check initial or toggle theme
    cy.get('button[aria-label="Changer de thème"]').click();
    cy.window().then((win) => {
      const isDark = win.document.documentElement.classList.contains("dark");
      expect(win.localStorage.getItem("theme")).to.equal(isDark ? "Sombre" : "Clair");
    });

    // Toggle again
    cy.get('button[aria-label="Changer de thème"]').click();
    cy.window().then((win) => {
      const isDark = win.document.documentElement.classList.contains("dark");
      expect(win.localStorage.getItem("theme")).to.equal(isDark ? "Sombre" : "Clair");
    });
  });

  it("should support quick-create actions menu and launch each dialog", () => {
    // 1. Quick client
    cy.contains("button", "Nouveau").click();
    cy.contains("+ Nouveau client").click();
    cy.contains("Créer un client").should("be.visible");
    cy.contains("button", "Annuler").click();

    // 2. Quick activity
    cy.contains("button", "Nouveau").click();
    cy.contains("+ Activité").click();
    cy.contains("Créer une activité").should("be.visible");
    cy.contains("button", "Annuler").click();

    // 3. Quick event
    cy.contains("button", "Nouveau").click();
    cy.contains("+ Rendez-vous").click();
    cy.contains("Créer un événement").should("be.visible");
    cy.contains("button", "Annuler").click();

    // 4. Quick opportunity
    cy.contains("button", "Nouveau").click();
    cy.contains("+ Opportunité").click();
    cy.contains("Créer une opportunité").should("be.visible");
    cy.contains("button", "Annuler").click();

    // 5. Quick project
    cy.contains("button", "Nouveau").click();
    cy.contains("+ Projet").click();
    cy.contains("Créer un projet").should("be.visible");
    cy.contains("button", "Annuler").click();
  });

  it("should allow logout from avatar dropdown menu", () => {
    cy.contains("Antoine Roy").click();
    cy.contains("Se déconnecter").click();
    
    // Check redirect to login screen
    cy.url().should("include", "/login");
    
    // Check tokens cleared
    cy.window().then((win) => {
      expect(win.localStorage.getItem("token")).to.be.null;
      expect(win.sessionStorage.getItem("token")).to.be.null;
    });
  });
});
