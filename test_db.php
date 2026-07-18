<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$u = App\Models\User::where('email', 'admin@buildingerp.com')->first();
if ($u) {
    echo "Check 2310 pin: " . (Hash::check('2310', $u->pin) ? 'TRUE' : 'FALSE') . "\n";
    echo "Check 2310 password: " . (Hash::check('2310', $u->password) ? 'TRUE' : 'FALSE') . "\n";
    echo "Check password password: " . (Hash::check('password', $u->password) ? 'TRUE' : 'FALSE') . "\n";
    echo "Check preg_match mobile status: " . (preg_match('/^[0-9+\s-]*$/', trim($u->mobile)) ? 'TRUE' : 'FALSE') . "\n";
}
