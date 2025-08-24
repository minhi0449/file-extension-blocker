package com.file.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "fixed_extensions")
public class FixedExtension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "extension", unique = true, nullable = false, length = 10)
    private String extension;

    @Column(name = "blocked", nullable = false)
    private boolean blocked = false;


}
