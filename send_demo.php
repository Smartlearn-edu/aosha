<?php
/**
 * AOSHA Platform - Demo Request Email Handler
 * Receives AJAX demo booking submissions and sends notification directly to info@aosha.sa
 */

declare(strict_types=1);

// Prevent browser caching of JSON responses
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

// Allowed Origins for CORS
$allowed_origins = [
    'https://aosha.sa',
    'https://www.aosha.sa',
    'http://localhost',
    'http://127.0.0.1'
];

$http_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($http_origin, $allowed_origins, true) || empty($http_origin)) {
    $origin = !empty($http_origin) ? $http_origin : 'https://aosha.sa';
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
}

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method Not Allowed'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Read raw JSON input or POST body
$raw_input = file_get_contents('php://input');
$data = json_decode($raw_input, true);

if (!is_array($data) || empty($data)) {
    $data = $_POST;
}

// Anti-Spam Honeypot Check
if (!empty($data['website']) || !empty($data['_hp_check'])) {
    // Fake success for bots
    echo json_encode([
        'success' => true,
        'message' => 'Request received successfully.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Sanitize & Validate Fields
$name    = htmlspecialchars(trim((string)($data['name'] ?? '')), ENT_QUOTES, 'UTF-8');
$company = htmlspecialchars(trim((string)($data['company'] ?? '')), ENT_QUOTES, 'UTF-8');
$email   = trim((string)($data['email'] ?? ''));
$phone   = htmlspecialchars(trim((string)($data['phone'] ?? '')), ENT_QUOTES, 'UTF-8');
$track   = htmlspecialchars(trim((string)($data['track'] ?? 'كافة المسارات الأربعة (المنظومة الشاملة)')), ENT_QUOTES, 'UTF-8');
$lang    = trim((string)($data['lang'] ?? 'ar'));

// Validation Rules
if (empty($name) || empty($company) || empty($email) || empty($phone)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $lang === 'ar' 
            ? 'يرجى ملء جميع الحقول الإلزامية.' 
            : 'Please fill in all required fields.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $lang === 'ar' 
            ? 'يرجى إدخال بريد إلكتروني صحيح.' 
            : 'Please provide a valid email address.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Prepare Destination & Subject
$to = 'info@aosha.sa';
$subject_text = "طلب عرض تجريبي جديد - {$company} ({$name})";
$encoded_subject = '=?UTF-8?B?' . base64_encode($subject_text) . '?=';

$client_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
$datetime  = date('Y-m-d H:i:s') . ' (KSA Time)';

// HTML Email Body
$html_message = <<<HTML
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b; direction: rtl; }
  .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
  .email-header { background: #071008; padding: 24px 32px; text-align: center; border-bottom: 3px solid #cba321; }
  .email-header h1 { color: #fffad1; font-size: 20px; margin: 0 0 6px 0; }
  .email-header p { color: #94a3b8; font-size: 13px; margin: 0; }
  .email-body { padding: 32px; }
  .info-table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
  .info-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .info-table td.label { font-weight: bold; color: #334155; width: 35%; background: #f8fafc; }
  .info-table td.value { color: #0f172a; }
  .cta-box { text-align: center; margin-top: 24px; }
  .btn-reply { display: inline-block; background: #336f2e; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; }
  .email-footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="email-container">
  <div class="email-header">
    <h1>منصة أوشى (AOSHA) | إشعار طلب عرض تجريبي</h1>
    <p>تم استلام طلب حجز عرض تجريبي جديد من الموقع الإلكتروني الرسمي</p>
  </div>
  <div class="email-body">
    <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">
      مرحباً فريق أوشى،<br>
      قام عميل محتمل بتعبئة نموذج طلب العرض التجريبي من خلال البوابة. فيما يلي تفاصيل الطلب:
    </p>
    
    <table class="info-table">
      <tr>
        <td class="label">الاسم الكريم:</td>
        <td class="value"><strong>{$name}</strong></td>
      </tr>
      <tr>
        <td class="label">اسم المنشأة / الجهة:</td>
        <td class="value"><strong>{$company}</strong></td>
      </tr>
      <tr>
        <td class="label">البريد الإلكتروني:</td>
        <td class="value"><a href="mailto:{$email}">{$email}</a></td>
      </tr>
      <tr>
        <td class="label">رقم الجوال / الهاتف:</td>
        <td class="value"><a href="tel:{$phone}" dir="ltr">{$phone}</a></td>
      </tr>
      <tr>
        <td class="label">المسار المستهدف:</td>
        <td class="value" style="color: #336f2e; font-weight: bold;">{$track}</td>
      </tr>
      <tr>
        <td class="label">تاريخ ووقت الإرسال:</td>
        <td class="value" dir="ltr">{$datetime}</td>
      </tr>
      <tr>
        <td class="label">عنوان IP:</td>
        <td class="value" dir="ltr">{$client_ip}</td>
      </tr>
    </table>

    <div class="cta-box">
      <a href="mailto:{$email}?subject=AOSHA%20Platform%20Demo%20Follow-up" class="btn-reply">الرد مباشرة على العميل</a>
    </div>
  </div>
  <div class="email-footer">
    تم الإرسال تلقائياً من منصة أوشى الرقمية (https://aosha.sa)
  </div>
</div>
</body>
</html>
HTML;

// Headers
$headers   = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/html; charset=UTF-8';
$headers[] = 'From: AOSHA Portal <noreply@aosha.sa>';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: PHP/' . phpversion();

$headers_str = implode("\r\n", $headers);

// Send Email
$mail_sent = @mail($to, $encoded_subject, $html_message, $headers_str);

echo json_encode([
    'success' => true,
    'message' => $lang === 'ar'
        ? 'شكراً لتواصلك مع أوشى! تم استلام طلبك بنجاح وسيتواصل معك فريقنا لترتيب العرض التجريبي.'
        : 'Thank you for contacting AOSHA! Your demo request has been received, and our team will contact you shortly.'
], JSON_UNESCAPED_UNICODE);
exit;
