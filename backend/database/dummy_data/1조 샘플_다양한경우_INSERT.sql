-- ============================================================
-- 1조 ERD 기준 샘플 INSERT (다양한 경우의 수, 약 20종)
-- 실행 전: 1) 1조 DB 테이블 정보.sql 로 테이블 생성
--         2) 1조 메인코드 및 서브코드 더미 데이터.sql 로 main_code, sub_code 입력
-- 한 m_no가 여러 dsbl_prs, sup_code, survey_a, counsel, support_plan, support_result를 가지는 경우
-- 지원계획: 승인(e0_10) / 반려(e0_99) / 검토(e0_00) / 보완(e0_80) 혼합
-- ============================================================

-- 1. 기관 1건 (사업자번호 하이픈 제외 10자리)
INSERT INTO `organ` (`organ_no`, `organ_name`, `organ_address`, `organ_mail`, `organ_tel`, `start_time`, `end_time`, `org_status`)
VALUES ('1234567890', '대구 남구 복지센터', '대구 남구 달구벌대로 100', 'organ1@test.com', '0531234567', '2024-01-01', NULL, 'c0_00');

-- 2. 회원: 일반이용자(지원자) 1명 - 여러 지원/대상자 소유
INSERT INTO `member` (`m_no`, `m_id`, `m_pw`, `m_nm`, `m_email`, `m_tel`, `m_bd`, `m_add`, `m_auth`, `m_org`)
VALUES ('MEM20260224001', 'user01', '$2a$10$dummybcryptpassword', '김지원', 'user01@test.com', '01011112222', '1990-05-15', '서울 강남구', 'a0_20', NULL);

-- 3. 회원: 기관담당자 1명 (위 기관 소속)
INSERT INTO `member` (`m_no`, `m_id`, `m_pw`, `m_nm`, `m_email`, `m_tel`, `m_bd`, `m_add`, `m_auth`, `m_org`)
VALUES ('MEM20260224002', 'mgr01', '$2a$10$dummybcryptpassword', '이담당', 'mgr01@test.com', '01022223333', '1985-03-20', '대구 수성구', 'a0_30', '1234567890');

-- 4. 회원: 기관관리자 1명
INSERT INTO `member` (`m_no`, `m_id`, `m_pw`, `m_nm`, `m_email`, `m_tel`, `m_bd`, `m_add`, `m_auth`, `m_org`)
VALUES ('MEM20260224003', 'org01', '$2a$10$dummybcryptpassword', '박기관', 'org01@test.com', '01033334444', '1980-01-10', '대구 북구', 'a0_40', '1234567890');

-- 5. 회원: 시스템관리자 1명
INSERT INTO `member` (`m_no`, `m_id`, `m_pw`, `m_nm`, `m_email`, `m_tel`, `m_bd`, `m_add`, `m_auth`, `m_org`)
VALUES ('MEM20260224004', 'admin01', '$2a$10$dummybcryptpassword', '최관리', 'admin@test.com', '01044445555', '1975-11-01', '서울 서초구', 'a0_99', NULL);

-- 6. 설문 마스터 1건 (조사지)
INSERT INTO `survey` (`sver_code`, `sv_time`, `sv_writer`, `sver_ondate`, `sver_enddate`)
VALUES ('SVER20260224', NOW(), 'MEM20260224004', '2026-02-01', '2026-12-31');

-- 7. 대분류 / 소분류 / 설문 문항 (survey_a FK용)
INSERT INTO `major_category` (`major_code`, `sver_code`, `major_name`) VALUES ('MAJ20260224001', 'SVER20260224', '기본정보');
INSERT INTO `sub_category` (`sub_code`, `major_code`, `sub_name`) VALUES ('SUB20260224001', 'MAJ20260224001', '신청정보');
INSERT INTO `survey_q` (`q_code`, `sub_code`, `q_no`, `q_type`, `q_content`) VALUES ('Q202602240001', 'SUB20260224001', 1, 'f0_00', '지원 사유를 입력하세요.');

-- 8. 장애 지원 대상자(dsbl_prs) - 동일 m_no(gdn_no)가 2명 등록
INSERT INTO `dsbl_prs` (`mc_pn`, `mc_nm`, `mc_bd`, `mc_gender`, `mc_address`, `mc_type`, `gdn_no`, `mc_submitdate`)
VALUES ('DSBL202602240001', '김대상1', '2010-02-01', 'b0_00', '서울 강남구', '지적', 'MEM20260224001', '2026-02-20');
INSERT INTO `dsbl_prs` (`mc_pn`, `mc_nm`, `mc_bd`, `mc_gender`, `mc_address`, `mc_type`, `gdn_no`, `mc_submitdate`)
VALUES ('DSBL202602240002', '김대상2', '2012-06-15', 'b0_10', '서울 강남구', '자폐', 'MEM20260224001', '2026-02-21');

