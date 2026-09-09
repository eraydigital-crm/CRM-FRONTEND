/// <reference types="cypress" />

describe("Pipeline Page", () => {
  const mockCRMData = {
    clients: [],
    activities: [],
    deals: [
      {
        id: "deal-1",
        client: "Mock Client Two",
        company: "Beta Services",
        amount: 8000000,
        probability: 100,
        owner: "Antoine Roy",
        lastActivity: "Rendez-vous",
        nextAction: "Relancer",
        closeDate: "2026-08-15",
        stage: "Vente gagnée",
      },
      {
        id: "deal-2",
        client: "Mock Prospect One",
        company: "Alpha Tech",
        amount: 3500000,
        probability: 40,
        owner: "Léa Martin",
        lastActivity: "Appel",
        nextAction: "Envoyer devis",
        closeDate: "2026-09-01",
        stage: "Qualification",
      },
    ],
    projects: [],
    clientEvents: [],
    members: [],
  };

  beforeEach(() => {
    cy.visitWithSeed("/pipeline", mockCRMData);
  });

  it("should display the pipeline page and deals", () => {
    cy.contains("Pipeline commercial").should("be.visible");
    cy.contains("Mock Client Two").should("exist");
    cy.contains("Mock Prospect One").should("be.visible");
  });

  it("should filter deals by search query", () => {
    cy.get('input[placeholder*="Rechercher un client"]').type("Beta Services");
    cy.contains("Mock Client Two").should("exist");
    cy.contains("Mock Prospect One").should("not.exist");
  });
});
