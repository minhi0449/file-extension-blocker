package com.file.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "upload_history")
public class UploadHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "filename", nullable = false, length = 255)
    private String fileName;

    @Column(name = "extension", length = 20)
    private String extension;

    @Column(name = "allowed", nullable = false)
    private boolean allowed;

    @Column(name = "upload_time", nullable = false)
    private LocalDateTime uploadTime;

    // 업로드 시도 기록용 편의 생성자
    public UploadHistory(String filename, String extension, boolean allowed) {
        this.fileName = filename;
        this.extension = extension;
        this.allowed = allowed;
        this.uploadTime = LocalDateTime.now();
    }
}
