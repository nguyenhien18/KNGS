
CREATE DATABASE kngs2
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE kngs2;




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




START TRANSACTION;

INSERT IGNORE INTO subjects (id, name) VALUES
    (1, 'Toán'),
    (2, 'Ngữ Văn'),
    (3, 'Tiếng Anh'),
    (4, 'Vật Lý'),
    (5, 'Hóa Học'),
    (6, 'Sinh Học'),
    (7, 'Lịch Sử'),
    (8, 'Địa Lý'),
    (9, 'Tin Học'),
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

INSERT IGNORE INTO users (id, role, email, password, full_name, phone, birth_date, gender, avatar, address, status, created_at, updated_at) VALUES
    (1, 'ADMIN', 'admin@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Quản Trị Viên', '0900000001', '1990-01-01', 'OTHER', NULL, 'Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),

    (2, 'LEARNER', 'hocvien1@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Nguyễn Văn An', '0900000002', '2006-03-12', 'MALE', NULL, 'Cầu Giấy, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 'LEARNER', 'hocvien2@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Trần Gia Bình', '0900000003', '2007-07-20', 'MALE', NULL, 'Thanh Xuân, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 'LEARNER', 'hocvien3@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Lê Minh Chi', '0900000004', '2008-05-15', 'FEMALE', NULL, 'Quận 1, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (5, 'LEARNER', 'hocvien4@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Phạm Quang Dũng', '0900000005', '2005-11-05', 'MALE', NULL, 'Hải Châu, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (6, 'LEARNER', 'hocvien5@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Đỗ Minh Khang', '0900000006', '2006-09-09', 'MALE', NULL, 'Ba Đình, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (7, 'LEARNER', 'hocvien6@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Vũ Thanh Hà', '0900000007', '2007-10-11', 'FEMALE', NULL, 'Hà Đông, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (8, 'LEARNER', 'hocvien7@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Bùi Anh Tuấn', '0900000008', '2008-02-21', 'MALE', NULL, 'Sơn Trà, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (9, 'LEARNER', 'hocvien8@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Hoàng Thu Trang', '0900000009', '2006-12-09', 'FEMALE', NULL, 'Bình Thạnh, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (10, 'LEARNER', 'hocvien9@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Ngô Gia Huy', '0900000010', '2005-04-18', 'MALE', NULL, 'Nam Từ Liêm, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (11, 'LEARNER', 'hocvien10@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Đặng Minh Quân', '0900000011', '2007-01-25', 'MALE', NULL, 'Cẩm Lệ, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (12, 'LEARNER', 'hocvien11@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Phan Hải Yến', '0900000012', '2008-08-30', 'FEMALE', NULL, 'Tân Bình, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (13, 'LEARNER', 'hocvien12@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Lý Bảo Ngọc', '0900000013', '2006-06-06', 'FEMALE', NULL, 'Đống Đa, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (14, 'LEARNER', 'hocvien13@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Đinh Nhật Minh', '0900000014', '2007-11-19', 'MALE', NULL, 'Thanh Khê, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),

    (20, 'TUTOR', 'giasu1@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Nguyễn Đức Minh', '0900000100', '1995-02-12', 'MALE', NULL, 'Đống Đa, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (21, 'TUTOR', 'giasu2@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Trần Thu Lan', '0900000101', '1993-04-18', 'FEMALE', NULL, 'Cầu Giấy, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (22, 'TUTOR', 'giasu3@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Lê Thanh Hòa', '0900000102', '1991-08-21', 'MALE', NULL, 'Quận 3, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (23, 'TUTOR', 'giasu4@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Phạm Mai Anh', '0900000103', '1996-12-02', 'FEMALE', NULL, 'Hải Châu, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (24, 'TUTOR', 'giasu5@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Đặng Hoàng Nam', '0900000104', '1998-06-10', 'MALE', NULL, 'Hà Đông, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (25, 'TUTOR', 'giasu6@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Võ Thảo Nguyên', '0900000105', '1994-10-10', 'FEMALE', NULL, 'Bình Thạnh, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (26, 'TUTOR', 'giasu7@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Mai Quốc Bảo', '0900000106', '1992-09-14', 'MALE', NULL, 'Thanh Xuân, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (27, 'TUTOR', 'giasu8@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Nguyễn Hà My', '0900000107', '1997-03-22', 'FEMALE', NULL, 'Sơn Trà, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (28, 'TUTOR', 'giasu9@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Trịnh Anh Kiệt', '0900000108', '1990-05-05', 'MALE', NULL, 'Tân Bình, TP. Hồ Chí Minh', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (29, 'TUTOR', 'giasu10@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Đỗ Phương Linh', '0900000109', '1999-01-17', 'FEMALE', NULL, 'Ba Đình, Hà Nội', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (30, 'TUTOR', 'giasu11@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Gia Sư Chờ Duyệt', '0900000110', '1998-06-10', 'OTHER', NULL, 'Hải Châu, Đà Nẵng', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (31, 'TUTOR', 'giasu12@gmail.com', '$2y$10$7ef84CQtsiP/85U8D.W6YO1K9Ki37/ZY1mR7GoorcVlIKMGog1lla', 'Tài Khoản Gia Sư Bị Khóa', '0900000111', '1994-10-10', 'MALE', NULL, 'Thủ Đức, TP. Hồ Chí Minh', 'BLOCKED', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO tutors (id, user_id, description, experience, qualification, teaching_mode, province, district, hourly_rate, profile_status, reviewed_by, reviewed_at, rejected_reason, created_at, updated_at) VALUES
    (1, 20, 'Gia sư Toán cấp 3, ôn thi THPT theo lộ trình cá nhân.', '5 năm dạy Toán 10-12', 'Đại học Sư phạm Hà Nội', 'BOTH', 'Hà Nội', 'Đống Đa', 250000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 21, 'Gia sư Tiếng Anh giao tiếp và ngữ pháp nền tảng.', '7 năm dạy Tiếng Anh', 'IELTS 8.0', 'ONLINE', 'Hà Nội', 'Cầu Giấy', 300000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 22, 'Gia sư Hóa - Lý, hỗ trợ học sinh mất gốc.', '6 năm dạy Hóa Học và Vật Lý', 'Đại học Khoa học Tự nhiên', 'OFFLINE', 'TP. Hồ Chí Minh', 'Quận 3', 280000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 23, 'Gia sư IELTS và tiếng Anh học thuật.', '4 năm luyện IELTS', 'IELTS 8.5', 'ONLINE', 'Đà Nẵng', 'Hải Châu', 350000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (5, 24, 'Gia sư Toán THCS, kiên nhẫn với học sinh mất gốc.', '3 năm dạy Toán THCS', 'Sinh viên năm cuối ngành Sư phạm Toán', 'BOTH', 'Hà Nội', 'Hà Đông', 180000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (6, 25, 'Gia sư Ngữ Văn, luyện viết và đọc hiểu.', '5 năm dạy Ngữ Văn', 'Cử nhân Văn học', 'OFFLINE', 'TP. Hồ Chí Minh', 'Bình Thạnh', 220000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (7, 26, 'Gia sư Tin Học cơ bản và Python cho học sinh.', '4 năm hướng dẫn lập trình cơ bản', 'Kỹ sư Công nghệ thông tin', 'ONLINE', 'Hà Nội', 'Thanh Xuân', 240000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (8, 27, 'Gia sư Sinh Học, ôn tập theo chuyên đề.', '3 năm dạy Sinh Học', 'Đại học Y Dược', 'BOTH', 'Đà Nẵng', 'Sơn Trà', 210000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (9, 28, 'Gia sư Lịch Sử - Địa Lý, hệ thống kiến thức dễ nhớ.', '6 năm dạy nhóm môn xã hội', 'Đại học Sư phạm TP. Hồ Chí Minh', 'OFFLINE', 'TP. Hồ Chí Minh', 'Tân Bình', 200000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (10, 29, 'Gia sư Tiếng Anh trẻ em và giao tiếp cơ bản.', '4 năm dạy Tiếng Anh thiếu nhi', 'Chứng chỉ TESOL', 'ONLINE', 'Hà Nội', 'Ba Đình', 260000, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (11, 30, 'Hồ sơ gia sư đang chờ quản trị viên duyệt.', '2 năm trợ giảng', 'Sinh viên năm 4', 'BOTH', 'Đà Nẵng', 'Hải Châu', 180000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (12, 31, 'Hồ sơ bị khóa do thông tin xác minh không hợp lệ.', '3 năm kinh nghiệm', 'Cử nhân', 'OFFLINE', 'TP. Hồ Chí Minh', 'Thủ Đức', 200000, 'BLOCKED', 1, DATE_SUB(NOW(), INTERVAL 60 DAY), 'Tài khoản bị khóa do thông tin xác minh không hợp lệ', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO identity_verifications (id, user_id, status, full_name_on_id, id_number, date_of_birth_on_id, issued_date, issued_place, address_on_id, id_front_image_url, id_back_image_url, selfie_image_url, reviewed_by, reviewed_at, rejected_reason, created_at, updated_at) VALUES
    (1, 1, 'APPROVED', 'Quản Trị Viên', '001200000001', '1990-01-01', '2022-01-01', 'Hà Nội', 'Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 2, 'APPROVED', 'Nguyễn Văn An', '001200000002', '2006-03-12', '2022-01-01', 'Hà Nội', 'Cầu Giấy, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 3, 'APPROVED', 'Trần Gia Bình', '001200000003', '2007-07-20', '2022-01-01', 'Hà Nội', 'Thanh Xuân, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 4, 'APPROVED', 'Lê Minh Chi', '001200000004', '2008-05-15', '2022-01-01', 'Hà Nội', 'Quận 1, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (5, 5, 'APPROVED', 'Phạm Quang Dũng', '001200000005', '2005-11-05', '2022-01-01', 'Hà Nội', 'Hải Châu, Đà Nẵng', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (6, 6, 'APPROVED', 'Đỗ Minh Khang', '001200000006', '2006-09-09', '2022-01-01', 'Hà Nội', 'Ba Đình, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (7, 7, 'APPROVED', 'Vũ Thanh Hà', '001200000007', '2007-10-11', '2022-01-01', 'Hà Nội', 'Hà Đông, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (8, 8, 'APPROVED', 'Bùi Anh Tuấn', '001200000008', '2008-02-21', '2022-01-01', 'Hà Nội', 'Sơn Trà, Đà Nẵng', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (9, 9, 'APPROVED', 'Hoàng Thu Trang', '001200000009', '2006-12-09', '2022-01-01', 'Hà Nội', 'Bình Thạnh, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (10, 10, 'APPROVED', 'Ngô Gia Huy', '001200000010', '2005-04-18', '2022-01-01', 'Hà Nội', 'Nam Từ Liêm, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (11, 11, 'APPROVED', 'Đặng Minh Quân', '001200000011', '2007-01-25', '2022-01-01', 'Hà Nội', 'Cẩm Lệ, Đà Nẵng', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (12, 12, 'APPROVED', 'Phan Hải Yến', '001200000012', '2008-08-30', '2022-01-01', 'Hà Nội', 'Tân Bình, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (13, 13, 'APPROVED', 'Lý Bảo Ngọc', '001200000013', '2006-06-06', '2022-01-01', 'Hà Nội', 'Đống Đa, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (14, 14, 'APPROVED', 'Đinh Nhật Minh', '001200000014', '2007-11-19', '2022-01-01', 'Hà Nội', 'Thanh Khê, Đà Nẵng', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (15, 20, 'APPROVED', 'Nguyễn Đức Minh', '001200000015', '1995-02-12', '2022-01-01', 'Hà Nội', 'Đống Đa, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (16, 21, 'APPROVED', 'Trần Thu Lan', '001200000016', '1993-04-18', '2022-01-01', 'Hà Nội', 'Cầu Giấy, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (17, 22, 'APPROVED', 'Lê Thanh Hòa', '001200000017', '1991-08-21', '2022-01-01', 'Hà Nội', 'Quận 3, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (18, 23, 'APPROVED', 'Phạm Mai Anh', '001200000018', '1996-12-02', '2022-01-01', 'Hà Nội', 'Hải Châu, Đà Nẵng', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (19, 24, 'APPROVED', 'Đặng Hoàng Nam', '001200000019', '1998-06-10', '2022-01-01', 'Hà Nội', 'Hà Đông, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (20, 25, 'APPROVED', 'Võ Thảo Nguyên', '001200000020', '1994-10-10', '2022-01-01', 'Hà Nội', 'Bình Thạnh, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (21, 26, 'APPROVED', 'Mai Quốc Bảo', '001200000021', '1992-09-14', '2022-01-01', 'Hà Nội', 'Thanh Xuân, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (22, 27, 'APPROVED', 'Nguyễn Hà My', '001200000022', '1997-03-22', '2022-01-01', 'Hà Nội', 'Sơn Trà, Đà Nẵng', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (23, 28, 'APPROVED', 'Trịnh Anh Kiệt', '001200000023', '1990-05-05', '2022-01-01', 'Hà Nội', 'Tân Bình, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (24, 29, 'APPROVED', 'Đỗ Phương Linh', '001200000024', '1999-01-17', '2022-01-01', 'Hà Nội', 'Ba Đình, Hà Nội', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (25, 30, 'PENDING', 'Gia Sư Chờ Duyệt', '001200000025', '1998-06-10', '2022-01-01', 'Hà Nội', 'Hải Châu, Đà Nẵng', NULL, NULL, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (26, 31, 'REJECTED', 'Tài Khoản Gia Sư Bị Khóa', '001200000026', '1994-10-10', '2022-01-01', 'Hà Nội', 'Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 1, DATE_SUB(NOW(), INTERVAL 50 DAY), 'Ảnh giấy tờ chưa rõ', DATE_SUB(NOW(), INTERVAL 51 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO tutor_teachings (id, tutor_id, subject_id, grade_id, created_at) VALUES
    (1, 1, 1, 10, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (2, 1, 1, 11, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (3, 1, 1, 12, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (4, 1, 9, 9, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (5, 2, 3, 8, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (6, 2, 3, 9, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (7, 2, 3, 10, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (8, 2, 10, 12, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (9, 3, 4, 11, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (10, 3, 5, 10, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (11, 3, 5, 11, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (12, 3, 5, 12, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (13, 4, 3, 10, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (14, 4, 3, 11, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (15, 4, 10, 12, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (16, 5, 1, 8, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (17, 5, 1, 9, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (18, 6, 2, 8, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (19, 6, 2, 9, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (20, 7, 9, 8, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (21, 7, 9, 9, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (22, 8, 6, 10, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (23, 9, 7, 8, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (24, 9, 8, 9, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (25, 10, 3, 6, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (26, 10, 3, 7, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (27, 11, 1, 8, DATE_SUB(NOW(), INTERVAL 70 DAY)),
    (28, 12, 4, 10, DATE_SUB(NOW(), INTERVAL 70 DAY));

INSERT IGNORE INTO posts (id, learner_user_id, subject_id, grade_id, title, description, teaching_mode, study_time, budget, province, district, address_detail, approval_status, approved_by, approved_at, rejected_reason, status, created_at, updated_at) VALUES
    (1, 2, 1, 12, 'Cần gia sư Toán 12 ôn thi THPT', 'Cần học 3 buổi mỗi tuần, tập trung hàm số và hình học.', 'BOTH', 'Tối thứ 2, 4, 6', 300000, 'Hà Nội', 'Cầu Giấy', 'Gần Đại học Quốc gia', 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 29 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 2, 3, 10, 'Học Tiếng Anh lớp 10 từ mất gốc', 'Cần gia sư kiên nhẫn, dạy ngữ pháp cơ bản.', 'ONLINE', 'Tối thứ 3, 5', 220000, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'ASSIGNED', DATE_SUB(NOW(), INTERVAL 28 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 3, 4, 11, 'Cần gia sư Vật Lý 11', 'Tập trung điện xoay chiều và bài tập nâng cao.', 'OFFLINE', 'Chiều thứ 7', 260000, 'Hà Nội', 'Thanh Xuân', 'Gần Ngã Tư Sở', 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 27 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 3, 5, 12, 'Ôn Hóa 12 cấp tốc', 'Cần tổng ôn chương Este và Amin.', 'ONLINE', 'Sáng chủ nhật', 280000, 'Hà Nội', 'Thanh Xuân', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 26 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (5, 4, 1, 9, 'Tìm gia sư Toán 9 luyện thi vào 10', 'Cần học theo đề thi vào lớp 10.', 'OFFLINE', 'Tối thứ 2, 5', 200000, 'TP. Hồ Chí Minh', 'Quận 1', 'Gần chợ Bến Thành', 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (6, 4, 6, 10, 'Bổ sung kiến thức Sinh Học 10', 'Bài đăng cần chỉnh lại thông tin lịch học trước khi duyệt.', 'ONLINE', 'Cuối tuần', 180000, 'TP. Hồ Chí Minh', 'Quận 1', NULL, 'REJECTED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), 'Cần bổ sung thông tin lịch học rõ hơn', 'OPEN', DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (7, 5, 10, 12, 'Cần gia sư IELTS mục tiêu 6.5', 'Học online, luyện speaking và writing.', 'ONLINE', 'Tối thứ 2, 4', 350000, 'Đà Nẵng', 'Hải Châu', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 23 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (8, 5, 2, 8, 'Tìm gia sư Ngữ Văn lớp 8', 'Học theo sách giáo khoa và luyện viết đoạn văn.', 'BOTH', 'Linh động', 170000, 'Đà Nẵng', 'Hải Châu', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'CANCELLED', DATE_SUB(NOW(), INTERVAL 22 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (9, 6, 1, 6, 'Cần gia sư Toán lớp 6 học online', 'Học sinh cần củng cố kiến thức cơ bản trong học kỳ.', 'ONLINE', 'Tối thứ 2', 150000, 'Hà Nội', 'Ba Đình', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (10, 6, 3, 7, 'Cần gia sư Tiếng Anh lớp 7', 'Muốn luyện phát âm và từ vựng theo bài trên lớp.', 'ONLINE', 'Tối thứ 3', 150000, 'Hà Nội', 'Ba Đình', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (11, 6, 5, 8, 'Cần gia sư Hóa lớp 8', 'Học sinh mới làm quen môn Hóa, cần giải thích chậm.', 'ONLINE', 'Tối thứ 4', 150000, 'Hà Nội', 'Ba Đình', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (12, 6, 9, 9, 'Cần gia sư Tin Học lớp 9', 'Muốn học tư duy thuật toán cơ bản và luyện bài tập.', 'ONLINE', 'Tối thứ 5', 150000, 'Hà Nội', 'Ba Đình', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (13, 2, 1, 12, 'Lớp Toán đang chờ xác nhận hoàn thành', 'Hai bên đã học xong chương trình và đang chờ xác nhận.', 'BOTH', 'Tối thứ 7', 320000, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (14, 3, 3, 10, 'Lớp Tiếng Anh đang chờ xác nhận hủy', 'Học viên thay đổi lịch học và cần xác nhận hủy lớp.', 'ONLINE', 'Tối chủ nhật', 230000, 'Hà Nội', 'Thanh Xuân', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (15, 5, 8, 9, 'Cần gia sư Địa Lý 9', 'Cần học theo sách giáo khoa và đề cương kiểm tra.', 'ONLINE', 'Tối thứ 6', 160000, 'Đà Nẵng', 'Hải Châu', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (16, 4, 7, 8, 'Cần gia sư Lịch Sử 8', 'Học theo chủ đề và ôn kiểm tra trên lớp.', 'BOTH', 'Cuối tuần', 160000, 'TP. Hồ Chí Minh', 'Quận 1', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (17, 7, 1, 8, 'Tìm gia sư Toán lớp 8 tại Hà Đông', 'Cần học trực tiếp vào cuối tuần.', 'OFFLINE', 'Sáng chủ nhật', 180000, 'Hà Nội', 'Hà Đông', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (18, 8, 3, 6, 'Cần gia sư Tiếng Anh lớp 6', 'Học sinh cần luyện nghe nói cơ bản.', 'ONLINE', 'Tối thứ 6', 170000, 'Đà Nẵng', 'Sơn Trà', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (19, 9, 5, 10, 'Ôn tập Hóa Học lớp 10 cuối kỳ', 'Cần hệ thống lại công thức và dạng bài thường gặp.', 'BOTH', 'Chiều thứ 7', 190000, 'TP. Hồ Chí Minh', 'Bình Thạnh', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (20, 10, 9, 9, 'Cần gia sư Tin Học cơ bản cho học sinh lớp 9', 'Muốn học Python cơ bản và cách giải bài tập.', 'ONLINE', 'Tối thứ 4', 200000, 'Hà Nội', 'Nam Từ Liêm', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (21, 11, 2, 11, 'Tìm gia sư Ngữ Văn lớp 11', 'Cần luyện phân tích tác phẩm và viết bài nghị luận.', 'OFFLINE', 'Tối thứ 3', 210000, 'Đà Nẵng', 'Cẩm Lệ', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (22, 12, 4, 12, 'Cần gia sư Vật Lý 12 ôn thi', 'Tập trung dao động, sóng và điện xoay chiều.', 'ONLINE', 'Tối thứ 5', 260000, 'TP. Hồ Chí Minh', 'Tân Bình', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (23, 13, 6, 11, 'Cần gia sư Sinh Học lớp 11', 'Học theo chuyên đề, ôn tập trước kiểm tra học kỳ.', 'BOTH', 'Cuối tuần', 190000, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (24, 14, 8, 9, 'Tìm gia sư Địa Lý lớp 9', 'Cần hướng dẫn làm đề cương và đọc Atlat.', 'ONLINE', 'Tối thứ 2', 160000, 'Đà Nẵng', 'Thanh Khê', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO applications (id, post_id, tutor_id, message, expected_fee, status, created_at, updated_at) VALUES
    (1, 1, 1, 'Tôi có kinh nghiệm ôn thi THPT môn Toán.', 280000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 1, 2, 'Tôi có thể hỗ trợ thêm phần tư duy giải bài.', 260000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 2, 2, 'Nhận dạy Tiếng Anh lớp 10 từ cơ bản.', 220000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 3, 1, 'Có thể dạy Vật Lý theo lộ trình đề thi.', 260000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (5, 4, 3, 'Nhận ôn Hóa 12 cấp tốc.', 280000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (6, 7, 4, 'Nhận luyện IELTS online target 6.5.', 350000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (7, 7, 2, 'Có thể dạy speaking và grammar.', 300000, 'REJECTED', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (8, 8, 1, 'Đơn đã hủy theo bài đăng.', 170000, 'CANCELLED', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (9, 13, 1, 'Tôi đã hoàn thành chương trình và chờ học viên xác nhận.', 320000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (10, 14, 2, 'Lớp đang chờ xác nhận hủy theo yêu cầu học viên.', 230000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (11, 15, 3, 'Tôi có thể dạy Địa Lý online.', 160000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (12, 16, 1, 'Tôi có thể dạy Lịch Sử theo đề cương.', 160000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (13, 17, 5, 'Tôi nhận dạy Toán lớp 8 trực tiếp tại Hà Đông.', 180000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (14, 18, 8, 'Tôi có kinh nghiệm dạy Tiếng Anh lớp 6.', 170000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (15, 19, 3, 'Tôi có thể hỗ trợ Hóa Học cuối kỳ.', 190000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (16, 20, 7, 'Tôi nhận dạy Tin Học và Python cơ bản.', 200000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (17, 21, 6, 'Tôi có thể hướng dẫn viết bài nghị luận.', 210000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (18, 22, 3, 'Tôi có kinh nghiệm ôn Vật Lý 12.', 260000, 'PENDING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO matched_classes (id, post_id, application_id, start_date, end_date, status, status_requested_by_user_id, status_requested_by_role, status_requested_at, status_request_reason, assigned_at, completed_at, cancelled_at, created_at, updated_at) VALUES
    (1, 2, 3, DATE_SUB(CURDATE(), INTERVAL 10 DAY), NULL, 'ASSIGNED', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 3, 4, DATE_SUB(CURDATE(), INTERVAL 10 DAY), NULL, 'IN_PROGRESS', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 4, 5, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'COMPLETED', NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 13, 9, DATE_SUB(CURDATE(), INTERVAL 10 DAY), NULL, 'COMPLETION_REQUESTED', 20, 'TUTOR', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Gia sư đã hoàn thành chương trình và yêu cầu xác nhận.', DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (5, 14, 10, DATE_SUB(CURDATE(), INTERVAL 10 DAY), NULL, 'CANCELLATION_REQUESTED', 3, 'LEARNER', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Học viên bận lịch nên yêu cầu hủy lớp.', DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO tutor_courses (id, tutor_id, title, description, subject_id, grade_id, teaching_mode, study_time, price, max_students, province, district, address_detail, approval_status, approved_by, approved_at, rejected_reason, status, created_at, updated_at) VALUES
    (1, 1, 'Lớp Toán 12 ôn thi THPT', 'Hệ thống hóa kiến thức và luyện đề.', 1, 12, 'BOTH', '3 buổi/tuần', 280000, 5, 'Hà Nội', 'Đống Đa', 'Gần Thái Hà', 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 29 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 2, 'Tiếng Anh lớp 10 mất gốc', 'Ngữ pháp, từ vựng và giao tiếp cơ bản.', 3, 10, 'ONLINE', '2 buổi/tuần', 220000, 8, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 28 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 3, 'Hóa Học 12 từ cơ bản đến nâng cao', 'Phù hợp học sinh cần tăng điểm nhanh.', 5, 12, 'OFFLINE', 'Cuối tuần', 260000, 6, 'TP. Hồ Chí Minh', 'Quận 3', 'Gần Hồ Con Rùa', 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 27 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 4, 'IELTS Speaking 6.5+', 'Luyện phản xạ và mở rộng từ vựng học thuật.', 10, 12, 'ONLINE', 'Tối thứ 3, 5', 350000, 10, 'Đà Nẵng', 'Hải Châu', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 26 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (5, 1, 'Tin Học lớp 9 Python cơ bản', 'Làm quen tư duy lập trình.', 9, 9, 'ONLINE', 'Sáng thứ 7', 200000, 4, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'CLOSED', DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (6, 2, 'Tiếng Anh lớp 8 cho học sinh mới bắt đầu', 'Khóa học đang chờ quản trị viên duyệt.', 3, 8, 'ONLINE', 'Tối thứ 2, 4', 180000, 6, 'Hà Nội', 'Cầu Giấy', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (7, 3, 'Vật Lý 11 nâng cao', 'Khóa học cần bổ sung mô tả chi tiết hơn.', 4, 11, 'OFFLINE', 'Chiều chủ nhật', 260000, 5, 'TP. Hồ Chí Minh', 'Quận 3', NULL, 'REJECTED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), 'Cần bổ sung mô tả chi tiết hơn', 'OPEN', DATE_SUB(NOW(), INTERVAL 23 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (8, 1, 'Toán 11 đang học', 'Lớp đã có học viên và đang diễn ra.', 1, 11, 'BOTH', '2 buổi/tuần', 250000, 3, 'Hà Nội', 'Đống Đa', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 22 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (9, 2, 'IELTS Foundation đã hoàn thành', 'Khóa học luyện nền tảng IELTS cho học sinh THPT.', 10, 12, 'ONLINE', '3 buổi/tuần', 320000, 8, 'Hà Nội', 'Cầu Giấy', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (10, 3, 'Hóa Học 10 đã hủy', 'Khóa học đã hủy do không đủ lịch học phù hợp.', 5, 10, 'OFFLINE', 'Tối thứ 6', 220000, 4, 'TP. Hồ Chí Minh', 'Quận 3', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'CANCELLED', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (11, 4, 'Tiếng Anh lớp 6 phát âm cơ bản', 'Luyện phát âm, từ vựng và mẫu câu giao tiếp.', 3, 6, 'ONLINE', 'Tối thứ 2', 180000, 5, 'Đà Nẵng', 'Hải Châu', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (12, 4, 'IELTS Writing Task 1 cơ bản', 'Hướng dẫn viết biểu đồ và sửa bài theo tuần.', 10, 11, 'ONLINE', 'Tối thứ 3', 220000, 5, 'Đà Nẵng', 'Hải Châu', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (13, 4, 'Tiếng Anh lớp 8 nâng cao', 'Ôn tập ngữ pháp và luyện đọc hiểu.', 3, 8, 'ONLINE', 'Tối thứ 4', 180000, 5, 'Đà Nẵng', 'Hải Châu', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (14, 4, 'IELTS Listening nền tảng', 'Luyện nghe theo chủ đề quen thuộc.', 10, 9, 'ONLINE', 'Tối thứ 5', 200000, 5, 'Đà Nẵng', 'Hải Châu', NULL, 'PENDING', NULL, NULL, NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (15, 5, 'Toán lớp 8 mất gốc', 'Củng cố số học, hình học và phương pháp làm bài.', 1, 8, 'BOTH', 'Cuối tuần', 180000, 6, 'Hà Nội', 'Hà Đông', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (16, 6, 'Ngữ Văn lớp 9 luyện thi vào 10', 'Luyện đọc hiểu và viết đoạn văn nghị luận.', 2, 9, 'OFFLINE', 'Tối thứ 6', 200000, 5, 'TP. Hồ Chí Minh', 'Bình Thạnh', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (17, 7, 'Python cơ bản cho học sinh THCS', 'Học biến, vòng lặp, hàm và bài tập thực hành.', 9, 8, 'ONLINE', 'Sáng chủ nhật', 210000, 8, 'Hà Nội', 'Thanh Xuân', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (18, 8, 'Sinh Học 10 theo chuyên đề', 'Ôn tập kiến thức trọng tâm và luyện câu hỏi trắc nghiệm.', 6, 10, 'BOTH', 'Chiều thứ 7', 190000, 5, 'Đà Nẵng', 'Sơn Trà', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (19, 9, 'Lịch Sử 8 dễ nhớ', 'Học theo sơ đồ tư duy và mốc thời gian.', 7, 8, 'ONLINE', 'Tối thứ 2', 160000, 6, 'TP. Hồ Chí Minh', 'Tân Bình', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (20, 10, 'Tiếng Anh giao tiếp cho học sinh lớp 7', 'Luyện nghe nói theo tình huống hằng ngày.', 3, 7, 'ONLINE', 'Tối thứ 5', 230000, 8, 'Hà Nội', 'Ba Đình', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 'OPEN', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO course_enrollments (id, course_id, learner_user_id, message, agreed_fee, status, joined_at, completed_at, cancelled_at, created_at, updated_at) VALUES
    (1, 1, 2, 'Em muốn đăng ký lớp Toán 12.', 280000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 1, 3, 'Em cần học từ cơ bản.', 280000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 2, 4, 'Em muốn học Tiếng Anh online.', 220000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 2, 5, 'Lịch học của em không phù hợp.', 220000, 'REJECTED', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (5, 8, 2, 'Đang học lớp Toán 11.', 250000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (6, 9, 3, 'Đã hoàn thành lớp IELTS Foundation.', 320000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (7, 3, 5, 'Muốn học Hóa 12.', 260000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (8, 4, 2, 'Muốn luyện speaking IELTS.', 350000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (9, 5, 4, 'Đăng ký lớp Tin Học Python.', 200000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (10, 10, 5, 'Đăng ký đã bị hủy theo lớp.', 220000, 'CANCELLED', NULL, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (11, 15, 6, 'Em muốn học Toán lớp 8 cuối tuần.', 180000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (12, 16, 7, 'Em muốn luyện viết Văn lớp 9.', 200000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (13, 17, 8, 'Em muốn học Python cơ bản.', 210000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (14, 18, 9, 'Em cần ôn Sinh Học theo chuyên đề.', 190000, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (15, 19, 10, 'Em muốn học Lịch Sử bằng sơ đồ tư duy.', 160000, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (16, 20, 11, 'Em muốn luyện giao tiếp Tiếng Anh.', 230000, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO reviews (id, learner_user_id, tutor_id, class_id, course_enrollment_id, rating, comment, created_at) VALUES
    (1, 3, 3, 3, NULL, 5, 'Gia sư dạy dễ hiểu, bài tập sát đề.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 3, 2, NULL, 6, 4, 'Khóa IELTS hữu ích, cần thêm bài tập writing.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (3, 4, 2, NULL, 3, 5, 'Cô giảng chậm rãi, em hiểu phần ngữ pháp hơn.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (4, 2, 4, NULL, 8, 5, 'Buổi học speaking rất thực tế và dễ áp dụng.', DATE_SUB(NOW(), INTERVAL 4 DAY)),
    (5, 4, 1, NULL, 9, 4, 'Khóa Python dễ theo, bài tập vừa sức.', DATE_SUB(NOW(), INTERVAL 5 DAY)),
    (6, 7, 6, NULL, 12, 5, 'Gia sư hướng dẫn viết bài rất chi tiết.', DATE_SUB(NOW(), INTERVAL 6 DAY)),
    (7, 8, 7, NULL, 13, 5, 'Khóa Tin Học giúp em hiểu vòng lặp và hàm.', DATE_SUB(NOW(), INTERVAL 7 DAY)),
    (8, 10, 9, NULL, 15, 4, 'Cách dạy Lịch Sử dễ nhớ hơn trên lớp.', DATE_SUB(NOW(), INTERVAL 8 DAY)),
    (9, 5, 3, NULL, 2, 5, 'Thầy dạy Hóa dễ hiểu và có nhiều ví dụ.', DATE_SUB(NOW(), INTERVAL 9 DAY)),
    (10, 2, 1, NULL, 5, 4, 'Lớp Toán 11 có lộ trình rõ ràng.', DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (11, 9, 8, NULL, 14, 5, 'Gia sư chuẩn bị tài liệu tốt và đúng giờ.', DATE_SUB(NOW(), INTERVAL 11 DAY)),
    (12, 11, 10, NULL, 16, 4, 'Lớp giao tiếp vui, em tự tin nói hơn.', DATE_SUB(NOW(), INTERVAL 12 DAY));

INSERT IGNORE INTO notifications (id, user_id, title, content, type, reference_type, reference_id, is_read, read_at, created_at) VALUES
    (1, 1, 'Có bài đăng cần duyệt', 'Bài đăng Toán 9 luyện thi vào 10 đang chờ duyệt.', 'POST_PENDING_REVIEW', 'POST', 5, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 20 HOUR)),
    (2, 1, 'Có khóa học cần duyệt', 'Khóa học Tiếng Anh lớp 8 cho học sinh mới bắt đầu đang chờ duyệt.', 'COURSE_PENDING_REVIEW', 'COURSE', 6, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 19 HOUR)),
    (3, 2, 'Lớp đã được ghép', 'Bài đăng Tiếng Anh lớp 10 đã được ghép với gia sư.', 'CLASS_ASSIGNED', 'MATCHED_CLASS', 1, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 18 HOUR)),
    (4, 20, 'Cần xác nhận hủy lớp', 'Học viên đã yêu cầu hủy lớp. Vui lòng xác nhận.', 'MATCHED_CLASS_STATUS_REQUEST', 'MATCHED_CLASS', 5, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 17 HOUR)),
    (5, 2, 'Cần xác nhận hoàn thành lớp', 'Gia sư đã yêu cầu hoàn thành lớp. Vui lòng xác nhận.', 'MATCHED_CLASS_STATUS_REQUEST', 'MATCHED_CLASS', 4, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 16 HOUR)),
    (6, 21, 'Đơn ứng tuyển được chấp nhận', 'Đơn ứng tuyển của bạn đã được học viên chấp nhận.', 'APPLICATION_DECISION', 'APPLICATION', 3, TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 15 HOUR)),
    (7, 22, 'Bạn có đánh giá mới', 'Học viên đã đánh giá lớp Hóa 12 của bạn.', 'REVIEW_CREATED', 'REVIEW', 1, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 14 HOUR)),
    (8, 3, 'Đăng ký khóa học được chấp nhận', 'Đăng ký lớp Toán 12 đã được chấp nhận.', 'ENROLLMENT_STATUS', 'COURSE_ENROLLMENT', 2, TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 13 HOUR)),
    (9, 30, 'Hồ sơ đang chờ duyệt', 'Hồ sơ gia sư của bạn đang chờ quản trị viên duyệt.', 'TUTOR_PROFILE_PENDING', 'TUTOR', 11, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
    (10, 6, 'Bài đăng đang chờ duyệt', 'Bài đăng Toán lớp 6 online của bạn đang chờ duyệt.', 'POST_PENDING_REVIEW', 'POST', 9, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 11 HOUR)),
    (11, 1, 'Có chứng chỉ cần duyệt', 'Chứng chỉ IELTS 8.5 của gia sư Phạm Mai Anh đang chờ duyệt.', 'CERTIFICATE_PENDING_REVIEW', 'CERTIFICATE', 4, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 10 HOUR)),
    (12, 4, 'Bài đăng bị từ chối', 'Bài đăng Sinh Học 10 cần bổ sung thông tin lịch học rõ hơn.', 'POST_REJECTED', 'POST', 6, TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 9 HOUR)),
    (13, 5, 'Có gia sư ứng tuyển', 'Gia sư Lê Thanh Hòa đã gửi đơn ứng tuyển vào bài đăng của bạn.', 'APPLICATION_CREATED', 'APPLICATION', 11, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
    (14, 7, 'Đăng ký khóa học đang chờ duyệt', 'Bạn đã gửi đăng ký khóa Ngữ Văn lớp 9 luyện thi vào 10.', 'ENROLLMENT_CREATED', 'COURSE_ENROLLMENT', 12, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 7 HOUR)),
    (15, 23, 'Có học viên đăng ký khóa học', 'Học viên muốn đăng ký khóa Hóa Học 12 từ cơ bản đến nâng cao.', 'ENROLLMENT_CREATED', 'COURSE_ENROLLMENT', 7, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
    (16, 8, 'Khóa học đã được duyệt', 'Khóa Python cơ bản cho học sinh THCS đã được duyệt.', 'COURSE_APPROVED', 'COURSE', 17, TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 5 HOUR)),
    (17, 9, 'Lớp học đang diễn ra', 'Lớp Sinh Học 10 theo chuyên đề đã có học viên tham gia.', 'COURSE_IN_PROGRESS', 'COURSE', 18, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
    (18, 10, 'Có đánh giá mới', 'Học viên đã để lại đánh giá cho khóa học của bạn.', 'REVIEW_CREATED', 'REVIEW', 12, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
    (19, 1, 'Có khóa học cần duyệt', 'Khóa IELTS Writing Task 1 cơ bản đang chờ duyệt.', 'COURSE_PENDING_REVIEW', 'COURSE', 12, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    (20, 12, 'Đăng ký khóa học được chấp nhận', 'Đăng ký khóa Ngữ Văn lớp 9 đã được chấp nhận.', 'ENROLLMENT_STATUS', 'COURSE_ENROLLMENT', 12, FALSE, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR));

INSERT IGNORE INTO tutor_certificates (id, tutor_id, title, certificate_type, issuer, issued_date, certificate_image_url, status, reviewed_by, reviewed_at, rejected_reason, created_at, updated_at) VALUES
    (1, 1, 'Bằng cử nhân Sư phạm Toán', 'DEGREE', 'Đại học Sư phạm Hà Nội', '2017-06-30', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (2, 2, 'Chứng chỉ IELTS 8.0', 'LANGUAGE', 'British Council', '2023-08-10', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (3, 3, 'Bằng cử nhân Hóa Học', 'DEGREE', 'Đại học Khoa học Tự nhiên', '2015-06-30', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 4, 'Chứng chỉ IELTS 8.5', 'LANGUAGE', 'IDP', '2024-02-20', NULL, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (5, 5, 'Bảng điểm đại học', 'TRANSCRIPT', 'Trường Đại học Sư phạm', '2024-01-15', NULL, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (6, 6, 'Chứng chỉ không hợp lệ', 'OTHER', 'Không xác định', '2020-01-01', NULL, 'REJECTED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), 'Ảnh chứng chỉ chưa rõ', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (7, 7, 'Chứng chỉ Python cơ bản', 'OTHER', 'Trung tâm Tin học', '2023-05-20', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (8, 8, 'Bằng cử nhân Sinh Học', 'DEGREE', 'Đại học Khoa học Tự nhiên', '2019-06-30', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (9, 9, 'Chứng chỉ nghiệp vụ sư phạm', 'OTHER', 'Trường Đại học Sư phạm TP. Hồ Chí Minh', '2021-09-10', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (10, 10, 'Chứng chỉ TESOL', 'LANGUAGE', 'TESOL International', '2022-11-15', NULL, 'APPROVED', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (11, 4, 'Bảng điểm IELTS gần nhất', 'LANGUAGE', 'IDP', '2025-01-12', NULL, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (12, 3, 'Chứng nhận gia sư Hóa nâng cao', 'OTHER', 'Trung tâm luyện thi', '2024-08-08', NULL, 'PENDING', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

COMMIT;
