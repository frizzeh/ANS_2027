KDE ČO ZMENIŤ
  SLOVENSKÝ TEXT ................. priamo v HTML súbore (index.html atď.). Zmeň text, ulož, obnov stránku (Ctrl+F5).
  Konkrétne v index.html: program (sekcia Program), rečníci (sekcia Rečníci), hotel, e-mail a odkaz na Mapy Google
                           (sekcia Miesto a ubytovanie), dátum a miesto (úvod). E-mail v pätičke je v každom HTML súbore.
  ANGLICKÝ PREKLAD ............... js/i18n.js (v časti "en" nájdi kľúč z atribútu data-i18n, napr. "prog.1").
                                   Ak zmeníš slovenský text a chceš aj anglický, zmeň ho aj tu.
  Dátum konferencie .............. nastavuje super admin (superadmin.html). Podľa neho sa samé zmenia úvod stránky,
                                   termín „Konferencia“ a dni v programe (13. 5. = prvý deň, v HTML data-day="0", druhý deň data-day="1").
  Termíny a poplatky ............. database/ans_test_data.sql (v demo režime js/demo-data.js)
  Vzhľad (farby, rozloženie) ..... css/style.css (hore sú farby ako premenné v :root)
  Meno, e-mail a kód hotela nie sú v prekladoch, stačí ich zmeniť v index.html.

ANS 2027 – frontend + PHP API + databáza MariaDB

1) DATABÁZA (MariaDB 10.2.1+)
   mysql -u root -p -e "CREATE DATABASE ans CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
   mysql -u root -p ans < database/ans.sql
   mysql -u root -p ans < database/ans_test_data.sql      (testovacie dáta; vymaže staré dáta a vloží nové)
2) PRIPOJENIE: uprav api/config.php (host, názov databázy, používateľ, heslo). Heslo nedávaj do Gitu.
3) SPUSTENIE (PHP 8.1+ s rozšírením pdo_mysql): v tomto priečinku  php -S localhost:8000
   a otvor http://localhost:8000/index.html  (zip najprv rozbaľ; z disku cez dvojklik to nefunguje)

TESTOVACIE ÚČTY (všetky majú heslo: heslo)
  admin@ans-test.sk          super admin           -> superadmin.html (vidí aj admin.html)
  organizator@ans-test.sk    organizátor ("admin") -> admin.html
  ekonom@ans-test.sk         ekonomické oddelenie  -> admin.html (potvrdzuje platby)
  vybor@ans-test.sk          programový výbor      -> admin.html (mení stavy príspevkov)
  recenzent2@ans-test.sk     recenzent             -> recenzent.html (recenzent1 je zároveň programový výbor, preto ide do adminu)
  jan.novak@example.com      účastník (a ďalší z testovacích dát) -> ucet.html

OPRÁVNENIA (kontroluje server, api/index.php)
  super admin: všetko, vrátane administrátorov, nastavení konferencie a poplatkov
  organizátor: čítanie všetkého, platby, stavy príspevkov, tematické oblasti
  ekonomické oddelenie: platby; programový výbor: stavy príspevkov
  účastník: len svoje údaje

STRÁNKY  index, registracia, prihlasenie, superadmin
         účet účastníka: ucet, ucet-registracia, ucet-prispevky, ucet-platba, ucet-nastavenia
         administrácia: admin (Prehľad), admin-ucastnici, admin-platby, admin-prispevky, admin-recenzie, admin-program, admin-emaily, admin-nastavenia
ŠTÝLY     css/style.css (spoločné), css/app.css (bočné menu), css/account.css (účet), css/admin.css (administrácia)
PREKLADY js/i18n.js (SK a EN)

