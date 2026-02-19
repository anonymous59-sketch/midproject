// table : t_book_01

// 백틱 사용

// const qry = {
//   selectBookList: `
// SELECT no 
//         , name 
//         , writer 
//         , publisher 
//         , publication_date 
//         , info 
// FROM t_book_01 
// ORDER BY 1
// `,

//   selectBookOne: `
// SELECT no 
//         , name 
//         , writer 
//         , publisher 
//         , publication_date 
//         , info 
// FROM t_book_01 
// WHERE no = ?
// `,

//   bookInsert: ``,

//   bookUpdate: ``,

//   bookDelete: ``,
// };
// module.exports = qry;

const selectBookList = `
SELECT no 
        , name 
        , writer 
        , publisher 
        , publication_date 
        , info 
FROM t_book_01 
ORDER BY 1
`;

const selectBookOne = `
SELECT no 
        , name 
        , writer 
        , publisher 
        , publication_date 
        , info 
FROM t_book_01 
WHERE no = ?
`;

const bookInsert = `
INSERT INTO t_book_01 (name, writer, publisher, publication_date, info) 
VALUES (?, ?, ?, ?, ?)
`;

const bookUpdate = ``;

const bookDelete = ``;

module.exports = {
  selectBookList,
  selectBookOne,
  bookInsert,
  bookUpdate,
  bookDelete,
};
