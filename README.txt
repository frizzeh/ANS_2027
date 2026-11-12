ANS 2027 – frontend prepojený s PHP API (api/index.php)

SPUSTENIE
1) Zip rozbaľ a v termináli prejdi do priečinka, kde je index.html (nie o úroveň vyššie).
2) php -S localhost:8000
3) Otvor http://localhost:8000/index.html   (PHP 8.1+, súbor z disku cez dvojklik nefunguje)

ROLE A UKÁŽKOVÉ ÚČTY (len pre prototyp, v ostrej verzii zmeniť!)
  Super admin   superadmin@ans.local   Super12345   -> superadmin.html (vidí aj admin.html)
  Admin         admin@ans.local        Admin12345    -> admin.html
  Účastník      vlastná registrácia                  -> ucet.html
Skrytie stránok vo frontende je len pohodlie; oprávnenia kontroluje server (api/index.php).

STRÁNKY
  index, registracia, prihlasenie, ucet, prispevok   (účastník)
  admin        účastníci a platby (potvrdenie platby, export CSV), príspevky (zmena stavu), tematické oblasti
  superadmin   administrátori, nastavenia konferencie, kategórie a poplatky

API oproti pôvodnému súboru pribudlo (označené "PRIDANÉ (frontend)"): auth.login/logout/me, roly,
kontroly oprávnení pri čítaní a zápise, kategória passive, akcie admin.create, admin.set_active,
conference.update, category.update, symposium.create.
Dáta sú v PHP relácii (bez databázy); po jej vypršaní sa stratia.
