-- ANS – Konferenčný a registračný systém
-- Testovacie dáta (vymyslené osoby a údaje)
-- Všetci používatelia majú heslo: heslo

SET NAMES utf8mb4;

-- Vymazanie starých dát (od detských tabuliek k rodičovským, aby nevadili cudzie kľúče)
DELETE FROM audit_log;
DELETE FROM email_log;
DELETE FROM notifications;
DELETE FROM program_items;
DELETE FROM reviews;
DELETE FROM review_assignments;
DELETE FROM submission_status_history;
DELETE FROM submission_versions;
DELETE FROM submission_authors;
DELETE FROM submissions;
DELETE FROM invoices;
DELETE FROM payments;
DELETE FROM registrations;
DELETE FROM participant_categories;
DELETE FROM deadlines;
DELETE FROM symposia;
DELETE FROM user_roles;
DELETE FROM roles;
DELETE FROM users;
DELETE FROM conferences;

-- Roly
INSERT INTO roles (id, code, name_sk, name_en) VALUES
  (1, 'superadmin', 'Superadministrátor', 'Super administrator'),
  (2, 'organizer', 'Organizátor', 'Organizer'),
  (3, 'program_committee', 'Programový výbor', 'Program committee'),
  (4, 'reviewer', 'Recenzent', 'Reviewer'),
  (5, 'finance', 'Ekonomické oddelenie', 'Finance department');

-- Konferencia
INSERT INTO conferences (id, name, year, slug, location, start_date, end_date, iban, currency, accommodation_info, program_published, is_archived, created_at) VALUES
  (1, 'ANS 2027', 2027, 'ans2027', 'Trnava, Univerzita sv. Cyrila a Metoda', '2027-05-13', '2027-05-14', 'SK31 1200 0000 1987 4263 7541', 'EUR', 'Odporúčaný hotel: Hotel Trnava (fiktívny), rezervácia priamo cez hotel.', 0, 0, '2026-11-01 09:00:00');

-- Sympóziá
INSERT INTO symposia (id, conference_id, name_sk, name_en, sort_order) VALUES
  (1, 1, 'Biológia a biotechnológie', 'Biology and biotechnology', 1),
  (2, 1, 'Informatika a výpočtová technika', 'Informatics, computer technology', 2),
  (3, 1, 'Chémia', 'Chemistry', 3),
  (4, 1, 'Environmentálne vedy', 'Environmental science', 4);

-- Termíny
INSERT INTO deadlines (id, conference_id, step, deadline_at) VALUES
  (1, 1, 'registration', '2027-04-15 23:59:00'),
  (2, 1, 'payment', '2027-04-30 23:59:00'),
  (3, 1, 'submission', '2027-03-15 23:59:00'),
  (4, 1, 'review', '2027-04-05 23:59:00'),
  (5, 1, 'revision', '2027-04-25 23:59:00');

-- Kategórie účastníkov
INSERT INTO participant_categories (id, conference_id, code, name_sk, name_en, fee, student_fee, submission_type) VALUES
  (1, 1, 'speaker', 'Registrovaný rečník', 'Registered speaker', 120.0, 80.0, 'talk'),
  (2, 1, 'poster_author', 'Autor posteru', 'Poster author', 100.0, 60.0, 'poster'),
  (3, 1, 'passive', 'Pasívny účastník', 'Passive participant', 80.0, NULL, NULL);

