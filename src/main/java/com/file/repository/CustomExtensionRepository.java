package com.file.repository;

import com.file.entity.CustomExtension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface CustomExtensionRepository extends JpaRepository<CustomExtension, Long> {
    // 특정 확장자의 커스텀 설정 조회
    Optional<CustomExtension> findByExtension(String extension);

    // 모든 커스텀 확장자를 최신 순으로 조회
    List<CustomExtension> findAllByOrderByCreatedAtDesc();

    // 확장자 존재 여부 간단 체크
    boolean existsByExtension(String extension);

    // 현재 저장된 커스텀 확장자 총 개수
    @Query("SELECT COUNT(c) FROM CustomExtension c")
    long countCustomExtensions();
}
