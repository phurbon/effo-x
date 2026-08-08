<?php

function json_response($data, $status = 200) {
  http_response_code($status);
  header('Content-Type: application/json');
  echo json_encode($data);
  exit;
}

function base64url_decode($data) {
  $remainder = strlen($data) % 4;
  if ($remainder) {
    $data .= str_repeat('=', 4 - $remainder);
  }
  return base64_decode(strtr($data, '-_', '+/'));
}

function jwk_to_pem($jwk) {
  $n = base64url_decode($jwk['n']);
  $e = base64url_decode($jwk['e']);

  $mod = asn1_encode_integer($n);
  $exp = asn1_encode_integer($e);
  $seq = asn1_encode_sequence($mod . $exp);

  $bitstring = "\x00" . $seq;
  $bitstring = "\x03" . asn1_encode_length(strlen($bitstring)) . $bitstring;

  $alg = "\x30\x0D\x06\x09\x2A\x86\x48\x86\xF7\x0D\x01\x01\x01\x05\x00";
  $der = "\x30" . asn1_encode_length(strlen($alg) + strlen($bitstring)) . $alg . $bitstring;

  $pem = "-----BEGIN PUBLIC KEY-----\n" .
    chunk_split(base64_encode($der), 64, "\n") .
    "-----END PUBLIC KEY-----\n";
  return $pem;
}

function asn1_encode_length($length) {
  if ($length <= 0x7F) {
    return chr($length);
  }
  $temp = ltrim(pack('N', $length), "\x00");
  return chr(0x80 | strlen($temp)) . $temp;
}

function asn1_encode_integer($data) {
  if (ord($data[0]) > 0x7F) {
    $data = "\x00" . $data;
  }
  return "\x02" . asn1_encode_length(strlen($data)) . $data;
}

function asn1_encode_sequence($data) {
  return "\x30" . asn1_encode_length(strlen($data)) . $data;
}
function get_bearer_token() {
  $headers = [];
  if (function_exists('getallheaders')) {
    $headers = getallheaders();
  }
  $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
  if (!$auth && isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'];
  }
  if (preg_match('/Bearer\s(.*)$/i', $auth, $matches)) {
    return trim($matches[1]);
  }
  return null;
}

function verify_jwt($token) {
  $config = require __DIR__ . '/config.php';
  $auth0 = $config['auth0'];

  $parts = explode('.', $token);
  if (count($parts) !== 3) {
    json_response(['error' => 'Invalid token'], 401);
  }

  [$header64, $payload64, $signature64] = $parts;
  $header = json_decode(base64url_decode($header64), true);
  $payload = json_decode(base64url_decode($payload64), true);

  if (!$header || !$payload || empty($header['kid'])) {
    json_response(['error' => 'Invalid token'], 401);
  }

  if (($header['alg'] ?? '') !== 'RS256') {
    json_response(['error' => 'Invalid token alg'], 401);
  }

  $jwksUrl = sprintf('https://%s/.well-known/jwks.json', $auth0['domain']);
  $jwks = json_decode(@file_get_contents($jwksUrl), true);
  if (!$jwks || empty($jwks['keys'])) {
    json_response(['error' => 'Unable to load JWKS'], 500);
  }

  $jwk = null;
  foreach ($jwks['keys'] as $key) {
    if ($key['kid'] === $header['kid']) {
      $jwk = $key;
      break;
    }
  }

  if (!$jwk) {
    json_response(['error' => 'Invalid token key'], 401);
  }

  $publicKey = jwk_to_pem($jwk);
  $signature = base64url_decode($signature64);
  $data = $header64 . '.' . $payload64;

  $verified = openssl_verify($data, $signature, $publicKey, OPENSSL_ALGO_SHA256);
  if ($verified !== 1) {
    json_response(['error' => 'Invalid token signature'], 401);
  }

  $now = time();
  if (!empty($payload['exp']) && $payload['exp'] < $now) {
    json_response(['error' => 'Token expired'], 401);
  }

  if (!empty($payload['nbf']) && $payload['nbf'] > $now) {
    json_response(['error' => 'Token not yet valid'], 401);
  }

  if (!empty($payload['iss']) && $payload['iss'] !== $auth0['issuer']) {
    json_response(['error' => 'Invalid token issuer'], 401);
  }

  $aud = $payload['aud'] ?? null;
  $expectedAud = $auth0['audience'];
  $audOk = false;
  if (is_array($aud)) {
    $audOk = in_array($expectedAud, $aud, true);
  } else {
    $audOk = ($aud === $expectedAud);
  }

  if (!$audOk) {
    json_response(['error' => 'Invalid token audience'], 401);
  }

  return $payload;
}

function require_auth() {
  $token = get_bearer_token();
  if (!$token) {
    json_response(['error' => 'Missing token'], 401);
  }
  return verify_jwt($token);
}
