<?php
/**
 * File: /admin/ajax/upload-media.php
 * ---
 * Handles file uploads from the media modal via AJAX.
 * Supports multiple file uploads.
 */
require_once __DIR__ . '/../auth-check.php'; // Basic security

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'An unknown error occurred.'];
$upload_dir_path = __DIR__ . '/../../images';
$upload_dir_url = '/images';

function processFileUpload($name, $type, $tmp_name, $error, $size, $allowed_types, $upload_dir_path, $upload_dir_url) {
    if ($error !== UPLOAD_ERR_OK) {
        return [
            'success' => false,
            'message' => 'Upload error for file: ' . htmlspecialchars($name),
            'name' => $name
        ];
    }
    if (!in_array($type, $allowed_types)) {
        return [
            'success' => false,
            'message' => 'Invalid file type for ' . htmlspecialchars($name) . '. Only JPG, PNG, GIF, WEBP allowed.',
            'name' => $name
        ];
    }

    // --- Generate Safe, Desktop-like Filename ---
    $file_extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $safe_filename = preg_replace('/[^a-z0-9_-]/i', '_', pathinfo($name, PATHINFO_FILENAME));
    $final_filename = $safe_filename . '.' . $file_extension;
    $upload_path = $upload_dir_path . '/' . $final_filename;
    $counter = 1;
    while (file_exists($upload_path)) {
        $final_filename = $safe_filename . '(' . $counter . ').' . $file_extension;
        $upload_path = $upload_dir_path . '/' . $final_filename;
        $counter++;
    }

    if (move_uploaded_file($tmp_name, $upload_path)) {
        return [
            'success' => true,
            'message' => 'File uploaded successfully!',
            'file' => [
                'name' => $final_filename,
                'url' => $upload_dir_url . '/' . $final_filename
            ]
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Failed to move uploaded file: ' . htmlspecialchars($name) . '. Check server permissions.',
            'name' => $name
        ];
    }
}

// Support multiple uploads
if (isset($_FILES['media_file'])) {
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $files = $_FILES['media_file'];
    $results = [];

    // Handle both single and multiple file uploads
    if (is_array($files['name'])) {
        // Multiple files
        $file_count = count($files['name']);
        for ($i = 0; $i < $file_count; $i++) {
            $name = $files['name'][$i];
            $type = $files['type'][$i];
            $tmp_name = $files['tmp_name'][$i];
            $error = $files['error'][$i];
            $size = $files['size'][$i];

            $result = processFileUpload($name, $type, $tmp_name, $error, $size, $allowed_types, $upload_dir_path, $upload_dir_url);
            $results[] = $result;
        }
    } else {
        // Single file
        $result = processFileUpload($files['name'], $files['type'], $files['tmp_name'], $files['error'], $files['size'], $allowed_types, $upload_dir_path, $upload_dir_url);
        $results[] = $result;
    }
    
    $response = [
        'success' => true,
        'results' => $results
    ];
} else {
    $response['message'] = 'No file received.';
}

echo json_encode($response);
exit;
?>
 */
require_once __DIR__ . '/../auth-check.php'; // Basic security

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'An unknown error occurred.'];
$upload_dir_path = __DIR__ . '/../../images';
$upload_dir_url = '/images';

// Support multiple uploads
if (isset($_FILES['media_file'])) {
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    // No file size limit
    $files = $_FILES['media_file'];
    $results = [];

    // Handle both single and multiple file uploads
    if (is_array($files['name'])) {
        // Multiple files
        $file_count = count($files['name']);
        for ($i = 0; $i < $file_count; $i++) {
            $name = $files['name'][$i];
            $type = $files['type'][$i];
            $tmp_name = $files['tmp_name'][$i];
            $error = $files['error'][$i];
            $size = $files['size'][$i];

            $result = processFileUpload($name, $type, $tmp_name, $error, $size, $allowed_types, $upload_dir_path, $upload_dir_url);
            $results[] = $result;
        }
    } else {
        // Single file
        $result = processFileUpload($files['name'], $files['type'], $files['tmp_name'], $files['error'], $files['size'], $allowed_types, $upload_dir_path, $upload_dir_url);
        $results[] = $result;
    }
    
    $response = [
        'success' => true,
        'results' => $results
    ];
} else {
    $response['message'] = 'No file received.';
}

