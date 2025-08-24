package com.file.service;

import com.file.entity.UploadHistory;
import com.file.repository.UploadHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// 파일 업로드 검증 및 이력 관리 서비스
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FileUploadService {

    private final FixedExtensionService fixedExtensionService;
    private final CustomExtensionService customExtensionService;
    private final UploadHistoryRepository uploadHistoryRepository;

    /**
     * 파일 업로드 허용 여부 종합 판단
     *
     * 이 메서드는 설정 파일 기반으로 개선된 다른 서비스들을 활용해서
     * 더 정확하고 유연한 판단을 수행합니다. 로깅을 추가해서
     * 운영 중에 어떤 파일들이 어떤 이유로 차단되는지 추적할 수 있습니다.
     */
    @Transactional(readOnly = true)
    public boolean isFileUploadAllowed(String filename) {
        String extension = extractFileExtension(filename);

        // 확장자가 없는 파일은 허용
        if (extension == null) {
            log.debug("확장자 없는 파일 허용: {}", filename);
            return true;
        }

        // 고정 확장자 차단 여부 확인
        if (fixedExtensionService.isFixedExtensionBlocked(extension)) {
            log.info("고정 확장자 정책에 의해 차단: {} (확장자: {})", filename, extension);
            return false;
        }

        // 커스텀 확장자 차단 여부 확인
        if (customExtensionService.isCustomExtensionExists(extension)) {
            log.info("커스텀 확장자 정책에 의해 차단: {} (확장자: {})", filename, extension);
            return false;
        }

        log.debug("파일 업로드 허용: {} (확장자: {})", filename, extension);
        return true;
    }

    /**
     * 업로드 시도 이력 기록
     */
    public void recordUploadAttempt(String filename, boolean allowed) {
        try {
            String extension = extractFileExtension(filename);

            UploadHistory history = new UploadHistory();
            history.setFileName(filename);
            history.setExtension(extension);
            history.setAllowed(allowed);
            history.setUploadTime(LocalDateTime.now());

            uploadHistoryRepository.save(history);

            log.debug("업로드 시도 이력 기록: {} - {}", filename, allowed ? "허용" : "차단");

        } catch (Exception e) {
            log.error("업로드 이력 기록 실패: " + filename, e);
            // 이력 기록 실패가 핵심 기능을 방해하지 않도록 예외를 흡수
        }
    }

    /**
     * 최근 업로드 이력 조회
     */
    @Transactional(readOnly = true)
    public List<UploadHistory> getRecentUploadHistory() {
        return uploadHistoryRepository.findTop10ByOrderByUploadTimeDesc();
    }

    /**
     * 파일명에서 확장자 추출 (내부 유틸리티)
     */
    private String extractFileExtension(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return null;
        }

        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return null;
        }

        return filename.substring(lastDotIndex + 1).toLowerCase();
    }

}
