package com.file.service;

import com.file.config.ExtensionPolicyConfig;
import com.file.repository.FixedExtensionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.file.entity.FixedExtension;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// 파일 확장자 관리 서비스
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class FixedExtensionService {

    private final FixedExtensionRepository fixedExtensionRepository;
    private ExtensionPolicyConfig policyConfig;

    /**
     * 애플리케이션 시작 시 고정 확장자 초기화
     *
     * @PostConstruct 어노테이션을 사용해서 Spring이 이 서비스를
     * 완전히 초기화한 후에 자동으로 이 메서드를 호출하도록 합니다.
     *
     * 이 메서드는 다음과 같은 작업을 수행합니다:
     * 1. 설정 파일에서 정의된 고정 확장자 목록 확인
     * 2. 데이터베이스에 없는 확장자들을 기본값(허용)으로 생성
     * 3. 더 이상 사용하지 않는 구형 확장자들 정리 (선택적)
     *
     * 이런 자동 초기화는 새로운 환경에 시스템을 배포할 때
     * 별도의 수동 작업 없이도 바로 사용할 수 있게 해줍니다.
     */
    @PostConstruct
    public void initializeFixedExtensions() {
        try {
            log.info("고정 확장자 초기화 시작. 설정된 확장자 수: {}", policyConfig.getFixedExtensions().size());

            List<String> configuredExtensions = policyConfig.getFixedExtensions();
            if (configuredExtensions == null || configuredExtensions.isEmpty()) {
                log.warn("설정 파일에 고정 확장자가 정의되지 않았습니다. 기본값을 사용합니다.");
                return;
            }

            // 현재 DB에 있는 고정 확장자들 조회
            Set<String> existingExtensions = fixedExtensionRepository.findAll()
                    .stream()
                    .map(FixedExtension::getExtension)
                    .collect(Collectors.toSet());

            // 설정 파일에는 있지만 DB에 없는 확장자들 생성
            int createdCount = 0;
            for (String configExt : configuredExtensions) {
                String normalizedExt = normalizeExtension(configExt);

                if (!existingExtensions.contains(normalizedExt)) {
                    FixedExtension newExtension = new FixedExtension();
                    newExtension.setExtension(normalizedExt);
                    newExtension.setBlocked(false); // 기본값: 허용 상태
                    newExtension.setCreatedAt(LocalDateTime.now());
                    newExtension.setUpdatedAt(LocalDateTime.now());

                    fixedExtensionRepository.save(newExtension);
                    createdCount++;

                    log.debug("새로운 고정 확장자 생성: {}", normalizedExt);
                }
            }

            log.info("고정 확장자 초기화 완료. 새로 생성된 확장자: {}개", createdCount);

        } catch (Exception e) {
            // 초기화 실패가 애플리케이션 시작을 방해하지 않도록 예외를 로깅만 하고 계속 진행
            log.error("고정 확장자 초기화 중 오류 발생. 수동 확인이 필요합니다.", e);
        }
    }

    /**
     * 모든 고정 확장자 조회 (화면 표시용)
     *
     * 이 메서드는 현재 데이터베이스에 저장된 모든 고정 확장자를 반환합니다.
     * @PostConstruct에서 초기화가 완료되었기 때문에 항상 완전한 목록을 보장할 수 있습니다.
     */
    @Transactional(readOnly = true)
    public List<FixedExtension> getAllFixedExtensions() {
        return fixedExtensionRepository.findAllByOrderByExtensionAsc();
    }

    /**
     * 고정 확장자 차단 상태 변경
     *
     * 사용자가 체크박스를 클릭했을 때 호출되는 메서드입니다.
     * 설정 파일 기반으로 변경되었지만 외부 인터페이스는 동일하게 유지해서
     * 기존 Controller 코드를 수정할 필요가 없습니다.
     */
    public boolean toggleExtensionStatus(String extension, boolean blocked) {
        try {
            String normalizedExt = normalizeExtension(extension);

            // 설정 파일에 정의된 유효한 고정 확장자인지 확인
            List<String> configuredExtensions = policyConfig.getFixedExtensions();
            boolean isValidFixedExtension = configuredExtensions.stream()
                    .anyMatch(configExt -> normalizeExtension(configExt).equals(normalizedExt));

            if (!isValidFixedExtension) {
                log.warn("유효하지 않은 고정 확장자 수정 시도: {}", normalizedExt);
                return false;
            }

            // 기존 설정 조회 또는 새로 생성 (이론적으로는 @PostConstruct에서 모두 생성되어야 함)
            FixedExtension fixedExt = fixedExtensionRepository.findByExtension(normalizedExt)
                    .orElseGet(() -> {
                        log.info("누락된 고정 확장자 발견. 즉시 생성: {}", normalizedExt);
                        FixedExtension newExt = new FixedExtension();
                        newExt.setExtension(normalizedExt);
                        newExt.setCreatedAt(LocalDateTime.now());
                        return newExt;
                    });

            // 상태 업데이트
            fixedExt.setBlocked(blocked);
            fixedExt.setUpdatedAt(LocalDateTime.now());

            fixedExtensionRepository.save(fixedExt);

            log.info("고정 확장자 상태 변경: {} -> {}", normalizedExt, blocked ? "차단" : "허용");
            return true;

        } catch (Exception e) {
            log.error("고정 확장자 상태 변경 실패: " + extension, e);
            return false;
        }
    }

    /**
     * 특정 고정 확장자의 차단 여부 확인
     *
     * 파일 업로드 검증 시 호출되는 메서드입니다.
     * 데이터베이스에서 해당 확장자의 현재 설정을 조회해서 차단 여부를 반환합니다.
     */
    @Transactional(readOnly = true)
    public boolean isFixedExtensionBlocked(String extension) {
        String normalizedExt = normalizeExtension(extension);

        return fixedExtensionRepository.findByExtension(normalizedExt)
                .map(FixedExtension::isBlocked)
                .orElse(false); // 설정이 없으면 기본적으로 허용
    }

    /**
     * 확장자명 정규화 (내부 유틸리티)
     *
     * 사용자 입력이나 설정 파일의 값을 일관된 형태로 변환합니다.
     * 대소문자 통일과 앞쪽 점 제거를 통해 데이터 일관성을 보장합니다.
     */
    private String normalizeExtension(String extension) {
        if (extension == null || extension.trim().isEmpty()) {
            return null;
        }

        String normalized = extension.toLowerCase().trim();

        // 설정 파일에서 .exe 형태로 입력했을 수도 있으므로 앞의 점 제거
        if (normalized.startsWith(".")) {
            normalized = normalized.substring(1);
        }

        return normalized;
    }

    /**
     * 현재 설정된 고정 확장자 목록 조회
     *
     * 다른 서비스에서 고정 확장자와 커스텀 확장자 간의 중복을 체크할 때 사용됩니다.
     * 설정 파일의 원본 데이터를 반환하므로 항상 최신 정보를 보장합니다.
     */
    @Transactional(readOnly = true)
    public List<String> getConfiguredFixedExtensions() {
        return policyConfig.getFixedExtensions().stream()
                .map(this::normalizeExtension)
                .collect(Collectors.toList());
    }


}
