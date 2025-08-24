package com.file.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/*
    파일 확장자 설정 클래스
 */
@Data
@Component
@ConfigurationProperties(prefix = "file.extension.policy")
public class ExtensionPolicyConfig {

    // 시스템에서 관리하는 기본 위험 확장자 목록
    private List<String> fixedExtensions;

    // 커스텀 확장자 최대 개수 (200개)
    private int maxCustomExtensions = 200;

    // 확장자명 최대 길이
    private int maxExtensionLength = 20;
}
