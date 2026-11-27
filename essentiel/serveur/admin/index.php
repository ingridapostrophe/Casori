<?php
/* Casorí - L'Atelier - espace privé d'Ingrid : commandes et publication
   Emplacement sur o2switch : public_html/atelier/admin/
   Données : /home/<identifiant>/commandes-atelier/ (hors public_html)

   Mot de passe : la première fois (ou en cas d'oubli), créer dans cPanel un fichier vide
   nommé « autoriser-installation » dans le dossier commandes-atelier, puis ouvrir cette page. */

declare(strict_types=1);

$DOSSIER = getenv('CASORI_COMMANDES') ?: dirname(__DIR__, 3) . '/commandes-atelier';
$MODELE  = dirname(__DIR__) . '/modele';
const EMAIL_CASORI = 'contact@casori.fr';
const URL_MARIAGES = 'https://mariages.casori.fr/';

session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !getenv('CASORI_TEST')]);
session_name('casori_admin');
session_start();
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');

/* ---------- Outils ---------- */
function h($v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function jeton(): string { if (empty($_SESSION['jeton'])) $_SESSION['jeton'] = bin2hex(random_bytes(16)); return $_SESSION['jeton']; }
function verifier_jeton(): void { if (!hash_equals(jeton(), (string)($_POST['jeton'] ?? ''))) { http_response_code(400); exit('Session expirée, rechargez la page.'); } }
function slug(string $t): string {
    $t = function_exists('transliterator_transliterate') ? (transliterator_transliterate('Any-Latin; Latin-ASCII; Lower()', $t) ?: $t)
                                                         : (iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $t) ?: $t);
    $t = strtolower($t);
    return trim(preg_replace('/[^a-z0-9]+/', '-', $t) ?? '', '-');
}
function date_fr(string $iso): string {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $iso)) return '';
    $mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    [$a, $m, $j] = array_map('intval', explode('-', $iso));
    return "$j " . $mois[$m - 1] . " $a";
}
function page(string $titre, string $corps): void {
    echo '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'
       . '<meta name="robots" content="noindex, nofollow"><title>' . h($titre) . ' - L\'Atelier</title><link rel="stylesheet" href="style.css"></head><body>'
       . '<header class="barre"><a class="marque" href="./">Casor<span class="i">í</span> <small>L\'Atelier - commandes</small></a>'
       . (!empty($_SESSION['connecte']) ? '<form method="post" action="?action=sortir"><input type="hidden" name="jeton" value="' . h(jeton()) . '"><button class="lien">Se déconnecter</button></form>' : '')
       . '</header><main>' . $corps . '</main></body></html>';
    exit;
}
function commande(string $numero): ?array {
    global $DOSSIER;
    if (!preg_match('/^AT-\d{8}-[A-Z0-9]{4}$/', $numero)) return null;
    $f = "$DOSSIER/$numero/commande.json";
    if (!is_file($f)) return null;
    $c = json_decode((string)file_get_contents($f), true);
    return is_array($c) ? $c : null;
}
function enregistrer(array $c): void {
    global $DOSSIER;
    file_put_contents("$DOSSIER/{$c['numero']}/commande.json", json_encode($c, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}
function dossier_site(array $c): string {
    return $c['dossier'] ?? (slug($c['COUPLE']['prenom1'] . '-' . $c['COUPLE']['prenom2']) ?: strtolower($c['numero']));
}

/* Fabrique le index.html du couple à partir du modèle (même bloc que le configurateur) */
function html_du_site(array $c, bool $apercu = false): string {
    global $MODELE;
    $modele = (string)file_get_contents("$MODELE/index.html");
    $style = $c['STYLE'];
    $json = fn($v) => json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP);
    $bloc = 'const TARGET = ' . $json($c['TARGET']) . ";\n    const COUPLE = " . $json($c['COUPLE']) . ";\n    const STYLE = " . $json($style) . ';';
    $html = preg_replace_callback('/const TARGET = [\s\S]*?const STYLE = \{[\s\S]*?\};/', fn() => $bloc, $modele, 1);
    if ($apercu) $html = str_replace('<head>', '<head><base href="../modele/">', $html);
    return $html;
}

/* ---------- Mot de passe ---------- */
$fichierMdp = "$DOSSIER/.admin-mdp";
$autorisation = "$DOSSIER/autoriser-installation";
$action = $_GET['action'] ?? '';

if (!is_file($fichierMdp)) {
    if (!is_file($autorisation)) {
        page('Installation', '<div class="carte"><h1>Espace pas encore installé</h1><p>Pour créer votre mot de passe : dans le gestionnaire de fichiers cPanel, ouvrez le dossier <b>commandes-atelier</b> (à côté de public_html) et créez un fichier vide nommé <b>autoriser-installation</b>. Puis rechargez cette page.</p></div>');
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        verifier_jeton();
        $m1 = (string)($_POST['mdp'] ?? ''); $m2 = (string)($_POST['mdp2'] ?? '');
        if (mb_strlen($m1) < 10 || $m1 !== $m2) $erreur = 'Le mot de passe doit faire au moins 10 caractères, et les deux saisies doivent être identiques.';
        else {
            file_put_contents($fichierMdp, password_hash($m1, PASSWORD_DEFAULT)); @chmod($fichierMdp, 0600);
            @unlink($autorisation);
            session_regenerate_id(true); $_SESSION['connecte'] = true;
            header('Location: ./'); exit;
        }
    }
    page('Créer le mot de passe', '<div class="carte"><h1>Créer votre mot de passe</h1>' . (isset($erreur) ? '<p class="erreur">' . h($erreur) . '</p>' : '')
        . '<form method="post"><input type="hidden" name="jeton" value="' . h(jeton()) . '"><label>Mot de passe (10 caractères minimum)<input type="password" name="mdp" autocomplete="new-password" required></label>'
        . '<label>Le même, une seconde fois<input type="password" name="mdp2" autocomplete="new-password" required></label><button class="principal">Créer</button></form></div>');
}

/* Mot de passe oublié : le fichier d'autorisation permet de le refaire */
if (is_file($autorisation)) { @unlink($fichierMdp); header('Location: ./'); exit; }

if ($action === 'sortir' && $_SERVER['REQUEST_METHOD'] === 'POST') { verifier_jeton(); session_destroy(); header('Location: ./'); exit; }

if (empty($_SESSION['connecte'])) {
    $essais = "$DOSSIER/.admin-essais";
    $liste = is_file($essais) ? array_filter((array)json_decode((string)file_get_contents($essais), true), fn($t) => $t > time() - 900) : [];
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        verifier_jeton();
        if (count($liste) >= 5) $erreur = 'Trop d\'essais. Réessayez dans 15 minutes.';
        elseif (password_verify((string)($_POST['mdp'] ?? ''), trim((string)file_get_contents($fichierMdp)))) {
            @unlink($essais); session_regenerate_id(true); $_SESSION['connecte'] = true; header('Location: ./'); exit;
        } else { $liste[] = time(); file_put_contents($essais, json_encode(array_values($liste))); $erreur = 'Mot de passe incorrect.'; }
    }
    page('Connexion', '<div class="carte"><h1>Connexion</h1>' . (isset($erreur) ? '<p class="erreur">' . h($erreur) . '</p>' : '')
        . '<form method="post"><input type="hidden" name="jeton" value="' . h(jeton()) . '"><label>Mot de passe<input type="password" name="mdp" autocomplete="current-password" required autofocus></label><button class="principal">Entrer</button></form>'
        . '<p class="petit">Mot de passe oublié ? Créez le fichier vide <b>autoriser-installation</b> dans commandes-atelier (cPanel), puis rechargez.</p></div>');
}

