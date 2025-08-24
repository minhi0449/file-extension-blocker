package com.file.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "fixed_extensions")
public class FixedExtension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 최대 20자
    @Column(name = "extension", unique = true, nullable = false, length = 20)
    private String extension;

    @Column(name = "blocked", nullable = false)
    private boolean blocked = false; // 기본값: 허용(체크 안됨)

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 비즈니스 로직: 차단 상태 변경 시 수정 시간 자동 갱신
    public void updateBlockedStatus(boolean blocked) {
        this.blocked = blocked;
        this.updatedAt = LocalDateTime.now();
    }

    // 생성 시 시간 자동 설정을 위한 편의 생성자
    public FixedExtension(String extension, boolean blocked) {
        this.extension = extension;
        this.blocked = blocked;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 서비스에서 시간을 설정하지 않아도 자동 세팅
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null) this.updatedAt = LocalDateTime.now();
    }

    // 업데이트 시각 자동 갱신
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

}
