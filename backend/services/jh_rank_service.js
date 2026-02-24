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
    return rows ?? null;
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
