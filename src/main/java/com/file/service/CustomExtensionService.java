package com.file.service;

import com.file.config.ExtensionPolicyConfig;
import com.file.entity.CustomExtension;
import com.file.repository.CustomExtensionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// 커스텀 확장자 관리 서비스
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CustomExtensionService {

    private final CustomExtensionRepository customExtensionRepository;
    private final FixedExtensionService fixedExtensionService;
    private final ExtensionPolicyConfig extensionPolicyConfig;

    // 모든 커스텀 확장자 조회 (최신순)
    @Transactional(readOnly = true)
    public List<CustomExtension> getAllCustomExtensions() {
        return customExtensionRepository.findAllByOrderByCreatedAtDesc();
    }

    // 새로운 커스텀 확장자 추가 (개선된 버전)
    public boolean addCustomExtension(String extension) {
        try {
            String normalized = normalizeExtension(extension);

            // 기본 유효성 검사 (설정 파일의 제한값 사용)
            if (!isValidExtension(normalized)) {
                log.debug("유효하지 않은 확장자 형식: {}", extension);
                return false;
            }

            // 중복 검사 (커스텀 확장자 내)
            if (customExtensionRepository.existsByExtension(normalized)) {
                log.debug("이미 존재하는 커스텀 확장자: {}", normalized);
                return false;
            }

            // 고정 확장자와 중복 검사
            if (isConflictWithFixedExtension(normalized)) {
                log.debug("고정 확장자와 중복: {}", normalized);
                return false;
            }

            // 최대 개수 확인 (설정 파일의 제한값 사용)
            if (customExtensionRepository.count() >= extensionPolicyConfig.getMaxCustomExtensions()) {
                log.debug("커스텀 확장자 최대 개수 초과. 현재: {}, 최대: {}",
                        customExtensionRepository.count(), extensionPolicyConfig.getMaxCustomExtensions());
                return false;
            }

            // 모든 검증 통과 시 추가
            CustomExtension newExt = new CustomExtension();
            newExt.setExtension(normalized);
            newExt.setCreatedAt(LocalDateTime.now());
            newExt.setUpdatedAt(LocalDateTime.now());

            customExtensionRepository.save(newExt);

            log.info("새로운 커스텀 확장자 추가: {}", normalized);
            return true;

        } catch (Exception e) {
            log.error("커스텀 확장자 추가 실패: " + extension, e);
            return false;
        }
    }

    // 커스텀 확장자 삭제
    public boolean removeCustomExtension(String extension) {
        try {
            String normalized = normalizeExtension(extension);

            CustomExtension extensionToDelete = customExtensionRepository.findByExtension(normalized)
                    .orElse(null);

            if (extensionToDelete != null) {
                customExtensionRepository.delete(extensionToDelete);
                log.info("커스텀 확장자 삭제: {}", normalized);
                return true;
            } else {
                log.debug("삭제하려는 커스텀 확장자가 존재하지 않음: {}", normalized);
                return false;
            }

        } catch (Exception e) {
            log.error("커스텀 확장자 삭제 실패: " + extension, e);
            return false;
        }
    }

    // 특정 커스텀 확장자 존재 여부 확인
    @Transactional(readOnly = true)
    public boolean isCustomExtensionExists(String extension) {
        return customExtensionRepository.existsByExtension(normalizeExtension(extension));
    }

    // 현재 커스텀 확장자 개수 조회
    @Transactional(readOnly = true)
    public long getCustomExtensionCount() {
        return customExtensionRepository.count();
    }

    // 최대 허용 가능한 커스텀 확장자 개수 조회
    @Transactional(readOnly = true)
    public int getMaxCustomExtensionCount() {
        return extensionPolicyConfig.getMaxCustomExtensions();
    }

    // === 내부 유틸리티 메서드들 ===
    //
    private String normalizeExtension(String extension) {
        if (extension == null || extension.trim().isEmpty()) {
            return null;
        }

        String normalized = extension.toLowerCase().trim();
        if (normalized.startsWith(".")) {
            normalized = normalized.substring(1);
        }

        return normalized;
    }

    // 확장자 유효성 검사 (설정 파일의 제한값 적용)
    private boolean isValidExtension(String extension) {
        if (extension == null || extension.isEmpty()) {
            return false;
        }

        // 길이 제한 검사 (설정 파일에서 읽어온 값 사용)
        if (extension.length() > extensionPolicyConfig.getMaxExtensionLength()) {
            return false;
        }

        // 형식 검사 (영문, 숫자, 점, 하이픈만 허용)
        return extension.matches("^[a-zA-Z0-9.-]+$");
    }

    // 고정 확장자와의 충돌 검사 (동적으로 확인)
    private boolean isConflictWithFixedExtension(String extension) {
        List<String> configuredFixedExtensions = fixedExtensionService.getConfiguredFixedExtensions();
        return configuredFixedExtensions.contains(extension);
    }

}
