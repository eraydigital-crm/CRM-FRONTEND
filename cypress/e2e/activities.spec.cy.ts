/// <reference types="cypress" />

describe("Activities Page with Mocked Data", () => {
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
    ],
    activities: [
      {
        id: "mock-act-1",
        type: "call",
        title: "Appel de Qualification",
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
        type: "email",
        title: "Envoi Devis Alpha",
        client: "Mock Prospect One",
        owner: "Antoine Roy",
        date: "Hier",
        time: "14:00",
        status: "terminé",
        priority: "high",
        summary: "Sent proposal via mail",
      },
    ],
    deals: [],
    projects: [],
    clientEvents: [],
    members: [],
  };

  beforeEach(() => {
    cy.visitWithSeed("/activities", mockCRMData);
    cy.get("select").first().select("Léa Martin");
  });

  it("should display the activities list from mock data", () => {
    cy.get("h1").should("contain.text", "Activités");
    cy.contains("Appel de Qualification").should("be.visible");
    cy.contains("Envoi Devis Alpha").should("be.visible");
  });

  it("should filter activities by clicking type buttons", () => {
    cy.contains("button", "Appel").click();
    cy.contains("Appel de Qualification").should("be.visible");
    cy.contains("Envoi Devis Alpha").should("not.exist");
    cy.contains("button", "Email").click();
    cy.contains("Envoi Devis Alpha").should("be.visible");
    cy.contains("Appel de Qualification").should("not.exist");
  });

  it("should filter activities by search text query", () => {
    cy.get('input[placeholder*="Rechercher live"]').type("Devis");
    cy.wait(400);
    cy.contains("Envoi Devis Alpha").should("be.visible");
    cy.contains("Appel de Qualification").should("not.exist");
  });

  it("should allow creating a new activity, testing reminder and cancellation", () => {
    cy.contains("button", "Nouvelle activité").click();
    cy.contains("Créer une activité").should("be.visible");

    cy.contains("button", "Annuler").click();
    cy.contains("Créer une activité").should("not.exist");

    cy.contains("button", "Nouvelle activité").click();
    cy.contains("button", "RDV").click();

    cy.get('input[name="title"]').type("RDV Démo Client");
    cy.get('input[name="client"]').clear().type("Mock Prospect One");
    cy.get('input[name="owner"]').clear().type("Léa Martin");
    cy.get('input[name="time"]').type("16:30");

    cy.get("form select").first().select("custom");
    cy.get('input[type="number"]').clear().type("2");
    cy.get("form select").eq(1).select("heures");
    cy.contains("button", "SMS").click();

    cy.get('textarea[name="notes"]').type("Notes for the new activity.");

    // Soumission avec force + submit du formulaire
    cy.contains("button", "Créer").click({ force: true });
    cy.get("form").submit();

    // Vérification
    cy.contains("Activité et opportunité créées", { timeout: 10000 }).should(
      "be.visible"
    );
    cy.contains("RDV Démo Client").should("be.visible");
  });

  it("should allow toggling status of an activity (Terminer/Rouvrir)", () => {
    // On clique sur "Terminer" en forçant
    cy.contains("Appel de Qualification")
      .parents(".group")
      .contains("button", "Terminer")
      .click({ force: true });

    // Cypress retry automatiquement les commandes cy.contains() / .should()
    // jusqu'au timeout indiqué : pas besoin (et pas possible) de faire
    // .then().catch() sur des commandes Cypress, qui ne sont pas de vraies
    // Promises chaînables. On vérifie directement l'état final attendu :
    // le bouton "Rouvrir" doit être présent après le changement de statut.
    cy.contains("Appel de Qualification")
      .parents(".group")
      .contains("button", "Rouvrir", { timeout: 15000 })
      .should("exist");
  });

  it("should view details, modify, and delete an activity using action dropdown", () => {
    // 1. View Details
    cy.contains("Appel de Qualification")
      .parents(".group")
      .find("button.h-6.w-6")
      .click({ force: true });

    cy.contains("Voir les détails").click();
    cy.contains("Détails de l'activité").should("be.visible");
    cy.contains("Discussion about software integration").should("be.visible");

    // Fermeture de la modale en cliquant sur l'overlay
    cy.get('[role="dialog"]').parent().click({ force: true });

    // 2. Modify Activity
    cy.contains("Appel de Qualification")
      .parents(".group")
      .find("button.h-6.w-6")
      .click({ force: true });

    cy.contains("Modifier").click();
    cy.contains("Modifier l'activité").should("be.visible");
    cy.get('input[value="Appel de Qualification"]')
      .clear()
      .type("Appel de Qualification Modifié");

    // Sélection robuste du select "priorité" : au lieu de se fier à un index
    // de position fragile (ex: .eq(0), qui peut viser le mauvais select si
    // l'ordre des champs change), on cherche dynamiquement le <select> qui
    // contient une option correspondant à "priorité haute", quel que soit
    // le libellé/valeur exact utilisé par le composant (FR/EN, casse, etc.)
    // -> Idéalement, ajouter name="priority" sur ce select dans le composant
    //    pour pouvoir écrire directement :
    //    cy.get('div[role="dialog"] select[name="priority"]').select("high");
    const highPriorityCandidates = [
      "high",
      "High",
      "HIGH",
      "haute",
      "Haute",
      "HAUTE",
      "élevée",
      "Élevée",
      "elevee",
    ];

    cy.get('div[role="dialog"] select').then(($selects) => {
      let prioritySelect: HTMLSelectElement | undefined;
      let matchedValue: string | undefined;

      [...$selects].forEach((el) => {
        const select = el as HTMLSelectElement;
        const options = [...select.options];
        const match = options.find((o) =>
          highPriorityCandidates.includes(o.value) ||
          highPriorityCandidates.includes(o.text.trim())
        );
        if (match) {
          prioritySelect = select;
          matchedValue = match.value || match.text.trim();
        }
      });

      if (!prioritySelect) {
        // Debug : on liste tous les selects/options disponibles dans la
        // modale pour identifier le bon libellé à ajouter dans
        // highPriorityCandidates ci-dessus.
        [...$selects].forEach((el, i) => {
          const select = el as HTMLSelectElement;
          const opts = [...select.options].map(
            (o) => `value="${o.value}" text="${o.text.trim()}"`
          );
          cy.log(`select[${i}] name="${select.name}" options: ${opts.join(", ")}`);
        });
      }

      expect(
        prioritySelect,
        "select de priorité introuvable — voir cy.log ci-dessus pour les options réelles"
      ).to.exist;

      cy.wrap(prioritySelect as HTMLSelectElement).select(matchedValue as string);
    });

    cy.contains("button", "Enregistrer").click();

    cy.contains("Activité mise à jour", { timeout: 10000 }).should(
      "be.visible"
    );
    cy.contains("Appel de Qualification Modifié").should("be.visible");

    // 3. Delete Activity
    cy.contains("Appel de Qualification Modifié")
      .parents(".group")
      .find("button.h-6.w-6")
      .click({ force: true });

    cy.contains("Supprimer").click();
    cy.contains("Activité supprimée", { timeout: 10000 }).should(
      "be.visible"
    );
    cy.contains("Appel de Qualification Modifié").should("not.exist");
  });

  it("should support advanced and smart filters", () => {
    cy.contains("button", "Retards").click();
    cy.contains("Envoi Devis Alpha").should("not.exist");
    cy.contains("button", "Retards").click();

    cy.contains("button", "Filtres").click();
    cy.get("select").eq(1).select("terminé");
    cy.contains("Envoi Devis Alpha").should("be.visible");
    cy.contains("Appel de Qualification").should("not.exist");

    cy.get("select").eq(2).select("high");
    cy.contains("Envoi Devis Alpha").should("be.visible");

    cy.get("select").eq(3).select("Antoine Roy");
    cy.contains("Envoi Devis Alpha").should("be.visible");

    cy.contains("button", "Effacer").click();
    cy.contains("Appel de Qualification").should("be.visible");
    cy.contains("Envoi Devis Alpha").should("be.visible");
  });

  it("should handle lazy loading timeline trigger", () => {
    cy.contains("Défiler ou cliquer pour charger").click();
  });
});