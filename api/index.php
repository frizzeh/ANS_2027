<?php
declare(strict_types=1);

/**
 * ANS 2027 – API
 *
 * PHP 8.1+ a MariaDB (PDO). Pripojenie je v api/config.php, schéma v database/ans.sql.
 * Odpovede sú JSON. Prihlásenie drží PHP relácia (cookie).
 *
 * GET   help, csrf, tables, list?table=, detail?table=&id=, auth.me,
 *       download?id=<verzia>[&inline=1], export?type=&format=csv|xlsx
 * POST  user.create, auth.login, auth.logout,
 *       registration.create, registration.update, user.update, password.change, payment.create,
 *       submission.create, submission.status, submission.version,
 *       symposium.create, review.assign, program.create, program.delete, email.send, registration.exempt,
 *       admin.create, admin.set_active, conference.update, category.update
 */

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');

// Relácia: cookie nie je čitateľná z JavaScriptu, neposiela sa z cudzích stránok a pri HTTPS len šifrovane.
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('ANSSESSID');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => $isHttps]);
session_start();
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32)); // ochrana proti CSRF


/* Nastavenia
   ------------------------------------------------------------------------ */
const CONFERENCE_ID = 1; // systém obsluhuje jednu konferenciu

/** Roly, ktoré smú do administrácie (ostatné roly = bežný účastník alebo recenzent). */
const STAFF_ROLES = ['superadmin', 'organizer', 'program_committee', 'finance'];

/** Tabuľky, ktoré môže čítať aj neprihlásený návštevník. */
const PUBLIC_TABLES = ['participant_categories', 'conferences', 'symposia', 'deadlines', 'program_items'];

/** Zoznam tabuliek (názov tabuľky sa nikdy nepreberá priamo od používateľa). */
const TABLES = [
    'users', 'roles', 'user_roles', 'conferences', 'symposia', 'deadlines', 'participant_categories',
    'registrations', 'payments', 'invoices', 'submissions', 'submission_authors', 'submission_versions',
    'submission_status_history', 'review_assignments', 'reviews', 'program_items', 'notifications',
    'email_log', 'audit_log',
];

const BOOL_COLUMNS  = ['is_active', 'is_student', 'fee_exempt', 'program_published', 'is_archived', 'is_read', 'is_presenter'];
const MONEY_COLUMNS = ['fee', 'student_fee', 'amount_due', 'amount'];

const SUBMISSION_STATUSES = [
    'submitted', 'admin_check', 'in_review', 'committee_decision',
    'revision_requested', 'conditionally_accepted', 'accepted', 'rejected',
];


/* Pomocné funkcie: odpoveď, vstup
   ------------------------------------------------------------------------ */
function respond(int $code, array $data): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function body(): array
{
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 1024 * 1024) respond(413, ['error' => 'Požiadavka je príliš veľká']);
    $decoded = json_decode(file_get_contents('php://input') ?: '{}', true);
    if (!is_array($decoded)) respond(400, ['error' => 'Neplatný JSON']);
    return $decoded;
}

/** Povinné textové pole. */
function required(array $data, string $key): string
{
    $value = trim((string)($data[$key] ?? ''));
    if ($value === '') respond(422, ['error' => 'Chýba pole: ' . $key]);
    return $value;
}

/** Nepovinné textové pole (prázdne = NULL). */
function optional(array $data, string $key): ?string
{
    $value = trim((string)($data[$key] ?? ''));
    return $value === '' ? null : $value;
}


/* Databáza
   ------------------------------------------------------------------------ */
function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $config = config();
    try {
        $pdo = new PDO(
            "mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4",
            $config['user'],
            $config['pass'],
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    } catch (PDOException $e) {
        error_log('ANS API: ' . $e->getMessage());
        respond(500, ['error' => 'Databáza nie je dostupná. Skontrolujte api/config.php a import database/ans.sql.']);
    }
    return $pdo;
}

function run(string $sql, array $params = []): PDOStatement
{
    $statement = db()->prepare($sql);
    $statement->execute($params);
    return $statement;
}

function one(string $sql, array $params = []): ?array
{
    $row = run($sql, $params)->fetch();
    return $row === false ? null : $row;
}

function all(string $sql, array $params = []): array
{
    return run($sql, $params)->fetchAll();
}

/** Odstráni heslo a prevedie logické a peňažné stĺpce na správne typy JSON. */
function clean(array $row): array
{
    unset($row['password_hash'], $row['file_path']); // názov súboru v úložisku sa neprezrádza
    foreach ($row as $column => $value) {
        if ($value === null) continue;
        if (in_array($column, BOOL_COLUMNS, true))       $row[$column] = (bool)$value;
        elseif (in_array($column, MONEY_COLUMNS, true))  $row[$column] = (float)$value;
    }
    return $row;
}


/* Prihlásenie a oprávnenia
   ------------------------------------------------------------------------ */
function rolesOf(int $userId): array
{
    $rows = all('SELECT r.code FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?', [$userId]);
    return array_values(array_unique(array_column($rows, 'code')));
}

function publicUser(array $user): array
{
    $user = clean($user);
    $user['roles'] = rolesOf((int)$user['id']);
    return $user;
}

/** Prihlásený používateľ (id a roly). Deaktivovaný účet sa odhlási. */
function auth(): array
{
    static $auth = null;
    if ($auth !== null) return $auth;

    $id = (int)($_SESSION['user_id'] ?? 0);
    if ($id) {
        $user = one('SELECT is_active FROM users WHERE id = ?', [$id]);
        if (!$user || !$user['is_active']) {
            unset($_SESSION['user_id']);
            $id = 0;
        }
    }
    return $auth = ['id' => $id, 'roles' => $id ? rolesOf($id) : []];
}

function hasAnyRole(array $codes): bool
{
    return (bool)array_intersect(auth()['roles'], $codes);
}

function isStaff(): bool
{
    return hasAnyRole(STAFF_ROLES);
}

/** Pustí ďalej len používateľa s jednou z rolí, inak vráti 401 alebo 403. */
function requireRoles(array $codes): void
{
    if (!auth()['id']) respond(401, ['error' => 'Neprihlásený']);
    if (!hasAnyRole($codes)) respond(403, ['error' => 'Nedostatočné oprávnenie']);
}

/** Zápis dôležitej operácie do audit_log. */
function audit(string $action, string $entity, ?int $entityId, mixed $old = null, mixed $new = null): void
{
    $encode = fn($value) => $value === null ? null : json_encode($value, JSON_UNESCAPED_UNICODE);
    run(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_value, new_value, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [auth()['id'] ?: null, $action, $entity, $entityId, $encode($old), $encode($new), $_SERVER['REMOTE_ADDR'] ?? null]
    );
}


/* Čítanie tabuliek
   ------------------------------------------------------------------------ */
/**
 * Vráti riadky tabuľky. Administrácia vidí všetko, verejné tabuľky vidí každý,
 * účastník len svoje riadky.
 */
