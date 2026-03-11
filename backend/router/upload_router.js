/**
 * 파일 업로드/다운로드/삭제 라우터 (upload_router.js)
 * ----------------------------------------
 * - POST /file-content: 단일 파일 업로드. multipart(form: file, file_category, file_path, upload_mem).
 *   DB에 메타만 INSERT(server_file_name은 DB DEFAULT UUID), 조회 후 물리 파일을 uploads/<file_path>/<hex>.<ext> 로 저장.
 * - GET /files/:categoryPk: 카테고리(plan_code 또는 result_code)별 파일 목록 조회.
 * - DELETE /file/:fileCode: 단일 파일 삭제(DB만. 물리 파일 삭제는 선택적).
 * - GET /download/:fileCode: 단일 파일 다운로드. Content-Disposition RFC 5987로 한글 파일명 처리.
 * - GET /download-zip/:categoryPk: 카테고리 전체 파일을 ZIP으로 압축 다운로드.
 * - 파일 크기 제한: 10MB. 초과 시 LIMIT_FILE_SIZE 응답.
 */
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const archiver = require("archiver");
const router = express.Router();

const service = require("../services/svc.js");

/** 프로젝트 루트(backend 상위) 기준 uploads 디렉터리. 물리 파일 저장/다운로드 경로 기준 */
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const UPLOAD_ROOT = path.join(PROJECT_ROOT, "uploads");

/** 상대 경로(예: 'plan', 'result')를 uploads 기준 절대 경로로 변환. 'uploads/' 접두사는 제거 */
function resolveUploadDir(relPath) {
  let p = String(relPath || "").replace(/^[\\/]+/, "");
  if (p.toLowerCase().startsWith("uploads/")) {
    p = p.slice("uploads/".length);
  }
  return path.join(UPLOAD_ROOT, p || "");
}

/** server_file_name(BINARY or string) + file_ext 로 물리 파일 절대경로를 반환 */
function resolvePhysicalPath(file) {
  const raw = file.server_file_name;
  const serverHex = Buffer.isBuffer(raw) ? raw.toString("hex") : String(raw || "");
  const physicalName = file.file_ext ? `${serverHex}.${file.file_ext}` : serverHex;
  return path.join(resolveUploadDir(file.file_path), physicalName);
}

/** origin_file_name + file_ext 로 다운로드 표시 파일명을 반환 */
function resolveDownloadName(file) {
  return file.file_ext
    ? `${file.origin_file_name}.${file.file_ext}`
    : file.origin_file_name || "file";
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 메모리 스토리지 + 10MB 제한
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

// 파일 업로드 통합 엔드포인트
// multipart/form-data: file(binary), file_category, file_path, upload_mem(optional)
// 순서: DB INSERT → server_file_name 조회 → 물리 파일 저장
router.post("/file-content", async (req, res) => {
  // multer 수동 실행 — LIMIT_FILE_SIZE 에러를 직접 처리
  try {
    await new Promise((resolve, reject) => {
      upload.single("file")(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.json({ retCode: "Fail", retMsg: "파일 용량이 10MB를 초과합니다." });
    }
    console.error(err);
    return res.json({ retCode: "Error", retMsg: "업로드 실패" });
  }

  try {
    if (!req.file) {
      return res.json({ retCode: "Fail", retMsg: "file 필요" });
    }

    const fileCategory = req.body.file_category;
    const filePath = req.body.file_path || "";
    const uploadMem = req.body.upload_mem || null;

    if (!fileCategory) {
      return res.json({ retCode: "Fail", retMsg: "file_category 필요" });
    }

    // 한글 등 UTF-8 파일명: 클라이언트가 file_name_utf8(Base64)로 보내면 복원, 아니면 originalname 사용
    let origName = "";
    if (req.body && typeof req.body.file_name_utf8 === "string" && req.body.file_name_utf8) {
      try {
        origName = Buffer.from(req.body.file_name_utf8, "base64").toString("utf8");
      } catch {
        origName = req.file.originalname || "";
      }
    } else {
      origName = req.file.originalname || "";
    }
    const dotIdx = origName.lastIndexOf(".");
    const nameWithoutExt = dotIdx > 0 ? origName.slice(0, dotIdx) : origName;
    const ext = dotIdx > 0 ? origName.slice(dotIdx + 1).toLowerCase() : "";

    // 1. DB INSERT (server_file_name 은 DB DEFAULT 로 UUID_TO_BIN(UUID()) 자동 생성)
    await service.insertFilesForCategory(
      fileCategory,
      [{ origin_file_name: nameWithoutExt, file_path: filePath, file_ext: ext }],
      uploadMem,
    );

    // 2. INSERT 된 레코드의 server_file_name 조회
    const fileInfo = await service.getLatestFileByCategory(fileCategory);
    if (!fileInfo) {
      return res.json({ retCode: "Error", retMsg: "파일 정보 조회 실패" });
    }

    // 3. BINARY(16) → hex 변환 후 실제 파일명 결정 (<hex>.<ext>)
    const raw = fileInfo.server_file_name;
    const serverHex = Buffer.isBuffer(raw) ? raw.toString("hex") : String(raw || "");
    const physicalName = ext ? `${serverHex}.${ext}` : serverHex;

    // 4. uploads/<file_path>/ 에 실제 파일 저장
    const dir = resolveUploadDir(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, physicalName), req.file.buffer);

    res.json({ retCode: "Success", retMsg: "업로드 완료" });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "업로드 실패" });
  }
});

