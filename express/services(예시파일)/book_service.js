// service에서 필요에 따라 db에 접속 => mapper
const mariadb = require("../database/mapper.js");

const svc = {
  findAll: async () => {
    const list = await mariadb
      .query("selectBookList")
      .catch((err) => console.error(err));
    return list;
  },
  findByBookNo: async (bookNo) => {
    const list = await mariadb
      .query("selectBookOne", bookNo)
      .catch((err) => console.error(err));
    const info = list[0];
    return info;
  },
  addNewBook: async (bookInfo) => {
    const data = convertObjToAry(bookInfo);
    const resInfo = await mariadb
      .query("bookInsert", data)
      .catch((err) => console.error(err));

    let result = null;
    if(resInfo.insertId > 0) {
      result = {
        isSuccessed: true,
        bookNo: resInfo.insertId,
      }
    } else {
      result = {
        isSuccessed: false,
      }
    }
    return result;
  },
};

function convertObjToAry(target) {
  return [
    target.name,
    target.writer,
    target.publisher,
    target.publication_date,
    target.info,
  ];
}
// 외부로 내보내기
module.exports = svc;
