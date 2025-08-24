package com.file.repository;

import com.file.entity.FixedExtension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FixedExtensionRepository extends JpaRepository<FixedExtension, Long> {
    // 특정 확장자 설정 조회
    Optional<FixedExtension> findByExtension(String extension);

    // 차단 상태 확장자 전부 조회
    List<FixedExtension> findByBlockedTrue();

    // 차단 상태 확장자 수
    long countByBlockedTrue();

    // 모든 확장자 오름차순 조회
    List<FixedExtension> findAllByOrderByExtensionAsc();

    // 해당 확장자 존재 여부 조회
    boolean existsByExtension(String extension);
}