// 카테고리별 파일 목록 조회
router.get("/files/:categoryPk", async (req, res) => {
  const { categoryPk } = req.params;
  try {
    if (!categoryPk) {
      res.json({ retCode: "Fail", retMsg: "categoryPk 필요" });
      return;
    }
    const list = await service.getFilesByCategory(categoryPk);
    res.json({ retCode: "Success", data: list ?? [] });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "조회 실패" });
  }
});

// 단일 파일 삭제
router.delete("/file/:fileCode", async (req, res) => {
  const { fileCode } = req.params;
  try {
    if (!fileCode) {
      res.json({ retCode: "Fail", retMsg: "fileCode 필요" });
      return;
    }
    await service.deleteFileByCode(fileCode);
    res.json({ retCode: "Success", retMsg: "삭제 완료" });
  } catch (err) {
    console.error(err);
    res.json({ retCode: "Error", retMsg: "삭제 실패" });
  }
});

// 단일 파일 다운로드: file_code → DB 조회 → <hex>.<ext> 파일 전송
// 클라이언트 저장명: origin_file_name.file_ext (RFC 5987 인코딩)
router.get("/download/:fileCode", async (req, res) => {
  const { fileCode } = req.params;
  try {
    if (!fileCode) {
      res.json({ retCode: "Fail", retMsg: "fileCode 필요" });
      return;
    }
    const file = await service.getFileByCode(fileCode);
    if (!file) {
      res.json({ retCode: "Fail", retMsg: "파일 없음" });
      return;
    }

    const absPath = resolvePhysicalPath(file);
    const downloadName = resolveDownloadName(file);

    // RFC 5987 인코딩으로 한글 등 비 ASCII 파일명 깨짐 방지
    const encodedName = encodeURIComponent(downloadName);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
    );
    res.sendFile(absPath, (err) => {
      if (err) {
        console.error(err);
        if (!res.headersSent) {
          res.json({ retCode: "Error", retMsg: "다운로드 실패" });
        }
      }
    });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.json({ retCode: "Error", retMsg: "다운로드 실패" });
    }
  }
});

// 카테고리 전체 파일을 ZIP으로 압축해 다운로드
router.get("/download-zip/:categoryPk", async (req, res) => {
  const { categoryPk } = req.params;
  try {
    if (!categoryPk) {
      res.json({ retCode: "Fail", retMsg: "categoryPk 필요" });
      return;
    }
    const files = await service.getFilesByCategory(categoryPk);
    if (!files || files.length === 0) {
      res.json({ retCode: "Fail", retMsg: "파일 없음" });
      return;
    }

    const zipName = encodeURIComponent(`${categoryPk}_files.zip`);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipName}"; filename*=UTF-8''${zipName}`,
    );

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err) => {
      console.error(err);
      if (!res.headersSent) {
        res.json({ retCode: "Error", retMsg: "ZIP 생성 실패" });
      }
    });
    archive.pipe(res);

    for (const file of files) {
      const absPath = resolvePhysicalPath(file);
      const downloadName = resolveDownloadName(file);
      if (fs.existsSync(absPath)) {
        archive.file(absPath, { name: downloadName });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.json({ retCode: "Error", retMsg: "ZIP 다운로드 실패" });
    }
  }
});

module.exports = router;
