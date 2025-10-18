<?php
/**
 * File: /contact_us.php
 * Refactored Contact Us Page
 */

// 1. Define page-specific variables
$pageTitle = 'Go Camp :: Contact Us';
$pageDescription = 'Get in touch with Go Camp. Contact us via phone, email, or our online form for any inquiries about our programs.';

// 2. Include the global header
require_once __DIR__ . '/includes/header.php';
?>

<div class="container-fluid p-0">
    <div class="position-relative">
        <img src="/images/contact_banner.jpg" class="img-fluid w-100" style="height: 300px; object-fit: cover;" alt="Contact Us Banner" />
        <div class="position-absolute top-50 start-50 translate-middle text-center text-white">
            <h1 class="display-4 fw-bold">CONTACT US</h1>
        </div>
    </div>
</div>

<div class="container py-5">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/index.php">HOME</a></li>
            <li class="breadcrumb-item active" aria-current="page">CONTACT US</li>
        </ol>
    </nav>
    <div class="text-center mb-5">
        <h2 class="section-title">Get in touch! We'd love to hear from you.</h2>
    </div>

    <div class="row g-4">
        <!-- Contact Form -->
        <div class="col-lg-7">
            <div class="card border-0 shadow-sm">
                <div class="card-body p-4 p-md-5">
                     <h3 class="card-title mb-4">Send Us a Message</h3>
                    <!-- Form can be enhanced with JS/API later -->
                    <form id="contactForm">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="contact-name" class="form-label">Name *</label>
                                <input type="text" id="contact-name" class="form-control" required>
                            </div>
                            <div class="col-md-6">
                                <label for="contact-email" class="form-label">Email *</label>
                                <input type="email" id="contact-email" class="form-control" required>
                            </div>
                            <div class="col-md-6">
                                <label for="contact-phone" class="form-label">Phone</label>
                                <input type="tel" id="contact-phone" class="form-control">
                            </div>
                             <div class="col-md-6">
                                <label for="contact-country" class="form-label">Country</label>
                                <input type="text" id="contact-country" class="form-control">
                            </div>
                            <div class="col-12">
                                <label for="contact-subject" class="form-label">Subject</label>
                                <input type="text" id="contact-subject" class="form-control">
                            </div>
                            <div class="col-12">
                                <label for="contact-message" class="form-label">Message</label>
                                <textarea id="contact-message" class="form-control" rows="5"></textarea>
                            </div>
                            <div class="col-12 text-end">
                                <button type="submit" class="btn btn-warning btn-lg">Send Message</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Contact Info -->
        <div class="col-lg-5">
            <div class="card border-0 shadow-sm h-100" style="background-color: var(--brand-primary); color: white;">
                <div class="card-body p-4 p-md-5">
                    <h3 class="card-title text-white mb-4">Contact Information</h3>
                    <ul class="list-unstyled fs-5">
                        <li class="mb-3">
                            <strong>Person:</strong><br>
                            Zeinab El Sokkary (Managing Director)
                        </li>
                        <li class="mb-3">
                             <strong>Phone:</strong><br>
                             <a href="tel:+201221719621" class="text-white text-decoration-none">+20 122 171 9621</a>
                        </li>
                         <li class="mb-3">
                            <strong>Email:</strong><br>
                            <a href="mailto:Zeinab@gocampinternational.net" class="text-white text-decoration-none">Zeinab@gocampinternational.net</a>
                        </li>
                    </ul>
                     <div class="mt-4">
                        <iframe src="https://www.google.com/maps/d/embed?mid=zLY0XCu3oM_k.k95PuDsYnDCw&z=14" width="100%" height="250" style="border:0; border-radius: 8px;" allowfullscreen="" loading="lazy"></iframe>
                     </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
// 3. Include the global footer
require_once __DIR__ . '/includes/footer.php';
?>
