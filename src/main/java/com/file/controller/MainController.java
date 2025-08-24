package com.file.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    @GetMapping({"/", "index"})
    public String index() {
        return "index"; // templates/index.html
    }

    // 파일 확장자 차단 화면
    @GetMapping("/block")
    public String fileBlockPage() {
        return "file-ext-blocker"; // templates/file-ext-blocker.html
    }

    // 업로드 테스트 화면
    @GetMapping("/upload-test")
    public String uploadTestPage() {
        return "upload-test"; // templates/upload-test.html
    }

}
