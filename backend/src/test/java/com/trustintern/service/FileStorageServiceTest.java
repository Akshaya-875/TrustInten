package com.trustintern.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void storeFile_rejectsUnsupportedFileTypeForCertificates() {
        FileStorageService service = new FileStorageService(tempDir.toString());
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "fake.txt",
                "text/plain",
                "not a certificate".getBytes(StandardCharsets.UTF_8)
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.storeFile(file, "certificates"));

        assertTrue(ex.getMessage().contains("Unsupported file type"));
    }
}
