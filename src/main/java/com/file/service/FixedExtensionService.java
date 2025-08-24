package com.file.service;

import com.file.repository.CustomExtensionRepository;
import com.file.repository.FixedExtensionRepository;
import com.file.repository.UploadHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
/*
    날짜 : 2025.08.24 (일)
    이름 : 김민희
    내용 : 파일 확장자 관리 서비스
 */
@Service
@Transactional
@RequiredArgsConstructor
@Log4j2
public class FileService {

    private final FixedExtensionRepository fixedExtensionRepository;
    private final CustomExtensionRepository customExtensionRepository;
    private final UploadHistoryRepository uploadHistoryRepository;





}
