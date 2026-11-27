/**
 * Casorí - crée le modèle de formulaire de réponse (RSVP) de l'Atelier - version 2.
 *
 * Mode d'emploi :
 * 1. https://script.google.com > ouvrir le projet existant (ou « Nouveau projet »).
 * 2. Tout effacer, coller ce fichier, Enregistrer (disquette).
 * 3. Fonction « creerModeleCasori » > « Exécuter » (les autorisations sont déjà données).
 * 4. Les liens s'affichent dans le « Journal d'exécution ».
 * Couleurs, police et image d'en-tête se règlent ensuite à la main (icône palette) :
 * Google ne permet pas de les régler par script.
 */
function creerModeleCasori() {
  const form = FormApp.create('Serez-vous des nôtres ?');
  form.setDescription('Merci de répondre avant la date indiquée sur notre site. Une réponse par foyer suffit.')
      .setCollectEmail(false)
      .setAllowResponseEdits(true)
      .setLimitOneResponsePerUser(false)
      .setProgressBar(false)
      .setConfirmationMessage('Merci, votre réponse est bien enregistrée ! À très vite.');

  const nombre = (min) => FormApp.createTextValidation()
      .requireNumberBetween(min, 30)
      .setHelpText('Indiquez un nombre, par exemple 2.')
      .build();

  // Section 1 : qui répond, et est-ce qu'il vient ?
  form.addTextItem().setTitle('Votre nom').setHelpText('Ou celui de votre famille.').setRequired(true);
  const presence = form.addMultipleChoiceItem().setTitle('Serez-vous des nôtres ?').setRequired(true);

  // Section 2 : pour ceux qui viennent
  const sectionVenue = form.addPageBreakItem().setTitle('Votre venue');
  form.addCheckboxItem().setTitle('À quels moments serez-vous présents ?')
      .setChoiceValues(['Cérémonie', "Vin d'honneur", 'Dîner et soirée', 'Brunch du lendemain'])
      .setRequired(true);
  form.addTextItem().setTitle("Nombre d'adultes, en vous comptant").setValidation(nombre(1)).setRequired(true);
  form.addTextItem().setTitle("Nombre d'enfants").setValidation(nombre(0)).setRequired(true);
  form.addParagraphTextItem().setTitle('Prénoms des personnes présentes');
  form.addCheckboxItem().setTitle('Régime alimentaire')
      .setChoiceValues(['Aucun', 'Végétarien', 'Végan', 'Sans gluten'])
      .showOtherOption(true);
  form.addTextItem().setTitle('Allergies à signaler');
  form.addTextItem().setTitle('La chanson qui vous fera danser');

  // Section 3 : pour tout le monde
  const sectionMot = form.addPageBreakItem().setTitle('Un dernier mot');
  form.addParagraphTextItem().setTitle('Un petit mot pour les mariés');

  // « Non » mène directement au petit mot
  presence.setChoices([
    presence.createChoice('Oui, avec joie !', sectionVenue),
    presence.createChoice('Non, malheureusement', sectionMot)
  ]);

  // Partage en lecture seule : les couples ne peuvent qu'en faire une copie
  DriveApp.getFileById(form.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  Logger.log('Pour le modifier (vous seule) : ' + form.getEditUrl());
  Logger.log('Lien « copie » pour le configurateur : https://docs.google.com/forms/d/' + form.getId() + '/copy');
  Logger.log('Lien pour y répondre (test) : ' + form.getPublishedUrl());
}
