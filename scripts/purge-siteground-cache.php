<?php
declare(strict_types=1);

// CLI only: this helper lives outside public_html and needs no public endpoint.
// Protocol reference: SiteGround's official Speed Optimizer plugin,
// core/Supercacher/Supercacher.php and core/Site_Tools_Client/Site_Tools_Client.php.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

const DOMAIN = 'enricotoso.com';
const CACHE_PATH = '/(.*)';

try {
    $socketPath = getenv('SITEGROUND_SOCKET') ?: '/chroot/tmp/site-tools.sock';
    $connection = @stream_socket_client('unix://' . $socketPath, $errno, $error, 5);
    if ($connection === false) {
        throw new RuntimeException('Site Tools socket unavailable (error ' . $errno . ').');
    }
    stream_set_timeout($connection, 10);

    $request = json_encode([
        'api' => 'domain-all',
        'cmd' => 'update',
        'settings' => (object) ['json' => 1],
        'params' => (object) [
            'flush_cache' => '1',
            'id' => DOMAIN,
            'path' => CACHE_PATH,
        ],
    ], JSON_THROW_ON_ERROR) . "\n";

    try {
        $offset = 0;
        while ($offset < strlen($request)) {
            $written = fwrite($connection, substr($request, $offset));
            if ($written === false || $written === 0) {
                throw new RuntimeException('Could not send the cache purge request.');
            }
            $offset += $written;
        }
        $line = fgets($connection, 32768);
        if ($line === false || stream_get_meta_data($connection)['timed_out']) {
            throw new RuntimeException('Site Tools did not acknowledge the cache purge in time.');
        }
    } finally {
        fclose($connection);
    }

    $response = json_decode($line, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($response) || array_key_exists('err_code', $response)) {
        throw new RuntimeException('Site Tools rejected the cache purge.');
    }
    $result = $response['json'] ?? null;
    if (!is_array($result)
        || ($result['msg'] ?? null) !== 'OK'
        || ($result['id'] ?? null) !== DOMAIN
        || ($result['path'] ?? null) !== CACHE_PATH
        || !in_array($result['flush_cache'] ?? null, [1, '1'], true)) {
        throw new RuntimeException('Site Tools did not confirm a full purge for ' . DOMAIN . '.');
    }

    echo 'SiteGround cache purged for ' . DOMAIN . ".\n";
} catch (Throwable $error) {
    file_put_contents('php://stderr', 'Cache purge failed: ' . $error->getMessage() . "\n");
    exit(1);
}