/* ---------- Connecté ---------- */
$numero = (string)($_GET['n'] ?? $_POST['n'] ?? '');

/* Fichiers de la commande (photo, motif) pour l'aperçu */
if ($action === 'fichier') {
    $c = commande($numero); $f = $_GET['f'] ?? '';
    if (!$c || !in_array($f, ['couple.jpg', 'motif-perso.png'], true) || !is_file("$DOSSIER/$numero/$f")) { http_response_code(404); exit; }
    header('Content-Type: ' . ($f === 'couple.jpg' ? 'image/jpeg' : 'image/png'));
    readfile("$DOSSIER/$numero/$f"); exit;
}

/* Aperçu du site tel qu'il sera publié */
if ($action === 'apercu') {
    $c = commande($numero); if (!$c) { http_response_code(404); exit; }
    $c['COUPLE']['photo'] = '../admin/?action=fichier&n=' . rawurlencode($numero) . '&f=couple.jpg';
    if ($c['STYLE']['motif'] === 'perso') $c['STYLE']['motifSrc'] = '../admin/?action=fichier&n=' . rawurlencode($numero) . '&f=motif-perso.png';
    header('Content-Type: text/html; charset=utf-8');
    echo html_du_site($c, true); exit;
}

/* Le .zip du site, prêt à extraire dans mariages.casori.fr/<dossier>/ */
if ($action === 'zip') {
    $c = commande($numero); if (!$c) { http_response_code(404); exit; }
    $dossier = dossier_site($c);
    $tmp = tempnam(sys_get_temp_dir(), 'atelier');
    $z = new ZipArchive();
    $z->open($tmp, ZipArchive::OVERWRITE);
    $z->addFromString('index.html', html_du_site($c));
    $z->addFile("$MODELE/style.css", 'style.css');
    $z->addFile("$MODELE/atelier.js", 'atelier.js');
    foreach (glob("$MODELE/assets/fonts/*.woff2") as $f) $z->addFile($f, 'assets/fonts/' . basename($f));
    $z->addFile("$DOSSIER/$numero/couple.jpg", 'assets/couple.jpg');
    if ($c['STYLE']['motif'] === 'perso') $z->addFile("$DOSSIER/$numero/motif-perso.png", 'assets/motif-perso.png');
    else $z->addFile("$MODELE/assets/motif-{$c['STYLE']['motif']}.webp", "assets/motif-{$c['STYLE']['motif']}.webp");
    $z->close();
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $dossier . '.zip"');
    header('Content-Length: ' . filesize($tmp));
    readfile($tmp); unlink($tmp); exit;
}

