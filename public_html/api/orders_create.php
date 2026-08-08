<?php
require_once __DIR__ . '/bootstrap.php';

$claims = require_auth();
$sub = $claims['sub'] ?? null;
if (!$sub) {
  json_response(['error' => 'Missing subject'], 400);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$orderId = $input['order_id'] ?? null;
$amount = $input['amount'] ?? null;
$currency = $input['currency'] ?? 'USD';
$status = $input['status'] ?? 'pending';
$items = $input['items'] ?? null;
$promoCode = $input['promo_code'] ?? null;

if (!$orderId || $amount === null) {
  json_response(['error' => 'Missing order fields'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('INSERT INTO orders (user_sub, order_id, amount, currency, status, items, promo_code)
  VALUES (:sub, :order_id, :amount, :currency, :status, :items, :promo_code)');
$stmt->execute([
  'sub' => $sub,
  'order_id' => $orderId,
  'amount' => $amount,
  'currency' => $currency,
  'status' => $status,
  'items' => $items ? json_encode($items) : null,
  'promo_code' => $promoCode
]);

json_response(['ok' => true]);
