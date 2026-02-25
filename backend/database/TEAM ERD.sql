CREATE TABLE `rank` (
	`req_code`	VARCHAR(30)	NOT NULL	COMMENT 'RANK + 날짜 + 시퀀스',
	`prev_req_code`	VARCHAR(30)	NULL,
	`sup_code`	VARCHAR(30)	NOT NULL,
	`s_rank_code`	VARCHAR(30)	NULL	COMMENT '부코드 FK - 우선순위 상태',
	`mgr_no`	VARCHAR(20)	NOT NULL	COMMENT '회원 FK',
	`apply_for`	VARCHAR(1000)	NOT NULL,
	`adm_no`	VARCHAR(20)	NOT NULL	COMMENT '회원 FK',
	`s_rank_res`	VARCHAR(30)	NULL	COMMENT '부코드 FK - 우선순위 상태',
	`rank_cmt`	VARCHAR(1000)	NULL	COMMENT '보완 및 반려 시에만 작성'
);

CREATE TABLE `sub_code` (
	`s_code`	VARCHAR(30)	NOT NULL,
	`m_code`	VARCHAR(30)	NOT NULL,
	`s_name`	VARCHAR(30)	NULL,
	`s_note`	VARCHAR(300)	NULL
);

CREATE TABLE `survey_q` (
	`q_code`	VARCHAR(30)	NOT NULL	COMMENT 'Q + 숫자?',
	`sub_code`	VARCHAR(30)	NOT NULL,
	`q_no`	INT	NOT NULL,
	`q_type`	VARCHAR(30)	NOT NULL	COMMENT '부코드 FK - 질문 타입',
	`q_content`	LONGTEXT	NOT NULL
);

CREATE TABLE `sub_category` (
	`sub_code`	VARCHAR(30)	NOT NULL	COMMENT 'SUB  + 숫자',
	`major_code`	VARCHAR(30)	NOT NULL,
	`sub_name`	VARCHAR(30)	NOT NULL
);

CREATE TABLE `support_plan` (
	`plan_code`	VARCHAR(30)	NOT NULL	COMMENT 'PLAN + 날짜 + 시퀀스',
	`sup_code`	VARCHAR(30)	NOT NULL,
	`dsbl_no`	VARCHAR(20)	NOT NULL	COMMENT '지원대상자 FK',
	`plan_goal`	VARCHAR(90)	NOT NULL,
	`start_time`	DATE	NOT NULL,
	`end_time`	DATE	NULL,
	`plan_content`	LONGTEXT	NOT NULL,
	`plan_date`	DATETIME	NOT NULL	DEFAULT NOW(),
	`plan_updday`	DATETIME	NULL,
	`plan_tf`	VARCHAR(30)	NOT NULL	COMMENT '부코드 FK - 판정 상태',
	`plan_cmt`	VARCHAR(1000)	NULL	COMMENT '보완 및 반려 시에만 작성'
);

CREATE TABLE `counsel` (
	`csl_code`	VARCHAR(30)	NOT NULL	COMMENT 'CNSL + 날짜 + 시퀀스',
	`csl_name`	VARCHAR(20)	NOT NULL	COMMENT '회원 FK',
	`csl_date`	DATETIME	NOT NULL	DEFAULT NOW(),
	`csl_writer`	VARCHAR(20)	NOT NULL	COMMENT '회원 FK',
	`csl_write_date`	DATETIME	NOT NULL	DEFAULT NOW(),
	`csl_title`	VARCHAR(90)	NOT NULL,
	`csl_content`	LONGTEXT	NOT NULL,
	`cls_updday`	DATETIME	NULL,
	`sup_code`	VARCHAR(30)	NULL
);

