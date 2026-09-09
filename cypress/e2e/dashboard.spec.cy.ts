// cypress/e2e/dashboard.spec.cy.ts

describe("CRM Dashboard with Mocked Data", () => {
  const mockCRMData = {
    clients: [
      {
        id: "mock-client-1",
        name: "Mock Prospect One",
        company: "Alpha Tech",
        role: "CTO",
        email: "alpha@test.com",
        phone: "+261340000001",
        city: "Antananarivo",
        sector: "Tech",
        owner: "Antoine Roy",
        status: "prospect",
        priority: "high",
        tags: ["Test", "Lead"],
        value: 150000,
        lastContact: "10/08/2026",
        initials: "MP",
        color: "indigo",
      },
      {
        id: "mock-client-2",
        name: "Mock Client Two",
        company: "Beta Services",
        role: "CEO",
        email: "beta@test.com",
        phone: "+261340000002",
        city: "Antsirabe",
        sector: "Finance",
        owner: "Antoine Roy",
        status: "actif",
        priority: "medium",
        tags: ["VIP"],
        value: 450000,
        lastContact: "09/08/2026",
        initials: "MC",
        color: "emerald",
      },
    ],
    activities: [
      {
        id: "mock-act-1",
        type: "call",
        title: "Test Quick Call",
        client: "Mock Prospect One",
        owner: "Antoine Roy",
        date: "Aujourd'hui",
        time: "10:30",
        status: "à faire",
        priority: "medium",
        summary: "Discussion about software integration",
      },
      {
        id: "mock-act-2",
        type: "meeting",
        title: "Test Design Sync",
        client: "Mock Client Two",
        owner: "Léa Martin",
        date: "Demain",
        time: "14:00",
        status: "planifié",
        priority: "high",
        summary: "Verify contract details",
      },
    ],
    deals: [
      {
        id: "mock-deal-1",
        client: "Mock Client Two",
        company: "Beta Services",
        amount: 8000000, // 8,000,000 MGA -> 8000 K MGA
        probability: 100,
        owner: "Antoine Roy",
        lastActivity: "Rendez-vous",
        nextAction: "None",
        closeDate: "2026-08-15",
        stage: "Vente gagnée",
      },
      {
        id: "mock-deal-2",
        client: "Mock Prospect One",
        company: "Alpha Tech",
        amount: 3500000, // 3,500,000 MGA -> 3500 K MGA
        probability: 40,
        owner: "Antoine Roy",
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
    // Visit the home route (dashboard) with the seed data loaded in localStorage
    cy.visitWithSeed("/", mockCRMData);
  });

  it("should load the dashboard and show correct welcome message", () => {
    cy.get("h1").should("contain.text", "Bonjour Adem Eray");
  });

  it("should calculate and render correct dynamic KPI statistics based on mock data", () => {
    // Prospects: 1 prospect in mock data
    cy.contains("Prospects")
      .siblings()
      .last()
      .should("contain.text", "1");

    // Clients actifs: 1 active client in mock data
    cy.contains("Clients actifs")
      .siblings()
      .last()
      .should("contain.text", "1");

    // Opportunités gagnées: 1 "Vente gagnée" deal
    cy.contains("Opportunités gagnées")
      .siblings()
      .last()
      .should("contain.text", "1");

    // Opportunités perdues: 0 in mock data
    cy.contains("Opportunités perdues")
      .siblings()
      .last()
      .should("contain.text", "0");

    // CA potentiel: total amount of deals = 8,000,000 + 3,500,000 = 11,500,000 -> 11500 K MGA
    cy.contains("CA potentiel")
      .siblings()
      .last()
      .should("contain.text", "11500 K MGA");

    // CA signé: amount of won deals = 8,000,000 -> 8000 K MGA
    cy.contains("CA signé")
      .siblings()
      .last()
      .should("contain.text", "8000 K MGA");
  });

  it("should list tasks and recent activities matching the seed data", () => {
    // Check 'Tâches du jour' contains our mocked activity title
    cy.contains("Tâches du jour").should("be.visible");
    cy.contains("Test Quick Call").should("be.visible");
    cy.contains("Mock Prospect One • 10:30").should("be.visible");

    // Check 'Activités récentes' contains the mocked activities
    cy.contains("Activités récentes").should("be.visible");
    cy.contains("Test Quick Call").should("be.visible");
  });
});
