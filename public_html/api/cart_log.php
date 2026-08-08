<?php
require_once __DIR__ . '/bootstrap.php';

$claims = require_auth();
$sub = $claims['sub'] ?? null;
if (!$sub) {
  json_response(['error' => 'Missing subject'], 400);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$cartId = $input['cart_id'] ?? null;
$reason = $input['reason'] ?? null;
$detail = $input['detail'] ?? null;

if (!$reason) {
  json_response(['error' => 'Missing reason'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('INSERT INTO cart_restore_logs (user_sub, cart_id, reason, detail)
  VALUES (:sub, :cart_id, :reason, :detail)');
$stmt->execute([
  'sub' => $sub,
  'cart_id' => $cartId,
  'reason' => $reason,
  'detail' => $detail
]);

json_response(['ok' => true]);