-- Používatelia (1–8 personál, 9–38 účastníci)
INSERT INTO users (id, email, password_hash, title_before, first_name, last_name, title_after, organization, organization_address, department, country, preferred_language, is_active, last_login_at, created_at) VALUES
  (1, 'admin@ans-test.sk', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Ing.', 'Martin', 'Kováč', 'PhD.', 'Univerzita sv. Cyrila a Metoda v Trnave', 'Nám. J. Herdu 2, 917 01 Trnava', 'Katedra informatiky', 'Slovakia', 'sk', 1, '2027-03-20 10:00:00', '2026-11-02 09:00:00'),
  (2, 'organizator@ans-test.sk', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Mgr.', 'Lucia', 'Horváthová', NULL, 'Univerzita sv. Cyrila a Metoda v Trnave', 'Nám. J. Herdu 2, 917 01 Trnava', 'Katedra biológie', 'Slovakia', 'sk', 1, '2027-03-20 10:00:00', '2026-11-02 09:00:00'),
  (3, 'vybor@ans-test.sk', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'prof. RNDr.', 'Peter', 'Baláž', 'CSc.', 'Univerzita sv. Cyrila a Metoda v Trnave', 'Nám. J. Herdu 2, 917 01 Trnava', 'Katedra chémie', 'Slovakia', 'sk', 1, '2027-03-20 10:00:00', '2026-11-02 09:00:00'),
  (4, 'ekonom@ans-test.sk', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Ing.', 'Eva', 'Tóthová', NULL, 'Univerzita sv. Cyrila a Metoda v Trnave', 'Nám. J. Herdu 2, 917 01 Trnava', NULL, 'Slovakia', 'sk', 1, '2027-03-20 10:00:00', '2026-11-02 09:00:00'),
  (5, 'recenzent1@ans-test.sk', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'doc. Ing.', 'Juraj', 'Polák', 'PhD.', 'Slovenská technická univerzita', 'Vazovova 5, 812 43 Bratislava', 'Katedra aplikovanej informatiky', 'Slovakia', 'sk', 1, '2027-03-20 10:00:00', '2026-11-02 09:00:00'),
  (6, 'recenzent2@ans-test.sk', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'RNDr.', 'Zuzana', 'Šimková', 'PhD.', 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6, 818 06 Bratislava', 'Katedra biológie', 'Slovakia', 'sk', 1, '2027-03-20 10:00:00', '2026-11-02 09:00:00'),
  (7, 'recenzent3@ans-test.sk', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'doc. RNDr.', 'Tomáš', 'Novotný', 'Ph.D.', 'Masarykova univerzita', 'Žerotínovo nám. 617/9, 601 77 Brno', 'Katedra chémie', 'Czech Republic', 'en', 1, '2027-03-20 10:00:00', '2026-11-02 09:00:00'),
  (8, 'recenzent4@ans-test.sk', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Dr.', 'Anna', 'Wiśniewska', NULL, 'Uniwersytet Jagielloński', 'Gołębia 24, 31-007 Kraków', 'Katedra ekológie a environmentalistiky', 'Poland', 'en', 1, '2027-03-20 10:00:00', '2026-11-02 09:00:00'),
  (9, 'jan.novak@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', NULL, 'Ján', 'Novák', NULL, 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6, 818 06 Bratislava', 'Katedra ekológie a environmentalistiky', 'Slovakia', 'sk', 1, '2027-02-23 13:30:00', '2027-02-20 13:30:00'),
  (10, 'anna.molnarova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Bc.', 'Anna', 'Molnárová', NULL, 'Technická univerzita v Košiciach', 'Letná 9, 042 00 Košice', 'Katedra aplikovanej informatiky', 'Slovakia', 'sk', 1, '2027-01-30 12:55:00', '2027-01-27 12:55:00'),
  (11, 'michal.mraz@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Mgr.', 'Michal', 'Mráz', NULL, 'Debreceni Egyetem', 'Egyetem tér 1, 4032 Debrecen', 'Katedra chémie', 'Hungary', 'en', 1, '2027-02-01 09:08:00', '2027-01-29 09:08:00'),
  (12, 'katarina.balazova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', NULL, 'Katarína', 'Balážová', NULL, 'Žilinská univerzita v Žiline', 'Univerzitná 8215/1, 010 26 Žilina', 'Katedra chémie', 'Slovakia', 'sk', 1, '2027-02-28 13:45:00', '2027-02-25 13:45:00'),
  (13, 'tomas.kiss@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Mgr.', 'Tomáš', 'Kiss', NULL, 'Slovenská technická univerzita', 'Vazovova 5, 812 43 Bratislava', 'Katedra chémie', 'Slovakia', 'sk', 1, '2027-03-09 15:59:00', '2027-03-06 15:59:00'),
  (14, 'simona.nagyova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', NULL, 'Simona', 'Nagyová', NULL, 'Masarykova univerzita', 'Žerotínovo nám. 617/9, 601 77 Brno', 'Katedra chémie', 'Czech Republic', 'en', 1, '2027-03-09 09:03:00', '2027-03-06 09:03:00'),
  (15, 'lukas.huber@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', NULL, 'Lukáš', 'Huber', NULL, 'Uniwersytet Jagielloński', 'Gołębia 24, 31-007 Kraków', 'Katedra ekológie a environmentalistiky', 'Poland', 'en', 1, '2027-01-30 15:04:00', '2027-01-27 15:04:00'),
  (16, 'veronika.tothova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Bc.', 'Veronika', 'Tóthová', NULL, 'Debreceni Egyetem', 'Egyetem tér 1, 4032 Debrecen', 'Katedra informatiky', 'Hungary', 'en', 1, '2027-01-30 09:14:00', '2027-01-27 09:14:00'),
  (17, 'marek.kowalski@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'PhDr.', 'Marek', 'Kowalski', 'PhD.', 'Debreceni Egyetem', 'Egyetem tér 1, 4032 Debrecen', 'Katedra biológie', 'Hungary', 'en', 1, '2027-01-17 16:22:00', '2027-01-14 16:22:00'),
  (18, 'natalia.vargova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Mgr.', 'Natália', 'Vargová', NULL, 'Slovenská technická univerzita', 'Vazovova 5, 812 43 Bratislava', 'Katedra aplikovanej informatiky', 'Slovakia', 'sk', 1, '2027-02-19 16:39:00', '2027-02-16 16:39:00'),
  (19, 'filip.dvorak@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Ing.', 'Filip', 'Dvořák', NULL, 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6, 818 06 Bratislava', 'Katedra chémie', 'Slovakia', 'sk', 1, '2027-02-21 10:12:00', '2027-02-18 10:12:00'),
  (20, 'barbora.kovacova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', NULL, 'Barbora', 'Kováčová', NULL, 'Uniwersytet Jagielloński', 'Gołębia 24, 31-007 Kraków', 'Katedra aplikovanej informatiky', 'Poland', 'en', 1, '2027-01-13 13:43:00', '2027-01-10 13:43:00'),
  (21, 'adam.lukac@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Ing.', 'Adam', 'Lukáč', 'PhD.', 'Masarykova univerzita', 'Žerotínovo nám. 617/9, 601 77 Brno', 'Katedra ekológie a environmentalistiky', 'Czech Republic', 'en', 1, '2027-03-06 16:13:00', '2027-03-03 16:13:00'),
  (22, 'maria.horvathova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Mgr.', 'Mária', 'Horváthová', 'PhD.', 'Slovenská technická univerzita', 'Vazovova 5, 812 43 Bratislava', 'Katedra chémie', 'Slovakia', 'sk', 1, '2027-01-24 16:08:00', '2027-01-21 16:08:00'),
  (23, 'jakub.szabo@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Mgr.', 'Jakub', 'Szabó', NULL, 'Slovenská technická univerzita', 'Vazovova 5, 812 43 Bratislava', 'Katedra biológie', 'Slovakia', 'sk', 1, '2027-02-22 17:31:00', '2027-02-19 17:31:00'),
  (24, 'lenka.novakova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'RNDr.', 'Lenka', 'Nováková', NULL, 'Slovenská technická univerzita', 'Vazovova 5, 812 43 Bratislava', 'Katedra chémie', 'Slovakia', 'sk', 1, '2027-01-19 09:32:00', '2027-01-16 09:32:00'),
  (25, 'patrik.molnar@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'RNDr.', 'Patrik', 'Molnár', NULL, 'Uniwersytet Jagielloński', 'Gołębia 24, 31-007 Kraków', 'Katedra chémie', 'Poland', 'en', 1, '2027-02-10 10:18:00', '2027-02-07 10:18:00'),
  (26, 'kristina.mrazova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Bc.', 'Kristína', 'Mrázová', NULL, 'Debreceni Egyetem', 'Egyetem tér 1, 4032 Debrecen', 'Ústav biotechnológie', 'Hungary', 'en', 1, '2027-03-13 17:47:00', '2027-03-10 17:47:00'),
  (27, 'samuel.balaz@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Ing.', 'Samuel', 'Baláž', NULL, 'Univerzita Karlova', 'Ovocný trh 560/5, 116 36 Praha', 'Katedra ekológie a environmentalistiky', 'Czech Republic', 'en', 1, '2027-03-01 11:22:00', '2027-02-26 11:22:00'),
  (28, 'petra.kiss@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'PhDr.', 'Petra', 'Kiss', NULL, 'Technická univerzita v Košiciach', 'Letná 9, 042 00 Košice', 'Katedra biológie', 'Slovakia', 'sk', 1, '2027-03-09 10:55:00', '2027-03-06 10:55:00'),
  (29, 'ondrej.nagy@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', NULL, 'Ondřej', 'Nagy', NULL, 'Univerzita Karlova', 'Ovocný trh 560/5, 116 36 Praha', 'Katedra biológie', 'Czech Republic', 'en', 1, '2027-02-04 17:57:00', '2027-02-01 17:57:00'),
  (30, 'tereza.huber@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'RNDr.', 'Tereza', 'Huber', NULL, 'Debreceni Egyetem', 'Egyetem tér 1, 4032 Debrecen', 'Katedra biológie', 'Hungary', 'en', 1, '2027-03-06 12:36:00', '2027-03-03 12:36:00'),
  (31, 'piotr.toth@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Mgr.', 'Piotr', 'Tóth', NULL, 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6, 818 06 Bratislava', 'Katedra informatiky', 'Slovakia', 'sk', 1, '2027-02-08 09:28:00', '2027-02-05 09:28:00'),
  (32, 'agnieszka.kowalska@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Bc.', 'Agnieszka', 'Kowalska', NULL, 'Uniwersytet Jagielloński', 'Gołębia 24, 31-007 Kraków', 'Katedra aplikovanej informatiky', 'Poland', 'en', 1, '2027-01-13 14:52:00', '2027-01-10 14:52:00'),
  (33, 'lukas.varga@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Mgr.', 'Lukas', 'Varga', NULL, 'Debreceni Egyetem', 'Egyetem tér 1, 4032 Debrecen', 'Katedra informatiky', 'Hungary', 'en', 1, '2027-02-16 14:48:00', '2027-02-13 14:48:00'),
  (34, 'julia.dvorakova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Mgr.', 'Julia', 'Dvořáková', NULL, 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6, 818 06 Bratislava', 'Katedra biológie', 'Slovakia', 'sk', 1, '2027-03-10 09:09:00', '2027-03-07 09:09:00'),
  (35, 'bence.kovac@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Bc.', 'Bence', 'Kováč', NULL, 'Univerzita Karlova', 'Ovocný trh 560/5, 116 36 Praha', 'Ústav biotechnológie', 'Czech Republic', 'en', 1, '2027-01-22 09:27:00', '2027-01-19 09:27:00'),
  (36, 'reka.lukacova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Bc.', 'Réka', 'Lukáčová', 'PhD.', 'Technická univerzita v Košiciach', 'Letná 9, 042 00 Košice', 'Katedra aplikovanej informatiky', 'Slovakia', 'sk', 1, '2027-02-06 10:17:00', '2027-02-03 10:17:00'),
  (37, 'daniel.horvath@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Ing.', 'Daniel', 'Horváth', NULL, 'Univerzita sv. Cyrila a Metoda v Trnave', 'Nám. J. Herdu 2, 917 01 Trnava', 'Katedra chémie', 'Slovakia', 'sk', 1, '2027-03-13 16:35:00', '2027-03-10 16:35:00'),
  (38, 'laura.szabova@example.com', '$2y$10$OcyKC6rJrg96KURorRF.mOsVdNtYbg56y1d7V1VtEC.EihmjdO8wm', 'Mgr.', 'Laura', 'Szabová', NULL, 'Slovenská technická univerzita', 'Vazovova 5, 812 43 Bratislava', 'Katedra ekológie a environmentalistiky', 'Slovakia', 'sk', 1, '2027-01-19 11:34:00', '2027-01-16 11:34:00');

-- Priradenie rolí
INSERT INTO user_roles (user_id, role_id, conference_id) VALUES
  (1, 1, NULL),
  (2, 2, 1),
  (3, 3, 1),
  (3, 4, 1),
  (4, 5, 1),
  (5, 4, 1),
  (5, 3, 1),
  (6, 4, 1),
  (7, 4, 1),
  (8, 4, 1);

-- Registrácie na ANS 2027
INSERT INTO registrations (id, user_id, conference_id, category_id, is_student, dietary_requirements, gdpr_consent_at, billing_name, billing_street, billing_city, billing_zip, billing_country, billing_ico, billing_dic, billing_ic_dph, fee_exempt, exempt_reason, amount_due, variable_symbol, due_date, payment_status, created_at) VALUES
  (1, 9, 1, 2, 0, 'vegetarián', '2027-02-20 13:35:00', 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6', 'Bratislava', '818 06', 'Slovakia', '91259725', '6446589627', 'SK6446589627', 0, NULL, 100.0, '20270001', '2027-03-06', 'paid', '2027-02-20 13:35:00'),
  (2, 10, 1, 1, 0, NULL, '2027-01-27 13:00:00', 'Technická univerzita v Košiciach', 'Letná 9', 'Košice', '042 00', 'Slovakia', '49545027', '1580908023', 'SK1580908023', 0, NULL, 120.0, '20270002', '2027-02-10', 'partially_paid', '2027-01-27 13:00:00'),
  (3, 11, 1, 1, 1, 'laktózová intolerancia', '2027-01-29 09:13:00', 'Debreceni Egyetem', 'Egyetem tér 1', 'Debrecen', '4032', 'Hungary', NULL, NULL, NULL, 0, NULL, 80.0, '20270003', '2027-02-12', 'paid', '2027-01-29 09:13:00'),
  (4, 12, 1, 2, 0, NULL, '2027-02-25 13:50:00', 'Žilinská univerzita v Žiline', 'Univerzitná 8215/1', 'Žilina', '010 26', 'Slovakia', '12576897', '1247609218', 'SK1247609218', 0, NULL, 100.0, '20270004', '2027-03-11', 'awaiting_payment', '2027-02-25 13:50:00'),
  (5, 13, 1, 3, 0, 'bezlepková diéta', '2027-03-06 16:04:00', 'Slovenská technická univerzita', 'Vazovova 5', 'Bratislava', '812 43', 'Slovakia', '85354829', '3803385614', 'SK3803385614', 0, NULL, 80.0, '20270005', '2027-03-20', 'awaiting_payment', '2027-03-06 16:04:00'),
  (6, 14, 1, 1, 0, NULL, '2027-03-06 09:08:00', 'Masarykova univerzita', 'Žerotínovo nám. 617/9', 'Brno', '601 77', 'Czech Republic', NULL, NULL, NULL, 0, NULL, 120.0, '20270006', '2027-03-20', 'paid', '2027-03-06 09:08:00'),
  (7, 15, 1, 1, 1, 'laktózová intolerancia', '2027-01-27 15:09:00', 'Uniwersytet Jagielloński', 'Gołębia 24', 'Kraków', '31-007', 'Poland', '34319569', NULL, NULL, 0, NULL, 80.0, '20270007', '2027-02-10', 'paid', '2027-01-27 15:09:00'),
  (8, 16, 1, 2, 1, 'alergia na orechy', '2027-01-27 09:19:00', 'Debreceni Egyetem', 'Egyetem tér 1', 'Debrecen', '4032', 'Hungary', NULL, NULL, NULL, 0, NULL, 60.0, '20270008', '2027-02-10', 'paid', '2027-01-27 09:19:00'),
  (9, 17, 1, 3, 0, NULL, '2027-01-14 16:27:00', 'Debreceni Egyetem', 'Egyetem tér 1', 'Debrecen', '4032', 'Hungary', '96339355', NULL, NULL, 0, NULL, 80.0, '20270009', '2027-01-28', 'overdue', '2027-01-14 16:27:00'),
  (10, 18, 1, 1, 1, NULL, '2027-02-16 16:44:00', 'Slovenská technická univerzita', 'Vazovova 5', 'Bratislava', '812 43', 'Slovakia', '98808358', '8379563807', 'SK8379563807', 0, NULL, 80.0, '20270010', '2027-03-02', 'partially_paid', '2027-02-16 16:44:00'),
  (11, 19, 1, 1, 0, 'vegán', '2027-02-18 10:17:00', 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6', 'Bratislava', '818 06', 'Slovakia', '56601737', '6386835320', 'SK6386835320', 0, NULL, 120.0, '20270011', '2027-03-04', 'paid', '2027-02-18 10:17:00'),
  (12, 20, 1, 3, 1, NULL, '2027-01-10 13:48:00', 'Uniwersytet Jagielloński', 'Gołębia 24', 'Kraków', '31-007', 'Poland', NULL, NULL, NULL, 0, NULL, 80.0, '20270012', '2027-01-24', 'cancelled', '2027-01-10 13:48:00'),
  (13, 21, 1, 1, 0, NULL, '2027-03-03 16:18:00', 'Masarykova univerzita', 'Žerotínovo nám. 617/9', 'Brno', '601 77', 'Czech Republic', NULL, NULL, NULL, 0, NULL, 120.0, '20270013', '2027-03-17', 'awaiting_payment', '2027-03-03 16:18:00'),
  (14, 22, 1, 3, 0, 'laktózová intolerancia', '2027-01-21 16:13:00', 'Slovenská technická univerzita', 'Vazovova 5', 'Bratislava', '812 43', 'Slovakia', '77264364', '7866681729', 'SK7866681729', 0, NULL, 80.0, '20270014', '2027-02-04', 'overdue', '2027-01-21 16:13:00'),
  (15, 23, 1, 1, 0, 'laktózová intolerancia', '2027-02-19 17:36:00', 'Slovenská technická univerzita', 'Vazovova 5', 'Bratislava', '812 43', 'Slovakia', '75281460', '7240908508', 'SK7240908508', 1, 'Pozvaný prednášajúci', 0.0, '20270015', '2027-03-05', 'paid', '2027-02-19 17:36:00'),
  (16, 24, 1, 3, 0, NULL, '2027-01-16 09:37:00', 'Slovenská technická univerzita', 'Vazovova 5', 'Bratislava', '812 43', 'Slovakia', '89111223', '1375012172', 'SK1375012172', 0, NULL, 80.0, '20270016', '2027-01-30', 'overdue', '2027-01-16 09:37:00'),
  (17, 25, 1, 2, 0, 'vegán', '2027-02-07 10:23:00', 'Uniwersytet Jagielloński', 'Gołębia 24', 'Kraków', '31-007', 'Poland', NULL, NULL, NULL, 0, NULL, 100.0, '20270017', '2027-02-21', 'paid', '2027-02-07 10:23:00'),
  (18, 26, 1, 2, 0, NULL, '2027-03-10 17:52:00', 'Debreceni Egyetem', 'Egyetem tér 1', 'Debrecen', '4032', 'Hungary', NULL, NULL, NULL, 0, NULL, 100.0, '20270018', '2027-03-24', 'paid', '2027-03-10 17:52:00'),
  (19, 27, 1, 2, 0, NULL, '2027-02-26 11:27:00', 'Univerzita Karlova', 'Ovocný trh 560/5', 'Praha', '116 36', 'Czech Republic', NULL, NULL, NULL, 0, NULL, 100.0, '20270019', '2027-03-12', 'paid', '2027-02-26 11:27:00'),
  (20, 28, 1, 1, 0, NULL, '2027-03-06 11:00:00', 'Technická univerzita v Košiciach', 'Letná 9', 'Košice', '042 00', 'Slovakia', '74786211', '9916575773', 'SK9916575773', 0, NULL, 120.0, '20270020', '2027-03-20', 'awaiting_payment', '2027-03-06 11:00:00'),
  (21, 29, 1, 2, 0, 'laktózová intolerancia', '2027-02-01 18:02:00', 'Univerzita Karlova', 'Ovocný trh 560/5', 'Praha', '116 36', 'Czech Republic', NULL, NULL, NULL, 0, NULL, 100.0, '20270021', '2027-02-15', 'refunded', '2027-02-01 18:02:00'),
  (22, 30, 1, 2, 0, NULL, '2027-03-03 12:41:00', 'Debreceni Egyetem', 'Egyetem tér 1', 'Debrecen', '4032', 'Hungary', NULL, NULL, NULL, 1, 'Pozvaný prednášajúci', 0.0, '20270022', '2027-03-17', 'paid', '2027-03-03 12:41:00'),
  (23, 31, 1, 1, 1, NULL, '2027-02-05 09:33:00', 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6', 'Bratislava', '818 06', 'Slovakia', '51035433', '2631517513', 'SK2631517513', 0, NULL, 80.0, '20270023', '2027-02-19', 'paid', '2027-02-05 09:33:00'),
  (24, 32, 1, 1, 1, 'vegetarián', '2027-01-10 14:57:00', 'Uniwersytet Jagielloński', 'Gołębia 24', 'Kraków', '31-007', 'Poland', NULL, NULL, NULL, 0, NULL, 80.0, '20270024', '2027-01-24', 'paid', '2027-01-10 14:57:00'),
  (25, 33, 1, 3, 1, 'vegetarián', '2027-02-13 14:53:00', 'Debreceni Egyetem', 'Egyetem tér 1', 'Debrecen', '4032', 'Hungary', NULL, NULL, NULL, 0, NULL, 80.0, '20270025', '2027-02-27', 'awaiting_payment', '2027-02-13 14:53:00'),
  (26, 34, 1, 1, 0, 'vegán', '2027-03-07 09:14:00', 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6', 'Bratislava', '818 06', 'Slovakia', '16162069', '4809365426', 'SK4809365426', 0, NULL, 120.0, '20270026', '2027-03-21', 'paid', '2027-03-07 09:14:00'),
  (27, 35, 1, 1, 0, 'alergia na orechy', '2027-01-19 09:32:00', 'Univerzita Karlova', 'Ovocný trh 560/5', 'Praha', '116 36', 'Czech Republic', NULL, NULL, NULL, 0, NULL, 120.0, '20270027', '2027-02-02', 'partially_paid', '2027-01-19 09:32:00'),
  (28, 36, 1, 1, 0, NULL, '2027-02-03 10:22:00', 'Technická univerzita v Košiciach', 'Letná 9', 'Košice', '042 00', 'Slovakia', '59478600', '8161999591', 'SK8161999591', 0, NULL, 120.0, '20270028', '2027-02-17', 'awaiting_payment', '2027-02-03 10:22:00'),
  (29, 37, 1, 3, 1, 'bezlepková diéta', '2027-03-10 16:40:00', 'Univerzita sv. Cyrila a Metoda v Trnave', 'Nám. J. Herdu 2', 'Trnava', '917 01', 'Slovakia', '23139873', '3863174305', 'SK3863174305', 0, NULL, 80.0, '20270029', '2027-03-24', 'partially_paid', '2027-03-10 16:40:00'),
  (30, 38, 1, 1, 1, 'vegán', '2027-01-16 11:39:00', 'Slovenská technická univerzita', 'Vazovova 5', 'Bratislava', '812 43', 'Slovakia', '33648748', '3237054855', 'SK3237054855', 0, NULL, 80.0, '20270030', '2027-01-30', 'paid', '2027-01-16 11:39:00');

-- Platby (potvrdzuje používateľ 4 – ekonomické oddelenie)
INSERT INTO payments (id, registration_id, type, amount, received_at, confirmed_by, confirmed_at, note) VALUES
  (1, 1, 'payment', 100.0, '2027-02-23', 4, '2027-02-24 10:00:00', NULL),
  (2, 2, 'payment', 60.0, '2027-02-05', 4, '2027-02-06 11:00:00', 'Prišla len časť sumy'),
  (3, 3, 'payment', 80.0, '2027-02-01', 4, '2027-02-02 10:00:00', NULL),
  (4, 6, 'payment', 120.0, '2027-03-14', 4, '2027-03-15 10:00:00', NULL),
  (5, 7, 'payment', 80.0, '2027-02-06', 4, '2027-02-07 10:00:00', NULL),
  (6, 8, 'payment', 60.0, '2027-01-29', 4, '2027-01-30 10:00:00', NULL),
  (7, 10, 'payment', 40.0, '2027-02-20', 4, '2027-02-21 11:00:00', 'Prišla len časť sumy'),
  (8, 11, 'payment', 120.0, '2027-02-25', 4, '2027-02-26 10:00:00', NULL),
  (9, 17, 'payment', 100.0, '2027-02-17', 4, '2027-02-18 10:00:00', NULL),
  (10, 18, 'payment', 100.0, '2027-03-15', 4, '2027-03-16 10:00:00', NULL),
  (11, 19, 'payment', 100.0, '2027-03-07', 4, '2027-03-08 10:00:00', NULL),
  (12, 21, 'payment', 100.0, '2027-02-11', 4, '2027-02-12 10:00:00', NULL),
  (13, 21, 'refund', 100.0, '2027-03-03', 4, '2027-03-03 09:00:00', 'Účastník zrušil účasť, vrátená celá suma'),
  (14, 23, 'payment', 80.0, '2027-02-15', 4, '2027-02-16 10:00:00', NULL),
  (15, 24, 'payment', 80.0, '2027-01-18', 4, '2027-01-19 10:00:00', NULL),
  (16, 26, 'payment', 120.0, '2027-03-09', 4, '2027-03-10 10:00:00', NULL),
  (17, 27, 'payment', 60.0, '2027-01-28', 4, '2027-01-29 11:00:00', 'Prišla len časť sumy'),
  (18, 29, 'payment', 40.0, '2027-03-19', 4, '2027-03-20 11:00:00', 'Prišla len časť sumy'),
  (19, 30, 'payment', 80.0, '2027-01-26', 4, '2027-01-27 10:00:00', NULL);

-- Faktúry
INSERT INTO invoices (id, registration_id, invoice_number, amount, billing_name, billing_address, billing_ico, billing_dic, billing_ic_dph, issued_at, pdf_path, created_by) VALUES
  (1, 1, 'ANS2027-001', 100.0, 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6, 818 06 Bratislava, Slovakia', '91259725', '6446589627', 'SK6446589627', '2027-02-24', 'invoices/2027/ANS2027-001.pdf', 4),
  (2, 3, 'ANS2027-002', 80.0, 'Debreceni Egyetem', 'Egyetem tér 1, 4032 Debrecen, Hungary', NULL, NULL, NULL, '2027-02-02', 'invoices/2027/ANS2027-002.pdf', 4),
  (3, 6, 'ANS2027-003', 120.0, 'Masarykova univerzita', 'Žerotínovo nám. 617/9, 601 77 Brno, Czech Republic', NULL, NULL, NULL, '2027-03-15', 'invoices/2027/ANS2027-003.pdf', 4),
  (4, 7, 'ANS2027-004', 80.0, 'Uniwersytet Jagielloński', 'Gołębia 24, 31-007 Kraków, Poland', '34319569', NULL, NULL, '2027-02-07', 'invoices/2027/ANS2027-004.pdf', 4),
  (5, 8, 'ANS2027-005', 60.0, 'Debreceni Egyetem', 'Egyetem tér 1, 4032 Debrecen, Hungary', NULL, NULL, NULL, '2027-01-30', 'invoices/2027/ANS2027-005.pdf', 4),
  (6, 11, 'ANS2027-006', 120.0, 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6, 818 06 Bratislava, Slovakia', '56601737', '6386835320', 'SK6386835320', '2027-02-26', 'invoices/2027/ANS2027-006.pdf', 4),
  (7, 17, 'ANS2027-007', 100.0, 'Uniwersytet Jagielloński', 'Gołębia 24, 31-007 Kraków, Poland', NULL, NULL, NULL, '2027-02-18', 'invoices/2027/ANS2027-007.pdf', 4),
  (8, 18, 'ANS2027-008', 100.0, 'Debreceni Egyetem', 'Egyetem tér 1, 4032 Debrecen, Hungary', NULL, NULL, NULL, '2027-03-16', 'invoices/2027/ANS2027-008.pdf', 4),
  (9, 19, 'ANS2027-009', 100.0, 'Univerzita Karlova', 'Ovocný trh 560/5, 116 36 Praha, Czech Republic', NULL, NULL, NULL, '2027-03-08', 'invoices/2027/ANS2027-009.pdf', 4),
  (10, 21, 'ANS2027-010', 100.0, 'Univerzita Karlova', 'Ovocný trh 560/5, 116 36 Praha, Czech Republic', NULL, NULL, NULL, '2027-02-12', 'invoices/2027/ANS2027-010.pdf', 4),
  (11, 23, 'ANS2027-011', 80.0, 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6, 818 06 Bratislava, Slovakia', '51035433', '2631517513', 'SK2631517513', '2027-02-16', 'invoices/2027/ANS2027-011.pdf', 4),
  (12, 24, 'ANS2027-012', 80.0, 'Uniwersytet Jagielloński', 'Gołębia 24, 31-007 Kraków, Poland', NULL, NULL, NULL, '2027-01-19', 'invoices/2027/ANS2027-012.pdf', 4),
  (13, 26, 'ANS2027-013', 120.0, 'Univerzita Komenského v Bratislave', 'Šafárikovo nám. 6, 818 06 Bratislava, Slovakia', '16162069', '4809365426', 'SK4809365426', '2027-03-10', 'invoices/2027/ANS2027-013.pdf', 4),
  (14, 30, 'ANS2027-014', 80.0, 'Slovenská technická univerzita', 'Vazovova 5, 812 43 Bratislava, Slovakia', '33648748', '3237054855', 'SK3237054855', '2027-01-27', 'invoices/2027/ANS2027-014.pdf', 4);

-- Príspevky
INSERT INTO submissions (id, conference_id, registration_id, symposium_id, type, title, abstract, keywords, status, created_at) VALUES
  (1, 1, 1, 4, 'poster', 'Monitoring kvality ovzdušia v Trnave', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'životné prostredie, monitoring, klíma', 'admin_check', '2027-03-11 13:35:00'),
  (2, 1, 2, 1, 'talk', 'Vplyv teploty na rast kultúr Bacillus subtilis', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'mikrobiológia, biotechnológia, kultivácia', 'in_review', '2027-02-12 13:00:00'),
  (3, 1, 3, 4, 'talk', 'Mikroplasty v slovenských riekach', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'životné prostredie, monitoring, klíma', 'committee_decision', '2027-02-08 09:13:00'),
  (4, 1, 4, 4, 'poster', 'Vplyv sucha na poľnohospodársku pôdu', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'životné prostredie, monitoring, klíma', 'admin_check', '2027-03-17 13:50:00'),
  (5, 1, 6, 4, 'talk', 'Urbánna zeleň a mestské tepelné ostrovy', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'životné prostredie, monitoring, klíma', 'submitted', '2027-03-23 09:08:00'),
  (6, 1, 7, 2, 'talk', 'Využitie strojového učenia pri detekcii podvodov', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'informatika, databázy, softvér', 'revision_requested', '2027-02-09 15:09:00'),
  (7, 1, 8, 3, 'poster', 'Syntéza nových derivátov kumarínu', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'chémia, syntéza, analýza', 'in_review', '2027-01-31 09:19:00'),
  (8, 1, 10, 3, 'talk', 'Elektrochemické senzory na detekciu ťažkých kovov', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'chémia, syntéza, analýza', 'rejected', '2027-03-04 16:44:00'),
  (9, 1, 11, 1, 'talk', 'Genetická diverzita populácií jeleňa lesného', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'mikrobiológia, biotechnológia, kultivácia', 'in_review', '2027-03-03 10:17:00'),
  (10, 1, 13, 2, 'talk', 'Návrh databázového systému pre správu konferencií', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'informatika, databázy, softvér', 'submitted', '2027-03-17 16:18:00'),
  (11, 1, 15, 1, 'talk', 'Probiotické kmene v potravinárstve', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'mikrobiológia, biotechnológia, kultivácia', 'conditionally_accepted', '2027-02-25 17:36:00'),
  (12, 1, 17, 2, 'poster', 'Bezpečnosť webových aplikácií v praxi', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'informatika, databázy, softvér', 'in_review', '2027-02-27 10:23:00'),
  (13, 1, 18, 3, 'poster', 'Zelená chémia v laboratórnej praxi', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'chémia, syntéza, analýza', 'submitted', '2027-03-15 17:52:00'),
  (14, 1, 19, 2, 'poster', 'Automatické hodnotenie programov študentov', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'informatika, databázy, softvér', 'revision_requested', '2027-02-28 11:27:00'),
  (15, 1, 20, 3, 'talk', 'Katalyzátory na báze nanočastíc zlata', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'chémia, syntéza, analýza', 'in_review', '2027-03-26 11:00:00'),
  (16, 1, 22, 2, 'poster', 'Optimalizácia dopytov v relačných databázach', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'informatika, databázy, softvér', 'accepted', '2027-03-12 12:41:00'),
  (17, 1, 23, 2, 'talk', 'Rozpoznávanie reči v slovenčine', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'informatika, databázy, softvér', 'revision_requested', '2027-02-08 09:33:00'),
  (18, 1, 24, 2, 'talk', 'Príspevok č. 18', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'informatika, databázy, softvér', 'accepted', '2027-01-19 14:57:00'),
  (19, 1, 26, 2, 'talk', 'Príspevok č. 19', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'informatika, databázy, softvér', 'accepted', '2027-03-27 09:14:00'),
  (20, 1, 27, 2, 'talk', 'Príspevok č. 20', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'informatika, databázy, softvér', 'committee_decision', '2027-02-02 09:32:00'),
  (21, 1, 28, 2, 'talk', 'Príspevok č. 21', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'informatika, databázy, softvér', 'accepted', '2027-02-05 10:22:00'),
  (22, 1, 30, 2, 'talk', 'Príspevok č. 22', 'Príspevok sa zaoberá aktuálnou problematikou v danej oblasti. Cieľom práce bolo overiť navrhnutý postup na vzorke údajov a porovnať ho s existujúcimi prístupmi. Výsledky ukazujú, že navrhnuté riešenie je použiteľné v praxi a otvára priestor pre ďalší výskum.', 'informatika, databázy, softvér', 'in_review', '2027-02-03 11:39:00');

-- Autori a spoluautori (spoluautori bez účtu majú user_id NULL)
INSERT INTO submission_authors (id, submission_id, user_id, first_name, last_name, email, organization, author_order, is_presenter) VALUES
  (1, 1, 9, 'Ján', 'Novák', 'jan.novak@example.com', 'Univerzita Komenského v Bratislave', 1, 1),
  (2, 1, NULL, 'Silvia', 'Urbanová', 'silvia.urbanova@example.com', 'Univerzita Komenského v Bratislave', 2, 0),
  (3, 2, 10, 'Anna', 'Molnárová', 'anna.molnarova@example.com', 'Technická univerzita v Košiciach', 1, 1),
  (4, 2, NULL, 'Ivana', 'Malý', 'ivana.maly@example.com', 'Technická univerzita v Košiciach', 2, 0),
  (5, 2, NULL, 'Peter', 'Benko', 'peter.benko@example.com', 'Technická univerzita v Košiciach', 3, 0),
  (6, 3, 11, 'Michal', 'Mráz', 'michal.mraz@example.com', 'Debreceni Egyetem', 1, 1),
  (7, 3, NULL, 'Monika', 'Pavlíková', 'monika.pavlikova@example.com', 'Debreceni Egyetem', 2, 0),
  (8, 3, NULL, 'Jana', 'Pavlíková', 'jana.pavlikova@example.com', 'Debreceni Egyetem', 3, 0),
  (9, 4, 12, 'Katarína', 'Balážová', 'katarina.balazova@example.com', 'Žilinská univerzita v Žiline', 1, 1),
  (10, 5, 14, 'Simona', 'Nagyová', 'simona.nagyova@example.com', 'Masarykova univerzita', 1, 1),
  (11, 5, NULL, 'Peter', 'Urbanová', 'peter.urbanova@example.com', 'Masarykova univerzita', 2, 0),
  (12, 6, 15, 'Lukáš', 'Huber', 'lukas.huber@example.com', 'Uniwersytet Jagielloński', 1, 1),
  (13, 6, NULL, 'Roman', 'Ševčík', 'roman.sevcik@example.com', 'Uniwersytet Jagielloński', 2, 0),
  (14, 6, NULL, 'Stanislav', 'Hudec', 'stanislav.hudec@example.com', 'Uniwersytet Jagielloński', 3, 0),
  (15, 7, 16, 'Veronika', 'Tóthová', 'veronika.tothova@example.com', 'Debreceni Egyetem', 1, 1),
  (16, 8, 18, 'Natália', 'Vargová', 'natalia.vargova@example.com', 'Slovenská technická univerzita', 1, 1),
  (17, 8, NULL, 'Peter', 'Hudec', 'peter.hudec@example.com', 'Slovenská technická univerzita', 2, 0),
  (18, 9, 19, 'Filip', 'Dvořák', 'filip.dvorak@example.com', 'Univerzita Komenského v Bratislave', 1, 1),
  (19, 9, NULL, 'Matej', 'Kráľová', 'matej.kralova@example.com', 'Univerzita Komenského v Bratislave', 2, 0),
  (20, 10, 21, 'Adam', 'Lukáč', 'adam.lukac@example.com', 'Masarykova univerzita', 1, 1),
  (21, 10, NULL, 'Roman', 'Kráľová', 'roman.kralova@example.com', 'Masarykova univerzita', 2, 0),
  (22, 10, NULL, 'Peter', 'Benko', 'peter.benko@example.com', 'Masarykova univerzita', 3, 0),
  (23, 11, 23, 'Jakub', 'Szabó', 'jakub.szabo@example.com', 'Slovenská technická univerzita', 1, 1),
  (24, 11, NULL, 'Monika', 'Kráľová', 'monika.kralova@example.com', 'Slovenská technická univerzita', 2, 0),
  (25, 12, 25, 'Patrik', 'Molnár', 'patrik.molnar@example.com', 'Uniwersytet Jagielloński', 1, 1),
  (26, 13, 26, 'Kristína', 'Mrázová', 'kristina.mrazova@example.com', 'Debreceni Egyetem', 1, 1),
  (27, 14, 27, 'Samuel', 'Baláž', 'samuel.balaz@example.com', 'Univerzita Karlova', 1, 1),
  (28, 15, 28, 'Petra', 'Kiss', 'petra.kiss@example.com', 'Technická univerzita v Košiciach', 1, 1),
  (29, 15, NULL, 'Matej', 'Urbanová', 'matej.urbanova@example.com', 'Technická univerzita v Košiciach', 2, 0),
  (30, 16, 30, 'Tereza', 'Huber', 'tereza.huber@example.com', 'Debreceni Egyetem', 1, 1),
  (31, 16, NULL, 'Peter', 'Kráľová', 'peter.kralova@example.com', 'Debreceni Egyetem', 2, 0),
  (32, 16, NULL, 'Monika', 'Malý', 'monika.maly@example.com', 'Debreceni Egyetem', 3, 0),
  (33, 17, 31, 'Piotr', 'Tóth', 'piotr.toth@example.com', 'Univerzita Komenského v Bratislave', 1, 1),
  (34, 17, NULL, 'Stanislav', 'Urbanová', 'stanislav.urbanova@example.com', 'Univerzita Komenského v Bratislave', 2, 0),
  (35, 17, NULL, 'Matej', 'Kráľová', 'matej.kralova@example.com', 'Univerzita Komenského v Bratislave', 3, 0),
  (36, 18, 32, 'Agnieszka', 'Kowalska', 'agnieszka.kowalska@example.com', 'Uniwersytet Jagielloński', 1, 1),
  (37, 19, 34, 'Julia', 'Dvořáková', 'julia.dvorakova@example.com', 'Univerzita Komenského v Bratislave', 1, 1),
  (38, 20, 35, 'Bence', 'Kováč', 'bence.kovac@example.com', 'Univerzita Karlova', 1, 1),
  (39, 20, NULL, 'Stanislav', 'Urbanová', 'stanislav.urbanova@example.com', 'Univerzita Karlova', 2, 0),
  (40, 21, 36, 'Réka', 'Lukáčová', 'reka.lukacova@example.com', 'Technická univerzita v Košiciach', 1, 1),
  (41, 22, 38, 'Laura', 'Szabová', 'laura.szabova@example.com', 'Slovenská technická univerzita', 1, 1);

-- Verzie súborov
INSERT INTO submission_versions (id, submission_id, version_number, file_path, original_filename, mime_type, file_size, uploaded_by, uploaded_at) VALUES
  (1, 1, 1, 'uploads/2027/1/v1.pdf', 'prispevok_novak.pdf', 'application/pdf', 1809071, 9, '2027-03-11 13:35:00'),
  (2, 2, 1, 'uploads/2027/2/v1.pdf', 'prispevok_molnarova.pdf', 'application/pdf', 2629565, 10, '2027-02-12 13:00:00'),
  (3, 3, 1, 'uploads/2027/3/v1.pdf', 'prispevok_mraz.pdf', 'application/pdf', 352211, 11, '2027-02-08 09:13:00'),
  (4, 4, 1, 'uploads/2027/4/v1.pdf', 'prispevok_balazova.pdf', 'application/pdf', 2968613, 12, '2027-03-17 13:50:00'),
  (5, 5, 1, 'uploads/2027/5/v1.pdf', 'prispevok_nagyova.pdf', 'application/pdf', 2848292, 14, '2027-03-23 09:08:00'),
  (6, 6, 1, 'uploads/2027/6/v1.pdf', 'prispevok_huber.pdf', 'application/pdf', 785150, 15, '2027-02-09 15:09:00'),
  (7, 7, 1, 'uploads/2027/7/v1.pdf', 'prispevok_tothova.pdf', 'application/pdf', 2113904, 16, '2027-01-31 09:19:00'),
  (8, 8, 1, 'uploads/2027/8/v1.pdf', 'prispevok_vargova.pdf', 'application/pdf', 548056, 18, '2027-03-04 16:44:00'),
  (9, 9, 1, 'uploads/2027/9/v1.pdf', 'prispevok_dvorak.pdf', 'application/pdf', 1956160, 19, '2027-03-03 10:17:00'),
  (10, 10, 1, 'uploads/2027/10/v1.pdf', 'prispevok_lukac.pdf', 'application/pdf', 2462480, 21, '2027-03-17 16:18:00'),
  (11, 11, 1, 'uploads/2027/11/v1.pdf', 'prispevok_szabo.pdf', 'application/pdf', 1664164, 23, '2027-02-25 17:36:00'),
  (12, 12, 1, 'uploads/2027/12/v1.pdf', 'prispevok_molnar.pdf', 'application/pdf', 1241714, 25, '2027-02-27 10:23:00'),
  (13, 13, 1, 'uploads/2027/13/v1.pdf', 'prispevok_mrazova.pdf', 'application/pdf', 1456283, 26, '2027-03-15 17:52:00'),
  (14, 14, 1, 'uploads/2027/14/v1.pdf', 'prispevok_balaz.pdf', 'application/pdf', 662262, 27, '2027-02-28 11:27:00'),
  (15, 15, 1, 'uploads/2027/15/v1.pdf', 'prispevok_kiss.pdf', 'application/pdf', 2537084, 28, '2027-03-26 11:00:00'),
  (16, 16, 1, 'uploads/2027/16/v1.pdf', 'prispevok_huber.pdf', 'application/pdf', 801823, 30, '2027-03-12 12:41:00'),
  (17, 17, 1, 'uploads/2027/17/v1.pdf', 'prispevok_toth.pdf', 'application/pdf', 2206589, 31, '2027-02-08 09:33:00'),
  (18, 18, 1, 'uploads/2027/18/v1.pdf', 'prispevok_kowalska.pdf', 'application/pdf', 685272, 32, '2027-01-19 14:57:00'),
  (19, 18, 2, 'uploads/2027/18/v2.pdf', 'prispevok_kowalska_v2.pdf', 'application/pdf', 1838585, 32, '2027-02-10 14:57:00'),
  (20, 19, 1, 'uploads/2027/19/v1.pdf', 'prispevok_dvorakova.pdf', 'application/pdf', 1855834, 34, '2027-03-27 09:14:00'),
  (21, 19, 2, 'uploads/2027/19/v2.pdf', 'prispevok_dvorakova_v2.pdf', 'application/pdf', 451045, 34, '2027-04-20 09:14:00'),
  (22, 20, 1, 'uploads/2027/20/v1.pdf', 'prispevok_kovac.pdf', 'application/pdf', 1643461, 35, '2027-02-02 09:32:00'),
  (23, 21, 1, 'uploads/2027/21/v1.pdf', 'prispevok_lukacova.pdf', 'application/pdf', 717737, 36, '2027-02-05 10:22:00'),
  (24, 22, 1, 'uploads/2027/22/v1.pdf', 'prispevok_szabova.pdf', 'application/pdf', 1189335, 38, '2027-02-03 11:39:00');

-- História stavov príspevkov
INSERT INTO submission_status_history (id, submission_id, from_status, to_status, changed_by, changed_at, comment) VALUES
  (1, 1, NULL, 'submitted', 9, '2027-03-11 13:35:00', 'Príspevok prihlásený'),
  (2, 1, 'submitted', 'admin_check', 2, '2027-03-13 13:35:00', NULL),
  (3, 2, NULL, 'submitted', 10, '2027-02-12 13:00:00', 'Príspevok prihlásený'),
  (4, 2, 'submitted', 'admin_check', 2, '2027-02-14 13:00:00', NULL),
  (5, 2, 'admin_check', 'in_review', 2, '2027-02-20 13:00:00', 'Formálna kontrola v poriadku'),
  (6, 3, NULL, 'submitted', 11, '2027-02-08 09:13:00', 'Príspevok prihlásený'),
  (7, 3, 'submitted', 'admin_check', 2, '2027-02-12 09:13:00', NULL),
  (8, 3, 'admin_check', 'in_review', 2, '2027-02-16 09:13:00', 'Formálna kontrola v poriadku'),
  (9, 3, 'in_review', 'committee_decision', 2, '2027-02-18 09:13:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (10, 4, NULL, 'submitted', 12, '2027-03-17 13:50:00', 'Príspevok prihlásený'),
  (11, 4, 'submitted', 'admin_check', 2, '2027-03-22 13:50:00', NULL),
  (12, 5, NULL, 'submitted', 14, '2027-03-23 09:08:00', 'Príspevok prihlásený'),
  (13, 6, NULL, 'submitted', 15, '2027-02-09 15:09:00', 'Príspevok prihlásený'),
  (14, 6, 'submitted', 'admin_check', 2, '2027-02-12 15:09:00', NULL),
  (15, 6, 'admin_check', 'in_review', 2, '2027-02-18 15:09:00', 'Formálna kontrola v poriadku'),
  (16, 6, 'in_review', 'committee_decision', 2, '2027-02-22 15:09:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (17, 6, 'committee_decision', 'revision_requested', 3, '2027-02-25 15:09:00', 'Prosíme zapracovať pripomienky recenzentov'),
  (18, 7, NULL, 'submitted', 16, '2027-01-31 09:19:00', 'Príspevok prihlásený'),
  (19, 7, 'submitted', 'admin_check', 2, '2027-02-02 09:19:00', NULL),
  (20, 7, 'admin_check', 'in_review', 2, '2027-02-04 09:19:00', 'Formálna kontrola v poriadku'),
  (21, 8, NULL, 'submitted', 18, '2027-03-04 16:44:00', 'Príspevok prihlásený'),
  (22, 8, 'submitted', 'admin_check', 2, '2027-03-08 16:44:00', NULL),
  (23, 8, 'admin_check', 'in_review', 2, '2027-03-13 16:44:00', 'Formálna kontrola v poriadku'),
  (24, 8, 'in_review', 'committee_decision', 2, '2027-03-18 16:44:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (25, 8, 'committee_decision', 'rejected', 3, '2027-03-21 16:44:00', 'Príspevok nespĺňa odborné požiadavky konferencie'),
  (26, 9, NULL, 'submitted', 19, '2027-03-03 10:17:00', 'Príspevok prihlásený'),
  (27, 9, 'submitted', 'admin_check', 2, '2027-03-06 10:17:00', NULL),
  (28, 9, 'admin_check', 'in_review', 2, '2027-03-12 10:17:00', 'Formálna kontrola v poriadku'),
  (29, 10, NULL, 'submitted', 21, '2027-03-17 16:18:00', 'Príspevok prihlásený'),
  (30, 11, NULL, 'submitted', 23, '2027-02-25 17:36:00', 'Príspevok prihlásený'),
  (31, 11, 'submitted', 'admin_check', 2, '2027-03-02 17:36:00', NULL),
  (32, 11, 'admin_check', 'in_review', 2, '2027-03-07 17:36:00', 'Formálna kontrola v poriadku'),
  (33, 11, 'in_review', 'committee_decision', 2, '2027-03-11 17:36:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (34, 11, 'committee_decision', 'conditionally_accepted', 3, '2027-03-14 17:36:00', 'Podmienečne prijaté – doplniť zoznam literatúry'),
  (35, 12, NULL, 'submitted', 25, '2027-02-27 10:23:00', 'Príspevok prihlásený'),
  (36, 12, 'submitted', 'admin_check', 2, '2027-03-02 10:23:00', NULL),
  (37, 12, 'admin_check', 'in_review', 2, '2027-03-07 10:23:00', 'Formálna kontrola v poriadku'),
  (38, 13, NULL, 'submitted', 26, '2027-03-15 17:52:00', 'Príspevok prihlásený'),
  (39, 14, NULL, 'submitted', 27, '2027-02-28 11:27:00', 'Príspevok prihlásený'),
  (40, 14, 'submitted', 'admin_check', 2, '2027-03-03 11:27:00', NULL),
  (41, 14, 'admin_check', 'in_review', 2, '2027-03-08 11:27:00', 'Formálna kontrola v poriadku'),
  (42, 14, 'in_review', 'committee_decision', 2, '2027-03-12 11:27:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (43, 14, 'committee_decision', 'revision_requested', 3, '2027-03-18 11:27:00', 'Prosíme zapracovať pripomienky recenzentov'),
  (44, 15, NULL, 'submitted', 28, '2027-03-26 11:00:00', 'Príspevok prihlásený'),
  (45, 15, 'submitted', 'admin_check', 2, '2027-04-01 11:00:00', NULL),
  (46, 15, 'admin_check', 'in_review', 2, '2027-04-05 11:00:00', 'Formálna kontrola v poriadku'),
  (47, 16, NULL, 'submitted', 30, '2027-03-12 12:41:00', 'Príspevok prihlásený'),
  (48, 16, 'submitted', 'admin_check', 2, '2027-03-16 12:41:00', NULL),
  (49, 16, 'admin_check', 'in_review', 2, '2027-03-19 12:41:00', 'Formálna kontrola v poriadku'),
  (50, 16, 'in_review', 'committee_decision', 2, '2027-03-24 12:41:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (51, 16, 'committee_decision', 'accepted', 3, '2027-03-28 12:41:00', 'Príspevok prijatý'),
  (52, 17, NULL, 'submitted', 31, '2027-02-08 09:33:00', 'Príspevok prihlásený'),
  (53, 17, 'submitted', 'admin_check', 2, '2027-02-12 09:33:00', NULL),
  (54, 17, 'admin_check', 'in_review', 2, '2027-02-18 09:33:00', 'Formálna kontrola v poriadku'),
  (55, 17, 'in_review', 'committee_decision', 2, '2027-02-21 09:33:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (56, 17, 'committee_decision', 'revision_requested', 3, '2027-02-27 09:33:00', 'Prosíme zapracovať pripomienky recenzentov'),
  (57, 18, NULL, 'submitted', 32, '2027-01-19 14:57:00', 'Príspevok prihlásený'),
  (58, 18, 'submitted', 'admin_check', 2, '2027-01-24 14:57:00', NULL),
  (59, 18, 'admin_check', 'in_review', 2, '2027-01-28 14:57:00', 'Formálna kontrola v poriadku'),
  (60, 18, 'in_review', 'committee_decision', 2, '2027-01-31 14:57:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (61, 18, 'committee_decision', 'revision_requested', 3, '2027-02-05 14:57:00', 'Prosíme zapracovať pripomienky recenzentov'),
  (62, 18, 'revision_requested', 'committee_decision', 2, '2027-02-14 14:57:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (63, 18, 'committee_decision', 'accepted', 3, '2027-02-20 14:57:00', 'Príspevok prijatý'),
  (64, 19, NULL, 'submitted', 34, '2027-03-27 09:14:00', 'Príspevok prihlásený'),
  (65, 19, 'submitted', 'admin_check', 2, '2027-04-02 09:14:00', NULL),
  (66, 19, 'admin_check', 'in_review', 2, '2027-04-06 09:14:00', 'Formálna kontrola v poriadku'),
  (67, 19, 'in_review', 'committee_decision', 2, '2027-04-09 09:14:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (68, 19, 'committee_decision', 'revision_requested', 3, '2027-04-15 09:14:00', 'Prosíme zapracovať pripomienky recenzentov'),
  (69, 19, 'revision_requested', 'committee_decision', 2, '2027-04-27 09:14:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (70, 19, 'committee_decision', 'accepted', 3, '2027-05-03 09:14:00', 'Príspevok prijatý'),
  (71, 20, NULL, 'submitted', 35, '2027-02-02 09:32:00', 'Príspevok prihlásený'),
  (72, 20, 'submitted', 'admin_check', 2, '2027-02-08 09:32:00', NULL),
  (73, 20, 'admin_check', 'in_review', 2, '2027-02-13 09:32:00', 'Formálna kontrola v poriadku'),
  (74, 20, 'in_review', 'committee_decision', 2, '2027-02-17 09:32:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (75, 21, NULL, 'submitted', 36, '2027-02-05 10:22:00', 'Príspevok prihlásený'),
  (76, 21, 'submitted', 'admin_check', 2, '2027-02-09 10:22:00', NULL),
  (77, 21, 'admin_check', 'in_review', 2, '2027-02-15 10:22:00', 'Formálna kontrola v poriadku'),
  (78, 21, 'in_review', 'committee_decision', 2, '2027-02-17 10:22:00', 'Recenzie ukončené, postúpené programovému výboru'),
  (79, 21, 'committee_decision', 'accepted', 3, '2027-02-19 10:22:00', 'Príspevok prijatý'),
  (80, 22, NULL, 'submitted', 38, '2027-02-03 11:39:00', 'Príspevok prihlásený'),
  (81, 22, 'submitted', 'admin_check', 2, '2027-02-06 11:39:00', NULL),
  (82, 22, 'admin_check', 'in_review', 2, '2027-02-08 11:39:00', 'Formálna kontrola v poriadku');

-- Pridelenie recenzentom
INSERT INTO review_assignments (id, submission_id, reviewer_id, assigned_by, assigned_at, due_date, status) VALUES
  (1, 2, 6, 2, '2027-02-17 13:00:00', '2027-03-10', 'assigned'),
  (2, 2, 5, 2, '2027-02-17 13:00:00', '2027-03-10', 'completed'),
  (3, 3, 7, 2, '2027-02-13 09:13:00', '2027-03-06', 'completed'),
  (4, 3, 6, 2, '2027-02-13 09:13:00', '2027-03-06', 'completed'),
  (5, 6, 6, 2, '2027-02-14 15:09:00', '2027-03-07', 'completed'),
  (6, 6, 5, 2, '2027-02-14 15:09:00', '2027-03-07', 'completed'),
  (7, 7, 5, 2, '2027-02-05 09:19:00', '2027-02-26', 'completed'),
  (8, 7, 7, 2, '2027-02-05 09:19:00', '2027-02-26', 'assigned'),
  (9, 8, 8, 2, '2027-03-09 16:44:00', '2027-03-30', 'completed'),
  (10, 8, 6, 2, '2027-03-09 16:44:00', '2027-03-30', 'completed'),
  (11, 9, 7, 2, '2027-03-08 10:17:00', '2027-03-29', 'completed'),
  (12, 9, 8, 2, '2027-03-08 10:17:00', '2027-03-29', 'completed'),
  (13, 11, 6, 2, '2027-03-02 17:36:00', '2027-03-23', 'completed'),
  (14, 11, 8, 2, '2027-03-02 17:36:00', '2027-03-23', 'completed'),
  (15, 12, 6, 2, '2027-03-04 10:23:00', '2027-03-25', 'assigned'),
  (16, 12, 5, 2, '2027-03-04 10:23:00', '2027-03-25', 'assigned'),
  (17, 14, 5, 2, '2027-03-05 11:27:00', '2027-03-26', 'completed'),
  (18, 14, 3, 2, '2027-03-05 11:27:00', '2027-03-26', 'completed'),
  (19, 15, 8, 2, '2027-03-31 11:00:00', '2027-04-21', 'assigned'),
  (20, 15, 3, 2, '2027-03-31 11:00:00', '2027-04-21', 'assigned'),
  (21, 16, 7, 2, '2027-03-17 12:41:00', '2027-04-07', 'completed'),
  (22, 16, 3, 2, '2027-03-17 12:41:00', '2027-04-07', 'completed'),
  (23, 17, 8, 2, '2027-02-13 09:33:00', '2027-03-06', 'completed'),
  (24, 17, 7, 2, '2027-02-13 09:33:00', '2027-03-06', 'completed'),
  (25, 18, 5, 2, '2027-01-24 14:57:00', '2027-02-14', 'completed'),
  (26, 18, 7, 2, '2027-01-24 14:57:00', '2027-02-14', 'completed'),
  (27, 19, 5, 2, '2027-04-01 09:14:00', '2027-04-22', 'completed'),
  (28, 19, 8, 2, '2027-04-01 09:14:00', '2027-04-22', 'completed'),
  (29, 20, 5, 2, '2027-02-07 09:32:00', '2027-02-28', 'completed'),
  (30, 20, 8, 2, '2027-02-07 09:32:00', '2027-02-28', 'completed'),
  (31, 21, 6, 2, '2027-02-10 10:22:00', '2027-03-03', 'completed'),
  (32, 21, 8, 2, '2027-02-10 10:22:00', '2027-03-03', 'completed'),
  (33, 22, 5, 2, '2027-02-08 11:39:00', '2027-03-01', 'completed'),
  (34, 22, 6, 2, '2027-02-08 11:39:00', '2027-03-01', 'assigned');

-- Recenzné posudky
INSERT INTO reviews (id, assignment_id, version_id, score, recommendation, comment_for_author, comment_for_committee, submitted_at) VALUES
  (1, 2, 2, 3, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-25 13:00:00'),
  (2, 3, 3, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-26 09:13:00'),
  (3, 4, 3, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-28 09:13:00'),
  (4, 5, 6, 3, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-19 15:09:00'),
  (5, 6, 6, 3, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-28 15:09:00'),
  (6, 7, 7, 4, 'accept', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-18 09:19:00'),
  (7, 9, 8, 2, 'reject', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-03-18 16:44:00'),
  (8, 10, 8, 2, 'reject', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-03-23 16:44:00'),
  (9, 11, 9, 4, 'accept', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-03-13 10:17:00'),
  (10, 12, 9, 5, 'accept', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-03-16 10:17:00'),
  (11, 13, 11, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-03-17 17:36:00'),
  (12, 14, 11, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-03-13 17:36:00'),
  (13, 17, 14, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-03-10 11:27:00'),
  (14, 18, 14, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-03-16 11:27:00'),
  (15, 21, 16, 4, 'accept', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-04-01 12:41:00'),
  (16, 22, 16, 5, 'accept', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-03-31 12:41:00'),
  (17, 23, 17, 3, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-22 09:33:00'),
  (18, 24, 17, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-23 09:33:00'),
  (19, 25, 18, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-02 14:57:00'),
  (20, 26, 18, 3, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-01-30 14:57:00'),
  (21, 27, 20, 3, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-04-15 09:14:00'),
  (22, 28, 20, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-04-06 09:14:00'),
  (23, 29, 22, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-14 09:32:00'),
  (24, 30, 22, 5, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-20 09:32:00'),
  (25, 31, 23, 5, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-23 10:22:00'),
  (26, 32, 23, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-22 10:22:00'),
  (27, 33, 24, 4, 'accept_after_revision', 'Príspevok je zrozumiteľný, odporúčam doplniť porovnanie s inými prácami.', 'Kvalita na úrovni konferencie.', '2027-02-23 11:39:00');

-- Program konferencie
INSERT INTO program_items (id, conference_id, symposium_id, submission_id, title, room, start_at, end_at) VALUES
  (1, 1, NULL, NULL, 'Otvorenie konferencie', 'Aula', '2027-05-13 09:00:00', '2027-05-13 09:30:00'),
  (2, 1, 2, 16, 'Optimalizácia dopytov v relačných databázach', 'Foyer – postery', '2027-05-13 14:00:00', '2027-05-13 15:30:00'),
  (3, 1, 2, 18, 'Príspevok č. 18', 'A102', '2027-05-13 09:30:00', '2027-05-13 09:50:00'),
  (4, 1, 2, 19, 'Príspevok č. 19', 'A102', '2027-05-13 09:50:00', '2027-05-13 10:10:00'),
  (5, 1, 2, 21, 'Príspevok č. 21', 'A102', '2027-05-13 10:10:00', '2027-05-13 10:30:00'),
  (6, 1, NULL, NULL, 'Prestávka na kávu', 'Foyer', '2027-05-13 11:00:00', '2027-05-13 11:30:00'),
  (7, 1, NULL, NULL, 'Slávnostný večer', 'Reštaurácia', '2027-05-13 19:00:00', '2027-05-13 23:00:00');

-- Oznámenia v účte
INSERT INTO notifications (user_id, conference_id, title, body, is_read, created_at) VALUES
  (15, 1, 'Zmena stavu príspevku', 'Stav vášho príspevku „Využitie strojového učenia pri detekcii podvodov“ sa zmenil na: revision_requested.', 0, '2027-02-27 15:09:00'),
  (18, 1, 'Zmena stavu príspevku', 'Stav vášho príspevku „Elektrochemické senzory na detekciu ťažkých kovov“ sa zmenil na: rejected.', 0, '2027-03-26 16:44:00'),
  (23, 1, 'Zmena stavu príspevku', 'Stav vášho príspevku „Probiotické kmene v potravinárstve“ sa zmenil na: conditionally_accepted.', 1, '2027-03-18 17:36:00'),
  (27, 1, 'Zmena stavu príspevku', 'Stav vášho príspevku „Automatické hodnotenie programov študentov“ sa zmenil na: revision_requested.', 0, '2027-03-21 11:27:00'),
  (30, 1, 'Zmena stavu príspevku', 'Stav vášho príspevku „Optimalizácia dopytov v relačných databázach“ sa zmenil na: accepted.', 0, '2027-04-03 12:41:00'),
  (31, 1, 'Zmena stavu príspevku', 'Stav vášho príspevku „Rozpoznávanie reči v slovenčine“ sa zmenil na: revision_requested.', 1, '2027-03-05 09:33:00'),
  (32, 1, 'Zmena stavu príspevku', 'Stav vášho príspevku „Príspevok č. 18“ sa zmenil na: accepted.', 0, '2027-02-23 14:57:00'),
  (34, 1, 'Zmena stavu príspevku', 'Stav vášho príspevku „Príspevok č. 19“ sa zmenil na: accepted.', 1, '2027-05-05 09:14:00'),
  (36, 1, 'Zmena stavu príspevku', 'Stav vášho príspevku „Príspevok č. 21“ sa zmenil na: accepted.', 1, '2027-02-25 10:22:00'),
  (17, 1, 'Platba po splatnosti', 'Vaša platba za ANS 2027 je po splatnosti. Prosíme o úhradu.', 0, '2027-01-29 00:00:00'),
  (22, 1, 'Platba po splatnosti', 'Vaša platba za ANS 2027 je po splatnosti. Prosíme o úhradu.', 0, '2027-02-05 00:00:00'),
  (24, 1, 'Platba po splatnosti', 'Vaša platba za ANS 2027 je po splatnosti. Prosíme o úhradu.', 0, '2027-01-31 00:00:00');

-- Odoslané e-maily
INSERT INTO email_log (recipient_user_id, recipient_email, subject, type, sent_by, sent_at) VALUES
  (38, 'laura.szabova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-01-16 11:39:00'),
  (37, 'daniel.horvath@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-03-10 16:40:00'),
  (36, 'reka.lukacova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-02-03 10:22:00'),
  (35, 'bence.kovac@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-01-19 09:32:00'),
  (34, 'julia.dvorakova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-03-07 09:14:00'),
  (33, 'lukas.varga@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-02-13 14:53:00'),
  (32, 'agnieszka.kowalska@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-01-10 14:57:00'),
  (31, 'piotr.toth@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-02-05 09:33:00'),
  (30, 'tereza.huber@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-03-03 12:41:00'),
  (29, 'ondrej.nagy@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-02-01 18:02:00'),
  (28, 'petra.kiss@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-03-06 11:00:00'),
  (27, 'samuel.balaz@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-02-26 11:27:00'),
  (26, 'kristina.mrazova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-03-10 17:52:00'),
  (25, 'patrik.molnar@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-02-07 10:23:00'),
  (24, 'lenka.novakova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-01-16 09:37:00'),
  (23, 'jakub.szabo@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-02-19 17:36:00'),
  (22, 'maria.horvathova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-01-21 16:13:00'),
  (21, 'adam.lukac@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-03-03 16:18:00'),
  (20, 'barbora.kovacova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-01-10 13:48:00'),
  (19, 'filip.dvorak@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-02-18 10:17:00'),
  (18, 'natalia.vargova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-02-16 16:44:00'),
  (17, 'marek.kowalski@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-01-14 16:27:00'),
  (16, 'veronika.tothova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-01-27 09:19:00'),
  (15, 'lukas.huber@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-01-27 15:09:00'),
  (14, 'simona.nagyova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-03-06 09:08:00'),
  (13, 'tomas.kiss@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-03-06 16:04:00'),
  (12, 'katarina.balazova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-02-25 13:50:00'),
  (11, 'michal.mraz@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-01-29 09:13:00'),
  (10, 'anna.molnarova@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-01-27 13:00:00'),
  (9, 'jan.novak@example.com', 'ANS 2027 – potvrdenie registrácie a platobné inštrukcie', 'registration', NULL, '2027-02-20 13:35:00'),
  (15, 'lukas.huber@example.com', 'ANS 2027 – zmena stavu príspevku', 'status_change', NULL, '2027-02-27 15:09:00'),
  (18, 'natalia.vargova@example.com', 'ANS 2027 – zmena stavu príspevku', 'status_change', NULL, '2027-03-26 16:44:00'),
  (23, 'jakub.szabo@example.com', 'ANS 2027 – zmena stavu príspevku', 'status_change', NULL, '2027-03-18 17:36:00'),
  (27, 'samuel.balaz@example.com', 'ANS 2027 – zmena stavu príspevku', 'status_change', NULL, '2027-03-21 11:27:00'),
  (30, 'tereza.huber@example.com', 'ANS 2027 – zmena stavu príspevku', 'status_change', NULL, '2027-04-03 12:41:00'),
  (31, 'piotr.toth@example.com', 'ANS 2027 – zmena stavu príspevku', 'status_change', NULL, '2027-03-05 09:33:00'),
  (32, 'agnieszka.kowalska@example.com', 'ANS 2027 – zmena stavu príspevku', 'status_change', NULL, '2027-02-23 14:57:00'),
  (34, 'julia.dvorakova@example.com', 'ANS 2027 – zmena stavu príspevku', 'status_change', NULL, '2027-05-05 09:14:00'),
  (36, 'reka.lukacova@example.com', 'ANS 2027 – zmena stavu príspevku', 'status_change', NULL, '2027-02-25 10:22:00'),
  (9, 'jan.novak@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-02-28 13:35:00'),
  (11, 'michal.mraz@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-02-06 09:13:00'),
  (14, 'simona.nagyova@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-03-14 09:08:00'),
  (15, 'lukas.huber@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-02-04 15:09:00'),
  (16, 'veronika.tothova@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-02-04 09:19:00'),
  (19, 'filip.dvorak@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-02-26 10:17:00'),
  (25, 'patrik.molnar@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-02-15 10:23:00'),
  (26, 'kristina.mrazova@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-03-18 17:52:00'),
  (27, 'samuel.balaz@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-03-06 11:27:00'),
  (31, 'piotr.toth@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-02-13 09:33:00'),
  (32, 'agnieszka.kowalska@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-01-18 14:57:00'),
  (34, 'julia.dvorakova@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-03-15 09:14:00'),
  (38, 'laura.szabova@example.com', 'ANS 2027 – platba prijatá', 'payment_confirmed', 4, '2027-01-24 11:39:00'),
  (NULL, 'vsetci-ucastnici@ans-test.sk', 'ANS 2027 – organizačné informácie', 'bulk', 2, '2027-04-20 10:00:00');

-- Záznamy o administrátorských operáciách
INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at) VALUES
  (4, 'payment_confirmed', 'payment', 1, NULL, '100.0 EUR', '127.0.0.1', '2027-02-24 10:00:00'),
  (4, 'payment_confirmed', 'payment', 2, NULL, '60.0 EUR', '127.0.0.1', '2027-02-06 11:00:00'),
  (4, 'payment_confirmed', 'payment', 3, NULL, '80.0 EUR', '127.0.0.1', '2027-02-02 10:00:00'),
  (4, 'payment_confirmed', 'payment', 4, NULL, '120.0 EUR', '127.0.0.1', '2027-03-15 10:00:00'),
  (4, 'payment_confirmed', 'payment', 5, NULL, '80.0 EUR', '127.0.0.1', '2027-02-07 10:00:00'),
  (4, 'payment_confirmed', 'payment', 6, NULL, '60.0 EUR', '127.0.0.1', '2027-01-30 10:00:00'),
  (4, 'payment_confirmed', 'payment', 7, NULL, '40.0 EUR', '127.0.0.1', '2027-02-21 11:00:00'),
  (4, 'payment_confirmed', 'payment', 8, NULL, '120.0 EUR', '127.0.0.1', '2027-02-26 10:00:00'),
  (1, 'role_changed', 'user_roles', 5, 'reviewer', 'reviewer, program_committee', '127.0.0.1', '2027-02-01 09:00:00'),
  (2, 'status_changed', 'submission', 1, 'submitted', 'admin_check', '127.0.0.1', '2027-02-15 13:00:00');

