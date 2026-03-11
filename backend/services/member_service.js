const path = require("path");
const query = require("../database/mapper/mapper.js");
require("dotenv").config({ path: path.join(__dirname, "../dbConfig.env") });
const nodemailer = require("nodemailer");

const emailUser = (process.env.EMAIL_USER || "").trim();
const emailPass = (process.env.EMAIL_PASS || "").trim();

const transporter =
  emailUser && emailPass
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      })
    : null;

async function sendMemberRejectEmail(toEmail, memberName, reason) {
  const to = (toEmail || "").trim();
  if (!to || !transporter) {
    throw new Error("이메일 정보를 찾을 수 없어 반려 메일을 발송할 수 없습니다.");
  }
  const name = (memberName || "").trim() || "회원";
  const subj = "[회원가입 반려 안내] 가입 요청이 반려되었습니다.";
  const safeReason = (reason || "").trim();
  const html = `
    <h3>회원가입 반려 안내</h3>
    <p>${name}님, 요청하신 회원가입이 반려되었습니다.</p>
    ${
      safeReason
        ? `<p><strong>반려 사유:</strong> ${safeReason}</p>`
        : "<p>자세한 사유는 기관에 문의해 주세요.</p>"
    }
    <p>이용해 주셔서 감사합니다.</p>
  `;
  const textLines = [
    `${name}님, 회원가입이 반려되었습니다.`,
    safeReason ? `반려 사유: ${safeReason}` : "",
  ].filter(Boolean);
  await transporter.sendMail({
    from: emailUser,
    to,
    subject: subj,
    text: textLines.join("\n"),
    html,
  });
}

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
  const trimmedReason = (rejectReason || "").trim();
  // 회원 이메일/이름 조회
  const rows = await query("selectMemberEmailByNo", [mNo]).catch(() => []);
  const member = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!member) {
    throw new Error("회원 정보를 찾을 수 없습니다.");
  }
  const toEmail = (member.m_email || "").trim();
  const memberName = (member.m_nm || "").trim();
  await sendMemberRejectEmail(toEmail, memberName, trimmedReason);
  await query("deleteMember", [mNo]);
  return { ok: true, rejectReason: trimmedReason };
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
