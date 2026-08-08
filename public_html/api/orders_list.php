<?php
require_once __DIR__ . '/bootstrap.php';

$claims = require_auth();
$sub = $claims['sub'] ?? null;
if (!$sub) {
  json_response(['error' => 'Missing subject'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT order_id, amount, currency, status, created_at FROM orders WHERE user_sub = :sub ORDER BY created_at DESC');
$stmt->execute(['sub' => $sub]);
$orders = $stmt->fetchAll();

json_response($orders);
