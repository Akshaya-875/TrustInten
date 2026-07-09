package com.trustintern.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${trustintern.upload.dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file, String subFolder) {
        validateFile(file, subFolder);

        // Create subfolder if it does not exist
        Path targetDir = this.fileStorageLocation.resolve(subFolder);
        try {
            Files.createDirectories(targetDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create target directory: " + subFolder, e);
        }

        // Normalize file name and generate unique file name to avoid collisions
        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        
        String cleanFileName = UUID.randomUUID().toString() + fileExtension;

        try {
            // Check if the filename contains invalid characters
            if (cleanFileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + cleanFileName);
            }

            // Copy file to the target location (Replacing existing file with the same name)
            Path targetLocation = targetDir.resolve(cleanFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return subFolder + "/" + cleanFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + cleanFileName + ". Please try again!", ex);
        }
    }

    private void validateFile(MultipartFile file, String subFolder) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a file to upload.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds 10MB limit.");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new IllegalArgumentException("Uploaded file must have a valid name.");
        }

        String fileExtension = getFileExtension(originalFileName);
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);

        Set<String> allowedExtensions = getAllowedExtensions(subFolder);
        Set<String> allowedContentTypes = getAllowedContentTypes(subFolder);

        if (allowedExtensions != null && !allowedExtensions.contains(fileExtension.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Unsupported file type. Allowed extensions for " + subFolder + " are: " + String.join(", ", allowedExtensions));
        }

        if (allowedContentTypes != null && !contentType.isBlank() && !allowedContentTypes.contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file type. Allowed content types for " + subFolder + " are: " + String.join(", ", allowedContentTypes));
        }
    }

    private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return dotIndex >= 0 ? fileName.substring(dotIndex) : "";
    }

    private Set<String> getAllowedExtensions(String subFolder) {
        return switch (subFolder) {
            case "photos" -> Set.of(".jpg", ".jpeg", ".png");
            case "resumes" -> Set.of(".pdf", ".doc", ".docx");
            case "certificates" -> Set.of(".pdf", ".jpg", ".jpeg", ".png");
            default -> null;
        };
    }

    private Set<String> getAllowedContentTypes(String subFolder) {
        return switch (subFolder) {
            case "photos" -> Set.of("image/jpeg", "image/jpg", "image/png");
            case "resumes" -> Set.of("application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            case "certificates" -> Set.of("application/pdf", "image/jpeg", "image/jpg", "image/png");
            default -> null;
        };
    }

    public String calculateSha256(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
            byte[] hash = digest.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (IOException | NoSuchAlgorithmException ex) {
            throw new RuntimeException("Could not calculate SHA-256 for file", ex);
        }
    }

    public String calculateSha256(Path filePath) {
        try (InputStream is = Files.newInputStream(filePath)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
            byte[] hash = digest.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (IOException | NoSuchAlgorithmException ex) {
            throw new RuntimeException("Could not calculate SHA-256 for file path: " + filePath, ex);
        }
    }

    public Path getFile(String relativePath) {
        return this.fileStorageLocation.resolve(relativePath).normalize();
    }
}