function readRows(string $table, ?int $id): array
{
    if (!in_array($table, TABLES, true)) respond(404, ['error' => 'Neznáma tabuľka']);
    if ($id !== null && $table === 'user_roles') respond(404, ['error' => 'Záznam neexistuje']);
    // Auditný záznam a log e-mailov obsahuje IP adresy a citlivé zmeny: len super admin a organizátor.
    if (in_array($table, ['audit_log', 'email_log'], true)) requireRoles(['superadmin', 'organizer']);

    $where = '1 = 1';
    $params = [];
    $columns = '*';

    if (!isStaff() && !in_array($table, PUBLIC_TABLES, true)) {
        $me = auth()['id'];
        if (!$me) respond(401, ['error' => 'Neprihlásený']);

        $myRegistrations = 'SELECT id FROM registrations WHERE user_id = :me';
        $mySubmissions = 'SELECT s.id FROM submissions s JOIN registrations r ON r.id = s.registration_id WHERE r.user_id = :me';

        // Recenzent vidí len príspevky, ktoré mu boli pridelené (bez mien autorov), a svoje posudky.
        $assigned = "SELECT submission_id FROM review_assignments WHERE reviewer_id = :me AND status <> 'cancelled'";

        $where = match ($table) {
            'review_assignments'      => hasAnyRole(['reviewer']) ? "reviewer_id = :me AND status <> 'cancelled'" : respond(403, ['error' => 'Nedostatočné oprávnenie']),
            'users'                   => 'id = :me',
            'registrations'           => 'user_id = :me',
            'notifications'           => 'user_id = :me',
            'payments', 'invoices',
            'submissions'             => "(registration_id IN ($myRegistrations) OR id IN ($assigned))",
            'submission_versions'     => "(submission_id IN ($mySubmissions) OR submission_id IN ($assigned))",
            'submission_status_history',
            'submission_authors'      => "submission_id IN ($mySubmissions)",
            // Autor vidí posudky na svoje príspevky (bez skóre a poznámok pre výbor), recenzent svoje vlastné.
            'reviews'                 => "(assignment_id IN (SELECT ra.id FROM review_assignments ra JOIN submissions s ON s.id = ra.submission_id JOIN registrations r ON r.id = s.registration_id WHERE r.user_id = :me) OR assignment_id IN (SELECT id FROM review_assignments WHERE reviewer_id = :me))",
            default                   => respond(403, ['error' => 'Nedostatočné oprávnenie']),
        };
        $params['me'] = $me;
        if ($table === 'reviews' && !hasAnyRole(['reviewer'])) $columns = 'id, assignment_id, version_id, recommendation, comment_for_author, submitted_at';
    }

    if ($id !== null) {
        $where .= ' AND id = :id';
        $params['id'] = $id;
    }
    return all("SELECT $columns FROM `$table` WHERE $where", $params);
}


/* Platby
   ------------------------------------------------------------------------ */
/** Prepočíta stav platby registrácie podľa prijatých platieb. */
function refreshPaymentStatus(int $registrationId): array
{
    $registration = one('SELECT * FROM registrations WHERE id = ?', [$registrationId]);
    $received = (float)one(
        "SELECT COALESCE(SUM(CASE type WHEN 'refund' THEN -amount ELSE amount END), 0) AS total FROM payments WHERE registration_id = ?",
        [$registrationId]
    )['total'];

    $status = $registration['payment_status'];
    if (!in_array($status, ['cancelled', 'refunded'], true)) {
        if ($received >= (float)$registration['amount_due'])                     $status = 'paid';
        elseif ($received > 0)                                                   $status = 'partially_paid';
        elseif ($registration['due_date'] !== null && $registration['due_date'] < date('Y-m-d')) $status = 'overdue';
        else                                                                     $status = 'awaiting_payment';
    }

    run('UPDATE registrations SET payment_status = ? WHERE id = ?', [$status, $registrationId]);
    return clean(one('SELECT * FROM registrations WHERE id = ?', [$registrationId]));
}


/* Konfigurácia a ochrana proti CSRF
   ------------------------------------------------------------------------ */
/** Načíta api/config.php (raz). Súbor tiež definuje APP_STORAGE a MAX_UPLOAD_BYTES. */
function config(): array
{
    static $config = null;
    return $config ??= require __DIR__ . '/config.php';
}

/** Každé POST volanie musí poslať token z akcie "csrf" v hlavičke X-CSRF-Token. */
function checkCsrf(): void
{
    // Požiadavka musí prísť z toho istého webu (hlavička Origin, ak ju prehliadač poslal).
    $origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== parse_url('//' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) {
        respond(403, ['error' => 'Požiadavka z cudzieho webu bola zamietnutá.']);
    }
    $sent = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!hash_equals((string)$_SESSION['csrf'], $sent)) {
        respond(403, ['error' => 'Neplatný bezpečnostný token. Obnovte stránku a skúste to znova.']);
    }
}

/** Chyba pre sťahovanie a exporty (obyčajný text namiesto JSON). */
function plainError(int $code, string $message): never
{
    http_response_code($code);
    header('Content-Type: text/plain; charset=utf-8');
    exit($message);
}


/* Ochrana proti hádaniu hesla
   ------------------------------------------------------------------------ */
/** Súbor so záznamom pokusov (v úložisku mimo verejného webu). */
function throttleFile(string $key): string
{
    config();
    $dir = APP_STORAGE . '/ratelimit';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir . '/' . hash('sha256', $key) . '.json';
}

/** Ak bolo príliš veľa neúspešných pokusov, vráti chybu 429 (po 15 minútach sa počítadlo vynuluje). */
function throttleCheck(string $key, int $max = 5, int $window = 900): void
{
    $file = throttleFile($key);
    $state = is_file($file) ? json_decode((string)file_get_contents($file), true) : null;
    if (!is_array($state) || time() - (int)$state['first'] > $window) return;
    if ((int)$state['count'] >= $max) {
        header('Retry-After: ' . max(1, $window - (time() - (int)$state['first'])));
        respond(429, ['error' => 'Príliš veľa neúspešných pokusov. Skúste to znova o niekoľko minút.']);
    }
}

function throttleFail(string $key, int $window = 900): void
{
    $file = throttleFile($key);
    $state = is_file($file) ? json_decode((string)file_get_contents($file), true) : null;
    if (!is_array($state) || time() - (int)$state['first'] > $window) $state = ['count' => 0, 'first' => time()];
    $state['count']++;
    file_put_contents($file, json_encode($state), LOCK_EX);
}

function throttleClear(string $key): void
{
    $file = throttleFile($key);
    if (is_file($file)) @unlink($file);
}


/* Nahrávanie súborov (PDF a DOCX)
   ------------------------------------------------------------------------ */
/**
 * Overí nahratý súbor (prípona, typ, podpis, štruktúra DOCX, veľkosť) a uloží ho
 * do úložiska pod náhodným názvom. Vráti údaje na zápis do databázy.
 */
