package com.file.dto;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadHistoryResponse {
    private String fileName;
    private String extension;
    private boolean allowed;
    private LocalDateTime uploadTime;
}
