-- 1-1. 메인 코드
CREATE TABLE `main_code` (
  `m_code` VARCHAR(30) NOT NULL,
  `m_name` VARCHAR(30) NULL,
  `m_note` VARCHAR(300) NULL,
  PRIMARY KEY (`m_code`)
);

-- 1-2. 서브 코드 (상태값, 구분값 등)
CREATE TABLE `sub_code` (
  `s_code` VARCHAR(30) NOT NULL,
  `m_code` VARCHAR(30) NOT NULL,
  `s_name` VARCHAR(30) NULL,
  `s_note` VARCHAR(300) NULL,
  PRIMARY KEY (`s_code`),
  CONSTRAINT `FK_main_code_TO_sub_code` FOREIGN KEY (`m_code`) REFERENCES `main_code` (`m_code`)
);

-- 1-3. 기관 마스터
CREATE TABLE `organ` (
  `organ_no` VARCHAR(20) NOT NULL COMMENT '하이픈 제외',
  `organ_name` VARCHAR(60) NOT NULL,
  `organ_address` VARCHAR(100) NOT NULL,
  `organ_mail` VARCHAR(40) NOT NULL UNIQUE,
  `organ_tel` VARCHAR(11) NOT NULL UNIQUE,
  `start_time` DATE NOT NULL,
  `end_time` DATE NULL,
  `org_status` VARCHAR(30) NOT NULL COMMENT '부코드 FK',
  PRIMARY KEY (`organ_no`),
  CONSTRAINT `FK_sub_code_TO_organ` FOREIGN KEY (`org_status`) REFERENCES `sub_code` (`s_code`)
);

-- 2-1. 회원
CREATE TABLE `member` (
  `m_no` VARCHAR(20) NOT NULL COMMENT 'MEM + 날짜 + 시퀀스',
  `m_id` VARCHAR(15) NOT NULL UNIQUE,
  `m_pw` CHAR(60) NOT NULL COMMENT 'bcrypt 사용',
  `m_nm` VARCHAR(30) NOT NULL,
  `m_email` VARCHAR(40) NOT NULL UNIQUE,
  `m_tel` VARCHAR(11) NOT NULL,
  `m_bd` DATE NOT NULL,
  `m_add` VARCHAR(100) NOT NULL,
  `m_auth` VARCHAR(30) NOT NULL COMMENT '부코드 FK',
  `m_org` VARCHAR(20) NULL, -- 수정사항 반영 (NULL 허용)
  PRIMARY KEY (`m_no`),
  CONSTRAINT `FK_organ_TO_member` FOREIGN KEY (`m_org`) REFERENCES `organ` (`organ_no`)
  CONSTRAINT `FK_sub_code_TO_member` FOREIGN KEY (`m_auth`) REFERENCES `sub_code` (`s_code`)
);

-- 2-2. 인증
CREATE TABLE `verification` (
  `verifi_no` VARCHAR(20) NOT NULL COMMENT 'AUTH + 날짜 + 시퀀스',
  `verifi_mail` VARCHAR(40) NOT NULL,
  `m_no` VARCHAR(20) NULL,
  `verifi_num` VARCHAR(6) NOT NULL COMMENT '6자리 무작위 생성',
  `verifi_purpose` VARCHAR(30) NOT NULL COMMENT '부코드 FK',
  `verifi_create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verifi_end_at` DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 3 MINUTE), -- 수정사항 반영
  `verifi_success` VARCHAR(30) NOT NULL COMMENT '부코드 FK',
  PRIMARY KEY (`verifi_no`),
  CONSTRAINT `FK_member_TO_verification` FOREIGN KEY (`m_no`) REFERENCES `member` (`m_no`),
  CONSTRAINT `FK_sub_code_TO_verifi_purpose` FOREIGN KEY (`verifi_purpose`) REFERENCES `sub_code` (`s_code`),
  CONSTRAINT `FK_sub_code_TO_verifi_success` FOREIGN KEY (`verifi_success`) REFERENCES `sub_code` (`s_code`)
);

-- 3-1. 설문 마스터
CREATE TABLE `survey` (
  `sver_code` VARCHAR(30) NOT NULL COMMENT 'SUR + 날짜',
  `sv_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sv_writer` VARCHAR(20) NOT NULL,
  `sver_ondate` DATE NOT NULL,
  `sver_enddate` DATE NULL,
  PRIMARY KEY (`sver_code`),
  CONSTRAINT `FK_member_TO_survey` FOREIGN KEY (`sv_writer`) REFERENCES `member` (`m_no`)
);