function storeUpload(array $file): array
{
    config(); // zabezpečí, že úložisko existuje

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) respond(422, ['error' => 'Nahrávanie súboru sa nepodarilo.']);
    if ($file['size'] <= 0 || $file['size'] > MAX_UPLOAD_BYTES) respond(422, ['error' => 'Súbor musí mať veľkosť najviac 20 MB.']);
    if (!is_uploaded_file($file['tmp_name'])) respond(422, ['error' => 'Neplatný nahratý súbor.']);

    $originalName = basename((string)$file['name']);
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);

    if ($extension === 'pdf') {
        $signature = (string)file_get_contents($file['tmp_name'], false, null, 0, 5);
        if ($signature !== '%PDF-' || $mime !== 'application/pdf') respond(422, ['error' => 'Súbor nevyzerá ako platný PDF dokument.']);
        $storedMime = 'application/pdf';
    } elseif ($extension === 'docx') {
        if (!class_exists(ZipArchive::class)) respond(500, ['error' => 'Na kontrolu DOCX je potrebné rozšírenie ZipArchive.']);
        if (!in_array($mime, ['application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], true)) {
            respond(422, ['error' => 'Súbor nevyzerá ako DOCX dokument.']);
        }
        $zip = new ZipArchive();
        if ($zip->open($file['tmp_name']) !== true) respond(422, ['error' => 'DOCX súbor sa nedá otvoriť.']);
        $isDocx = $zip->locateName('[Content_Types].xml') !== false && $zip->locateName('word/document.xml') !== false;
        $zip->close();
        if (!$isDocx) respond(422, ['error' => 'Súbor nemá štruktúru DOCX dokumentu.']);
        $storedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
        respond(422, ['error' => 'Povolené sú iba súbory PDF a DOCX.']);
    }

    $storedName = bin2hex(random_bytes(20)) . '.' . $extension;
    $path = APP_STORAGE . '/files/' . $storedName;
    if (!move_uploaded_file($file['tmp_name'], $path)) {
        respond(500, ['error' => 'Súbor sa nepodarilo uložiť. Skontrolujte oprávnenia priečinka úložiska.']);
    }
    chmod($path, 0600);

    return ['stored_name' => $storedName, 'original_name' => $originalName, 'mime' => $storedMime, 'size' => (int)$file['size'], 'path' => $path];
}

/** Bezpečné stiahnutie alebo náhľad verzie príspevku (autor, zamestnanec alebo pridelený recenzent). */
function sendDownload(int $versionId, bool $inline): never
{
    config();
    $me = auth()['id'];
    if (!$me) plainError(401, 'Najprv sa prihláste.');

    $version = one(
        'SELECT v.*, r.user_id AS owner_id FROM submission_versions v
         JOIN submissions s ON s.id = v.submission_id JOIN registrations r ON r.id = s.registration_id WHERE v.id = ?',
        [$versionId]
    ) ?? plainError(404, 'Dokument sa nenašiel.');

    $isOwner = (int)$version['owner_id'] === $me;
    $isReviewer = (bool)one("SELECT id FROM review_assignments WHERE submission_id = ? AND reviewer_id = ? AND status <> 'cancelled'", [$version['submission_id'], $me]);
    if (!$isOwner && !isStaff() && !$isReviewer) plainError(403, 'Na tento dokument nemáte prístup.');

    $path = APP_STORAGE . '/files/' . basename((string)$version['file_path']);
    if (!is_file($path)) plainError(404, 'Súbor už nie je dostupný.');

    $extension = strtolower(pathinfo((string)$version['original_filename'], PATHINFO_EXTENSION));
    $isPdf = $extension === 'pdf';
    $safeName = sprintf('prispevok-%d-v%d.%s', $version['submission_id'], $version['version_number'], $extension === 'docx' ? 'docx' : 'pdf');

    header('Content-Type: ' . ($isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . filesize($path));
    header('Content-Disposition: ' . ($inline && $isPdf ? 'inline' : 'attachment') . '; filename="' . $safeName . '"');
    readfile($path);
    exit;
}


/* Exporty (CSV a XLSX)
   ------------------------------------------------------------------------ */
/** Zabraňuje tomu, aby sa bunka v tabuľke spustila ako vzorec. */
function safeCsvCell(string $value): string
{
    return preg_match('/^[\s]*[=+\-@]/u', $value) ? "'" . $value : $value;
}

/** Definícia exportu: názov, hlavičky a riadky. */
function exportDefinition(string $type): array
{
    $name = "CONCAT_WS(' ', u.title_before, u.first_name, u.last_name, u.title_after)";
    $rows = fn(string $sql, array $params = []) => run($sql, $params)->fetchAll(PDO::FETCH_NUM);

    switch ($type) {
        case 'participants':
            $where = ['r.conference_id = ?'];
            $params = [CONFERENCE_ID];
            $status = (string)($_GET['payment_status'] ?? '');
            if ($status !== '') { $where[] = 'r.payment_status = ?'; $params[] = $status; }
            $category = (int)($_GET['category_id'] ?? 0);
            if ($category) { $where[] = 'r.category_id = ?'; $params[] = $category; }
            return [
                'title' => 'Účastníci', 'filename' => 'ucastnici',
                'headers' => ['Meno', 'E-mail', 'Organizácia', 'Krajina', 'Kategória', 'Študent', 'Suma', 'Variabilný symbol', 'Stav platby', 'Strava', 'Dátum registrácie'],
                'rows' => $rows("SELECT $name, u.email, u.organization, u.country, c.name_sk, IF(r.is_student, 'áno', 'nie'), r.amount_due, r.variable_symbol, r.payment_status, r.dietary_requirements, r.created_at
                                 FROM registrations r JOIN users u ON u.id = r.user_id JOIN participant_categories c ON c.id = r.category_id
                                 WHERE " . implode(' AND ', $where) . ' ORDER BY u.last_name, u.first_name', $params),
            ];

        case 'payments':
            return [
                'title' => 'Platby', 'filename' => 'platby',
                'headers' => ['ID platby', 'Účastník', 'Typ', 'Suma', 'Dátum prijatia', 'Potvrdil', 'Variabilný symbol'],
                'rows' => $rows("SELECT p.id, $name, p.type, p.amount, p.received_at, CONCAT_WS(' ', cb.first_name, cb.last_name), r.variable_symbol
                                 FROM payments p JOIN registrations r ON r.id = p.registration_id JOIN users u ON u.id = r.user_id
                                 LEFT JOIN users cb ON cb.id = p.confirmed_by ORDER BY p.id"),
            ];

        case 'submissions':
            return [
                'title' => 'Príspevky', 'filename' => 'prispevky',
                'headers' => ['ID', 'Názov', 'Autor', 'Typ', 'Oblasť', 'Stav', 'Verzia', 'Súbor', 'Veľkosť (bajty)', 'Nahrané'],
                'rows' => $rows("SELECT s.id, s.title, $name, s.type, sy.name_sk, s.status, v.version_number, v.original_filename, v.file_size, v.uploaded_at
                                 FROM submissions s JOIN registrations r ON r.id = s.registration_id JOIN users u ON u.id = r.user_id
                                 LEFT JOIN symposia sy ON sy.id = s.symposium_id
                                 LEFT JOIN submission_versions v ON v.submission_id = s.id
                                      AND v.version_number = (SELECT MAX(version_number) FROM submission_versions WHERE submission_id = s.id)
                                 ORDER BY s.id"),
            ];

        case 'attendance': // prezenčná listina: všetci registrovaní okrem stornovaných a vrátených
            return [
                'title' => 'Prezenčná listina', 'filename' => 'prezencna_listina',
                'headers' => ['Meno', 'Organizácia', 'Kategória', 'Variabilný symbol', 'Podpis'],
                'rows' => $rows("SELECT $name, u.organization, c.name_sk, r.variable_symbol, ''
                                 FROM registrations r JOIN users u ON u.id = r.user_id JOIN participant_categories c ON c.id = r.category_id
                                 WHERE r.conference_id = ? AND r.payment_status NOT IN ('cancelled', 'refunded') ORDER BY u.last_name, u.first_name", [CONFERENCE_ID]),
            ];
    }
    plainError(400, 'Neznámy typ exportu.');
}

function sendExport(string $type, string $format): never
{
    requireRoles($type === 'payments' ? ['superadmin', 'organizer', 'finance'] : ['superadmin', 'organizer']);
    if (!in_array($format, ['csv', 'xlsx'], true)) plainError(400, 'Nepodporovaný formát exportu.');
    $export = exportDefinition($type);

    if ($format === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $export['filename'] . '.csv"');
        $out = fopen('php://output', 'wb');
        fwrite($out, "\xEF\xBB\xBF"); // aby Excel správne zobrazil diakritiku
        fputcsv($out, $export['headers'], ';', '"', '\\');
        foreach ($export['rows'] as $row) {
            fputcsv($out, array_map(static fn($value): string => safeCsvCell((string)($value ?? '')), $row), ';', '"', '\\');
        }
        fclose($out);
        exit;
    }

    // XLSX potrebuje knižnicu PhpSpreadsheet (composer require phpoffice/phpspreadsheet).
    foreach ([dirname(__DIR__) . '/vendor/autoload.php', __DIR__ . '/vendor/autoload.php'] as $autoload) {
        if (is_file($autoload)) { require_once $autoload; break; }
    }
    if (!class_exists(\PhpOffice\PhpSpreadsheet\Spreadsheet::class)) {
        plainError(503, 'XLSX export potrebuje PhpSpreadsheet. Nainštalujte ho: composer require phpoffice/phpspreadsheet');
    }

    $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle(mb_substr($export['title'], 0, 31));
    $sheet->fromArray($export['headers'], null, 'A1');
    foreach ($export['rows'] as $rowIndex => $row) {
        foreach (array_values($row) as $columnIndex => $value) {
            $cell = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex + 1) . ($rowIndex + 2);
            // Text namiesto vzorca: obsah sa nikdy nespustí ako vzorec.
            $sheet->setCellValueExplicit($cell, (string)($value ?? ''), \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
        }
    }
    $lastColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($export['headers']));
    $sheet->getStyle('A1:' . $lastColumn . '1')->getFont()->setBold(true);
    $sheet->freezePane('A2');
    $sheet->setAutoFilter('A1:' . $lastColumn . max(1, count($export['rows']) + 1));
    foreach (range(1, count($export['headers'])) as $columnIndex) {
        $sheet->getColumnDimension(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex))->setAutoSize(true);
    }

    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $export['filename'] . '.xlsx"');
    header('Cache-Control: max-age=0');
    (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet))->save('php://output');
    exit;
}


/* GET akcie
   ------------------------------------------------------------------------ */
function handleGet(string $action): void
{
    switch ($action) {
        case 'help':
            respond(200, [
                'name' => 'ANS 2027 API (MariaDB)',
                'get'  => ['csrf', 'download?id=...', 'export?type=...&format=csv|xlsx', 'tables', 'list?table=...', 'detail?table=...&id=...', 'auth.me'],
                'post' => ['user.create', 'auth.login', 'auth.logout', 'registration.create', 'registration.update', 'user.update', 'password.change', 'payment.create',
                           'submission.create', 'submission.status', 'submission.version', 'symposium.create',
                           'review.assign', 'review.submit', 'program.create', 'program.delete', 'email.send', 'registration.exempt',
                           'admin.create', 'role.add', 'role.remove', 'admin.set_active', 'conference.update', 'category.update'],
            ]);

        case 'tables':
            requireRoles(STAFF_ROLES);
            respond(200, ['tables' => TABLES]);

        case 'list':
            $rows = readRows((string)($_GET['table'] ?? ''), null);
            respond(200, ['data' => array_map('clean', $rows)]);

        case 'detail':
            $rows = readRows((string)($_GET['table'] ?? ''), (int)($_GET['id'] ?? 0));
            if (!$rows) respond(404, ['error' => 'Záznam neexistuje']);
            respond(200, ['data' => clean($rows[0])]);

        case 'auth.me':
            $id = auth()['id'];
            if (!$id) respond(401, ['error' => 'Neprihlásený']);
            respond(200, ['data' => publicUser(one('SELECT * FROM users WHERE id = ?', [$id]))]);

        case 'csrf':
            respond(200, ['token' => $_SESSION['csrf']]);

        case 'download':
            sendDownload((int)($_GET['id'] ?? 0), ($_GET['inline'] ?? '') === '1');

        case 'export':
            sendExport((string)($_GET['type'] ?? ''), strtolower((string)($_GET['format'] ?? 'csv')));

        default:
            respond(404, ['error' => 'Neznáma GET akcia']);
    }
}


/* POST akcie
   ------------------------------------------------------------------------ */
function handlePost(string $action, array $p): void
{
    checkCsrf();
    $pdo = db();
    $me = auth()['id'];

    switch ($action) {

        /* ----- Účty a prihlásenie ----- */
        case 'user.create':
            $email = required($p, 'email');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(422, ['error' => 'Neplatný e-mail']);
            $password = required($p, 'password');
            if (strlen($password) < 8 || strlen($password) > 72) respond(422, ['error' => 'Heslo musí mať 8 až 72 znakov']);
            if (one('SELECT id FROM users WHERE email = ?', [$email])) respond(409, ['error' => 'E-mail už existuje']);

            run(
                'INSERT INTO users (email, password_hash, title_before, first_name, last_name, title_after, organization, organization_address, department, country, preferred_language)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $email, password_hash($password, PASSWORD_DEFAULT), optional($p, 'title_before'),
                    required($p, 'first_name'), required($p, 'last_name'), optional($p, 'title_after'),
                    optional($p, 'organization'), optional($p, 'organization_address'), optional($p, 'department'),
                    optional($p, 'country'), in_array($p['preferred_language'] ?? 'sk', ['sk', 'en'], true) ? $p['preferred_language'] : 'sk',
                ]
            );
            respond(201, ['data' => publicUser(one('SELECT * FROM users WHERE id = ?', [(int)$pdo->lastInsertId()]))]);

        case 'auth.login':
            $email = strtolower(required($p, 'email'));
            $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
            // Obmedzenie pokusov: na jeden účet z jednej adresy a celkovo z jednej adresy.
            throttleCheck('login:' . $ip . ':' . $email, 5);
            throttleCheck('login-ip:' . $ip, 30);
            $user = one('SELECT * FROM users WHERE email = ?', [$email]);
            // password_verify beží vždy (aj pre neexistujúci účet), aby odpoveď neprezradila, či e-mail existuje.
            $hash = $user['password_hash'] ?? '$2y$10$usesomesillystringforsaltuQfwhh7BoHCzC1xhRWXlYrK1Ucm5u';
            $valid = password_verify((string)($p['password'] ?? ''), $hash) && $user;
            if (!$valid) {
                throttleFail('login:' . $ip . ':' . $email);
                throttleFail('login-ip:' . $ip);
                respond(401, ['error' => 'Nesprávny e-mail alebo heslo']);
            }
            if (!$user['is_active']) respond(403, ['error' => 'Účet je deaktivovaný']);
            throttleClear('login:' . $ip . ':' . $email);
            session_regenerate_id(true);
            $_SESSION['user_id'] = (int)$user['id'];
            run('UPDATE users SET last_login_at = NOW() WHERE id = ?', [$user['id']]);
            respond(200, ['data' => publicUser($user)]);

        case 'auth.logout':
            $_SESSION = [];
            $cookie = session_get_cookie_params();
            setcookie(session_name(), '', ['expires' => time() - 42000, 'path' => $cookie['path'], 'domain' => $cookie['domain'], 'secure' => $cookie['secure'], 'httponly' => true, 'samesite' => 'Lax']);
            session_destroy();
            respond(200, ['message' => 'Odhlásený']);

        /* ----- Registrácia účastníka ----- */
        case 'registration.create':
            $userId = (int)($p['user_id'] ?? 0);
            if (!isStaff() && $userId !== $me) respond($me ? 403 : 401, ['error' => 'Nedostatočné oprávnenie']);
            one('SELECT id FROM users WHERE id = ?', [$userId]) ?? respond(404, ['error' => 'Používateľ neexistuje']);

            $conferenceId = (int)($p['conference_id'] ?? CONFERENCE_ID);
            $conference = one('SELECT * FROM conferences WHERE id = ?', [$conferenceId]) ?? respond(404, ['error' => 'Konferencia neexistuje']);
            $categoryId = (int)($p['category_id'] ?? 0);
            $category = one('SELECT * FROM participant_categories WHERE id = ? AND conference_id = ?', [$categoryId, $conferenceId])
                ?? respond(422, ['error' => 'Neplatná kategória účastníka']);

            if (one('SELECT id FROM registrations WHERE user_id = ? AND conference_id = ?', [$userId, $conferenceId])) {
                respond(409, ['error' => 'Používateľ už je registrovaný']);
            }
            if (empty($p['gdpr_consent'])) respond(422, ['error' => 'Je potrebný súhlas so spracovaním osobných údajov']);

            $isStudent = (bool)($p['is_student'] ?? false);
            $isExempt = isStaff() && (bool)($p['fee_exempt'] ?? false); // oslobodenie od poplatku smie nastaviť len administrácia
            $price = ($isStudent && $category['student_fee'] !== null) ? (float)$category['student_fee'] : (float)$category['fee'];
            $amount = $isExempt ? 0.0 : $price;
            $deadline = one("SELECT DATE(deadline_at) AS day FROM deadlines WHERE conference_id = ? AND step = 'payment'", [$conferenceId]);

            $pdo->beginTransaction();
            try {
                run(
                    'INSERT INTO registrations
                       (user_id, conference_id, category_id, is_student, dietary_requirements, gdpr_consent_at,
                        billing_name, billing_street, billing_city, billing_zip, billing_country, billing_ico, billing_dic, billing_ic_dph,
                        fee_exempt, exempt_reason, amount_due, variable_symbol, due_date, payment_status)
                     VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $userId, $conferenceId, $categoryId, (int)$isStudent, optional($p, 'dietary_requirements'),
                        optional($p, 'billing_name'), optional($p, 'billing_street'), optional($p, 'billing_city'), optional($p, 'billing_zip'),
                        optional($p, 'billing_country'), optional($p, 'billing_ico'), optional($p, 'billing_dic'), optional($p, 'billing_ic_dph'),
                        (int)$isExempt, $isExempt ? optional($p, 'exempt_reason') : null, $amount,
                        'tmp' . bin2hex(random_bytes(6)), // dočasný symbol, nižšie sa nahradí podľa id
                        $deadline['day'] ?? null, $amount === 0.0 ? 'paid' : 'awaiting_payment',
                    ]
                );
                $registrationId = (int)$pdo->lastInsertId();
                run('UPDATE registrations SET variable_symbol = ? WHERE id = ?', [$conference['year'] . sprintf('%04d', $registrationId), $registrationId]);
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
            respond(201, ['data' => clean(one('SELECT * FROM registrations WHERE id = ?', [$registrationId]))]);

        /* ----- Profil a nastavenia prihláseného používateľa ----- */
        case 'user.update':
            if (!$me) respond(401, ['error' => 'Neprihlásený']);
            $language = (string)($p['preferred_language'] ?? 'sk');

            // E-mail (slúži na prihlásenie) sa dá zmeniť, musí byť platný a nesmie patriť inému účtu.
            $email = trim((string)($p['email'] ?? ''));
            if ($email === '') $email = (string)one('SELECT email FROM users WHERE id = ?', [$me])['email'];
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(422, ['error' => 'Neplatný e-mail']);
            if (one('SELECT id FROM users WHERE email = ? AND id <> ?', [$email, $me])) respond(409, ['error' => 'E-mail už používa iný účet']);

            run(
                'UPDATE users SET email = ?, title_before = ?, first_name = ?, last_name = ?, title_after = ?, organization = ?, organization_address = ?, department = ?, country = ?, preferred_language = ? WHERE id = ?',
                [
                    $email, optional($p, 'title_before'), required($p, 'first_name'), required($p, 'last_name'), optional($p, 'title_after'),
                    optional($p, 'organization'), optional($p, 'organization_address'), optional($p, 'department'), optional($p, 'country'),
                    in_array($language, ['sk', 'en'], true) ? $language : 'sk', $me,
                ]
            );
            audit('user.update', 'user', $me);
            respond(200, ['data' => publicUser(one('SELECT * FROM users WHERE id = ?', [$me]))]);

        case 'password.change':
            if (!$me) respond(401, ['error' => 'Neprihlásený']);
            throttleCheck('password:' . $me, 5);
            $user = one('SELECT * FROM users WHERE id = ?', [$me]);
            if (!password_verify((string)($p['current_password'] ?? ''), $user['password_hash'])) {
                throttleFail('password:' . $me);
                respond(422, ['error' => 'Aktuálne heslo nie je správne']);
            }
            throttleClear('password:' . $me);
            $newPassword = required($p, 'new_password');
            if (strlen($newPassword) < 8 || strlen($newPassword) > 72) respond(422, ['error' => 'Heslo musí mať 8 až 72 znakov']);
            run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($newPassword, PASSWORD_DEFAULT), $me]);
            audit('password.change', 'user', $me);
            respond(200, ['message' => 'Heslo bolo zmenené']);

        case 'registration.update': // fakturačné údaje a stravovanie (suma a stav platby sa tu meniť nedajú)
            $registrationId = (int)($p['registration_id'] ?? 0);
            $registration = one('SELECT * FROM registrations WHERE id = ?', [$registrationId]) ?? respond(404, ['error' => 'Registrácia neexistuje']);
            if (!isStaff() && (int)$registration['user_id'] !== $me) respond($me ? 403 : 401, ['error' => 'Nedostatočné oprávnenie']);
            run(
                'UPDATE registrations SET billing_name = ?, billing_street = ?, billing_city = ?, billing_zip = ?, billing_country = ?, billing_ico = ?, billing_dic = ?, billing_ic_dph = ?, dietary_requirements = ? WHERE id = ?',
                [
                    optional($p, 'billing_name'), optional($p, 'billing_street'), optional($p, 'billing_city'), optional($p, 'billing_zip'),
                    optional($p, 'billing_country'), optional($p, 'billing_ico'), optional($p, 'billing_dic'), optional($p, 'billing_ic_dph'),
                    optional($p, 'dietary_requirements'), $registrationId,
                ]
            );
            respond(200, ['data' => clean(one('SELECT * FROM registrations WHERE id = ?', [$registrationId]))]);

        /* ----- Platby (ekonomické oddelenie, organizátor, super admin) ----- */
        case 'payment.create':
            requireRoles(['superadmin', 'organizer', 'finance']);
            $registrationId = (int)($p['registration_id'] ?? 0);
            $registration = one('SELECT * FROM registrations WHERE id = ?', [$registrationId]) ?? respond(404, ['error' => 'Registrácia neexistuje']);
            $type = (string)($p['type'] ?? 'payment');
            if (!in_array($type, ['payment', 'refund'], true)) respond(422, ['error' => 'Neplatný typ platby']);
            $amount = (float)($p['amount'] ?? 0);
            if ($amount <= 0) respond(422, ['error' => 'Suma musí byť kladná']);

            run(
                'INSERT INTO payments (registration_id, type, amount, received_at, confirmed_by, note) VALUES (?, ?, ?, CURDATE(), ?, ?)',
                [$registrationId, $type, $amount, $me, optional($p, 'note')]
            );
            $paymentId = (int)$pdo->lastInsertId();
            $updated = refreshPaymentStatus($registrationId);
            audit('payment.' . $type, 'registration', $registrationId,
                ['payment_status' => $registration['payment_status']], ['payment_status' => $updated['payment_status'], 'amount' => $amount]);
            respond(201, ['data' => clean(one('SELECT * FROM payments WHERE id = ?', [$paymentId])), 'registration' => $updated]);

        /* ----- Príspevky ----- */
        case 'submission.create':
            $registrationId = (int)($p['registration_id'] ?? 0);
            $registration = one('SELECT * FROM registrations WHERE id = ?', [$registrationId]) ?? respond(404, ['error' => 'Registrácia neexistuje']);
            if (!isStaff() && (int)$registration['user_id'] !== $me) respond($me ? 403 : 401, ['error' => 'Nedostatočné oprávnenie']);

            $category = one('SELECT * FROM participant_categories WHERE id = ?', [$registration['category_id']]);
            if ($category['submission_type'] === null) respond(422, ['error' => 'Táto kategória príspevok nepodáva']);
            $type = (string)($p['type'] ?? $category['submission_type']);
            if ($type !== $category['submission_type']) respond(422, ['error' => 'Typ príspevku nezodpovedá kategórii']);

            $symposiumId = (int)($p['symposium_id'] ?? 0);
            one('SELECT id FROM symposia WHERE id = ? AND conference_id = ?', [$symposiumId, $registration['conference_id']])
                ?? respond(422, ['error' => 'Vyberte tematickú oblasť (symposium)']);
            $title = required($p, 'title');
            $abstract = required($p, 'abstract');
            $author = one('SELECT * FROM users WHERE id = ?', [$registration['user_id']]);

            $pdo->beginTransaction();
            try {
                run(
                    'INSERT INTO submissions (conference_id, registration_id, symposium_id, type, title, abstract, keywords) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [$registration['conference_id'], $registrationId, $symposiumId, $type, $title, $abstract, optional($p, 'keywords')]
                );
                $submissionId = (int)$pdo->lastInsertId();
                run('INSERT INTO submission_status_history (submission_id, from_status, to_status, changed_by) VALUES (?, NULL, ?, ?)',
                    [$submissionId, 'submitted', $me]);
                run('INSERT INTO submission_authors (submission_id, user_id, first_name, last_name, email, organization, author_order, is_presenter) VALUES (?, ?, ?, ?, ?, ?, 1, 1)',
                    [$submissionId, $author['id'], $author['first_name'], $author['last_name'], $author['email'], $author['organization']]);
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
            respond(201, ['data' => clean(one('SELECT * FROM submissions WHERE id = ?', [$submissionId]))]);

        case 'submission.status':
            requireRoles(['superadmin', 'organizer', 'program_committee']);
            $submissionId = (int)($p['submission_id'] ?? 0);
            $submission = one('SELECT * FROM submissions WHERE id = ?', [$submissionId]) ?? respond(404, ['error' => 'Príspevok neexistuje']);
            $to = required($p, 'to_status');
            if (!in_array($to, SUBMISSION_STATUSES, true)) respond(422, ['error' => 'Neplatný stav', 'allowed' => SUBMISSION_STATUSES]);

            run('INSERT INTO submission_status_history (submission_id, from_status, to_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)',
                [$submissionId, $submission['status'], $to, $me, optional($p, 'comment')]);
            run('UPDATE submissions SET status = ? WHERE id = ?', [$to, $submissionId]);
            audit('submission.status', 'submission', $submissionId, ['status' => $submission['status']], ['status' => $to]);
            respond(200, ['data' => clean(one('SELECT * FROM submissions WHERE id = ?', [$submissionId]))]);

        case 'submission.version': // nahratie súboru (multipart: polia submission_id a file)
            $submissionId = (int)($_POST['submission_id'] ?? 0);
            $submission = one('SELECT * FROM submissions WHERE id = ?', [$submissionId]) ?? respond(404, ['error' => 'Príspevok neexistuje']);
            $owner = one('SELECT user_id FROM registrations WHERE id = ?', [$submission['registration_id']]);
            if (!isStaff() && (int)$owner['user_id'] !== $me) respond($me ? 403 : 401, ['error' => 'Nedostatočné oprávnenie']);
            if (!isset($_FILES['file'])) respond(422, ['error' => 'Vyberte súbor na nahratie.']);

            $stored = storeUpload($_FILES['file']);
            try {
                $next = (int)one('SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM submission_versions WHERE submission_id = ?', [$submissionId])['next'];
                run(
                    'INSERT INTO submission_versions (submission_id, version_number, file_path, original_filename, mime_type, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [$submissionId, $next, $stored['stored_name'], $stored['original_name'], $stored['mime'], $stored['size'], $me]
                );
            } catch (Throwable $e) {
                @unlink($stored['path']); // ak sa zápis do databázy nepodarí, súbor sa nenecháva
                throw $e;
            }
            respond(201, ['data' => clean(one('SELECT * FROM submission_versions WHERE id = ?', [(int)$pdo->lastInsertId()]))]);

        /* ----- Recenzie, program, e-maily, oslobodenie od poplatku ----- */
        case 'review.assign':
            requireRoles(['superadmin', 'organizer', 'program_committee']);
            $submissionId = (int)($p['submission_id'] ?? 0);
            $submission = one('SELECT * FROM submissions WHERE id = ?', [$submissionId]) ?? respond(404, ['error' => 'Príspevok neexistuje']);
            $reviewerId = (int)($p['reviewer_id'] ?? 0);
            if (!in_array('reviewer', rolesOf($reviewerId), true)) respond(422, ['error' => 'Vybraný používateľ nie je recenzent']);

            run('INSERT INTO review_assignments (submission_id, reviewer_id, assigned_by, due_date) VALUES (?, ?, ?, ?)',
                [$submissionId, $reviewerId, $me, optional($p, 'due_date')]);
            $assignmentId = (int)$pdo->lastInsertId();

            // Prvé pridelenie recenzenta posunie príspevok do recenzného konania.
            if (in_array($submission['status'], ['submitted', 'admin_check'], true)) {
                run('INSERT INTO submission_status_history (submission_id, from_status, to_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)',
                    [$submissionId, $submission['status'], 'in_review', $me, 'Pridelený recenzent']);
                run("UPDATE submissions SET status = 'in_review' WHERE id = ?", [$submissionId]);
            }
            audit('review.assign', 'submission', $submissionId, null, ['reviewer_id' => $reviewerId]);
            respond(201, ['data' => clean(one('SELECT * FROM review_assignments WHERE id = ?', [$assignmentId]))]);

        case 'review.submit': // recenzent odošle alebo upraví posudok na pridelený príspevok
            requireRoles(['reviewer']);
            $assignment = one('SELECT * FROM review_assignments WHERE id = ? AND reviewer_id = ?', [(int)($p['assignment_id'] ?? 0), $me])
                ?? respond(404, ['error' => 'Toto pridelenie neexistuje']);
            if ($assignment['status'] === 'cancelled') respond(422, ['error' => 'Pridelenie bolo zrušené']);
            $submission = one('SELECT * FROM submissions WHERE id = ?', [$assignment['submission_id']]);
            if ($submission['status'] !== 'in_review') respond(422, ['error' => 'Príspevok už nie je v recenznom konaní, posudok nemožno meniť']);

            $score = (int)($p['score'] ?? 0);
            if ($score < 1 || $score > 10) respond(422, ['error' => 'Hodnotenie musí byť od 1 do 10']);
            $recommendation = (string)($p['recommendation'] ?? '');
            if (!in_array($recommendation, ['accept', 'accept_after_revision', 'reject'], true)) respond(422, ['error' => 'Vyberte odporúčanie']);
            $version = one('SELECT id FROM submission_versions WHERE submission_id = ? ORDER BY version_number DESC LIMIT 1', [$submission['id']])
                ?? respond(422, ['error' => 'Príspevok nemá nahratý súbor']);

            $pdo->beginTransaction();
            try {
                $existing = one('SELECT id FROM reviews WHERE assignment_id = ?', [$assignment['id']]);
                if ($existing) {
                    run('UPDATE reviews SET version_id = ?, score = ?, recommendation = ?, comment_for_author = ?, comment_for_committee = ?, submitted_at = NOW() WHERE id = ?',
                        [$version['id'], $score, $recommendation, optional($p, 'comment_for_author'), optional($p, 'comment_for_committee'), $existing['id']]);
                    $reviewId = (int)$existing['id'];
                } else {
                    run('INSERT INTO reviews (assignment_id, version_id, score, recommendation, comment_for_author, comment_for_committee) VALUES (?, ?, ?, ?, ?, ?)',
                        [$assignment['id'], $version['id'], $score, $recommendation, optional($p, 'comment_for_author'), optional($p, 'comment_for_committee')]);
                    $reviewId = (int)$pdo->lastInsertId();
                }
                run("UPDATE review_assignments SET status = 'completed' WHERE id = ?", [$assignment['id']]);

                // Keď odovzdajú posudky všetci pridelení recenzenti, rozhoduje programový výbor.
                $open = (int)one("SELECT COUNT(*) AS n FROM review_assignments WHERE submission_id = ? AND status = 'assigned'", [$submission['id']])['n'];
                if ($open === 0) {
                    run('INSERT INTO submission_status_history (submission_id, from_status, to_status, changed_by, comment) VALUES (?, ?, ?, ?, ?)',
                        [$submission['id'], 'in_review', 'committee_decision', $me, 'Všetky posudky boli odovzdané']);
                    run("UPDATE submissions SET status = 'committee_decision' WHERE id = ?", [$submission['id']]);
                }
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
            audit('review.submit', 'review', $reviewId, null, ['submission_id' => (int)$submission['id'], 'recommendation' => $recommendation]);
            respond(201, ['data' => clean(one('SELECT * FROM reviews WHERE id = ?', [$reviewId]))]);

        case 'program.create':
            requireRoles(['superadmin', 'organizer', 'program_committee']);
            $symposiumId = (int)($p['symposium_id'] ?? 0) ?: null;
            if ($symposiumId !== null) {
                one('SELECT id FROM symposia WHERE id = ? AND conference_id = ?', [$symposiumId, CONFERENCE_ID]) ?? respond(422, ['error' => 'Neplatná tematická oblasť']);
            }
            $start = optional($p, 'start_at');
            $end = optional($p, 'end_at');
            run('INSERT INTO program_items (conference_id, symposium_id, title, room, start_at, end_at) VALUES (?, ?, ?, ?, ?, ?)',
                [CONFERENCE_ID, $symposiumId, required($p, 'title'), optional($p, 'room'),
                 $start ? str_replace('T', ' ', $start) : null, $end ? str_replace('T', ' ', $end) : null]);
            $itemId = (int)$pdo->lastInsertId();
            audit('program.create', 'program_item', $itemId, null, ['title' => $p['title']]);
            respond(201, ['data' => clean(one('SELECT * FROM program_items WHERE id = ?', [$itemId]))]);

        case 'program.delete':
            requireRoles(['superadmin', 'organizer', 'program_committee']);
            $itemId = (int)($p['id'] ?? 0);
            $item = one('SELECT * FROM program_items WHERE id = ?', [$itemId]) ?? respond(404, ['error' => 'Bod programu neexistuje']);
            run('DELETE FROM program_items WHERE id = ?', [$itemId]);
            audit('program.delete', 'program_item', $itemId, ['title' => $item['title']], null);
            respond(200, ['message' => 'Zmazané']);

        case 'email.send': // hromadný e-mail registrovaným účastníkom (voliteľne podľa stavu platby)
            requireRoles(['superadmin', 'organizer']);
            $subject = required($p, 'subject');
            $message = required($p, 'message');
            $status = (string)($p['payment_status'] ?? '');
            $sql = 'SELECT u.id, u.email FROM users u JOIN registrations r ON r.user_id = u.id WHERE r.conference_id = ?';
            $params = [CONFERENCE_ID];
            if ($status !== '') {
                if (!in_array($status, ['awaiting_payment', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded'], true)) {
                    respond(422, ['error' => 'Neplatný stav platby']);
                }
                $sql .= ' AND r.payment_status = ?';
                $params[] = $status;
            }
            $recipients = all($sql, $params);
            if (!$recipients) respond(422, ['error' => 'Pre zvolený výber nie sú žiadni príjemcovia']);

            $config = config();
            $headers = 'From: ' . ($config['mail_from'] ?? 'noreply@localhost') . "\r\nContent-Type: text/plain; charset=UTF-8";
            $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
            $accepted = 0;
            foreach ($recipients as $recipient) {
                if (@mail($recipient['email'], $encodedSubject, $message, $headers)) $accepted++;
                run('INSERT INTO email_log (recipient_user_id, recipient_email, subject, type, sent_by) VALUES (?, ?, ?, ?, ?)',
                    [$recipient['id'], $recipient['email'], $subject, 'bulk', $me]);
            }
            audit('email.send', 'email', null, null, ['subject' => $subject, 'recipients' => count($recipients)]);
            respond(200, ['recipients' => count($recipients), 'accepted' => $accepted]);

        case 'registration.exempt': // individuálne oslobodenie od poplatku (napr. pozvaný rečník)
            requireRoles(['superadmin', 'organizer']);
            $registrationId = (int)($p['registration_id'] ?? 0);
            $registration = one('SELECT * FROM registrations WHERE id = ?', [$registrationId]) ?? respond(404, ['error' => 'Registrácia neexistuje']);
            $exempt = (bool)($p['exempt'] ?? false);
            $category = one('SELECT * FROM participant_categories WHERE id = ?', [$registration['category_id']]);
            $price = ($registration['is_student'] && $category['student_fee'] !== null) ? (float)$category['student_fee'] : (float)$category['fee'];
            run('UPDATE registrations SET fee_exempt = ?, exempt_reason = ?, amount_due = ? WHERE id = ?',
                [(int)$exempt, $exempt ? optional($p, 'reason') : null, $exempt ? 0 : $price, $registrationId]);
            $updated = refreshPaymentStatus($registrationId);
            audit('registration.exempt', 'registration', $registrationId,
                ['fee_exempt' => (bool)$registration['fee_exempt']], ['fee_exempt' => $exempt, 'reason' => $p['reason'] ?? null]);
            respond(200, ['data' => $updated]);

        /* ----- Administrácia ----- */
        case 'symposium.create':
            requireRoles(['superadmin', 'organizer']);
            $order = (int)one('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM symposia WHERE conference_id = ?', [CONFERENCE_ID])['next'];
            run('INSERT INTO symposia (conference_id, name_sk, name_en, sort_order) VALUES (?, ?, ?, ?)',
                [CONFERENCE_ID, required($p, 'name_sk'), required($p, 'name_en'), $order]);
            $symposiumId = (int)$pdo->lastInsertId();
            audit('symposium.create', 'symposium', $symposiumId, null, ['name_sk' => $p['name_sk']]);
            respond(201, ['data' => clean(one('SELECT * FROM symposia WHERE id = ?', [$symposiumId]))]);

        case 'admin.create': // vytvorí účet organizátora (v UI "admin")
            requireRoles(['superadmin']);
            $email = required($p, 'email');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(422, ['error' => 'Neplatný e-mail']);
            if (one('SELECT id FROM users WHERE email = ?', [$email])) respond(409, ['error' => 'E-mail už existuje']);
            $password = required($p, 'password');
            if (strlen($password) < 8 || strlen($password) > 72) respond(422, ['error' => 'Heslo musí mať 8 až 72 znakov']);
            $roleCode = (string)($p['role'] ?? 'organizer');
            if ($roleCode === 'superadmin') respond(422, ['error' => 'Rolu superadministrátora nemožno prideliť v rozhraní.']);
            $role = one('SELECT id FROM roles WHERE code = ?', [$roleCode]) ?? respond(422, ['error' => 'Neznáma rola']);

            $pdo->beginTransaction();
            try {
                run('INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
                    [$email, password_hash($password, PASSWORD_DEFAULT), required($p, 'first_name'), required($p, 'last_name')]);
                $userId = (int)$pdo->lastInsertId();
                run('INSERT INTO user_roles (user_id, role_id, conference_id) VALUES (?, ?, ?)', [$userId, $role['id'], CONFERENCE_ID]);
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
            audit('admin.create', 'user', $userId, null, ['email' => $email, 'role' => $roleCode]);
            respond(201, ['data' => publicUser(one('SELECT * FROM users WHERE id = ?', [$userId]))]);

        case 'role.add': // super admin pridá rolu existujúcemu používateľovi (podľa id alebo e-mailu)
            requireRoles(['superadmin']);
            $role = one('SELECT * FROM roles WHERE code = ?', [required($p, 'role')]) ?? respond(422, ['error' => 'Neznáma rola']);
            if ($role['code'] === 'superadmin') respond(422, ['error' => 'Rolu superadministrátora nemožno prideliť v rozhraní.']);
            $target = !empty($p['user_id'])
                ? one('SELECT * FROM users WHERE id = ?', [(int)$p['user_id']])
                : one('SELECT * FROM users WHERE email = ?', [required($p, 'email')]);
            if (!$target) respond(404, ['error' => 'Používateľ s týmto e-mailom neexistuje']);
            if (one('SELECT user_id FROM user_roles WHERE user_id = ? AND role_id = ?', [$target['id'], $role['id']])) {
                respond(409, ['error' => 'Používateľ túto rolu už má']);
            }
            run('INSERT INTO user_roles (user_id, role_id, conference_id) VALUES (?, ?, ?)', [$target['id'], $role['id'], CONFERENCE_ID]);
            audit('role.add', 'user', (int)$target['id'], null, ['role' => $role['code']]);
            respond(201, ['data' => publicUser($target)]);

        case 'role.remove':
            requireRoles(['superadmin']);
            $role = one('SELECT * FROM roles WHERE code = ?', [required($p, 'role')]) ?? respond(422, ['error' => 'Neznáma rola']);
            if ($role['code'] === 'superadmin') respond(422, ['error' => 'Rolu superadministrátora nemožno odobrať v rozhraní.']);
            $target = one('SELECT * FROM users WHERE id = ?', [(int)($p['user_id'] ?? 0)]) ?? respond(404, ['error' => 'Používateľ neexistuje']);
            run('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?', [$target['id'], $role['id']]);
            audit('role.remove', 'user', (int)$target['id'], ['role' => $role['code']], null);
            respond(200, ['data' => publicUser($target)]);

        case 'admin.set_active':
            requireRoles(['superadmin']);
            $targetId = (int)($p['user_id'] ?? 0);
            $target = one('SELECT * FROM users WHERE id = ?', [$targetId]) ?? respond(404, ['error' => 'Používateľ neexistuje']);
            if ($targetId === $me) respond(422, ['error' => 'Nemôžete deaktivovať vlastný účet']);
            if (in_array('superadmin', rolesOf($targetId), true)) respond(422, ['error' => 'Super administrátora nemožno deaktivovať']);
            $active = (int)(bool)($p['is_active'] ?? false);
            run('UPDATE users SET is_active = ? WHERE id = ?', [$active, $targetId]);
            audit('admin.set_active', 'user', $targetId, ['is_active' => (bool)$target['is_active']], ['is_active' => (bool)$active]);
            respond(200, ['data' => publicUser(one('SELECT * FROM users WHERE id = ?', [$targetId]))]);

        case 'conference.update':
            requireRoles(['superadmin']);
            $changes = [];
            foreach (['name', 'location', 'iban', 'accommodation_info'] as $field) {
                if (array_key_exists($field, $p)) $changes[$field] = trim((string)$p[$field]);
            }
            foreach (['start_date', 'end_date'] as $field) {
                if (array_key_exists($field, $p)) $changes[$field] = optional($p, $field);
            }
            if (array_key_exists('program_published', $p)) $changes['program_published'] = (int)(bool)$p['program_published'];
            if (isset($changes['name']) && $changes['name'] === '') respond(422, ['error' => 'Názov nesmie byť prázdny']);
            if (!$changes) respond(422, ['error' => 'Nie je čo uložiť']);

            $set = implode(', ', array_map(fn($field) => "`$field` = ?", array_keys($changes)));
            run("UPDATE conferences SET $set WHERE id = ?", [...array_values($changes), CONFERENCE_ID]);
            audit('conference.update', 'conference', CONFERENCE_ID, null, $changes);
            respond(200, ['data' => clean(one('SELECT * FROM conferences WHERE id = ?', [CONFERENCE_ID]))]);

        case 'category.update':
            requireRoles(['superadmin']);
            $categoryId = (int)($p['category_id'] ?? 0);
            $category = one('SELECT * FROM participant_categories WHERE id = ?', [$categoryId]) ?? respond(404, ['error' => 'Kategória neexistuje']);
            $fee = $p['fee'] ?? '';
            if ($fee === '' || !is_numeric($fee) || (float)$fee < 0) respond(422, ['error' => 'Poplatok musí byť nezáporné číslo']);
            $studentFee = $p['student_fee'] ?? '';
            if ($studentFee !== '' && $studentFee !== null && (!is_numeric($studentFee) || (float)$studentFee < 0)) {
                respond(422, ['error' => 'Študentský poplatok musí byť nezáporné číslo']);
            }
            $studentFee = ($studentFee === '' || $studentFee === null) ? null : (float)$studentFee;

            run('UPDATE participant_categories SET fee = ?, student_fee = ? WHERE id = ?', [(float)$fee, $studentFee, $categoryId]);
            audit('category.update', 'participant_category', $categoryId,
                ['fee' => (float)$category['fee'], 'student_fee' => $category['student_fee']], ['fee' => (float)$fee, 'student_fee' => $studentFee]);
            respond(200, ['data' => clean(one('SELECT * FROM participant_categories WHERE id = ?', [$categoryId]))]);

        default:
            respond(404, ['error' => 'Neznáma POST akcia']);
    }
}


/* Spustenie
   ------------------------------------------------------------------------ */
$action = (string)($_GET['action'] ?? 'help');
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET')       handleGet($action);
    elseif ($method === 'POST')  handlePost($action, body());
    else                         respond(405, ['error' => 'Použite GET alebo POST']);
} catch (PDOException $e) {
    $code = (int)($e->errorInfo[1] ?? 0);
    if ($code === 1062)                    respond(409, ['error' => 'Záznam už existuje']);
    if ($code === 1452 || $code === 1451)  respond(422, ['error' => 'Neplatná väzba na iný záznam']);
    error_log('ANS API: ' . $e->getMessage());
    respond(500, ['error' => 'Chyba databázy']);
} catch (Throwable $e) {
    error_log('ANS API: ' . $e->getMessage());
    respond(500, ['error' => 'Chyba servera. Skontrolujte api/config.php a oprávnenia úložiska.']);
}
