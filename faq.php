<?php
/**
 * File: /faq.php (NEW)
 * This is the template for displaying all global FAQs.
 */

// --- Page-specific variables ---
$pageTitle = 'Go Camp :: Frequently Asked Questions';
$pageDescription = 'Find answers to common questions about our summer camps, including safety, preparation, and program details.';

// --- Load FAQ Data ---
$faq_content = file_get_contents(__DIR__ . '/data/faq.json');
$faqs_from_json = json_decode($faq_content, true);

// --- Include Header and Navigation ---
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navigation.php';
?>
<main>
    <!-- Simple Banner -->
    <div class="outer_banner_container">
        <div class="banner_container">
            <img src="/images/as_banner.jpg" class="img-page" alt="FAQ Banner" />
            <div class="banner_text" align="center">
                <span class="inner_pages_banner_font">FAQ</span>
            </div>
        </div>
    </div>

     <!-- Breadcrumb -->
    <div class="outer_breadcrumb_container">
        <div class="inner_breadcrumb_container">
            <a href="/">HOME</a> > FAQ
        </div>
    </div>

    <?php
    // --- DYNAMIC FAQ SECTION ---
    // Pass the loaded FAQ data to the faq-section component
    if (!empty($faqs_from_json)) {
        $faqs = $faqs_from_json; // The component expects a variable named $faqs
        require_once __DIR__ . '/sections/faq-section.php';
    }
    ?>
</main>
<?php
// --- Include Footer ---
require_once __DIR__ . '/includes/footer.php';
?>
