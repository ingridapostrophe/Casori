/* Casorí - L'Atelier - remplissage de la page à partir de TARGET, COUPLE et STYLE.
   Ne pas modifier : tout ce qui est propre au couple se règle dans index.html. */

(function () {
  const $ = id => document.getElementById(id);
  const insecable = t => t.replace(/-/g, '‑'); /* évite la coupure de Jean-Philippe */

  /* ---------- Dates en français ---------- */
  const jour = iso => new Date(iso + 'T12:00:00');
  const majuscule = t => t.charAt(0).toUpperCase() + t.slice(1);
  const dateLongue = iso => majuscule(jour(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  const dateSimple = iso => jour(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const dateCourte = iso => jour(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

  /* ---------- Couleurs « Mes couleurs » : 2 couleurs choisies, le reste calculé ---------- */
  const hexVersRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
  const rgbVersHex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  const melange = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);           /* t = part de b */
  const luminance = c => { const l = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
  const contraste = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const NOIR = [0, 0, 0], BLANC = [255, 255, 255];
  /* Assombrit juste ce qu'il faut pour atteindre le contraste demandé sur le fond donné */
  const assombrir = (c, fond, mini) => { let t = 0, r = c; while (contraste(r, fond) < mini && t < 1) { t += 0.03; r = melange(c, NOIR, t); } return r; };

  function couleursCalculees(principaleHex, accentHex) {
    const p = hexVersRgb(principaleHex), a = hexVersRgb(accentHex);
    const fond = melange(p, BLANC, 0.9);
    let boutonTexte = assombrir(melange(p, NOIR, 0.5), a, 4.5);
    if (contraste(boutonTexte, a) < 4.5) boutonTexte = BLANC;               /* accent très foncé : texte blanc */
    return {
      '--fond': fond,
      '--titre': assombrir(p, fond, 4.5),
      '--texte': assombrir(melange(p, NOIR, 0.25), fond, 7),
      '--accent': a,
      '--accent-fonce': assombrir(melange(a, NOIR, 0.1), fond, 3),
      '--accent-texte': assombrir(a, BLANC, 4.5),
      '--bouton-texte': boutonTexte
    };
  }
  window.couleursCalculees = couleursCalculees;   /* réutilisé par le configurateur */

  /* ---------- Style : palette et motif ---------- */
  if (STYLE.palette === 'perso') {
    const v = couleursCalculees(STYLE.couleurs.principale, STYLE.couleurs.accent);
    Object.entries(v).forEach(([k, c]) => document.documentElement.style.setProperty(k, rgbVersHex(c)));
  } else {
    document.body.dataset.palette = STYLE.palette;
  }

  /* motifSrc : image envoyée par le configurateur pour l'aperçu (sinon le fichier du site) */
  const fichierMotif = STYLE.motifSrc || ('assets/motif-' + STYLE.motif + (STYLE.motif === 'perso' ? '.png' : '.webp'));
  const enTete = $('motif-entete'), section = $('motif-section');
  section.src = fichierMotif;
  if (STYLE.motif === 'bougainvillier') {
    enTete.remove();
    section.classList.add('vertical');
    const entete = $('entete');
    entete.classList.add('avec-coins');
    const coins = STYLE.disposition === 'deux' ? ['coin-g', 'coin-d'] : ['coin-g'];
    coins.forEach(cote => {
      const img = document.createElement('img');
      img.src = fichierMotif; img.alt = ''; img.setAttribute('aria-hidden', 'true');
      img.className = 'coin ' + cote;
      entete.prepend(img);
    });
  } else {
    enTete.src = fichierMotif;
    if (STYLE.motif === 'brin') { enTete.classList.add('vertical'); section.classList.add('vertical'); }
  }

  /* ---------- Contenu ---------- */
  const p1 = insecable(COUPLE.prenom1), p2 = insecable(COUPLE.prenom2);
  document.title = COUPLE.prenom1 + ' & ' + COUPLE.prenom2 + ' - ' + dateSimple(TARGET);
  document.querySelector('meta[name="description"]').content = 'Le mariage de ' + COUPLE.prenom1 + ' et ' + COUPLE.prenom2 + ', le ' + dateSimple(TARGET) + '.';

  const h1 = $('prenoms');
  h1.innerHTML = '<span class="p"></span><span class="esperluette">&amp;</span><span class="p p2"></span>';
  h1.querySelectorAll('.p')[0].textContent = p1;
  h1.querySelectorAll('.p')[1].textContent = p2;

  $('date-longue').textContent = dateLongue(TARGET);
  $('lieu').textContent = [COUPLE.lieu, COUPLE.ville].filter(Boolean).join(' - ');
  if (COUPLE.photo) $('photo').src = COUPLE.photo;   /* aperçu du configurateur */
  $('photo').alt = COUPLE.photoAlt || '';
  $('mot').textContent = COUPLE.mot;

  const liste = $('etapes');
  COUPLE.programme.slice(0, 5).forEach(e => {
    const li = document.createElement('li');
    li.className = 'etape';
    li.innerHTML = '<span class="heure"></span><div><h3></h3><p class="adresse"></p></div>';
    li.querySelector('.heure').textContent = e.heure;
    li.querySelector('h3').textContent = e.titre;
    li.querySelector('.adresse').textContent = e.adresse;
    if (e.carte && e.adresse) {
      const a = document.createElement('a');
      a.className = 'carte'; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Itinéraire Google Maps';
      a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e.adresse);
      li.querySelector('div').append(a);
    }
    liste.append(li);
  });
  if (COUPLE.note) $('note').textContent = COUPLE.note; else $('note').remove();

  $('rsvp-texte').textContent = COUPLE.rsvpAvant ? 'Merci de répondre avant le ' + dateSimple(COUPLE.rsvpAvant) : '';
  $('lien-rsvp').href = COUPLE.rsvpLien;

  const pied = $('prenoms-pied');
  const e = document.createElement('span'); e.className = 'esperluette-pied'; e.textContent = '&';
  pied.append(p1 + ' ', e, ' ' + p2);
  $('date-courte').textContent = dateCourte(TARGET);

  /* Images absentes : on les masque proprement */
  document.querySelectorAll('img').forEach(img => img.addEventListener('error', () => { img.style.visibility = 'hidden'; }));
})();
