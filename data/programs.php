<?php
/**
 * File: /data/programs.php
 * This file contains the data for the main program categories.
 * It holds a single array, $programs, keyed by a URL-friendly slug.
 * UPDATED: 'background_color' and 'text_color' removed as they are no longer needed by the new template.
 */

$programs = [
    'language-and-activity-camps' => [
        'name' => 'Language & Activity Camps',
        'slug' => 'language-and-activity-camps',
        'banner' => '/images/activity_banner_new.jpg',
        'intro' => 'We provide residential Language and activity programs for boys and girls from ages 8 to 17. The programs are a great combination of language classes and afternoon activities.',
        'intro_image' => '/images/langgg_1.jpg',
        'sections' => [
            [
                'title' => 'A World of Activities',
                'content' => '<p>Afternoons are full of sport and activities, according to age. Weekends usually are planned for full day excursions to allow students to learn about the culture and famous sight-seeings of the country.</p><p>Tennis, Horse-riding and soccer are examples of possible extra activities added to the program, coached by professional personnel.</p>',
                'image' => '/images/mmaa_1.jpg',
            ],
            [
                'title' => 'Choose Your Language Destination',
                'content' => '<p>Students can choose where they prefer to attend the required language classes:</p>
                            <ul class="fs-5 lh-lg">
                                <li>French in France, Switzerland or Canada</li>
                                <li>English in UK, Canada, USA</li>
                                <li>German in Germany, Switzerland and Austria</li>
                                <li>Spanish & English in Spain</li>
                            </ul>',
                'image' => '/images/new_iiii.jpg',
            ]
        ],
        'gallery' => [
            '/images/act_1.jpg', '/images/act_2.jpg', '/images/act_3.jpg',
            '/images/act_4.jpg', '/images/act_5.jpg', '/images/act_6.jpg',
        ]
    ],
    'kids-camps' => [
        'name' => 'Kids Camps',
        'slug' => 'kids-camps',
        'banner' => '/images/bannnner.jpg',
        'intro' => 'Kids’ Camps are designed especially for young children (ages 7 to 13) to express their individuality within a truly international mix. With sensitive guidance from well-trained staff (ratio 1 to 5), kids will make big steps forward.',
        'intro_image' => '/images/kids_2.jpg',
        'sections' => [
            [
                'title' => 'Learning Through Play',
                'content' => '<p>Children attend language classes in the morning and participate in group activities and sports during the afternoons. Language classes incorporate themed lessons, storytelling, and fairy tales to provide an engaging platform for teaching vocabulary and grammar.</p>',
                'image' => '/images/kids_3.jpg'
            ],
            [
                'title' => 'Language Course Aims',
                'content' => '<ul class="list-unstyled">
                                <li class="d-flex align-items-start mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Develop linguistic skills through task-based learning.</li>
                                <li class="d-flex align-items-start mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Build social skills and confidence through group work.</li>
                                <li class="d-flex align-items-start"><i class="bi bi-check-circle-fill text-success me-2"></i>Give students a positive learning experience.</li>
                            </ul>',
                'image' => '/images/kids_4.jpg',
            ],
        ],
        'gallery' => [
            '/images/kids_one.jpg', '/images/kids_two.jpg', '/images/kids_three.jpg',
            '/images/kids_four.jpg', '/images/kids_five.jpg', '/images/kids_six.jpg',
        ]
    ],
    'adult-academic' => [
        'name' => 'Adult Academic Programs',
        'slug' => 'adult-academic',
        'banner' => '/images/cambridge_banner.jpg',
        'intro' => 'Our UK programs are designed for a range of ages and goals, from classic English tuition and exam preparation to specialized academic courses.',
        'intro_image' => '/images/inner_england_.jpg',
        'sections' => [
            [
                'title' => 'Core & Specialized Courses',
                'content' => '<ul>
                                <li><strong>Classic Course (9-17 years):</strong> A full program of English tuition, supervised excursions, and on-site activities.</li>
                                <li><strong>Intensive English (14-17 years):</strong> More classroom time to focus on English knowledge and skills.</li>
                                <li><strong>London Explorer (12-17 years):</strong> Combines exploring London with an integrated English language program.</li>
                                <li><strong>First Certificate (FCE) PRE-EXAM PREPARATION:</strong> A 3-week course for students studying towards the FCE.</li>
                                <li><strong>Young Cambridge Scholars:</strong> A subject-based course for academically gifted students, featuring lectures from University of Cambridge lecturers.</li>
                            </ul>',
                'image' => '/images/inner_england_1.jpg',
            ],
        ],
        'gallery' => ['/images/ss_1.jpg', '/images/ss_2.jpg', '/images/ss_3.jpg']
    ],
    'young-leader-program' => [
        'name' => 'Young Leader Programs',
        'slug' => 'young-leader-program',
        'banner' => '/images/young_bbb.jpg',
        'intro' => 'Ideally suited for those interested in world issues and perfecting their English, our Young Leaders program (ages 14-18) develops skills in critical thinking, debating, and leadership.',
        'intro_image' => '/images/young_1.jpg',
        'sections' => [
            ['title' => 'London & Oxford Program', 'content' => '<p>The syllabus comprises theory lessons, interactive lectures, and real-life case studies to build language skills and confidence in public speaking, negotiation, and leadership.</p>', 'image' => '/images/young_new.jpg'],
            ['title' => 'MINI MBA (Ages 15-17)', 'content' => '<p>This course introduces core business concepts including Management, Accounting, Entrepreneurship, and Marketing through lectures, discussions, and case studies.</p>', 'image' => '/images/young_3_new.jpg'],
            ['title' => 'Leadership Program in Boston (Ages 14-18)', 'content' => '<p>Focused on general business and leadership, this program combines Business English with project work, guest lectures, and visits to famous universities.</p>', 'image' => '/images/young_5.jpg']
        ],
        'gallery' => []
    ],
    'soccer-camps' => [
        'name' => 'Soccer Camps',
        'slug' => 'soccer-camps',
        'banner' => '/images/sss_m.jpg',
        'intro' => 'Go Camp International offers unique Soccer Programmes with world-famous Soccer Schools in Spain and England, where students can develop their soccer skills and gain insight into the techniques of champions.',
        'intro_image' => '/images/soccer_2.jpg',
        'sections' => [
            ['title' => 'London: Chelsea FC Soccer School', 'content' => '<ul><li>Intensive soccer training (20 hours/week) for ages 9-17.</li><li>English plus soccer option (12 hours soccer, 15 hours English).</li><li>Specialized goalkeeping courses available.</li></ul>', 'image' => '/images/chelsea.jpg'],
            ['title' => 'Manchester: Soccer Academy', 'content' => '<p>The perfect city for football culture, home to the National Football Museum. The summer academy is aimed at students between 16-21 who wish to practice football and study English.</p>', 'image' => '/images/soccer_1.jpg'],
            ['title' => 'Madrid: Real Madrid Foundation Campus', 'content' => '<ul><li>Standard Soccer training for boys and girls (9-17 years), with optional language courses.</li><li>Technification course for federated players with a good level of soccer.</li></ul>', 'image' => '/images/soccer_3.jpg'],
        ],
        'gallery' => [
            '/images/gallery_1.jpg', '/images/gallery_2.jpg', '/images/gallery_4.jpg',
            '/images/gallery_3.jpg', '/images/gallery_5.jpg', '/images/gallery_6.jpg',
        ]
    ],
    'special-interests-camps' => [
        'name' => 'Special Interests Camps',
        'slug' => 'special-interests-camps',
        'banner' => '/images/special_banner.jpg',
        'intro' => 'Get ready for an extreme outdoor adventure or dive deep into a creative passion. Our special interest camps are designed for students who are ready for something challenging and unique.',
        'intro_image' => '/images/adventure_1.jpg',
        'sections' => [
            ['title' => 'Parent & Child Camp', 'content' => '<p>Don\'t want your kids to travel alone? You can travel together and enjoy a family learning holiday. While your kids are learning with their peers, you can build your English fluency in adult centers nearby.</p>', 'image' => '/images/kids_1_1.jpg'],
            ['title' => 'Film Making', 'content' => '<p>This 2-week course is taught by a professional film production company. Students will be introduced to cameras, draft ideas, film their project, and edit it into a final product to watch and share.</p>', 'image' => '/images/film_1.jpg'],
            ['title' => 'Fashion & Art Programs', 'content' => '<p>We offer both intensive one-year courses and 2-week summer/winter schools. Students develop skills in draping, pattern cutting, sewing, illustration, and styling, as well as artistic mediums like drawing, painting, and sculpture.</p>', 'image' => '/images/fashion.jpg'],
        ],
        'gallery' => []
    ],
];