function processFileUpload($name, $type, $tmp_name, $error, $size, $allowed_types, $upload_dir_path, $upload_dir_url) {

function processFileUpload($name, $type, $tmp_name, $error, $size, $allowed_types, $upload_dir_path, $upload_dir_url) {
    if ($error !== UPLOAD_ERR_OK) {
        return [
            'success' => false,
            'message' => 'Upload error for file: ' . htmlspecialchars($name),
            'name' => $name
        ];
    }
    if (!in_array($type, $allowed_types)) {
        return [
            'success' => false,
            'message' => 'Invalid file type for ' . htmlspecialchars($name) . '. Only JPG, PNG, GIF, WEBP allowed.',
            'name' => $name
        ];
    }
    // No file size check

    // --- Generate Safe, Desktop-like Filename ---
    $file_extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $safe_filename = preg_replace('/[^a-z0-9_-]/i', '_', pathinfo($name, PATHINFO_FILENAME));
    $final_filename = $safe_filename . '.' . $file_extension;
    $upload_path = $upload_dir_path . '/' . $final_filename;
    $counter = 1;
    while (file_exists($upload_path)) {
        $final_filename = $safe_filename . '(' . $counter . ').' . $file_extension;
        $upload_path = $upload_dir_path . '/' . $final_filename;
        $counter++;
    }

    if (move_uploaded_file($tmp_name, $upload_path)) {
        return [
            'success' => true,
            'message' => 'File uploaded successfully!',
            'file' => [
                'name' => $final_filename,
                'url' => $upload_dir_url . '/' . $final_filename
            ]
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Failed to move uploaded file: ' . htmlspecialchars($name) . '. Check server permissions.',
            'name' => $name
        ];
    }
}
}

