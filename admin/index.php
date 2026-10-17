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
// NOTE: bcrypt cost 12 (~200-300ms per verify). Previous cost-16 hash took 4-6s on password_verify — do NOT raise cost above 12 on this hosting.
$ADMIN_PASSWORD_HASH = '$2y$12$RndybMoz7OfG8YfN3bcvaud7vGPQOH5ud41KNddcNpd498pbilLaG'; // Default: 'Zeinab2025$#@'

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
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/admin';
    $path = trim(parse_url($requestUri, PHP_URL_PATH), '/');
    // Normalize: accept both /admin/dashboard and legacy /admin/dashboard.php links.
    if (str_ends_with($path, '.php')) {
        $path = substr($path, 0, -4);
    }

    if ($path === 'admin/dashboard') {
        include __DIR__ . '/dashboard.php';
        exit;
    }
    if ($path === 'admin/site-visibility') {
        include __DIR__ . '/edit-site-visibility.php';
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
    if ($path === 'admin/inquiries') {
        include __DIR__ . '/inquiries.php';
        exit;
    }
    if ($path === 'admin/view-inquiry') {
        include __DIR__ . '/view-inquiry.php';
        exit;
    }
    // Handle admin edit pages with query parameters
    if (preg_match('/^admin\/(edit-destination|edit-program|edit-program-category|edit-faq|item-action)$/', $path)) {
        $page = basename($path);
        include __DIR__ . '/' . $page . '.php';
        exit;
    }
    // Default: redirect to dashboard if logged in and on /admin
    // NOTE: $path is trimmed of '/' so it can only ever be 'admin' (never 'admin/').
    if ($path === 'admin') {
        header('Location: /admin/dashboard');
        exit;
    }
}

// CSRF token for login form
if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

// 2. Check if the form was submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Rate-limit: block >5 attempts in 10 minutes
    $attempts = (int)($_SESSION['login_attempts'] ?? 0);
    $lastAttempt = (int)($_SESSION['last_attempt'] ?? 0);
    if ($attempts >= 5 && (time() - $lastAttempt) < 600) {
        $error_message = 'Too many attempts, try again later.';
    } else {
        // Reset counter after window expires
        if ((time() - $lastAttempt) >= 600) {
            $attempts = 0;
            $_SESSION['login_attempts'] = 0;
        }

        $csrf = $_POST['csrf'] ?? '';
        if (!is_string($csrf) || !hash_equals((string)($_SESSION['csrf'] ?? ''), $csrf)) {
            usleep(150000);
            $_SESSION['login_attempts'] = $attempts + 1;
            $_SESSION['last_attempt'] = time();
            $error_message = 'Invalid username or password.';
        } else {
            $username = $_POST['username'] ?? '';
            $password = $_POST['password'] ?? '';

            // Timing-safe username check with early fail (generic error kept)
            $userOk = is_string($username)
                && strlen($username) === strlen($ADMIN_USERNAME)
                && hash_equals($ADMIN_USERNAME, $username);
            if (!$userOk) {
                usleep(150000);
                $_SESSION['login_attempts'] = $attempts + 1;
                $_SESSION['last_attempt'] = time();
                $error_message = 'Invalid username or password.';
            } elseif (password_verify($password, $ADMIN_PASSWORD_HASH)) {
                // Log if hash should be rotated to current cost (admin should update hash constant)
                if (password_needs_rehash($ADMIN_PASSWORD_HASH, PASSWORD_BCRYPT, ['cost' => 12])) {
                    error_log('admin login: ADMIN_PASSWORD_HASH needs rehash to cost 12 — update constant in admin/index.php');
                }
                // SUCCESS: Set session and redirect
                session_regenerate_id(true);
                $_SESSION['is_admin'] = true;
                $_SESSION['login_time'] = time();
                $_SESSION['login_attempts'] = 0;
                unset($_SESSION['last_attempt']);

                header('Location: /admin/dashboard');
                exit;
            } else {
                usleep(150000);
                $_SESSION['login_attempts'] = $attempts + 1;
                $_SESSION['last_attempt'] = time();
                // FAILED: Show a generic error
                $error_message = 'Invalid username or password.';
            }
        }
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
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <!-- Admin Modern CSS -->
    <link rel="stylesheet" href="/admin/css/admin-modern.css">

    <style>
        html, body {
            height: 100%;
        }
        body {
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--bg-body);
            background-image: radial-gradient(circle at 10% 20%, rgb(242, 246, 252) 0%, rgb(230, 236, 245) 90%);
        }
        [data-theme="dark"] body {
            background-image: radial-gradient(circle at 10% 20%, #1a1d21 0%, #212529 90%);
        }
        .login-card {
            width: 100%;
            max-width: 420px;
            border: none;
            border-radius: 1rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            background-color: var(--bg-card);
            color: var(--text-main);
        }
        .form-floating > .form-control {
            background-color: var(--bg-body);
            border-color: var(--border-color);
            color: var(--text-main);
        }
        .form-floating > .form-control:focus {
            background-color: var(--bg-card);
            border-color: var(--primary-color);
            box-shadow: 0 0 0 0.25rem rgba(var(--primary-rgb), 0.1);
        }
        .form-floating > label {
            color: var(--text-muted);
        }
    </style>
</head>
<body class="animate-fade-in">

    <main class="login-card p-4 p-md-5">
        <form method="POST" action="">
            <input type="hidden" name="csrf" value="<?= htmlspecialchars($_SESSION['csrf'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
            <div class="text-center mb-4">
                <img class="mb-4" src="/images/logo.webp" alt="Go Camp International" style="height: 60px;">
                <h1 class="h4 mb-3 fw-bold text-primary">Admin Access</h1>
                <p class="text-muted small">Please sign in to continue to the dashboard.</p>
            </div>

            <?php if ($error_message): ?>
                <div class="alert alert-danger border-0 shadow-sm d-flex align-items-center" role="alert">
                    <i class="bi bi-exclamation-circle-fill me-2"></i>
                    <div><?= htmlspecialchars($error_message) ?></div>
                </div>
            <?php endif; ?>

            <div class="form-floating mb-3">
                <input type="text" class="form-control" id="username" name="username" placeholder="Username" required>
                <label for="username"><i class="bi bi-person me-1"></i> Username</label>
            </div>
            <div class="form-floating mb-4">
                <input type="password" class="form-control" id="password" name="password" placeholder="Password" required>
                <label for="password"><i class="bi bi-lock me-1"></i> Password</label>
            </div>
            
            <button class="w-100 btn btn-lg btn-primary rounded-pill shadow-sm" type="submit">
                Sign In <i class="bi bi-arrow-right ms-2"></i>
            </button>
            
            <div class="mt-5 text-center">
                <p class="mb-0 text-muted small">&copy; <?= date('Y') ?> Go Camp International</p>
            </div>
        </form>
    </main>

    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Theme Script (Inline to prevent FOUC) -->
    <script>
        (function() {
            const savedTheme = localStorage.getItem('admin_theme') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
        })();
    </script>
</body>
</html>