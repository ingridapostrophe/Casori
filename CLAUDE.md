# CLAUDE.md - Projet Casorí

Ce fichier donne à Claude Code tout le contexte du projet Casorí. Il est à placer à la racine du dossier de travail (à côté des dossiers des thèmes et du site vitrine). Claude Code le lit automatiquement à chaque session.

Langue de travail : français. Toujours utiliser des tirets simples (-), jamais de tirets cadratins.

---

## 1. Le projet en bref

- **Casorí** (casori.fr) : service de mini-sites de mariage sur mesure et de faire-part assortis (papier + digital), basé à Perpignan, en Pays catalan.
- Créé et géré entièrement par **Ingrid Andriessens**, professionnelle de la communication (auto-entreprise). Elle gère seule la relation client, la direction créative et toute la partie technique. Ne jamais lui suggérer de déléguer à un développeur.
- Activité complémentaire à ses autres activités.
- **Différenciation** : le multilingue (FR / ES / CA / EN) ancré dans la culture catalane, l'ancrage local, une interlocutrice unique qui s'occupe de tout.
- **Acquisition** : digital d'abord (SEO + Instagram @casori.mariages), plus des partenariats B2B (apport d'affaires avec commission, ou échange de recommandations).

## 2. Identité de marque (constantes non négociables)

| Élément | Valeur |
|---|---|
| Nom | Casorí (accent sur le « í », affiché en doré) - domaine sans accent : casori.fr |
| Doré | **#B8925A** - ne change jamais |
| Fond crème | #FBF8F3 |
| Encre | #1A1A1A |
| Polices | Fraunces (titres / corps du site vitrine), Inter (texte site vitrine), Allura (prénoms calligraphiés) |
| Logo | wordmark où le « o » est remplacé par deux anneaux entrelacés (un encre #1A1A1A, un doré #B8925A), vrai effet de tissage. Variantes SVG en Fraunces 900 et DM Serif Display |
| Photos | crédit photographe Nicolas Casas (nicolas-casas.fr), cité sur tout le site |
| Contact | contact@casori.fr - WhatsApp pro wa.me/33745250783 - Instagram « casori.mariages » (affiché sans @) |

## 3. Hébergement et déploiement

- Hébergeur : **o2switch** (cPanel), domaine casori.fr, HTTPS via Let's Encrypt.
- Site vitrine dans `public_html/`.
- Thèmes de démo, chacun sur son sous-domaine : `minimalist.casori.fr`, `dolce-vita.casori.fr`, `floral.casori.fr`, `catalan.casori.fr`, `tramonto.casori.fr`.
- Sites des couples : sous-domaine `mariages.casori.fr/nom-du-couple/`, avec une racine **séparée** de `public_html` (ex. `/home/identifiant/mariages.casori.fr/`), pour ne jamais les effacer lors d'une mise à jour du site vitrine. Prévoir un `robots.txt` qui bloque l'indexation des sites de couples.
- **Protocole de déploiement** : Ingrid supprime tous les fichiers existants du dossier puis extrait une archive .zip neuve. On ne remplace jamais les fichiers un par un. À préserver : `.htaccess`, le fichier de vérification Google, les vraies images dans `assets/`.
- Donc : **livrer chaque site sous forme d'archive .zip** (index.html + style.css + assets/).
- Google Tag Manager (GTM-5S27B7LQ) uniquement sur la page d'accueil française du site vitrine. Google Search Console avec sitemap multilingue soumis.
- Brevo authentifié sur casori.fr (DKIM, DMARC). Attention à ne pas casser l'enregistrement SPF de contact@casori.fr. Dans la zone DNS cPanel d'o2switch, le champ « Nom » n'accepte pas `@` : utiliser `casori.fr.` (avec le point final).

## 4. Règles de code (à respecter systématiquement)

1. **Toujours un fichier CSS séparé du HTML.** Jamais de CSS intégré dans le HTML.
2. **Tout le contenu propre au couple regroupé dans un bloc clairement identifié en bas du fichier HTML**, séparé de la logique de design : date via `TARGET`, prénoms et infos via `COUPLE`, toutes les traductions via `I18N` (attributs `data-t` dans le HTML).
3. **Chemins relatifs** (`assets/...`) pour que les sites se déplacent sans modification.
4. **Polices auto-hébergées** en WOFF2 via `@font-face` (pas de lien Google Fonts, pour le RGPD et pour un rendu fiable). Récupération des TTF sur `raw.githubusercontent.com/google/fonts/main/ofl/<police>/`, conversion WOFF2 avec fontTools (`TTFont(...).flavor='woff2'`, nécessite le paquet `brotli`).
5. **RSVP** : sur les sites de couples, le formulaire reste en démo (animation « Merci ») avec un commentaire dans le code qui indique où ira le mécanisme d'envoi. Pas de Formspree sur les sites de couples. Alternative utilisée : bouton vers un Google Form du couple.
6. **Formspree** (`xnpagddy`) uniquement pour le formulaire de contact du site vitrine.
7. **Prénoms calligraphiés en SVG** : changer les prénoms d'un couple impose de régénérer le `names.svg`. Le signaler à Ingrid de façon proactive.
8. Mobile : vérifier le débordement horizontal, alléger les animations (moins de tracés), possibilité de désactiver l'effet « dessin à la plume » sous 720 px en gardant les animations en boucle.

### Outils techniques déjà au point

- **`generer_prenoms.py`** : génère les prénoms calligraphiés (police Allura) avec une animation d'écriture naturelle. Méthode : contours des glyphes aplatis via un `BasePen` de fontTools, rastérisation PIL, squelettisation `skimage.morphology.skeletonize`, tracé du squelette en polylignes ordonnées (extrémité la plus à gauche d'abord) qui pilotent une animation SVG par masque. Constante `VITESSE` (unités/seconde, ~9000 pour ~4,5 s sur deux prénoms). Les approches « révélation de gauche à droite » et « contour vide qui se remplit » ont été **refusées**.
- Logo et SVG : pipeline fontTools + cairosvg.
- Aperçus : Playwright pour des captures desktop (1280x800) et mobile (390x844).
- Images PNG : le découpage automatique par analyse de densité ne marche pas bien. Demander des éléments déjà séparés ou des coordonnées de recadrage précises.

