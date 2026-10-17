<?php
/**
 * File: /includes/header.php
 * ---
 * This is the global header for the entire site.
 * It includes the document head, metadata, and the centralized stylesheet manager.
 */

require_once __DIR__ . '/../init.php';

// Set default values for variables if they haven't been defined on the calling page.
$pageTitle = $pageTitle ?? 'Go Camp International';
$pageDescription = $pageDescription ?? 'International camps offering life-changing opportunities for teenagers to learn, grow, and make global connections.';
$ogImage = $ogImage ?? BASE_URL . '/images/logo.webp';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle) ?></title>

    <!-- SEO and Social Meta -->
    <meta name="description" content="<?= htmlspecialchars($pageDescription) ?>">
    <?php if (!empty($pageRobots)): ?>
    <meta name="robots" content="<?= htmlspecialchars($pageRobots) ?>">
    <?php endif; ?>
    <?php
    // Build canonical URL safely (guard REQUEST_URI, use BASE_URL).
    $requestUriForMeta = $_SERVER['REQUEST_URI'] ?? '/';
    $baseUrlForMeta = defined('BASE_URL') ? BASE_URL : '';
    $canonicalUrl = $baseUrlForMeta . htmlspecialchars($requestUriForMeta);
    ?>
    <link rel="canonical" href="<?= $canonicalUrl ?>">
    <meta property="og:title" content="<?= htmlspecialchars($pageTitle) ?>" />
    <meta property="og:description" content="<?= htmlspecialchars($pageDescription) ?>" />
    <meta property="og:image" content="<?= htmlspecialchars($ogImage) ?>" />
    <meta property="og:url" content="<?= $canonicalUrl ?>" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Go Camp International" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="<?= htmlspecialchars($pageTitle) ?>" />
    <meta name="twitter:description" content="<?= htmlspecialchars($pageDescription) ?>" />

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/images/favi.png">

    <?php
    // Include all centralized stylesheets
    require_once __DIR__ . '/styles.php';
    ?>

</head>
<body>
    <a class="visually-hidden-focusable" href="#main-content">Skip to main content</a>

    <?php
    // Include the main navigation
    require_once __DIR__ . '/navigation.php';
    ?>

    <!-- Main content container starts here, will be closed in footer.php -->
    <main id="main-content">
