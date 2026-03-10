// 파일 업로드/조회/삭제용 SQL 모음
// table: file

const qry = {
  // 카테고리별 파일 목록 조회
  uploadSelectFilesByCategory: `
    SELECT
      file_code,
      file_category,
      category_name,
      origin_file_name,
      server_file_name,
      file_path,
      file_ext,
      upload_mem,
      upload_date
    FROM file
    WHERE file_category = ?
    ORDER BY upload_date ASC, file_code ASC
  `,

  // 단일 파일 조회 (다운로드용)
  uploadSelectFileByCode: `
    SELECT
      file_code,
      file_category,
      category_name,
      origin_file_name,
      server_file_name,
      file_path,
      file_ext,
      upload_mem,
      upload_date
    FROM file
    WHERE file_code = ?
  `,

  // 파일 INSERT (server_file_name 은 DB DEFAULT 로 UUID_TO_BIN(UUID()) 자동 생성)
  uploadInsertFile: `
    INSERT INTO file (
      file_category,
      category_name,
      origin_file_name,
      file_path,
      file_ext,
      upload_mem
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `,

  // INSERT 직후 방금 추가된 레코드의 server_file_name 을 가져오기 위한 조회
  uploadSelectLatestByCategory: `
    SELECT
      file_code,
      server_file_name,
      file_path,
      file_ext,
      origin_file_name
    FROM file
    WHERE file_category = ?
    ORDER BY upload_date DESC
    LIMIT 1
  `,

  // 파일 삭제 (단일)
  uploadDeleteFileByCode: `
    DELETE FROM file
    WHERE file_code = ?
  `,

  // 지원계획(plan)의 plan_updday를 NOW()로 갱신
  uploadTouchPlanUpdday: `
    UPDATE support_plan
    SET plan_updday = NOW()
    WHERE plan_code = ?
  `,

  // 지원결과(result)의 result_updday를 NOW()로 갱신
  uploadTouchResultUpdday: `
    UPDATE support_result
    SET result_updday = NOW()
    WHERE result_code = ?
  `,

  // PLAN 코드 기준 mgr_no 조회
  uploadFindMgrNoByPlanCode: `
    SELECT m_mgr.m_no AS mgr_no
    FROM support_plan p
    JOIN support s ON p.sup_code = s.sup_code
    JOIN member m_mgr ON s.mgr_no = m_mgr.m_no
    WHERE p.plan_code = ?
  `,

  // RES 코드 기준 mgr_no 조회
  uploadFindMgrNoByResultCode: `
    SELECT m_mgr.m_no AS mgr_no
    FROM support_result r
    JOIN support_plan p ON r.plan_code = p.plan_code
    JOIN support s ON p.sup_code = s.sup_code
    JOIN member m_mgr ON s.mgr_no = m_mgr.m_no
    WHERE r.result_code = ?
  `,
};

module.exports = qry;

