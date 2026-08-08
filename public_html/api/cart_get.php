<?php
require_once __DIR__ . '/bootstrap.php';

$claims = require_auth();
$sub = $claims['sub'] ?? null;
if (!$sub) {
  json_response(['error' => 'Missing subject'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT cart_id, items, updated_at FROM carts WHERE user_sub = :sub');
$stmt->execute(['sub' => $sub]);
$row = $stmt->fetch();

if (!$row) {
  json_response(['cart_id' => null, 'items' => null]);
}

json_response([
  'cart_id' => $row['cart_id'] ?? null,
  'items' => $row['items'] ? json_decode($row['items'], true) : null,
  'updated_at' => $row['updated_at'] ?? null
]);