CREATE TABLE `support` (
	`sup_code`	VARCHAR(30)	NOT NULL	COMMENT 'SUPT + 날짜 + 시퀀스',
	`mem_no`	VARCHAR(20)	NOT NULL	COMMENT '회원 FK',
	`mc_pn`	VARCHAR(12)	NOT NULL,
	`sup_day`	DATETIME	NOT NULL	DEFAULT NOW(),
	`mgr_no`	VARCHAR(20)	NOT NULL	COMMENT '회원 FK',
	`req_yn`	VARCHAR(30)	NOT NULL	COMMENT '부코드 FK - 판정 상태',
	`res_time`	DATETIME	NULL,
	`supt_rej_cmt`	VARCHAR(1000)	NULL,
	`rank_res`	VARCHAR(30)	NULL	COMMENT '우선순위 FK'
);

CREATE TABLE `organ` (
	`organ_no`	VARCHAR(20)	NOT NULL	COMMENT '하이픈 제외',
	`organ_name`	VARCHAR(60)	NOT NULL,
	`organ_address`	VARCHAR(100)	NOT NULL,
	`organ_mail`	VARCHAR(40)	NOT NULL	COMMENT 'UNIQUE',
	`organ_tel`	VARCHAR(11)	NOT NULL	COMMENT 'UNIQUE',
	`start_time`	DATE	NOT NULL,
	`end_time`	DATE	NULL,
	`org_status`	VARCHAR(30)	NOT NULL	COMMENT '부코드 FK'
);

CREATE TABLE `verification` (
	`verifi_no`	VARCHAR(20)	NOT NULL	COMMENT 'AUTH + 날짜 + 시퀀스',
	`verifi_mail`	VARCHAR(40)	NOT NULL,
	`m_no`	VARCHAR(20)	NULL	COMMENT 'MEM + 날짜 + 시퀀스',
	`verifi_num`	VARCHAR(6)	NOT NULL	COMMENT '6자리 무작위 생성',
	`verifi_purpose`	VARCHAR(100)	NOT NULL	COMMENT '부코드 FK - 인증 목적',
	`verifi_create_at`	DATETIME	NOT NULL	DEFAULT NOW(),
	`verifi_end_at`	DATETIME	NOT NULL	DEFAULT NOW() + INTERVAL 3 MINUTE	COMMENT '인증생성시간 + 3분',
	`verifi_success`	VARCHAR(30)	NOT NULL	COMMENT '부코드 FK - 인증 상태'
);

CREATE TABLE `survey` (
	`sver_code`	VARCHAR(30)	NOT NULL	COMMENT 'SUR + 날짜',
	`sv_name`	VARCHAR(100)	NOT NULL,
	`sv_time`	DATETIME	NOT NULL	DEFAULT NOW(),
	`sv_writer`	VARCHAR(20)	NOT NULL	COMMENT '회원 FK',
	`sver_ondate`	DATE	NOT NULL,
	`sver_enddate`	DATE	NULL
);

CREATE TABLE `survey_view` (
	`q_view_code`	VARCHAR(30)	NOT NULL	COMMENT 'V + 숫자?',
	`q_code`	VARCHAR(30)	NOT NULL,
	`q_view_content`	VARCHAR(900)	NOT NULL
);

CREATE TABLE `main_code` (
	`m_code`	VARCHAR(30)	NOT NULL,
	`m_name`	VARCHAR(30)	NULL,
	`m_note`	VARCHAR(300)	NULL
);

CREATE TABLE `temp_storage` (
	`tmp_code`	VARCHAR(30)	NOT NULL	COMMENT 'TMP + 날짜 + 시퀀스',
	`tar_category`	VARCHAR(30)	NOT NULL	COMMENT '상담 / 지원계획 / 지원결과 PK 중 하나',
	`category_name`	VARCHAR(30)	NOT NULL	COMMENT '부코드 FK - 테이블 구분',
	`save_time`	DATETIME	NOT NULL	DEFAULT NOW(),
	`m_no`	VARCHAR(20)	NOT NULL	COMMENT '회원 FK',
	`save_title`	VARCHAR(90)	NULL,
	`save_content`	LONGTEXT	NULL
);

