const query = require("../database/mapper/mapper.js");

exports.getOrganList = async () => {
  const rows = await query("selectOrganList");
  return Array.isArray(rows) ? rows : [];
};

/** 기관명 중복 여부 (excludeOrganNo: 수정 시 해당 기관 제외) */
exports.checkOrganNameExists = async (organName, excludeOrganNo = null) => {
  if (!organName || typeof organName !== "string") return false;
  const name = organName.trim();
  const rows = excludeOrganNo
    ? await query("selectCountOrganByNameExclude", [name, excludeOrganNo])
    : await query("selectCountOrganByName", [name]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  const cnt = row?.cnt ?? 0;
  return Number(cnt) > 0;
};

/** 사업자번호(organ_no) 정규화: 숫자만 추출하여 10자리 (하이픈 제거) */
function normalizeOrganNo(input) {
  if (input == null || typeof input !== "string") return "";
  const digits = input.replace(/\D/g, "");
  return digits.slice(0, 10);
}

/** 기관번호(organ_no) 중복 여부 */
exports.checkOrganNoExists = async (organNo) => {
  const no = normalizeOrganNo(organNo);
  if (no.length !== 10) return false;
  const rows = await query("selectCountOrganByNo", [no]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  const cnt = row?.cnt ?? 0;
  return Number(cnt) > 0;
};

exports.createOrgan = async (payload) => {
  const {
    organ_no: organNoInput,
    organ_name,
    organ_address,
    organ_mail,
    organ_tel,
    start_time,
    org_status = "c0_00",
  } = payload;

  const organ_no = normalizeOrganNo(organNoInput);
  if (organ_no.length !== 10) {
    const err = new Error("사업자번호는 10자리여야 합니다.");
    err.code = "INVALID_ORGAN_NO";
    throw err;
  }

  const end_time = "2999-12-31";

  await query("insertOrgan", [
    organ_no,
    organ_name?.trim() ?? "",
    organ_address?.trim() ?? "",
    organ_mail?.trim() ?? "",
    organ_tel?.trim() ?? "",
    start_time || null,
    end_time,
    org_status,
  ]);

  return { organ_no };
};

/** 기관 수정 */
exports.updateOrgan = async (organNo, payload) => {
  const {
    organ_name,
    organ_address,
    organ_mail,
    organ_tel,
    start_time,
    end_time,
    org_status = "c0_00",
  } = payload;

  await query("updateOrgan", [
    organ_name?.trim() ?? "",
    organ_address?.trim() ?? "",
    organ_mail?.trim() ?? "",
    organ_tel?.trim() ?? "",
    start_time || null,
    end_time || "2999-12-31",
    org_status,
    organNo,
  ]);

  return { organ_no: organNo };
};

/** 기관 일괄 삭제 */
exports.deleteOrgans = async (organNos) => {
  if (!Array.isArray(organNos) || organNos.length === 0) return { deleted: 0 };
  for (const no of organNos) {
    if (no) await query("deleteOrgan", [no]);
  }
  return { deleted: organNos.length };
};
