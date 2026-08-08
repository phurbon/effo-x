<?php
require_once __DIR__ . '/bootstrap.php';

$claims = require_auth();
$sub = $claims['sub'] ?? null;
$email = $claims['email'] ?? null;
$name = $claims['name'] ?? $claims['nickname'] ?? null;

if (!$sub) {
  json_response(['error' => 'Missing subject'], 400);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$phone = $input['phone'] ?? null;
$address = $input['address'] ?? null;

$pdo = db();
$stmt = $pdo->prepare('INSERT INTO profiles (user_sub, name, email, phone, address, role)
  VALUES (:sub, :name, :email, :phone, :address, :role)
  ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), phone = VALUES(phone), address = VALUES(address)');
$stmt->execute([
  'sub' => $sub,
  'name' => $name,
  'email' => $email,
  'phone' => $phone,
  'address' => $address,
  'role' => 'Member'
]);

json_response(['ok' => true]);
