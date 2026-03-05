-- ============================================================
-- MySQL CSV Import (1조 샘플 데이터)
-- 실행 전: 1) 테이블 생성(1조 DB 테이블 정보.sql)
--         2) main_code, sub_code 입력(1조 메인코드 및 서브코드 더미 데이터.sql)
-- 아래 경로를 실제 csv 폴더 경로로 수정한 뒤 실행하세요.
-- Windows: 'C:/path/to/midproject/backend/database/dummy_data/csv/organ.csv'
-- ============================================================

-- 경로 변수 (MySQL에서 경로 지정 시 사용)
-- 예: SET @csv_path = 'C:/midproject/backend/database/dummy_data/csv/';

-- FK 순서대로 import (organ -> member -> survey -> ...)

LOAD DATA LOCAL INFILE 'organ.csv'
INTO TABLE organ
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(organ_no, organ_name, organ_address, organ_mail, organ_tel, start_time, @end_time, org_status)
SET end_time = NULLIF(@end_time, '\\N');

LOAD DATA LOCAL INFILE 'member.csv'
INTO TABLE member
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(m_no, m_id, m_pw, m_nm, m_email, m_tel, m_bd, m_add, m_auth, @m_org)
SET m_org = NULLIF(@m_org, '\\N');

LOAD DATA LOCAL INFILE 'survey.csv'
INTO TABLE survey
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'major_category.csv'
INTO TABLE major_category
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'sub_category.csv'
INTO TABLE sub_category
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'survey_q.csv'
INTO TABLE survey_q
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'dsbl_prs.csv'
INTO TABLE dsbl_prs
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'support.csv'
INTO TABLE support
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(sup_code, mem_no, mc_pn, sup_day, @mgr_no, req_yn, @res_time, @supt_rej_cmt, @rank_res)
SET mgr_no = NULLIF(@mgr_no, '\\N'),
    res_time = NULLIF(@res_time, '\\N'),
    supt_rej_cmt = NULLIF(@supt_rej_cmt, '\\N'),
    rank_res = NULLIF(@rank_res, '\\N');

LOAD DATA LOCAL INFILE 'survey_a.csv'
INTO TABLE survey_a
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'counsel.csv'
INTO TABLE counsel
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

LOAD DATA LOCAL INFILE 'support_plan.csv'
INTO TABLE support_plan
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(plan_code, @prev_plan_code, sup_code, dsbl_no, plan_goal, start_time, @end_time, plan_content, plan_date, plan_tf, @plan_rej_cmt)
SET prev_plan_code = NULLIF(@prev_plan_code, '\\N'),
    end_time = NULLIF(@end_time, '\\N'),
    plan_rej_cmt = NULLIF(@plan_rej_cmt, '\\N');

LOAD DATA LOCAL INFILE 'support_result.csv'
INTO TABLE support_result
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(result_code, @prev_result_code, plan_code, result_title, result_content, result_date, result_tf, @result_rej_cmt)
SET prev_result_code = NULLIF(@prev_result_code, '\\N'),
    result_rej_cmt = NULLIF(@result_rej_cmt, '\\N');

LOAD DATA LOCAL INFILE 'rank.csv'
INTO TABLE `rank`
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(req_code, @prev_req_code, sup_code, s_rank_code, mgr_no, apply_for, adm_no, @s_rank_res, @rank_rej_cmt)
SET prev_req_code = NULLIF(@prev_req_code, '\\N'),
    s_rank_res = NULLIF(@s_rank_res, '\\N'),
    rank_rej_cmt = NULLIF(@rank_rej_cmt, '\\N');
