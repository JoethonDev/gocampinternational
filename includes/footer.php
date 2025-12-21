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
                        <li class="mb-2"><a href="/index.php">Home</a></li>
                        <li class="mb-2"><a href="/about_us.php">About Us</a></li>
                        <li class="mb-2"><a href="#">F.A.Q</a></li>
                        <li><a href="/contact_us.php">Contact Us</a></li>
                    </ul>
                </div>

                <!-- Programs Column -->
                <div class="col-lg-3 col-md-6">
                    <h5 class="fw-bold text-uppercase mb-3">Programs</h5>
                    <ul class="list-unstyled">
                        <li class="mb-2"><a href="#">Language & Activity</a></li>
                        <li class="mb-2"><a href="#">Adult Academic</a></li>
                        <li class="mb-2"><a href="#">Young Leader</a></li>
                        <li><a href="#">Soccer Camps</a></li>
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
                        <a href="https://www.facebook.com/GoCampGo" target="_blank" class="me-2"><img src="/images/facebook_icon.png" alt="Facebook"></a>
                        <a href="https://www.instagram.com/gocampgo/" target="_blank" class="me-2"><img src="/images/instagram_icon.webp" alt="Instagram"></a>
                        <a href="https://www.linkedin.com/in/zeinab-el-sokkary-97245a34/" target="_blank" class="me-2"><img src="/images/linkin_icon.png" alt="LinkedIn"></a>
                    </div>
                    <img src="/images/icef_logo.png" alt="ICEF Accredited" style="max-width: 100px;">
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
                    <div class="status-message mb-3"></div>
                    <form id="leadForm" novalidate>
                        <input type="hidden" name="source" value="Modal CTA">
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

    <?php
    // Include all centralized JavaScript files
    require_once __DIR__ . '/scripts.php';
    ?>

</body>
</html>
