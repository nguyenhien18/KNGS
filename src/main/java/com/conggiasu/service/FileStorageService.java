package com.conggiasu.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.conggiasu.exception.AppException;
import java.io.IOException;
import java.net.URI;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@Slf4j
public class FileStorageService {
    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final String ROOT_FOLDER = "ket-noi-gia-su";
    private final Cloudinary cloudinary;

    public FileStorageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String storeAvatar(MultipartFile file, String currentAvatarUrl) {
        validateImage(file);
        try {
            String url = storeImage(file, "avatars");
            deleteOldAvatarIfManaged(currentAvatarUrl);
            return url;
        } catch (Exception e) {
            throw mapUploadException(e);
        }
    }

    public String storeIdentityImage(MultipartFile file) {
        validateImage(file);
        try {
            return storeImage(file, "identity");
        } catch (Exception e) {
            throw mapUploadException(e);
        }
    }

    public String storeCertificateImage(MultipartFile file) {
        validateImage(file);
        try {
            return storeImage(file, "certificates");
        } catch (Exception e) {
            throw mapUploadException(e);
        }
    }

    private String storeImage(MultipartFile file, String subDir) throws IOException {
        String extension = extractExtension(file.getOriginalFilename());
        String publicId = ROOT_FOLDER + "/" + subDir + "/" + UUID.randomUUID();
        var result = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "public_id", publicId,
                "resource_type", "image",
                "format", extension,
                "overwrite", true
            )
        );

        Object secureUrl = result.get("secure_url");
        if (secureUrl == null) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong nhan duoc URL anh");
        }
        return String.valueOf(secureUrl);
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Vui long chon anh de tai len");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Anh qua lon. Toi da 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chi chap nhan tep anh");
        }
        String extension = extractExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Dinh dang anh khong ho tro");
        }
    }

    private String extractExtension(String filename) {
        String original = filename == null ? "" : filename.trim();
        int dot = original.lastIndexOf('.');
        if (dot < 0 || dot == original.length() - 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Tep anh khong hop le");
        }
        return original.substring(dot + 1).toLowerCase();
    }

    private void deleteOldAvatarIfManaged(String currentAvatarUrl) {
        if (currentAvatarUrl == null || currentAvatarUrl.isBlank()) {
            return;
        }
        try {
            String publicId = extractPublicId(currentAvatarUrl);
            if (publicId == null || !publicId.startsWith(ROOT_FOLDER + "/avatars/")) {
                return;
            }
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception ignored) {
        }
    }

    private String extractPublicId(String url) {
        try {
            URI uri = new URI(url.trim());
            String path = uri.getPath();
            int idx = path.indexOf("/upload/");
            if (idx < 0) return null;
            String afterUpload = path.substring(idx + "/upload/".length());
            String[] segments = afterUpload.split("/");
            int start = 0;
            if (segments.length > 0 && segments[0].matches("v\\d+")) {
                start = 1;
            }
            if (segments.length <= start) return null;
            String joined = String.join("/", java.util.Arrays.copyOfRange(segments, start, segments.length));
            int dot = joined.lastIndexOf('.');
            if (dot > 0) {
                return joined.substring(0, dot);
            }
            return joined;
        } catch (Exception ex) {
            return null;
        }
    }

    private AppException mapUploadException(Exception ex) {
        String message = ex.getMessage();
        if (message != null && message.toLowerCase(Locale.ROOT).contains("invalid signature")) {
            log.error("Cloudinary signature error while uploading image", ex);
            return new AppException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Cau hinh Cloudinary khong hop le. Kiem tra CLOUDINARY_API_KEY va CLOUDINARY_API_SECRET"
            );
        }
        if (ex instanceof IOException) {
            return new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong the luu tep anh");
        }
        log.error("Unexpected cloud upload error", ex);
        return new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong the luu tep anh");
    }
}

