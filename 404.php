<?php
// File: /404.php
// A user-friendly page for handling "Not Found" errors.

http_response_code(404); // Ensure the correct HTTP status code is sent

$pageTitle = 'Page Not Found (404)';
$pageDescription = 'The page you were looking for could not be found.';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navigation.php';
?>

<main>
    <div class="container text-center py-5 my-5">
        <h1 class="display-1 fw-bold text-brand-primary">404</h1>
        <h2 class="mb-4">Page Not Found</h2>
        <p class="lead text-muted mb-4">
            Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <a href="/" class="btn btn-primary btn-lg">
            <i class="bi bi-house-door-fill me-2"></i>
            Go to Homepage
        </a>
    </div>
</main>

<?php
require_once __DIR__ . '/includes/footer.php';
?>
