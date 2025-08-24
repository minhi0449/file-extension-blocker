package com.file.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T>{
    private boolean success; // 성공 여부
    private String message;  // 사용자 메시지
    private T data;          // 데이터 (목록/상세/카운트)
}
