# KET_NOI_GIA_SU

Project Spring Boot + Frontend tich hop cung cau truc nhu `QLPT`.

## 1) Chay nhanh

1. Tao DB MySQL:
   - Chay file: `src/main/resources/sql/02_full_schema_v1.sql`
2. Cau hinh `src/main/resources/application.properties` neu can:
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
3. Chay backend:
   - `mvn spring-boot:run`
4. Mo frontend:
   - `http://localhost:8087/index.html`

## 2) Module da lam truoc: Gia su

### Bang du lieu da map
- `users`
- `tutors`
- `subjects`
- `grades`
- `tutor_teachings`
- `posts`
- `applications`
- `matched_classes`
- `tutor_courses`
- `course_enrollments`
- `reviews`
- `notifications`
- `identity_verifications`
- `tutor_certificates`

### API da co
- `GET /api/tutors`
- `GET /api/tutors/{id}`
- `POST /api/tutors`
- `PUT /api/tutors/{id}`
- `PATCH /api/tutors/{id}/status`
- `GET /api/lookups/subjects`
- `GET /api/lookups/grades`
- `POST /api/auth/register-tutor`
- `POST /api/auth/register-learner`
- `POST /api/auth/login`
- `GET /api/tutor/posts/available`
- `POST /api/tutor/posts/{postId}/apply`
- `PATCH /api/tutor/applications/{applicationId}/cancel`
- `GET /api/tutor/applications?status=...`
- `POST /api/tutor/courses`
- `PUT /api/tutor/courses/{courseId}`
- `GET /api/tutor/courses?status=...`
- `GET /api/tutor/courses/{courseId}/enrollments`
- `PATCH /api/tutor/enrollments/{enrollmentId}/status`
- `POST /api/learner/posts`
- `PUT /api/learner/posts/{postId}`
- `PATCH /api/learner/posts/{postId}/cancel`
- `GET /api/learner/posts`
- `GET /api/learner/posts/{postId}/applications`
- `PATCH /api/learner/applications/{applicationId}/decision`
- `GET /api/learner/classes`
- `PATCH /api/learner/classes/{classId}/status`
- `GET /api/learner/courses/available`
- `POST /api/learner/courses/{courseId}/enroll`
- `PATCH /api/learner/enrollments/{enrollmentId}/cancel`
- `GET /api/learner/enrollments`
- `POST /api/learner/reviews`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{userId}/status`
- `GET /api/admin/tutors/pending`
- `PATCH /api/admin/tutors/{tutorId}/review`
- `GET /api/admin/posts/pending`
- `PATCH /api/admin/posts/{postId}/review`
- `GET /api/admin/courses/pending`
- `PATCH /api/admin/courses/{courseId}/review`
- `GET /api/admin/stats`
- `GET /api/account/me`
- `PATCH /api/account/me`
- `POST /api/account/change-password`
- `GET /api/notifications`
- `PATCH /api/notifications/{id}/read`
- `PATCH /api/notifications/read-all`

## 5) Tai khoan seed de test

- Admin: `admin@conggiasu.vn` / `123456`
- Learner: `learner@conggiasu.vn` / `123456`

## 6) JWT + Phan quyen

- Dang nhap: `POST /api/auth/login` -> nhan `accessToken`
- Goi API bao mat: them header  
  `Authorization: Bearer <accessToken>`
- Sau khi bat JWT, cac endpoint theo role khong can truyen `adminUserId/learnerUserId/tutorId` nua (lay tu token).
- Quyen:
  - `/api/admin/**` -> `ADMIN`
  - `/api/learner/**` -> `LEARNER`
  - `/api/tutor/**`, `/api/tutors/me` -> `TUTOR`

## 3) Loc gia su

`GET /api/tutors?keyword=&subjectId=&gradeId=&province=&district=&teachingMode=&profileStatus=&page=0&size=10`

## 4) Ghi chu

- Frontend da duoc copy vao `src/main/resources/static`.
- Da chuan hoa static asset theo huong uu tien dung `assets/css` va `assets/js`.
- Security/JWT dang duoc bat.
