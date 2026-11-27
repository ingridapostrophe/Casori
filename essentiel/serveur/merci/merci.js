/* Page de remerciement : affiche le numéro de commande et vide le brouillon du configurateur */
(function () {
  try {
    const numero = localStorage.getItem('casori-atelier-derniere-commande');
    if (numero) document.getElementById('numero').textContent = ' (' + numero + ')';
    localStorage.removeItem('casori-atelier-brouillon');
  } catch (e) { /* stockage indisponible : rien à faire */ }
})();