-- 3-2. 대분류
CREATE TABLE `major_category` (
  `major_code` VARCHAR(30) NOT NULL,
  `sver_code` VARCHAR(30) NOT NULL,
  `major_name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`major_code`),
  CONSTRAINT `FK_survey_TO_major_category` FOREIGN KEY (`sver_code`) REFERENCES `survey` (`sver_code`)
);

-- 3-3. 소분류
CREATE TABLE `sub_category` (
  `sub_code` VARCHAR(30) NOT NULL,
  `major_code` VARCHAR(30) NOT NULL,
  `sub_name` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`sub_code`),
  CONSTRAINT `FK_major_category_TO_sub_category` FOREIGN KEY (`major_code`) REFERENCES `major_category` (`major_code`)
);

-- 3-4. 설문 문항
CREATE TABLE `survey_q` (
  `q_code` VARCHAR(30) NOT NULL,
  `sub_code` VARCHAR(30) NOT NULL,
  `q_no` INT NOT NULL,
  `q_type` VARCHAR(30) NOT NULL COMMENT '부코드 FK',
  `q_content` LONGTEXT NOT NULL,
  PRIMARY KEY (`q_code`),
  CONSTRAINT `FK_sub_category_TO_survey_q` FOREIGN KEY (`sub_code`) REFERENCES `sub_category` (`sub_code`),
  CONSTRAINT `FK_sub_code_TO_survey_q_type` FOREIGN KEY (`q_type`) REFERENCES `sub_code` (`s_code`)
);

-- 3-5. 설문 보기
CREATE TABLE `survey_view` (
  `q_view_code` VARCHAR(30) NOT NULL,
  `q_code` VARCHAR(30) NOT NULL,
  `q_view_content` VARCHAR(900) NOT NULL,
  PRIMARY KEY (`q_view_code`),
  CONSTRAINT `FK_survey_q_TO_survey_view` FOREIGN KEY (`q_code`) REFERENCES `survey_q` (`q_code`)
);

-- 4-1. 장애 지원 대상자
CREATE TABLE `dsbl_prs` (
  `mc_pn` VARCHAR(20) NOT NULL COMMENT 'DSBL + 날짜 + 시퀀스',
  `mc_nm` VARCHAR(30) NOT NULL,
  `mc_bd` DATE NOT NULL,
  `mc_gender` VARCHAR(30) NOT NULL,
  `mc_address` VARCHAR(100) NOT NULL,
  `mc_type` VARCHAR(3000) NOT NULL,
  `gdn_no` VARCHAR(20) NOT NULL,
  `mc_submitdate` DATE NOT NULL,
  PRIMARY KEY (`mc_pn`),
  CONSTRAINT `FK_member_TO_dsbl_prs` FOREIGN KEY (`gdn_no`) REFERENCES `member` (`m_no`)
  CONSTRAINT `FK_sub_code_TO_dsbl_prs` FOREIGN KEY (`mc_gender`) REFERENCES `sub_code` (`s_code`)
);

-- 4-2. 지원 신청
CREATE TABLE `support` (
  `sup_code` VARCHAR(30) NOT NULL COMMENT 'SUPT + 날짜 + 시퀀스',
  `mem_no` VARCHAR(20) NOT NULL,
  `mc_pn` VARCHAR(20) NOT NULL,
  `sup_day` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mgr_no` VARCHAR(20) NOT NULL,
  `req_yn` VARCHAR(30) NOT NULL COMMENT '부코드 FK',
  `res_time` DATETIME NULL,
  `supt_rej_cmt` VARCHAR(200) NULL,
  `rank_res` VARCHAR(30) NULL,
  PRIMARY KEY (`sup_code`),
  CONSTRAINT `FK_member_TO_support_mem` FOREIGN KEY (`mem_no`) REFERENCES `member` (`m_no`),
  CONSTRAINT `FK_member_TO_support_mgr` FOREIGN KEY (`mgr_no`) REFERENCES `member` (`m_no`),
  CONSTRAINT `FK_dsbl_prs_TO_support` FOREIGN KEY (`mc_pn`) REFERENCES `dsbl_prs` (`mc_pn`),
  CONSTRAINT `FK_sub_code_TO_support_req` FOREIGN KEY (`req_yn`) REFERENCES `sub_code` (`s_code`)
  CONSTRAINT `FK_sub_code_TO_support` FOREIGN KEY (`rank_res`) REFERENCES `sub_code` (`s_code`)
);