-- 9. 지원 신청(support) - 동일 mem_no가 3건 (대상자1, 대상자2, 대상자1 다시)
INSERT INTO `support` (`sup_code`, `mem_no`, `mc_pn`, `sup_day`, `mgr_no`, `req_yn`, `res_time`, `supt_rej_cmt`, `rank_res`)
VALUES ('SUPT202602240001', 'MEM20260224001', 'DSBL202602240001', NOW(), 'MEM20260224002', 'e1_10', NULL, NULL, NULL);
INSERT INTO `support` (`sup_code`, `mem_no`, `mc_pn`, `sup_day`, `mgr_no`, `req_yn`, `res_time`, `supt_rej_cmt`, `rank_res`)
VALUES ('SUPT202602240002', 'MEM20260224001', 'DSBL202602240002', NOW(), 'MEM20260224002', 'e1_20', NOW(), NULL, 'e0_10');
INSERT INTO `support` (`sup_code`, `mem_no`, `mc_pn`, `sup_day`, `mgr_no`, `req_yn`, `res_time`, `supt_rej_cmt`, `rank_res`)
VALUES ('SUPT202602240003', 'MEM20260224001', 'DSBL202602240001', NOW(), NULL, 'e1_00', NULL, NULL, NULL);

-- 10. 설문 답변(survey_a) - 지원 2건에 대한 답변
INSERT INTO `survey_a` (`a_code`, `q_code`, `ans_no`, `a_content`, `a_start`, `sup_code`)
VALUES ('ANS202602240001', 'Q202602240001', 'MEM20260224001', '재활 지원 희망', CURDATE(), 'SUPT202602240001');
INSERT INTO `survey_a` (`a_code`, `q_code`, `ans_no`, `a_content`, `a_start`, `sup_code`)
VALUES ('ANS202602240002', 'Q202602240001', 'MEM20260224001', '교육 지원 희망', CURDATE(), 'SUPT202602240002');

-- 11. 상담(counsel) - 지원 2건에 대한 상담 기록
INSERT INTO `counsel` (`csl_code`, `csl_name`, `csl_date`, `csl_writer`, `csl_write_date`, `csl_title`, `csl_content`, `sup_code`)
VALUES ('CNSL202602240001', 'MEM20260224002', NOW(), 'MEM20260224002', NOW(), '초기 상담', '지원 내용 확인 및 일정 안내', 'SUPT202602240001');
INSERT INTO `counsel` (`csl_code`, `csl_name`, `csl_date`, `csl_writer`, `csl_write_date`, `csl_title`, `csl_content`, `sup_code`)
VALUES ('CNSL202602240002', 'MEM20260224002', NOW(), 'MEM20260224002', NOW(), '2차 상담', '계획 승인 후 진행 상황 공유', 'SUPT202602240002');

-- 12. 지원 계획(support_plan) - 경우1: 승인(e0_10)
INSERT INTO `support_plan` (`plan_code`, `prev_plan_code`, `sup_code`, `dsbl_no`, `plan_goal`, `start_time`, `end_time`, `plan_content`, `plan_date`, `plan_tf`, `plan_rej_cmt`)
VALUES ('PLAN202602240001', NULL, 'SUPT202602240001', 'DSBL202602240001', '1차 재활 목표', '2026-03-01', '2026-06-30', '주 2회 재활 프로그램 진행', NOW(), 'e0_10', NULL);

-- 13. 지원 계획 - 경우2: 반려(e0_99)
INSERT INTO `support_plan` (`plan_code`, `prev_plan_code`, `sup_code`, `dsbl_no`, `plan_goal`, `start_time`, `end_time`, `plan_content`, `plan_date`, `plan_tf`, `plan_rej_cmt`)
VALUES ('PLAN202602240002', NULL, 'SUPT202602240002', 'DSBL202602240002', '교육 지원 요청', '2026-03-15', NULL, '특수교육 신청', NOW(), 'e0_99', '제출 서류 미비로 반려');

-- 14. 지원 계획 - 경우3: 검토대기(e0_00)
INSERT INTO `support_plan` (`plan_code`, `prev_plan_code`, `sup_code`, `dsbl_no`, `plan_goal`, `start_time`, `end_time`, `plan_content`, `plan_date`, `plan_tf`, `plan_rej_cmt`)
VALUES ('PLAN202602240003', NULL, 'SUPT202602240003', 'DSBL202602240001', '2차 지원 계획', '2026-04-01', NULL, '추가 재활 목표', NOW(), 'e0_00', NULL);

