/* ==========================================================================
   Demo režim: náhrada api/index.php priamo v prehliadači (bez PHP a databázy).
   Dáta sú v js/demo-data.js a zmeny sa ukladajú do localStorage.
   Pravidlá a oprávnenia zrkadlia skutočné API, takže stránky sa správajú rovnako.
   ========================================================================== */

(() => {
  const DB_KEY = "ans-demo-db";
  const USER_KEY = "ans-demo-user";
  const STAFF = ["superadmin", "organizer", "program_committee", "finance"];
  const PUBLIC_TABLES = ["participant_categories", "conferences", "symposia", "deadlines", "program_items"];
  const STATUSES = ["submitted", "admin_check", "in_review", "revision_requested", "accepted", "rejected", "withdrawn", "final_uploaded"];
  const CONFERENCE_ID = 1;

  /* Pomocné funkcie
     ------------------------------------------------------------------------ */
  let store = null;

  const db = () => {
    if (!store) {
      try { store = JSON.parse(localStorage.getItem(DB_KEY)); } catch { store = null; }
      store ||= structuredClone(DEMO_SEED);
    }
    return store;
  };
  const save = () => {
    try { localStorage.setItem(DB_KEY, JSON.stringify(store)); } catch { /* demo funguje aj bez ukladania */ }
  };
  const table = (name) => (db()[name] ||= []);
  const copy = (value) => structuredClone(value);

  const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
  const pad = (number) => String(number).padStart(2, "0");
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const now = () => { const d = new Date(); return `${today()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };

  const insert = (name, row) => {
    const rows = table(name);
    const record = { id: Math.max(0, ...rows.map((item) => item.id || 0)) + 1, ...row };
    rows.push(record);
    return record;
  };
  const find = (name, id) => table(name).find((item) => item.id === Number(id));
  const text = (data, key) => String(data[key] ?? "").trim();
  const required = (data, key) => text(data, key) || fail(422, "Chýba pole: " + key);
  const optional = (data, key) => text(data, key) || null;

  const rolesOf = (userId) => table("user_roles")
    .filter((item) => item.user_id === userId)
    .map((item) => find("roles", item.role_id)?.code)
    .filter(Boolean);

  const publicUser = (user) => {
    const { password_hash, demo_password, ...rest } = user;
    return { ...copy(rest), roles: rolesOf(user.id) };
  };

  const session = () => {
    const id = Number(localStorage.getItem(USER_KEY)) || 0;
    const user = id ? find("users", id) : null;
    if (!user || !user.is_active) return { id: 0, roles: [] };
    return { id, roles: rolesOf(id) };
  };
  const hasAny = (codes) => session().roles.some((code) => codes.includes(code));
  const roles = () => session().roles;
  const isStaff = () => hasAny(STAFF);
  const requireRoles = (codes) => {
    if (!session().id) fail(401, "Neprihlásený");
    if (!hasAny(codes)) fail(403, "Nedostatočné oprávnenie");
  };
  const audit = (action, entity, entityId, oldValue = null, newValue = null) =>
    insert("audit_log", { user_id: session().id || null, action, entity_type: entity, entity_id: entityId, old_value: oldValue && JSON.stringify(oldValue), new_value: newValue && JSON.stringify(newValue), ip_address: "demo", created_at: now() });

  /* Čítanie tabuliek (účastník vidí len svoje riadky)
     ------------------------------------------------------------------------ */
  function readRows(name) {
    if (!(name in db())) fail(404, "Neznáma tabuľka");
    if (name === "user_roles" && !isStaff()) fail(403, "Nedostatočné oprávnenie");
    let rows = table(name);

    if (!isStaff() && !PUBLIC_TABLES.includes(name)) {
      const me = session().id;
      if (!me) fail(401, "Neprihlásený");
      const myRegistrations = table("registrations").filter((item) => item.user_id === me).map((item) => item.id);
      const mySubmissions = table("submissions").filter((item) => myRegistrations.includes(item.registration_id)).map((item) => item.id);
      const myAssignments = table("review_assignments").filter((item) => mySubmissions.includes(item.submission_id)).map((item) => item.id);

      const isReviewer = roles().includes("reviewer");
      const myAssigned = table("review_assignments").filter((item) => item.reviewer_id === me && item.status !== "cancelled");
      const assignedSubmissions = myAssigned.map((item) => item.submission_id);
      const filters = {
        review_assignments: (row) => isReviewer && row.reviewer_id === me && row.status !== "cancelled",
        users: (row) => row.id === me,
        registrations: (row) => row.user_id === me,
        notifications: (row) => row.user_id === me,
        payments: (row) => myRegistrations.includes(row.registration_id),
        invoices: (row) => myRegistrations.includes(row.registration_id),
        submissions: (row) => myRegistrations.includes(row.registration_id) || (isReviewer && assignedSubmissions.includes(row.id)),
        submission_versions: (row) => mySubmissions.includes(row.submission_id) || (isReviewer && assignedSubmissions.includes(row.submission_id)),
        submission_status_history: (row) => mySubmissions.includes(row.submission_id),
        submission_authors: (row) => mySubmissions.includes(row.submission_id),
        reviews: (row) => myAssignments.includes(row.assignment_id) || (isReviewer && myAssigned.some((item) => item.id === row.assignment_id)),
      };
      if (!filters[name]) fail(403, "Nedostatočné oprávnenie");
      rows = rows.filter(filters[name]);
      if (name === "reviews" && !isReviewer) {
        rows = rows.map(({ id, assignment_id, version_id, recommendation, comment_for_author, submitted_at }) =>
          ({ id, assignment_id, version_id, recommendation, comment_for_author, submitted_at }));
      }
    }
    return copy(rows).map((row) => {
      delete row.password_hash; delete row.demo_password; delete row.file_path;
      return row;
    });
  }

  /* Platby
     ------------------------------------------------------------------------ */
  function refreshPaymentStatus(registrationId) {
    const registration = find("registrations", registrationId);
    const received = table("payments")
      .filter((item) => item.registration_id === registrationId)
      .reduce((sum, item) => sum + (item.type === "refund" ? -item.amount : item.amount), 0);

    if (!["cancelled", "refunded"].includes(registration.payment_status)) {
      if (received >= registration.amount_due) registration.payment_status = "paid";
      else if (received > 0) registration.payment_status = "partially_paid";
      else if (registration.due_date && registration.due_date < today()) registration.payment_status = "overdue";
      else registration.payment_status = "awaiting_payment";
    }
    return copy(registration);
  }

  const priceFor = (registration, category) =>
    registration.is_student && category.student_fee != null ? category.student_fee : category.fee;

  /* GET akcie
     ------------------------------------------------------------------------ */
  function get(action, params) {
    switch (action) {
      case "list": return { data: readRows(params.table) };
      case "detail": {
        const row = readRows(params.table).find((item) => item.id === Number(params.id));
        return row ? { data: row } : fail(404, "Záznam neexistuje");
      }
      case "auth.me": {
        const { id } = session();
        return id ? { data: publicUser(find("users", id)) } : fail(401, "Neprihlásený");
      }
      case "csrf": return { token: "demo" };
      case "tables": requireRoles(STAFF); return { tables: Object.keys(db()) };
      default: return fail(404, "Neznáma GET akcia");
    }
  }

  /* POST akcie
     ------------------------------------------------------------------------ */
  function post(action, p) {
    const me = session().id;

    switch (action) {
      case "user.create": {
        const email = required(p, "email");
        if (!/^\S+@\S+\.\S+$/.test(email)) fail(422, "Neplatný e-mail");
        const password = required(p, "password");
        if (password.length < 8) fail(422, "Heslo musí mať aspoň 8 znakov");
        if (table("users").some((user) => user.email.toLowerCase() === email.toLowerCase())) fail(409, "E-mail už existuje");
        const user = insert("users", {
          email, demo_password: password, title_before: optional(p, "title_before"), first_name: required(p, "first_name"),
          last_name: required(p, "last_name"), title_after: optional(p, "title_after"), organization: optional(p, "organization"),
          organization_address: optional(p, "organization_address"), department: optional(p, "department"), country: optional(p, "country"),
          preferred_language: p.preferred_language === "en" ? "en" : "sk", is_active: true, last_login_at: null, created_at: now(),
        });
        save();
        return { data: publicUser(user) };
      }

      case "auth.login": {
        const user = table("users").find((item) => item.email.toLowerCase() === required(p, "email").toLowerCase());
        const password = user?.demo_password ?? "heslo";
        if (!user || String(p.password ?? "") !== password) fail(401, "Nesprávny e-mail alebo heslo");
        if (!user.is_active) fail(403, "Účet je deaktivovaný");
        localStorage.setItem(USER_KEY, String(user.id));
        user.last_login_at = now();
        save();
        return { data: publicUser(user) };
      }

      case "auth.logout":
        localStorage.removeItem(USER_KEY);
        return { message: "Odhlásený" };

      case "registration.create": {
        const userId = Number(p.user_id);
        if (!isStaff() && userId !== me) fail(me ? 403 : 401, "Nedostatočné oprávnenie");
        if (!find("users", userId)) fail(404, "Používateľ neexistuje");
        const category = find("participant_categories", p.category_id) || fail(422, "Neplatná kategória účastníka");
        const conference = find("conferences", CONFERENCE_ID);
        if (table("registrations").some((item) => item.user_id === userId)) fail(409, "Používateľ už je registrovaný");
        if (!p.gdpr_consent) fail(422, "Je potrebný súhlas so spracovaním osobných údajov");

        const isStudent = Boolean(p.is_student);
        const isExempt = isStaff() && Boolean(p.fee_exempt);
        const amount = isExempt ? 0 : priceFor({ is_student: isStudent }, category);
        const deadline = table("deadlines").find((item) => item.step === "payment");
        const registration = insert("registrations", {
          user_id: userId, conference_id: CONFERENCE_ID, category_id: category.id, is_student: isStudent,
          dietary_requirements: optional(p, "dietary_requirements"), gdpr_consent_at: now(),
          billing_name: optional(p, "billing_name"), billing_street: optional(p, "billing_street"), billing_city: optional(p, "billing_city"),
          billing_zip: optional(p, "billing_zip"), billing_country: optional(p, "billing_country"), billing_ico: optional(p, "billing_ico"),
          billing_dic: optional(p, "billing_dic"), billing_ic_dph: optional(p, "billing_ic_dph"),
          fee_exempt: isExempt, exempt_reason: isExempt ? optional(p, "exempt_reason") : null, amount_due: amount,
          variable_symbol: "", due_date: deadline ? deadline.deadline_at.slice(0, 10) : null,
          payment_status: amount === 0 ? "paid" : "awaiting_payment", created_at: now(),
        });
        registration.variable_symbol = conference.year + String(registration.id).padStart(4, "0");
        save();
        return { data: copy(registration) };
      }

      case "user.update": {
        if (!me) fail(401, "Neprihlásený");
        const user = find("users", me);
        const email = text(p, "email") || user.email;
        if (!/^\S+@\S+\.\S+$/.test(email)) fail(422, "Neplatný e-mail");
        if (table("users").some((other) => other.id !== me && other.email.toLowerCase() === email.toLowerCase())) fail(409, "E-mail už používa iný účet");
        Object.assign(user, {
          email, title_before: optional(p, "title_before"), first_name: required(p, "first_name"), last_name: required(p, "last_name"),
          title_after: optional(p, "title_after"), organization: optional(p, "organization"),
          organization_address: optional(p, "organization_address"), department: optional(p, "department"),
          country: optional(p, "country"), preferred_language: p.preferred_language === "en" ? "en" : "sk",
        });
        save();
        return { data: publicUser(user) };
      }

      case "password.change": {
        if (!me) fail(401, "Neprihlásený");
        const user = find("users", me);
        if (String(p.current_password ?? "") !== (user.demo_password ?? "heslo")) fail(422, "Aktuálne heslo nie je správne");
        const newPassword = required(p, "new_password");
        if (newPassword.length < 8) fail(422, "Heslo musí mať aspoň 8 znakov");
        user.demo_password = newPassword;
        audit("password.change", "user", me);
        save();
        return { message: "Heslo bolo zmenené" };
      }

      case "registration.update": {
        const registration = find("registrations", p.registration_id) || fail(404, "Registrácia neexistuje");
        if (!isStaff() && registration.user_id !== me) fail(me ? 403 : 401, "Nedostatočné oprávnenie");
        ["billing_name", "billing_street", "billing_city", "billing_zip", "billing_country", "billing_ico", "billing_dic", "billing_ic_dph", "dietary_requirements"]
          .forEach((key) => { registration[key] = optional(p, key); });
        save();
        return { data: copy(registration) };
      }

      case "payment.create": {
        requireRoles(["superadmin", "organizer", "finance"]);
        const registration = find("registrations", p.registration_id) || fail(404, "Registrácia neexistuje");
        const type = p.type || "payment";
        if (!["payment", "refund"].includes(type)) fail(422, "Neplatný typ platby");
        const amount = Number(p.amount);
        if (!(amount > 0)) fail(422, "Suma musí byť kladná");
        const payment = insert("payments", { registration_id: registration.id, type, amount, received_at: today(), confirmed_by: me, confirmed_at: now(), note: optional(p, "note") });
        const updated = refreshPaymentStatus(registration.id);
        audit("payment." + type, "registration", registration.id, null, { payment_status: updated.payment_status, amount });
        save();
        return { data: copy(payment), registration: updated };
      }

      case "submission.create": {
        const registration = find("registrations", p.registration_id) || fail(404, "Registrácia neexistuje");
        if (!isStaff() && registration.user_id !== me) fail(me ? 403 : 401, "Nedostatočné oprávnenie");
        const category = find("participant_categories", registration.category_id);
        if (!category.submission_type) fail(422, "Táto kategória príspevok nepodáva");
        const type = p.type || category.submission_type;
        if (type !== category.submission_type) fail(422, "Typ príspevku nezodpovedá kategórii");
        const symposium = find("symposia", p.symposium_id) || fail(422, "Vyberte tematickú oblasť (symposium)");
        const title = required(p, "title");
        const abstract = required(p, "abstract");
        const author = find("users", registration.user_id);

        const submission = insert("submissions", {
          conference_id: CONFERENCE_ID, registration_id: registration.id, symposium_id: symposium.id, type, title, abstract,
          keywords: optional(p, "keywords"), status: "submitted", created_at: now(),
        });
        insert("submission_status_history", { submission_id: submission.id, from_status: null, to_status: "submitted", changed_by: me, changed_at: now(), comment: null });
        insert("submission_authors", {
          submission_id: submission.id, user_id: author.id, first_name: author.first_name, last_name: author.last_name,
          email: author.email, organization: author.organization, author_order: 1, is_presenter: true,
        });
        save();
        return { data: copy(submission) };
      }

      case "submission.status": {
        requireRoles(["superadmin", "organizer", "program_committee"]);
        const submission = find("submissions", p.submission_id) || fail(404, "Príspevok neexistuje");
        const to = required(p, "to_status");
        if (!STATUSES.includes(to)) fail(422, "Neplatný stav");
        insert("submission_status_history", { submission_id: submission.id, from_status: submission.status, to_status: to, changed_by: me, changed_at: now(), comment: optional(p, "comment") });
        audit("submission.status", "submission", submission.id, { status: submission.status }, { status: to });
        submission.status = to;
        save();
        return { data: copy(submission) };
      }

      case "submission.version": {
        const submission = find("submissions", p.submission_id) || fail(404, "Príspevok neexistuje");
        const owner = find("registrations", submission.registration_id);
        if (!isStaff() && owner.user_id !== me) fail(me ? 403 : 401, "Nedostatočné oprávnenie");
        const file = p.file;
        if (!file || !file.name) fail(422, "Vyberte súbor na nahratie.");
        if (!/\.(pdf|docx)$/i.test(file.name)) fail(422, "Povolené sú len súbory PDF a DOCX.");
        if (file.size > 20 * 1024 * 1024) fail(422, "Súbor musí mať veľkosť najviac 20 MB.");
        const next = Math.max(0, ...table("submission_versions").filter((item) => item.submission_id === submission.id).map((item) => item.version_number)) + 1;
        const version = insert("submission_versions", {
          submission_id: submission.id, version_number: next, original_filename: file.name,
          mime_type: file.type || "application/pdf", file_size: file.size, uploaded_by: me, uploaded_at: now(),
        });
        save();
        return { data: copy(version) };
      }

      case "review.assign": {
        requireRoles(["superadmin", "organizer", "program_committee"]);
        const submission = find("submissions", p.submission_id) || fail(404, "Príspevok neexistuje");
        const reviewerId = Number(p.reviewer_id);
        if (!rolesOf(reviewerId).includes("reviewer")) fail(422, "Vybraný používateľ nie je recenzent");
        const assignment = insert("review_assignments", { submission_id: submission.id, reviewer_id: reviewerId, assigned_by: me, assigned_at: now(), due_date: optional(p, "due_date"), status: "assigned" });
        if (["submitted", "admin_check"].includes(submission.status)) {
          insert("submission_status_history", { submission_id: submission.id, from_status: submission.status, to_status: "in_review", changed_by: me, changed_at: now(), comment: "Pridelený recenzent" });
          submission.status = "in_review";
        }
        audit("review.assign", "submission", submission.id, null, { reviewer_id: reviewerId });
        save();
        return { data: copy(assignment) };
      }

      case "review.submit": {
        requireRoles(["reviewer"]);
        const assignment = table("review_assignments").find((item) => item.id === Number(p.assignment_id) && item.reviewer_id === me) || fail(404, "Toto pridelenie neexistuje");
        if (assignment.status === "cancelled") fail(422, "Pridelenie bolo zrušené");
        const submission = find("submissions", assignment.submission_id);
        if (submission.status !== "in_review") fail(422, "Príspevok už nie je v recenznom konaní, posudok nemožno meniť");
        const score = Number(p.score);
        if (!(score >= 1 && score <= 10)) fail(422, "Hodnotenie musí byť od 1 do 10");
        if (!["accept", "accept_after_revision", "reject"].includes(p.recommendation)) fail(422, "Vyberte odporúčanie");
        const version = table("submission_versions").filter((item) => item.submission_id === submission.id).sort((a, b) => b.version_number - a.version_number)[0]
          || fail(422, "Príspevok nemá nahratý súbor");

        let review = table("reviews").find((item) => item.assignment_id === assignment.id);
        const fields = { version_id: version.id, score, recommendation: p.recommendation, comment_for_author: optional(p, "comment_for_author"), comment_for_committee: optional(p, "comment_for_committee"), submitted_at: now() };
        if (review) Object.assign(review, fields);
        else review = insert("reviews", { assignment_id: assignment.id, ...fields });
        assignment.status = "completed";

        if (!table("review_assignments").some((item) => item.submission_id === submission.id && item.status === "assigned")) {
          insert("submission_status_history", { submission_id: submission.id, from_status: "in_review", to_status: "committee_decision", changed_by: me, changed_at: now(), comment: "Všetky posudky boli odovzdané" });
          submission.status = "committee_decision";
        }
        audit("review.submit", "review", review.id, null, { submission_id: submission.id, recommendation: p.recommendation });
        save();
        return { data: copy(review) };
      }

      case "program.create": {
        requireRoles(["superadmin", "organizer", "program_committee"]);
        const symposiumId = Number(p.symposium_id) || null;
        if (symposiumId && !find("symposia", symposiumId)) fail(422, "Neplatná tematická oblasť");
        const fix = (value) => (optional(p, value) ? String(p[value]).replace("T", " ") : null);
        const item = insert("program_items", { conference_id: CONFERENCE_ID, symposium_id: symposiumId, submission_id: null, title: required(p, "title"), room: optional(p, "room"), start_at: fix("start_at"), end_at: fix("end_at") });
        audit("program.create", "program_item", item.id, null, { title: item.title });
        save();
        return { data: copy(item) };
      }

      case "program.delete": {
        requireRoles(["superadmin", "organizer", "program_committee"]);
        const item = find("program_items", p.id) || fail(404, "Bod programu neexistuje");
        store.program_items = table("program_items").filter((row) => row !== item);
        audit("program.delete", "program_item", item.id, { title: item.title });
        save();
        return { message: "Zmazané" };
      }

      case "email.send": {
        requireRoles(["superadmin", "organizer"]);
        const subject = required(p, "subject");
        required(p, "message");
        const status = text(p, "payment_status");
        const recipients = table("registrations")
          .filter((registration) => !status || registration.payment_status === status)
          .map((registration) => find("users", registration.user_id));
        if (!recipients.length) fail(422, "Pre zvolený výber nie sú žiadni príjemcovia");
        recipients.forEach((user) => insert("email_log", { recipient_user_id: user.id, recipient_email: user.email, subject, type: "bulk", sent_by: me, sent_at: now() }));
        audit("email.send", "email", null, null, { subject, recipients: recipients.length });
        save();
        return { recipients: recipients.length, accepted: recipients.length };
      }

      case "registration.exempt": {
        requireRoles(["superadmin", "organizer"]);
        const registration = find("registrations", p.registration_id) || fail(404, "Registrácia neexistuje");
        const exempt = Boolean(p.exempt);
        const category = find("participant_categories", registration.category_id);
        registration.fee_exempt = exempt;
        registration.exempt_reason = exempt ? optional(p, "reason") : null;
        registration.amount_due = exempt ? 0 : priceFor(registration, category);
        audit("registration.exempt", "registration", registration.id, null, { fee_exempt: exempt });
        const updated = refreshPaymentStatus(registration.id);
        save();
        return { data: updated };
      }

      case "symposium.create": {
        requireRoles(["superadmin", "organizer"]);
        const order = Math.max(0, ...table("symposia").map((item) => item.sort_order)) + 1;
        const symposium = insert("symposia", { conference_id: CONFERENCE_ID, name_sk: required(p, "name_sk"), name_en: required(p, "name_en"), sort_order: order });
        audit("symposium.create", "symposium", symposium.id, null, { name_sk: symposium.name_sk });
        save();
        return { data: copy(symposium) };
      }

      case "admin.create": {
        requireRoles(["superadmin"]);
        const email = required(p, "email");
        if (!/^\S+@\S+\.\S+$/.test(email)) fail(422, "Neplatný e-mail");
        if (table("users").some((user) => user.email.toLowerCase() === email.toLowerCase())) fail(409, "E-mail už existuje");
        const password = required(p, "password");
        if (password.length < 8) fail(422, "Heslo musí mať aspoň 8 znakov");
        const roleCode = p.role || "organizer";
        if (roleCode === "superadmin") fail(422, "Rolu superadministrátora nemožno prideliť v rozhraní.");
        const role = table("roles").find((item) => item.code === roleCode) || fail(422, "Neznáma rola");
        const user = insert("users", { email, demo_password: password, first_name: required(p, "first_name"), last_name: required(p, "last_name"), preferred_language: "sk", is_active: true, last_login_at: null, created_at: now() });
        insert("user_roles", { user_id: user.id, role_id: role.id, conference_id: CONFERENCE_ID });
        audit("admin.create", "user", user.id, null, { email, role: roleCode });
        save();
        return { data: publicUser(user) };
      }

      case "role.add": {
        requireRoles(["superadmin"]);
        const role = table("roles").find((item) => item.code === required(p, "role")) || fail(422, "Neznáma rola");
        if (role.code === "superadmin") fail(422, "Rolu superadministrátora nemožno prideliť v rozhraní.");
        const target = p.user_id
          ? find("users", p.user_id)
          : table("users").find((item) => item.email.toLowerCase() === required(p, "email").toLowerCase());
        if (!target) fail(404, "Používateľ s týmto e-mailom neexistuje");
        if (table("user_roles").some((item) => item.user_id === target.id && item.role_id === role.id)) fail(409, "Používateľ túto rolu už má");
        table("user_roles").push({ user_id: target.id, role_id: role.id, conference_id: CONFERENCE_ID });
        audit("role.add", "user", target.id, null, { role: role.code });
        save();
        return { data: publicUser(target) };
      }

      case "role.remove": {
        requireRoles(["superadmin"]);
        const role = table("roles").find((item) => item.code === required(p, "role")) || fail(422, "Neznáma rola");
        if (role.code === "superadmin") fail(422, "Rolu superadministrátora nemožno odobrať v rozhraní.");
        const target = find("users", p.user_id) || fail(404, "Používateľ neexistuje");
        store.user_roles = table("user_roles").filter((item) => !(item.user_id === target.id && item.role_id === role.id));
        audit("role.remove", "user", target.id, { role: role.code }, null);
        save();
        return { data: publicUser(target) };
      }

      case "admin.set_active": {
        requireRoles(["superadmin"]);
        const user = find("users", p.user_id) || fail(404, "Používateľ neexistuje");
        if (user.id === me) fail(422, "Nemôžete deaktivovať vlastný účet");
        if (rolesOf(user.id).includes("superadmin")) fail(422, "Super administrátora nemožno deaktivovať");
        user.is_active = Boolean(p.is_active);
        audit("admin.set_active", "user", user.id, null, { is_active: user.is_active });
        save();
        return { data: publicUser(user) };
      }

      case "conference.update": {
        requireRoles(["superadmin"]);
        const conference = find("conferences", CONFERENCE_ID);
        const changes = {};
        ["name", "location", "iban", "accommodation_info"].forEach((key) => { if (key in p) changes[key] = text(p, key); });
        ["start_date", "end_date"].forEach((key) => { if (key in p) changes[key] = optional(p, key); });
        if ("program_published" in p) changes.program_published = Boolean(p.program_published);
        if (changes.name === "") fail(422, "Názov nesmie byť prázdny");
        if (!Object.keys(changes).length) fail(422, "Nie je čo uložiť");
        Object.assign(conference, changes);
        audit("conference.update", "conference", CONFERENCE_ID, null, changes);
        save();
        return { data: copy(conference) };
      }

      case "category.update": {
        requireRoles(["superadmin"]);
        const category = find("participant_categories", p.category_id) || fail(404, "Kategória neexistuje");
        const fee = p.fee;
        if (fee === "" || fee == null || Number.isNaN(Number(fee)) || Number(fee) < 0) fail(422, "Poplatok musí byť nezáporné číslo");
        const student = p.student_fee;
        const hasStudent = student !== "" && student != null;
        if (hasStudent && (Number.isNaN(Number(student)) || Number(student) < 0)) fail(422, "Študentský poplatok musí byť nezáporné číslo");
        category.fee = Number(fee);
        category.student_fee = hasStudent ? Number(student) : null;
        audit("category.update", "participant_category", category.id, null, { fee: category.fee, student_fee: category.student_fee });
        save();
        return { data: copy(category) };
      }

      default: return fail(404, "Neznáma POST akcia");
    }
  }

  /* Verejné rozhranie pre js/app.js
     ------------------------------------------------------------------------ */
  window.demoCall = async (action, { params = {}, body } = {}) => {
    if (body === undefined) return get(action, params);
    const data = body instanceof FormData ? Object.fromEntries(body.entries()) : body;
    return post(action, data);
  };

  window.demoLoginAs = (email) => {
    const user = table("users").find((item) => item.email === email);
    if (user) localStorage.setItem(USER_KEY, String(user.id));
    return Boolean(user);
  };

  /* Ukážkové roly pre výber v pruhu dole (každá má vlastný testovací účet a úvodnú stránku) */
  const DEMO_ROLES = [
    { key: "public", email: null, page: "index.html" },
    { key: "participant", email: "jan.novak@example.com", page: "ucet.html" },
    { key: "organizer", email: "organizator@ans-test.sk", page: "admin.html" },
    { key: "reviewer", email: "recenzent2@ans-test.sk", page: "recenzent.html" },
    { key: "superadmin", email: "admin@ans-test.sk", page: "superadmin.html" },
  ];
  window.DEMO_ROLES = DEMO_ROLES;

  /** Rola aktuálne prihláseného účtu (kľúč z DEMO_ROLES). */
  window.demoCurrentRole = () => {
    const { id, roles } = session();
    if (!id) return "public";
    const byRole = { superadmin: "superadmin", organizer: "organizer", program_committee: "organizer", finance: "organizer", reviewer: "reviewer" };
    const code = Object.keys(byRole).find((item) => roles.includes(item));
    return code ? byRole[code] : "participant";
  };

  /** Prepne na účet danej role a vráti stránku, na ktorú treba prejsť. */
  window.demoSwitchRole = (key) => {
    const role = DEMO_ROLES.find((item) => item.key === key) || DEMO_ROLES[0];
    if (role.email) window.demoLoginAs(role.email);
    else localStorage.removeItem(USER_KEY);
    return role.page;
  };

  window.demoReset = () => {
    try { localStorage.removeItem(DB_KEY); localStorage.removeItem(USER_KEY); } catch { /* nič */ }
    store = null;
  };

  /* Stiahnutie súboru a exporty (v demo režime sa vytvoria v prehliadači)
     ------------------------------------------------------------------------ */
  const csvCell = (value) => {
    let cell = String(value ?? "");
    if (/^[\s]*[=+\-@]/u.test(cell)) cell = "'" + cell; // ochrana proti vzorcom v Exceli
    return '"' + cell.replaceAll('"', '""') + '"';
  };

  const exportRows = (type, params) => {
    const name = (user) => [user?.title_before, user?.first_name, user?.last_name, user?.title_after].filter(Boolean).join(" ");
    const registrations = table("registrations").filter((registration) =>
      (!params.get("payment_status") || registration.payment_status === params.get("payment_status"))
      && (!params.get("category_id") || String(registration.category_id) === params.get("category_id")));

    if (type === "participants") {
      return [["Meno", "E-mail", "Organizácia", "Krajina", "Kategória", "Študent", "Suma", "Var. symbol", "Stav platby", "Strava"],
        ...registrations.map((r) => {
          const user = find("users", r.user_id);
          return [name(user), user.email, user.organization, user.country, find("participant_categories", r.category_id)?.code,
            r.is_student ? "áno" : "nie", r.amount_due, r.variable_symbol, r.payment_status, r.dietary_requirements];
        })];
    }
    if (type === "payments") {
      return [["Var. symbol", "Typ", "Suma", "Prijaté", "Poznámka"],
        ...table("payments").map((p) => [find("registrations", p.registration_id)?.variable_symbol, p.type, p.amount, p.received_at, p.note])];
    }
    if (type === "submissions") {
      return [["Názov", "Typ", "Stav", "Autor", "Vytvorené"],
        ...table("submissions").map((s) => [s.title, s.type, s.status, name(find("users", find("registrations", s.registration_id)?.user_id)), s.created_at])];
    }
    if (type === "attendance") {
      return [["Meno", "Organizácia", "Podpis"],
        ...table("registrations").filter((r) => !["cancelled", "refunded"].includes(r.payment_status))
          .map((r) => { const user = find("users", r.user_id); return [name(user), user.organization, ""]; })];
    }
    return fail(404, "Neznámy export");
  };

  const downloadBlob = (blob, filename) => {
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: filename });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  window.demoFile = (url) => {
    const query = new URL(url, location.href).searchParams;
    const action = query.get("action");

    if (action === "export") {
      const type = query.get("type");
      if (query.get("format") === "xlsx") alert("Export do XLSX funguje až so serverom (PHP). V demo režime sa stiahne CSV.");
      const csv = "﻿" + exportRows(type, query).map((row) => row.map(csvCell).join(";")).join("\r\n");
      downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `ans-2027-${type}.csv`);
      return;
    }

    if (action === "download") {
      const version = find("submission_versions", query.get("id")) || fail(404, "Súbor neexistuje");
      const content = `Ukážkový súbor (demo režim)\nPôvodný názov: ${version.original_filename}\nVo verzii so serverom sa tu stiahne skutočný súbor.\n`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      if (query.get("inline") === "1") window.open(URL.createObjectURL(blob), "_blank", "noopener");
      else downloadBlob(blob, version.original_filename + ".txt");
    }
  };
})();
