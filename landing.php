<?php
/**
 * File: /landing.php
 * High-converting landing page for marketing campaigns.
 * Form submission is handled directly within this file.
 */

// --- FORM PROCESSING LOGIC ---
$errors = [];
$successMessage = '';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize and retrieve form data
    $name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
    $age = filter_input(INPUT_POST, 'age', FILTER_SANITIZE_STRING);
    $gender = filter_input(INPUT_POST, 'gender', FILTER_SANITIZE_STRING);
    $interests = isset($_POST['interests']) ? implode(', ', $_POST['interests']) : 'Not specified';
    $destination = filter_input(INPUT_POST, 'destination', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $phone = filter_input(INPUT_POST, 'phone', FILTER_SANITIZE_STRING);
    $travel_time = filter_input(INPUT_POST, 'travel_time', FILTER_SANITIZE_STRING);
    $privacyConsent = isset($_POST['privacyConsent']);

    // Validation
    if (empty($name)) $errors[] = "Child's Name is required.";
    if (empty($age)) $errors[] = "Child's Age is required.";
    if (empty($gender)) $errors[] = "Gender is required.";
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "A valid Parent's Email is required.";
    if (empty($phone)) $errors[] = "Parent's Phone is required.";
    if (!$privacyConsent) $errors[] = "You must agree to the privacy terms.";

    if (empty($errors)) {
        $to = "zeinab@gocampinternational.net"; // Your email address
        $from = "info@gocampinternational.com"; // A professional "from" address
        $emailSubject = "New Landing Page Lead: " . $name;
        
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=utf-8\r\n";
        $headers .= "From: Go Camp International <" . $from . ">\r\n";
        $headers .= "Reply-To: " . $email . "\r\n";

        $message = '<html><body>';
        $message .= '<h2>New Lead from Landing Page</h2>';
        $message .= '<p><strong>Child\'s Name:</strong> ' . htmlspecialchars($name) . '</p>';
        $message .= '<p><strong>Child\'s Age:</strong> ' . htmlspecialchars($age) . '</p>';
        $message .= '<p><strong>Gender:</strong> ' . htmlspecialchars($gender) . '</p>';
        $message .= '<p><strong>Interests:</strong> ' . htmlspecialchars($interests) . '</p>';
        $message .= '<p><strong>Preferred Destination:</strong> ' . htmlspecialchars($destination) . '</p>';
        $message .= '<p><strong>Parent\'s Email:</strong> ' . htmlspecialchars($email) . '</p>';
        $message .= '<p><strong>Parent\'s Phone:</strong> ' . htmlspecialchars($phone) . '</p>';
        $message .= '<p><strong>Planned Travel Time:</strong> ' . htmlspecialchars($travel_time) . '</p>';
        $message .= '</body></html>';

        if (mail($to, $emailSubject, $message, $headers)) {
            $successMessage = '🎉 Success! Your request has been submitted. Our camp advisor will contact you within 2 hours!';
        } else {
            $errors[] = 'Sorry, there was an error sending your message. Please try again later.';
        }
    }
}

// --- SEO & META ---
$pageTitle = 'Transform Your Teen\'s Future - International Summer Programs | Go Camp';
$pageDescription = 'Elite international summer camps for ambitious teens. Sports academies, language immersion, leadership programs. 20+ years trusted by 10,000+ families.';