-- 15. 지원 계획 - 경우4: 보완(e0_80) 후 재검토 가능
INSERT INTO `support_plan` (`plan_code`, `prev_plan_code`, `sup_code`, `dsbl_no`, `plan_goal`, `start_time`, `end_time`, `plan_content`, `plan_date`, `plan_tf`, `plan_rej_cmt`)
VALUES ('PLAN202602240004', NULL, 'SUPT202602240001', 'DSBL202602240001', '보완 요청된 계획', '2026-03-01', NULL, '담당자 피드백 반영 수정본', NOW(), 'e0_80', '세부 일정 보완 요청');

-- 16. 지원 결과(support_result) - 승인된 계획(PLAN202602240001)에 대한 결과 1건, 승인
INSERT INTO `support_result` (`result_code`, `prev_result_code`, `plan_code`, `result_title`, `result_content`, `result_date`, `result_tf`, `result_rej_cmt`)
VALUES ('RES202602240001', NULL, 'PLAN202602240001', '1차 결과 보고', '재활 프로그램 1차 진행 완료', NOW(), 'e0_10', NULL);

-- 17. 지원 결과 - 반려된 결과 예시 (다른 plan에 대한 결과는 생략 가능, 여기서는 승인 계획에 결과만)
-- (이미 16번에서 승인 결과 1건 추가)

-- 18. 우선순위 랭킹(rank) - 지원 2건에 대해 검토/승인
INSERT INTO `rank` (`req_code`, `prev_req_code`, `sup_code`, `s_rank_code`, `mgr_no`, `apply_for`, `adm_no`, `s_rank_res`, `rank_rej_cmt`)
VALUES ('REQ202602240001', NULL, 'SUPT202602240001', 'd0_20', 'MEM20260224002', '재활 지원 신청', 'MEM20260224004', 'e0_00', NULL);
INSERT INTO `rank` (`req_code`, `prev_req_code`, `sup_code`, `s_rank_code`, `mgr_no`, `apply_for`, `adm_no`, `s_rank_res`, `rank_rej_cmt`)
VALUES ('REQ202602240002', NULL, 'SUPT202602240002', 'd0_30', 'MEM20260224002', '교육 지원 신청', 'MEM20260224004', 'e0_10', NULL);

-- 19. 동일 회원의 추가 지원 1건 + 계획 반려 케이스 (sup_code 4번째)
INSERT INTO `support` (`sup_code`, `mem_no`, `mc_pn`, `sup_day`, `mgr_no`, `req_yn`, `res_time`, `supt_rej_cmt`, `rank_res`)
VALUES ('SUPT202602240004', 'MEM20260224001', 'DSBL202602240002', NOW(), 'MEM20260224002', 'e1_20', NOW(), NULL, 'e0_99');
INSERT INTO `support_plan` (`plan_code`, `prev_plan_code`, `sup_code`, `dsbl_no`, `plan_goal`, `start_time`, `end_time`, `plan_content`, `plan_date`, `plan_tf`, `plan_rej_cmt`)
VALUES ('PLAN202602240005', NULL, 'SUPT202602240004', 'DSBL202602240002', '추가 교육 지원', '2026-05-01', NULL, '방과후 교육', NOW(), 'e0_99', '예산 사유 반려');

-- 20. 상담 추가 - 3번째 지원에 대한 상담
INSERT INTO `counsel` (`csl_code`, `csl_name`, `csl_date`, `csl_writer`, `csl_write_date`, `csl_title`, `csl_content`, `sup_code`)
VALUES ('CNSL202602240003', 'MEM20260224002', NOW(), 'MEM20260224002', NOW(), '신규 지원 상담', '신규 지원 건 검토 예정', 'SUPT202602240003');

COMMIT;

-- ============================================================
-- 요약
-- ============================================================
-- organ: 1건 (1234567890)
-- member: 4건 (일반, 담당자, 기관관리자, 시스템관리자)
-- survey + major_category + sub_category + survey_q: 조사지 1세트
-- dsbl_prs: 2건 (동일 gdn_no=MEM20260224001)
-- support: 4건 (동일 mem_no=MEM20260224001, mc_pn 2종 혼합)
-- survey_a: 2건 (support 2건 연결)
-- counsel: 3건 (support 3건 연결)
-- support_plan: 5건 (승인1, 반려2, 검토대기1, 보완1)
-- support_result: 1건 (승인된 계획에 대한 결과)
-- rank: 2건 (검토/승인)
