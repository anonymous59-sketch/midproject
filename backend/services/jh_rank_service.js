// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 svc.js에서 require부분에 해당 폴더 경로를 추가해주기

const path = require("path");
const query = require("../database/mapper/mapper.js");
require("dotenv").config({ path: path.join(__dirname, "../dbConfig.env") });
const nodemailer = require("nodemailer");

const emailUser = (process.env.EMAIL_USER || "").trim();
const emailPass = (process.env.EMAIL_PASS || "").trim();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

/** 객체에서 키 대소문자 무시하고 값 조회 */
function getProp(obj, key) {
  if (!obj || typeof obj !== "object") return undefined;
  const k = Object.keys(obj).find((x) => x.toLowerCase() === key.toLowerCase());
  return k != null ? obj[k] : undefined;
}

/** 우선순위 판정 결과를 신청 회원 이메일로 발송. 성공 시 true, 실패/스킵 시 false */
async function sendRankResultEmail(toEmail, memberName, supCode, decision, rankCmt) {
  const to = (toEmail && toEmail.trim()) || "";
  if (!to) return false;
  const name = (memberName && memberName.trim()) || "회원";
  const subj = "[우선순위 판정 안내] 지원신청 결과를 알려드립니다.";
  let resultText = "";
  let resultHtml = "";
  if (decision === "e0_10") {
    resultText = "승인";
    resultHtml = "<p><strong>우선순위가 승인</strong>되었습니다. 지원계획 단계로 진행하실 수 있습니다.</p>";
  } else if (decision === "e0_99") {
    resultText = "반려";
    resultHtml = "<p><strong>우선순위가 반려</strong>되었습니다. 자세한 내용은 담당 기관에 문의해 주세요.</p>";
  } else if (decision === "e0_80") {
    resultText = "보완 요청";
    resultHtml = "<p><strong>보완이 요청</strong>되었습니다.</p>";
    if (rankCmt && rankCmt.trim()) {
      resultHtml += `<p>보완 사유: ${rankCmt.trim()}</p>`;
    }
    resultHtml += "<p>내용을 보완한 뒤 다시 승인 요청을 진행해 주세요.</p>";
  } else {
    resultText = "처리 완료";
    resultHtml = "<p>우선순위 판정이 처리되었습니다.</p>";
  }
  const html = `
    <h3>우선순위 판정 결과 안내</h3>
    <p>${name}님, 요청하신 지원신청(지원번호: ${supCode || "-"})에 대한 우선순위 판정 결과입니다.</p>
    ${resultHtml}
    <p>감사합니다.</p>
  `;
  try {
    await transporter.sendMail({
      from: emailUser,
      to,
      subject: subj,
      text: `${name}님, 우선순위 판정 결과: ${resultText}. 지원번호: ${supCode || "-"}`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[sendRankResultEmail]", err);
    return false;
  }
}

/** mapper 결과에서 첫 행 배열 추출 (드라이버가 [rows, meta] 반환하는 경우 대비) */
function toRows(result) {
  if (result == null) return [];
  if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) return result[0];
  if (Array.isArray(result)) return result;
  return [result];
}

/** sup_code로 신청 회원 이메일·이름 조회 (단일 행). 없거나 이메일 없으면 null + console.warn */
async function getMemberEmailBySupCode(supCode) {
  const raw = await query("selectMemberEmailBySupCode", [supCode]).catch(() => null);
  const rows = toRows(raw);
  const row = rows[0];
  if (!row) {
    console.warn("[getMemberEmailBySupCode] sup_code에 해당하는 신청 회원 없음:", supCode);
    return null;
  }
  const m_email = (getProp(row, "m_email") || "").trim();
  const m_nm = (getProp(row, "m_nm") || "").trim();
  if (!m_email) {
    console.warn("[getMemberEmailBySupCode] 신청 회원 이메일 없음. sup_code:", supCode, "m_no:", getProp(row, "m_no"));
    return null;
  }
  return { m_email, m_nm };
}

/** req_code로 sup_code 조회 (보완 시 이메일 발송용) */
async function getSupCodeByReqCode(reqCode) {
  const raw = await query("selectSupCodeByReqCode", [reqCode]).catch(() => null);
  const rows = toRows(raw);
  const row = rows[0];
  if (!row) return null;
  const supCode = (getProp(row, "sup_code") || "").trim();
  return supCode || null;
}

// 해당하는 기능을 svc라는 변수에 객체 형식으로 넣기
const svc = {
  // 우선순위 헤더 내용
  getRankInfo: async (rankRequestCode) => {
    const rows = await query("rankInfo", [rankRequestCode]).catch((err) => {
      console.error(err);
      throw err;
    });
    console.log(rows);
    return rows ?? null;
  },

  // 승인요청: rank 테이블에 INSERT. prev_req_code 있으면 재신청(보완 후)
  insertRank: async (prev_req_code, sup_code, s_rank_code, mgr_no, apply_for) => {
    const rows = await query("rankInsert", [
      prev_req_code ?? null,
      sup_code,
      s_rank_code ?? null,
      mgr_no ?? null,
      apply_for ?? null,
      mgr_no ?? null, // 서브쿼리 기관관리자 조회용
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return rows ?? null;
  },

  // 승인(e0_10) / 반려(e0_99): support.rank_res 반영 후 rank s_rank_res 업데이트 (순서: support 먼저). 반려 시 rank_cmt 저장
  decideRank: async (req_code, sup_code, s_rank_res, rank_cmt = null) => {
    const decisionStr = String(s_rank_res);
    await query("supportRankResUpdate", [req_code, sup_code]).catch((err) => {
      console.error(err);
      throw err;
    });
    if (decisionStr === "e0_99" && rank_cmt != null && String(rank_cmt).trim() !== "") {
      await query("rankDecideReject", [String(rank_cmt).trim(), req_code]).catch((err) => {
        console.error(err);
        throw err;
      });
    } else {
      await query("rankDecide", [decisionStr, req_code]).catch((err) => {
        console.error(err);
        throw err;
      });
    }
    return null;
  },

  // 보완: s_rank_res e0_80, rank_cmt 저장 + 신청 회원 이메일 회신
  suppleRank: async (req_code, rank_cmt) => {
    await query("rankSupple", [rank_cmt ?? null, req_code]).catch((err) => {
      console.error(err);
      throw err;
    });
    let emailSent = false;
    const supCode = await getSupCodeByReqCode(req_code);
    if (supCode) {
      const member = await getMemberEmailBySupCode(supCode);
      if (member && member.m_email) {
        emailSent = await sendRankResultEmail(member.m_email, member.m_nm, supCode, "e0_80", rank_cmt ?? null);
      } else if (!member) {
        console.warn("[suppleRank] req_code로 sup_code 조회 후 신청 회원 없음. req_code:", req_code, "sup_code:", supCode);
      }
    } else {
      console.warn("[suppleRank] req_code에 해당하는 sup_code 없음:", req_code);
    }
    return { emailSent };
  },

  // 보완이력 조회: sup_code 기준으로 e0_80(보완) 판정 기록 목록 반환
  getRankSuppleHistory: async (supCode) => {
    const rows = await query("rankSuppleHistory", [supCode]).catch((err) => {
      console.error(err);
      throw err;
    });
    return Array.isArray(rows) ? rows : [];
  },

  // 우선순위 지정
  updateRank: async (rankRequestCode, rankCode, rankComment) => {
    // rankUpdate SQL: SET s_rank_code = ?, rank_cmt = ? WHERE req_code = ?
    const rows = await query("rankUpdate", [
      rankCode,
      rankComment,
      rankRequestCode,
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return rows ?? null;
  },
};

// function convertObjToAry(target) {
//   return [
//     target.name,
//     target.writer,
//     target.publisher,
//     target.publication_date,
//     target.info,
//   ];
// }

// 같은 경로에 있는 svc.js 내보내기
module.exports = svc;
