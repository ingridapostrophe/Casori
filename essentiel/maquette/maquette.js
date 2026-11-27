/* Maquette : on choisit l'écran à montrer via l'adresse, ex. ?etape=4&palette=terracotta&vue=tel */
const q = new URLSearchParams(location.search);
const etape = q.get('etape') || '1';
const palette = q.get('palette') || 'sauge';
const vue = q.get('vue') || 'ordi';
const motif = q.get('motif') || 'brin';
const defile = +(q.get('defile') || 0);

/* Étapes : faites / active */
document.querySelectorAll('#etapes-nav span').forEach(s => {
  const n = +s.dataset.e;
  const b = s.querySelector('b'); const txt = s.lastChild.textContent;
  s.lastChild.remove(); const lib = document.createElement('span'); lib.className = 'lib'; lib.textContent = txt; s.append(lib);
  if (n < +etape) { s.classList.add('fait'); b.textContent = '✓'; }
  if (n === +etape) s.classList.add('actif');
});
document.querySelector(`.etape-contenu[data-e="${etape}"]`).classList.add('visible');
document.querySelector(`.palette[data-p="${palette}"]`)?.classList.add('choisi');
document.querySelector(`.motif[data-m="${motif}"]`)?.classList.add('choisi');
if (etape === '6') document.querySelector('.navigation').style.display = 'none';

/* Palettes proposées (à valider par Ingrid) */
const PALETTES = {
  sauge:        { fond: '#E7E2D6', titre: '#6F7F62', texte: '#4A5640', accent: '#D4A6A6', fonce: '#C28A8A', petit: '#A06A6A', bouton: '#3F4A37' },
  terracotta:   { fond: '#F1E6D8', titre: '#9A5434', texte: '#6B3A24', accent: '#D9A27E', fonce: '#C27A54', petit: '#A35F3F', bouton: '#4A2616' },
  mediterranee: { fond: '#E5EAEF', titre: '#2F4F6F', texte: '#263E57', accent: '#D9A441', fonce: '#C8923A', petit: '#8F6418', bouton: '#1F3247' },
  bordeaux:     { fond: '#F3ECE3', titre: '#6E1F2F', texte: '#521722', accent: '#C9A97A', fonce: '#B08D5B', petit: '#8A6A3A', bouton: '#3E0F19' }
};

/* Vue téléphone */
const ecran = document.getElementById('ecran');
if (vue === 'tel') {
  ecran.classList.add('tel');
  document.querySelectorAll('.bascule span').forEach(s => s.classList.toggle('actif', s.dataset.v === 'tel'));
  const tel = document.createElement('div'); tel.className = 'telephone';
  tel.innerHTML = '<iframe src="apercu/index.html" title="Aperçu téléphone"></iframe>';
  ecran.append(tel);
}

/* Échelle de l'aperçu ordinateur selon la largeur disponible */
const cadre = document.querySelector('.cadre-ordi');
const ajuster = () => cadre.style.setProperty('--echelle', cadre.clientWidth / 1280);
ajuster(); addEventListener('resize', ajuster);

/* Habillage de l'aperçu : palette + prénoms en calligraphie simple (pas de SVG) */
document.querySelectorAll('iframe').forEach(f => f.addEventListener('load', () => {
  const d = f.contentDocument; const p = PALETTES[palette];
  const st = d.createElement('style');
  st.textContent = `
    :root { --fond:${p.fond}; --titre:${p.titre}; --texte:${p.texte}; --rose:${p.accent}; --sauge:${p.accent};
            --rose-fonce:${p.fonce}; --rose-texte:${p.petit}; }
    .bouton { color:${p.bouton}; } .bouton:hover { background:${p.fonce}; }
    .etape { border-color:${p.accent}55 !important; }
    .prenoms .p { display:block; animation: monter 1.2s ease-out both; }
    .prenoms .p2 { animation-delay: .5s; } .prenoms .esperluette { animation: monter 1s ease-out .3s both; }
    @keyframes monter { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }
    .trait, .date, .lieu { animation-delay: 1.4s !important; }
    html { scrollbar-width: none; }`;
  d.head.append(st);
  const h1 = d.getElementById('prenoms');
  h1.innerHTML = '<span class="p calli">Anaïs</span><span class="esperluette calli">&amp;</span><span class="p p2 calli">Jean&#8209;Philippe</span>';
  h1.classList.add('calli');
  if (motif !== 'brin') d.querySelectorAll('img.brin').forEach(i => i.src = 'assets/motif-' + motif + '.png');
  if (defile) f.contentWindow.scrollTo(0, defile);
}));
