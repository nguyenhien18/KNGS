-- =========================================================
-- DATABASE: KET NOI GIA SU (FULL SCHEMA THEO MO TA NGHIEP VU)
-- MySQL 8+
-- =========================================================

CREATE DATABASE IF NOT EXISTS kngs
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE kngs;




-- 1) USERS 

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role ENUM('ADMIN', 'LEARNER', 'TUTOR') NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL UNIQUE,
    birth_date DATE NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') DEFAULT 'OTHER',
    avatar VARCHAR(255) NULL,
    address VARCHAR(255) NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- 2) TUTORS

CREATE TABLE tutors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    description TEXT NULL,
    experience VARCHAR(255) NULL,
    qualification VARCHAR(255) NULL,
    teaching_mode ENUM('ONLINE', 'OFFLINE', 'BOTH') DEFAULT 'BOTH',
    province VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    hourly_rate DECIMAL(12,2) NULL,
    profile_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'BLOCKED') DEFAULT 'PENDING',
    reviewed_by BIGINT NULL,
    reviewed_at DATETIME NULL,
    rejected_reason VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_tutors_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tutors_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;


-- 3) SUBJECTS

CREATE TABLE subjects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;


-- 4) GRADES

CREATE TABLE grades (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;


-- 5) TUTOR_TEACHINGS 

CREATE TABLE tutor_teachings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tutor_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    grade_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tutor_teachings_tutor
        FOREIGN KEY (tutor_id) REFERENCES tutors(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tutor_teachings_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tutor_teachings_grade
        FOREIGN KEY (grade_id) REFERENCES grades(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_tutor_teaching UNIQUE (tutor_id, subject_id, grade_id)
) ENGINE=InnoDB;


-- 6) POSTS (bài đăng tìm gia sư)


CREATE TABLE posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    learner_user_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    grade_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    teaching_mode ENUM('ONLINE', 'OFFLINE', 'BOTH') DEFAULT 'BOTH',
    study_time VARCHAR(255) NULL,
    budget DECIMAL(12,2) NULL,
    province VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    address_detail VARCHAR(255) NULL,
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    approved_by BIGINT NULL,
    approved_at DATETIME NULL,
    rejected_reason VARCHAR(255) NULL,
    status ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CLOSED') DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_posts_learner_user
        FOREIGN KEY (learner_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_posts_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_posts_grade
        FOREIGN KEY (grade_id) REFERENCES grades(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_posts_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;


-- 7) APPLICATIONS

CREATE TABLE applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    tutor_id BIGINT NOT NULL,
    message TEXT NULL,
    expected_fee DECIMAL(12,2) NULL,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_applications_post
        FOREIGN KEY (post_id) REFERENCES posts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_applications_tutor
        FOREIGN KEY (tutor_id) REFERENCES tutors(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_application_post_tutor UNIQUE (post_id, tutor_id)
) ENGINE=InnoDB;


-- 8) MATCHED_CLASSES (lớp 1-1 từ bài đăng)

CREATE TABLE matched_classes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL UNIQUE,
    application_id BIGINT NOT NULL UNIQUE,
    start_date DATE NULL,
    end_date DATE NULL,
    status ENUM(
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETION_REQUESTED',
        'COMPLETED',
        'CANCELLATION_REQUESTED',
        'CANCELLED'
    ) DEFAULT 'ASSIGNED',
    status_requested_by_user_id BIGINT NULL,
    status_requested_by_role VARCHAR(20) NULL,
    status_requested_at DATETIME NULL,
    status_request_reason TEXT NULL,
    assigned_at DATETIME NULL,
    completed_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_matched_classes_post
        FOREIGN KEY (post_id) REFERENCES posts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_matched_classes_application
        FOREIGN KEY (application_id) REFERENCES applications(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;


-- 9) TUTOR_COURSES (lớp/khóa học gia sư tự mở)

CREATE TABLE tutor_courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tutor_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    subject_id BIGINT NOT NULL,
    grade_id BIGINT NOT NULL,
    teaching_mode ENUM('ONLINE', 'OFFLINE', 'BOTH') DEFAULT 'BOTH',
    study_time VARCHAR(255) NULL,
    price DECIMAL(12,2) NULL,
    max_students INT NULL,
    province VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    address_detail VARCHAR(255) NULL,
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    approved_by BIGINT NULL,
    approved_at DATETIME NULL,
    rejected_reason VARCHAR(255) NULL,
    status ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CLOSED') DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_tutor_courses_tutor
        FOREIGN KEY (tutor_id) REFERENCES tutors(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tutor_courses_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tutor_courses_grade
        FOREIGN KEY (grade_id) REFERENCES grades(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tutor_courses_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_tutor_courses_max_students CHECK (max_students IS NULL OR max_students > 0)
) ENGINE=InnoDB;


-- 10) COURSE_ENROLLMENTS

CREATE TABLE course_enrollments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    learner_user_id BIGINT NOT NULL,
    message TEXT NULL,
    agreed_fee DECIMAL(12,2) NULL,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    joined_at DATETIME NULL,
    completed_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_course_enrollments_course
        FOREIGN KEY (course_id) REFERENCES tutor_courses(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_course_enrollments_learner
        FOREIGN KEY (learner_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_course_enrollment UNIQUE (course_id, learner_user_id)
) ENGINE=InnoDB;


-- 11) REVIEWS


CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    learner_user_id BIGINT NOT NULL,
    tutor_id BIGINT NOT NULL,
    class_id BIGINT NULL UNIQUE,
    course_enrollment_id BIGINT NULL UNIQUE,
    rating INT NOT NULL,
    comment TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_learner_user
        FOREIGN KEY (learner_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reviews_tutor
        FOREIGN KEY (tutor_id) REFERENCES tutors(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reviews_class
        FOREIGN KEY (class_id) REFERENCES matched_classes(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reviews_course_enrollment
        FOREIGN KEY (course_enrollment_id) REFERENCES course_enrollments(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_single_target CHECK (
        (class_id IS NOT NULL AND course_enrollment_id IS NULL)
        OR (class_id IS NULL AND course_enrollment_id IS NOT NULL)
    )
) ENGINE=InnoDB;


-- 12) NOTIFICATIONS

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NULL,
    reference_type VARCHAR(50) NULL,
    reference_id BIGINT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;


-- 13) IDENTITY_VERIFICATIONS

CREATE TABLE identity_verifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    status ENUM('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'NOT_SUBMITTED',
    full_name_on_id VARCHAR(120) NULL,
    id_number VARCHAR(20) NULL,
    date_of_birth_on_id DATE NULL,
    issued_date DATE NULL,
    issued_place VARCHAR(255) NULL,
    address_on_id VARCHAR(255) NULL,
    id_front_image_url VARCHAR(500) NULL,
    id_back_image_url VARCHAR(500) NULL,
    selfie_image_url VARCHAR(500) NULL,
    reviewed_by BIGINT NULL,
    reviewed_at DATETIME NULL,
    rejected_reason VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_identity_verifications_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_identity_verifications_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;


-- 14) TUTOR_CERTIFICATES

CREATE TABLE tutor_certificates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tutor_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    certificate_type VARCHAR(50) NULL,
    issuer VARCHAR(255) NULL,
    issued_date DATE NULL,
    certificate_image_url VARCHAR(500) NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    reviewed_by BIGINT NULL,
    reviewed_at DATETIME NULL,
    rejected_reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_tutor_certificates_tutor
        FOREIGN KEY (tutor_id) REFERENCES tutors(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tutor_certificates_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;


-- 15) INDEXES FOR COMMON FILTER/SORT QUERIES

CREATE INDEX idx_users_role_created_at
    ON users (role, created_at);

CREATE INDEX idx_users_status_created_at
    ON users (status, created_at);

CREATE INDEX idx_users_role_status_created_at
    ON users (role, status, created_at);

CREATE INDEX idx_tutors_profile_status_created_at
    ON tutors (profile_status, created_at);

CREATE INDEX idx_tutor_teachings_subject_grade_tutor
    ON tutor_teachings (subject_id, grade_id, tutor_id);

CREATE INDEX idx_posts_approval_status_created_at
    ON posts (approval_status, status, created_at);

CREATE INDEX idx_posts_learner_approval_created_at
    ON posts (learner_user_id, approval_status, created_at);

CREATE INDEX idx_applications_tutor_status_created_at
    ON applications (tutor_id, status, created_at);

CREATE INDEX idx_applications_post_status_created_at
    ON applications (post_id, status, created_at);

CREATE INDEX idx_tutor_courses_approval_status_created_at
    ON tutor_courses (approval_status, status, created_at);

CREATE INDEX idx_tutor_courses_tutor_status_created_at
    ON tutor_courses (tutor_id, status, created_at);

CREATE INDEX idx_tutor_courses_lookup
    ON tutor_courses (subject_id, grade_id, teaching_mode, province, district);

CREATE INDEX idx_course_enrollments_course_status_created_at
    ON course_enrollments (course_id, status, created_at);

CREATE INDEX idx_course_enrollments_learner_created_at
    ON course_enrollments (learner_user_id, created_at);

CREATE INDEX idx_reviews_tutor_created_at
    ON reviews (tutor_id, created_at);

CREATE INDEX idx_notifications_user_read_created_at
    ON notifications (user_id, is_read, created_at);

CREATE INDEX idx_identity_verifications_status_created_at
    ON identity_verifications (status, created_at);

CREATE INDEX idx_tutor_certificates_tutor_status
    ON tutor_certificates (tutor_id, status);


-- 16) SAMPLE DATA FOR TESTING
-- Password for all sample accounts: 12345678
-- BCrypt hash below is a valid hash for "12345678".

START TRANSACTION;

INSERT IGNORE INTO subjects (id, name) VALUES
    (1, 'Toán'),
    (2, 'Ngữ văn'),
    (3, 'Tiếng Anh'),
    (4, 'Vật lý'),
    (5, 'Hóa học'),
    (6, 'Sinh học'),
    (7, 'Lịch sử'),
    (8, 'Địa lý'),
    (9, 'Tin học'),
    (10, 'IELTS');

INSERT IGNORE INTO grades (id, name) VALUES
    (1, 'Lớp 1'),
    (2, 'Lớp 2'),
    (3, 'Lớp 3'),
    (4, 'Lớp 4'),
    (5, 'Lớp 5'),
    (6, 'Lớp 6'),
    (7, 'Lớp 7'),
    (8, 'Lớp 8'),
    (9, 'Lớp 9'),
    (10, 'Lớp 10'),
    (11, 'Lớp 11'),
    (12, 'Lớp 12');

