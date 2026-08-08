<?php
function db() {
  static $pdo = null;
  if ($pdo) return $pdo;

  $config = require __DIR__ . '/config.php';
  $db = $config['db'];
  $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $db['host'], $db['name']);

  $pdo = new PDO($dsn, $db['user'], $db['pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
  ]);

  return $pdo;
}
