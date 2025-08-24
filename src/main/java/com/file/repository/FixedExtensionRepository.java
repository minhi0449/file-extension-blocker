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

    List<FixedExtension> findByBlockedTrue();
    long countByBlockedTrue();
    List<FixedExtension> findAllByOrderByExtensionAsc();

}
