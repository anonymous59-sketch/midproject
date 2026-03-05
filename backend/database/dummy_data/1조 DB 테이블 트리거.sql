-- CREATE TRIGGER tg_member_no_init => 트리거 생성
-- BEFORE INSERT ON `member` => member 테이블에 데이터가 들어가기 직전에 실행
-- FOR EACH ROW
-- BEGIN
--     DECLARE today_str VARCHAR(8);
--     DECLARE last_seq INT;

--     1. 날짜 구하기
--     SET today_str = DATE_FORMAT(NOW(), '%Y%m%d'); => 현재 일시를 YYYYMMDD로 포맷하여 today_str에 할당

--     2. 금일로 시작하는 m_no 중 가장 큰 숫자 찾기.
--     SELECT IFNULL(MAX(CAST(SUBSTRING(m_no, 12) AS UNSIGNED)), 0) INTO last_seq
--     FROM `member` WHERE m_no LIKE CONCAT('MEM', today_str, '%'); => 가장 큰 숫자를 찾아서 last_seq에 담기.

--     3. 새로운 PK를 생성.
--     SET NEW.m_no = CONCAT('MEM', today_str, LPAD(last_seq + 1, 4, '0')); => LPAD를 써서 4자릿수 문자열을 생성 및 PK양식에 맞춰서 작성.
-- END$$


DELIMITER $$