INSERT IGNORE INTO users (
    id, role, email, password, full_name, phone, birth_date, gender, avatar, address, status, created_at, updated_at
) VALUES
    (1, 'ADMIN', 'admin1@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Quản Trị Viên', '0900000001', '1990-01-01', 'OTHER', NULL, 'Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 'LEARNER', 'hocvien1@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Nguyễn Văn An', '0900000002', '2006-03-12', 'MALE', NULL, 'Cầu Giấy, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 'LEARNER', 'hocvien2@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Trần Gia Bình', '0900000003', '2007-07-20', 'MALE', NULL, 'Thanh Xuân, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 55 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 'LEARNER', 'hocvien3@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Lê Minh Chi', '0900000004', '2008-05-15', 'FEMALE', NULL, 'Quận 1, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 50 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (5, 'LEARNER', 'hocvien4@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Phạm Quang Dũng', '0900000005', '2005-11-05', 'MALE', NULL, 'Hải Châu, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (6, 'LEARNER', 'hocvien5@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Đỗ Minh Khang', '0900000006', '2006-09-09', 'OTHER', NULL, 'Ba Đình, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (10, 'TUTOR', 'giasu1@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Nguyễn Đức Minh', '0900000010', '1995-02-12', 'MALE', NULL, 'Đống Đa, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (11, 'TUTOR', 'giasu2@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Trần Thu Lan', '0900000011', '1993-04-18', 'FEMALE', NULL, 'Cầu Giấy, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 78 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (12, 'TUTOR', 'giasu3@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Lê Thanh Hòa', '0900000012', '1991-08-21', 'MALE', NULL, 'Quận 3, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 76 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (13, 'TUTOR', 'giasu4@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Phạm Mai Anh', '0900000013', '1996-12-02', 'FEMALE', NULL, 'Hải Châu, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 74 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (14, 'TUTOR', 'giasu5@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Phạm Hoàng Nam', '0900000014', '1998-06-10', 'OTHER', NULL, 'Hà Đông, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
    (15, 'TUTOR', 'giasu6@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Võ Quốc Bảo', '0900000015', '1994-10-10', 'MALE', NULL, 'Thủ Đức, TP. Hồ Chí Minh', 'BLOCKED', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW());

INSERT IGNORE INTO tutors (
    id, user_id, description, experience, qualification, teaching_mode, province, district, hourly_rate,
    profile_status, reviewed_by, reviewed_at, rejected_reason, created_at, updated_at
) VALUES
    (1, 10, 'Gia sư Toán cấp 3, ôn thi THPT.', '5 năm dạy Toán 10-12', 'Đại học Sư phạm Hà Nội', 'BOTH', 'Hà Nội', 'Đống Đa', 250000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 70 DAY), NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (2, 11, 'Gia sư Tiếng Anh giao tiếp và ngữ pháp.', '7 năm dạy Tiếng Anh', 'IELTS 8.0', 'ONLINE', 'Hà Nội', 'Cầu Giấy', 300000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 68 DAY), NULL, DATE_SUB(NOW(), INTERVAL 78 DAY), DATE_SUB(NOW(), INTERVAL 68 DAY)),
    (3, 12, 'Gia sư Hóa - Lý theo lộ trình cá nhân.', '6 năm dạy Hóa học và Vật lý', 'Đại học Khoa học Tự nhiên', 'OFFLINE', 'TP. Hồ Chí Minh', 'Quận 3', 280000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 65 DAY), NULL, DATE_SUB(NOW(), INTERVAL 76 DAY), DATE_SUB(NOW(), INTERVAL 65 DAY)),
    (4, 13, 'Gia sư IELTS và tiếng Anh học thuật.', '4 năm luyện IELTS', 'IELTS 8.5', 'ONLINE', 'Đà Nẵng', 'Hải Châu', 350000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 74 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (5, 14, 'Hồ sơ gia sư đang chờ admin duyệt.', '2 năm trợ giảng', 'Sinh viên năm 4', 'BOTH', 'Hà Nội', 'Hà Đông', 180000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
    (6, 15, 'Hồ sơ bị khóa để test phân quyền.', '3 năm', 'Cử nhân', 'OFFLINE', 'TP. Hồ Chí Minh', 'Thủ Đức', 200000, 'BLOCKED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), 'Tài khoản bị khóa để test', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW());

INSERT IGNORE INTO identity_verifications (
    id, user_id, status, full_name_on_id, id_number, date_of_birth_on_id, issued_date, issued_place,
    address_on_id, id_front_image_url, id_back_image_url, selfie_image_url, reviewed_by, reviewed_at,
    rejected_reason, created_at, updated_at
) VALUES
    (1, 2, 'APPROVED', 'Nguyễn Văn An', '001206000001', '2006-03-12', '2022-01-10', 'Hà Nội', 'Cầu Giấy, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 50 DAY)),
    (2, 3, 'APPROVED', 'Trần Gia Bình', '001207000002', '2007-07-20', '2022-02-11', 'Hà Nội', 'Thanh Xuân, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 49 DAY), NULL, DATE_SUB(NOW(), INTERVAL 50 DAY), DATE_SUB(NOW(), INTERVAL 49 DAY)),
    (3, 4, 'APPROVED', 'Lê Minh Chi', '079208000003', '2008-05-15', '2022-03-12', 'TP. Hồ Chí Minh', 'Quận 1, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 48 DAY), NULL, DATE_SUB(NOW(), INTERVAL 49 DAY), DATE_SUB(NOW(), INTERVAL 48 DAY)),
    (4, 5, 'APPROVED', 'Phạm Quang Dũng', '048205000004', '2005-11-05', '2021-04-13', 'Đà Nẵng', 'Hải Châu, Đà Nẵng', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 47 DAY), NULL, DATE_SUB(NOW(), INTERVAL 48 DAY), DATE_SUB(NOW(), INTERVAL 47 DAY)),
    (5, 6, 'APPROVED', 'Đỗ Minh Khang', '001206000005', '2006-09-09', '2022-05-14', 'Hà Nội', 'Ba Đình, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 30 DAY), NULL, DATE_SUB(NOW(), INTERVAL 31 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),
    (6, 10, 'APPROVED', 'Nguyễn Đức Minh', '001195000010', '1995-02-12', '2018-01-01', 'Hà Nội', 'Đống Đa, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 70 DAY), NULL, DATE_SUB(NOW(), INTERVAL 71 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (7, 11, 'APPROVED', 'Trần Thu Lan', '001193000011', '1993-04-18', '2017-01-01', 'Hà Nội', 'Cầu Giấy, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 68 DAY), NULL, DATE_SUB(NOW(), INTERVAL 69 DAY), DATE_SUB(NOW(), INTERVAL 68 DAY)),
    (8, 12, 'APPROVED', 'Lê Thanh Hòa', '079191000012', '1991-08-21', '2016-01-01', 'TP. Hồ Chí Minh', 'Quận 3, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 65 DAY), NULL, DATE_SUB(NOW(), INTERVAL 66 DAY), DATE_SUB(NOW(), INTERVAL 65 DAY)),
    (9, 13, 'APPROVED', 'Phạm Mai Anh', '048196000013', '1996-12-02', '2018-02-02', 'Đà Nẵng', 'Hải Châu, Đà Nẵng', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 61 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (10, 14, 'PENDING', 'Phạm Hoàng Nam', '001198000014', '1998-06-10', '2019-03-03', 'Hà Nội', 'Hà Đông, Hà Nội', NULL, NULL, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
    (11, 15, 'REJECTED', 'Võ Quốc Bảo', '079194000015', '1994-10-10', '2018-04-04', 'TP. Hồ Chí Minh', 'Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 8 DAY), 'Ảnh giấy tờ không rõ', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY));

INSERT IGNORE INTO tutor_teachings (id, tutor_id, subject_id, grade_id, created_at) VALUES
    (1, 1, 1, 10, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (2, 1, 1, 11, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (3, 1, 1, 12, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (4, 1, 9, 9, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (5, 2, 3, 8, DATE_SUB(NOW(), INTERVAL 68 DAY)),
    (6, 2, 3, 9, DATE_SUB(NOW(), INTERVAL 68 DAY)),
    (7, 2, 3, 10, DATE_SUB(NOW(), INTERVAL 68 DAY)),
    (8, 2, 10, 12, DATE_SUB(NOW(), INTERVAL 68 DAY)),
    (9, 3, 4, 11, DATE_SUB(NOW(), INTERVAL 65 DAY)),
    (10, 3, 5, 10, DATE_SUB(NOW(), INTERVAL 65 DAY)),
    (11, 3, 5, 11, DATE_SUB(NOW(), INTERVAL 65 DAY)),
    (12, 3, 5, 12, DATE_SUB(NOW(), INTERVAL 65 DAY)),
    (13, 4, 3, 10, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (14, 4, 3, 11, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (15, 4, 10, 12, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (16, 5, 1, 8, DATE_SUB(NOW(), INTERVAL 20 DAY)),
    (17, 6, 4, 10, DATE_SUB(NOW(), INTERVAL 20 DAY));

INSERT IGNORE INTO posts (
    id, learner_user_id, subject_id, grade_id, title, description, teaching_mode, study_time, budget,
    province, district, address_detail, approval_status, approved_by, approved_at, rejected_reason,
    status, created_at, updated_at
) VALUES
    (1, 2, 1, 12, 'Cần gia sư Toán 12 ôn thi THPT', 'Cần học 3 buổi mỗi tuần, tập trung hàm số và hình học.', 'BOTH', 'Tối thứ 2,4,6', 300000, 'Hà Nội', 'Cầu Giấy', 'Gần DH Quốc gia', 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (2, 2, 3, 10, 'Học Tiếng Anh lớp 10 từ mất gốc', 'Cần gia sư kiên nhẫn, dạy ngữ pháp cơ bản.', 'ONLINE', 'Tối thứ 3,5', 220000, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 11 DAY), NULL, 'ASSIGNED', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY)),
    (3, 3, 4, 11, 'Cần gia sư Vật lý 11', 'Tập trung điện xoay chiều và bài tập nâng cao.', 'OFFLINE', 'Chiều thứ 7', 260000, 'Hà Nội', 'Thanh Xuân', 'Gần Ngã Tư Sở', 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 20 DAY), NULL, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
    (4, 3, 5, 12, 'Ôn Hóa 12 cấp tốc', 'Cần tổng ôn chương Este và Amin.', 'ONLINE', 'Sáng chủ nhật', 280000, 'Hà Nội', 'Thanh Xuân', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 30 DAY), NULL, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (5, 4, 1, 9, 'Tìm gia sư Toán 9', 'Cần học đề thi vào lớp 10.', 'OFFLINE', 'Tối thứ 2,5', 200000, 'TP. Hồ Chí Minh', 'Quận 1', 'Gần chợ Bến Thành', 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (6, 4, 6, 10, 'Sinh học 10 cần bổ sung kiến thức', 'Bài đăng bị từ chối để test admin.', 'ONLINE', 'Cuối tuần', 180000, 'TP. Hồ Chí Minh', 'Quận 1', NULL, 'REJECTED', 1, DATE_SUB(NOW(), INTERVAL 5 DAY), 'Nội dung cần bổ sung thông tin lịch học', 'OPEN', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (7, 5, 10, 12, 'Cần gia sư IELTS target 6.5', 'Học online, luyện speaking và writing.', 'ONLINE', 'Tối thứ 2,4', 350000, 'Đà Nẵng', 'Hải Châu', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 7 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (8, 5, 2, 8, 'Ngữ văn lớp 8', 'Bài đăng đã hủy để test trạng thái.', 'BOTH', 'Linh động', 170000, 'Đà Nẵng', 'Hải Châu', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 15 DAY), NULL, 'CANCELLED', DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
    (9, 6, 1, 6, 'Tìm gia sư Toán lớp 6', 'Dữ liệu kiểm tra giới hạn tạo bài mỗi ngày của học viên.', 'ONLINE', 'Tối thứ 2', 150000, 'Hà Nội', 'Ba Đình', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_ADD(CURDATE(), INTERVAL 9 HOUR), DATE_ADD(CURDATE(), INTERVAL 9 HOUR)),
    (10, 6, 3, 7, 'Tìm gia sư Tiếng Anh lớp 7', 'Dữ liệu kiểm tra giới hạn tạo bài mỗi ngày của học viên.', 'ONLINE', 'Tối thứ 3', 150000, 'Hà Nội', 'Ba Đình', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_ADD(CURDATE(), INTERVAL 10 HOUR), DATE_ADD(CURDATE(), INTERVAL 10 HOUR)),
    (11, 6, 5, 8, 'Tìm gia sư Hóa lớp 8', 'Dữ liệu kiểm tra giới hạn tạo bài mỗi ngày của học viên.', 'ONLINE', 'Tối thứ 4', 150000, 'Hà Nội', 'Ba Đình', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_ADD(CURDATE(), INTERVAL 11 HOUR), DATE_ADD(CURDATE(), INTERVAL 11 HOUR)),
    (12, 6, 9, 9, 'Tìm gia sư Tin học lớp 9', 'Dữ liệu kiểm tra giới hạn tạo bài mỗi ngày của học viên.', 'ONLINE', 'Tối thứ 5', 150000, 'Hà Nội', 'Ba Đình', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_ADD(CURDATE(), INTERVAL 12 HOUR), DATE_ADD(CURDATE(), INTERVAL 12 HOUR)),
    (13, 2, 1, 12, 'Lớp đang chờ xác nhận hoàn thành', 'Dùng để test COMPLETION_REQUESTED.', 'BOTH', 'Tối thứ 7', 320000, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 19 DAY), NOW()),
    (14, 3, 3, 10, 'Lớp đang chờ xác nhận hủy', 'Dùng để test CANCELLATION_REQUESTED.', 'ONLINE', 'Tối chủ nhật', 230000, 'Hà Nội', 'Thanh Xuân', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 13 DAY), NULL, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 14 DAY), NOW()),
    (15, 5, 8, 9, 'Cần gia sư Địa lý 9', 'Cần học theo sách giáo khoa và đề cương.', 'ONLINE', 'Tối thứ 6', 160000, 'Đà Nẵng', 'Hải Châu', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (16, 4, 7, 8, 'Cần gia sư Lịch sử 8', 'Học theo chủ đề và ôn kiểm tra.', 'BOTH', 'Cuối tuần', 160000, 'TP. Hồ Chí Minh', 'Quận 1', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO applications (id, post_id, tutor_id, message, expected_fee, status, created_at, updated_at) VALUES
    (1, 1, 1, 'Tôi có kinh nghiệm ôn thi THPT môn Toán.', 280000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (2, 1, 2, 'Tôi có thể hỗ trợ online nếu cần học thêm tiếng Anh.', 260000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (3, 2, 2, 'Nhận dạy Tiếng Anh lớp 10 từ cơ bản.', 220000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY)),
    (4, 3, 1, 'Có thể dạy Vật lý theo lộ trình đề thi.', 260000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
    (5, 4, 3, 'Nhận ôn Hóa 12 cấp tốc.', 280000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 35 DAY)),
    (6, 7, 4, 'Nhận luyện IELTS online target 6.5.', 350000, 'PENDING', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (7, 7, 2, 'Có thể dạy speaking và grammar.', 300000, 'REJECTED', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
    (8, 8, 1, 'Đơn đã bị hủy theo bài đăng.', 170000, 'CANCELLED', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
    (9, 13, 1, 'Lớp để test yêu cầu hoàn thành.', 320000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY)),
    (10, 14, 2, 'Lớp để test yêu cầu hủy.', 230000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY)),
    (11, 15, 3, 'Tôi có thể dạy Địa lý online.', 160000, 'PENDING', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (12, 16, 1, 'Tôi có thể dạy Lịch sử theo đề cương.', 160000, 'PENDING', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO matched_classes (
    id, post_id, application_id, start_date, end_date, status, status_requested_by_user_id,
    status_requested_by_role, status_requested_at, status_request_reason, assigned_at, completed_at,
    cancelled_at, created_at, updated_at
) VALUES
    (1, 2, 3, DATE_SUB(CURDATE(), INTERVAL 10 DAY), NULL, 'ASSIGNED', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (2, 3, 4, DATE_SUB(CURDATE(), INTERVAL 18 DAY), NULL, 'IN_PROGRESS', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 4, 5, DATE_SUB(CURDATE(), INTERVAL 35 DAY), DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'COMPLETED', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (4, 13, 9, DATE_SUB(CURDATE(), INTERVAL 17 DAY), NULL, 'COMPLETION_REQUESTED', 10, 'TUTOR', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Gia sư đã hoàn thành chương trình và yêu cầu xác nhận.', DATE_SUB(NOW(), INTERVAL 17 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 17 DAY), NOW()),
    (5, 14, 10, DATE_SUB(CURDATE(), INTERVAL 12 DAY), NULL, 'CANCELLATION_REQUESTED', 3, 'LEARNER', DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Học viên bận lịch nên yêu cầu hủy lớp.', DATE_SUB(NOW(), INTERVAL 12 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), NOW());

INSERT IGNORE INTO tutor_courses (
    id, tutor_id, title, description, subject_id, grade_id, teaching_mode, study_time, price,
    max_students, province, district, address_detail, approval_status, approved_by, approved_at,
    rejected_reason, status, created_at, updated_at
) VALUES
    (1, 1, 'Lớp Toán 12 ôn thi THPT', 'Hệ thống hóa kiến thức và luyện đề.', 1, 12, 'BOTH', '3 buổi/tuần', 280000, 5, 'Hà Nội', 'Đống Đa', 'Gần Thái Hà', 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 20 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
    (2, 2, 'Tiếng Anh lớp 10 mất gốc', 'Ngữ pháp, từ vựng và giao tiếp cơ bản.', 3, 10, 'ONLINE', '2 buổi/tuần', 220000, 8, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY)),
    (3, 3, 'Hóa học 12 từ cơ bản đến nâng cao', 'Phù hợp học sinh cần tăng điểm nhanh.', 5, 12, 'OFFLINE', 'Cuối tuần', 260000, 6, 'TP. Hồ Chí Minh', 'Quận 3', 'Gần Hồ Con Rùa', 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 15 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
    (4, 4, 'IELTS Speaking 6.5+', 'Luyện phản xạ và mở rộng từ vựng học thuật.', 10, 12, 'ONLINE', 'Tối thứ 3,5', 350000, 10, 'Đà Nẵng', 'Hải Châu', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 14 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
    (5, 1, 'Tin học lớp 9 Python cơ bản', 'Làm quen tư duy lập trình.', 9, 9, 'ONLINE', 'Sáng thứ 7', 200000, 4, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 12 DAY), NULL, 'CLOSED', DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),
    (6, 2, 'Tiếng Anh lớp 8 cho học sinh mới bắt đầu', 'Lớp đang chờ admin duyệt.', 3, 8, 'ONLINE', 'Tối thứ 2,4', 180000, 6, 'Hà Nội', 'Cầu Giấy', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (7, 3, 'Vật lý 11 nâng cao', 'Lớp bị từ chối để test admin.', 4, 11, 'OFFLINE', 'Chiều chủ nhật', 260000, 5, 'TP. Hồ Chí Minh', 'Quận 3', NULL, 'REJECTED', 1, DATE_SUB(NOW(), INTERVAL 7 DAY), 'Cần bổ sung mô tả chi tiết hơn', 'OPEN', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (8, 1, 'Toán 11 đang học', 'Lớp đã có học viên và đang diễn ra.', 1, 11, 'BOTH', '2 buổi/tuần', 250000, 3, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 25 DAY), NULL, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 26 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (9, 2, 'IELTS Foundation đã hoàn thành', 'Dùng để test review khóa học.', 10, 12, 'ONLINE', '3 buổi/tuần', 320000, 8, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 61 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (10, 3, 'Hóa học 10 đã hủy', 'Dùng để test trạng thái hủy.', 5, 10, 'OFFLINE', 'Tối thứ 6', 220000, 4, 'TP. Hồ Chí Minh', 'Quận 3', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, 'CANCELLED', DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (11, 4, 'Lớp Tiếng Anh cơ bản 6', 'Dữ liệu kiểm tra giới hạn tạo lớp mỗi ngày của gia sư.', 3, 6, 'ONLINE', 'Tối thứ 2', 180000, 5, 'Đà Nẵng', 'Hải Châu', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_ADD(CURDATE(), INTERVAL 9 HOUR), DATE_ADD(CURDATE(), INTERVAL 9 HOUR)),
    (12, 4, 'Lớp IELTS nền tảng 7', 'Dữ liệu kiểm tra giới hạn tạo lớp mỗi ngày của gia sư.', 10, 7, 'ONLINE', 'Tối thứ 3', 180000, 5, 'Đà Nẵng', 'Hải Châu', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_ADD(CURDATE(), INTERVAL 10 HOUR), DATE_ADD(CURDATE(), INTERVAL 10 HOUR)),
    (13, 4, 'Lớp Tiếng Anh giao tiếp 8', 'Dữ liệu kiểm tra giới hạn tạo lớp mỗi ngày của gia sư.', 3, 8, 'ONLINE', 'Tối thứ 4', 180000, 5, 'Đà Nẵng', 'Hải Châu', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_ADD(CURDATE(), INTERVAL 11 HOUR), DATE_ADD(CURDATE(), INTERVAL 11 HOUR)),
    (14, 4, 'Lớp IELTS luyện đề 9', 'Dữ liệu kiểm tra giới hạn tạo lớp mỗi ngày của gia sư.', 10, 9, 'ONLINE', 'Tối thứ 5', 180000, 5, 'Đà Nẵng', 'Hải Châu', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_ADD(CURDATE(), INTERVAL 12 HOUR), DATE_ADD(CURDATE(), INTERVAL 12 HOUR));

INSERT IGNORE INTO course_enrollments (
    id, course_id, learner_user_id, message, agreed_fee, status, joined_at, completed_at,
    cancelled_at, created_at, updated_at
) VALUES
    (1, 1, 2, 'Em muốn đăng ký lớp Toán 12.', 280000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (2, 1, 3, 'Em cần học từ cơ bản.', 280000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (3, 2, 4, 'Em muốn học Tiếng Anh online.', 220000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (4, 2, 5, 'Lịch học của em không phù hợp.', 220000, 'REJECTED', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (5, 8, 2, 'Đang học lớp Toán 11.', 250000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 15 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
    (6, 9, 3, 'Đã hoàn thành lớp IELTS Foundation.', 320000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 55 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, DATE_SUB(NOW(), INTERVAL 56 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (7, 3, 5, 'Muốn học Hóa 12.', 260000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (8, 4, 2, 'Muốn luyện speaking IELTS.', 350000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (9, 5, 4, 'Đăng ký lớp Tin học Python.', 200000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (10, 10, 5, 'Đăng ký đã bị hủy theo lớp.', 220000, 'CANCELLED', NULL, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT IGNORE INTO reviews (id, learner_user_id, tutor_id, class_id, course_enrollment_id, rating, comment, created_at) VALUES
    (1, 3, 3, 3, NULL, 5, 'Gia sư dạy dễ hiểu, bài tập sát đề.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 3, 2, NULL, 6, 4, 'Khóa IELTS hữu ích, cần thêm bài tập writing.', DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT IGNORE INTO notifications (
    id, user_id, title, content, type, reference_type, reference_id, is_read, read_at, created_at
) VALUES
    (1, 1, 'Có bài đăng cần duyệt', 'Bài đăng Toán 9 đang chờ duyệt.', 'POST_PENDING_REVIEW', 'POST', 5, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (2, 1, 'Có lớp cần duyệt', 'Lớp Tiếng Anh lớp 8 đang chờ duyệt.', 'COURSE_PENDING_REVIEW', 'COURSE', 6, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (3, 2, 'Lớp đã được ghép', 'Bài đăng Tiếng Anh lớp 10 đã được ghép với gia sư.', 'CLASS_ASSIGNED', 'MATCHED_CLASS', 1, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (4, 10, 'Cần xác nhận hủy lớp', 'Học viên đã yêu cầu hủy lớp. Vui lòng xác nhận.', 'MATCHED_CLASS_STATUS_REQUEST', 'MATCHED_CLASS', 5, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    (5, 2, 'Cần xác nhận hoàn thành lớp', 'Gia sư đã yêu cầu hoàn thành lớp. Vui lòng xác nhận.', 'MATCHED_CLASS_STATUS_REQUEST', 'MATCHED_CLASS', 4, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (6, 11, 'Đơn ứng tuyển được chấp nhận', 'Đơn ứng tuyển của bạn đã được chấp nhận.', 'APPLICATION_DECISION', 'APPLICATION', 3, TRUE, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (7, 12, 'Bạn có đánh giá mới', 'Học viên đã đánh giá lớp Hóa 12.', 'REVIEW_CREATED', 'REVIEW', 1, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (8, 3, 'Đăng ký khóa học được chấp nhận', 'Đăng ký lớp Toán 12 đã được chấp nhận.', 'ENROLLMENT_STATUS', 'COURSE_ENROLLMENT', 2, TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (9, 14, 'Hồ sơ đang chờ duyệt', 'Hồ sơ gia sư của bạn đang chờ admin duyệt.', 'TUTOR_PROFILE_PENDING', 'TUTOR', 5, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (10, 6, 'Tài khoản đã có 4 bài trong ngày', 'Tài khoản này dùng để test giới hạn tạo bài đăng mỗi ngày.', 'TEST_LIMIT', 'USER', 6, FALSE, NULL, NOW());

INSERT IGNORE INTO tutor_certificates (
    id, tutor_id, title, certificate_type, issuer, issued_date, certificate_image_url,
    status, reviewed_by, reviewed_at, rejected_reason, created_at, updated_at
) VALUES
    (1, 1, 'Bằng cử nhân Sư phạm Toán', 'DEGREE', 'Đại học Sư phạm Hà Nội', '2017-06-30', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 70 DAY), NULL, DATE_SUB(NOW(), INTERVAL 72 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (2, 2, 'Chứng chỉ IELTS 8.0', 'LANGUAGE', 'British Council', '2023-08-10', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 68 DAY), NULL, DATE_SUB(NOW(), INTERVAL 69 DAY), DATE_SUB(NOW(), INTERVAL 68 DAY)),
    (3, 3, 'Bằng cử nhân Hóa học', 'DEGREE', 'Đại học Khoa học Tự nhiên', '2015-06-30', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 65 DAY), NULL, DATE_SUB(NOW(), INTERVAL 66 DAY), DATE_SUB(NOW(), INTERVAL 65 DAY)),
    (4, 4, 'Chứng chỉ IELTS 8.5', 'LANGUAGE', 'IDP', '2024-02-20', NULL, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (5, 5, 'Bảng điểm tạm thời', 'TRANSCRIPT', 'Đại học', '2024-01-15', NULL, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (6, 6, 'Chứng chỉ không hợp lệ', 'OTHER', 'Không xác định', '2020-01-01', NULL, 'REJECTED', 1, DATE_SUB(NOW(), INTERVAL 8 DAY), 'Ảnh chứng chỉ không rõ', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY));

-- 17) EXTRA SAMPLE DATA FOR PAGINATION TESTING

INSERT IGNORE INTO users (
    id, role, email, password, full_name, phone, birth_date, gender, avatar, address, status, created_at, updated_at
) VALUES
    (7, 'LEARNER', 'hocvien6@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Nguyễn Minh Quân', '0900000007', '2007-02-18', 'MALE', NULL, 'Long Biên, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 35 DAY), NOW()),
    (8, 'LEARNER', 'hocvien7@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Hoàng Bảo Ngọc', '0900000008', '2008-10-22', 'FEMALE', NULL, 'Sơn Trà, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 34 DAY), NOW()),
    (9, 'LEARNER', 'hocvien8@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Trương Gia Hân', '0900000009', '2006-12-09', 'FEMALE', NULL, 'Bình Thạnh, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 33 DAY), NOW()),
    (16, 'TUTOR', 'giasu7@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Đặng Quốc Huy', '0900000016', '1992-03-14', 'MALE', NULL, 'Hoàn Kiếm, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 72 DAY), NOW()),
    (17, 'TUTOR', 'giasu8@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Bùi Minh Trang', '0900000017', '1997-09-11', 'FEMALE', NULL, 'Nam Từ Liêm, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 71 DAY), NOW()),
    (18, 'TUTOR', 'giasu9@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Ngô Tuấn Kiệt', '0900000018', '1990-07-07', 'MALE', NULL, 'Thủ Đức, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 70 DAY), NOW()),
    (19, 'TUTOR', 'giasu10@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Phan Thảo Vy', '0900000019', '1995-05-19', 'FEMALE', NULL, 'Liên Chiểu, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 69 DAY), NOW()),
    (20, 'TUTOR', 'giasu11@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Vũ Anh Khoa', '0900000020', '1993-01-25', 'MALE', NULL, 'Tây Hồ, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 68 DAY), NOW()),
    (21, 'TUTOR', 'giasu12@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Lâm Hồng Nhung', '0900000021', '1994-04-04', 'FEMALE', NULL, 'Quận 7, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 67 DAY), NOW()),
    (22, 'TUTOR', 'giasu13@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Đỗ Nhật Linh', '0900000022', '1998-08-08', 'FEMALE', NULL, 'Cẩm Lệ, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 66 DAY), NOW()),
    (23, 'TUTOR', 'giasu14@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Trịnh Minh Sơn', '0900000023', '1996-06-06', 'MALE', NULL, 'Hai Bà Trưng, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 12 DAY), NOW()),
    (24, 'TUTOR', 'giasu15@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Nguyễn Hà My', '0900000024', '1999-11-17', 'FEMALE', NULL, 'Phú Nhuận, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 11 DAY), NOW()),
    (25, 'TUTOR', 'giasu16@gmail.com', '$2a$10$NR32RBEQYUubCo1GLPRPfOH4Q1QVct8ywtb/XZKKi/Sj1x6naDehG', 'Lê Văn Phúc', '0900000025', '1997-12-12', 'MALE', NULL, 'Hà Đông, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 10 DAY), NOW());

INSERT IGNORE INTO tutors (
    id, user_id, description, experience, qualification, teaching_mode, province, district, hourly_rate,
    profile_status, reviewed_by, reviewed_at, rejected_reason, created_at, updated_at
) VALUES
    (7, 16, 'Gia sư Toán và Tin học cho học sinh THCS.', '6 năm dạy Toán và lập trình cơ bản', 'Đại học Bách khoa Hà Nội', 'BOTH', 'Hà Nội', 'Hoàn Kiếm', 260000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 72 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (8, 17, 'Gia sư Ngữ văn luyện viết và đọc hiểu.', '5 năm luyện thi vào lớp 10', 'Đại học Sư phạm Hà Nội', 'OFFLINE', 'Hà Nội', 'Nam Từ Liêm', 230000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 58 DAY), NULL, DATE_SUB(NOW(), INTERVAL 71 DAY), DATE_SUB(NOW(), INTERVAL 58 DAY)),
    (9, 18, 'Gia sư Vật lý theo chuyên đề.', '8 năm dạy Vật lý THPT', 'Đại học Khoa học Tự nhiên', 'BOTH', 'TP. Hồ Chí Minh', 'Thủ Đức', 300000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 56 DAY), NULL, DATE_SUB(NOW(), INTERVAL 70 DAY), DATE_SUB(NOW(), INTERVAL 56 DAY)),
    (10, 19, 'Gia sư Tiếng Anh giao tiếp cho học sinh mới bắt đầu.', '4 năm dạy online', 'IELTS 7.5', 'ONLINE', 'Đà Nẵng', 'Liên Chiểu', 240000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 54 DAY), NULL, DATE_SUB(NOW(), INTERVAL 69 DAY), DATE_SUB(NOW(), INTERVAL 54 DAY)),
    (11, 20, 'Gia sư Hóa học ôn tập theo lộ trình.', '7 năm dạy Hóa học', 'Đại học Dược Hà Nội', 'BOTH', 'Hà Nội', 'Tây Hồ', 270000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 52 DAY), NULL, DATE_SUB(NOW(), INTERVAL 68 DAY), DATE_SUB(NOW(), INTERVAL 52 DAY)),
    (12, 21, 'Gia sư Sinh học và luyện thi tốt nghiệp.', '5 năm dạy Sinh học', 'Đại học Y Dược TP. Hồ Chí Minh', 'ONLINE', 'TP. Hồ Chí Minh', 'Quận 7', 260000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 67 DAY), DATE_SUB(NOW(), INTERVAL 50 DAY)),
    (13, 22, 'Gia sư IELTS nền tảng cho học sinh phổ thông.', '3 năm luyện IELTS', 'IELTS 8.0', 'ONLINE', 'Đà Nẵng', 'Cẩm Lệ', 320000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 48 DAY), NULL, DATE_SUB(NOW(), INTERVAL 66 DAY), DATE_SUB(NOW(), INTERVAL 48 DAY)),
    (14, 23, 'Hồ sơ gia sư Toán đang chờ duyệt.', '2 năm trợ giảng', 'Sinh viên năm cuối', 'BOTH', 'Hà Nội', 'Hai Bà Trưng', 180000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), NOW()),
    (15, 24, 'Hồ sơ gia sư Tiếng Anh đang chờ duyệt.', '1 năm trợ giảng', 'Sinh viên ngành ngôn ngữ Anh', 'ONLINE', 'TP. Hồ Chí Minh', 'Phú Nhuận', 190000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 11 DAY), NOW()),
    (16, 25, 'Hồ sơ gia sư Tin học đang chờ duyệt.', '2 năm hướng dẫn lập trình', 'Cử nhân Công nghệ thông tin', 'BOTH', 'Hà Nội', 'Hà Đông', 210000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), NOW());

INSERT IGNORE INTO identity_verifications (
    id, user_id, status, full_name_on_id, id_number, date_of_birth_on_id, issued_date, issued_place,
    address_on_id, id_front_image_url, id_back_image_url, selfie_image_url, reviewed_by, reviewed_at,
    rejected_reason, created_at, updated_at
) VALUES
    (12, 7, 'APPROVED', 'Nguyễn Minh Quân', '001207000006', '2007-02-18', '2022-06-01', 'Hà Nội', 'Long Biên, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 20 DAY), NULL, DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
    (13, 8, 'APPROVED', 'Hoàng Bảo Ngọc', '048208000007', '2008-10-22', '2022-06-02', 'Đà Nẵng', 'Sơn Trà, Đà Nẵng', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 19 DAY), NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY)),
    (14, 9, 'APPROVED', 'Trương Gia Hân', '079206000008', '2006-12-09', '2021-06-03', 'TP. Hồ Chí Minh', 'Bình Thạnh, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY)),
    (15, 16, 'APPROVED', 'Đặng Quốc Huy', '001192000016', '1992-03-14', '2018-05-01', 'Hà Nội', 'Hoàn Kiếm, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 58 DAY), NULL, DATE_SUB(NOW(), INTERVAL 59 DAY), DATE_SUB(NOW(), INTERVAL 58 DAY)),
    (16, 17, 'APPROVED', 'Bùi Minh Trang', '001197000017', '1997-09-11', '2019-05-02', 'Hà Nội', 'Nam Từ Liêm, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 56 DAY), NULL, DATE_SUB(NOW(), INTERVAL 57 DAY), DATE_SUB(NOW(), INTERVAL 56 DAY)),
    (17, 18, 'APPROVED', 'Ngô Tuấn Kiệt', '079190000018', '1990-07-07', '2017-05-03', 'TP. Hồ Chí Minh', 'Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 54 DAY), NULL, DATE_SUB(NOW(), INTERVAL 55 DAY), DATE_SUB(NOW(), INTERVAL 54 DAY)),
    (18, 19, 'APPROVED', 'Phan Thảo Vy', '048195000019', '1995-05-19', '2018-05-04', 'Đà Nẵng', 'Liên Chiểu, Đà Nẵng', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 52 DAY), NULL, DATE_SUB(NOW(), INTERVAL 53 DAY), DATE_SUB(NOW(), INTERVAL 52 DAY)),
    (19, 20, 'APPROVED', 'Vũ Anh Khoa', '001193000020', '1993-01-25', '2017-05-05', 'Hà Nội', 'Tây Hồ, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 50 DAY)),
    (20, 21, 'APPROVED', 'Lâm Hồng Nhung', '079194000021', '1994-04-04', '2017-05-06', 'TP. Hồ Chí Minh', 'Quận 7, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 48 DAY), NULL, DATE_SUB(NOW(), INTERVAL 49 DAY), DATE_SUB(NOW(), INTERVAL 48 DAY)),
    (21, 22, 'APPROVED', 'Đỗ Nhật Linh', '048198000022', '1998-08-08', '2019-05-07', 'Đà Nẵng', 'Cẩm Lệ, Đà Nẵng', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 46 DAY), NULL, DATE_SUB(NOW(), INTERVAL 47 DAY), DATE_SUB(NOW(), INTERVAL 46 DAY)),
    (22, 23, 'PENDING', 'Trịnh Minh Sơn', '001196000023', '1996-06-06', '2019-05-08', 'Hà Nội', 'Hai Bà Trưng, Hà Nội', NULL, NULL, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
    (23, 24, 'PENDING', 'Nguyễn Hà My', '079199000024', '1999-11-17', '2020-05-09', 'TP. Hồ Chí Minh', 'Phú Nhuận, TP. Hồ Chí Minh', NULL, NULL, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
    (24, 25, 'PENDING', 'Lê Văn Phúc', '001197000025', '1997-12-12', '2020-05-10', 'Hà Nội', 'Hà Đông, Hà Nội', NULL, NULL, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());

INSERT IGNORE INTO tutor_teachings (id, tutor_id, subject_id, grade_id, created_at) VALUES
    (18, 7, 1, 6, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (19, 7, 1, 7, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (20, 7, 9, 8, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (21, 8, 2, 8, DATE_SUB(NOW(), INTERVAL 58 DAY)),
    (22, 8, 2, 9, DATE_SUB(NOW(), INTERVAL 58 DAY)),
    (23, 9, 4, 10, DATE_SUB(NOW(), INTERVAL 56 DAY)),
    (24, 9, 4, 11, DATE_SUB(NOW(), INTERVAL 56 DAY)),
    (25, 9, 4, 12, DATE_SUB(NOW(), INTERVAL 56 DAY)),
    (26, 10, 3, 6, DATE_SUB(NOW(), INTERVAL 54 DAY)),
    (27, 10, 3, 7, DATE_SUB(NOW(), INTERVAL 54 DAY)),
    (28, 11, 5, 10, DATE_SUB(NOW(), INTERVAL 52 DAY)),
    (29, 11, 5, 11, DATE_SUB(NOW(), INTERVAL 52 DAY)),
    (30, 12, 6, 11, DATE_SUB(NOW(), INTERVAL 50 DAY)),
    (31, 12, 6, 12, DATE_SUB(NOW(), INTERVAL 50 DAY)),
    (32, 13, 10, 12, DATE_SUB(NOW(), INTERVAL 48 DAY)),
    (33, 14, 1, 10, DATE_SUB(NOW(), INTERVAL 12 DAY)),
    (34, 15, 3, 9, DATE_SUB(NOW(), INTERVAL 11 DAY)),
    (35, 16, 9, 10, DATE_SUB(NOW(), INTERVAL 10 DAY));

INSERT IGNORE INTO posts (
    id, learner_user_id, subject_id, grade_id, title, description, teaching_mode, study_time, budget,
    province, district, address_detail, approval_status, approved_by, approved_at, rejected_reason,
    status, created_at, updated_at
) VALUES
    (17, 2, 1, 11, 'Tìm gia sư Toán 11 luyện đề cuối kỳ', 'Học viên cần ôn lại hàm số và lượng giác.', 'BOTH', 'Tối thứ 3,5', 260000, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 12 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),
    (18, 2, 3, 9, 'Cần gia sư Tiếng Anh lớp 9', 'Tập trung ngữ pháp và luyện đề vào lớp 10.', 'ONLINE', 'Tối thứ 2,4', 220000, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, 'ASSIGNED', DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY)),
    (19, 2, 1, 10, 'Lớp Toán 10 đang học thử', 'Cần củng cố phương trình và bất đẳng thức.', 'OFFLINE', 'Chiều thứ 7', 240000, 'Hà Nội', 'Cầu Giấy', 'Gần công viên Nghĩa Đô', 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 20 DAY), NULL, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
    (20, 3, 5, 11, 'Ôn Hóa học 11 theo chuyên đề', 'Tập trung cân bằng phản ứng và bài tập vận dụng.', 'ONLINE', 'Tối thứ 6', 250000, 'Hà Nội', 'Thanh Xuân', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 24 DAY), NULL, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (21, 3, 4, 12, 'Cần gia sư Vật lý 12 luyện thi', 'Ôn dao động, sóng và điện xoay chiều.', 'BOTH', 'Tối thứ 2,5', 300000, 'Hà Nội', 'Thanh Xuân', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 22 DAY), NULL, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 23 DAY), DATE_SUB(NOW(), INTERVAL 22 DAY)),
    (22, 4, 2, 9, 'Ngữ văn 9 luyện viết đoạn văn', 'Cần rèn cách triển khai ý và dùng dẫn chứng.', 'OFFLINE', 'Sáng chủ nhật', 190000, 'TP. Hồ Chí Minh', 'Quận 1', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 16 DAY), NULL, 'ASSIGNED', DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY)),
    (23, 4, 6, 11, 'Sinh học 11 cần học theo sơ đồ', 'Ưu tiên gia sư biết hệ thống kiến thức dễ nhớ.', 'ONLINE', 'Tối thứ 3', 210000, 'TP. Hồ Chí Minh', 'Quận 1', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 14 DAY), NULL, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
    (24, 5, 10, 12, 'IELTS Writing cần sửa bài hằng tuần', 'Mục tiêu band 6.5, cần feedback chi tiết.', 'ONLINE', 'Tối thứ 4,7', 360000, 'Đà Nẵng', 'Hải Châu', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 12 DAY), NULL, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
    (25, 7, 8, 10, 'Cần gia sư Địa lý lớp 10', 'Học theo chương trình trên lớp và luyện kiểm tra.', 'ONLINE', 'Tối thứ 5', 170000, 'Hà Nội', 'Long Biên', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (26, 7, 9, 8, 'Tin học lớp 8 làm quen Python', 'Học từ đầu, ưu tiên thực hành nhiều.', 'ONLINE', 'Sáng thứ 7', 200000, 'Hà Nội', 'Long Biên', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 9 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
    (27, 8, 3, 6, 'Tiếng Anh lớp 6 giao tiếp cơ bản', 'Cần gia sư vui vẻ, học qua tình huống.', 'ONLINE', 'Tối thứ 2', 180000, 'Đà Nẵng', 'Sơn Trà', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 8 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
    (28, 8, 1, 7, 'Toán lớp 7 cần học chắc nền tảng', 'Ôn phân số, số hữu tỉ và hình học cơ bản.', 'BOTH', 'Tối thứ 6', 180000, 'Đà Nẵng', 'Sơn Trà', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 7 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (29, 9, 5, 10, 'Hóa học 10 học từ cơ bản', 'Cần gia sư kiên nhẫn, giải thích chậm.', 'ONLINE', 'Tối thứ 3', 210000, 'TP. Hồ Chí Minh', 'Bình Thạnh', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 6 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
    (30, 9, 4, 10, 'Vật lý 10 luyện bài tập nâng cao', 'Muốn học thêm bài tập chuyển động và lực.', 'OFFLINE', 'Chiều chủ nhật', 230000, 'TP. Hồ Chí Minh', 'Bình Thạnh', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (31, 2, 7, 8, 'Lịch sử 8 ôn kiểm tra học kỳ', 'Cần hệ thống mốc thời gian dễ nhớ.', 'ONLINE', 'Tối chủ nhật', 160000, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
    (32, 3, 2, 10, 'Ngữ văn 10 luyện phân tích tác phẩm', 'Cần học cách lập dàn ý và viết bài hoàn chỉnh.', 'ONLINE', 'Tối thứ 5', 200000, 'Hà Nội', 'Thanh Xuân', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (33, 4, 1, 6, 'Bài đăng chờ duyệt Toán lớp 6', 'Dữ liệu test danh sách bài đăng chờ duyệt.', 'ONLINE', 'Tối thứ 2', 150000, 'TP. Hồ Chí Minh', 'Quận 1', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (34, 5, 3, 8, 'Bài đăng chờ duyệt Tiếng Anh lớp 8', 'Dữ liệu test phân trang admin.', 'ONLINE', 'Tối thứ 3', 160000, 'Đà Nẵng', 'Hải Châu', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (35, 7, 5, 9, 'Bài đăng chờ duyệt Hóa học lớp 9', 'Dữ liệu test phân trang admin.', 'BOTH', 'Tối thứ 4', 170000, 'Hà Nội', 'Long Biên', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (36, 8, 9, 10, 'Bài đăng chờ duyệt Tin học lớp 10', 'Dữ liệu test phân trang admin.', 'ONLINE', 'Tối thứ 5', 180000, 'Đà Nẵng', 'Sơn Trà', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (37, 9, 6, 12, 'Bài đăng chờ duyệt Sinh học lớp 12', 'Dữ liệu test phân trang admin.', 'ONLINE', 'Tối thứ 6', 190000, 'TP. Hồ Chí Minh', 'Bình Thạnh', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (38, 2, 8, 11, 'Bài đăng chờ duyệt Địa lý lớp 11', 'Dữ liệu test phân trang admin.', 'ONLINE', 'Tối thứ 7', 190000, 'Hà Nội', 'Cầu Giấy', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 12 HOUR)),
    (39, 3, 7, 12, 'Bài đăng chờ duyệt Lịch sử lớp 12', 'Dữ liệu test phân trang admin.', 'BOTH', 'Tối chủ nhật', 190000, 'Hà Nội', 'Thanh Xuân', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 11 HOUR), DATE_SUB(NOW(), INTERVAL 11 HOUR)),
    (40, 4, 10, 12, 'Bài đăng chờ duyệt IELTS nền tảng', 'Dữ liệu test phân trang admin.', 'ONLINE', 'Tối thứ 2,4', 280000, 'TP. Hồ Chí Minh', 'Quận 1', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 10 HOUR), DATE_SUB(NOW(), INTERVAL 10 HOUR)),
    (41, 5, 1, 5, 'Bài đăng chờ duyệt Toán lớp 5', 'Dữ liệu test phân trang admin.', 'OFFLINE', 'Chiều thứ 7', 150000, 'Đà Nẵng', 'Hải Châu', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 9 HOUR), DATE_SUB(NOW(), INTERVAL 9 HOUR)),
    (42, 7, 3, 5, 'Bài đăng chờ duyệt Tiếng Anh lớp 5', 'Dữ liệu test phân trang admin.', 'ONLINE', 'Tối thứ 3', 150000, 'Hà Nội', 'Long Biên', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 8 HOUR), DATE_SUB(NOW(), INTERVAL 8 HOUR)),
    (43, 8, 2, 7, 'Bài đăng chờ duyệt Ngữ văn lớp 7', 'Dữ liệu test phân trang admin.', 'ONLINE', 'Tối thứ 4', 150000, 'Đà Nẵng', 'Sơn Trà', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 7 HOUR), DATE_SUB(NOW(), INTERVAL 7 HOUR)),
    (44, 9, 4, 9, 'Bài đăng chờ duyệt Vật lý lớp 9', 'Dữ liệu test phân trang admin.', 'BOTH', 'Tối thứ 5', 170000, 'TP. Hồ Chí Minh', 'Bình Thạnh', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 6 HOUR));

INSERT IGNORE INTO applications (id, post_id, tutor_id, message, expected_fee, status, created_at, updated_at) VALUES
    (13, 17, 1, 'Tôi có thể kèm Toán 11 theo dạng đề cuối kỳ.', 250000, 'PENDING', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY)),
    (14, 18, 1, 'Tôi nhận lớp Tiếng Anh lớp 9 và có giáo án luyện thi.', 220000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY)),
    (15, 19, 1, 'Tôi có thể hỗ trợ Toán 10 trực tiếp tại Cầu Giấy.', 240000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
    (16, 20, 1, 'Tôi có thể ôn Hóa 11 theo chuyên đề.', 250000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 24 DAY)),
    (17, 21, 1, 'Tôi có kinh nghiệm luyện thi Vật lý 12.', 300000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 22 DAY), DATE_SUB(NOW(), INTERVAL 22 DAY)),
    (18, 22, 1, 'Tôi có thể hỗ trợ Ngữ văn 9 theo dàn ý.', 190000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY)),
    (19, 23, 1, 'Tôi nhận lớp Sinh học 11 online.', 210000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
    (20, 24, 1, 'Tôi nhận sửa bài IELTS Writing hằng tuần.', 360000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),
    (21, 25, 1, 'Tôi có thể dạy Địa lý lớp 10 online.', 170000, 'PENDING', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (22, 26, 1, 'Tôi có kinh nghiệm dạy Python cơ bản.', 200000, 'PENDING', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
    (23, 27, 1, 'Tôi có thể dạy Tiếng Anh lớp 6 qua tình huống.', 180000, 'PENDING', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
    (24, 28, 1, 'Tôi nhận kèm Toán lớp 7 nền tảng.', 180000, 'PENDING', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (25, 29, 1, 'Tôi nhận kèm Hóa học 10 từ cơ bản.', 210000, 'PENDING', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
    (26, 30, 1, 'Tôi có thể dạy Vật lý 10 trực tiếp.', 230000, 'PENDING', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (27, 31, 1, 'Tôi hỗ trợ học Lịch sử bằng sơ đồ tư duy.', 160000, 'PENDING', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
    (28, 32, 1, 'Tôi nhận luyện phân tích tác phẩm Ngữ văn 10.', 200000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (29, 17, 2, 'Tôi có thể dạy online vào buổi tối.', 245000, 'PENDING', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (30, 17, 3, 'Tôi có kinh nghiệm luyện đề Toán 11.', 260000, 'PENDING', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (31, 17, 4, 'Tôi có thể học thử một buổi miễn phí.', 255000, 'PENDING', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
    (32, 17, 7, 'Tôi chuyên Toán THCS và THPT cơ bản.', 250000, 'PENDING', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
    (33, 17, 8, 'Tôi có thể hỗ trợ phần trình bày lời giải.', 240000, 'PENDING', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
    (34, 17, 9, 'Tôi nhận dạy theo chuyên đề tuần.', 265000, 'PENDING', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
    (35, 17, 10, 'Tôi có thể dạy online linh hoạt.', 235000, 'REJECTED', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (36, 17, 11, 'Tôi có thể dạy kết hợp Hóa và Toán cơ bản.', 250000, 'PENDING', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (37, 17, 12, 'Tôi có thể hỗ trợ học sinh mất gốc.', 240000, 'CANCELLED', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY));

INSERT IGNORE INTO matched_classes (
    id, post_id, application_id, start_date, end_date, status, status_requested_by_user_id,
    status_requested_by_role, status_requested_at, status_request_reason, assigned_at, completed_at,
    cancelled_at, created_at, updated_at
) VALUES
    (6, 18, 14, DATE_SUB(CURDATE(), INTERVAL 17 DAY), NULL, 'ASSIGNED', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 17 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 17 DAY)),
    (7, 19, 15, DATE_SUB(CURDATE(), INTERVAL 19 DAY), NULL, 'IN_PROGRESS', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 19 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (8, 20, 16, DATE_SUB(CURDATE(), INTERVAL 24 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'COMPLETED', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (9, 21, 17, DATE_SUB(CURDATE(), INTERVAL 21 DAY), NULL, 'IN_PROGRESS', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 21 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (10, 22, 18, DATE_SUB(CURDATE(), INTERVAL 15 DAY), NULL, 'ASSIGNED', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 15 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
    (11, 23, 19, DATE_SUB(CURDATE(), INTERVAL 13 DAY), NULL, 'COMPLETION_REQUESTED', 10, 'TUTOR', DATE_SUB(NOW(), INTERVAL 6 HOUR), 'Gia sư đã hoàn thành phần kiến thức đã thống nhất.', DATE_SUB(NOW(), INTERVAL 13 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 13 DAY), NOW()),
    (12, 24, 20, DATE_SUB(CURDATE(), INTERVAL 23 DAY), DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'COMPLETED', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 23 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, DATE_SUB(NOW(), INTERVAL 23 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY));

INSERT IGNORE INTO tutor_courses (
    id, tutor_id, title, description, subject_id, grade_id, teaching_mode, study_time, price,
    max_students, province, district, address_detail, approval_status, approved_by, approved_at,
    rejected_reason, status, created_at, updated_at
) VALUES
    (15, 1, 'Toán 10 nền tảng theo tuần', 'Củng cố kiến thức và luyện bài tập theo từng chủ đề.', 1, 10, 'ONLINE', 'Tối thứ 2', 220000, 8, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 22 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 23 DAY), DATE_SUB(NOW(), INTERVAL 22 DAY)),
    (16, 1, 'Toán 11 luyện hàm số', 'Luyện bài tập hàm số, giới hạn và đạo hàm.', 1, 11, 'BOTH', 'Tối thứ 3', 240000, 8, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 21 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 22 DAY), DATE_SUB(NOW(), INTERVAL 21 DAY)),
    (17, 1, 'Toán 12 luyện đề tốt nghiệp', 'Luyện đề theo cấu trúc thi mới.', 1, 12, 'ONLINE', 'Tối thứ 4', 280000, 10, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 20 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
    (18, 1, 'Tin học Python nhập môn', 'Học cú pháp Python và bài tập thực hành.', 9, 9, 'ONLINE', 'Sáng thứ 7', 200000, 8, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 19 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY)),
    (19, 1, 'Toán lớp 8 bám sát sách giáo khoa', 'Luyện bài tập cơ bản và nâng cao nhẹ.', 1, 8, 'BOTH', 'Chiều chủ nhật', 190000, 6, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY)),
    (20, 1, 'Toán lớp 9 ôn thi vào 10', 'Ôn chuyên đề đại số và hình học.', 1, 9, 'OFFLINE', 'Tối thứ 5', 230000, 6, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 17 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 17 DAY)),
    (21, 1, 'Toán tư duy cho học sinh lớp 6', 'Rèn tư duy giải bài và trình bày.', 1, 6, 'ONLINE', 'Tối thứ 6', 180000, 8, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 16 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY)),
    (22, 1, 'Tin học lớp 10 thuật toán cơ bản', 'Làm quen bài toán và thuật toán đơn giản.', 9, 10, 'ONLINE', 'Tối thứ 7', 220000, 8, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 15 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
    (23, 1, 'Toán 7 luyện hình học', 'Luyện chứng minh hình học từng bước.', 1, 7, 'BOTH', 'Sáng chủ nhật', 190000, 6, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 14 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
    (24, 1, 'Toán 12 cấp tốc trước kỳ thi', 'Luyện các dạng thường gặp và mẹo kiểm tra nhanh.', 1, 12, 'ONLINE', 'Tối thứ 2,6', 300000, 10, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 13 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY)),
    (25, 2, 'Tiếng Anh giao tiếp lớp 6', 'Học phát âm, từ vựng và mẫu câu cơ bản.', 3, 6, 'ONLINE', 'Tối thứ 2', 180000, 10, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 12 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),
    (26, 3, 'Hóa học 11 theo chuyên đề', 'Học cân bằng phản ứng và bài tập vận dụng.', 5, 11, 'OFFLINE', 'Chiều thứ 7', 260000, 8, 'TP. Hồ Chí Minh', 'Quận 3', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 11 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY)),
    (27, 4, 'IELTS Reading nền tảng', 'Luyện kỹ năng đọc hiểu và quản lý thời gian.', 10, 12, 'ONLINE', 'Tối thứ 3', 320000, 12, 'Đà Nẵng', 'Hải Châu', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (28, 7, 'Toán lớp 6 cho học sinh mất gốc', 'Học chậm, chắc từng dạng bài.', 1, 6, 'BOTH', 'Tối thứ 4', 180000, 8, 'Hà Nội', 'Hoàn Kiếm', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 9 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
    (29, 8, 'Ngữ văn 9 luyện thi vào 10', 'Luyện đọc hiểu và viết đoạn văn nghị luận.', 2, 9, 'OFFLINE', 'Sáng chủ nhật', 220000, 6, 'Hà Nội', 'Nam Từ Liêm', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 8 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
    (30, 9, 'Vật lý 12 luyện đề', 'Ôn chuyên đề và luyện đề tổng hợp.', 4, 12, 'BOTH', 'Tối thứ 5', 300000, 8, 'TP. Hồ Chí Minh', 'Thủ Đức', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 7 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (31, 10, 'Tiếng Anh lớp 7 giao tiếp', 'Học phản xạ câu đơn giản và từ vựng thường dùng.', 3, 7, 'ONLINE', 'Tối thứ 6', 190000, 10, 'Đà Nẵng', 'Liên Chiểu', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 6 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
    (32, 11, 'Hóa học 10 nhập môn', 'Học từ cấu tạo nguyên tử đến phản ứng hóa học.', 5, 10, 'ONLINE', 'Tối thứ 7', 210000, 10, 'Hà Nội', 'Tây Hồ', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (33, 12, 'Lớp Sinh học 12 chờ duyệt', 'Dữ liệu test phân trang khóa học chờ duyệt.', 6, 12, 'ONLINE', 'Tối thứ 2', 230000, 8, 'TP. Hồ Chí Minh', 'Quận 7', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
    (34, 13, 'Lớp IELTS Speaking chờ duyệt', 'Dữ liệu test phân trang khóa học chờ duyệt.', 10, 12, 'ONLINE', 'Tối thứ 3', 330000, 8, 'Đà Nẵng', 'Cẩm Lệ', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
    (35, 14, 'Lớp Toán 10 chờ duyệt', 'Dữ liệu test phân trang khóa học chờ duyệt.', 1, 10, 'BOTH', 'Tối thứ 4', 190000, 6, 'Hà Nội', 'Hai Bà Trưng', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (36, 15, 'Lớp Tiếng Anh 9 chờ duyệt', 'Dữ liệu test phân trang khóa học chờ duyệt.', 3, 9, 'ONLINE', 'Tối thứ 5', 190000, 8, 'TP. Hồ Chí Minh', 'Phú Nhuận', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (37, 16, 'Lớp Tin học 10 chờ duyệt', 'Dữ liệu test phân trang khóa học chờ duyệt.', 9, 10, 'ONLINE', 'Tối thứ 6', 200000, 8, 'Hà Nội', 'Hà Đông', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (38, 2, 'Lớp Tiếng Anh 8 chờ duyệt bổ sung', 'Dữ liệu test phân trang khóa học chờ duyệt.', 3, 8, 'ONLINE', 'Tối thứ 7', 180000, 8, 'Hà Nội', 'Cầu Giấy', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (39, 3, 'Lớp Hóa học 12 chờ duyệt bổ sung', 'Dữ liệu test phân trang khóa học chờ duyệt.', 5, 12, 'OFFLINE', 'Chiều chủ nhật', 260000, 6, 'TP. Hồ Chí Minh', 'Quận 3', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (40, 4, 'Lớp IELTS Writing chờ duyệt bổ sung', 'Dữ liệu test phân trang khóa học chờ duyệt.', 10, 12, 'ONLINE', 'Tối chủ nhật', 340000, 8, 'Đà Nẵng', 'Hải Châu', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO course_enrollments (
    id, course_id, learner_user_id, message, agreed_fee, status, joined_at, completed_at,
    cancelled_at, created_at, updated_at
) VALUES
    (11, 15, 2, 'Em muốn học Toán 10 theo từng chủ đề.', 220000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (12, 16, 2, 'Em cần luyện thêm phần hàm số.', 240000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (13, 17, 2, 'Em muốn luyện đề Toán 12 hằng tuần.', 280000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (14, 18, 2, 'Em muốn học Python từ đầu.', 200000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (15, 19, 2, 'Em muốn học Toán lớp 8 cùng em trai.', 190000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (16, 20, 2, 'Em muốn ôn thi vào lớp 10.', 230000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (17, 21, 2, 'Em muốn học tư duy Toán lớp 6.', 180000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
    (18, 22, 2, 'Em muốn học thuật toán cơ bản.', 220000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY)),
    (19, 23, 2, 'Em muốn luyện hình học lớp 7.', 190000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY)),
    (20, 24, 2, 'Em muốn học cấp tốc trước kỳ thi.', 300000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),
    (21, 25, 2, 'Em muốn học giao tiếp Tiếng Anh lớp 6.', 180000, 'REJECTED', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (22, 26, 2, 'Em muốn học thêm Hóa 11.', 260000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (23, 27, 2, 'Em muốn luyện IELTS Reading.', 320000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (24, 28, 2, 'Em muốn học Toán lớp 6 cùng nhóm nhỏ.', 180000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
    (25, 29, 2, 'Em muốn luyện Ngữ văn 9.', 220000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
    (26, 30, 2, 'Em muốn luyện đề Vật lý 12.', 300000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
    (27, 31, 2, 'Em muốn học Tiếng Anh giao tiếp.', 190000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (28, 32, 2, 'Em muốn học Hóa học 10 nhập môn.', 210000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (29, 1, 4, 'Em muốn đăng ký thêm lớp Toán 12.', 280000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
    (30, 1, 5, 'Em muốn học thử lớp Toán 12.', 280000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
    (31, 1, 6, 'Em muốn tham gia lớp ôn thi.', 280000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (32, 1, 7, 'Em muốn học nhóm nhỏ.', 280000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (33, 1, 8, 'Em muốn theo lớp Toán 12.', 280000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
    (34, 1, 9, 'Em muốn đăng ký học thử.', 280000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY));

INSERT IGNORE INTO reviews (id, learner_user_id, tutor_id, class_id, course_enrollment_id, rating, comment, created_at) VALUES
    (3, 2, 1, NULL, 11, 5, 'Lớp học rõ ràng, gia sư chuẩn bị bài kỹ.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (4, 2, 1, NULL, 12, 5, 'Gia sư giải thích dễ hiểu và giao bài hợp lý.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (5, 2, 1, NULL, 13, 4, 'Nội dung luyện đề sát với mục tiêu.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (6, 2, 1, NULL, 14, 5, 'Phần thực hành Python rất dễ theo.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (7, 3, 1, 8, NULL, 5, 'Gia sư hỗ trợ tốt trong quá trình học.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (8, 5, 1, 12, NULL, 4, 'Buổi học ổn, phản hồi bài viết chi tiết.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (9, 2, 1, NULL, 15, 4, 'Lớp học đúng giờ và có tài liệu kèm theo.', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
    (10, 2, 1, NULL, 16, 5, 'Gia sư theo sát tiến độ từng tuần.', DATE_SUB(NOW(), INTERVAL 10 HOUR)),
    (11, 2, 4, NULL, 23, 4, 'Kỹ năng đọc IELTS được cải thiện rõ.', DATE_SUB(NOW(), INTERVAL 9 HOUR)),
    (12, 2, 3, NULL, 22, 4, 'Giải thích Hóa học dễ hiểu, cần thêm bài tập.', DATE_SUB(NOW(), INTERVAL 8 HOUR));

INSERT IGNORE INTO notifications (
    id, user_id, title, content, type, reference_type, reference_id, is_read, read_at, created_at
) VALUES
    (11, 2, 'Bài đăng đã được duyệt', 'Bài đăng Toán 11 luyện đề cuối kỳ đã được duyệt.', 'POST_REVIEWED', 'POST', 17, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY)),
    (12, 2, 'Có ứng tuyển mới', 'Một gia sư vừa ứng tuyển bài đăng Toán 11.', 'APPLICATION_CREATED', 'POST', 17, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 11 DAY)),
    (13, 2, 'Có ứng tuyển mới', 'Gia sư Trần Thu Lan đã gửi ứng tuyển.', 'APPLICATION_CREATED', 'POST', 17, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (14, 2, 'Có ứng tuyển mới', 'Gia sư Lê Thanh Hòa đã gửi ứng tuyển.', 'APPLICATION_CREATED', 'POST', 17, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 9 DAY)),
    (15, 2, 'Có ứng tuyển mới', 'Gia sư Phạm Mai Anh đã gửi ứng tuyển.', 'APPLICATION_CREATED', 'POST', 17, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 8 DAY)),
    (16, 2, 'Lớp đã được ghép', 'Bài đăng Tiếng Anh lớp 9 đã được ghép.', 'CLASS_ASSIGNED', 'MATCHED_CLASS', 6, TRUE, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (17, 2, 'Lớp đang học', 'Lớp Toán 10 đã chuyển sang trạng thái đang học.', 'CLASS_STATUS', 'MATCHED_CLASS', 7, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 6 DAY)),
    (18, 2, 'Lớp đã hoàn thành', 'Lớp Hóa học 11 đã hoàn thành.', 'CLASS_STATUS', 'MATCHED_CLASS', 8, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (19, 2, 'Đăng ký khóa học thành công', 'Bạn đã đăng ký lớp Toán 10 nền tảng theo tuần.', 'ENROLLMENT_CREATED', 'COURSE_ENROLLMENT', 11, TRUE, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
    (20, 2, 'Đăng ký được chấp nhận', 'Gia sư đã chấp nhận đăng ký lớp Toán 11 luyện hàm số.', 'ENROLLMENT_STATUS', 'COURSE_ENROLLMENT', 12, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (21, 2, 'Đánh giá đã được ghi nhận', 'Cảm ơn bạn đã đánh giá lớp Toán 10.', 'REVIEW_CREATED', 'REVIEW', 3, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (22, 2, 'Đánh giá đã được ghi nhận', 'Cảm ơn bạn đã đánh giá lớp Toán 11.', 'REVIEW_CREATED', 'REVIEW', 4, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (23, 2, 'Có khóa học mới phù hợp', 'Lớp Toán 12 cấp tốc trước kỳ thi vừa được mở.', 'COURSE_SUGGESTION', 'COURSE', 24, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (24, 2, 'Nhắc lịch học', 'Bạn có lịch học Toán vào tối nay.', 'CLASS_REMINDER', 'MATCHED_CLASS', 7, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 18 HOUR)),
    (25, 2, 'Cần xác nhận hoàn thành', 'Gia sư đã yêu cầu xác nhận hoàn thành lớp Sinh học.', 'MATCHED_CLASS_STATUS_REQUEST', 'MATCHED_CLASS', 11, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 16 HOUR)),
    (26, 2, 'Đăng ký đang chờ duyệt', 'Đăng ký lớp Toán tư duy đang chờ gia sư xử lý.', 'ENROLLMENT_STATUS', 'COURSE_ENROLLMENT', 17, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 14 HOUR)),
    (27, 2, 'Đăng ký đang chờ duyệt', 'Đăng ký lớp thuật toán cơ bản đang chờ xử lý.', 'ENROLLMENT_STATUS', 'COURSE_ENROLLMENT', 18, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
    (28, 2, 'Đăng ký đang chờ duyệt', 'Đăng ký lớp hình học lớp 7 đang chờ xử lý.', 'ENROLLMENT_STATUS', 'COURSE_ENROLLMENT', 19, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 10 HOUR)),
    (29, 2, 'Đăng ký đang chờ duyệt', 'Đăng ký lớp Toán 12 cấp tốc đang chờ xử lý.', 'ENROLLMENT_STATUS', 'COURSE_ENROLLMENT', 20, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
    (30, 2, 'Đăng ký bị từ chối', 'Lớp Tiếng Anh giao tiếp lớp 6 đã đủ học viên.', 'ENROLLMENT_STATUS', 'COURSE_ENROLLMENT', 21, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
    (31, 1, 'Có thêm bài đăng chờ duyệt', 'Bài đăng Toán lớp 6 đang chờ duyệt.', 'POST_PENDING_REVIEW', 'POST', 33, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
    (32, 1, 'Có thêm bài đăng chờ duyệt', 'Bài đăng Tiếng Anh lớp 8 đang chờ duyệt.', 'POST_PENDING_REVIEW', 'POST', 34, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
    (33, 1, 'Có thêm khóa học chờ duyệt', 'Lớp Sinh học 12 đang chờ duyệt.', 'COURSE_PENDING_REVIEW', 'COURSE', 33, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    (34, 1, 'Có thêm hồ sơ gia sư chờ duyệt', 'Gia sư Trịnh Minh Sơn đang chờ duyệt hồ sơ.', 'TUTOR_PROFILE_PENDING', 'TUTOR', 14, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    (35, 1, 'Có thêm xác minh danh tính', 'Hồ sơ xác minh của Nguyễn Hà My đang chờ duyệt.', 'IDENTITY_PENDING_REVIEW', 'IDENTITY_VERIFICATION', 23, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR));

INSERT IGNORE INTO tutor_certificates (
    id, tutor_id, title, certificate_type, issuer, issued_date, certificate_image_url,
    status, reviewed_by, reviewed_at, rejected_reason, created_at, updated_at
) VALUES
    (7, 7, 'Bằng kỹ sư Công nghệ thông tin', 'DEGREE', 'Đại học Bách khoa Hà Nội', '2015-06-30', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 58 DAY), NULL, DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 58 DAY)),
    (8, 8, 'Bằng cử nhân Sư phạm Ngữ văn', 'DEGREE', 'Đại học Sư phạm Hà Nội', '2018-06-30', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 56 DAY), NULL, DATE_SUB(NOW(), INTERVAL 58 DAY), DATE_SUB(NOW(), INTERVAL 56 DAY)),
    (9, 9, 'Bằng cử nhân Vật lý', 'DEGREE', 'Đại học Khoa học Tự nhiên', '2013-06-30', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 54 DAY), NULL, DATE_SUB(NOW(), INTERVAL 56 DAY), DATE_SUB(NOW(), INTERVAL 54 DAY)),
    (10, 10, 'Chứng chỉ IELTS 7.5', 'LANGUAGE', 'IDP', '2023-05-20', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 52 DAY), NULL, DATE_SUB(NOW(), INTERVAL 54 DAY), DATE_SUB(NOW(), INTERVAL 52 DAY)),
    (11, 11, 'Bằng cử nhân Hóa học', 'DEGREE', 'Đại học Dược Hà Nội', '2016-06-30', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 52 DAY), DATE_SUB(NOW(), INTERVAL 50 DAY)),
    (12, 12, 'Bằng cử nhân Sinh học', 'DEGREE', 'Đại học Y Dược TP. Hồ Chí Minh', '2017-06-30', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 48 DAY), NULL, DATE_SUB(NOW(), INTERVAL 50 DAY), DATE_SUB(NOW(), INTERVAL 48 DAY)),
    (13, 13, 'Chứng chỉ IELTS 8.0', 'LANGUAGE', 'British Council', '2024-01-10', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 46 DAY), NULL, DATE_SUB(NOW(), INTERVAL 48 DAY), DATE_SUB(NOW(), INTERVAL 46 DAY)),
    (14, 14, 'Bảng điểm đại học', 'TRANSCRIPT', 'Đại học', '2024-06-01', NULL, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), NOW()),
    (15, 15, 'Chứng chỉ trợ giảng Tiếng Anh', 'OTHER', 'Trung tâm ngoại ngữ', '2024-03-12', NULL, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 11 DAY), NOW()),
    (16, 16, 'Chứng chỉ lập trình cơ bản', 'OTHER', 'Trung tâm tin học', '2024-02-20', NULL, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), NOW());

COMMIT;