BEZPEČNOSŤ
  Čo je už zabezpečené
    - Heslá sa ukladajú ako hash (bcrypt, password_hash), nikdy ako text. Heslo má 8 až 72 znakov.
    - Všetky SQL dotazy sú pripravené (PDO), názvy tabuliek sa neberú od používateľa.
    - Text zo servera sa do stránky vkladá cez textContent (nie innerHTML), takže sa nedá vložiť škodlivý kód (XSS).
    - CSRF: každá zmena dát vyžaduje token (X-CSRF-Token) a požiadavka musí prísť z toho istého webu (kontrola Origin).
    - Prihlásenie: najviac 5 neúspešných pokusov na účet a 30 na adresu za 15 minút (potom chyba 429). Chyba neprezradí, či e-mail existuje.
    - Relácia: cookie HttpOnly, SameSite=Lax, pri HTTPS aj Secure; po prihlásení sa mení ID relácie, po odhlásení sa relácia zničí.
    - Oprávnenia sa kontrolujú na serveri; účastník vidí len svoje dáta. Auditný záznam a log e-mailov vidí len super admin a organizátor.
    - Nahrávanie: kontrola prípony, typu a obsahu, náhodný názov, úložisko mimo webu, stiahnutie len pre oprávnených.
    - Hlavičky (api/index.php, .htaccess, meta v HTML): nosniff, zákaz vkladania do rámu, Referrer-Policy, Content-Security-Policy
      (skripty a štýly len z vlastného webu).
    - Súbory *.sql, *.txt a priečinok database/ a api/config.php sú zablokované cez .htaccess (Apache).
  Čo treba urobiť pri nasadení
    1) Spusti web len cez HTTPS a v .htaccess odkomentuj Strict-Transport-Security.
    2) V MariaDB vytvor osobného používateľa len pre databázu ans (nie root) a jeho údaje daj do api/config.php.
    3) Zmeň heslá testovacích účtov (všetky majú "heslo") alebo ich zmaž a nenahrávaj ans_test_data.sql.
    4) Zmaž demo súbory (demo.html, js/demo-*.js), aby sa v ostrej verzii neukazoval demo režim.
    5) Ak nepoužívaš Apache, nastav tie isté hlavičky a zákazy v konfigurácii svojho servera (nginx a pod.).
  Poznámka ku konzole prehliadača
    Hlásenie „Self-XSS“ v konzole (F12) zobrazuje samotný prehliadač na každej stránke. Nie je to chyba webu a nedá sa vypnúť.
    Varuje používateľa, aby do konzoly nevkladal cudzí kód. Samotný web chránia opatrenia vyššie.

DEMO REŽIM (bez PHP a databázy)
  Otvor demo.html (alebo ktorúkoľvek stránku s ?demo=1). Ak server nebeží, stránky samy prejdú do demo režimu:
  dáta sú v js/demo-data.js (z database/ans_test_data.sql), zmeny sa ukladajú len do localStorage prehliadača.
  Heslo všetkých ukážkových účtov je "heslo". Demo je potrebné otvoriť cez http (napr. python3 -m http.server)
  alebo priamo súbor z disku. Pruh dole umožňuje dáta obnoviť alebo demo ukončiť (?demo=0).
  Sťahovanie súborov a exporty v demo režime vytvorí prehliadač (CSV, ukážkový súbor); XLSX a skutočné súbory až so serverom.

NAHRÁVANIE SÚBOROV A EXPORTY
  Príspevky (PDF/DOCX, max. 20 MB) sa ukladajú do priečinka ../ans-storage/files (mimo verejného webu,
  vytvorí sa automaticky; cestu mení api/config.php). Súbor dostane náhodný názov a práva 0600.
  Server kontroluje príponu, MIME typ aj podpis súboru. Stiahnuť ho smie len autor, personál a priradený recenzent.
  Všetky POST požiadavky chráni CSRF token (hlavička X-CSRF-Token, získa sa akciou "csrf").
  Exporty (CSV oddelené bodkočiarkou; účastníci, platby, príspevky, prezenčná listina) sú v api/index.php?action=export.
  XLSX vyžaduje knižnicu: composer require phpoffice/phpspreadsheet (bez nej použi CSV).

OBMEDZENIA
  Spoluautori, faktúry (PDF), program a hromadné e-maily zatiaľ nemajú všetky obrazovky, hoci tabuľky v databáze existujú.