-- 1. member (MEM + yyyymmdd + 0001)
CREATE TRIGGER tg_member_no_init
BEFORE INSERT ON `member`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(m_no, 12) AS UNSIGNED)), 0) INTO last_seq 
    FROM `member` WHERE m_no LIKE CONCAT('MEM', today_str, '%');
    SET NEW.m_no = CONCAT('MEM', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

-- 2. support (SUPT + yyyymmdd + 0001)
CREATE TRIGGER tg_support_code_init
BEFORE INSERT ON `support`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(sup_code, 13) AS UNSIGNED)), 0) INTO last_seq 
    FROM `support` WHERE sup_code LIKE CONCAT('SUPT', today_str, '%');
    SET NEW.sup_code = CONCAT('SUPT', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

-- 3. rank (RANK + yyyymmdd + 0001)
CREATE TRIGGER tg_rank_code_init
BEFORE INSERT ON `rank`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(req_code, 13) AS UNSIGNED)), 0) INTO last_seq 
    FROM `rank` WHERE req_code LIKE CONCAT('RANK', today_str, '%');
    SET NEW.req_code = CONCAT('RANK', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

-- 4. support_plan (PLAN + yyyymmdd + 0001)
CREATE TRIGGER tg_plan_code_init
BEFORE INSERT ON `support_plan`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(plan_code, 13) AS UNSIGNED)), 0) INTO last_seq 
    FROM `support_plan` WHERE plan_code LIKE CONCAT('PLAN', today_str, '%');
    SET NEW.plan_code = CONCAT('PLAN', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

-- 5. counsel (CNSL + yyyymmdd + 0001)
CREATE TRIGGER tg_csl_code_init
BEFORE INSERT ON `counsel`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(csl_code, 13) AS UNSIGNED)), 0) INTO last_seq 
    FROM `counsel` WHERE csl_code LIKE CONCAT('CNSL', today_str, '%');
    SET NEW.csl_code = CONCAT('CNSL', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

-- 6. verification (AUTH + yyyymmdd + 0001)
CREATE TRIGGER tg_verifi_no_init
BEFORE INSERT ON `verification`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(verifi_no, 13) AS UNSIGNED)), 0) INTO last_seq 
    FROM `verification` WHERE verifi_no LIKE CONCAT('AUTH', today_str, '%');
    SET NEW.verifi_no = CONCAT('AUTH', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

-- 7. temp_storage (TMP + yyyymmdd + 0001)
CREATE TRIGGER tg_tmp_code_init
BEFORE INSERT ON `temp_storage`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(tmp_code, 12) AS UNSIGNED)), 0) INTO last_seq 
    FROM `temp_storage` WHERE tmp_code LIKE CONCAT('TMP', today_str, '%');
    SET NEW.tmp_code = CONCAT('TMP', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

-- 8. file (FILE + yyyymmdd + 0001)
CREATE TRIGGER tg_file_code_init
BEFORE INSERT ON `file`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(file_code, 13) AS UNSIGNED)), 0) INTO last_seq 
    FROM `file` WHERE file_code LIKE CONCAT('FILE', today_str, '%');
    SET NEW.file_code = CONCAT('FILE', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

-- 9. upd_history (HIS + yyyymmdd + 0001)
CREATE TRIGGER tg_history_no_init
BEFORE INSERT ON `upd_history`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(history_no, 12) AS UNSIGNED)), 0) INTO last_seq 
    FROM `upd_history` WHERE history_no LIKE CONCAT('HIS', today_str, '%');
    SET NEW.history_no = CONCAT('HIS', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

-- 10. dsbl_prs (DSBL + yyyymmdd + 0001)
CREATE TRIGGER tg_mc_pn_init
BEFORE INSERT ON `dsbl_prs`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(mc_pn, 13) AS UNSIGNED)), 0) INTO last_seq 
    FROM `dsbl_prs` WHERE mc_pn LIKE CONCAT('DSBL', today_str, '%');
    SET NEW.mc_pn = CONCAT('DSBL', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

-- 11. support_result (RES + yyyymmdd + 0001)
CREATE TRIGGER tg_result_code_init
BEFORE INSERT ON `support_result`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(result_code, 12) AS UNSIGNED)), 0) INTO last_seq 
    FROM `support_result` WHERE result_code LIKE CONCAT('RES', today_str, '%');
    SET NEW.result_code = CONCAT('RES', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

-- 12. survey_a (ANS + yyyymmdd + 0001)
CREATE TRIGGER tg_ans_code_init
BEFORE INSERT ON `survey_a`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT IFNULL(MAX(CAST(SUBSTRING(a_code, 12) AS UNSIGNED)), 0) INTO last_seq 
    FROM `survey_a` WHERE a_code LIKE CONCAT('ANS', today_str, '%');
    SET NEW.a_code = CONCAT('ANS', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

DELIMITER ;



-- survey pk 시퀀스
DELIMITER $$

CREATE TRIGGER tg_sver_code_init
BEFORE INSERT ON `survey`
FOR EACH ROW
BEGIN
    DECLARE today_str VARCHAR(8);
    DECLARE last_seq INT;

    -- 오늘 날짜 (yyyymmdd)
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');

    -- 오늘 날짜로 시작하는 가장 큰 일련번호 조회
    SELECT IFNULL(MAX(CAST(SUBSTRING(sver_code, 12) AS UNSIGNED)), 0)
    INTO last_seq
    FROM `survey`
    WHERE sver_code LIKE CONCAT('SUR', today_str, '%');

    -- 새 코드 생성
    SET NEW.sver_code = CONCAT('SUR', today_str, LPAD(last_seq + 1, 4, '0'));
END$$

DELIMITER ;


------------------------------------------20260224 트리거 추가----------------------------------------------------------------
DELIMITER $$

-- 1. major_category (MAJ + 0001)
CREATE TRIGGER tg_major_code_init
BEFORE INSERT ON `major_category`
FOR EACH ROW
BEGIN
    DECLARE last_seq INT;

    SELECT IFNULL(MAX(CAST(SUBSTRING(major_code, 4) AS UNSIGNED)), 0)
    INTO last_seq
    FROM `major_category`
    WHERE major_code LIKE 'MAJ%';

    SET NEW.major_code = CONCAT('MAJ', LPAD(last_seq + 1, 4, '0'));
END$$


-- 2. sub_category (SUB + 0001)
CREATE TRIGGER tg_sub_code_init
BEFORE INSERT ON `sub_category`
FOR EACH ROW
BEGIN
    DECLARE last_seq INT;

    SELECT IFNULL(MAX(CAST(SUBSTRING(sub_code, 4) AS UNSIGNED)), 0)
    INTO last_seq
    FROM `sub_category`
    WHERE sub_code LIKE 'SUB%';

    SET NEW.sub_code = CONCAT('SUB', LPAD(last_seq + 1, 4, '0'));
END$$


-- 3. survey_q (Q + 0001)
CREATE TRIGGER tg_q_code_init
BEFORE INSERT ON `survey_q`
FOR EACH ROW
BEGIN
    DECLARE last_seq INT;

    SELECT IFNULL(MAX(CAST(SUBSTRING(q_code, 2) AS UNSIGNED)), 0)
    INTO last_seq
    FROM `survey_q`
    WHERE q_code LIKE 'Q%';

    SET NEW.q_code = CONCAT('Q', LPAD(last_seq + 1, 4, '0'));
END$$


-- 4. survey_view (V + 0001)
CREATE TRIGGER tg_q_view_code_init
BEFORE INSERT ON `survey_view`
FOR EACH ROW
BEGIN
    DECLARE last_seq INT;

    SELECT IFNULL(MAX(CAST(SUBSTRING(q_view_code, 2) AS UNSIGNED)), 0)
    INTO last_seq
    FROM `survey_view`
    WHERE q_view_code LIKE 'V%';

    SET NEW.q_view_code = CONCAT('V', LPAD(last_seq + 1, 4, '0'));
END$$

DELIMITER ;