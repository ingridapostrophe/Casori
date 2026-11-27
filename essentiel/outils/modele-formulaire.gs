/**
 * Casorí - crée le modèle de formulaire de réponse (RSVP) de l'Atelier.
 *
 * Mode d'emploi :
 * 1. Aller sur https://script.google.com (compte Google de Casorí) > « Nouveau projet ».
 * 2. Tout effacer, coller ce fichier, cliquer sur la disquette (Enregistrer).
 * 3. Choisir la fonction « creerModeleCasori » en haut, puis cliquer sur « Exécuter ».
 * 4. Accepter les autorisations demandées (Formulaires et Drive de votre compte).
 * 5. Les liens s'affichent dans le « Journal d'exécution » en bas.
 */
function creerModeleCasori() {
  const form = FormApp.create('Serez-vous des nôtres ?');
  form.setDescription('Merci de répondre avant la date indiquée sur notre site. Une réponse par foyer suffit.')
      .setCollectEmail(false)
      .setAllowResponseEdits(true)
      .setLimitOneResponsePerUser(false)
      .setProgressBar(false)
      .setConfirmationMessage('Merci, votre réponse est bien enregistrée ! À très vite.');

  // Section 1 : qui répond, et est-ce qu'il vient ?
  form.addTextItem().setTitle('Vos prénom et nom').setRequired(true);
  const presence = form.addMultipleChoiceItem().setTitle('Serez-vous des nôtres ?').setRequired(true);

  // Section 2 : pour ceux qui viennent
  const sectionVenue = form.addPageBreakItem().setTitle('Votre venue');
  form.addListItem().setTitle('Combien serez-vous, en vous comptant ?')
      .setChoiceValues(['1', '2', '3', '4', '5', '6']).setRequired(true);
  form.addParagraphTextItem().setTitle('Prénoms des personnes qui vous accompagnent');
  form.addParagraphTextItem().setTitle('Allergies ou régime alimentaire particulier');

  // Section 3 : pour tout le monde
  const sectionMot = form.addPageBreakItem().setTitle('Un dernier mot');
  form.addParagraphTextItem().setTitle('Un petit mot pour les mariés');

  // « Non » mène directement au petit mot, sans les questions de venue
  presence.setChoices([
    presence.createChoice('Oui, avec joie !', sectionVenue),
    presence.createChoice('Non, malheureusement', sectionMot)
  ]);

  // Partage en lecture seule : les couples ne peuvent qu'en faire une copie
  const fichier = DriveApp.getFileById(form.getId());
  fichier.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const modifier = form.getEditUrl();
  const copie = 'https://docs.google.com/forms/d/' + form.getId() + '/copy';
  Logger.log('Formulaire créé.');
  Logger.log('Pour le modifier (vous seule) : ' + modifier);
  Logger.log('Lien « copie » pour le configurateur : ' + copie);
  Logger.log('Lien pour y répondre (test) : ' + form.getPublishedUrl());
}
