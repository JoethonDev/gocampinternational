<?php
/**
 * File: /faq.php
 * Refactored FAQ Page
 */

// 1. Define page-specific variables
$pageTitle = 'Go Camp :: Frequently Asked Questions';
$pageDescription = 'Find answers to common questions about our summer camps, including safety, preparation, and program details.';

// 2. Load FAQ Data
$faq_content = file_get_contents(__DIR__ . '/data/faq.json');
$faqs_from_json = json_decode($faq_content, true);

// 3. Include the global header
require_once __DIR__ . '/includes/header.php';
?>

<div class="container-fluid p-0">
    <div class="position-relative">
        <img src="/images/faq_banner.jpg" class="img-fluid w-100" style="height: 300px; object-fit: cover;" alt="FAQ Banner" />
        <div class="position-absolute top-50 start-50 translate-middle text-center text-white">
            <h1 class="display-4 fw-bold">FAQ</h1>
        </div>
    </div>
</div>

<div class="container py-5">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/index.php">HOME</a></li>
            <li class="breadcrumb-item active" aria-current="page">FAQ</li>
        </ol>
    </nav>

    <?php
    // --- DYNAMIC FAQ SECTION ---
    // Pass the loaded FAQ data to the faq-section component
    if (!empty($faqs_from_json)) {
        $faqs = $faqs_from_json; // The component expects a variable named $faqs
        require_once __DIR__ . '/sections/faq-section.php';
    }
    ?>
</div>

<?php
// 4. Include the global footer
require_once __DIR__ . '/includes/footer.php';
?>
