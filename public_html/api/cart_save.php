<?php
require_once __DIR__ . '/bootstrap.php';

$claims = require_auth();
$sub = $claims['sub'] ?? null;
if (!$sub) {
  json_response(['error' => 'Missing subject'], 400);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$cartId = $input['cart_id'] ?? null;
$items = $input['items'] ?? null;

if (!$cartId && !$items) {
  json_response(['error' => 'Missing cart payload'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('INSERT INTO carts (user_sub, cart_id, items)
  VALUES (:sub, :cart_id, :items)
  ON DUPLICATE KEY UPDATE cart_id = VALUES(cart_id), items = VALUES(items), updated_at = CURRENT_TIMESTAMP');
$stmt->execute([
  'sub' => $sub,
  'cart_id' => $cartId,
  'items' => $items ? json_encode($items) : null
]);

json_response(['ok' => true, 'cart_id' => $cartId]);
