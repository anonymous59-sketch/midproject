// 파일: backend/services/yang_auth_service.js
const query = require("../database/mapper/mapper.js");

const svc = {
  getUserById: async (m_id) => {
    if (!m_id) throw new Error("m_id가 필요합니다."); // 안전장치 추가
    return await query("getUserById", [m_id]);
  },
};

module.exports = svc;
