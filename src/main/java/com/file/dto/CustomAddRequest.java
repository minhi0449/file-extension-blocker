package com.file.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 커스텀 확장자 추가 요청
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomAddRequest {
    private String extension; // 예 : "php"
}
