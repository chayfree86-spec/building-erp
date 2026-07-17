<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check user
$user = DB::select("SELECT id, name, email, mobile, status, password FROM users WHERE email = 'admin@buildingerp.com'");
echo "=== USER ===\n";
print_r($user);

if ($user) {
    $hash = $user[0]->password;
    echo "\n=== PASSWORD VERIFICATION ===\n";
    echo "Hash: " . $hash . "\n";
    echo "Check 'password': " . (Hash::check('password', $hash) ? 'TRUE' : 'FALSE') . "\n";
    echo "Check 'admin123': " . (Hash::check('admin123', $hash) ? 'TRUE' : 'FALSE') . "\n";
}

echo "\n=== LOGIN LOGS ===\n";
$logs = DB::select("SELECT * FROM login_logs ORDER BY created_at DESC LIMIT 10");
print_r($logs);

// Check if login_logs table exists
echo "\n=== TABLES ===\n";
$tables = DB::select("SHOW TABLES LIKE '%login%'");
print_r($tables);

echo "\n=== ROLES ===\n";
$roles = DB::select("SELECT * FROM roles");
print_r($roles);

echo "\n=== ROLE USER (pivot) ===\n";
$roleUser = DB::select("SELECT * FROM role_user WHERE user_id = 1");
print_r($roleUser);

echo "\nDone.\n";
