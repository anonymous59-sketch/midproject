■ 1조 샘플 데이터 CSV → MySQL Import

[1] 준비
  - 테이블 생성: 1조 DB 테이블 정보.sql 실행
  - 코드 데이터: 1조 메인코드 및 서브코드 더미 데이터.sql 실행

[2] 방법 A - MySQL 명령줄 (같은 폴더에서)
  cd backend/database/dummy_data/csv
  mysql -u 사용자 -p --local-infile=1 DB이름
  mysql> USE DB이름;
  mysql> SOURCE C:/절대경로/midproject/backend/database/dummy_data/csv/LOAD_DATA_IMPORT.sql;
  (또는 csv 폴더를 현재 디렉터리로 두고)
  mysql> SOURCE ./LOAD_DATA_IMPORT.sql;

  ※ LOAD DATA LOCAL INFILE 은 파일 경로가 클라이언트 기준이므로,
    SOURCE 로 실행할 때는 각 INFILE 경로를 실제 절대 경로로 수정하거나,
    mysql 실행 시 작업 디렉터리를 csv 폴더로 두고 파일명만 사용.

[2] 방법 B - 수동 Import (MySQL Workbench / HeidiSQL 등)
  - 테이블 순서: organ → member → survey → major_category → sub_category → survey_q
    → dsbl_prs → support → survey_a → counsel → support_plan → support_result → rank
  - 각 테이블에서 [테이블 데이터 가져오기]로 해당 CSV 선택
  - 구분자: 쉼표(,), 첫 번째 행은 헤더로 제거(헤더 1줄 무시)
  - NULL: 빈 칸 또는 \N

[3] CSV 규칙
  - NULL 값: \N (백슬래시+N)
  - 날짜: YYYY-MM-DD, 날짜시간: YYYY-MM-DD HH:MI:SS
  - UTF-8 인코딩
