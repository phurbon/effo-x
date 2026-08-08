<?php
require_once __DIR__ . '/bootstrap.php';

$claims = require_auth();
$sub = $claims['sub'] ?? null;
$email = $claims['email'] ?? null;
$name = $claims['name'] ?? $claims['nickname'] ?? null;

if (!$sub) {
  json_response(['error' => 'Missing subject'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT user_sub, name, email, phone, address, role FROM profiles WHERE user_sub = :sub');
$stmt->execute(['sub' => $sub]);
$profile = $stmt->fetch();

if (!$profile) {
  $profile = [
    'user_sub' => $sub,
    'name' => $name,
    'email' => $email,
    'phone' => null,
    'address' => null,
    'role' => 'Member'
  ];
}

json_response($profile);