## 5. Le site vitrine (casori.fr) - en ligne

- Multilingue : français à la racine, sous-dossiers `ca/`, `es/`, `en/`. Pages : Accueil, Formules, Contact, Mentions légales, Partenaires (Col·laboradors). Balises hreflang.
- Sélecteur de langue : badge doré cliquable.
- **Trois niveaux de langues à ne pas confondre** :
  - le site vitrine existe en FR / CA / ES / EN ;
  - Ingrid répond aux clients en FR / ES / EN seulement (elle ne parle pas catalan) ;
  - les mini-sites livrés aux couples sont « multilingues » (toute langue voulue par le couple).
- **Les traductions catalanes doivent être relues par un locuteur natif** avant publication.
- Page Contact : ton chaleureux, « On prend un café ensemble ? » (choix assumé au détriment de la pré-qualification).
- Page Partenaires : vitrine pour les couples + appel aux pros, cartes « Cette place vous attend », CTA « Parlons-en et imaginons votre partenariat » vers WhatsApp.
- Page Formules : galerie animée de 5 téléphones (cadre noir + encoche) qui font défiler les captures des thèmes, au survol sur desktop et en boucle décalée sur mobile (`@media (hover: none), (max-width: 900px)`). Images via `<picture>` : `theme-xxx-long.jpg` (desktop) et `theme-xxx-mobile.jpg` (720 px de large). Floral et Catalan ont une `animation-duration` plus longue car leurs captures sont plus hautes.
- Vignettes de la galerie : PNG transparents sur fond crème, fournis par Ingrid (elle écrit les noms des thèmes directement sur les images, donc pas de texte dans les vignettes).

## 6. Les thèmes (5 au catalogue, tous en ligne)

| Thème | Couple fictif | Univers |
|---|---|---|
| **Minimalist** | Elena & Marc | blanc/crème, accents dorés, compte à rebours dans le header, photos carrées 800x800 dans `assets/` |
| **Dolce Vita** | Giulia & Marco - Domaine Riberach, Bélesta | bleu encre #123C8C, jaune soleil #F5C518, crème ; prénoms calligraphiés en SVG animés ; 6 sections ; i18n `data-t` + `I18N` |
| **Floral** | Clara & Antoine - Mas Bazan, Alénya | framboise / sauge / crème ; 6 sections dont une Playlist ; aquarelles PNG fournies par Ingrid |
| **Catalan** | Marie & Guillem - église Saint-Étienne, Villelongue-dels-Monts ; réception Château Las Collas, Thuir | « sang i or » (grenat + or) ; 9 sections dont une date à gratter ; bascule FR/CA |
| **Tramonto** | Anna & Olivia - Villa Cini, Toscane | violet #370A69 + orange #FFBD59 ; Poppins + Cormorant Garamond ; illustrations qui se dessinent à la plume puis s'animent en boucle (voiture, Spritz, palmier, soleil, boule disco) ; pas de compte à rebours, pas de langues de démo ; sections : header animé, Notre histoire en pêle-mêle, déroulé horizontal, accès/hébergement, carnet de voyage, RSVP démo ; objet `COUPLE` centralisé ; police de la date provisoire (Brittany non licenciée pour le web, aucune alternative gratuite validée) |

Ingrid aime les accroches de thème courtes et poétiques en une ligne, pas descriptives.