CREATE TABLE `file` (
	`file_code`	VARCHAR(30)	NOT NULL	COMMENT 'FILE + 날짜 + 시퀀스',
	`file_category`	VARCHAR(30)	NOT NULL	COMMENT '상담 / 지원계획 / 지원결과 PK 중 하나',
	`category_name`	VARCHAR(30)	NOT NULL	COMMENT '부코드 FK - 테이블 구분',
	`origin_file_name`	VARCHAR(100)	NOT NULL,
	`server_file_name`	VARCHAR(120)	NOT NULL,
	`file_path`	VARCHAR(200)	NOT NULL,
	`file_ext`	VARCHAR(10)	NOT NULL,
	`upload_mem`	VARCHAR(30)	NOT NULL	COMMENT '회원 FK',
	`upload_date`	DATETIME	NOT NULL	DEFAULT NOW()
);

CREATE TABLE `member` (
	`m_no`	VARCHAR(20)	NOT NULL	COMMENT 'MEM + 날짜 + 시퀀스',
	`m_id`	VARCHAR(15)	NOT NULL	COMMENT 'UNIQUE',
	`m_pw`	CHAR(60)	NOT NULL	COMMENT 'bcrypt 사용',
	`m_nm`	VARCHAR(30)	NOT NULL,
	`m_email`	VARCHAR(40)	NOT NULL	COMMENT 'UNIQUE',
	`m_tel`	VARCHAR(11)	NOT NULL	COMMENT '01012345678',
	`m_bd`	DATE	NOT NULL	COMMENT 'YYYY-MM-DD',
	`m_add`	VARCHAR(100)	NOT NULL	COMMENT '대구 중구 남일동 135-1 505호',
	`m_auth`	VARCHAR(30)	NOT NULL	COMMENT '부코드 FK - 회원 권한',
	`m_org`	VARCHAR(20)	NULL
);

CREATE TABLE `upd_history` (
	`history_no`	VARCHAR(20)	NOT NULL	COMMENT 'HIS + 날짜 + 시퀀스',
	`his_category`	VARCHAR(30)	NOT NULL	COMMENT '상담 / 지원계획 / 지원결과 PK 중 하나',
	`category_name`	VARCHAR(30)	NOT NULL	COMMENT '부코드 FK - 테이블 구분',
	`upd_date`	DATETIME	NOT NULL	DEFAULT NOW(),
	`upd_member`	VARCHAR(20)	NOT NULL	COMMENT '회원 FK',
	`upd_target`	VARCHAR(30)	NOT NULL,
	`content`	LONGTEXT	NOT NULL,
	`upd_content`	LONGTEXT	NOT NULL
);

CREATE TABLE `dsbl_prs` (
	`mc_pn`	VARCHAR(20)	NOT NULL	COMMENT 'DSBL + 날짜 + 시퀀스',
	`mc_nm`	VARCHAR(30)	NOT NULL,
	`mc_bd`	DATE	NOT NULL,
	`mc_gender`	VARCHAR(30)	NOT NULL	COMMENT '부코드 FK - 성별 코드',
	`mc_address`	VARCHAR(100)	NOT NULL,
	`mc_type`	VARCHAR(3000)	NOT NULL,
	`gdn_no`	VARCHAR(20)	NOT NULL,
	`mc_submitdate`	DATE	NOT NULL	DEFAULT NOW()
);

CREATE TABLE `support_result` (
	`result_code`	VARCHAR(30)	NOT NULL	COMMENT 'RES + 날짜 + 시퀀스',
	`plan_code`	VARCHAR(30)	NOT NULL,
	`result_title`	VARCHAR(90)	NOT NULL,
	`result_content`	LONGTEXT	NOT NULL,
	`result_date`	DATETIME	NOT NULL	DEFAULT NOW(),
	`result_updday`	DATETIME	NULL,
	`result_tf`	VARCHAR(30)	NOT NULL	COMMENT '부코드 FK - 판정 상태',
	`result_cmt`	VARCHAR(1000)	NULL	COMMENT '보완 및 반려 시에만 작성'
);

