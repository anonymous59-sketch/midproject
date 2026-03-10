-- 메인코드 데이터
INSERT INTO `main_code` VALUES ('0A', '회원 권한 코드', null);
INSERT INTO `main_code` VALUES ('0B', '성별 코드', null);
INSERT INTO `main_code` VALUES ('0C', '기관 상태 코드', null);
INSERT INTO `main_code` VALUES ('0D', '우선순위 상태 코드', null);
INSERT INTO `main_code` VALUES ('0E', '판정 상태 코드', null);
INSERT INTO `main_code` VALUES ('1E', '담당자 지원 코드', null);
INSERT INTO `main_code` VALUES ('0F', '질문 타입 코드', null);
INSERT INTO `main_code` VALUES ('0G', '라디오박스 답변 코드', null);
INSERT INTO `main_code` VALUES ('0H', '인증 상태 코드', null);
INSERT INTO `main_code` VALUES ('0I', '인증 목적 코드', null);
INSERT INTO `main_code` VALUES ('0J', '테이블 구분 코드', null);

-- 서브코드 데이터
-- 회원 권한
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('a0_20', '0A', '일반이용자');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('a0_21', '0A', '일반 가입대기자');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('a0_30', '0A', '기관담당자');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('a0_31', '0A', '기관 가입대기자');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('a0_40', '0A', '기관관리자');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('a0_41', '0A', '관리 가입대기자');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('a0_99', '0A', '시스템관리자');
-- 성별
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('b0_00', '0B', '남자');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('b0_10', '0B', '여자');

-- 기관 상태
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('c0_00', '0C', '운영');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('c0_10', '0C', '휴업');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('c0_99', '0C', '종료');

-- 우선순위 상태
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('d0_20', '0D', '계획');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('d0_30', '0D', '중점');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('d0_40', '0D', '긴급');

-- 판정 상태
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('e0_00', '0E', '검토');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('e0_10', '0E', '승인');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('e0_80', '0E', '보완');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('e0_99', '0E', '반려');

-- 담당자 지원
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('e1_00', '1E', '대기');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('e1_10', '1E', '신청');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('e1_20', '1E', '승인');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('e1_99', '1E', '반려');

-- 질문 타입
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('f0_00', '0F', '텍스트');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('f0_10', '0F', '체크박스');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('f0_20', '0F', '라디오');

-- 라디오박스
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('g0_00', '0G', '미선택');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('g0_10', '0G', '선택');

-- 인증상태
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('h0_00', '0H', '미인증');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('h0_10', '0H', '인증 성공');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('h0_99', '0H', '인증 실패');

-- 인증목적
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('i0_10', '0I', '이메일 인증');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('i0_20', '0I', '아이디 찾기');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('i0_30', '0I', '패스워드 찾기');

-- 테이블 구분
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('j0_10', '0J', '상담일지');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('j0_20', '0J', '지원계획');
INSERT INTO `sub_code`(s_code, m_code, s_name) VALUES ('j0_30', '0J', '지원결과');

COMMIT;