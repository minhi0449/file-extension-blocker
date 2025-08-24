# 파일 확장자 차단 (File Extension Blocker)
> **개발 날짜 : 2025. 08. 24** </br>
> url : http://13.209.67.184:8080/block **</br>**
보안 위험이 높은 실행형 파일(exe, sh 등)의 업로드를 방지하기 위한 Spring Boot 3 + JPA 기반 정책 관리/검증 서비스입니다. 
관리 화면에서 고정 확장자(체크박스)와 커스텀 확장자(칩 UI)를 관리하며, 업로드 시 서버 단 최종 검증으로 차단합니다.

## 사용 기술 (Tech Stack)
| 분야 | 스택 |
|----|------|
| **Backend** | ![Java 17](https://img.shields.io/badge/Java%2017-007396?style=flat&logo=java&logoColor=white) ![Spring Boot 3](https://img.shields.io/badge/Spring%20Boot%203-6DB33F?style=flat&logo=spring-boot&logoColor=white) ![Spring Data JPA](https://img.shields.io/badge/Spring%20Data%20JPA-59666C?style=flat) |
| **Frontend** | ![Thymeleaf](https://img.shields.io/badge/Thymeleaf-005F0F?style=flat&logo=thymeleaf&logoColor=white) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) ![JavaScript ES6](https://img.shields.io/badge/JavaScript%20ES6-F7DF1E?style=flat&logo=javascript&logoColor=black) |
| **Database** | ![MySQL 8](https://img.shields.io/badge/MySQL%208-4479A1?style=flat&logo=mysql&logoColor=white) |
| **DevOps** | ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat&logo=github-actions&logoColor=white) ![AWS EC2 \| RDS \| S3](https://img.shields.io/badge/AWS%20(EC2%20%7C%20RDS%20%7C%20S3)-F7931E?style=flat&logo=amazon-aws&logoColor=white) |

## 프로젝트 하이라이트
| 구분 | 요약 |
|---|---|
| **핵심 기능** | 고정 확장자 차단 토글, 커스텀 확장자 추가/삭제, 업로드 시 차단 여부 판정 및 이력 저장 |
| **아키텍처** | Controller – Service – Repository – Entity 4계층 구조, 설정값 바인딩(ConfigurationProperties) |
| **검증 전략** | 프론트 1차 필터링 + **서버 최종 검증(권한자)** 로 보안 우회 방지 |
| **사용성** | 칩 UI로 추가/삭제 직관적 관리, 새로고침 시 상태 유지(DB 반영) |
| **관측성** | 업로드 이력 저장(허용/차단, 시간), Hibernate SQL 로그 트레이싱 |

---

## 요구사항
- **1-1. 고정 확장자**: 자주 차단하는 확장자 리스트. 기본 **unchecked**.  
- **1-2. 고정 확장자 토글**: 체크/해제 시 **DB 저장**되며, 새로고침 후에도 유지.  
  *(커스텀 영역에는 표시되지 않음)*  
- **2-1. 커스텀 확장자 입력 길이**: **최대 20자**  
- **2-2. 추가 버튼 클릭 시**: **DB 저장** 후 화면 아래 칩 영역에 렌더  
- **3-1. 커스텀 확장자 최대 개수**: **최대 200개**  
- **3-2. 칩의 X 클릭 시**: **DB에서 삭제** 및 화면 제거

## 추가로 고려한 점
- **커스텀 확장자 중복 체크**  
  이미 존재하는 값은 DB/화면에 중복 저장되지 않도록 차단.
- **서버단 최종 검증**  
  프론트에서 먼저 막더라도 업로드 시 **서버(`FileUploadService.isFileUploadAllowed`)**가  
  고정/커스텀 정책을 재확인하여 **최종 차단 여부** 결정.
- **정규화(Normalization)**  
  비교 전 소문자 처리 + 선행 `.` 제거로 `.EXE`, `Exe`, `.exe` 등 모두 동일하게 취급.
- **고정 확장자 중복 금지**  
  커스텀 추가 시 고정 확장자 목록과 **중복 불가**.
- **업로드 이력(Audit Trail)**  
  `upload_history` 테이블에 파일명/확장자/허용여부/시간 저장 → 사후 추적·통계 가능.
- **화이트리스트 전환 고려**  
  현재는 블랙리스트(차단 리스트) 방식이지만, 서비스 레이어 분리로 화이트리스트 전환 용이.


<img width="1066" height="611" alt="파일 확장자 차단" src="https://github.com/user-attachments/assets/53e9684d-fb03-490c-a6f3-74cf9befc252" />
