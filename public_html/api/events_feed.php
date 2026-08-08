<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

const SIMPLY_EVENTS_URL = 'https://effo-x.myshopify.com/apps/events';

function fetchSimplyEvents(): string {
    if (!function_exists('curl_init')) {
        throw new RuntimeException('The server does not have cURL enabled.');
    }

    $curl = curl_init(SIMPLY_EVENTS_URL);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_USERAGENT => 'Effo-X Events Calendar/1.0',
    ]);
    $html = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);

    if (!is_string($html) || $status < 200 || $status >= 300) {
        throw new RuntimeException('Simply Events could not be reached.');
    }
    return $html;
}

function classXPath(string $class): string {
    return "contains(concat(' ', normalize-space(@class), ' '), ' {$class} ')";
}

try {
    $document = new DOMDocument();
    libxml_use_internal_errors(true);
    $document->loadHTML(fetchSimplyEvents(), LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
    libxml_clear_errors();
    $xpath = new DOMXPath($document);
    $items = $xpath->query('//' . 'div[' . classXPath('simply-events-item') . ']');
    $events = [];

    foreach ($items ?: [] as $item) {
        $month = trim((string) $xpath->evaluate('string(.//div[' . classXPath('simply-events-item__date-month') . '])', $item));
        $day = trim((string) $xpath->evaluate('string(.//div[' . classXPath('simply-events-item__date-day') . '])', $item));
        $year = trim((string) $xpath->evaluate('string(.//div[' . classXPath('simply-events-item__date-year') . '])', $item));
        $timestamp = strtotime("{$month} {$day} {$year}");
        $title = trim((string) $xpath->evaluate('string(.//h2[' . classXPath('simply-events-item__title') . ']/a)', $item));
        $href = trim((string) $xpath->evaluate('string(.//h2[' . classXPath('simply-events-item__title') . ']/a/@href)', $item));

        if (!$timestamp || $title === '' || $href === '') {
            continue;
        }
        $events[] = [
            'title' => $title,
            'date' => gmdate('Y-m-d', $timestamp),
            'time' => trim((string) $xpath->evaluate('string(.//div[' . classXPath('simply-events-item__time') . '])', $item)),
            'url' => str_starts_with($href, 'http') ? $href : 'https://effo-x.myshopify.com' . $href,
        ];
    }

    usort($events, fn(array $a, array $b): int => strcmp($a['date'], $b['date']));
    echo json_encode(['events' => $events], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (Throwable $exception) {
    http_response_code(502);
    echo json_encode(['events' => [], 'error' => 'The event feed is temporarily unavailable.']);
}
