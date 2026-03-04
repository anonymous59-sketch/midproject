const query = require("../database/mapper/mapper.js");

/**
 * 담당자 목록 (m_auth = a0_30 승인됨, a0_31 승인요청)
 * @param {string} mAuth - 'a0_30'
 * @param {string|null} searchBy - m_nm | m_org | m_id
 * @param {string|null} searchValue - 검색어
 * @param {string|null} mOrgFilter - 기관관리자용: 동일 m_org 담당자만
 * @param {boolean} includePending - true면 a0_30 + a0_31 둘 다 조회
 */
exports.getManagersList = async (mAuth = "a0_30", searchBy = null, searchValue = null, mOrgFilter = null, includePending = false) => {
  const rows = includePending
    ? await query("selectManagersWithOrganIn", ["a0_30", "a0_31"])
    : await query("selectManagersWithOrgan", [mAuth]);
  let list = Array.isArray(rows) ? rows : [];
  if (mOrgFilter && String(mOrgFilter).trim()) {
    const org = String(mOrgFilter).trim();
    list = list.filter((r) => (r.m_org || "") === org);
  }
  if (!searchBy || !searchValue || typeof searchValue !== "string") {
    return list;
  }
  const val = searchValue.trim().toLowerCase();
  if (!val) return list;
  return list.filter((r) => {
    if (searchBy === "m_nm") return (r.m_nm || "").toLowerCase().includes(val);
    if (searchBy === "m_org") {
      const o = (r.organ_name || r.m_org || "").toLowerCase();
      return o.includes(val);
    }
    if (searchBy === "m_id") return (r.m_id || "").toLowerCase().includes(val);
    return true;
  });
};

/**
 * 승인요청(a0_31) → 승인(a0_30) 변경
 */
exports.approveManager = async (mNo) => {
  await query("updateManagerApprove", [mNo]);
  return { ok: true };
};

/**
 * 권한 변경 (승인요청→승인). 지원자 a0_21→a0_20, 기관관리자 a0_41→a0_40 등
 */
exports.updateMemberAuth = async (mNo, fromAuth, toAuth) => {
  await query("updateMemberAuth", [toAuth, mNo, fromAuth]);
  return { ok: true };
};

/**
 * 회원 목록 (m_auth IN (auth1, auth2)). 지원자(a0_20,a0_21), 기관관리자(a0_40,a0_41) 등
 */
exports.getMembersByAuthIn = async (authList, searchBy = null, searchValue = null, mOrgFilter = null) => {
  if (!Array.isArray(authList) || authList.length < 2) return [];
  const rows = await query("selectManagersWithOrganIn", authList.slice(0, 2));
  let list = Array.isArray(rows) ? rows : [];
  if (mOrgFilter && String(mOrgFilter).trim()) {
    const org = String(mOrgFilter).trim();
    list = list.filter((r) => (r.m_org || "") === org);
  }
  if (!searchBy || !searchValue || typeof searchValue !== "string") return list;
  const val = searchValue.trim().toLowerCase();
  if (!val) return list;
  return list.filter((r) => {
    if (searchBy === "m_nm") return (r.m_nm || "").toLowerCase().includes(val);
    if (searchBy === "m_org") {
      const o = (r.organ_name || r.m_org || "").toLowerCase();
      return o.includes(val);
    }
    if (searchBy === "m_id") return (r.m_id || "").toLowerCase().includes(val);
    return true;
  });
};

/**
 * 담당자 삭제 (반려 시 등). rejectReason은 향후 m_email 발송용으로 보관
 */
exports.deleteMember = async (mNo, rejectReason = null) => {
  await query("deleteMember", [mNo]);
  return { ok: true, rejectReason: rejectReason || "" };
};

/**
 * 담당자 프로필 수정 (m_nm, m_tel, m_email만, m_auth=a0_30)
 */
exports.updateManagerProfile = async (mNo, payload) => {
  const { m_nm, m_tel, m_email } = payload || {};
  const query = require("../database/mapper/mapper.js");
  await query("updateManagerProfile", [
    m_nm ?? "",
    m_tel ?? "",
    m_email ?? "",
    mNo,
  ]);
  return { ok: true };
};