## 7. Offre et tarifs

- **Formule 100% digital** : à partir de 290 €.
- **Formule complète** : à partir de 590 € (ajoute la version multilingue, le faire-part papier assorti, plus de rubriques).
- **Sur-mesure** : sur devis, détaillé dans le contrat.
- **Formule abordable en test** (nom pas encore décidé, piste « Essentiel ») : modèle simple mêlant Minimalist et Dolce Vita (prénoms calligraphiés, pas de compte à rebours), contenus fournis par le couple via questionnaire. Structure validée : en-tête (prénoms, date, lieu, motif floral), photo du couple + 2-3 lignes, programme de la journée avec lieux et liens Google Maps, RSVP par lien vers Google Form, pas de section infos pratiques, couleurs choisies par le couple, pied de page avec prénoms + mention Casorí avec lien.
- Options à la carte : rubrique basique 39 €, rubrique premium 59 €, traduction 149 €, faire-part papier 190 € (impression non comprise), menu papier 90 €, logo du couple 95 €.
- Domaine casori.fr inclus 1 an puis 19 €/an ; nom de domaine dédié 90 €/an.
- Catalogue fermé de rubriques (max ~8) ; le couple en choisit 2, au-delà c'est un devis.
- Repères de rentabilité : ~10 h maximum par client, plancher de 60 €/h.

### Conditions commerciales

- Devis-contrat signé + acompte de 40 %, puis questionnaire (Google Form, à retourner sous 30 jours).
- Première version 2-3 semaines après réception du questionnaire.
- 2 allers-retours de corrections inclus, puis 49 € par aller-retour.
- Bon de mise en ligne signé, solde exigible à la signature, mise en ligne à réception du virement.
- Paiement par virement. Franchise de TVA (« TVA non applicable, art. 293 B du CGI »).
- Principe : tout est vu ensemble, rien n'est facturé sans accord.
- Données des invités sur un Drive partagé avec le couple, supprimées 3 mois après le mariage.
- Médiateur de la consommation : MCP Médiation.
- Mentions légales : Ingrid Andriessens, auto-entreprise, 2 rue du Col de Marialles, 66100 Perpignan, SIRET 827 977 935 00036.

## 8. Clients en cours

- **Maréva & Nicolas** - mariage le 5 juin 2027, Domaine Les Brouilles (Malafretaz), mairie de Montrevel-en-Bresse. Base thème Floral adaptée : vert d'eau #81D1AC, vert foncé #22753E, violet lavande #8F54C2 / #C79AED, prénoms en #4FAE8A, fond jaune pâle #FEFAEB pour le programme, section Hébergement, RSVP par QR code (encadré, pas de bouton), carte Google Maps, galerie photo. Restait : texte « Notre histoire », 3 photos à déposer, emplacement de la galerie à vérifier.
- **Anaïs & Jean-Philippe** - premier essai de la formule abordable (129 €). Mariage le 16 octobre 2027, église de Canohès puis Mas Puig. Couleurs vert sauge, sable, rose ancien (teintes foncées accessibles pour le texte), fleurs du thème Floral. Restait : lien du Google Form RSVP (attendu du couple) et vérification des deux liens Google Maps.

## 9. Façon de travailler avec Ingrid

- **Valider avant de construire.** Elle travaille section par section et valide d'abord une maquette visuelle. Passer au code sans validation est une erreur explicite.
- Une étape concrète à la fois ; elle réagit à des maquettes plutôt que de tout décrire.
- Ne jamais supprimer ou changer un élément de son propre chef (ex. un bouton) : demander d'abord.
- Échanges concis, orientés décision et livrable prêt à l'emploi. Elle apprécie qu'on lui signale franchement une incohérence.
- Ses corrections sont précises (contenu + mise en page) : les appliquer à la lettre.
- Elle préfère ses propres visuels aux images générées.
- Pour tout point technique : lister clairement dans le message les actions qu'elle devra faire elle-même (ex. créer un sous-domaine, activer le HTTPS, vider un dossier) avant qu'elle se lance, et vérifier qu'elle a compris les choix (où est hébergé quoi).
- Infos pratiques (adresses, lieux, itinéraires) : ne donner que du vérifié, signaler clairement ce qui ne l'est pas.

## 10. Sujets ouverts

- Mécanisme d'envoi du RSVP (différé).
- Nom et prix définitifs de la formule abordable.
- Relecture catalane par un natif.
- Choix d'un imprimeur local partenaire.
- Prospection B2B : priorité aux domaines de réception et aux wedding planners (Les Colorieuses en priorité). Pas de relance des prestataires du salon d'octobre 2026 qui n'ont pas répondu.
- Instagram : posts écrits au « nous » pour les carrousels, possible passage au « je » pour les vidéos face caméra. Planification via Metricool, chaque post validé par Ingrid.
