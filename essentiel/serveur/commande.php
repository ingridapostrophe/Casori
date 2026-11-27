<?php
/* Casorí - L'Atelier - réception des commandes
   Emplacement sur o2switch : public_html/atelier/commande.php
   Les commandes sont rangées HORS de public_html : /home/<identifiant>/commandes-atelier/
   (jamais effacées par une mise à jour du site, jamais visibles depuis internet). */

declare(strict_types=1);

/* ---------- Réglages ---------- */
const EMAIL_CASORI   = 'contact@casori.fr';
const PRIX_AUTORISES = [49, 59];
const TAILLE_MAX     = 12 * 1024 * 1024;   /* requête complète */
const IMAGE_MAX      = 4 * 1024 * 1024;    /* par image */
const COMMANDES_PAR_HEURE = 10;            /* par adresse IP */
const ORIGINES = ['https://casori.fr', 'https://www.casori.fr'];

/* public_html/atelier/commande.php -> /home/<identifiant>/commandes-atelier */
$DOSSIER = getenv('CASORI_COMMANDES') ?: dirname(__DIR__, 2) . '/commandes-atelier';
$ORIGINES = ORIGINES;
if (getenv('CASORI_TEST')) $ORIGINES[] = 'http://localhost:8771';   /* tests locaux uniquement */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function repondre(int $code, array $donnees): void {
    http_response_code($code);
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE);
    exit;
}
function texte($v, int $max): string {
    $v = is_string($v) ? trim($v) : '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}
function sans_retour(string $v): string { return str_replace(["\r", "\n"], ' ', $v); }
function image_base64($data, string $type): ?string {
    if (!is_string($data) || !preg_match('#^data:image/' . $type . ';base64,([A-Za-z0-9+/=]+)$#', $data, $m)) return null;
    $bin = base64_decode($m[1], true);
    if ($bin === false || strlen($bin) > IMAGE_MAX) return null;
    $info = @getimagesizefromstring($bin);
    $attendu = $type === 'png' ? IMAGETYPE_PNG : IMAGETYPE_JPEG;
    if (!$info || $info[2] !== $attendu) return null;
    return $bin;
}

/* ---------- Contrôles de la requête ---------- */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') repondre(405, ['ok' => false, 'erreur' => 'methode']);
$origine = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!in_array($origine, $ORIGINES, true)) repondre(403, ['ok' => false, 'erreur' => 'origine']);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > TAILLE_MAX) repondre(413, ['ok' => false, 'erreur' => 'taille']);

$brut = file_get_contents('php://input', false, null, 0, TAILLE_MAX + 1);
if ($brut === false || strlen($brut) > TAILLE_MAX) repondre(413, ['ok' => false, 'erreur' => 'taille']);
$c = json_decode($brut, true);
if (!is_array($c)) repondre(400, ['ok' => false, 'erreur' => 'format']);

/* Champ piège anti-robots : rempli = probablement un robot.
   On ne jette jamais la commande : elle est enregistrée et signalée « à vérifier ». */
$suspect = !empty($c['zx_controle']);

/* ---------- Dossier des commandes ---------- */
if (!is_dir($DOSSIER) && !@mkdir($DOSSIER, 0700, true)) repondre(500, ['ok' => false, 'erreur' => 'dossier']);
if (!is_file("$DOSSIER/.htaccess")) @file_put_contents("$DOSSIER/.htaccess", "Require all denied\n");

/* Limite : 10 commandes par heure et par adresse IP */
$ip = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'casori');
$fichierLimites = "$DOSSIER/.limites.json";
$limites = is_file($fichierLimites) ? (json_decode((string)file_get_contents($fichierLimites), true) ?: []) : [];
$maintenant = time();
foreach ($limites as $k => $liste) { $limites[$k] = array_values(array_filter($liste, fn($t) => $t > $maintenant - 3600)); if (!$limites[$k]) unset($limites[$k]); }
if (count($limites[$ip] ?? []) >= COMMANDES_PAR_HEURE) repondre(429, ['ok' => false, 'erreur' => 'limite']);

/* ---------- Validation des données ---------- */
$numero = is_string($c['numero'] ?? null) ? $c['numero'] : '';
if (!preg_match('/^AT-\d{8}-[A-Z0-9]{4}$/', $numero)) repondre(400, ['ok' => false, 'erreur' => 'numero']);
$email = filter_var(texte($c['email'] ?? '', 120), FILTER_VALIDATE_EMAIL);
if (!$email) repondre(400, ['ok' => false, 'erreur' => 'email']);
$prix = (int)($c['prix'] ?? 0);
if (!in_array($prix, PRIX_AUTORISES, true)) repondre(400, ['ok' => false, 'erreur' => 'prix']);

$target = is_string($c['TARGET'] ?? null) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $c['TARGET']) ? $c['TARGET'] : '';
$C = is_array($c['COUPLE'] ?? null) ? $c['COUPLE'] : [];
$S = is_array($c['STYLE'] ?? null) ? $c['STYLE'] : [];

$programme = [];
foreach (array_slice(is_array($C['programme'] ?? null) ? $C['programme'] : [], 0, 5) as $m) {
    if (!is_array($m)) continue;
    $programme[] = ['heure' => texte($m['heure'] ?? '', 10), 'titre' => texte($m['titre'] ?? '', 40),
                    'adresse' => texte($m['adresse'] ?? '', 100), 'carte' => !empty($m['carte'])];
}
$rsvpLien = texte($C['rsvpLien'] ?? '', 300);
if (!preg_match('#^https://\S+$#', $rsvpLien)) $rsvpLien = '#';

