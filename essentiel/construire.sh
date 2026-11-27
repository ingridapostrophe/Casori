#!/bin/bash
# Assemble le dossier atelier/ à déposer dans public_html/ (casori.fr/atelier/)
#   atelier/creer/        le configurateur
#   atelier/modele/       le modèle de site (aperçu)
#   atelier/merci/        la page après paiement
#   atelier/commande.php  la réception des commandes
set -e
cd "$(dirname "$0")"
rm -rf build && mkdir -p build/atelier
cp -r configurateur build/atelier/creer
cp -r modele build/atelier/modele
cp -r serveur/merci build/atelier/merci
cp serveur/commande.php build/atelier/commande.php
(cd build && zip -qr atelier.zip atelier)
echo "Prêt : $(pwd)/build/atelier.zip"
