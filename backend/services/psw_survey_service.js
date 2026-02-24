// 각자 자신이 구현하는 기능에 맞게 파일을 추가하기, 대신 파일명에 어떤 기능인지 알기 쉽게 영문으로 적어주는 걸 권장
// export하고 같은 경로의 svc.js에서 require부분에 해당 폴더 경로를 추가해주기

// service에서 필요에 따라 db에 접속 => mapper
const query = require("../database/mapper/mapper.js");

// 해당하는 기능을 svc라는 변수에 객체 형식으로 넣기
const svc = {
  // 조사지 리스트 조회
  psw_showSurveyList: async () => {
    const list = await query("psw_surveyList").catch((err) =>
      console.error(err),
    );
    return list;
  },
  psw_searchSurveyName: async (searchData) => {
    const searchList = await query("psw_surveySearch", `%${searchData}%`).catch(
      (err) => console.error(err),
    );
    return searchList;
  },
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
};

function convertObjToAry(target, keys) {
  return keys.map((key) => target[key]);
}

// 같은 경로에 있는 svc.js 내보내기
module.exports = svc;
