package com.file.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FixedToggleRequest {
    private String extension; // "exe", "bat"
    private boolean blocked;  // true = 차단, false = 허용
}
