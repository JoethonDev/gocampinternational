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
            <!-- First Section -->
            <div class="card shadow-sm border-0 overflow-hidden mb-5">
                <div class="row g-0">
                    <div class="col-lg-5">
                        <img src="/images/about_map.jpg" class="img-fluid h-100" style="object-fit: cover;" alt="Map illustration" />
                    </div>
                    <div class="col-lg-7 d-flex align-items-center">
                        <div class="card-body p-5">
                            <h2 class="card-title mb-3">Our Philosophy</h2>
                            <p class="fs-5 lh-lg text-secondary">
                                With 20 years of experience in organizing summer language camps and short programs all over the world, we combine an excellent language education with wide range of leisure, sport, and sightseeing activities. We believe that children should be offered as many opportunities to experience new things as possible. Our philosophy is directed to allow all students and young campers to find their life experience.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Second Section -->
            <div class="card shadow-sm border-0 overflow-hidden mb-5">
                <div class="row g-0 flex-row-reverse">
                     <div class="col-lg-5">
                        <img src="/images/about_img_2.jpg" class="img-fluid h-100" style="object-fit: cover;" alt="Group of students smiling"/>
                    </div>
                    <div class="col-lg-7 d-flex align-items-center">
                        <div class="card-body p-5">
                             <h2 class="card-title mb-3">Our Experience</h2>
                             <p class="fs-5 lh-lg text-secondary">
                                The Owner & Founder of GO Camp International has long experience in the field of Education as well as Travel and Tourism. This allowed us to offer best service for summer programs as well as counseling students who are willing to STUDY ABROAD or parents who are considering sending their kids for boarding schools. Each client is given exclusive counseling till reaching their final decision on their chosen programs. We are also ready to organize Cultural Educational School Travel all over the year.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Third Section -->
             <div class="card shadow-sm border-0 overflow-hidden mb-5">
                <div class="row g-0">
                    <div class="col-lg-5">
                        <img src="/images/about_img_4.jpg" class="img-fluid h-100" style="object-fit: cover;" alt="Students in a classroom" />
                    </div>
                    <div class="col-lg-7 d-flex align-items-center">
                        <div class="card-body p-5">
                             <h2 class="card-title mb-3">Our Global Reach</h2>
                            <p class="fs-5 lh-lg text-secondary">
                               Go Camp International has a wealth of experience in promoting its summer and educational programmes at school events. Meeting parents and learning about their needs and expectations for their children allows us to expand our global destinations. The increase in demand for international travel experiences among students has enabled us to contract with one of the biggest travel companies in England.
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
                           <h2 class="card-title mb-3">Safety and Welfare</h3>
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
