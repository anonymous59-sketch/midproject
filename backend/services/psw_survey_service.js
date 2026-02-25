// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 svc.js에서 require부분에 해당 폴더 경로를 추가해주기

// service에서 필요에 따라 db에 접속 => mapper
const query = require("../database/mapper/mapper.js");

// 해당하는 기능을 svc라는 변수에 객체 형식으로 넣기
const svc = {
  // // 조사지 리스트 조회
  // psw_showSurveyList: async () => {
  //   const list = await query("psw_surveyList").catch((err) =>
  //     console.error(err),
  //   );
  //   return list;
  // },
  psw_searchSurveyName: async (searchData) => {
    const searchList = await query("psw_surveySearch", `%${searchData}%`).catch(
      (err) => console.error(err),
    );
    return searchList;
  },

  psw_majCateSelect: async (sver_code) => {
    const select = await query("psw_majCateSelect", `${sver_code}`).catch(
      (err) => console.error(err),
    );
    return select;
  },

  psw_subCateSelect: async (sver_code) => {
    const select = await query("psw_subCateSelect", `${sver_code}`).catch(
      (err) => console.error(err),
    );
    return select;
  },

  psw_surveyQSelect: async (sver_code) => {
    const select = await query("psw_surveyQSelect", `${sver_code}`).catch(
      (err) => console.error(err),
    );
    return select;
  },


  // 안쓰는 거 같은데? 제대로 확인해봐야함 ~137줄까지
  psw_createMajorCategory: async (inputdata) => {
    const data = convertObjToAry(inputdata, [
      "major_code",
      "sver_code",
      "major_name",
    ]);
    const resdata = await query("psw_surveyMajorCategoryCreate", data).catch(
      (err) => console.error(err),
    );
    // console.log(`====================`);
    // console.log(resdata);
    let result = null;
    if (resdata.affectedRows > 0) {
      result = {
        isSuccessed: true,
        major_code: resdata.major_code,
      };
    } else {
      result = {
        isSuccessed: false,
      };
    }
    return result;
  },
  psw_createSubCategory: async (inputdata) => {
    const data = convertObjToAry(inputdata, [
      "sub_code",
      "major_code",
      "sub_name",
    ]);
    const resdata = await query("psw_surveySubCategoryCreate", data).catch(
      (err) => console.error(err),
    );
    let result = null;
    if (resdata.affectedRows > 0) {
      result = {
        isSuccessed: true,
        major_code: resdata.major_code,
      };
    } else {
      result = {
        isSuccessed: false,
      };
    }
    return result;
  },
  psw_createSurveyQuestions: async (inputdata) => {
    const data = convertObjToAry(inputdata, [
      "q_code",
      "sub_code",
      "q_no",
      "q_type",
      "q_content",
    ]);
    const resdata = await query("psw_surveyQuestionCreate", data).catch((err) =>
      console.error(err),
    );
    let result = null;
    if (resdata.affectedRows > 0) {
      result = {
        isSuccessed: true,
        major_code: resdata.major_code,
      };
    } else {
      result = {
        isSuccessed: false,
      };
    }
    return result;
  },
  // 수정: 대분류·소분류·질문 3곳 한 번에 업데이트. 트랜잭션은 mapper.runInTransaction에서 처리
  psw_updateSurveyCategories: async (data) => {
    const objData = [
      {
        alias: "psw_majorCategoryUpdate",
        values: convertObjToAry(data, ["major_name", "major_code"]),
      },
      {
        alias: "psw_subCategoryUpdate",
        values: convertObjToAry(data, ["sub_name", "sub_code"]),
      },
      {
        alias: "psw_surveyQUpdate",
        values: convertObjToAry(data, ["q_content", "q_code"]),
      },
    ];
    const result = await query.runInTransaction(objData);
    if (result.success) {
      return { isSuccessed: true };
    }
    return { isSuccessed: false, message: result.error?.message };
  },

  /////// 전체 저장 했을 시
  psw_saveSurveyAll: async (payload) => {
    const { mode, survey, majors = [], subs = [], questions = [] } = payload;

    // 조사지 작성자 – 지금은 더미 사용
    const writerNo = "MEM202602230001";

    const objData = [];

    // 1) survey 등록일 때
    if (mode == "create") {
      // 새 조사지: sver_code 는 트리거에서 생성된다고 가정하고 INSERT 예시
      objData.push({
        alias: "psw_surveyInsert",
        values: [
          survey.sv_name,
          writerNo,
          survey.sver_ondate,
          survey.sver_enddate,
        ],
      });
      // 실제 사용 시에는 INSERT 후 생성된 sver_code 를 SELECT 로 다시 가져와서
      // 뒤의 major/sub/question INSERT 에 사용하도록 별도 처리 필요
    } else { /////// 업데이트 쿼리 사용해야됨
      /// 수정일 때
      // 기존 조사지 수정
      objData.push({
        alias: "psw_surveyUpdate",
        values: [
          survey.sv_name,
          survey.sver_ondate,
          survey.sver_enddate,
          survey.sver_code,
        ],
      });

      // 이 예시는 "전체 재구성" 패턴: 기존 대/소분류 및 질문을 모두 삭제 후 다시 INSERT
      objData.push({
        alias: "psw_surveyQDeleteByVersion",
        values: [survey.sver_code],
      });
      objData.push({
        alias: "psw_subCategoryDeleteByVersion",
        values: [survey.sver_code],
      });
      objData.push({
        alias: "psw_majorCategoryDeleteByVersion",
        values: [survey.sver_code],
      });
    }

    // 2) 대분류 INSERT (예시: major_code 는 트리거가 생성한다고 보고 NULL 전달)
    majors.forEach((m) => {
      objData.push({
        alias: "psw_surveyMajorCategoryCreate",
        values: [
          survey.sver_code,
          m.major_name || m.name,
          m.major_code || m.majorId,
        ],
      });
    });

    // 3) 소분류 INSERT (예시: sub_code 도 트리거에서 생성)
    subs.forEach((s) => {
      objData.push({
        alias: "psw_surveySubCategoryCreate",
        values: [s.sub_code || null, s.major_code, s.sub_name || s.name],
      });
    });

    // 4) 질문 INSERT
    questions.forEach((q) => {
      objData.push({
        alias: "psw_surveyQuestionCreate",
        values: [q.q_code || null, q.sub_code, q.q_no, q.q_type, q.q_content],
      });
    });

    const result = await query.runInTransaction(objData);
    if (result.success) {
      return { isSuccessed: true };
    }
    return { isSuccessed: false, message: result.error?.message };
  },
};

function convertObjToAry(target, keys) {
  return keys.map((key) => target[key]);
}

// 같은 경로에 있는 svc.js 내보내기
module.exports = svc;
