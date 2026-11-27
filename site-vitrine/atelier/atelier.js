/* Page de l'Atelier : le téléphone de l'en-tête alterne les 4 styles (et on peut choisir avec les pastilles) */
(function () {
  const imgs = [...document.querySelectorAll('#at-diapo img')];
  const pastilles = [...document.querySelectorAll('#at-pastilles button')];
  const nom = document.getElementById('at-diapo-nom');
  if (!imgs.length) return;
  let i = 0, minuterie;
  function montrer(n) {
    i = (n + imgs.length) % imgs.length;
    imgs.forEach((im, k) => { im.classList.remove('visible'); if (k === i) { void im.offsetWidth; im.classList.add('visible'); } });
    pastilles.forEach((p, k) => p.classList.toggle('actif', k === i));
    nom.textContent = imgs[i].dataset.nom;
  }
  function lancer() { clearInterval(minuterie); minuterie = setInterval(() => montrer(i + 1), 7000); }
  pastilles.forEach((p, k) => p.addEventListener('click', () => { montrer(k); lancer(); }));
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) lancer();
})();
