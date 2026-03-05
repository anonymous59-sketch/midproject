// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 svc.js에서 require부분에 해당 폴더 경로를 추가해주기

// service에서 필요에 따라 db에 접속 => mapper
const query = require("../database/mapper/mapper.js"); // mapper가져오기. mapper.js가 모든 서비스 모여있는 곳이라서 이 경로를 가져오면 됨

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

  // 승인(e0_10) / 반려(e0_99): support.rank_res 반영 후 rank s_rank_res 업데이트 (순서: support 먼저)
  decideRank: async (req_code, sup_code, s_rank_res) => {
    const decisionStr = String(s_rank_res);
    await query("supportRankResUpdate", [req_code, sup_code]).catch((err) => {
      console.error(err);
      throw err;
    });
    await query("rankDecide", [decisionStr, req_code]).catch((err) => {
      console.error(err);
      throw err;
    });
    return null;
  },

  // 보완: s_rank_res e0_80, rank_cmt 저장
  suppleRank: async (req_code, rank_cmt) => {
    await query("rankSupple", [rank_cmt ?? null, req_code]).catch((err) => {
      console.error(err);
      throw err;
    });
    return null;
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
