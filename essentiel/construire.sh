#!/bin/bash
# Assemble tout le contenu de public_html (site vitrine + l'Atelier), prêt à extraire.
#   site-vitrine/           -> public_html/ (dont atelier/index.html : la page de présentation)
#   atelier/creer/          le configurateur
#   atelier/modele/         le modèle de site (aperçu)
#   atelier/merci/          la page après paiement
#   atelier/commande.php    la réception des commandes
#   atelier/admin/          l'espace privé d'Ingrid (commandes, publication)
set -e
cd "$(dirname "$0")"
rm -rf build && mkdir -p build/public_html
cp -r ../site-vitrine/. build/public_html/
A=build/public_html/atelier
mkdir -p $A
cp -r configurateur $A/creer
cp -r modele $A/modele
cp -r serveur/merci $A/merci
cp serveur/commande.php $A/commande.php
cp -r serveur/admin $A/admin
(cd build/public_html && zip -qr ../casori-public_html.zip .)
echo "Prêt : $(pwd)/build/casori-public_html.zip"
