/* Casorí - L'Atelier - configurateur
   Le couple remplit 6 étapes ; l'aperçu à droite est le vrai modèle (../modele/), rempli avec ses données. */

(function () {
  const $ = id => document.getElementById(id);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  /* ---------- Réglages ---------- */
  const PRIX = { base: 49, motif: 10 };
  /* Liens de paiement Stripe - MODE RÉEL (compte Casori).
     Liens de test, pour mémoire : base https://buy.stripe.com/test_5kQ8wRd8zdZO1rs2MT8Vi00
                                   motif https://buy.stripe.com/test_cNi9AV6Kbf3SeeeevB8Vi01 */
  const LIENS_STRIPE = {
    base: 'https://buy.stripe.com/6oUdRafsV9WCfYzc1v24000',
    motif: 'https://buy.stripe.com/7sY00kbcFc4K8w79Tn24001'
  };
  const CLE_BROUILLON = 'casori-atelier-brouillon';
  const MAX_MOMENTS = 5;

  /* ---------- État (brouillon) ---------- */
  const VIDE = {
    prenom1: '', prenom2: '', photo: '', mot: '',
    date: '', lieu: '', ville: '',
    programme: [{ heure: '', titre: '', adresse: '', carte: true }],
    note: '',
    palette: 'sauge', couleur1: '#2E6B5E', couleur2: '#E0A458',
    motif: 'brin', disposition: 'coin', motifSrc: '', motifDroits: false,
    rsvpAvant: '', rsvpLien: '',
    email: ''
  };
  let E = structuredClone(VIDE);
  try { const b = JSON.parse(localStorage.getItem(CLE_BROUILLON)); if (b) E = Object.assign(E, b); } catch (e) { /* pas de brouillon */ }
  const sauver = () => { try { localStorage.setItem(CLE_BROUILLON, JSON.stringify(E)); } catch (e) { /* stockage indisponible (photo trop lourde, navigation privée) */ } };

  /* ---------- Outils ---------- */
  const jour = iso => new Date(iso + 'T12:00:00');
  const maj = t => t.charAt(0).toUpperCase() + t.slice(1);
  const dateLongue = iso => maj(jour(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  const dateSimple = iso => jour(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const slug = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const adresseSite = () => 'mariages.casori.fr/' + ([slug(E.prenom1), slug(E.prenom2)].filter(Boolean).join('-') || '…');
  const heureAffichee = h => h ? h.replace(':', 'h') : '';
  const lienCarte = a => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a);
  const hexValide = h => /^#[0-9a-fA-F]{6}$/.test(h);
  const luminance = hex => { const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const prix = () => PRIX.base + (E.motif === 'perso' ? PRIX.motif : 0);
  const dansUnAn = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); };

  /* ---------- Modèle de site ---------- */
  let modele = '';
  const BASE_MODELE = new URL('../modele/', location.href).href;
  const pret = fetch('../modele/index.html').then(r => r.text()).then(t => { modele = t; });

  /* Contenu réellement publié (sans valeurs d'exemple) */
  function contenuPublie() {
    return {
      TARGET: E.date,
      COUPLE: {
        prenom1: E.prenom1.trim(), prenom2: E.prenom2.trim(),
        lieu: E.lieu.trim(), ville: E.ville.trim(),
        photoAlt: [E.prenom1.trim(), E.prenom2.trim()].filter(Boolean).join(' et '),
        mot: E.mot.trim(),
        programme: E.programme.filter(m => m.titre.trim()).map(m => ({ heure: heureAffichee(m.heure), titre: m.titre.trim(), adresse: m.adresse.trim(), carte: !!(m.carte && m.adresse.trim()) })),
        note: E.note.trim(),
        rsvpAvant: E.rsvpAvant, rsvpLien: E.rsvpLien.trim() || '#'
      },
      STYLE: {
        palette: E.palette,
        couleurs: { principale: E.couleur1, accent: E.couleur2 },
        motif: E.motif,
        disposition: E.disposition
      }
    };
  }

  /* Pour l'aperçu : on comble les vides avec des exemples discrets */
  function contenuApercu() {
    const c = contenuPublie();
    const C = c.COUPLE;
    C.prenom1 = C.prenom1 || 'Prénom'; C.prenom2 = C.prenom2 || 'Prénom';
    C.lieu = C.lieu || (C.ville ? '' : 'Votre lieu');
    C.mot = C.mot || 'Votre petit mot apparaîtra ici : deux ou trois phrases pour dire qui vous êtes.';
    if (!C.programme.length) C.programme = [{ heure: '15h00', titre: 'Votre premier moment', adresse: 'Son adresse', carte: false }];
    C.photo = E.photo || new URL('photo-attente.svg', location.href).href;
    c.TARGET = c.TARGET || dansUnAn();
    if (E.motif === 'perso') {
      if (E.motifSrc) c.STYLE.motifSrc = E.motifSrc; else c.STYLE.motif = 'brin';
    }
    return c;
  }

  function documentApercu(calme) {
    const c = contenuApercu();
    const bloc = 'const TARGET = ' + JSON.stringify(c.TARGET) + ';\n    const COUPLE = ' + JSON.stringify(c.COUPLE) + ';\n    const STYLE = ' + JSON.stringify(c.STYLE) + ';';
    return modele
      .replace(/const TARGET = [\s\S]*?const STYLE = \{[\s\S]*?\};/, () => bloc)
      .replace('<head>', '<head><base href="' + BASE_MODELE + '">')
      .replace('src="atelier.js"', 'src="' + BASE_MODELE + 'atelier.js"')
      .replace('href="style.css"', 'href="' + BASE_MODELE + 'style.css"')
      .replace('src="assets/couple.jpg"', 'src=""')   /* jamais la photo d'un vrai couple dans l'aperçu */
      .replace('<html lang="fr">', calme ? '<html lang="fr" data-apercu="calme">' : '<html lang="fr">');
  }

  /* ---------- Aperçu ---------- */
  const site = $('site'), siteTel = $('site-tel');
  let premiereFois = true, minuterie = null, cible = null;
  function rafraichir(immediat) {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => pret.then(() => {
      const doc = documentApercu(!premiereFois);
      const viser = cible;
      premiereFois = false;
      [site, siteTel].forEach(f => {
        if (f.closest('[hidden]')) return;
        let y = 0; try { y = f.contentWindow.scrollY; } catch (e) {}
        f.onload = () => {
          try {
            const w = f.contentWindow;
            if (viser) { const el = w.document.querySelector(viser); if (el) w.scrollTo(0, el.offsetTop - 20); }
            else w.scrollTo(0, y);
          } catch (e) {}
        };
        f.srcdoc = doc;
      });
      cible = null;
    }), immediat ? 0 : 250);
  }
  function viserSection(etape) {
    cible = { 1: null, 2: null, 3: '.programme', 4: null, 5: '.rsvp', 6: null }[etape] || '.entete';
    rafraichir(true);
  }

  const cadre = $('cadre-ordi');
  function ajusterEchelle() {
    const s = cadre.clientWidth / 1280;
    site.style.transform = 'scale(' + s + ')';
    site.style.height = (cadre.clientHeight / s) + 'px';
  }
  new ResizeObserver(ajusterEchelle).observe(cadre);

  $$('#bascule button').forEach(b => b.addEventListener('click', () => {
    $$('#bascule button').forEach(x => x.classList.toggle('actif', x === b));
    const tel = b.dataset.v === 'tel';
    $('navigateur').hidden = tel; $('telephone').hidden = !tel;
    rafraichir(true);
  }));

  $$('#onglets-mobile button').forEach(b => b.addEventListener('click', () => {
    $$('#onglets-mobile button').forEach(x => x.classList.toggle('actif', x === b));
    document.body.classList.toggle('vue-apercu', b.dataset.o === 'apercu');
    if (b.dataset.o === 'apercu') { $('navigateur').hidden = true; $('telephone').hidden = false; rafraichir(true); }
  }));

  /* ---------- Étapes ---------- */
  let etape = 1;
  function allerA(n) {
    etape = Math.min(6, Math.max(1, n));
    $$('.etape-contenu').forEach(d => d.classList.toggle('visible', +d.dataset.e === etape));
    $$('#etapes-nav button').forEach(b => {
      const k = +b.dataset.e;
      b.classList.toggle('actif', k === etape);
      b.classList.toggle('fait', k < etape && etapeComplete(k));
      b.querySelector('b').textContent = (k < etape && etapeComplete(k)) ? '✓' : k;
    });
    $('retour').style.visibility = etape === 1 ? 'hidden' : 'visible';
    $('navigation').hidden = etape === 6;
    $('panneau').scrollTop = 0;
    if (etape === 6) majRecap();
    viserSection(etape);
  }
  $$('#etapes-nav button').forEach(b => b.addEventListener('click', () => allerA(+b.dataset.e)));
  $('retour').addEventListener('click', () => allerA(etape - 1));
  $('suivant').addEventListener('click', () => {
    const manques = manquesEtape(etape);
    afficherErreurs(etape, manques);
    if (!manques.length) allerA(etape + 1);
  });

  /* Champs obligatoires par étape */
  function manquesEtape(n) {
    const m = [];
    if (n === 1) {
      if (!E.prenom1.trim()) m.push(['prenom1', 'Indiquez le premier prénom.']);
      if (!E.prenom2.trim()) m.push(['prenom2', 'Indiquez le second prénom.']);
      if (!E.photo) m.push(['photo-zone', 'Ajoutez une photo de vous deux.']);
      if (!E.mot.trim()) m.push(['mot', 'Écrivez votre petit mot.']);
    }
    if (n === 2) {
      if (!E.date) m.push(['date', 'Indiquez la date du mariage.']);
      if (!E.lieu.trim() && !E.ville.trim()) m.push(['lieu', 'Indiquez le lieu ou la ville.']);
    }
    if (n === 3) {
      if (!E.programme.some(x => x.titre.trim())) m.push(['programme', 'Ajoutez au moins un moment.']);
    }
    if (n === 4) {
      if (E.palette === 'perso' && !(hexValide(E.couleur1) && hexValide(E.couleur2))) m.push(['perso-choix', 'Choisissez vos deux couleurs.']);
      if (E.motif === 'perso' && !E.motifSrc) m.push(['motif-perso-choix', 'Ajoutez votre motif, ou choisissez un de nos motifs.']);
      if (E.motif === 'perso' && E.motifSrc && !E.motifDroits) m.push(['motif-perso-choix', 'Confirmez que vous disposez des droits sur votre motif.']);
    }
    if (n === 5) {
      if (!E.rsvpAvant) m.push(['rsvp-avant', 'Indiquez la date limite de réponse.']);
      const l = E.rsvpLien.trim();
      if (!/^https:\/\/\S+\.\S+/.test(l)) m.push(['rsvp-lien', 'Collez le lien de votre formulaire (il commence par https://).']);
      else if (/docs\.google\.com\/forms\/.*\/(edit|copy)/.test(l)) m.push(['rsvp-lien', 'Ce lien sert à modifier le formulaire, pas à y répondre. Dans votre formulaire, cliquez sur « Envoyer », puis sur l\'icône lien, et copiez le lien qui commence par https://forms.gle/.']);
    }
    return m;
  }
  const etapeComplete = n => !manquesEtape(n).length;

  function afficherErreurs(n, manques) {
    $$('.etape-contenu[data-e="' + n + '"] .erreur').forEach(e => e.remove());
    $$('.etape-contenu[data-e="' + n + '"] .en-erreur').forEach(e => e.classList.remove('en-erreur'));
    manques.forEach(([id, texte]) => {
      const el = $(id); if (!el) return;
      el.classList.add('en-erreur');
      const p = document.createElement('p'); p.className = 'erreur'; p.textContent = texte;
      const lab = el.closest('label');
      if (lab) lab.append(p); else el.after(p);
    });
    if (manques.length) { const el = $(manques[0][0]); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }

  function effacerErreur(el) {
    el.classList.remove('en-erreur');
    const lab = el.closest('label');
    const msg = lab ? lab.querySelector('.erreur') : (el.nextElementSibling && el.nextElementSibling.classList.contains('erreur') ? el.nextElementSibling : null);
    if (msg) msg.remove();
  }

  /* ---------- Liaison des champs simples ---------- */
  function lier(id, cle, apres) {
    const el = $(id);
    el.value = E[cle];
    el.addEventListener('input', () => { E[cle] = el.value; sauver(); effacerErreur(el); if (apres) apres(); rafraichir(); });
  }
  lier('prenom1', 'prenom1', majAdresse);
  lier('prenom2', 'prenom2', majAdresse);
  lier('mot', 'mot', () => { $('mot-compteur').textContent = E.mot.length + ' / 300'; });
  lier('date', 'date', majRendus);
  lier('lieu', 'lieu', majRendus);
  lier('ville', 'ville', majRendus);
  lier('note', 'note');
  lier('rsvp-avant', 'rsvpAvant');
  lier('rsvp-lien', 'rsvpLien');
  lier('email', 'email', majPaiement);

  function majAdresse() { $('adresse-barre').textContent = adresseSite(); }
  function majRendus() {
    $('date-rendu').innerHTML = E.date ? 'S\'affichera : <b></b>' : '';
    if (E.date) $('date-rendu').querySelector('b').textContent = dateLongue(E.date);
    const l = [E.lieu.trim(), E.ville.trim()].filter(Boolean).join(' - ');
    $('lieu-rendu').innerHTML = l ? 'S\'affichera : <b></b>' : '';
    if (l) $('lieu-rendu').querySelector('b').textContent = l;
  }
  $('mot-compteur').textContent = E.mot.length + ' / 300';

  /* ---------- Photo : recadrage carré au centre, 1200 px ---------- */
  function majPhoto() {
    $('photo-vignette').hidden = !E.photo;
    if (E.photo) $('photo-vignette').src = E.photo;
    $('photo-etat').textContent = E.photo ? 'Photo ajoutée - parfait !' : 'Aucune photo pour l\'instant';
    if (E.photo) effacerErreur($('photo-zone'));
  }
  function chargerImage(fichier) {
    return new Promise((ok, ko) => {
      const url = URL.createObjectURL(fichier);
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => ko(new Error('format'));
      img.src = url;
    });
  }
  $('photo-fichier').addEventListener('change', async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try {
      const img = await chargerImage(f);
      const cote = Math.min(img.naturalWidth, img.naturalHeight);
      const taille = Math.min(1200, cote);
      const cv = document.createElement('canvas'); cv.width = cv.height = taille;
      cv.getContext('2d').drawImage(img, (img.naturalWidth - cote) / 2, (img.naturalHeight - cote) / 2, cote, cote, 0, 0, taille, taille);
      E.photo = cv.toDataURL('image/jpeg', 0.85);
      if (cote < 600) $('photo-etat').textContent = 'Photo ajoutée, mais petite : elle risque d\'être floue.';
      sauver(); majPhoto(); rafraichir(true);
      if (cote < 600) $('photo-etat').textContent = 'Photo ajoutée, mais petite : elle risque d\'être floue.';
    } catch (e) {
      $('photo-etat').textContent = 'Ce format n\'est pas lisible ici. Essayez une photo en JPG ou PNG.';
    }
    ev.target.value = '';
  });

  /* ---------- Programme ---------- */
  function majProgramme() {
    const zone = $('programme');
    zone.innerHTML = '';
    E.programme.forEach((m, i) => {
      const d = document.createElement('div');
      d.className = 'moment';
      d.innerHTML =
        '<div class="moment-tete"><b>Moment ' + (i + 1) + '</b><span class="outils">' +
        '<button type="button" data-a="haut" title="Monter">↑</button><button type="button" data-a="bas" title="Descendre">↓</button>' +
        '<button type="button" data-a="suppr" title="Supprimer">×</button></span></div>' +
        '<div class="duo"><label>Heure<input type="time" data-c="heure"></label><label>Moment<input type="text" data-c="titre" maxlength="40" placeholder="ex. Cérémonie"></label></div>' +
        '<label>Adresse<input type="text" data-c="adresse" maxlength="100" placeholder="ex. Église de Canohès"></label>' +
        '<label class="case"><input type="checkbox" data-c="carte"> <span>Afficher le lien « Itinéraire Google Maps » - <a class="lien" target="_blank" rel="noopener">tester le lien</a></span></label>';
      d.querySelector('[data-c="heure"]').value = m.heure;
      d.querySelector('[data-c="titre"]').value = m.titre;
      d.querySelector('[data-c="adresse"]').value = m.adresse;
      d.querySelector('[data-c="carte"]').checked = m.carte;
      const test = d.querySelector('a.lien');
      const majTest = () => { test.href = m.adresse.trim() ? lienCarte(m.adresse) : '#'; test.style.visibility = m.adresse.trim() ? 'visible' : 'hidden'; };
      majTest();
      $$('input', d).forEach(inp => inp.addEventListener('input', () => {
        const c = inp.dataset.c; if (!c) return;
        m[c] = inp.type === 'checkbox' ? inp.checked : inp.value;
        if (c === 'adresse') majTest();
        sauver(); rafraichir();
      }));
      $$('[data-a]', d).forEach(b => b.addEventListener('click', () => {
        const a = b.dataset.a, P = E.programme;
        if (a === 'suppr') { P.splice(i, 1); if (!P.length) P.push({ heure: '', titre: '', adresse: '', carte: true }); }
        if (a === 'haut' && i > 0) [P[i - 1], P[i]] = [P[i], P[i - 1]];
        if (a === 'bas' && i < P.length - 1) [P[i + 1], P[i]] = [P[i], P[i + 1]];
        sauver(); majProgramme(); rafraichir(true);
      }));
      zone.append(d);
    });
    $('ajouter-moment').hidden = E.programme.length >= MAX_MOMENTS;
  }
  $('ajouter-moment').addEventListener('click', () => {
    if (E.programme.length >= MAX_MOMENTS) return;
    E.programme.push({ heure: '', titre: '', adresse: '', carte: true });
    sauver(); majProgramme();
    $$('#programme .moment').pop().querySelector('[data-c="heure"]').focus();
  });

  /* ---------- Style : palette ---------- */
  function majStyle() {
    $$('#palettes .palette').forEach(b => b.classList.toggle('choisi', b.dataset.p === E.palette));
    $('perso-choix').classList.toggle('visible', E.palette === 'perso');
    $$('#motifs .motif').forEach(b => b.classList.toggle('choisi', b.dataset.m === E.motif));
    const carte = $$('#motifs [data-m="perso"]')[0];
    carte.classList.toggle('vide', !E.motifSrc);
    carte.innerHTML = E.motifSrc
      ? '<img alt=""><span>Votre motif <em class="or">+10 €</em></span>'
      : '<span class="a-venir"><b class="plus">+</b><br>Votre motif<br><em class="or">+10 €</em></span>';
    if (E.motifSrc) carte.querySelector('img').src = E.motifSrc;
    $('variantes').classList.toggle('visible', E.motif === 'bougainvillier');
    $$('#variantes button').forEach(b => b.classList.toggle('choisi', b.dataset.v === E.disposition));
    $('motif-perso-choix').classList.toggle('visible', E.motif === 'perso');
    $('motif-droits').checked = E.motifDroits;
    const clair = E.palette === 'perso' && hexValide(E.couleur1) && luminance(E.couleur1) > 0.45;
    $('alerte-clair').hidden = !clair;
    majPaiement();
  }
  $$('#palettes .palette').forEach(b => b.addEventListener('click', () => { E.palette = b.dataset.p; sauver(); majStyle(); rafraichir(true); }));
  $$('#motifs .motif').forEach(b => b.addEventListener('click', () => { E.motif = b.dataset.m; sauver(); majStyle(); rafraichir(true); }));
  $$('#variantes button').forEach(b => b.addEventListener('click', () => { E.disposition = b.dataset.v; sauver(); majStyle(); rafraichir(true); }));

  [['couleur1', 'couleur1-code'], ['couleur2', 'couleur2-code']].forEach(([id, code]) => {
    const cle = id;
    $(id).value = E[cle]; $(code).value = E[cle];
    $(id).addEventListener('input', () => { E[cle] = $(id).value.toUpperCase(); $(code).value = E[cle]; sauver(); majStyle(); rafraichir(); });
    $(code).addEventListener('input', () => {
      let v = $(code).value.trim(); if (v && v[0] !== '#') v = '#' + v;
      if (hexValide(v)) { E[cle] = v.toUpperCase(); $(id).value = E[cle]; sauver(); majStyle(); rafraichir(); }
    });
  });

  /* ---------- Style : motif personnel (+10 €) ---------- */
  let motifBrut = null;   /* image chargée, pour pouvoir retirer le blanc */
  function messageMotif(t) { $('motif-message').textContent = t; $('motif-message').hidden = !t; }
  function analyserFond(cv) {
    const ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
    const pts = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1], [w >> 1, 0], [0, h >> 1]];
    const px = pts.map(([x, y]) => ctx.getImageData(x, y, 1, 1).data);
    if (px.every(p => p[3] < 20)) return 'transparent';
    if (px.every(p => p[3] > 240 && Math.min(p[0], p[1], p[2]) > 230)) return 'blanc';
    return 'colore';
  }
  function rogner(cv) {
    const ctx = cv.getContext('2d'), d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let x0 = cv.width, y0 = cv.height, x1 = 0, y1 = 0;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0) return cv;
    const r = document.createElement('canvas'); r.width = x1 - x0 + 1; r.height = y1 - y0 + 1;
    r.getContext('2d').drawImage(cv, x0, y0, r.width, r.height, 0, 0, r.width, r.height);
    return r;
  }
  function versCanvas(img, maxL) {
    const s = Math.min(1, maxL / img.naturalWidth);
    const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return cv;
  }
  $('motif-fichier').addEventListener('change', async ev => {
    const f = ev.target.files[0]; if (!f) return;
    $('retirer-blanc').hidden = true;
    try {
      const img = await chargerImage(f);
      if (img.naturalWidth < 500) { messageMotif('Cette image est trop petite (' + img.naturalWidth + ' px de large). Il faut au moins 500 px pour un rendu net.'); ev.target.value = ''; return; }
      const cv = versCanvas(img, 800);
      const fond = analyserFond(cv);
      motifBrut = cv;
      E.motifSrc = rogner(cv).toDataURL('image/png');
      if (fond === 'transparent') messageMotif('');
      if (fond === 'blanc') { messageMotif('Votre image a un fond blanc, qui formera un rectangle sur votre site. Nous pouvons le retirer : regardez le résultat dans l\'aperçu.'); $('retirer-blanc').hidden = false; }
      if (fond === 'colore') messageMotif('Votre image a un fond coloré : elle s\'affichera comme un rectangle. Un PNG à fond transparent donnera un plus joli rendu.');
      sauver(); majStyle(); rafraichir(true);
    } catch (e) { messageMotif('Ce format n\'est pas lisible ici. Essayez un PNG ou un JPG.'); }
    ev.target.value = '';
  });
  $('retirer-blanc').addEventListener('click', () => {
    if (!motifBrut) return;
    const cv = document.createElement('canvas'); cv.width = motifBrut.width; cv.height = motifBrut.height;
    const ctx = cv.getContext('2d'); ctx.drawImage(motifBrut, 0, 0);
    const im = ctx.getImageData(0, 0, cv.width, cv.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const m = Math.min(d[i], d[i + 1], d[i + 2]);
      if (m > 235) d[i + 3] = 0;                                   /* blanc : transparent */
      else if (m > 215) d[i + 3] = Math.round(d[i + 3] * (235 - m) / 20);   /* bord adouci */
    }
    ctx.putImageData(im, 0, 0);
    E.motifSrc = rogner(cv).toDataURL('image/png');
    $('retirer-blanc').hidden = true;
    messageMotif('Fond blanc retiré. Vérifiez le rendu dans l\'aperçu.');
    sauver(); majStyle(); rafraichir(true);
  });
  $('motif-droits').addEventListener('change', () => { E.motifDroits = $('motif-droits').checked; sauver(); });

  /* ---------- Étape 6 : récapitulatif et paiement ---------- */
  function majRecap() {
    $('recap-adresse').textContent = adresseSite();
    if (E.date) { const d = jour(E.date); d.setFullYear(d.getFullYear() + 1); $('recap-fin').textContent = dateSimple(d.toISOString().slice(0, 10)); }
    const manques = [1, 2, 3, 4, 5].flatMap(n => manquesEtape(n).map(([, t]) => [n, t]));
    const ul = $('manques'); ul.innerHTML = '';
    manques.forEach(([n, t]) => {
      const li = document.createElement('li');
      const a = document.createElement('button'); a.className = 'lien'; a.textContent = 'Étape ' + n;
      a.addEventListener('click', () => { allerA(n); afficherErreurs(n, manquesEtape(n)); });
      li.append(a, ' : ' + t); ul.append(li);
    });
    ul.hidden = !manques.length;
    majPaiement();
  }
  function majPaiement() {
    const p = prix();
    $('prix').textContent = p + ' €';
    $('recap-total').textContent = E.motif === 'perso' ? p + ' € (dont votre motif : 10 €)' : p + ' €';
    $('payer').textContent = 'Payer ' + p + ' € et publier mon site';
    const tout = [1, 2, 3, 4, 5].every(etapeComplete);
    const cases = ['ok-relu', 'ok-modif', 'ok-retract', 'ok-cgv'].every(id => $(id).checked);
    const mail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(E.email.trim());
    $('payer').disabled = !(tout && cases && mail);
  }
  ['ok-relu', 'ok-modif', 'ok-retract', 'ok-cgv'].forEach(id => $(id).addEventListener('change', majPaiement));

  const numeroCommande = () => {
    const d = new Date();
    return 'AT-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  };

  $('payer').addEventListener('click', async () => {
    const numero = numeroCommande();
    const commande = { numero, email: E.email.trim(), adresse: adresseSite(), prix: prix(), ...contenuPublie(), photo: E.photo, motifPerso: E.motif === 'perso' ? E.motifSrc : null, creeLe: new Date().toISOString() };
    $('payer').disabled = true;
    $('message-envoi').hidden = false;
    $('message-envoi').textContent = 'Enregistrement de votre commande…';
    try {
      await envoyerCommande(commande);
      const lien = E.motif === 'perso' ? LIENS_STRIPE.motif : LIENS_STRIPE.base;
      location.href = lien + '?client_reference_id=' + encodeURIComponent(numero) + '&prefilled_email=' + encodeURIComponent(commande.email);
    } catch (e) {
      $('message-envoi').textContent = 'L\'envoi n\'a pas fonctionné. Vérifiez votre connexion et réessayez : votre site est bien gardé dans ce navigateur.';
      $('payer').disabled = false;
    }
  });

  /* Envoi de la commande (données + photo + motif) au script commande.php d'o2switch,
     qui l'enregistre hors de public_html et prévient Ingrid par e-mail. */
  async function envoyerCommande(commande) {
    const r = await fetch('../commande.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...commande, site_web: $('site-web').value })
    });
    const rep = await r.json().catch(() => ({}));
    if (!r.ok || !rep.ok) throw new Error(rep.erreur || 'envoi');
    try { localStorage.setItem('casori-atelier-derniere-commande', commande.numero); } catch (e) {}
  }

  /* ---------- Démarrage ---------- */
  majAdresse(); majRendus(); majPhoto(); majProgramme(); majStyle();
  allerA(1);
  addEventListener('resize', ajusterEchelle);
})();
