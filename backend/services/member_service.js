const query = require("../database/mapper/mapper.js");

/**
 * 담당자 목록 (m_auth = a0_30), 검색 옵션: searchBy(m_nm | m_org | m_id), searchValue
 */
exports.getManagersList = async (mAuth = "a0_30", searchBy = null, searchValue = null) => {
  const rows = await query("selectManagersWithOrgan", [mAuth]);
  const list = Array.isArray(rows) ? rows : [];
  if (!searchBy || !searchValue || typeof searchValue !== "string") {
    return list;
  }
  const val = searchValue.trim().toLowerCase();
  if (!val) return list;
  return list.filter((r) => {
    if (searchBy === "m_nm") {
      return (r.m_nm || "").toLowerCase().includes(val);
    }
    if (searchBy === "m_org") {
      const org = (r.organ_name || r.m_org || "").toLowerCase();
      return org.includes(val);
    }
    if (searchBy === "m_id") {
      return (r.m_id || "").toLowerCase().includes(val);
    }
    return true;
  });
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