require_once __DIR__ . '/includes/header.php';
?>
<!-- Landing Page Specific Styles and Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
/* Landing Page Custom Styles */
:root {
    --primary-color: #00a4c0; --accent-color: #F9BB08; --success-color: #28a745; --danger-color: #dc3545; --dark-color: #1a1a2e; --light-bg: #f8f9fa; --gradient-primary: linear-gradient(135deg, #00a4c0 0%, #0088a3 100%); --gradient-accent: linear-gradient(135deg, #F9BB08 0%, #e0a800 100%); --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.1); --shadow-md: 0 10px 30px rgba(0, 0, 0, 0.15); --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.25);
}
body {
    font-family: 'Inter', sans-serif; line-height: 1.6; color: var(--dark-color); overflow-x: hidden; padding-top: 0 !important; /* Override global padding */
}
h1, h2, h3, h4, h5, h6 {
    font-family: 'Poppins', sans-serif; font-weight: 700;
}
.hero-landing {
    position: relative; min-height: 100vh; background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #0d1b2a 100%); overflow: hidden; padding-top: 100px;
}
.hero-headline {
    font-size: 3.5rem; font-weight: 800; line-height: 1.2; margin-bottom: 20px; color: #fff; text-shadow: 2px 4px 8px rgba(0, 0, 0, 0.3);
}
.hero-headline .highlight {
    background: var(--gradient-accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; position: relative;
}
.hero-subheadline {
    font-size: 1.4rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 30px; font-weight: 400; line-height: 1.6;
}
.hero-usp-list {
    list-style: none; margin-bottom: 30px; padding: 0;
}
.hero-usp-list li {
    color: #fff; font-size: 1.1rem; margin-bottom: 15px; display: flex; align-items: center; gap: 15px;
}
.hero-usp-list li i {
    color: var(--accent-color); font-size: 1.3rem; flex-shrink: 0;
}
.hero-stats {
    background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 15px; padding: 25px; margin-top: 40px;
}
.stat-item { text-align: center; }
.stat-number { font-size: 2.5rem; font-weight: 800; color: var(--accent-color); display: block; font-family: 'Poppins', sans-serif; }
.stat-label { font-size: 0.9rem; color: rgba(255, 255, 255, 0.8); text-transform: uppercase; letter-spacing: 1px; }
.form-container { position: relative; z-index: 10; }
.lead-form-card { background: #fff; border-radius: 20px; padding: 40px; box-shadow: var(--shadow-lg); position: sticky; top: 120px; }
.form-header { text-align: center; margin-bottom: 30px; }
.form-title { font-size: 1.8rem; color: var(--primary-color); margin-bottom: 10px; font-weight: 700; }
.form-subtitle { color: #666; font-size: 1rem; }
.urgency-banner { background: var(--gradient-accent); color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 25px; text-align: center; font-weight: 600; }
.form-group { margin-bottom: 25px; }
.form-label { font-weight: 600; color: var(--dark-color); margin-bottom: 8px; display: block; font-size: 0.95rem; }
.form-label .required { color: var(--danger-color); }
.form-control, .form-select { width: 100%; padding: 14px 18px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 1rem; transition: all 0.3s ease; }
.form-control:focus, .form-select:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 4px rgba(0, 164, 192, 0.1); }
.input-icon { position: relative; }
.input-icon i { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #999; font-size: 1.1rem; }
.input-icon .form-control { padding-left: 50px; }
.interest-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
.interest-option { position: relative; }
.interest-option input[type="checkbox"] { position: absolute; opacity: 0; }
.interest-label { display: block; padding: 15px; border: 2px solid #e0e0e0; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.3s ease; font-weight: 600; }
.interest-label i { display: block; font-size: 1.5rem; margin-bottom: 8px; color: var(--primary-color); }
.interest-option input[type="checkbox"]:checked + .interest-label { background: var(--gradient-primary); color: #fff; border-color: var(--primary-color); transform: translateY(-3px); box-shadow: var(--shadow-md); }
.interest-option input[type="checkbox"]:checked + .interest-label i { color: #fff; }
.btn-submit-landing { background: var(--gradient-accent); color: #fff; flex: 1; font-size: 1.1rem; padding: 18px 30px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px; }
.btn-submit-landing:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(249, 187, 8, 0.4); }
.form-trust { text-align: center; margin-top: 25px; padding-top: 25px; border-top: 1px solid #e0e0e0; }
.trust-item { display: inline-flex; align-items: center; gap: 8px; color: #666; font-size: 0.9rem; margin: 0 15px; }
.trust-item i { color: var(--success-color); font-size: 1.1rem; }
.why-section, .testimonial-section { padding: 80px 0; background: var(--light-bg); }
.section-header { text-align: center; margin-bottom: 60px; }
.section-title { font-size: 2.5rem; color: var(--dark-color); margin-bottom: 15px; }
.section-subtitle { font-size: 1.2rem; color: #666; max-width: 600px; margin: 0 auto; }
.benefit-card { background: #fff; border-radius: 15px; padding: 35px; text-align: center; height: 100%; transition: all 0.3s ease; border: 2px solid transparent; }
.benefit-card:hover { transform: translateY(-10px); box-shadow: var(--shadow-md); border-color: var(--primary-color); }
.benefit-icon { width: 80px; height: 80px; margin: 0 auto 25px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #fff; }
.benefit-title { font-size: 1.3rem; color: var(--dark-color); margin-bottom: 15px; }
.benefit-text { color: #666; line-height: 1.8; }
.guarantee-section { padding: 60px 0; background: var(--gradient-primary); color: #fff; text-align: center; }
.guarantee-badge { width: 120px; height: 120px; background: var(--accent-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px; font-size: 3rem; box-shadow: var(--shadow-lg); }
.guarantee-title { font-size: 2rem; margin-bottom: 15px; }
@media (max-width: 991px) {
    .hero-headline { font-size: 2.5rem; }
    .lead-form-card { position: static; margin-top: 40px; }
}
</style>

<body>
    <!-- NOTE: A dedicated landing page often omits the main navigation to reduce distractions and improve focus on the CTA. -->

    <main>
        <section class="hero-landing">
            <div class="container">
                <div class="row align-items-center">
                    <!-- Left Column - Value Proposition -->
                    <div class="col-lg-6 mb-5 mb-lg-0">
                        <h1 class="hero-headline">
                            Transform Your Teen's Future with <span class="highlight">Global Adventures</span>
                        </h1>
                        <p class="hero-subheadline">
                            Elite international programs combining language mastery, leadership skills, and lifelong friendships. Give your child the competitive edge.
                        </p>
                        <ul class="hero-usp-list">
                            <li><i class="fas fa-check-circle"></i> <strong>Safe & Supervised:</strong> 24/7 care with certified staff</li>
                            <li><i class="fas fa-check-circle"></i> <strong>Proven Results:</strong> 95% boost in confidence & language skills</li>
                            <li><i class="fas fa-check-circle"></i> <strong>Premium Experience:</strong> Top facilities across 25+ countries</li>
                        </ul>
                        <div class="hero-stats">
                            <div class="row">
                                <div class="col-4 stat-item"><span class="stat-number">20+</span><span class="stat-label">Years Experience</span></div>
                                <div class="col-4 stat-item"><span class="stat-number">25+</span><span class="stat-label">Countries</span></div>
                                <div class="col-4 stat-item"><span class="stat-number">98%</span><span class="stat-label">Satisfaction</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column - Lead Form -->
                    <div class="col-lg-6 form-container">
                        <div class="lead-form-card">
                            <div class="form-header">
                                <h2 class="form-title"><i class="fas fa-gift"></i> Get Your Free Consultation</h2>
                                <p class="form-subtitle">Discover the perfect program for your teen in 60 seconds</p>
                            </div>

                            <div class="urgency-banner">
                                <i class="fas fa-clock"></i>
                                <span>⚡ Limited Spots for Summer 2025!</span>
                            </div>

                            <?php if ($successMessage): ?>
                                <div class="alert alert-success"><?= $successMessage ?></div>
                            <?php endif; ?>
                            <?php if (!empty($errors)): ?>
                                <div class="alert alert-danger">
                                    <ul>
                                        <?php foreach ($errors as $error): ?>
                                            <li><?= htmlspecialchars($error) ?></li>
                                        <?php endforeach; ?>
                                    </ul>
                                </div>
                            <?php endif; ?>

                            <form id="leadForm" method="POST" action="/landing" novalidate>
                                <!-- All form fields go here -->
                                <div class="form-group">
                                    <label class="form-label">Child's Full Name <span class="required">*</span></label>
                                    <div class="input-icon">
                                        <i class="fas fa-user"></i>
                                        <input type="text" name="name" class="form-control" placeholder="e.g., Ahmed Mohamed" required>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label class="form-label">Child's Age <span class="required">*</span></label>
                                            <select name="age" class="form-select" required>
                                                <option value="">Select age</option>
                                                <?php for ($age = 7; $age <= 18; $age++): ?>
                                                    <option value="<?= $age ?>"><?= $age ?> years old</option>
                                                <?php endfor; ?>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                         <div class="form-group">
                                            <label class="form-label">Gender <span class="required">*</span></label>
                                            <select name="gender" class="form-select" required>
                                                <option value="">Select gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                 <div class="form-group">
                                    <label class="form-label">What interests your child? <small>(Select all that apply)</small></label>
                                    <div class="interest-grid">
                                        <div class="interest-option">
                                            <input type="checkbox" name="interests[]" value="Sports" id="sports"><label for="sports" class="interest-label"><i class="fas fa-futbol"></i><span>Sports</span></label>
                                        </div>
                                        <div class="interest-option">
                                            <input type="checkbox" name="interests[]" value="Language" id="language"><label for="language" class="interest-label"><i class="fas fa-language"></i><span>Language</span></label>
                                        </div>
                                        <div class="interest-option">
                                            <input type="checkbox" name="interests[]" value="Leadership" id="leadership"><label for="leadership" class="interest-label"><i class="fas fa-users"></i><span>Leadership</span></label>
                                        </div>
                                        <div class="interest-option">
                                            <input type="checkbox" name="interests[]" value="Academic" id="academic"><label for="academic" class="interest-label"><i class="fas fa-graduation-cap"></i><span>Academic</span></label>
                                        </div>
                                    </div>
                                </div>
                                 <div class="form-group">
                                    <label class="form-label">Parent's Email <span class="required">*</span></label>
                                    <div class="input-icon">
                                        <i class="fas fa-envelope"></i>
                                        <input type="email" name="email" class="form-control" placeholder="parent@example.com" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Parent's Phone (WhatsApp) <span class="required">*</span></label>
                                    <div class="input-icon">
                                        <i class="fab fa-whatsapp"></i>
                                        <input type="tel" name="phone" class="form-control" placeholder="+20 123 456 7890" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="privacyConsent" name="privacyConsent" required>
                                        <label class="form-check-label" for="privacyConsent" style="font-size: 0.9rem;">I agree to receive personalized program recommendations.</label>
                                    </div>
                                </div>

                                <div class="d-grid">
                                     <button type="submit" class="btn-submit-landing"><i class="fas fa-rocket"></i> Get My Free Consultation</button>
                                </div>
                            </form>
                             <div class="form-trust">
                                <div class="trust-item"><i class="fas fa-shield-alt"></i><span>100% Secure</span></div>
                                <div class="trust-item"><i class="fas fa-clock"></i><span>Reply in 2 Hours</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Other sections like "Why Choose Us", "Testimonials", etc. -->
        <section class="why-section">
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">Why 10,000+ Parents Trust Us</h2>
                    <p class="section-subtitle">More than just a summer camp - it's a life-changing experience</p>
                </div>
                <div class="row g-4">
                    <div class="col-lg-4 col-md-6">
                        <div class="benefit-card">
                            <div class="benefit-icon"><i class="fas fa-shield-alt"></i></div>
                            <h3 class="benefit-title">Safety You Can Trust</h3>
                            <p class="benefit-text">24/7 supervision by certified staff, comprehensive insurance, and real-time parent updates.</p>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6">
                         <div class="benefit-card">
                            <div class="benefit-icon"><i class="fas fa-chart-line"></i></div>
                            <h3 class="benefit-title">Proven Academic Results</h3>
                            <p class="benefit-text">95% of students improve language skills by 2+ levels and report better academic performance.</p>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6">
                        <div class="benefit-card">
                            <div class="benefit-icon"><i class="fas fa-globe-americas"></i></div>
                            <h3 class="benefit-title">Global Network</h3>
                            <p class="benefit-text">Build lifelong friendships with teens from 50+ countries and access top universities.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

         <section class="guarantee-section">
            <div class="container">
                <div class="guarantee-badge"><i class="fas fa-award"></i></div>
                <h2 class="guarantee-title">Our 100% Satisfaction Guarantee</h2>
                <p class="guarantee-text">Your satisfaction and your child's safety are our top priorities. We stand by our programs with a comprehensive guarantee.</p>
            </div>
        </section>
    </main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
