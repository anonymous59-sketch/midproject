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
  // 보기 조회 (질문에 FK로 속함, sver_code로 해당 조사지 버전의 전체 보기 조회)
  psw_surveyViewList: async (sver_code) => {
    const list = await query("psw_surveyViewList", sver_code || "").catch(
      (err) => console.error(err),
    );
    return list || [];
  },

  /////// 전체 저장: 등록(create) + 수정(edit) 기능
  /////// - 트리거로 생성된 PK(sver_code, major_code, sub_code)를 같은 트랜잭션 안에서 그대로 참조
  /////// - 트랜젝션 구조
  // 1. 전체 저장 버튼 클릭시 해당 값을 모두 가지고오기 (트랜젝션 생성), 2. db에 있는 데이터 (pk값으로 구별)이면 update 수행,
  // 3. db에 없는 데이터는 pk값이 없음 >> 트랜잭션 중에서 insert 수행(커밋 안함)
  // >> 방금 insert한 데이터를 조회(최근 생긴 값 조회 기능으로),
  // 4. 새로 생성된 pk값을 가지고 작업 진행 (수정, insert 등), 5. 모든 작업이 끝나면 해당 트랜젝션 커밋
  psw_saveSurveyAll: async (payload) => {
    // payload의 데이터 구조분해, 변수 선언
    const {
      mode,
      survey,
      majors = [],
      subs = [],
      questions = [],
      writer,
    } = payload;

    // 로그인 구현시 실제 작성자 번호로 교체
    const writerNo = writer || "MEM202602230001";

    try {
      const txResult = await query.runInTransactionWithContext(
        async ({ conn, sqlList }) => {
          // 1) Survey (조사지 정보)
          let sverCode = survey.sver_code || null;

          if (mode == "create") {
            // 새 조사지 버전 INSERT (트리거가 sver_code 생성)

            // 이전 버전 조사지 end_date를 현재 조사지 시작일로 업데이트
            await conn.query(sqlList.psw_surveyUpdateDate, [
              survey.sver_ondate,
            ]);

            // 새 조사지 INSERT
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

            // 방금 조사지를 insert했는데 찾지 못했다면 error로 처리
            if (!rows || !rows.length) {
              throw new Error("조사지 버전(sver_code)을 조회하지 못했습니다.");
            }

            // 조회된 조사지 코드를 변수에 저장, 이후 major, sub, question 작업에 사용
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

          // 2) Major (대분류 upsert == update or insert)

          const majorKeyToCode = {};

          for (const m of majors) {
            if (!m || !m.name) {
              continue;
            }

            // 넘어오는 데이터의 id값이 존재하면 문자열로 반환
            const rawKey =
              m.id != undefined && m.id != null ? String(m.id) : "";

            if (!rawKey) {
              continue;
            }

            // rawKey에서 MAJ로 시작하는지 확인, frontend에서 대분류 수정일 경우는 기존 major_code를 가져오고 신규일 경우 TMP_MAJ_숫자로 값을 가져옴
            const isExistingCode = rawKey.startsWith("MAJ");

            if (isExistingCode) {
              // 기존 대분류인 경우 UPDATE
              await conn.query(sqlList.psw_majorCategoryUpdate, [
                m.name,
                rawKey,
              ]);
              // 소분류에서 major_code를 fk로 받아서 사용해야되므로 major_code 값을 저장해두기
              majorKeyToCode[rawKey] = rawKey;
            } else {
              // 신규 대분류인 경우 INSERT (트리거가 major_code 생성)
              await conn.query(sqlList.psw_surveyMajorCategoryCreate, [
                sverCode,
                m.name,
              ]);
              // 같은 트랜잭션 안에서 방금 INSERT한 대분류 코드 조회
              const majorRows = await conn.query(
                sqlList.psw_getLastMajorCodeBySurvey,
                [sverCode],
              );
              // 방금 대분류를 insert했는데 찾지 못했다면 error로 처리
              if (!majorRows || !majorRows.length) {
                throw new Error(
                  "대분류 코드(major_code)를 조회하지 못했습니다.",
                );
              }
              // 조회된 대분류 코드를 majorKeyToCode에 저장 (프론트에서 받아온 값 : db에서 조회 또는 생성한 값 형식)
              // ex) {
              //   "MAJ202406250001" : "MAJ202406250001", // 기존 대분류 수정인 경우
              //   "TMP_MAJ_1" : "MAJ202406250002", // 신규 대분류인 경우
              // }
              const newMajorCode = majorRows[0].major_code;
              majorKeyToCode[rawKey] = newMajorCode;
            }
          }

          // 3) Sub (소분류 upsert)
          // 대분류와 비슷하게 진행
          // 차이점으로 소분류는 major_code를 fk로 참조해야되기 때문에 majorKeyToCode에서 major_code를 찾아서 사용해야됨
          const subKeyToCode = {};
          for (const s of subs) {
            if (!s || !s.name) {
              continue;
            }

            const rawSubKey =
              s.id != undefined && s.id != null ? String(s.id) : "";

            const rawMajorKey =
              s.majorId != undefined && s.majorId != null
                ? String(s.majorId)
                : "";

            if (!rawMajorKey) {
              continue;
            }
            // 프론트에서 넘어오는 majorId가 기존 대분류 코드인지, 신규 대분류 키인지 확인해서 major_code를 찾아야됨
            const majorCodeFromMap = majorKeyToCode[rawMajorKey];
            // majorKeyToCode에서 major_code를 찾았으면 사용하고, 못찾았으면 rawMajorKey(기존 대분류 코드) 사용
            const majorCode = majorCodeFromMap || rawMajorKey;

            if (!majorCode) {
              continue;
            }

            const isExistingSubCode = rawSubKey && rawSubKey.startsWith("SUB");

            if (isExistingSubCode) {
              // 기존 소분류인 경우 UPDATE
              await conn.query(sqlList.psw_subCategoryUpdate, [
                s.name,
                rawSubKey,
              ]);

              subKeyToCode[rawSubKey] = rawSubKey;
            } else if (rawSubKey) {
              // rawSubKey가 존재하는데 SUB로 시작하지 않는 경우는 새로 생성
              await conn.query(sqlList.psw_surveySubCategoryCreate, [
                majorCode,
                s.name,
              ]);
              // 같은 트랜잭션 안에서 방금 INSERT한 소분류 코드 조회
              const subRows = await conn.query(
                sqlList.psw_getLastSubCodeByMajor,
                [majorCode],
              );
              // 방금 소분류를 insert했는데 찾지 못했다면 error로 처리
              if (!subRows || !subRows.length) {
                throw new Error("소분류 코드(sub_code)를 조회하지 못했습니다.");
              }
              // 조회된 소분류 코드를 subKeyToCode에 저장 (프론트에서 받아온 값 : db에서 조회 또는 생성한 값 형식)
              // ex) {
              //   "SUB202406250001" : "SUB202406250001", // 기존 소분류 수정인 경우
              //   "TMP_SUB_1" : "SUB202406250002", // 신규 소분류인 경우
              // }
              const newSubCode = subRows[0].sub_code;
              subKeyToCode[rawSubKey] = newSubCode;
            }
          }
          // 4) Question (질문 upsert)
          for (const q of questions) {
            if (!q || !q.text) {
              continue;
            }

            const rawSubKey =
              q.subId != undefined && q.subId != null ? String(q.subId) : "";

            if (!rawSubKey) {
              continue;
            }

            const subCodeFromMap = subKeyToCode[rawSubKey];
            const subCode = subCodeFromMap || rawSubKey;

            if (!subCode || !q.qNo || !q.answerType) {
              continue;
            }

            const isCheckType = q.answerType === "f0_10";

            const rawQKey =
              q.id != undefined && q.id != null ? String(q.id) : "";

            const isExistingQuestion = rawQKey && rawQKey.startsWith("Q");

            let qCode = null;

            // 기존 질문 UPDATE
            if (isExistingQuestion) {
              qCode = rawQKey;

              await conn.query(sqlList.psw_surveyQUpdate, [
                q.qNo,
                q.answerType,
                q.text,
                qCode,
              ]);
            }
            // 신규 질문 INSERT
            else {
              const result = await conn.query(
                sqlList.psw_surveyQuestionCreate,
                [subCode, q.qNo, q.answerType, q.text],
              );

              // 트리거 PK면 insertId 사용 불가 → 다시 조회
              const qRows = await conn.query(
                sqlList.psw_getLastQuestionCodeBySub,
                [subCode],
              );

              if (!qRows || !qRows.length) {
                throw new Error("질문 코드(q_code)를 조회하지 못했습니다.");
              }

              qCode = qRows[0].q_code;
            }

            // CHECK 타입일 때 보기 upsert
            if (isCheckType && qCode) {
              const existingViewIds = [];

              for (const view of q.views || []) {
                if (!view || !view.content) {
                  continue;
                }

                const rawViewKey =
                  view.id != undefined && view.id != null
                    ? String(view.id)
                    : "";

                const isExistingView = rawViewKey && rawViewKey.startsWith("V");

                //  기존 보기 UPDATE
                if (isExistingView) {
                  await conn.query(sqlList.psw_surveyViewUpdate, [
                    view.content,
                    rawViewKey,
                  ]);

                  existingViewIds.push(rawViewKey);
                }
                //  신규 보기 INSERT
                else {
                  await conn.query(sqlList.psw_surveyViewCreate, [
                    qCode,
                    view.content,
                  ]);

                  // 트리거 PK → 다시 조회
                  const viewRows = await conn.query(
                    sqlList.psw_getLastViewCodeByQuestion,
                    [qCode],
                  );

                  if (!viewRows || !viewRows.length) {
                    throw new Error(
                      "보기 코드(q_view_code)를 조회하지 못했습니다.",
                    );
                  }

                  const newViewCode = viewRows[0].q_view_code;
                  existingViewIds.push(newViewCode);
                }
              }

              //  payload에 없는 기존 보기 삭제
              if (existingViewIds.length) {
                const placeholders = existingViewIds.map(() => "?").join(",");

                await conn.query(
                  `
                  DELETE FROM survey_view
                  WHERE q_code = ?
                    AND q_view_code NOT IN (${placeholders})
                  `,
                  [qCode, ...existingViewIds],
                );
              } else {
                // 보기가 하나도 없으면 전체 삭제
                await conn.query(`DELETE FROM survey_view WHERE q_code = ?`, [
                  qCode,
                ]);
              }
            }

            //  CHECK → 다른 타입으로 변경 시
            if (!isCheckType && qCode) {
              await conn.query(`DELETE FROM survey_view WHERE q_code = ?`, [
                qCode,
              ]);
            }
          }
          // 트랜잭션 안에서 사용한 주요 값(sver_code)을 반환
          return { sver_code: sverCode };
        },
      );

      if (txResult.success) {
        // 트랜잭션이 성공적으로 완료된 경우, 조사지 코드 반환
        return { isSuccessed: true, sver_code: txResult.data.sver_code };
      }

      return {
        // 트랜잭션 처리 중 오류가 발생한 경우, 오류 메시지 반환
        isSuccessed: false,
        message: txResult.errorMessage || txResult.error?.message,
      };
    } catch (err) {
      return {
        // 트랜잭션 실행 중 예기치 않은 오류가 발생한 경우, 오류 메시지 반환
        isSuccessed: false,
        message: err.message,
      };
    }
  },
};

// 같은 경로에 있는 svc.js 내보내기
module.exports = svc;
