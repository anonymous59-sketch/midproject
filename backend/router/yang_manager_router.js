const express = require("express");
const router = express.Router();
const manager_service = require("../services/yang_manager_service");

router.get("/list", async (req, res) => {
  try {
    const data = await manager_service.getManagerList();
    res.json(data);
  } catch (err) {
    console.error("manager list error:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
