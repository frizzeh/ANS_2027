<?php
declare(strict_types=1);
// ANS prototype API. No MySQL: data lives in PHP session per browser/client.
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
session_start();
function respond(int $code, array $data): never { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT); exit; }
function body(): array { $raw=file_get_contents('php://input'); $v=json_decode($raw ?: '{}', true); if (!is_array($v)) respond(400,['error'=>'Neplatný JSON']); return $v; }
function required(array $a, string $key): string { $v=trim((string)($a[$key]??'')); if ($v==='') respond(422,['error'=>'Chýba pole: '.$key]); return $v; }
function nextId(string $table): int { $ids=array_column($_SESSION['db'][$table], 'id'); return $ids ? max($ids)+1 : 1; }
function getById(string $table, int $id): ?array { foreach ($_SESSION['db'][$table] as $row) if ($row['id']===$id) return $row; return null; }
function mustExist(string $table, int $id): array { return getById($table,$id) ?? respond(404,['error'=>"Záznam $table/$id neexistuje"]); }
function add(string $table, array $row): array { $row=['id'=>nextId($table)]+$row; $_SESSION['db'][$table][]=$row; return $row; }
function update(string $table, int $id, array $changes): array { foreach ($_SESSION['db'][$table] as &$row) if ($row['id']===$id) { $row=array_merge($row,$changes); return $row; } respond(404,['error'=>'Záznam neexistuje']); }
function dateNow(): string { return date('Y-m-d H:i:s'); }
function inEnum(string $v, array $allowed, string $field): string { if (!in_array($v,$allowed,true)) respond(422,['error'=>"Neplatné $field",'allowed'=>$allowed]); return $v; }
function feeStatus(int $registrationId): array {
    $reg=mustExist('registrations',$registrationId); $total=0.0;
    foreach ($_SESSION['db']['payments'] as $p) if ($p['registration_id']===$registrationId) $total+=($p['type']==='refund'?-1:1)*(float)$p['amount'];
    $due=(float)$reg['amount_due']; $status=$reg['payment_status'];
    if (!in_array($status,['cancelled','refunded'],true)) $status=$total >= $due ? 'paid' : ($total>0?'partially_paid':'awaiting_payment');
    return update('registrations',$registrationId,['payment_status'=>$status]);
}
// --- PRIDANÉ (frontend): roly a oprávnenia ---
function rolesOf(int $userId): array {
    $codes=[];
    foreach ($_SESSION['db']['user_roles'] as $ur) if ($ur['user_id']===$userId) { $r=getById('roles',$ur['role_id']); if ($r) $codes[]=$r['code']; }
    return array_values(array_unique($codes));
}
function publicUser(array $u): array { unset($u['password_hash']); $u['roles']=rolesOf($u['id']); return $u; }
function demoUser(int $id, string $email, string $first, string $last, string $pass): array {
    return ['id'=>$id,'email'=>$email,'password_hash'=>password_hash($pass,PASSWORD_DEFAULT),'title_before'=>'','title_after'=>'','first_name'=>$first,'last_name'=>$last,'organization'=>'','organization_address'=>'','department'=>'','country'=>'','preferred_language'=>'sk','is_active'=>true,'last_login_at'=>null,'created_at'=>dateNow()];
}
if (!isset($_SESSION['db'])) {
    $_SESSION['db']=[
      'users'=>[demoUser(1,'superadmin@ans.local','Super','Admin','Super12345'),demoUser(2,'admin@ans.local','Anna','Admin','Admin12345')], 'roles'=>[['id'=>1,'code'=>'participant','name_sk'=>'Účastník','name_en'=>'Participant'],['id'=>2,'code'=>'admin','name_sk'=>'Administrátor','name_en'=>'Administrator'],['id'=>3,'code'=>'superadmin','name_sk'=>'Super administrátor','name_en'=>'Super administrator']], 'user_roles'=>[['user_id'=>1,'role_id'=>3,'conference_id'=>1],['user_id'=>2,'role_id'=>2,'conference_id'=>1]],
      'conferences'=>[['id'=>1,'name'=>'ANS konferencia','year'=>2026,'slug'=>'ans-2026','location'=>'Trnava','start_date'=>'2026-12-01','end_date'=>'2026-12-02','iban'=>'','currency'=>'EUR','accommodation_info'=>'','program_published'=>false,'is_archived'=>false,'created_at'=>dateNow()]],
      'symposia'=>[], 'deadlines'=>[],
      'participant_categories'=>[['id'=>1,'conference_id'=>1,'code'=>'speaker','name_sk'=>'Rečník','name_en'=>'Speaker','fee'=>80,'student_fee'=>40,'submission_type'=>'talk'],['id'=>2,'conference_id'=>1,'code'=>'poster','name_sk'=>'Poster','name_en'=>'Poster','fee'=>60,'student_fee'=>30,'submission_type'=>'poster'],['id'=>3,'conference_id'=>1,'code'=>'passive','name_sk'=>'Pasívny účastník','name_en'=>'Passive participant','fee'=>40,'student_fee'=>20,'submission_type'=>null]],
      'registrations'=>[], 'payments'=>[], 'invoices'=>[], 'submissions'=>[], 'submission_authors'=>[], 'submission_status_history'=>[], 'submission_versions'=>[], 'review_assignments'=>[], 'reviews'=>[], 'program_items'=>[], 'notifications'=>[], 'email_log'=>[], 'audit_log'=>[]
    ];
}
$db=&$_SESSION['db'];
$action=(string)($_GET['action']??'help');
$method=$_SERVER['REQUEST_METHOD'];
if ($action==='help') respond(200,['name'=>'ANS prototype backend','storage'=>'PHP session; no database','get'=>['tables','list?table=...','detail?table=...&id=...'],'post'=>['user.create','registration.create','payment.create','submission.create','submission.status','submission.version','reset'],'note'=>'Prototype only; not for production']);
if ($method==='GET') {
    // --- PRIDANÉ (frontend): účastník vidí len svoje údaje, verejné tabuľky vidí každý ---
    $meId = (int)($_SESSION['user_id'] ?? 0);
    $isStaff = $meId && array_intersect(rolesOf($meId), ['admin','superadmin']);
    if (in_array($action,['tables','list','detail'],true) && !$isStaff) {
        if ($action==='tables') respond(403,['error'=>'Len pre administrátorov']);
        $table=(string)($_GET['table']??'');
        if (!array_key_exists($table,$db)) respond(404,['error'=>'Neznáma tabuľka']);
        $rows=$db[$table];
        if (!in_array($table,['participant_categories','conferences','symposia','deadlines','program_items'],true)) {
            if (!$meId) respond(401,['error'=>'Neprihlásený']);
            $myRegs=array_column(array_filter($db['registrations'],fn($r)=>$r['user_id']===$meId),'id');
            $mySubs=array_column(array_filter($db['submissions'],fn($x)=>in_array($x['registration_id'],$myRegs,true)),'id');
            $rows=match($table) {
                'users' => array_filter($rows,fn($u)=>$u['id']===$meId),
                'registrations' => array_filter($rows,fn($r)=>$r['user_id']===$meId),
                'payments' => array_filter($rows,fn($x)=>in_array($x['registration_id'],$myRegs,true)),
                'submissions' => array_filter($rows,fn($x)=>in_array($x['id'],$mySubs,true)),
                'submission_versions','submission_status_history' => array_filter($rows,fn($x)=>in_array($x['submission_id'],$mySubs,true)),
                default => respond(403,['error'=>'Nedostatočné oprávnenie']),
            };
        }
        $rows=array_map(fn($r)=>array_diff_key($r,['password_hash'=>1]),array_values($rows));
        if ($action==='list') respond(200,['data'=>$rows]);
        foreach ($rows as $row) if (($row['id']??null)===(int)($_GET['id']??0)) respond(200,['data'=>$row]);
        respond(404,['error'=>'Záznam neexistuje']);
    }
    if ($action==='tables') respond(200,['tables'=>array_keys($db)]);
    if ($action==='list') { $table=(string)($_GET['table']??''); if (!array_key_exists($table,$db)) respond(404,['error'=>'Neznáma tabuľka']); $rows=$db[$table]; if ($table==='users') $rows=array_map(fn($u)=>array_diff_key($u,['password_hash'=>1]),$rows); respond(200,['data'=>$rows]); }
    if ($action==='detail') { $table=(string)($_GET['table']??''); if (!array_key_exists($table,$db)) respond(404,['error'=>'Neznáma tabuľka']); $row=mustExist($table,(int)($_GET['id']??0)); if ($table==='users') unset($row['password_hash']); respond(200,['data'=>$row]); }
    // --- PRIDANÉ (frontend): kto je prihlásený (vrátane rolí) ---
    if ($action==='auth.me') {
        $u = $meId ? getById('users',$meId) : null;
        if (!$u) respond(401,['error'=>'Neprihlásený']);
        respond(200,['data'=>publicUser($u)]);
    }
    respond(404,['error'=>'Neznáma GET akcia']);
}
if ($method!=='POST') respond(405,['error'=>'Použite GET alebo POST']);
$p=body();
// --- PRIDANÉ (frontend): oprávnenia pri zápise ---
$meId=(int)($_SESSION['user_id']??0); $meRoles=$meId?rolesOf($meId):[];
$isStaff=(bool)array_intersect($meRoles,['admin','superadmin']); $isSuper=in_array('superadmin',$meRoles,true);
if (in_array($action,['reset','admin.create','admin.set_active','conference.update','category.update'],true) && !$isSuper) respond($meId?403:401,['error'=>'Len pre super administrátora']);
if (in_array($action,['submission.status','payment.create','symposium.create'],true) && !$isStaff) respond($meId?403:401,['error'=>'Len pre administrátorov']);
if (!$isStaff) { // účastník smie meniť len vlastné údaje
    $deny=fn()=>respond($meId?403:401,['error'=>'Nedostatočné oprávnenie']);
    if ($action==='registration.create') { unset($p['fee_exempt'],$p['exempt_reason']); } // oslobodenie od poplatku smie nastaviť len admin
    if ($action==='registration.create' && (int)($p['user_id']??0)!==$meId) $deny();
    if ($action==='submission.create') { $r0=getById('registrations',(int)($p['registration_id']??0)); if (!$r0||$r0['user_id']!==$meId) $deny(); }
    if ($action==='submission.version') { $s0=getById('submissions',(int)($p['submission_id']??0)); $r0=$s0?getById('registrations',$s0['registration_id']):null; if (!$r0||$r0['user_id']!==$meId||(int)($p['uploaded_by']??0)!==$meId) $deny(); }
}
switch ($action) {
case 'reset': unset($_SESSION['db']); respond(200,['message'=>'Údaje vymazané; obnov stránku na inicializáciu']);
case 'user.create':
    $email=required($p,'email'); if (!filter_var($email,FILTER_VALIDATE_EMAIL)) respond(422,['error'=>'Neplatný e-mail']);
    foreach ($db['users'] as $u) if (strcasecmp($u['email'],$email)===0) respond(409,['error'=>'E-mail už existuje']);
    $user=add('users',['email'=>$email,'password_hash'=>password_hash((string)($p['password']??'demo-password'),PASSWORD_DEFAULT),'title_before'=>(string)($p['title_before']??''),'title_after'=>(string)($p['title_after']??''),'first_name'=>required($p,'first_name'),'last_name'=>required($p,'last_name'),'organization'=>(string)($p['organization']??''),'organization_address'=>(string)($p['organization_address']??''),'department'=>(string)($p['department']??''),'country'=>(string)($p['country']??''),'preferred_language'=>(string)($p['preferred_language']??'sk'),'is_active'=>true,'last_login_at'=>null,'created_at'=>dateNow()]);
    $db['user_roles'][]=['user_id'=>$user['id'],'role_id'=>1,'conference_id'=>1]; unset($user['password_hash']); respond(201,['data'=>$user]);
case 'registration.create':
    $uid=(int)($p['user_id']??0); $cid=(int)($p['conference_id']??1); $catid=(int)($p['category_id']??0);
    mustExist('users',$uid); mustExist('conferences',$cid); $cat=mustExist('participant_categories',$catid);
    if ($cat['conference_id']!==$cid) respond(422,['error'=>'Kategória nepatrí konferencii']);
    foreach ($db['registrations'] as $r) if ($r['user_id']===$uid && $r['conference_id']===$cid) respond(409,['error'=>'Používateľ už je registrovaný']);
    $student=(bool)($p['is_student']??false); $exempt=(bool)($p['fee_exempt']??false);
    $amount=$exempt?0.0:(float)($student?$cat['student_fee']:$cat['fee']);
    $r=add('registrations',['user_id'=>$uid,'conference_id'=>$cid,'category_id'=>$catid,'is_student'=>$student,'fee_exempt'=>$exempt,'exempt_reason'=>(string)($p['exempt_reason']??''),'billing_name'=>(string)($p['billing_name']??''),'billing_street'=>(string)($p['billing_street']??''),'billing_city'=>(string)($p['billing_city']??''),'billing_zip'=>(string)($p['billing_zip']??''),'billing_country'=>(string)($p['billing_country']??''),'billing_ico'=>(string)($p['billing_ico']??''),'billing_dic'=>(string)($p['billing_dic']??''),'billing_ic_dph'=>(string)($p['billing_ic_dph']??''),'dietary_requirements'=>(string)($p['dietary_requirements']??''),'gdpr_consent_at'=>!empty($p['gdpr_consent'])?dateNow():null,'amount_due'=>$amount,'due_date'=>null,'variable_symbol'=>null,'payment_status'=>$amount===0.0?'paid':'awaiting_payment','created_at'=>dateNow()]);
    $r=update('registrations',$r['id'],['variable_symbol'=>sprintf('%d%05d',$cid,$r['id'])]); respond(201,['data'=>$r]);
case 'payment.create':
    $rid=(int)($p['registration_id']??0); mustExist('registrations',$rid);
    $type=inEnum((string)($p['type']??'payment'),['payment','refund'],'type'); $amount=(float)($p['amount']??0);
    if ($amount<=0) respond(422,['error'=>'Suma musí byť kladná']);
    $row=add('payments',['registration_id'=>$rid,'type'=>$type,'amount'=>$amount,'received_at'=>date('Y-m-d'),'confirmed_by'=>null,'confirmed_at'=>dateNow(),'note'=>(string)($p['note']??'Simulovaná platba')]);
    $reg=feeStatus($rid); respond(201,['data'=>$row,'registration'=>$reg]);
case 'submission.create':
    $rid=(int)($p['registration_id']??0); $reg=mustExist('registrations',$rid); $cid=(int)($p['conference_id']??$reg['conference_id']);
    if ($reg['conference_id']!==$cid) respond(422,['error'=>'Registrácia nepatrí konferencii']);
    $type=inEnum(required($p,'type'),['talk','poster'],'type');
    $symId=isset($p['symposium_id'])?(int)$p['symposium_id']:null;
    if ($symId!==null && mustExist('symposia',$symId)['conference_id']!==$cid) respond(422,['error'=>'Sympózium nepatrí konferencii']);
    $row=add('submissions',['conference_id'=>$cid,'registration_id'=>$rid,'symposium_id'=>$symId,'type'=>$type,'title'=>required($p,'title'),'abstract'=>required($p,'abstract'),'keywords'=>(string)($p['keywords']??''),'status'=>'submitted','created_at'=>dateNow()]);
    respond(201,['data'=>$row]);
case 'submission.status':
    $sid=(int)($p['submission_id']??0); $sub=mustExist('submissions',$sid);
    $to=inEnum(required($p,'to_status'),['submitted','admin_check','in_review','committee_decision','revision_requested','conditionally_accepted','accepted','rejected'],'to_status');
    $changed=(int)($p['changed_by']??0); mustExist('users',$changed);
    $history=add('submission_status_history',['submission_id'=>$sid,'from_status'=>$sub['status'],'to_status'=>$to,'changed_by'=>$changed,'changed_at'=>dateNow(),'comment'=>(string)($p['comment']??'')]);
    $sub=update('submissions',$sid,['status'=>$to]); respond(200,['data'=>$sub,'history'=>$history]);
case 'submission.version':
    $sid=(int)($p['submission_id']??0); mustExist('submissions',$sid); $uid=(int)($p['uploaded_by']??0); mustExist('users',$uid);
    // Metadata only: file bytes are NOT uploaded or saved in this prototype.
    $filename=basename(required($p,'original_filename'));
    $versions=array_filter($db['submission_versions'],fn($v)=>$v['submission_id']===$sid);
    $v=add('submission_versions',['submission_id'=>$sid,'version_number'=>count($versions)+1,'file_path'=>'DEMO/'.$filename,'original_filename'=>$filename,'mime_type'=>(string)($p['mime_type']??'application/pdf'),'file_size'=>max(0,(int)($p['file_size']??0)),'uploaded_by'=>$uid,'uploaded_at'=>dateNow()]);
    respond(201,['data'=>$v,'note'=>'Uložené len metadáta, nie obsah súboru']);
// --- PRIDANÉ (frontend): prihlásenie a odhlásenie ---
case 'auth.login':
    $email=required($p,'email'); $pass=(string)($p['password']??'');
    foreach ($db['users'] as $u) {
        if (strcasecmp($u['email'],$email)===0 && password_verify($pass,$u['password_hash'])) {
            if (!$u['is_active']) respond(403,['error'=>'Účet je deaktivovaný']);
            session_regenerate_id(true); $_SESSION['user_id']=$u['id'];
            respond(200,['data'=>publicUser($u)]);
        }
    }
    respond(401,['error'=>'Nesprávny e-mail alebo heslo']);
case 'auth.logout':
    unset($_SESSION['user_id']); respond(200,['message'=>'Odhlásený']);
// --- PRIDANÉ (frontend): akcie administrátorov ---
case 'symposium.create':
    respond(201,['data'=>add('symposia',['conference_id'=>1,'name_sk'=>required($p,'name_sk'),'name_en'=>required($p,'name_en')])]);
case 'admin.create':
    $email=required($p,'email'); if (!filter_var($email,FILTER_VALIDATE_EMAIL)) respond(422,['error'=>'Neplatný e-mail']);
    foreach ($db['users'] as $u) if (strcasecmp($u['email'],$email)===0) respond(409,['error'=>'E-mail už existuje']);
    $pass=required($p,'password'); if (strlen($pass)<8) respond(422,['error'=>'Heslo musí mať aspoň 8 znakov']);
    $u=demoUser(nextId('users'),$email,required($p,'first_name'),required($p,'last_name'),$pass); $db['users'][]=$u;
    $db['user_roles'][]=['user_id'=>$u['id'],'role_id'=>2,'conference_id'=>1];
    respond(201,['data'=>publicUser($u)]);
case 'admin.set_active':
    $tid=(int)($p['user_id']??0); mustExist('users',$tid);
    if ($tid===$meId) respond(422,['error'=>'Nemôžete deaktivovať vlastný účet']);
    if (in_array('superadmin',rolesOf($tid),true)) respond(422,['error'=>'Super administrátora nemožno deaktivovať']);
    respond(200,['data'=>publicUser(update('users',$tid,['is_active'=>(bool)($p['is_active']??false)]))]);
case 'conference.update':
    $changes=[]; foreach (['name','location','start_date','end_date','iban','accommodation_info'] as $f) if (array_key_exists($f,$p)) $changes[$f]=trim((string)$p[$f]);
    if (array_key_exists('program_published',$p)) $changes['program_published']=(bool)$p['program_published'];
    respond(200,['data'=>update('conferences',1,$changes)]);
case 'category.update':
    $cid=(int)($p['category_id']??0); mustExist('participant_categories',$cid);
    $fee=(float)($p['fee']??-1); $sfee=(float)($p['student_fee']??-1);
    if ($fee<0||$sfee<0) respond(422,['error'=>'Poplatok musí byť nezáporné číslo']);
    respond(200,['data'=>update('participant_categories',$cid,['fee'=>$fee,'student_fee'=>$sfee])]);
default: respond(404,['error'=>'Neznáma POST akcia']);
}
