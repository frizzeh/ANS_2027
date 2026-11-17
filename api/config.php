<?php
declare(strict_types=1);

/**
 * Nastavenia API: databáza MariaDB, úložisko súborov a e-maily.
 * POZOR: heslo nikdy nedávaj do verejného repozitára (Git).
 */

// Úložisko nahratých príspevkov. Musí byť MIMO verejného priečinka webu, aby sa súbory
// nedali stiahnuť priamo adresou a obísť kontrolu oprávnení. Predvolene je to priečinok
// "ans-storage" vedľa priečinka s projektom.
define('APP_STORAGE', dirname(__DIR__, 2) . '/ans-storage');
define('MAX_UPLOAD_BYTES', 20 * 1024 * 1024); // 20 MB

foreach ([APP_STORAGE, APP_STORAGE . '/files'] as $directory) {
    if (
        !is_dir($directory)
        && !mkdir($directory, 0700, true)
        && !is_dir($directory)
    ) {
        throw new RuntimeException('Nepodarilo sa vytvoriť úložný priečinok.');
    }
}

// Pre prípad, že by úložisko bolo na Apache vo verejnom priečinku: zakáže priamy prístup.
if (!is_file(APP_STORAGE . '/.htaccess')) {
    @file_put_contents(APP_STORAGE . '/.htaccess', "Require all denied\nDeny from all\n");
}

return [
    'host' => 'localhost',
    'name' => 'ans',
    'user' => 'root',
    'pass' => '',
    // Odosielateľ hromadných e-mailov (PHP mail() musí byť na serveri nastavený).
    'mail_from' => 'noreply@ans.local',
];
