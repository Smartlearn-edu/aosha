<?php
/**
 * Moodle login status checker for AOSHA.
 * Place this file in the root directory of your Moodle installation (e.g. /public_html/lms/ or /var/www/moodle/).
 * Accessible at: https://lms.aosha.sa/login_status.php
 * Requested by app.js on https://aosha.sa to determine if the user is currently logged in.
 */

// Define AJAX_SCRIPT so Moodle knows this is a lightweight JSON response and avoids rendering full UI templates
define('AJAX_SCRIPT', true);

// Include Moodle configuration file
require_once(__DIR__ . '/config.php');

// List of allowed origins for CORS
$allowed_origins = [
    'https://aosha.sa',
    'https://www.aosha.sa',
    'http://localhost',
    'http://127.0.0.1'
];

$http_origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($http_origin, $allowed_origins) || empty($http_origin)) {
    $origin = !empty($http_origin) ? $http_origin : 'https://aosha.sa';
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

// Check if user is authenticated and not a guest user
$isLoggedIn = isloggedin() && !isguestuser();

$response = [
    'loggedin' => (bool)$isLoggedIn,
    'site'     => 'AOSHA LMS',
    'time'     => time()
];

if ($isLoggedIn) {
    global $USER;
    $response['username']  = $USER->username;
    $response['fullname']  = fullname($USER);
    $response['firstname'] = !empty($USER->firstname) ? $USER->firstname : '';
    $response['email']     = !empty($USER->email) ? $USER->email : '';
    $response['id']        = (int)$USER->id;
    
    // User profile picture URL
    try {
        $userpicture = new user_picture($USER);
        $userpicture->size = 1; // 1 = standard/large avatar
        $response['avatar'] = $userpicture->get_url($PAGE)->out(false);
    } catch (\Exception $e) {
        $response['avatar'] = '';
    }
}

echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
exit;