$couple = [
    'prenom1' => texte($C['prenom1'] ?? '', 20), 'prenom2' => texte($C['prenom2'] ?? '', 20),
    'lieu' => texte($C['lieu'] ?? '', 60), 'ville' => texte($C['ville'] ?? '', 60),
    'photoAlt' => texte($C['photoAlt'] ?? '', 60), 'mot' => texte($C['mot'] ?? '', 300),
    'programme' => $programme, 'note' => texte($C['note'] ?? '', 140),
    'rsvpAvant' => is_string($C['rsvpAvant'] ?? null) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $C['rsvpAvant']) ? $C['rsvpAvant'] : '',
    'rsvpLien' => $rsvpLien,
];
if ($couple['prenom1'] === '' || $couple['prenom2'] === '' || $target === '') repondre(400, ['ok' => false, 'erreur' => 'incomplet']);

$hex = fn($v) => is_string($v) && preg_match('/^#[0-9A-Fa-f]{6}$/', $v) ? strtoupper($v) : '#2E6B5E';
$style = [
    'palette' => in_array($S['palette'] ?? '', ['sauge', 'terracotta', 'mediterranee', 'bordeaux', 'perso'], true) ? $S['palette'] : 'sauge',
    'couleurs' => ['principale' => $hex($S['couleurs']['principale'] ?? null), 'accent' => $hex($S['couleurs']['accent'] ?? null)],
    'motif' => in_array($S['motif'] ?? '', ['brin', 'olivier', 'bougainvillier', 'perso'], true) ? $S['motif'] : 'brin',
    'disposition' => ($S['disposition'] ?? '') === 'deux' ? 'deux' : 'coin',
];

$photo = image_base64($c['photo'] ?? null, 'jpeg');
if ($photo === null) repondre(400, ['ok' => false, 'erreur' => 'photo']);
$motif = null;
if ($style['motif'] === 'perso') {
    $motif = image_base64($c['motifPerso'] ?? null, 'png');
    if ($motif === null) repondre(400, ['ok' => false, 'erreur' => 'motif']);
}
if (($style['motif'] === 'perso') !== ($prix === 59)) repondre(400, ['ok' => false, 'erreur' => 'prix']);

/* ---------- Enregistrement ---------- */
$dossierCommande = "$DOSSIER/$numero";
if (is_dir($dossierCommande)) repondre(409, ['ok' => false, 'erreur' => 'doublon']);
if (!@mkdir($dossierCommande, 0700)) repondre(500, ['ok' => false, 'erreur' => 'dossier']);

$fiche = [
    'numero' => $numero, 'statut' => 'en attente de paiement', 'recue_le' => date('c'), 'a_verifier' => $suspect,
    'email' => $email, 'prix' => $prix, 'adresse_site' => texte($c['adresse'] ?? '', 120),
    'TARGET' => $target, 'COUPLE' => $couple, 'STYLE' => $style,
];
file_put_contents("$dossierCommande/commande.json", json_encode($fiche, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
file_put_contents("$dossierCommande/couple.jpg", $photo);
if ($motif !== null) file_put_contents("$dossierCommande/motif-perso.png", $motif);
foreach (glob("$dossierCommande/*") as $f) @chmod($f, 0600);

$limites[$ip][] = $maintenant;
@file_put_contents($fichierLimites, json_encode($limites));

/* ---------- E-mail à Ingrid ---------- */
$prenoms = $couple['prenom1'] . ' & ' . $couple['prenom2'];
$sujet = ($suspect ? '[À VÉRIFIER] ' : '') . "Nouvelle commande L'Atelier $numero - $prenoms ($prix €)";
$lignes = [
    "Nouvelle commande L'Atelier.",
    '',
    "Numéro : $numero",
    "Couple : $prenoms",
    "Mariage : $target - " . implode(' - ', array_filter([$couple['lieu'], $couple['ville']])),
    "E-mail du couple : $email",
    "Adresse prévue : " . $fiche['adresse_site'],
    "Prix : $prix €" . ($motif !== null ? ' (avec motif personnel - vérifier le rendu et les droits)' : ''),
    "Style : " . $style['palette'] . ' / ' . $style['motif'] . ($style['motif'] === 'bougainvillier' ? ' (' . $style['disposition'] . ')' : ''),
    '',
    'IMPORTANT : attendez la confirmation de paiement Stripe portant ce même numéro avant de publier.',
    "Les fichiers sont dans le dossier commandes-atelier/$numero sur o2switch.",
];
$entetes = implode("\r\n", [
    'From: =?UTF-8?B?' . base64_encode("Casorí L'Atelier") . '?= <' . EMAIL_CASORI . '>',
    'Reply-To: ' . sans_retour($email),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);
$envoye = getenv('CASORI_TEST') ? true : @mail(EMAIL_CASORI, '=?UTF-8?B?' . base64_encode($sujet) . '?=', implode("\n", $lignes), $entetes, '-f' . EMAIL_CASORI);
if (getenv('CASORI_TEST')) file_put_contents("$dossierCommande/email-test.txt", $sujet . "\n\n" . implode("\n", $lignes));

repondre(200, ['ok' => true, 'numero' => $numero, 'email' => $envoye]);
