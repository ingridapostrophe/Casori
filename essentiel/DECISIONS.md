# L'Atelier (49 €) - décisions prises

Nom de la formule : **L'Atelier** (« L'Atelier Casorí - votre site de mariage en 10 minutes »).

Configurateur en ligne : le couple crée son site seul, avec aperçu en direct, puis paie. Ingrid vérifie et publie.

## Validé
- Page visible sur casori.fr. Accroche : « Votre site de mariage en 10 minutes ».
- Prix : 49 €. Paiement par lien Stripe (CGV acceptées avant paiement), numéro de commande transmis.
- Photo et commande reçues via un petit script PHP sur o2switch.
- Aucune modification après validation, sauf coquille.
- Mise en ligne sous 7 jours après paiement.
- Passerelle : les 49 € sont déduits si le couple passe à une formule accompagnée.
- La formule Digital reste à 290 € pour l'instant.
- 6 étapes : Vous deux, Le grand jour, Le programme, Votre style, Les réponses, Vérifier et publier.
- Prénoms en Allura avec animation simple (pas de generer_prenoms.py).
- Palettes : Sauge & rose ancien, Terracotta & sable, Méditerranée & ocre, Bordeaux & champagne.
- Palette personnalisée **incluse** : 2 couleurs (principale + accent), code couleur possible, fond et teintes de texte calculés, lisibilité garantie.
- Motifs définitifs fournis (WebP dans `essentiel/modele/assets/`) : bouquet (« brin », vertical), olivier, bougainvillier (variantes « un coin » et « deux coins en miroir »).
  - À régler au code : bougainvillier plus petit sur tablette (720-1024 px) et sur petits téléphones.
- Icônes au trait (lettre, couple, soleil, vélo) : gardées pour une version suivante.
- Option +10 € : le couple intègre son propre motif.
  - Contrôle à l'envoi : fond transparent OK ; fond blanc -> proposition de retrait automatique ; moins de 500 px -> refus.
  - Placement imposé : au-dessus des prénoms, taille maximale (pas de coins).
  - CGV : le couple garantit disposer des droits sur l'image. Ingrid peut refuser à la vérification.
- Site en ligne jusqu'à 1 an après le mariage.
- Étape 3 : 5 moments maximum, lien Google Maps généré depuis l'adresse, note facultative.
- Étape 5 : date limite + lien Google Form, avec un modèle de formulaire Casorí à copier.

## Avancement
- Phase 1 (modèle de site paramétrable) : `essentiel/modele/` - validée.
- Phase 2 : configurateur. Afficher « Vos couleurs sont très claires, le rendu sera discret » si besoin.

## Stripe (mode test, compte « environnement de test Casori »)
- Catalogue : 13 produits (L'Atelier 49 €, option motif 10 €, Digital 290 €, Complète 590 €, options à la carte).
- Liens de paiement L'Atelier (CGV obligatoires, nom demandé, facture automatique avec mention TVA 293 B, redirection casori.fr/atelier/merci/) :
  - 49 € : https://buy.stripe.com/test_5kQ8wRd8zdZO1rs2MT8Vi00 (plink_1UgMaVPxnxzVbi6OrmbZWK1b)
  - 59 € avec motif : https://buy.stripe.com/test_cNi9AV6Kbf3SeeeevB8Vi01 (plink_1UgMaYPxnxzVbi6OzKvrV2TS)
  - Le configurateur ajoute ?client_reference_id=<n° de commande>&prefilled_email=<e-mail>.
- Paiement test réussi (59 €, facture générée, pied de page validé par Ingrid).
- À faire plus tard, ensemble et écran par écran (à partir de captures d'Ingrid) : factures en A4, délai de paiement des factures manuelles, logo et couleur #B8925A, notification de paiement. Si le réglage A4 est introuvable, le forcer par API sur chaque facture.
- À recréer en mode réel au lancement.

## Ouvert
- Vérifier la licence des visuels issus de Canva.
- Créer le modèle de Google Form Casorí (présence, nombre de personnes, régime alimentaire).
- Valider la maquette complète avant de passer au code.
