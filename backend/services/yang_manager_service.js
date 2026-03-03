const query = require("../database/mapper/mapper.js"); // mapper

const svc = {
  // 담당자 목록 조회
  getManagerList: async () => {
    try {
      const [rows] = await query("getManagerList");
      return rows;
    } catch (err) {
      console.error("getManagerList error:", err);
      throw err;
    }
  },
};

module.exports = svc;
