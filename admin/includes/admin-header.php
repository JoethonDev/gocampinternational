<?php
/**
 * File: /admin/includes/admin-header.php
 * ---
 * This is the global header for the *admin panel*.
 * It includes the main init file and all site styles.
 * It also includes the admin-specific navigation.
 */

// We need init.php for BASE_URL and sessions
require_once __DIR__ . '/../../init.php';

// Set a default page title for the admin area
$pageTitle = $pageTitle ?? 'Go Camp Admin';
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
    // Include all centralized stylesheets from the main site
    // This respects Rule #2 (Theme Lock)
    require_once __DIR__ . '/../../includes/styles.php';
    ?>
    
    <style>
        body {
            /* Ensures admin content doesn't get hidden under the fixed nav */
            padding-top: 56px; 
            background-color: #f8f9fa; /* A light grey for admin */
        }
    </style>
</head>
<body>

    <?php
    // Include the main admin navigation
    require_once __DIR__ . '/admin-nav.php';
    ?>

    <main id="main-content" class="container my-5">