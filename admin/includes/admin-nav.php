<?php
/**
 * File: /admin/includes/admin-nav.php
 * ---
 * --- MODIFIED (Phase 7) ---
 * - Added "Programs" link to the new master program editor.
 */
?>
<nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background-color: var(--brand-primary);">
    <div class="container">
        <a class="navbar-brand fw-bold" href="/admin/dashboard">
            Go Camp Admin
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavbar" aria-controls="adminNavbar" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="adminNavbar">
            <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                <li class="nav-item">
                    <a class="nav-link" href="/admin/dashboard">Dashboard</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/admin/programs">Programs</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/admin/trash">Trash</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/admin/logout">Logout</a>
                </li>
            </ul>
        </div>
    </div>
</nav>