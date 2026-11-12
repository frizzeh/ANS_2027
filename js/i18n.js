/* ==========================================================================
   Preklady SK / EN
   Nový text: pridaj rovnaký kľúč do oboch jazykov a v HTML daj data-i18n="kluc".
   ========================================================================== */

const I18N = {

  sk: {
    // Spoločné
    "tba": "[doplniť]",

    // Menu
    "nav.program": "Program",
    "nav.speakers": "Rečníci",
    "nav.fees": "Poplatky",
    "nav.venue": "Miesto a ubytovanie",
    "nav.admin": "Admin",
    "nav.superadmin": "Super admin",

    // Tlačidlá
    "btn.login": "Prihlásiť sa",
    "btn.account": "Môj účet",
    "btn.logout": "Odhlásiť sa",
    "btn.register": "Registrovať sa",
    "btn.submit": "Odoslať príspevok",

    // Pätička
    "footer.org": "Fakulta prírodných vied UCM v Trnave a Fakulta prírodných vied UMB v Banskej Bystrici",
    "footer.contact": "Kontakt: [doplniť e-mail]",

    // Názvy stránok
    "title.index": "ANS 2027 – Applied Natural Sciences",
    "title.register": "Registrácia – ANS 2027",
    "title.login": "Prihlásenie – ANS 2027",
    "title.account": "Môj účet – ANS 2027",
    "title.paper": "Príspevok – ANS 2027",
    "title.admin": "Admin – ANS 2027",
    "title.superadmin": "Super admin – ANS 2027",

    // Chyby
    "err.network": "Server neodpovedá. Skontrolujte, či beží PHP backend.",

    // Úvod: hlavná časť
    "hero.eyebrow": "Medzinárodná vedecká konferencia",
    "hero.lead": "Medzinárodná vedecká konferencia o prírodných vedách. Registrácia, príspevky a platba na jednom mieste.",
    "hero.lang": "Jazyk: angličtina",

    // Termíny
    "dates.title": "Dôležité termíny",
    "dates.abstract": "Uzávierka abstraktov",
    "dates.accept": "Oznámenie o prijatí",
    "dates.payment": "Uzávierka registrácie a platby",
    "dates.conf": "Konferencia",

    // Úvod: rýchle odkazy
    "quick.new.label": "Nový účastník",
    "quick.new.title": "Registrácia",
    "quick.new.text": "Vyplňte formulár a vyberte kategóriu účasti.",
    "quick.paper.label": "Autori",
    "quick.paper.title": "Odoslať príspevok",
    "quick.paper.text": "Abstrakt, článok alebo poster podľa šablóny.",
    "quick.acc.label": "Už ste registrovaný",
    "quick.acc.title": "Môj účet",
    "quick.acc.text": "Stav platby, príspevku a recenzií.",

    // Úvod: kroky
    "steps.label": "Ako to funguje",
    "steps.title": "Štyri jednoduché kroky",
    "steps.1.t": "Zaregistrujte sa",
    "steps.1.d": "Vyberiete kategóriu účasti a vyplníte údaje.",
    "steps.2.t": "Uhraďte poplatok",
    "steps.2.d": "Dostanete e-mail s platobnými údajmi. Platí sa bankovým prevodom.",
    "steps.3.t": "Odošlite príspevok",
    "steps.3.d": "Nahráte abstrakt alebo poster a sledujete recenziu.",
    "steps.4.t": "Príďte na konferenciu",
    "steps.4.d": "Program a organizačné informácie nájdete v účte.",

    // Poplatky
    "fees.label": "Poplatky",
    "fees.title": "Vyberte si kategóriu účasti",
    "fees.lead": "Výšky poplatkov sa doplnia po schválení.",

    // Poplatky: popisky
    "fee.student": "študent",

    // Kategórie účastníkov
    "cat.speaker": "Registrovaný rečník",
    "cat.speaker.d": "Prednáška v odbornej sekcii.",
    "cat.poster": "Autor posteru",
    "cat.poster.d": "Prezentácia posteru v posterovej sekcii.",
    "cat.passive": "Pasívny účastník",
    "cat.passive.d": "Účasť bez vlastného príspevku.",

    // Program
    "program.label": "Program",
    "program.title": "Program konferencie",
    "program.lead": "Predbežný program. Podrobný rozpis sa zverejní neskôr.",

    // Body programu
    "prog.1": "Registrácia a otvorenie konferencie",
    "prog.2": "Plenárne prednášky pozvaných rečníkov",
    "prog.3": "Odborné sekcie",
    "prog.4": "Posterová sekcia",
    "prog.5": "Slávnostná večera a spoločenský program",

    // Rečníci
    "speakers.label": "Rečníci",
    "speakers.title": "Pozvaní prednášajúci",

    // Rečníci: ukážka
    "spk.name": "[Meno rečníka]",
    "spk.inst": "[Inštitúcia, krajina]",
    "spk.talk": "[Názov prednášky]",

    // Miesto a ubytovanie
    "venue.label": "Miesto a ubytovanie",
    "venue.title": "Miesto konania",
    "venue.text": "Ubytovanie si zabezpečujete individuálne priamo v hoteli. Odporúčaný hotel: [doplniť], kontakt a rezervačný kód: [doplniť].",
    "venue.btn": "Rezervovať v hoteli",

    // Registrácia
    "reg.title": "Registrácia na ANS 2027",
    "reg.lead": "Vyplnenie trvá asi 3 minúty. Po odoslaní vám pošleme platobné inštrukcie.",
    "reg.s.person": "Osobné údaje",
    "reg.s.work": "Pracovisko",
    "reg.s.category": "Kategória účasti",
    "reg.s.paper": "Váš príspevok",
    "reg.s.billing": "Fakturačné údaje a strava",
    "reg.paper.hint": "Typ príspevku sa nastaví podľa kategórie.",
    "reg.gdpr": "Oboznámil(a) som sa s informáciami o spracúvaní osobných údajov.",
    "reg.submit": "Dokončiť registráciu",
    "reg.have": "Už máte účet?",
    "reg.summary": "Súhrn",
    "reg.next": "Čo bude nasledovať",
    "reg.n1": "1. Potvrdzovací e-mail",
    "reg.n2": "2. Platobné inštrukcie a úhrada prevodom",
    "reg.n3": "3. Potvrdenie prijatej platby",
    "reg.student": "Som študent alebo doktorand (znížený poplatok)",

    // Polia formulárov
    "f.titlebefore": "Titul pred menom",
    "f.firstname": "Meno",
    "f.lastname": "Priezvisko",
    "f.titleafter": "Titul za menom",
    "f.email": "E-mail",
    "f.password": "Heslo (aspoň 8 znakov)",
    "f.org": "Organizácia alebo inštitúcia",
    "f.dept": "Pracovisko alebo oddelenie",
    "f.country": "Krajina",
    "f.papertitle": "Názov príspevku",
    "f.diet": "Stravovacie požiadavky (nepovinné)",
    "f.diet.hint": "Napríklad alergie a intolerancie na slávnostnej večeri.",
    "f.billing.name": "Názov platiteľa",
    "f.billing.street": "Ulica a číslo",
    "f.billing.city": "Mesto",
    "f.billing.zip": "PSČ",
    "f.billing.country": "Krajina platiteľa",
    "f.billing.ico": "IČO (nepovinné)",
    "f.billing.dic": "DIČ (nepovinné)",

    // Prihlásenie
    "login.title": "Prihlásenie",
    "login.lead": "Zadajte e-mail a heslo, ktoré ste použili pri registrácii.",
    "login.submit": "Prihlásiť sa",
    "login.error": "Nesprávny e-mail alebo heslo.",
    "login.no": "Ešte nemáte účet?",

    // Účet
    "acc.label": "Môj účet",
    "acc.hello": "Dobrý deň,",
    "acc.cat": "Kategória",

    // Účet: platba
    "pay.title": "Platba",
    "pay.amount": "Suma",
    "pay.iban": "IBAN",
    "pay.vs": "Variabilný symbol",
    "pay.due": "Splatnosť",
    "pay.note": "Platobné inštrukcie dostanete aj e-mailom. Platbu potvrdzuje organizátor ručne.",
    "pay.status.awaiting_payment": "Čaká na úhradu",
    "pay.status.partially_paid": "Čiastočne zaplatené",
    "pay.status.paid": "Zaplatené",
    "pay.status.overdue": "Po splatnosti",
    "pay.status.cancelled": "Stornované",
    "pay.status.refunded": "Vrátené",

    // Účet: príspevok
    "paper.title": "Môj príspevok",
    "paper.none": "Pasívni účastníci príspevok nepodávajú.",
    "paper.status.draft": "Rozpracovaný",
    "paper.status.submitted": "Odoslaný",
    "paper.file": "Súbor",
    "paper.go": "Dokončiť príspevok",
    "paper.status.admin_check": "Administratívna kontrola",
    "paper.status.in_review": "V recenznom konaní",
    "paper.status.committee_decision": "Rozhoduje programový výbor",
    "paper.status.revision_requested": "Vyžiadané úpravy",
    "paper.status.conditionally_accepted": "Podmienečne prijatý",
    "paper.status.accepted": "Prijatý",
    "paper.status.rejected": "Zamietnutý",
    "paper.newversion": "Nahrať novú verziu",

    // Prihlásenie príspevku
    "pp.title": "Prihlásiť príspevok",
    "pp.lead": "Uzávierka príspevkov: [doplniť]. Príspevok môžete neskôr upraviť.",
    "pp.type": "Typ príspevku",
    "pp.type.poster": "Poster",
    "pp.topic": "Tematická oblasť (symposium)",
    "pp.topic.ph": "Vyberte oblasť",
    "pp.abstract": "Abstrakt",
    "pp.keywords": "Kľúčové slová (oddeľte čiarkou)",
    "pp.file": "Súbor (PDF alebo DOCX)",
    "pp.file.hint": "Šablónu a pokyny nájdete na webe konferencie.",
    "pp.submit": "Odoslať príspevok",
    "pp.back": "Späť do účtu",
    "pp.type.talk": "Prednáška",
    "pp.existing": "Príspevok je už odoslaný. Môžete nahrať novú verziu súboru.",

    // Admin panel
    "adm.label": "Administrácia",
    "adm.title": "Admin panel",
    "adm.stat.reg": "Registrácie",
    "adm.stat.paid": "Zaplatené",
    "adm.stat.waiting": "Čaká na úhradu",
    "adm.stat.papers": "Príspevky",
    "adm.people.title": "Účastníci a platby",
    "adm.filter": "Stav platby",
    "adm.filter.all": "Všetky",
    "adm.export": "Export do CSV",
    "adm.col.name": "Meno",
    "adm.col.org": "Organizácia",
    "adm.col.category": "Kategória",
    "adm.col.amount": "Suma",
    "adm.col.symbol": "Var. symbol",
    "adm.col.status": "Stav",
    "adm.col.action": "Akcia",
    "adm.col.title": "Názov",
    "adm.col.author": "Autor",
    "adm.col.type": "Typ",
    "adm.col.change": "Zmeniť stav",
    "adm.confirm.pay": "Potvrdiť platbu",
    "adm.confirm.ask": "Naozaj potvrdiť prijatie platby?",
    "adm.papers.title": "Príspevky",
    "adm.none": "Zatiaľ tu nič nie je.",
    "adm.sym.title": "Tematické oblasti (symposiá)",
    "adm.sym.sk": "Názov po slovensky",
    "adm.sym.en": "Názov po anglicky",
    "adm.sym.add": "Pridať oblasť",
    "adm.saved": "Uložené.",

    // Super admin
    "sup.label": "Super administrácia",
    "sup.title": "Super admin",
    "sup.admins.title": "Administrátori",
    "sup.active": "Aktívny",
    "sup.inactive": "Neaktívny",
    "sup.deactivate": "Deaktivovať",
    "sup.activate": "Aktivovať",
    "sup.create": "Vytvoriť administrátora",
    "sup.conf.title": "Nastavenia konferencie",
    "sup.conf.name": "Názov",
    "sup.conf.location": "Miesto",
    "sup.conf.start": "Začiatok",
    "sup.conf.end": "Koniec",
    "sup.conf.iban": "IBAN pre platby",
    "sup.conf.accom": "Informácie o ubytovaní",
    "sup.conf.published": "Program je zverejnený",
    "sup.save": "Uložiť",
    "sup.cat.title": "Kategórie a poplatky",
    "sup.cat.fee": "Poplatok (€)",
    "sup.cat.student": "Študentský poplatok (€)",
  },

  en: {
    // Spoločné
    "tba": "[to be announced]",

    // Menu
    "nav.program": "Programme",
    "nav.speakers": "Speakers",
    "nav.fees": "Fees",
    "nav.venue": "Venue & accommodation",
    "nav.admin": "Admin",
    "nav.superadmin": "Super admin",

    // Tlačidlá
    "btn.login": "Log in",
    "btn.account": "My account",
    "btn.logout": "Log out",
    "btn.register": "Register",
    "btn.submit": "Submit a paper",

    // Pätička
    "footer.org": "Faculty of Natural Sciences, UCM in Trnava and Faculty of Natural Sciences, UMB in Banská Bystrica",
    "footer.contact": "Contact: [e-mail to be announced]",

    // Názvy stránok
    "title.index": "ANS 2027 – Applied Natural Sciences",
    "title.register": "Registration – ANS 2027",
    "title.login": "Log in – ANS 2027",
    "title.account": "My account – ANS 2027",
    "title.paper": "Paper – ANS 2027",
    "title.admin": "Admin – ANS 2027",
    "title.superadmin": "Super admin – ANS 2027",

    // Chyby
    "err.network": "The server is not responding. Check that the PHP backend is running.",

    // Úvod: hlavná časť
    "hero.eyebrow": "International Scientific Conference",
    "hero.lead": "An international scientific conference on natural sciences. Registration, papers and payment in one place.",
    "hero.lang": "Language: English",

    // Termíny
    "dates.title": "Important dates",
    "dates.abstract": "Abstract deadline",
    "dates.accept": "Notification of acceptance",
    "dates.payment": "Registration and payment deadline",
    "dates.conf": "Conference",

    // Úvod: rýchle odkazy
    "quick.new.label": "New participant",
    "quick.new.title": "Registration",
    "quick.new.text": "Fill in the form and choose your participation category.",
    "quick.paper.label": "Authors",
    "quick.paper.title": "Submit a paper",
    "quick.paper.text": "Abstract, article or poster following the template.",
    "quick.acc.label": "Already registered",
    "quick.acc.title": "My account",
    "quick.acc.text": "Status of your payment, paper and reviews.",

    // Úvod: kroky
    "steps.label": "How it works",
    "steps.title": "Four simple steps",
    "steps.1.t": "Register",
    "steps.1.d": "Choose your category and fill in your details.",
    "steps.2.t": "Pay the fee",
    "steps.2.d": "You will receive an e-mail with payment details. Payment is by bank transfer.",
    "steps.3.t": "Submit your paper",
    "steps.3.d": "Upload your abstract or poster and follow the review.",
    "steps.4.t": "Join the conference",
    "steps.4.d": "Find the programme and practical information in your account.",

    // Poplatky
    "fees.label": "Fees",
    "fees.title": "Choose your participation category",
    "fees.lead": "Fee amounts will be added after approval.",

    // Poplatky: popisky
    "fee.student": "student",

    // Kategórie účastníkov
    "cat.speaker": "Registered speaker",
    "cat.speaker.d": "A lecture in a scientific session.",
    "cat.poster": "Poster author",
    "cat.poster.d": "Poster presentation in the poster session.",
    "cat.passive": "Passive participant",
    "cat.passive.d": "Attendance without your own paper.",

    // Program
    "program.label": "Programme",
    "program.title": "Conference programme",
    "program.lead": "Preliminary programme. A detailed schedule will be published later.",

    // Body programu
    "prog.1": "Registration and opening",
    "prog.2": "Plenary lectures by invited speakers",
    "prog.3": "Scientific sessions",
    "prog.4": "Poster session",
    "prog.5": "Gala dinner and social programme",

    // Rečníci
    "speakers.label": "Speakers",
    "speakers.title": "Invited speakers",

    // Rečníci: ukážka
    "spk.name": "[Speaker name]",
    "spk.inst": "[Institution, country]",
    "spk.talk": "[Title of the talk]",

    // Miesto a ubytovanie
    "venue.label": "Venue and accommodation",
    "venue.title": "Venue",
    "venue.text": "You arrange your accommodation directly with the hotel. Recommended hotel: [to be announced], contact and booking code: [to be announced].",
    "venue.btn": "Book at the hotel",

    // Registrácia
    "reg.title": "Registration for ANS 2027",
    "reg.lead": "It takes about 3 minutes. After submitting, we will send you the payment instructions.",
    "reg.s.person": "Personal details",
    "reg.s.work": "Affiliation",
    "reg.s.category": "Participation category",
    "reg.s.paper": "Your paper",
    "reg.s.billing": "Billing details and meals",
    "reg.paper.hint": "The paper type follows your category.",
    "reg.gdpr": "I have read the information on personal data processing.",
    "reg.submit": "Complete registration",
    "reg.have": "Already have an account?",
    "reg.summary": "Summary",
    "reg.next": "What happens next",
    "reg.n1": "1. Confirmation e-mail",
    "reg.n2": "2. Payment instructions and bank transfer",
    "reg.n3": "3. Confirmation of received payment",
    "reg.student": "I am a student or PhD student (reduced fee)",

    // Polia formulárov
    "f.titlebefore": "Title before name",
    "f.firstname": "First name",
    "f.lastname": "Last name",
    "f.titleafter": "Title after name",
    "f.email": "E-mail",
    "f.password": "Password (at least 8 characters)",
    "f.org": "Organisation or institution",
    "f.dept": "Department",
    "f.country": "Country",
    "f.papertitle": "Paper title",
    "f.diet": "Dietary requirements (optional)",
    "f.diet.hint": "For example allergies or intolerances at the gala dinner.",
    "f.billing.name": "Payer name",
    "f.billing.street": "Street and number",
    "f.billing.city": "City",
    "f.billing.zip": "Postal code",
    "f.billing.country": "Payer country",
    "f.billing.ico": "Company ID (optional)",
    "f.billing.dic": "Tax ID (optional)",

    // Prihlásenie
    "login.title": "Log in",
    "login.lead": "Enter the e-mail and password you used when registering.",
    "login.submit": "Log in",
    "login.error": "Incorrect e-mail or password.",
    "login.no": "Don't have an account yet?",

    // Účet
    "acc.label": "My account",
    "acc.hello": "Hello,",
    "acc.cat": "Category",

    // Účet: platba
    "pay.title": "Payment",
    "pay.amount": "Amount",
    "pay.iban": "IBAN",
    "pay.vs": "Variable symbol",
    "pay.due": "Due date",
    "pay.note": "You will also get the payment instructions by e-mail. The organiser confirms payments manually.",
    "pay.status.awaiting_payment": "Awaiting payment",
    "pay.status.partially_paid": "Partially paid",
    "pay.status.paid": "Paid",
    "pay.status.overdue": "Overdue",
    "pay.status.cancelled": "Cancelled",
    "pay.status.refunded": "Refunded",

    // Účet: príspevok
    "paper.title": "My paper",
    "paper.none": "Passive participants do not submit a paper.",
    "paper.status.draft": "Draft",
    "paper.status.submitted": "Submitted",
    "paper.file": "File",
    "paper.go": "Complete your paper",
    "paper.status.admin_check": "Administrative check",
    "paper.status.in_review": "Under review",
    "paper.status.committee_decision": "Committee decision",
    "paper.status.revision_requested": "Revision requested",
    "paper.status.conditionally_accepted": "Conditionally accepted",
    "paper.status.accepted": "Accepted",
    "paper.status.rejected": "Rejected",
    "paper.newversion": "Upload a new version",

    // Prihlásenie príspevku
    "pp.title": "Submit a paper",
    "pp.lead": "Paper deadline: [to be announced]. You can edit your paper later.",
    "pp.type": "Paper type",
    "pp.type.poster": "Poster",
    "pp.topic": "Topic (symposium)",
    "pp.topic.ph": "Choose a topic",
    "pp.abstract": "Abstract",
    "pp.keywords": "Keywords (comma-separated)",
    "pp.file": "File (PDF or DOCX)",
    "pp.file.hint": "Template and guidelines are available on the conference website.",
    "pp.submit": "Submit paper",
    "pp.back": "Back to my account",
    "pp.type.talk": "Lecture",
    "pp.existing": "Your paper has already been submitted. You can upload a new version of the file.",

    // Admin panel
    "adm.label": "Administration",
    "adm.title": "Admin panel",
    "adm.stat.reg": "Registrations",
    "adm.stat.paid": "Paid",
    "adm.stat.waiting": "Awaiting payment",
    "adm.stat.papers": "Papers",
    "adm.people.title": "Participants and payments",
    "adm.filter": "Payment status",
    "adm.filter.all": "All",
    "adm.export": "Export to CSV",
    "adm.col.name": "Name",
    "adm.col.org": "Organisation",
    "adm.col.category": "Category",
    "adm.col.amount": "Amount",
    "adm.col.symbol": "Var. symbol",
    "adm.col.status": "Status",
    "adm.col.action": "Action",
    "adm.col.title": "Title",
    "adm.col.author": "Author",
    "adm.col.type": "Type",
    "adm.col.change": "Change status",
    "adm.confirm.pay": "Confirm payment",
    "adm.confirm.ask": "Really confirm that the payment was received?",
    "adm.papers.title": "Papers",
    "adm.none": "Nothing here yet.",
    "adm.sym.title": "Topics (symposia)",
    "adm.sym.sk": "Name in Slovak",
    "adm.sym.en": "Name in English",
    "adm.sym.add": "Add topic",
    "adm.saved": "Saved.",

    // Super admin
    "sup.label": "Super administration",
    "sup.title": "Super admin",
    "sup.admins.title": "Administrators",
    "sup.active": "Active",
    "sup.inactive": "Inactive",
    "sup.deactivate": "Deactivate",
    "sup.activate": "Activate",
    "sup.create": "Create administrator",
    "sup.conf.title": "Conference settings",
    "sup.conf.name": "Name",
    "sup.conf.location": "Location",
    "sup.conf.start": "Start date",
    "sup.conf.end": "End date",
    "sup.conf.iban": "IBAN for payments",
    "sup.conf.accom": "Accommodation information",
    "sup.conf.published": "Programme is published",
    "sup.save": "Save",
    "sup.cat.title": "Categories and fees",
    "sup.cat.fee": "Fee (€)",
    "sup.cat.student": "Student fee (€)",
  },

};
