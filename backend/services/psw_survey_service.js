// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 svc.js에서 require부분에 해당 폴더 경로를 추가해주기

// service에서 필요에 따라 db에 접속 => mapper
const query = require("../database/mapper/mapper.js");

// 해당하는 기능을 svc라는 변수에 객체 형식으로 넣기
const svc = {
  // 조사지 이름기준 검색 조회
  psw_searchSurveyName: async (searchData) => {
    const searchList = await query("psw_surveySearch", `%${searchData}%`).catch(
      (err) => console.error(err),
    );
    return searchList;
  },
  // 대분류 조회
  psw_majCateList: async (sver_code) => {
    const List = await query("psw_majCateList", `${sver_code}`).catch((err) =>
      console.error(err),
    );
    return List;
  },
  // 소분류 조회
  psw_subCateList: async (sver_code) => {
    const List = await query("psw_subCateList", `${sver_code}`).catch((err) =>
      console.error(err),
    );
    return List;
  },
  // 질문 조회
  psw_surveyQList: async (sver_code) => {
    const List = await query("psw_surveyQList", `${sver_code}`).catch((err) =>
      console.error(err),
    );
    return List;
  },
  /////// 전체 저장: 등록(create) + 수정(edit)
  /////// - 트리거로 생성된 PK(sver_code, major_code, sub_code)를 같은 트랜잭션 안에서 그대로 참조
  psw_saveSurveyAll: async (payload) => {
    const { mode, survey, majors = [], subs = [], questions = [], writer } = payload;

    // 로그인 구현시 실제 작성자 번호로 교체
    const writerNo = writer || "MEM202602230001";

    try {
      const txResult = await query.runInTransactionWithContext(
        async ({ conn, sqlList }) => {
          /*
          ===================
          1) Survey (조사지 정보)
          ===================
          */
          let sverCode = survey.sver_code || null;

          if (mode == "create") {
            // 새 조사지 버전 INSERT (트리거가 sver_code 생성)
            await conn.query(sqlList.psw_surveyUpdateDate, [
                survey.sver_ondate,
                survey.sv_name,
            ]);

            await conn.query(sqlList.psw_surveyInsert, [
              survey.sv_name,
              writerNo,
              survey.sver_ondate,
              survey.sver_enddate || null,
            ]);

            // 같은 트랜잭션 안에서 방금 INSERT한 조사지 코드 조회
            const rows = await conn.query(
              sqlList.psw_getLastSurveyCodeByWriter,
              [writerNo, survey.sv_name],
            );

            if (!rows || !rows.length) {
              throw new Error("조사지 버전(sver_code)을 조회하지 못했습니다.");
            }

            sverCode = rows[0].sver_code;
          } else {
            // 기존 조사지 정보 UPDATE
            sverCode = survey.sver_code;
            await conn.query(sqlList.psw_surveyUpdate, [
              survey.sv_name,
              survey.sver_ondate,
              survey.sver_enddate || null,
              survey.sver_code,
            ]);
          }
          // 2) Major (대분류 upsert)
          const majorKeyToCode = new Map();

          for (const m of majors) {
            if (!m || !m.name) continue;

            const rawKey = m.id !== undefined && m.id !== null ? String(m.id) : "";
            if (!rawKey) continue;

            const isExistingCode = rawKey.startsWith("MAJ");

            if (isExistingCode) {
              // 기존 대분류: 이름만 수정
              await conn.query(sqlList.psw_majorCategoryUpdate, [
                m.name,
                rawKey,
              ]);
              majorKeyToCode.set(rawKey, rawKey);
            } else {
              // 신규 대분류: INSERT 후, 해당 조사지에서 가장 최근 major_code 조회
              await conn.query(sqlList.psw_surveyMajorCategoryCreate, [
                sverCode,
                m.name,
              ]);

              const majorRows = await conn.query(
                sqlList.psw_getLastMajorCodeBySurvey,
                [sverCode],
              );

              if (!majorRows || !majorRows.length) {
                throw new Error("대분류 코드(major_code)를 조회하지 못했습니다.");
              }

              const newMajorCode = majorRows[0].major_code;
              majorKeyToCode.set(rawKey, newMajorCode);
            }
          }

          // 3) Sub (소분류 upsert)

          const subKeyToCode = new Map();

          for (const s of subs) {
            if (!s || !s.name) continue;

            const rawSubKey =
              s.id !== undefined && s.id !== null ? String(s.id) : "";
            const rawMajorKey =
              s.majorId !== undefined && s.majorId !== null
                ? String(s.majorId)
                : "";

            if (!rawMajorKey) continue;

            // majorId는 항상 majorKeyToCode를 통해 실제 major_code로 변환 시도
            const majorCodeFromMap = majorKeyToCode.get(rawMajorKey);
            const majorCode = majorCodeFromMap || rawMajorKey;

            if (!majorCode) continue;

            const isExistingSubCode =
              rawSubKey && rawSubKey.startsWith("SUB");

            if (isExistingSubCode) {
              // 기존 소분류: 이름만 수정
              await conn.query(sqlList.psw_subCategoryUpdate, [
                s.name,
                rawSubKey,
              ]);
              subKeyToCode.set(rawSubKey, rawSubKey);
            } else if (rawSubKey) {
              // 신규 소분류: INSERT 후, 해당 대분류에서 가장 최근 sub_code 조회
              await conn.query(sqlList.psw_surveySubCategoryCreate, [
                majorCode,
                s.name,
              ]);

              const subRows = await conn.query(
                sqlList.psw_getLastSubCodeByMajor,
                [majorCode],
              );

              if (!subRows || !subRows.length) {
                throw new Error("소분류 코드(sub_code)를 조회하지 못했습니다.");
              }

              const newSubCode = subRows[0].sub_code;
              subKeyToCode.set(rawSubKey, newSubCode);
            }
          }
         // 4) Question (질문 upsert)

          for (const q of questions) {
            if (!q || !q.text) continue;

            const rawSubKey =
              q.subId !== undefined && q.subId !== null
                ? String(q.subId)
                : "";

            if (!rawSubKey) continue;

            // subId도 subKeyToCode를 통해 실제 sub_code로 변환 시도
            const subCodeFromMap = subKeyToCode.get(rawSubKey);
            const subCode = subCodeFromMap || rawSubKey;

            if (!subCode || !q.qNo || !q.answerType) continue;

            const qCode =
              q.id !== undefined && q.id !== null ? String(q.id) : null;

            if (qCode) {
              // 기존 질문 → 내용만 수정
              await conn.query(sqlList.psw_surveyQUpdate, [
                q.text,
                qCode,
              ]);
            } else {
              // 신규 질문 → INSERT
              await conn.query(sqlList.psw_surveyQuestionCreate, [
                subCode,
                q.qNo,
                q.answerType,
                q.text,
              ]);
            }
          }

          // 트랜잭션 안에서 사용한 주요 값(sver_code)을 반환
          return { sver_code: sverCode };
        },
      );

      if (txResult.success) {
        return { isSuccessed: true, sver_code: txResult.data.sver_code };
      }

      return {
        isSuccessed: false,
        message: txResult.errorMessage || txResult.error?.message,
      };
    } catch (err) {
      return {
        isSuccessed: false,
        message: err.message,
      };
    }
  },
};

function convertObjToAry(target, keys) {
  return keys.map((key) => target[key]);
}

// 같은 경로에 있는 svc.js 내보내기
module.exports = svc;
