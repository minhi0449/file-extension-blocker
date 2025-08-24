package com.file.controller;
import com.file.dto.*;
import com.file.entity.CustomExtension;
import com.file.entity.FixedExtension;
import com.file.entity.UploadHistory;
import com.file.service.CustomExtensionService;
import com.file.service.FileUploadService;
import com.file.service.FixedExtensionService;
import com.file.config.ExtensionPolicyConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api") // 모든 API는 /api 하위로
public class FileController {

    private final FixedExtensionService fixedExtensionService;
    private final CustomExtensionService customExtensionService;
    private final FileUploadService uploadService;
    private final ExtensionPolicyConfig extensionPolicyConfig;


// =============================
    // 고정 확장자
    // =============================

    // 고정 확장자 전체 조회 (화면 상단 체크박스 렌더용)
    @GetMapping("/fixed")
    public ResponseEntity<ApiResponse<List<FixedExtension>>> getFixedAll() {
        List<FixedExtension> list = fixedExtensionService.getAllFixedExtensions();
        return ResponseEntity.ok(new ApiResponse<>(true, "고정 확장자 조회", list));
    }

    // 고정 확장자 토글 (체크/해제)
    @PatchMapping("/fixed/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleFixed(@RequestBody FixedToggleRequest req) {
        boolean result = fixedExtensionService.toggleExtensionStatus(req.getExtension(), req.isBlocked());
        if (result) {
            return ResponseEntity.ok(new ApiResponse<>(true, "상태 변경 완료", null));
        }
        return ResponseEntity.badRequest().body(new ApiResponse<>(false, "유효하지 않은 확장자거나 저장 실패", null));
    }

    // =============================
    // 커스텀 확장자
    // =============================

    // 커스텀 확장자 전체 조회 (화면 하단 태그 렌더용)
    @GetMapping("/custom")
    public ResponseEntity<ApiResponse<List<CustomExtension>>> getCustomAll() {
        List<CustomExtension> list = customExtensionService.getAllCustomExtensions();
        return ResponseEntity.ok(new ApiResponse<>(true, "커스텀 확장자 조회", list));
    }

    // 커스텀 확장자 추가
    @PostMapping("/custom")
    public ResponseEntity<ApiResponse<Void>> addCustom(@RequestBody CustomAddRequest req) {
        boolean ok = customExtensionService.addCustomExtension(req.getExtension());
        if (ok) {
            return ResponseEntity.ok(new ApiResponse<>(true, "추가 완료", null));
        }
        return ResponseEntity.badRequest().body(new ApiResponse<>(false, "형식/중복/최대개수 제한 확인", null));
    }

    // 커스텀 확장자 삭제 (확장자를 path로)
    @DeleteMapping("/custom/{extension}")
    public ResponseEntity<ApiResponse<Void>> deleteCustom(@PathVariable String extension) {
        boolean ok = customExtensionService.removeCustomExtension(extension);
        if (ok) {
            return ResponseEntity.ok(new ApiResponse<>(true, "삭제 완료", null));
        }
        return ResponseEntity.badRequest().body(new ApiResponse<>(false, "존재하지 않는 확장자", null));
    }

    // =============================
    // 정책값 (최대 길이/최대 개수)
    // =============================
    @GetMapping("/policy")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPolicy() {
        Map<String, Object> map = new HashMap<>();
        map.put("maxExtensionLength", extensionPolicyConfig.getMaxExtensionLength());
        map.put("maxCustomExtensions", extensionPolicyConfig.getMaxCustomExtensions());
        map.put("fixedConfigured", fixedExtensionService.getConfiguredFixedExtensions());
        return ResponseEntity.ok(new ApiResponse<>(true, "정책 조회", map));
    }

    // =============================
    // 업로드 테스트 (멀티파트)
    // =============================
    @PostMapping(path = "/upload-test", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UploadTestResponse>> uploadTest(
            @RequestParam("title") String title,
            @RequestParam("file") MultipartFile file
    ) {
        String originalName = file.getOriginalFilename();
        boolean allowed = uploadService.isFileUploadAllowed(originalName);
        // 이력 기록
        uploadService.recordUploadAttempt(originalName, allowed);

        String ext = null;
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
        }
        UploadTestResponse body = new UploadTestResponse(originalName, ext, allowed);
        String msg = allowed ? "허용" : "차단";

        return ResponseEntity.ok(new ApiResponse<>(true, "업로드 테스트: " + msg, body));
    }

    // 최근 업로드 이력 조회 (최대 10개)
    @GetMapping("/upload-history")
    public ResponseEntity<ApiResponse<List<UploadHistoryResponse>>> getRecentUploads() {
        var list = uploadService.getRecentUploadHistory();
        var body = list.stream()
                .map(u -> new UploadHistoryResponse(
                        u.getFileName(),
                        u.getExtension(),
                        u.isAllowed(),
                        u.getUploadTime()
                ))
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(true, "최근 업로드", body));
    }

}