echo json_encode($response);
exit;
?>
    {
        "id": "italy-fashion",
        "category_slug": "young-professionals-camps",
        "name": "Fashion",
        "tagline": "Immerse yourself in the world of fashion design in the heart of Milan.",
        "image": "/images/italy_fashion.jpg",
        "ages": {
            "min": 15,
            "max": 18
        },
        "duration": "Not Specified",
        "level": "Not Specified",
        "price": "Not Specified",
        "color": "secondary",
        "badges": [
            "New"
        ],
        "highlights": [
            "Introduction to product design and brainstorming for innovative ideas.",
            "Use of AI software to develop unique product concepts.",
            "Learn graphic design techniques for detailed sketches.",
            "Culmination with prototyping, transforming digital ideas into tangible creation."
        ],
        "description": "<p>The Program in Fashion is perfect for young fashion enthusiasts who want to immerse themselves in the world of fashion design. Held in the heart of Milan, participants will have the chance to explore, develop, and showcase their creativity. It is ideal for those aspiring to enter the fashion industry and eager to explore various aspects of the fashion field.</p>",
        "includes": [],
        "excludes": []
    },
    {
        "id": "italy-football-ac-milan",
        "category_slug": "sports-camps",
        "name": "Football with AC Milan",
        "tagline": "Unparalleled football training under the guidance of AC Milan’s Youth Team and Academy coaches.",
        "image": "/images/italy_football.jpg",
        "ages": {
            "min": 8,
            "max": 16
        },
        "duration": "Not Specified",
        "level": "Not Specified",
        "price": "Not Specified",
        "color": "danger",
        "badges": [
            "Official"
        ],
        "highlights": [
            "Unparalleled football training with AC Milan’s Youth Team coaches and official Milan Academy coaches.",
            "Tournaments & Friendly games.",
            "Specialized training for players who are goalkeepers."
        ],
        "description": "<p>This program offers unparalleled football training for boys and girls aged 8 to 16. Training is conducted under the guidance of AC Milan’s Youth Team coaches and official Milan Academy coaches.</p>",
        "includes": [
            "Individual football coaching",
            "Recordings on camera",
            "Performance certificate",
            "AC Milan’s official kit",
            "FB Accommodations",
            "Special camp excursions"
        ],
        "excludes": []
    },
    {
        "id": "italy-food",
        "category_slug": "young-professionals-camps",
        "name": "Food",
        "tagline": "Hands-on experience in Italian cooking, baking, and pastry making, in partnership with IN CONGUSTO INSTITUTE.",
        "image": "/images/italy_food.jpg",
        "ages": {
            "min": 15,
            "max": 18
        },
        "duration": "Intensive 40-hour programme",
        "level": "Not Specified",
        "price": "Not Specified",
        "color": "info",
        "badges": [
            "Partnership"
        ],
        "highlights": [
            "Partnership with IN CONGUSTO INSTITUTE.",
            "Intensive 40-hour programme.",
            "Hands-on experience in Italian cooking, baking, and pastry making.",
            "Exploration of the restaurant business and new culinary formats."
        ],
        "description": "<p>The Italian Gastronomic Arts Summer Campus offers participants hands-on experience in Italian cooking, baking, and pastry making. The program also explores the restaurant business and new culinary formats, making it ideal for students aspiring to access careers in the food industry.</p>",
        "includes": [
            "Practical and theoretical lessons",
            "Equipment and ingredients",
            "Field trips & excursions",
            "Supplementary activities",
            "Special events",
            "Accommodation",
            "Milan sightseeing",
            "Visit to cheese factory"
        ],
        "excludes": []
    },
    {
        "id": "italy-tennis",
        "category_slug": "sports-camps",
        "name": "Tennis",
        "tagline": "High-Performance Junior Tennis Camp for elite training in an iconic Italian destination.",
        "image": "/images/italy_tennis.jpg",
        "ages": {
            "min": "Not Specified",
            "max": "Not Specified"
        },
        "duration": "Not Specified",
        "level": "High-Performance",
        "price": "Not Specified",
        "color": "warning",
        "badges": [
            "Elite"
        ],
        "highlights": [
            "High-level sports training with an educational and stimulating environment.",
            "Elite training in one of Italy’s most iconic tennis destinations.",
            "Develop your game on state-of-the-art courts.",
            "Internal tournaments, and friendly matches."
        ],
        "description": "<p>The High-Performance Junior Tennis Camp is perfect for young tennis players who want to experience elite training and ensures a stimulating environment, guaranteeing young athletes concrete tools for their growth. Participants will develop their game where professional players and national teams have prepared for international success.</p>",
        "includes": [
            "Individual tennis coaching",
            "30 hours of tennis coaching with experienced coaches",
            "Mental game and tactical workshop",
            "Recordings on camera",
            "Performance certificate",
            "Full board accommodation",
            "Closing award ceremony"
        ],
        "excludes": []
    },
    {
        "id": "italy-junior-discovery",
        "category_slug": "kids-camps",
        "name": "Junior Discovery",
        "tagline": "Empowering students to explore their potential through experiential education and blending culture, and adventure.",
        "image": "/images/italy_junior_discovery.jpg",
        "ages": {
            "min": 12,
            "max": 16
        },
        "duration": "Not Specified",
        "level": "Not Specified",
        "price": "Not Specified",
        "color": "success",
        "badges": [
            "New"
        ],
        "highlights": [
            "Empowering students to explore their potential through experiential education.",
            "Innovative summer programs blending education, culture, and adventure.",
            "Camp is entirely conducted in English.",
            "Develop independence, form new friendships, strengthen communication skills, and learn the value of teamwork."
        ],
        "description": "<p>Junior Discovery Camp offers innovative summer programs in the heart of Italy. These camps provide a comprehensive learning environment where students can explore their potential.</p>",
        "includes": [],
        "excludes": []
    },
    {
        "id": "italy-sailing",
        "category_slug": "sports-camps",
        "name": "Sailing",
        "tagline": "A thrilling sailing voyage exploring the stunning islands off Italy’s coast for core nautical skills and teamwork.",
        "image": "/images/italy_sailing.jpg",
        "ages": {
            "min": 12,
            "max": 16
        },
        "duration": "Not Specified",
        "level": "Not Specified",
        "price": "Not Specified",
        "color": "primary",
        "badges": [
            "Adventure"
        ],
        "highlights": [
            "Extraordinary sailing adventure exploring the stunning islands off Italy’s coast.",
            "Campers learn core nautical skills and experience life aboard 50-foot yachts.",
            "Sail as part of a three-yacht flotilla, guided by experienced instructors.",
            "Participate in interactive lessons on marine life and local history."
        ],
        "description": "<p>A thrilling sailing voyage enriched with local knowledge and new horizons for 12 to 16-year-olds. Campers navigate the Mediterranean’s bluest waters while growing as a team. British RYA instructors and native English-speaking counselors lead the entire program in English. Through hands-on learning, campers learn sailing techniques, teamwork, and leadership, building communication skills and self-reliance. Students earn a sailing certificate of achievement.</p>",
        "includes": [],
        "excludes": []
    }
]