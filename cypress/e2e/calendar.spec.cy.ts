/// <reference types="cypress" />

describe("Calendar Page", () => {
  const mockCRMData = {
    clients: [
      {
        id: "client-1",
        name: "Mock Client One",
        company: "Company One",
        email: "one@test.com",
      }
    ],
    activities: [
      {
        id: "mock-act-1",
        type: "call",
        title: "Appel de Qualification",
        client: "Mock Client One",
        owner: "Antoine Roy",
        date: "Aujourd'hui", // July 6, 2026
        time: "10:30",
        duration: "1 heure",
        status: "à faire",
        priority: "medium",
        summary: "Discussion about software integration",
      },
      {
        id: "mock-act-2",
        type: "meeting",
        title: "Réunion d'équipe",
        client: "Mock Client One",
        owner: "Léa Martin",
        date: "Demain", // July 7, 2026
        time: "14:00",
        duration: "2 heures",
        status: "planifié",
        priority: "high",
        summary: "Point sur les opportunités",
      },
      {
        id: "mock-act-3",
        type: "follow-up",
        title: "Relance Contrat",
        client: "Mock Client One",
        owner: "Yanis Moreau",
        date: "2026-07-08",
        time: "09:00",
        duration: "30 min",
        status: "planifié",
        priority: "low",
        summary: "Follow up call",
      }
    ],
    deals: [],
    projects: [],
    clientEvents: [],
    members: [],
  };

  beforeEach(() => {
    cy.visitWithSeed("/calendar", mockCRMData);
  });

  it("should display the calendar page and basic events in week view", () => {
    cy.contains("h1", "Calendrier").should("be.visible");
    cy.contains("Appel de Qualification").should("be.visible");
    cy.contains("Réunion d'équipe").should("be.visible");
    cy.contains("Relance Contrat").should("be.visible");
  });

  it("should switch views (Jour, Semaine, Mois, Liste)", () => {
    // --- DIAGNOSTIC TEMPORAIRE ---
    // On ne sait pas encore quel texte/format le header de semaine affiche
    // réellement. On dump le texte complet de la zone d'en-tête (à adapter
    // si le sélecteur ne correspond pas) pour voir la vraie chaîne de
    // caractères avant de fixer l'assertion définitivement.
    cy.get("body").then(($body) => {
      cy.log("BODY TEXT DUMP", $body.text().slice(0, 2000));
      // eslint-disable-next-line no-console
      console.log("FULL BODY TEXT:", $body.text());
    });
    // Si l'app a un conteneur identifiable pour les en-têtes de jours
    // (à adapter selon le vrai markup, ex: [class*="week-header"],
    // [class*="calendar-header"], thead, etc.) :
    // cy.get('[class*="header"]').invoke("text").then((t) => cy.log("HEADER:", t));
    // --- FIN DIAGNOSTIC ---

    // Week view is default. Check headers.
    // On utilise une regex tolérante aux espaces/retours à la ligne car le
    // jour et le numéro peuvent être dans des noeuds DOM séparés
    // (ex: "LUN\n06" au lieu de "LUN 06" avec un espace simple).
    cy.contains(/LUN\s*06/).should("be.visible");
    cy.contains(/MAR\s*07/).should("be.visible");

    // Switch to Jour view
    cy.contains("button", "Jour").click();
    cy.contains(/LUN\s*06/).should("be.visible");
    cy.contains(/MAR\s*07/).should("not.exist"); // only one day

    // Switch to Mois view
    cy.contains("button", "Mois").click();
    // Mois view shows the grid. July 6 has Appel de Qualification, July 7 has Réunion d'équipe
    cy.get("div")
      .contains(/10:30\s*Appel de Qualification/)
      .should("be.visible");
    cy.get("div")
      .contains(/14:00\s*Réunion d'équipe/)
      .should("be.visible");

    // Switch to Liste view
    cy.contains("button", "Liste").click();
    cy.contains("Appel de Qualification").should("be.visible");
    cy.contains("Réunion d'équipe").should("be.visible");
    cy.contains("Relance Contrat").should("be.visible");
  });

  it("should navigate time using next, prev, and today buttons", () => {
    // In Week view, next button goes to next week
    cy.get("button").find(".lucide-chevron-right").parent().click();
    cy.contains("13 – 19 juillet 2026").should("be.visible");
    cy.contains("Appel de Qualification").should("not.exist");

    // Click Today/Aujourd'hui to go back to initial week
    cy.contains("button", "Aujourd'hui").click();
    cy.contains("6 – 12 juillet 2026").should("be.visible");
    cy.contains("Appel de Qualification").should("be.visible");

    // Prev button goes to previous week
    cy.get("button").find(".lucide-chevron-left").parent().click();
    cy.contains("29 juin – 5 juillet 2026").should("be.visible");
    cy.contains("Appel de Qualification").should("not.exist");
  });

  it("should allow navigating via custom date picker input", () => {
    cy.get('input[type="date"]').type("2026-07-15");
    cy.contains("13 – 19 juillet 2026").should("be.visible");

    // Clear date picker
    cy.get('button[title="Effacer la date"]').click();
    cy.contains("6 – 12 juillet 2026").should("be.visible");
  });

  it("should filter events by type using popover menu", () => {
    cy.contains("button", "Activités").click();

    // Deselect 'Appels' (Appel de Qualification should disappear)
    cy.contains("button", "Appels").click();
    cy.contains("Appel de Qualification").should("not.exist");
    cy.contains("Réunion d'équipe").should("be.visible");

    // Select 'Aucun' to hide all
    cy.contains("button", "Aucun").click();
    cy.contains("Réunion d'équipe").should("not.exist");
    cy.contains("Relance Contrat").should("not.exist");

    // Select 'Tout' to show all
    cy.contains("button", "Tout").click();
    cy.contains("Appel de Qualification").should("be.visible");
    cy.contains("Réunion d'équipe").should("be.visible");
    cy.contains("Relance Contrat").should("be.visible");
  });

  it("should open event details popover on click and click internal action button", () => {
    cy.contains("Appel de Qualification").click();

    // Popover details should appear
    cy.get(".font-display").contains("Appel de Qualification").should("be.visible");
    cy.contains("Mock Client One").should("be.visible");
    cy.contains("10:30 – 11:30").should("be.visible");

    // Click 'Voir la fiche' action button
    cy.contains("Voir la fiche").click();
  });

  it("should allow creating a new event through dialog, with validation and cancellation", () => {
    // Open NewEventDialog
    cy.contains("button", "Événement").click();
    cy.contains("Créer un événement").should("be.visible");

    // Check cancellation
    cy.contains("button", "Annuler").click();
    cy.contains("Créer un événement").should("not.exist");

    // Open again
    cy.contains("button", "Événement").click();

    // Select Type: Tâche
    cy.contains("button", "Tâche").click();

    // Fill details
    cy.get('input[name="title"]').type("Tâche Cypress Test");
    cy.get('input[name="client"]').type("Mock Client One");
    cy.get('select[name="duration"]').select("30 min");
    cy.get('input[name="date"]').type("2026-07-09");
    cy.get('input[name="time"]').type("11:00");

    // Set custom reminder
    cy.get("select").eq(1).select("custom");
    cy.get('input[type="number"]').clear().type("15");
    cy.get("select").eq(2).select("minutes");

    // Toggle reminder channels
    cy.contains("button", "Email").click(); // activate
    cy.contains("button", "SMS").click(); // activate

    cy.get('textarea[name="notes"]').type("Notes for the test event.");

    // Le bouton de soumission peut se trouver hors du viewport visible du
    // dialog (conteneur scrollable) : on le scroll dans la vue avant de
    // cliquer, avec { force: true } en filet de sécurité si un élément
    // (overlay, ombre du footer sticky, etc.) chevauche visuellement le
    // centre du bouton sans réellement bloquer l'interaction.
    cy.contains("button", "Créer l'événement").scrollIntoView().click({ force: true });

    // Check success notification
    cy.contains("Événement ajouté au calendrier", { timeout: 10000 }).should(
      "be.visible"
    );
    cy.contains("Tâche Cypress Test").should("be.visible");
  });

  it("should handle empty state in ListView", () => {
    // Switch to List view
    cy.contains("button", "Liste").click();
    cy.contains("Appel de Qualification").should("be.visible");

    // Open filter popover and select 'Aucun'
    cy.contains("button", "Activités").click();
    cy.contains("button", "Aucun").click();

    // Verify empty state message
    cy.contains("Aucun événement pour ces filtres.").should("be.visible");
  });
});