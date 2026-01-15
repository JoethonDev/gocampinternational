<?php
/**
 * File: /about_us.php
 * Refactored About Us Page
 */

// 1. Define page-specific variables
$pageTitle = 'Go Camp :: About Us';
$pageDescription = 'With 20 years of experience, Go Camp International combines excellent language education with a wide range of leisure, sport, and sightseeing activities.';

// 2. Include the global header
require_once __DIR__ . '/includes/header.php';
?>

<div class="container-fluid p-0">
    <div class="position-relative">
        <img src="/images/about_banner.jpg" class="img-fluid w-100" style="height: 300px; object-fit: cover;" alt="Students sitting on grass" />
        <div class="position-absolute top-50 start-50 translate-middle text-center text-white">
            <h1 class="display-4 fw-bold">ABOUT US</h1>
        </div>
    </div>
</div>

<div class="container py-5">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/index.php">HOME</a></li>
            <li class="breadcrumb-item active" aria-current="page">ABOUT US</li>
        </ol>
    </nav>

    <!-- Main unique content for the About Us page starts here -->
    <div class="row g-5">
        <div class="col-12">
            <!-- Section 1: Our Mission -->
            <div class="card shadow-sm border-0 overflow-hidden mb-5">
                <div class="row g-0">
                    <div class="col-lg-5">
                        <img src="/images/about_1.jpg" class="img-fluid h-100" alt="About Us" />
                    </div>
                    <div class="col-lg-7 d-flex align-items-center">
                        <div class="card-body p-5">
                            <h2 class="card-title mb-3">About Us</h2>
                            <p class="fs-5 lh-lg text-secondary">
                                With over 15 years of experience in organizing international summer camps and short-term educational programs, we specialize in creating meaningful overseas experiences for children and young learners.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section 2: Our Approach -->
            <div class="card shadow-sm border-0 overflow-hidden mb-5">
                <div class="row g-0 flex-row-reverse">
                    <div class="col-lg-5">
                        <img src="/images/about_2.jpg" class="img-fluid h-100" alt="Academic, Sports, and Culture" />
                    </div>
                    <div class="col-lg-7 d-flex align-items-center">
                        <div class="card-body p-5">
                            <h2 class="card-title mb-3">Our Approach</h2>
                            <p class="fs-5 lh-lg text-secondary">
                                Our programs go beyond traditional language courses. We thoughtfully combine high-quality academic learning with sports, cultural exploration, and guided leisure activities—ensuring every student learns, grows, and enjoys every moment of their journey.
                            </p>
                            <p class="fs-5 lh-lg text-secondary mb-0">
                                We believe that exposure to new cultures, environments, and challenges at a young age plays a powerful role in shaping confident, independent, and globally minded individuals. That’s why our philosophy centers on offering students the opportunity to discover their interests, develop real-world skills, and build lifelong memories in a safe and supportive international setting.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section 3: Collaboration & Transparency -->
            <div class="card shadow-sm border-0 overflow-hidden mb-5">
                <div class="row g-0">
                    <div class="col-lg-5">
                        <img src="/images/about_3.jpg" class="img-fluid h-100" alt="Collaboration and Transparency" />
                    </div>
                    <div class="col-lg-7 d-flex align-items-center">
                        <div class="card-body p-5">
                            <h2 class="card-title mb-3">Beyond Camps: Schools, Parents & Global Collaboration</h2>
                            <p class="fs-5 lh-lg text-secondary">
                                We also regularly host parent presentations, orientation sessions, and partner-led meetings—both independently and in cooperation with our international partners. These events allow parents and students to gain direct insight into programs, destinations, safety standards, and educational outcomes.
                            </p>
                            <p class="fs-5 lh-lg text-secondary mb-0">
                                Through these face-to-face interactions, parents can ask questions, meet representatives from overseas institutions, and feel confident about every step of their child’s journey.<br><br>
                                Our long-standing partnerships and on-the-ground experience ensure that every program is delivered with transparency, care, and international best practices.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fourth Section -->
             <div class="card shadow-sm border-0 overflow-hidden">
                <div class="row g-0 flex-row-reverse">
                    <div class="col-lg-5">
                        <img src="/images/about_img_3.jpg" class="img-fluid h-100" style="object-fit: cover;" alt="Students doing an activity"/>
                    </div>
                    <div class="col-lg-7 d-flex align-items-center">
                        <div class="card-body p-5">
                           <h2 class="card-title mb-3">Safety and Welfare</h2>
                            <p class="fs-5 lh-lg text-secondary">
                                Go Camp International is committed to provide stimulating, challenging and safe learning environment for children and students with the highest quality product available worldwide. The safety and wellbeing of campers is the most essential part of the summer programs. They are cared for from the moment they arrive at the destination airport, until the summer camp is over.
                            </p>
                        </div>
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