-- 5-1. 상담 기록
CREATE TABLE `counsel` (
  `csl_code` VARCHAR(30) NOT NULL,
  `csl_name` VARCHAR(20) NOT NULL,
  `csl_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `csl_writer` VARCHAR(20) NOT NULL,
  `csl_write_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `csl_title` VARCHAR(40) NOT NULL,
  `csl_content` LONGTEXT NOT NULL,
  `cls_updday` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP, -- 자동 업데이트 설정
  `sup_code` VARCHAR(30) NULL,
  PRIMARY KEY (`csl_code`),
  CONSTRAINT `FK_member_TO_counsel_name` FOREIGN KEY (`csl_name`) REFERENCES `member` (`m_no`),
  CONSTRAINT `FK_member_TO_counsel_writer` FOREIGN KEY (`csl_writer`) REFERENCES `member` (`m_no`),
  CONSTRAINT `FK_support_TO_counsel` FOREIGN KEY (`sup_code`) REFERENCES `support` (`sup_code`)
);

-- 5-2. 지원 계획
CREATE TABLE `support_plan` (
  `plan_code` VARCHAR(30) NOT NULL COMMENT 'PLAN + 날짜 + 시퀀스',
  `sup_code` VARCHAR(30) NOT NULL,
  `dsbl_no` VARCHAR(20) NOT NULL, -- 크기 수정 반영
  `plan_goal` VARCHAR(40) NOT NULL,
  `start_time` DATE NOT NULL,
  `end_time` DATE NULL,
  `plan_content` LONGTEXT NOT NULL,
  `plan_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `plan_updday` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP, -- 자동 업데이트 설정
  `plan_tf` VARCHAR(30) NOT NULL COMMENT '부코드 FK',
  `plan_rej_cmt` VARCHAR(1000) NULL,
  PRIMARY KEY (`plan_code`),
  CONSTRAINT `FK_support_TO_support_plan` FOREIGN KEY (`sup_code`) REFERENCES `support` (`sup_code`),
  CONSTRAINT `FK_dsbl_prs_TO_support_plan` FOREIGN KEY (`dsbl_no`) REFERENCES `dsbl_prs` (`mc_pn`),
  CONSTRAINT `FK_sub_code_TO_support_plan_tf` FOREIGN KEY (`plan_tf`) REFERENCES `sub_code` (`s_code`)
);

-- 5-3. 지원 결과
CREATE TABLE `support_result` (
  `result_code` VARCHAR(30) NOT NULL COMMENT 'RES + 날짜 + 시퀀스',
  `plan_code` VARCHAR(30) NOT NULL,
  `result_title` VARCHAR(40) NOT NULL,
  `result_content` LONGTEXT NOT NULL,
  `result_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `result_updday` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP, -- 자동 업데이트 설정
  `result_tf` VARCHAR(30) NOT NULL COMMENT '부코드 FK',
  `result_rej_cmt` VARCHAR(1000) NULL, -- 컬럼명 변경 반영
  PRIMARY KEY (`result_code`),
  CONSTRAINT `FK_support_plan_TO_support_result` FOREIGN KEY (`plan_code`) REFERENCES `support_plan` (`plan_code`),
  CONSTRAINT `FK_sub_code_TO_support_result_tf` FOREIGN KEY (`result_tf`) REFERENCES `sub_code` (`s_code`)
);