CREATE TABLE `survey_a` (
	`a_code`	VARCHAR(30)	NOT NULL	COMMENT 'ANS + 날짜 + 시퀀스',
	`q_code`	VARCHAR(30)	NOT NULL,
	`ans_no`	VARCHAR(20)	NOT NULL	COMMENT '회원 FK',
	`a_content`	VARCHAR(1000)	NOT NULL,
	`a_start`	DATE	NOT NULL	DEFAULT NOW(),
	`sup_code`	VARCHAR(30)	NULL
);

CREATE TABLE `major_category` (
	`major_code`	VARCHAR(30)	NOT NULL	COMMENT 'MAJ + 숫자',
	`sver_code`	VARCHAR(30)	NOT NULL	COMMENT 'SUR + 날짜',
	`major_name`	VARCHAR(100)	NOT NULL
);

ALTER TABLE `rank` ADD CONSTRAINT `PK_RANK` PRIMARY KEY (
	`req_code`
);

ALTER TABLE `sub_code` ADD CONSTRAINT `PK_SUB_CODE` PRIMARY KEY (
	`s_code`
);

ALTER TABLE `survey_q` ADD CONSTRAINT `PK_SURVEY_Q` PRIMARY KEY (
	`q_code`
);

ALTER TABLE `sub_category` ADD CONSTRAINT `PK_SUB_CATEGORY` PRIMARY KEY (
	`sub_code`
);

ALTER TABLE `support_plan` ADD CONSTRAINT `PK_SUPPORT_PLAN` PRIMARY KEY (
	`plan_code`
);

ALTER TABLE `counsel` ADD CONSTRAINT `PK_COUNSEL` PRIMARY KEY (
	`csl_code`
);

ALTER TABLE `support` ADD CONSTRAINT `PK_SUPPORT` PRIMARY KEY (
	`sup_code`
);

ALTER TABLE `organ` ADD CONSTRAINT `PK_ORGAN` PRIMARY KEY (
	`organ_no`
);

ALTER TABLE `verification` ADD CONSTRAINT `PK_VERIFICATION` PRIMARY KEY (
	`verifi_no`
);

ALTER TABLE `survey` ADD CONSTRAINT `PK_SURVEY` PRIMARY KEY (
	`sver_code`
);

ALTER TABLE `survey_view` ADD CONSTRAINT `PK_SURVEY_VIEW` PRIMARY KEY (
	`q_view_code`
);

ALTER TABLE `main_code` ADD CONSTRAINT `PK_MAIN_CODE` PRIMARY KEY (
	`m_code`
);

ALTER TABLE `temp_storage` ADD CONSTRAINT `PK_TEMP_STORAGE` PRIMARY KEY (
	`tmp_code`
);

ALTER TABLE `file` ADD CONSTRAINT `PK_FILE` PRIMARY KEY (
	`file_code`
);

ALTER TABLE `member` ADD CONSTRAINT `PK_MEMBER` PRIMARY KEY (
	`m_no`
);

ALTER TABLE `upd_history` ADD CONSTRAINT `PK_UPD_HISTORY` PRIMARY KEY (
	`history_no`
);

ALTER TABLE `dsbl_prs` ADD CONSTRAINT `PK_DSBL_PRS` PRIMARY KEY (
	`mc_pn`
);

ALTER TABLE `support_result` ADD CONSTRAINT `PK_SUPPORT_RESULT` PRIMARY KEY (
	`result_code`
);

ALTER TABLE `survey_a` ADD CONSTRAINT `PK_SURVEY_A` PRIMARY KEY (
	`a_code`
);

ALTER TABLE `major_category` ADD CONSTRAINT `PK_MAJOR_CATEGORY` PRIMARY KEY (
	`major_code`
);

