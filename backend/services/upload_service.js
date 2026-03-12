// 파일 업로드/다운로드/삭제 서비스
const fs = require("fs");
const path = require("path");
const query = require("../database/mapper/mapper.js");

// 글 PK(prefix)에 따른 category_name 매핑
function resolveCategoryNameByPk(pk) {
  if (!pk) return null;
  if (pk.startsWith("CNSL")) return "j0_10"; // 상담글
  if (pk.startsWith("PLAN")) return "j0_20"; // 지원계획
  if (pk.startsWith("RES")) return "j0_30"; // 지원결과
  return null;
}

/** 파일 변경 시 plan_updday 또는 result_updday를 NOW()로 갱신한다. */
async function touchUpddayIfNeeded(fileCategory, categoryName) {
  if (typeof fileCategory !== "string") return;
  if (fileCategory.startsWith("PLAN") || categoryName === "j0_20") {
    await query("uploadTouchPlanUpdday", [fileCategory]).catch((err) => {
      console.error(err);
      throw err;
    });
  } else if (fileCategory.startsWith("RES") || categoryName === "j0_30") {
    await query("uploadTouchResultUpdday", [fileCategory]).catch((err) => {
      console.error(err);
      throw err;
    });
  }
}

async function ensurePhysicalFile(fileRow) {
  if (!fileRow) return;
  const rel = String(fileRow.file_path || "").replace(/^[\\/]+/, "");
  const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
  const UPLOAD_ROOT = path.join(PROJECT_ROOT, "uploads");
  const dir = path.join(UPLOAD_ROOT, rel || "");
  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (err) {
    console.error("파일 생성 중 에러", err);
  }
}

async function resolveUploadMem(fileCategory, uploadMem) {
  if (uploadMem) return uploadMem;
  if (typeof fileCategory !== "string") return null;

  // PLAN... → 계획 코드로 mgr_no 조회
  if (fileCategory.startsWith("PLAN")) {
    const rows = await query("uploadFindMgrNoByPlanCode", [fileCategory]).catch(
      (err) => {
        console.error(err);
        throw err;
      },
    );
    return rows?.[0]?.mgr_no ?? null;
  }

  // RES... → 결과 코드로 mgr_no 조회
  if (fileCategory.startsWith("RES")) {
    const rows = await query("uploadFindMgrNoByResultCode", [
      fileCategory,
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return rows?.[0]?.mgr_no ?? null;
  }

  return null;
}

const svc = {
  // CASE A/B 공통: 카테고리에 새 파일들 추가 (기존 것은 건드리지 않음)
  insertFilesForCategory: async (fileCategory, files, uploadMem) => {
    if (!fileCategory || !Array.isArray(files) || files.length === 0)
      return null;

    const categoryName = resolveCategoryNameByPk(fileCategory);
    const finalUploadMem = await resolveUploadMem(fileCategory, uploadMem);
    await Promise.all(
      files.map((f) => {
        const ext = (f.file_ext || "").replace(/^\./, "");
        return query("uploadInsertFile", [
          fileCategory,
          categoryName,
          f.origin_file_name ?? "",
          f.file_path ?? "",
          ext,
          finalUploadMem ?? null,
        ]).catch((err) => {
          console.error(err);
          throw err;
        });
      }),
    );
    await touchUpddayIfNeeded(fileCategory, categoryName);
    return null;
  },

  // 카테고리별 파일 목록. file_category = 상세보기 항목 PK(csl_code 등)
  getFilesByCategory: async (fileCategory) => {
    const rows = await query("uploadSelectFilesByCategory", [
      fileCategory,
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return rows ?? [];
  },

  // 카테고리의 가장 최근 파일 조회 (INSERT 직후 server_file_name 확보용)
  getLatestFileByCategory: async (fileCategory) => {
    const rows = await query("uploadSelectLatestByCategory", [
      fileCategory,
    ]).catch((err) => {
      console.error(err);
      throw err;
    });
    return rows?.[0] ?? null;
  },

  // 단일 파일 조회
  getFileByCode: async (fileCode) => {
    const rows = await query("uploadSelectFileByCode", [fileCode]).catch(
      (err) => {
        console.error(err);
        throw err;
      },
    );
    return rows?.[0] ?? null;
  },

  // 단일 파일 삭제
  deleteFileByCode: async (fileCode) => {
    const file = await query("uploadSelectFileByCode", [fileCode]).catch(
      (err) => {
        console.error(err);
        throw err;
      },
    );
    await query("uploadDeleteFileByCode", [fileCode]).catch((err) => {
      console.error(err);
      throw err;
    });
    const row = Array.isArray(file) ? file[0] : file;
    if (row) {
      await touchUpddayIfNeeded(row.file_category, row.category_name);
    }
    return null;
  },
};

module.exports = svc;
