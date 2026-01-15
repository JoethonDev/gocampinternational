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
                    <form id="contactForm" data-form-type="contact">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="contact-name" class="form-label">Name *</label>
                                <input type="text" id="contact-name" name="name" class="form-control" required>
                            </div>
                            <div class="col-md-6">
                                <label for="contact-email" class="form-label">Email *</label>
                                <input type="email" id="contact-email" name="email" class="form-control" required>
                            </div>
                            <div class="col-md-6">
                                <label for="contact-phone" class="form-label">Phone</label>
                                <input type="tel" id="contact-phone" name="phone" class="form-control">
                            </div>
                             <div class="col-md-6">
                                <label for="contact-country" class="form-label">Country</label>
                                <input type="text" id="contact-country" name="country" class="form-control">
                            </div>
                            <div class="col-12">
                                <label for="contact-subject" class="form-label">Subject</label>
                                <input type="text" id="contact-subject" name="subject" class="form-control">
                            </div>
                            <div class="col-12">
                                <label for="contact-message" class="form-label">Message</label>
                                <textarea id="contact-message" name="message" class="form-control" rows="5"></textarea>
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
                <div class="card-body p-4 p-md-5 d-flex flex-column justify-content-center align-items-center text-center">
                    
                    <div class="mb-4 position-relative">
                        <img src="/images/profile.jpg" alt="Zeinab El Sokkary" 
                             class="rounded-circle shadow-lg" 
                             style="width: 160px; height: 160px; object-fit: cover; border: 5px solid rgba(255,255,255,0.2);">
                    </div>

                    <h3 class="fw-bold text-white mb-1">Zeinab El Sokkary</h3>
                    <p class="text-white-50 fs-5 mb-4 text-uppercase fw-semibold tracking-wide" style="letter-spacing: 1px;">Managing Director</p>

                    <div class="d-flex flex-column gap-3 w-100 px-md-3">
                        <a href="tel:+201221719621" class="btn btn-outline-light border-0 py-3 px-4 d-flex align-items-center justify-content-start gap-3 rounded-3" style="background-color: rgba(255,255,255,0.1);">
                            <div class="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; color: var(--brand-primary) !important;">
                                <i class="bi bi-telephone-fill"></i>
                            </div>
                            <span class="fs-5 fw-semibold">+20 122 171 9621</span>
                        </a>

                        <a href="mailto:Zeinab@gocampinternational.net" class="btn btn-outline-light border-0 py-3 px-4 d-flex align-items-center justify-content-start gap-3 rounded-3" style="background-color: rgba(255,255,255,0.1);">
                            <div class="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; color: var(--brand-primary) !important;">
                                <i class="bi bi-envelope-fill"></i>
                            </div>
                            <span class="fs-5 fw-semibold text-truncate w-100 text-start">Zeinab@gocampinternational.net</span>
                        </a>
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
