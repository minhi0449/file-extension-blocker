package com.file.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 업로드 테스트 응답
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UploadTestResponse {
    private String fileName;
    private String extension; // null 기능 (확장자 없을 떄)
    private boolean allowed;  // true = 허용, false = 차단

}
