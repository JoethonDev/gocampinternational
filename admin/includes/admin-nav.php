<?php
/**
 * File: /admin/includes/admin-nav.php
 * ---
 * --- MODIFIED (Phase 7) ---
 * - Added "Programs" link to the new master program editor.
 */
?>
<nav class="navbar navbar-expand-lg fixed-top">
    <div class="container">
        <a class="navbar-brand" href="/admin/dashboard">
            Go Camp Admin
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavbar" aria-controls="adminNavbar" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="adminNavbar">
            <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
                <li class="nav-item">
                    <a class="nav-link" href="/admin/dashboard">Dashboard</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/admin/programs.php">Programs</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/admin/inquiries.php">Inquiries</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/admin/trash">Trash</a>
                </li>
                
                <!-- Theme Switcher -->
                <li class="nav-item dropdown ms-lg-3">
                    <a class="nav-link dropdown-toggle" href="#" id="themeDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-palette"></i> Theme
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="themeDropdown">
                        <li><button class="dropdown-item" onclick="setTheme('light')"><i class="bi bi-sun me-2"></i> Light</button></li>
                        <li><button class="dropdown-item" onclick="setTheme('dark')"><i class="bi bi-moon-stars me-2"></i> Dark</button></li>
                        <li><button class="dropdown-item" onclick="setTheme('dainty')"><i class="bi bi-flower1 me-2"></i> Dainty One Pro</button></li>
                    </ul>
                </li>

                <li class="nav-item ms-lg-2">
                    <a class="nav-link text-danger" href="/admin/logout">Logout</a>
                </li>
            </ul>
        </div>
    </div>
</nav>

<script>
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('admin-theme', theme);
    }
</script>