-- =========================================================
-- DATABASE: KET NOI GIA SU (FULL SCHEMA THEO MO TA NGHIEP VU)
-- MySQL 8+
-- =========================================================

CREATE DATABASE IF NOT EXISTS ket_noi_gia_su
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ket_noi_gia_su;




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


-- 6) POSTS (bai dang tim gia su)


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


-- 8) MATCHED_CLASSES (lop 1-1 tu bai dang)

CREATE TABLE matched_classes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL UNIQUE,
    application_id BIGINT NOT NULL UNIQUE,
    start_date DATE NULL,
    end_date DATE NULL,
    status ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'ASSIGNED',
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


-- 9) TUTOR_COURSES (lop/khoa hoc gia su tu mo)

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
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
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
