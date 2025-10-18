<?php
/**
 * File: /includes/navigation.php
 *
 * This is the global, dynamic navigation bar for the site.
 * It automatically populates the dropdown menus by reading the data files.
 */

// Load the data sources to build the navigation links
require_once __DIR__ . '/../data/programs.php';
require_once __DIR__ . '/../data/destinations.php';
?>
<nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background-color: var(--brand-primary);">
    <div class="container">
        <a class="navbar-brand" href="/">
            <img src="/images/logo.png" alt="Go Camp International Logo" style="height: 60px;">
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNavbar">
            <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
                <li class="nav-item">
                    <a class="nav-link" href="/">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/about">About Us</a>
                </li>

                <!-- Dynamic Programs Dropdown -->
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="programsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Programs
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="programsDropdown">
                        <li><a class="dropdown-item" href="/programs">All Programs</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <?php if (isset($programs) && is_array($programs)) : ?>
                            <?php foreach ($programs as $program) : ?>
                                <li><a class="dropdown-item" href="/programs/<?= htmlspecialchars($program['slug']) ?>"><?= htmlspecialchars($program['name']) ?></a></li>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </ul>
                </li>

                <!-- Dynamic Destinations Dropdown -->
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="destinationsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Destinations
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="destinationsDropdown">
                        <?php if (isset($destinations) && is_array($destinations)) : ?>
                            <?php foreach ($destinations as $destination) : ?>
                                <li><a class="dropdown-item" href="/destinations/<?= htmlspecialchars($destination['slug']) ?>"><?= htmlspecialchars($destination['name']) ?></a></li>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </ul>
                </li>

                <li class="nav-item">
                    <a class="nav-link" href="/faq">FAQ</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/contact">Contact</a>
                </li>
            </ul>
            <button class="btn btn-warning ms-lg-3" data-bs-toggle="modal" data-bs-target="#ctaModal">Book Now</button>
        </div>
    </div>
</nav>

