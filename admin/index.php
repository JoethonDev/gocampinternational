<?php
/**
 * File: /admin/index.php
 * ---
 * The main login page for the admin panel.
 * It handles session starts, login logic, and password verification.
 */

// We must include init.php to start the session.
require_once __DIR__ . '/../init.php';

// --- CONFIGURATION ---
// !! IMPORTANT: Change 'YourSecurePassword' to a strong, unique password.
// To generate your hash:
// 1. Visit a free online tool for "bcrypt password generator"
// 2. Or, create a temporary PHP file with: echo password_hash('YourSecurePassword', PASSWORD_DEFAULT);
// 3. Paste the resulting hash string below.
$ADMIN_USERNAME = 'admin';
$ADMIN_PASSWORD_HASH = '$2a$16$lf4CcujFKAt8bqe5fbaYz.ZZT6qjMoW982hqDEC9LxaJ9a.L9cNdK'; // Default: 'Zeinab2025$#@'

// --- LOGIC ---
$error_message = '';

// 1. Check if user is already logged in
// if (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) {
//     header('Location: /admin/');
//     exit;
// }

// --- ADMIN ROUTING FOR LOGGED-IN USERS ---
if (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) {
    // Route to admin pages if user is logged in
    $requestUri = $_SERVER['REQUEST_URI'];
    $path = trim(parse_url($requestUri, PHP_URL_PATH), '/');

    if ($path === 'admin/dashboard') {
        include __DIR__ . '/dashboard.php';
        exit;
    }
    if ($path === 'admin/programs') {
        include __DIR__ . '/programs.php';
        exit;
    }
    if ($path === 'admin/logout') {
        include __DIR__ . '/logout.php';
        exit;
    }
    if ($path === 'admin/trash') {
        include __DIR__ . '/trash.php';
        exit;
    }
    // Handle admin edit pages with query parameters
    if (preg_match('/^admin\/(edit-destination|edit-program|edit-program-category|edit-faq|item-action)$/', $path)) {
        $page = basename($path);
        include __DIR__ . '/' . $page . '.php';
        exit;
    }
    // Default: redirect to dashboard if logged in and on /admin
    if ($path === 'admin' || $path === 'admin/') {
        header('Location: /admin/dashboard');
        exit;
    }
}

// 2. Check if the form was submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    // Verify username and password
    if ($username === $ADMIN_USERNAME && password_verify($password, $ADMIN_PASSWORD_HASH)) {
        // SUCCESS: Set session and redirect
        $_SESSION['is_admin'] = true;
        
        header('Location: /admin/dashboard');
        exit;
    } else {
        // FAILED: Show an error
        $error_message = 'Invalid username or password.';
    }
}

// --- PAGE RENDER ---
$pageTitle = 'Admin Login';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title><?= htmlspecialchars($pageTitle) ?></title>
    <link rel="icon" type="image/png" href="/images/favi.png">
    
    <?php
    // We only need the styles, not the full header/nav
    require_once __DIR__ . '/../includes/styles.php';
    ?>
    <style>
        html, body {
            height: 100%;
        }
        body {
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: 40px;
            padding-bottom: 40px;
            background-color: #f5f5f5;
        }
        .form-signin {
            width: 100%;
            max-width: 400px;
            padding: 15px;
            margin: auto;
        }
    </style>
</head>
<body class="text-center">

    <main class="form-signin card">
        <form method="POST" action="">
            <img class="mb-4" src="/images/logo.png" alt="Go Camp International" style="height: 70px;">
            <h1 class="h3 mb-3 fw-normal">Admin Panel</h1>

            <?php if ($error_message): ?>
                <div class="alert alert-danger" role="alert">
                    <?= htmlspecialchars($error_message) ?>
                </div>
            <?php endif; ?>

            <div class="form-floating mb-3">
                <input type="text" class="form-control" id="username" name="username" placeholder="Username" required>
                <label for="username">Username</label>
            </div>
            <div class="form-floating">
                <input type="password" class="form-control" id="password" name="password" placeholder="Password" required>
                <label for="password">Password</label>
            </div>
            
            <button class="w-100 btn btn-lg btn-primary mt-3" type="submit">Sign in</button>
            <p class="mt-5 mb-3 text-muted">&copy; <?= date('Y') ?> Go Camp International</p>
        </form>
    </main>

    <?php
    // We only need the scripts, not the full footer
    require_once __DIR__ . '/../includes/scripts.php';
    ?>
</body>
</html>