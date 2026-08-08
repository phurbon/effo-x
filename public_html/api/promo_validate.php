<?php
require_once __DIR__ . '/bootstrap.php';

require_auth();

$code = $_GET['code'] ?? null;
if (!$code) {
  $input = json_decode(file_get_contents('php://input'), true) ?? [];
  $code = $input['code'] ?? null;
}

if (!$code) {
  json_response(['error' => 'Missing promo code'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT code, discount_type, discount_value, active, starts_at, ends_at, max_uses, uses FROM promo_codes WHERE code = :code');
$stmt->execute(['code' => $code]);
$promo = $stmt->fetch();

if (!$promo) {
  json_response(['valid' => false, 'reason' => 'not_found']);
}

$now = date('Y-m-d H:i:s');
if (!$promo['active']) {
  json_response(['valid' => false, 'reason' => 'inactive']);
}
if ($promo['starts_at'] && $promo['starts_at'] > $now) {
  json_response(['valid' => false, 'reason' => 'not_started']);
}
if ($promo['ends_at'] && $promo['ends_at'] < $now) {
  json_response(['valid' => false, 'reason' => 'expired']);
}
if ($promo['max_uses'] !== null && $promo['uses'] >= $promo['max_uses']) {
  json_response(['valid' => false, 'reason' => 'maxed_out']);
}

json_response([
  'valid' => true,
  'code' => $promo['code'],
  'discount_type' => $promo['discount_type'],
  'discount_value' => $promo['discount_value']
]);
