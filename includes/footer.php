<?php
/**
 * File: /includes/footer.php
 * ---
 * This is the global footer for the entire site.
 * It closes the main content, includes the footer HTML, a shared modal, and centralized scripts.
 */
?>
    </main> <!-- End of #main-content -->

    <footer class="footer text-white pt-5 pb-4">
        <div class="container">
            <div class="row gy-4">

                <!-- About Column -->
                <div class="col-lg-3 col-md-6">
                    <h5 class="fw-bold text-uppercase mb-3">About</h5>
                    <ul class="list-unstyled">
                        <li class="mb-2"><a href="/">Home</a></li>
                        <li class="mb-2"><a href="/about">About Us</a></li>
                        <li class="mb-2"><a href="/faq">F.A.Q</a></li>
                        <li><a href="/contact">Contact Us</a></li>
                    </ul>
                </div>

                <!-- Programs Column -->
                <div class="col-lg-3 col-md-6">
                    <h5 class="fw-bold text-uppercase mb-3">Programs</h5>
                    <ul class="list-unstyled">
                        <li class="mb-2"><a href="/program/category?category=kids-camps">Language & Activity</a></li>
                        <li class="mb-2"><a href="/program/category?category=adult-academic">Adult Academic</a></li>
                        <li class="mb-2"><a href="/program/category?category=young-leader-program">Young Leader</a></li>
                        <li><a href="/program/category?category=soccer-camps">Soccer Camps</a></li>
                    </ul>
                </div>

                <!-- Contact Column -->
                <div class="col-lg-3 col-md-6">
                    <h5 class="fw-bold text-uppercase mb-3">Get in Touch</h5>
                    <p class="mb-2">
                        <strong>Zeinab El Sokkary</strong><br>
                        <small>Managing Director</small>
                    </p>
                    <p class="mb-2">
                        <i class="bi bi-telephone-fill me-2"></i>+20 122 171 9621
                    </p>
                    <p>
                        <a href="mailto:Zeinab@gocampinternational.net">
                            <i class="bi bi-envelope-fill me-2"></i>Email Us
                        </a>
                    </p>
                </div>

                <!-- Social & Partners Column -->
                <div class="col-lg-3 col-md-6 text-center text-md-start">
                    <h5 class="fw-bold text-uppercase mb-3">Follow Us</h5>
                    <div class="social-icons mb-4">
                        <a href="https://www.facebook.com/GoCampGo" target="_blank" class="me-2"><img src="/images/facebook_icon.webp" alt="Facebook"></a>
                        <a href="https://www.instagram.com/gocampgo/" target="_blank" class="me-2"><img src="/images/instagram_icon.webp" alt="Instagram"></a>
                        <a href="https://www.linkedin.com/in/zeinab-el-sokkary-97245a34/" target="_blank" class="me-2"><img src="/images/linkin_icon.webp" alt="LinkedIn"></a>
                    </div>
                    <img src="/images/icef_logo.webp" alt="ICEF Accredited" style="max-width: 100px;">
                </div>
            </div>

            <hr class="my-4">

            <div class="row">
                <div class="col-md-6 text-center text-md-start">
                    <small>&copy; <?= date('Y') ?> GO CAMP International. All Rights Reserved.</small>
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <small>Powered by Graphicano</small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Centralized Lead Form Modal -->
    <div class="modal fade" id="ctaModal" tabindex="-1" aria-labelledby="ctaModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold" id="ctaModalLabel">Ready for an Adventure?</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="text-muted mb-4">Leave your details below, and one of our camp experts will contact you shortly.</p>
                    <div class="status-message mb-3" role="status" aria-live="polite"></div>
                    <form id="leadForm" novalidate>
                        <input type="hidden" name="source" value="Modal CTA">
                        <div class="hp-field" aria-hidden="true"><label>Leave empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
                        <div class="mb-3">
                            <label for="nameInput" class="form-label">Full Name</label>
                            <input type="text" class="form-control" name="name" id="nameInput" placeholder="e.g., Ahmed Hassan" required>
                        </div>
                        <div class="mb-3">
                            <label for="emailInput" class="form-label">Email Address</label>
                            <input type="email" class="form-control" name="email" id="emailInput" placeholder="you@example.com" required>
                        </div>
                        <div class="mb-3">
                            <label for="phoneInput" class="form-label">Phone Number</label>
                            <input type="tel" class="form-control" name="phone" id="phoneInput" placeholder="+20 123 456 7890" required>
                        </div>
                        <div class="mb-3">
                            <label for="interestSelect" class="form-label">I'm interested in...</label>
                            <select class="form-select" name="interest" id="interestSelect" required>
                                <option value="" selected disabled>Choose a program type</option>
                                <option>Language & Activity Camps</option>
                                <option>Adult Academic Programs</option>
                                <option>Young Leader Programs</option>
                                <option>Soccer Camps</option>
                                <option>Special Interests Camps</option>
                            </select>
                        </div>
                        <div class="d-grid mt-4">
                            <button type="submit" class="btn btn-warning btn-lg fw-bold">Book a Free Call</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Image lightbox (theme-safe, no library). Wired by ux-enhancements.js -->
    <div class="modal fade" id="imgLightbox" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content bg-transparent border-0 shadow-none">
                <button type="button" class="btn-close btn-close-white ms-auto mb-2" data-bs-dismiss="modal" aria-label="Close"></button>
                <img id="imgLightboxImg" src="" alt="" class="img-fluid rounded-3 shadow-lg w-100" style="max-height: 80vh; object-fit: contain; background: #000;">
            </div>
        </div>
    </div>

    <!-- Sticky mobile CTA (mobile only, uses existing #ctaModal) -->
    <div id="mobileCtaBar" class="d-lg-none">
        <a href="tel:+201221719621" class="btn btn-outline-light flex-fill fw-bold"><i class="bi bi-telephone-fill me-1"></i>Call</a>
        <button type="button" class="btn btn-warning flex-fill fw-bold" data-bs-toggle="modal" data-bs-target="#ctaModal">Book a Free Call</button>
    </div>

    <?php
    // Include all centralized JavaScript files
    require_once __DIR__ . '/scripts.php';
    ?>

    <button id="backToTop" type="button" aria-label="Back to top"><i class="bi bi-arrow-up" aria-hidden="true"></i></button>

</body>
</html>
