package com.file.repository;

import com.file.entity.UploadHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

@Repository
public interface UploadHistoryRepository extends JpaRepository<UploadHistory, Long> {
    // 최근 업로드 시도 기록 조회 (최대 10개)
    List<UploadHistory> findTop10ByOrderByUploadTimeDesc();

    // 특정 확장자의 업로드 시도 이력 조회
    List<UploadHistory> findByExtensionOrderByUploadTimeDesc(String extension);

    // 차단된 업로드 시도만 조회
    List<UploadHistory> findByAllowedFalseOrderByUploadTimeDesc();

    // 특정 기간 내 업로드 시도 통계
    @Query("SELECT COUNT(u) FROM UploadHistory u WHERE u.uploadTime BETWEEN :startTime AND :endTime")
    long countUploadsBetween(LocalDateTime startTime, LocalDateTime endTime);

    // 특정 기간 내 차단된 업로드 시도 개수
    @Query("SELECT COUNT(u) FROM UploadHistory u WHERE u.uploadTime BETWEEN :startTime AND :endTime AND u.allowed = false")
    long countBlockedUploadsBetween(LocalDateTime startTime, LocalDateTime endTime);
}