/* Actions sur une commande */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'maj') {
    verifier_jeton();
    $c = commande($numero); if (!$c) { header('Location: ./'); exit; }
    $quoi = $_POST['quoi'] ?? '';
    if ($quoi === 'dossier') {
        $d = slug((string)($_POST['dossier'] ?? ''));
        if ($d !== '') $c['dossier'] = $d;
        $c['message'] = 'Dossier enregistré.';
    }
    if ($quoi === 'payee') { $c['statut'] = 'payée'; $c['payee_le'] = date('c'); $c['message'] = 'Commande marquée payée.'; }
    if ($quoi === 'publiee') { $c['statut'] = 'publiée'; $c['publiee_le'] = date('c'); $c['message'] = 'Commande marquée publiée.'; }
    if ($quoi === 'envoyer') {
        $url = URL_MARIAGES . dossier_site($c) . '/';
        $p = $c['COUPLE']['prenom1'] . ' & ' . $c['COUPLE']['prenom2'];
        $corps = "Bonjour {$c['COUPLE']['prenom1']} et {$c['COUPLE']['prenom2']},\n\nVotre site de mariage est en ligne :\n$url\n\nVous pouvez dès maintenant partager ce lien avec vos invités.\n"
               . "Une coquille à corriger ? Répondez simplement à cet e-mail en indiquant votre numéro de commande ({$c['numero']}).\n\nBelle préparation, et à très bientôt !\nIngrid - Casorí\nhttps://casori.fr";
        $entetes = implode("\r\n", ['From: =?UTF-8?B?' . base64_encode('Casorí') . '?= <' . EMAIL_CASORI . '>', 'Reply-To: ' . EMAIL_CASORI,
                                    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit']);
        $ok = getenv('CASORI_TEST') ? (bool)file_put_contents("$DOSSIER/$numero/email-couple-test.txt", $corps)
                                     : @mail($c['email'], '=?UTF-8?B?' . base64_encode("Votre site de mariage est en ligne - $p") . '?=', $corps, $entetes, '-f' . EMAIL_CASORI);
        if ($ok) $c['lien_envoye_le'] = date('c');
        $c['message'] = $ok ? 'Lien envoyé au couple.' : 'L\'e-mail n\'est pas parti. Réessayez ou écrivez au couple directement.';
    }
    if ($quoi === 'supprimer' && ($_POST['confirmer'] ?? '') === $numero) {
        array_map('unlink', glob("$DOSSIER/$numero/*")); @rmdir("$DOSSIER/$numero");
        header('Location: ./?supprimee=' . rawurlencode($numero)); exit;
    }
    enregistrer($c);
    header('Location: ./?n=' . rawurlencode($numero)); exit;
}

/* ---------- Fiche d'une commande ---------- */
if ($numero !== '') {
    $c = commande($numero);
    if (!$c) page('Introuvable', '<div class="carte"><p>Commande introuvable.</p><a href="./">Retour</a></div>');
    $message = $c['message'] ?? ''; if ($message) { unset($c['message']); enregistrer($c); }
    $C = $c['COUPLE']; $S = $c['STYLE']; $dossier = dossier_site($c); $j = h(jeton());
    $form = fn($quoi, $libelle, $classe = 'principal', $extra = '') => '<form method="post" action="?action=maj"><input type="hidden" name="jeton" value="' . $j . '"><input type="hidden" name="n" value="' . h($numero) . '"><input type="hidden" name="quoi" value="' . $quoi . '">' . $extra . '<button class="' . $classe . '">' . $libelle . '</button></form>';
    $etapes = '<ol class="marche">'
        . '<li class="' . ($c['statut'] !== 'en attente de paiement' ? 'fait' : '') . '"><b>1. Vérifier le paiement</b> dans Stripe : un paiement de <b>' . h($c['prix']) . ' €</b> avec la référence <b>' . h($numero) . '</b>.'
        . ($c['statut'] === 'en attente de paiement' ? $form('payee', 'Paiement reçu') : '') . '</li>'
        . '<li><b>2. Vérifier le site</b> dans l\'aperçu' . ($S['motif'] === 'perso' ? ', <b>en particulier le motif personnel</b>' : '') . '.</li>'
        . '<li><b>3. Télécharger le .zip</b> et l\'extraire dans <b>mariages.casori.fr/' . h($dossier) . '/</b> (créer ce dossier dans cPanel).'
        . '<a class="principal" href="?action=zip&n=' . h(rawurlencode($numero)) . '">Télécharger ' . h($dossier) . '.zip</a></li>'
        . '<li class="' . ($c['statut'] === 'publiée' ? 'fait' : '') . '"><b>4. Vérifier en ligne</b> : <a href="' . h(URL_MARIAGES . $dossier . '/') . '" target="_blank" rel="noopener">' . h('mariages.casori.fr/' . $dossier . '/') . '</a>'
        . ($c['statut'] !== 'publiée' ? $form('publiee', 'C\'est en ligne', 'secondaire') : '') . '</li>'
        . '<li class="' . (!empty($c['lien_envoye_le']) ? 'fait' : '') . '"><b>5. Envoyer le lien au couple</b> par e-mail (' . h($c['email']) . ').'
        . $form('envoyer', empty($c['lien_envoye_le']) ? 'Envoyer le lien' : 'Renvoyer le lien', 'secondaire') . '</li></ol>';
    $infos = '<dl class="infos"><dt>Couple</dt><dd>' . h($C['prenom1'] . ' & ' . $C['prenom2']) . '</dd><dt>Mariage</dt><dd>' . h(date_fr($c['TARGET'])) . ' - ' . h(implode(' - ', array_filter([$C['lieu'], $C['ville']]))) . '</dd>'
        . '<dt>E-mail</dt><dd><a href="mailto:' . h($c['email']) . '">' . h($c['email']) . '</a></dd><dt>Reçue le</dt><dd>' . h(date('d/m/Y H:i', strtotime($c['recue_le']))) . '</dd>'
        . '<dt>Style</dt><dd>' . h($S['palette'] . ($S['palette'] === 'perso' ? ' (' . $S['couleurs']['principale'] . ' + ' . $S['couleurs']['accent'] . ')' : '') . ' / ' . $S['motif'] . ($S['motif'] === 'bougainvillier' ? ' (' . $S['disposition'] . ')' : '')) . '</dd>'
        . '<dt>Statut</dt><dd><span class="statut ' . (['payée' => 's-payee', 'publiée' => 's-publiee'][$c['statut']] ?? '') . '">' . h($c['statut']) . '</span></dd></dl>'
        . '<form method="post" action="?action=maj" class="ligne"><input type="hidden" name="jeton" value="' . $j . '"><input type="hidden" name="n" value="' . h($numero) . '"><input type="hidden" name="quoi" value="dossier">'
        . '<label>Dossier du site<input type="text" name="dossier" value="' . h($dossier) . '"></label><button class="secondaire">Changer</button></form>';
    $danger = '<details class="danger"><summary>Supprimer cette commande</summary><p>Supprime définitivement les textes et les photos de cette commande (pas le site en ligne). Recopiez le numéro pour confirmer.</p>'
        . $form('supprimer', 'Supprimer définitivement', 'rouge', '<input type="text" name="confirmer" placeholder="' . h($numero) . '">') . '</details>';
    page($numero, '<p><a href="./">← Toutes les commandes</a></p>' . ($message ? '<p class="message">' . h($message) . '</p>' : '')
        . '<h1>' . h($C['prenom1'] . ' & ' . $C['prenom2']) . ' <small>' . h($numero) . ' · ' . h($c['prix']) . ' €</small></h1>'
        . '<div class="fiche"><div>' . $etapes . $infos . $danger . '</div>'
        . '<div class="apercu"><iframe src="?action=apercu&n=' . h(rawurlencode($numero)) . '" title="Aperçu du site"></iframe></div></div>');
}

/* ---------- Liste des commandes ---------- */
$commandes = [];
foreach (glob("$DOSSIER/AT-*/commande.json") as $f) { $c = json_decode((string)file_get_contents($f), true); if (is_array($c)) $commandes[] = $c; }
usort($commandes, fn($a, $b) => strcmp($b['recue_le'], $a['recue_le']));
$lignes = '';
foreach ($commandes as $c) {
    $rgpd = $c['TARGET'] && strtotime($c['TARGET'] . ' +3 months') < time();
    $lignes .= '<tr><td><a href="?n=' . h(rawurlencode($c['numero'])) . '">' . h($c['COUPLE']['prenom1'] . ' & ' . $c['COUPLE']['prenom2']) . '</a><br><small>' . h($c['numero']) . '</small></td>'
        . '<td>' . h(date_fr($c['TARGET'])) . ($rgpd ? '<br><small class="rgpd">mariage passé depuis 3 mois : données à supprimer</small>' : '') . '</td>'
        . '<td>' . h($c['prix']) . ' €' . ($c['STYLE']['motif'] === 'perso' ? '<br><small>motif perso</small>' : '') . '</td>'
        . '<td><span class="statut ' . (['payée' => 's-payee', 'publiée' => 's-publiee'][$c['statut']] ?? '') . '">' . h($c['statut']) . '</span></td></tr>';
}
page('Commandes', (isset($_GET['supprimee']) ? '<p class="message">Commande ' . h($_GET['supprimee']) . ' supprimée.</p>' : '')
    . '<h1>Commandes L\'Atelier</h1>'
    . ($lignes ? '<table class="liste"><thead><tr><th>Couple</th><th>Mariage</th><th>Prix</th><th>Statut</th></tr></thead><tbody>' . $lignes . '</tbody></table>'
               : '<div class="carte"><p>Aucune commande pour l\'instant.</p></div>'));
