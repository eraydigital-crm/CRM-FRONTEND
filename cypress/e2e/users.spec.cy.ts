/// <reference types="cypress" />

describe("Users Page", () => {
  const mockCRMData = {
    clients: [],
    activities: [],
    deals: [],
    projects: [],
    clientEvents: [],
    members: [
      {
        id: "u1",
        name: "Adem Eray",
        role: "Administrateur",
        email: "admin@eray.com",
        phone: "+33 6 12 45 78 90",
        team: "Direction",
        status: "Actif",
        initials: "AE",
        lastActive: "En ligne",
      },
      {
        id: "u2",
        name: "Yanis Moreau",
        role: "Commercial",
        email: "yanis@eray.com",
        phone: "+33 6 74 09 33 21",
        team: "Ventes B2B",
        status: "Actif",
        initials: "YM",
        lastActive: "il y a 1 h",
      },
      {
        id: "u3",
        name: "Léa Martin",
        role: "Manager",
        email: "lea@eray.com",
        phone: "+33 6 11 22 33 44",
        team: "Direction",
        status: "Actif",
        initials: "LM",
        lastActive: "En ligne",
      },
      {
        id: "u4",
        name: "Chloé Bernard",
        role: "Commercial",
        email: "chloe@eray.com",
        phone: "+33 6 55 66 77 88",
        team: "Ventes B2B",
        status: "Invité",
        initials: "CB",
        lastActive: "Jamais",
      },
      {
        id: "u5",
        name: "Antoine Roy",
        role: "Commercial",
        email: "antoine@eray.com",
        phone: "+33 6 99 88 77 66",
        team: "Grands comptes",
        status: "Désactivé",
        initials: "AR",
        lastActive: "il y a 2 j",
      }
    ],
  };

  beforeEach(() => {
    cy.visitWithSeed("/users", mockCRMData);
  });

  it("should render the users page and display user list", () => {
    cy.contains("Utilisateurs").should("be.visible");
    cy.contains("Adem Eray").should("be.visible");
    cy.contains("Yanis Moreau").should("be.visible");
  });

  it("should filter users by search input text", () => {
    cy.get('input[placeholder*="Rechercher un membre"]').type("Yanis");
    cy.contains("Yanis Moreau").should("be.visible");
    cy.get("tbody").contains("tr", "Adem Eray").should("not.exist");

    // Search with no results
    cy.get('input[placeholder*="Rechercher un membre"]').clear().type("NonExistentMember");
    cy.get("tbody").contains("tr", "Yanis Moreau").should("not.exist");
    cy.contains("Affichage 0–0 sur 0").should("be.visible");
  });

  it("should filter users by role, team, and status, and reset filters", () => {
    // Filter by Role: Administrateur
    cy.get("select").eq(0).select("Administrateur");
    cy.get("tbody").contains("tr", "Adem Eray").should("be.visible");
    cy.get("tbody").contains("tr", "Yanis Moreau").should("not.exist");

    // Filter by Status: Actif
    cy.get("select").eq(1).select("Actif");
    
    // Filter by Team: Direction
    cy.get("select").eq(2).select("Direction");
    cy.get("tbody").contains("tr", "Adem Eray").should("be.visible");

    // Reset filters
    cy.contains("button", "Réinitialiser").click();
    cy.get("tbody").contains("tr", "Adem Eray").should("be.visible");
    cy.get("tbody").contains("tr", "Yanis Moreau").should("be.visible");
  });

  it("should invite a new member with validation and cancellation", () => {
    const email = `new.invite+${Date.now()}@eray.com`;

    cy.contains("Inviter un membre").click();
    cy.contains("Inviter un nouveau membre").should("be.visible");

    // Cancel invitation
    cy.contains("button", "Annuler").click();
    cy.contains("Inviter un nouveau membre").should("not.exist");

    // Invite for real
    cy.contains("Inviter un membre").click();
    cy.get("#email").type(email);
    cy.get("#phone").type("+33612345678");
    cy.get("#role").select("Commercial");
    cy.contains("button", "Envoyer l'invitation").click();

    // Verify presence in list (will be prepended)
    cy.contains(email).should("be.visible");
    cy.contains("Nouvel Utilisateur").should("be.visible");
  });

  it("should show details dialog on Eye button click and close it", () => {
    cy.get('button[data-cy="user-details-btn"]').first().click();
    cy.get('[role="dialog"]').should('be.visible').within(() => {
      cy.contains("Détails du membre").should("be.visible");
      cy.contains("admin@eray.com").should("be.visible");
      cy.contains("Administrateur").should("be.visible");
      // Close modal
      cy.get('button[aria-label="Fermer"]').first().click({ force: true });
    });
    cy.contains("Détails du membre").should("not.exist");
  });

  it("should edit member details, modify fields, save and cancel", () => {
    // Open edit dialog
    cy.get('button[data-cy="user-edit-btn"]').first().click();
    cy.contains("Modifier le membre").should("be.visible");

    // Cancel edit
    cy.contains("button", "Annuler").click();
    cy.contains("Modifier le membre").should("not.exist");

    // Edit and Save
    cy.get('button[data-cy="user-edit-btn"]').first().click();
    cy.get('input[value="Adem Eray"]').clear().type("Adem Eray Modifié");
    cy.get('input[value="+33 6 12 45 78 90"]').clear().type("+33600000000");
    cy.get("select").eq(3).select("Manager");
    cy.get("select").eq(4).select("Grands comptes");
    
    cy.contains("button", "Enregistrer").click();
    cy.contains("Adem Eray Modifié").should("be.visible");
  });

  it("should reset password, toggle status, and delete member using row actions", () => {
    // 1. Password reset
    cy.get('button[title="Réinitialiser le mot de passe"]').first().click();
    cy.contains("Réinitialisation du mot de passe de Adem Eray").should("exist");

    // 2. Toggle status (Active -> Inactive)
    cy.get('button[title="Désactiver"]').first().click();
    cy.contains("Statut mis à jour").should("exist");
    
    // Verify badge status updated
    cy.contains("Désactivé").should("be.visible");

    // Toggle back (Inactive -> Active)
    cy.get('button[title="Activer"]').first().click();
    cy.contains("Statut mis à jour").should("exist");

    // 3. Delete member
    cy.contains("Yanis Moreau")
      .parents("tr")
      .find('button[title="Supprimer"]')
      .click();

    cy.contains("Yanis Moreau").should("not.exist");
  });

  it("should paginate through the members list", () => {
    // Total members = 5. Items per page = 4.
    cy.contains("Affichage 1–4 sur 5").should("be.visible");
    cy.contains("Suivant").click();
    cy.contains("Affichage 5–5 sur 5").should("be.visible");
    cy.contains("Antoine Roy").should("be.visible");

    cy.contains("Précédent").click();
    cy.contains("Affichage 1–4 sur 5").should("be.visible");
  });
});