-- 6-1. 우선순위 랭킹
CREATE TABLE `rank` (
  `req_code` VARCHAR(30) NOT NULL,
  `prev_req_code` VARCHAR(30) NULL,
  `sup_code` VARCHAR(30) NOT NULL, -- 컬럼명 변경 반영
  `s_rank_code` VARCHAR(30) NULL,
  `mgr_no` VARCHAR(20) NOT NULL,
  `apply_for` VARCHAR(1000) NOT NULL,
  `adm_no` VARCHAR(20) NOT NULL,
  `s_rank_res` VARCHAR(30) NULL,
  `rank_rej_cmt` VARCHAR(1000) NULL,
  PRIMARY KEY (`req_code`),
  CONSTRAINT `FK_rank_TO_rank` FOREIGN KEY (`prev_req_code`) REFERENCES `rank` (`req_code`),
  CONSTRAINT `FK_support_TO_rank` FOREIGN KEY (`sup_code`) REFERENCES `support` (`sup_code`),
  CONSTRAINT `FK_member_TO_rank_mgr` FOREIGN KEY (`mgr_no`) REFERENCES `member` (`m_no`),
  CONSTRAINT `FK_member_TO_rank_adm` FOREIGN KEY (`adm_no`) REFERENCES `member` (`m_no`)
);

-- 6-2. 설문 답변
CREATE TABLE `survey_a` (
  `a_code` VARCHAR(30) NOT NULL COMMENT 'ANS + 날짜 + 시퀀스',
  `q_code` VARCHAR(30) NOT NULL,
  `ans_no` VARCHAR(20) NOT NULL,
  `a_content` VARCHAR(1000) NOT NULL,
  `a_start` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `sup_code` VARCHAR(30) NULL,
  PRIMARY KEY (`a_code`),
  CONSTRAINT `FK_survey_q_TO_survey_a` FOREIGN KEY (`q_code`) REFERENCES `survey_q` (`q_code`),
  CONSTRAINT `FK_member_TO_survey_a` FOREIGN KEY (`ans_no`) REFERENCES `member` (`m_no`),
  CONSTRAINT `FK_support_TO_survey_a` FOREIGN KEY (`sup_code`) REFERENCES `support` (`sup_code`)
);

-- 7-1. 임시 저장
CREATE TABLE `temp_storage` (
  `tmp_code` VARCHAR(30) NOT NULL,
  `tar_category` VARCHAR(30) NOT NULL, -- 상담일지 / 지원계획 / 지원결과의 PK코드
  `category_name` VARCHAR(30) NOT NULL, -- 부코드 FK(주코드가 0J인 라인을 사용)
  `save_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `m_no` VARCHAR(20) NOT NULL,
  `save_title` VARCHAR(40) NULL,
  `save_content` LONGTEXT NULL,
  PRIMARY KEY (`tmp_code`),
  CONSTRAINT `FK_member_TO_temp_storage` FOREIGN KEY (`m_no`) REFERENCES `member` (`m_no`)
  CONSTRAINT `FK_sub_code_TO_temp_storage` FOREIGN KEY (`category_name`) REFERENCES `sub_code` (`s_code`)
);

-- 7-2. 파일 관리
CREATE TABLE `file` (
  `file_code` VARCHAR(30) NOT NULL,
  `file_category` VARCHAR(30) NOT NULL,
  `category_name` VARCHAR(30) NOT NULL,
  `origin_file_name` VARCHAR(100) NOT NULL,
  `server_file_name` VARCHAR(120) NOT NULL,
  `file_path` VARCHAR(200) NOT NULL,
  `file_ext` VARCHAR(10) NOT NULL,
  `upload_mem` VARCHAR(20) NOT NULL,
  `upload_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`file_code`),
  CONSTRAINT `FK_member_TO_file` FOREIGN KEY (`upload_mem`) REFERENCES `member` (`m_no`)
  CONSTRAINT `FK_sub_code_TO_file` FOREIGN KEY (`category_name`) REFERENCES `sub_code` (`s_code`)
);

-- 7-3. 수정 이력
CREATE TABLE `upd_history` (
  `history_no` VARCHAR(20) NOT NULL,
  `his_category` VARCHAR(30) NOT NULL,
  `category_name` VARCHAR(30) NOT NULL,
  `upd_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `upd_member` VARCHAR(20) NOT NULL,
  `upd_target` VARCHAR(30) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `upd_content` LONGTEXT NOT NULL, -- LONGTEXT로 통합
  PRIMARY KEY (`history_no`),
  CONSTRAINT `FK_member_TO_upd_history` FOREIGN KEY (`upd_member`) REFERENCES `member` (`m_no`)
  CONSTRAINT `FK_sub_code_TO_upd_history` FOREIGN KEY (`category_name`) REFERENCES `sub_code` (`s_code`)
);