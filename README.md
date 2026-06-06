# Kết Nối Gia Sư

Dự án Spring Boot + static frontend cho hệ thống kết nối gia sư, học viên và quản trị viên.

## Yêu Cầu

- Java 21
- MySQL 8+
- Maven Wrapper đã có sẵn trong repo: `mvnw`, `mvnw.cmd`

## Cấu Hình Local

1. Tạo database MySQL:

```sql
CREATE DATABASE kngs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Copy file cấu hình bí mật:

```powershell
Copy-Item secrets-local.example.properties secrets-local.properties
```

3. Điền các giá trị trong `secrets-local.properties`:

- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `APP_LIMITS_LEARNER_POSTS_PER_DAY`
- `APP_LIMITS_TUTOR_COURSES_PER_DAY`

`application.properties` đang cấu hình `spring.jpa.hibernate.ddl-auto=update`, nên Hibernate có thể tự cập nhật bảng khi chạy local. File SQL tham khảo nằm ở `src/main/resources/sql/ket_noi_gia_su.sql`.

## Chạy Dự Án

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Linux/macOS:

```bash
./mvnw spring-boot:run
```

Mặc định server chạy tại:

```text
http://localhost:8088
```

## Chạy Test

Windows:

```powershell
.\mvnw.cmd test
```

Linux/macOS:

```bash
./mvnw test
```

## Tài Khoản Mẫu

Tất cả tài khoản mẫu dùng mật khẩu `12345678`.

- Admin: `admin1@gmail.com`
- Học viên: `hocvien1@gmail.com`
- Gia sư đã duyệt: `giasu1@gmail.com`
- Gia sư chờ duyệt: `giasu5@gmail.com`
- Gia sư bị khóa: `giasu6@gmail.com`

## Ghi Chú Bảo Mật

- Không commit `secrets-local.properties`.
- Không dùng `JWT_SECRET` mặc định khi deploy.
- Tài khoản admin seed chỉ nên bật khi đã đặt password an toàn.
