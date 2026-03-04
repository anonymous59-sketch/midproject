<!-- src/views/admin/AdminHome.vue -->
<script setup>
import { computed, ref, onMounted } from "vue";

// ✅ 체크박스 선택 상태(선택된 기관 no 목록)
const selectedNos = ref(new Set());

/** org_status → 표시 텍스트 (c0_00 운영, c0_10 휴업, c0_99 종료) */
function statusLabel(orgStatus) {
  const m = { c0_00: "운영", c0_10: "휴업", c0_99: "종료" };
  return m[orgStatus] ?? orgStatus ?? "";
}

/** 사업자번호 표시: 10자리 → xxx-xx-xxxxx */
function formatOrganNo(no) {
  if (no == null || no === "") return "";
  const d = String(no).replace(/\D/g, "").slice(0, 10);
  if (d.length !== 10) return String(no);
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

/** 사업자번호 정규화: 하이픈 제거 후 10자리 */
function normalizeOrganNo(input) {
  if (input == null || typeof input !== "string") return "";
  return input.replace(/\D/g, "").slice(0, 10);
}

/** API 응답(organ) → 테이블 행 형태로 변환 */
function mapOrganToRow(o) {
  const d = o.start_time ? new Date(o.start_time) : null;
  const createdAt = d
    ? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
    : "";
  const toYmd = (val) => {
    if (!val) return "";
    const d2 = new Date(val);
    return `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}-${String(d2.getDate()).padStart(2, "0")}`;
  };
  return {
    no: o.organ_no,
    orgName: o.organ_name ?? "",
    address: o.organ_address ?? "",
    tel: o.organ_tel ?? "",
    email: o.organ_mail ?? "",
    createdAt,
    org_status: o.org_status ?? "c0_00",
    start_time: toYmd(o.start_time),
    end_time: toYmd(o.end_time),
  };
}

/** 기관 목록 로드 (DB organ 테이블) */
const loading = ref(false);
const loadError = ref(null);
async function loadOrgans() {
  loading.value = true;
  loadError.value = null;
  try {
    const res = await fetch("/api/admin/organs");
    if (!res.ok) throw new Error(res.statusText || "목록 조회 실패");
    const data = await res.json();
    rows.value = Array.isArray(data) ? data.map(mapOrganToRow) : [];
  } catch (e) {
    loadError.value = e.message;
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadOrgans();
});

// ✅ 전체 선택 여부(필터링된 목록 기준)
const allChecked = computed(() => {
  if (filteredRows.value.length === 0) return false;
  return filteredRows.value.every((r) => selectedNos.value.has(r.no));
});

// ✅ 전체 선택 토글
const toggleAll = () => {
  const next = !allChecked.value;
  const set = new Set(selectedNos.value);

  if (next) {
    filteredRows.value.forEach((r) => set.add(r.no));
  } else {
    filteredRows.value.forEach((r) => set.delete(r.no));
  }
  selectedNos.value = set;
};

// ✅ 개별 선택 토글
const toggleOne = (no) => {
  const set = new Set(selectedNos.value);
  if (set.has(no)) set.delete(no);
  else set.add(no);
  selectedNos.value = set;
};

// ✅ 선택삭제: DB 삭제 (재확인 후 실행)
const onDeleteSelected = async () => {
  const ids = Array.from(selectedNos.value);

  if (ids.length === 0) {
    alert("삭제할 기관을 선택해주세요.");
    return;
  }

  const ok1 = confirm(`선택한 ${ids.length}개 기관을 삭제할까요?`);
  if (!ok1) return;

  const ok2 = confirm(
    "삭제된 데이터는 복구할 수 없습니다. 정말 삭제하시겠습니까?",
  );
  if (!ok2) return;

  try {
    const res = await fetch("/api/admin/organs/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organ_nos: ids }),
    });
    if (!res.ok) throw new Error("삭제 실패");
    selectedNos.value = new Set();
    await loadOrgans();
    alert("선택한 기관이 삭제되었습니다.");
  } catch (e) {
    alert(e.message || "삭제 중 오류가 발생했습니다.");
  }
};

/**
 * [1] 좌측 검색 입력값 (기관명)
 */
const filters = ref({
  orgName: "",
});

/** 검색 버튼/엔터 시에만 적용 (실시간 반영 안 함) */
const appliedFilters = ref({
  orgName: "",
});

/** [2] 기관 목록 (DB organ 테이블 연동) */
const rows = ref([]);

/** [3] 검색: 버튼 클릭 또는 엔터 시에만 적용 */
const onSearch = () => {
  appliedFilters.value.orgName = filters.value.orgName;
};
const onReset = () => {
  filters.value.orgName = "";
  appliedFilters.value.orgName = "";
};

/**
 * [4] 화면 필터링(computed) — appliedFilters 기준
 */
const filteredRows = computed(() => {
  const q = (appliedFilters.value.orgName || "").trim();
  if (!q) return rows.value;

  return rows.value.filter((r) => r.orgName.includes(q));
});

/** 수정 모달 열기 */
const showEditModal = ref(false);
const editForm = ref({
  organ_no: "",
  organ_name: "",
  organ_address: "",
  organ_mail: "",
  organ_tel: "",
  start_time: "",
  end_time: "2999-12-31",
  org_status: "c0_00",
});
const editSubmitting = ref(false);

const openEditModal = (row) => {
  editForm.value = {
    organ_no: row.no,
    organ_name: row.orgName,
    organ_address: row.address,
    organ_mail: row.email,
    organ_tel: row.tel,
    start_time: row.start_time || "",
    end_time: row.end_time || "2999-12-31",
    org_status: row.org_status || "c0_00",
  };
  showEditModal.value = true;
};

const closeEditModal = () => {
  if (!editSubmitting.value) showEditModal.value = false;
};

const submitEdit = async () => {
  const f = editForm.value;
  const name = (f.organ_name || "").trim();
  if (!name) {
    alert("기관명을 입력해주세요.");
    return;
  }
  if (!(f.organ_address || "").trim()) {
    alert("주소를 입력해주세요.");
    return;
  }
  if (!(f.start_time || "").trim()) {
    alert("시작일을 입력해주세요.");
    return;
  }

  editSubmitting.value = true;
  try {
    const checkRes = await fetch(
      `/api/admin/organs/check-name?organ_name=${encodeURIComponent(name)}&exclude_organ_no=${encodeURIComponent(f.organ_no)}`,
    );
    if (!checkRes.ok) throw new Error("중복 확인 실패");
    const { exists } = await checkRes.json();
    if (exists) {
      alert("이미 등록된 기관명이 존재합니다.");
      editSubmitting.value = false;
      return;
    }

    const res = await fetch(
      `/api/admin/organs/${encodeURIComponent(f.organ_no)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organ_name: name,
          organ_address: (f.organ_address || "").trim(),
          organ_mail: (f.organ_mail || "").trim(),
          organ_tel: (f.organ_tel || "").trim(),
          start_time: (f.start_time || "").trim() || null,
          end_time: (f.end_time || "").trim() || "2999-12-31",
          org_status: f.org_status || "c0_00",
        }),
      },
    );
    if (!res.ok) throw new Error("수정 실패");
    showEditModal.value = false;
    await loadOrgans();
  } catch (e) {
    alert(e.message || "처리 중 오류가 발생했습니다.");
  } finally {
    editSubmitting.value = false;
  }
};

// ——— 기관 등록 모달 ———
const showCreateModal = ref(false);
const createForm = ref({
  organ_no: "",
  organ_name: "",
  organ_address: "",
  organ_mail: "",
  organ_tel: "",
  start_time: "",
  org_status: "c0_00",
});
const createSubmitting = ref(false);

const openCreateModal = () => {
  createForm.value = {
    organ_no: "",
    organ_name: "",
    organ_address: "",
    organ_mail: "",
    organ_tel: "",
    start_time: "",
    org_status: "c0_00",
  };
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  if (!createSubmitting.value) showCreateModal.value = false;
};

/** 기관번호(사업자번호) 중복 체크 후 등록 */
const submitCreate = async () => {
  const f = createForm.value;
  const organNoRaw = (f.organ_no || "").trim();
  const organNo = normalizeOrganNo(organNoRaw);
  if (organNo.length !== 10) {
    alert("사업자번호를 10자리로 입력해주세요. (예: 123-45-67890)");
    return;
  }
  const name = (f.organ_name || "").trim();
  if (!name) {
    alert("기관명을 입력해주세요.");
    return;
  }
  if (!(f.organ_address || "").trim()) {
    alert("주소를 입력해주세요.");
    return;
  }
  if (!(f.start_time || "").trim()) {
    alert("시작일을 입력해주세요.");
    return;
  }

  createSubmitting.value = true;
  try {
    const checkRes = await fetch(
      `/api/admin/organs/check-organ-no?organ_no=${encodeURIComponent(organNo)}`,
    );
    if (!checkRes.ok) throw new Error("중복 확인 실패");
    const { exists } = await checkRes.json();
    if (exists) {
      alert("이미 등록된 사업자번호가 존재합니다.");
      createSubmitting.value = false;
      return;
    }

    const res = await fetch("/api/admin/organs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organ_no: organNo,
        organ_name: name,
        organ_address: (f.organ_address || "").trim(),
        organ_mail: (f.organ_mail || "").trim(),
        organ_tel: (f.organ_tel || "").trim(),
        start_time: (f.start_time || "").trim() || null,
        org_status: f.org_status || "c0_00",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "등록 실패");
    }
    showCreateModal.value = false;
    await loadOrgans();
  } catch (e) {
    alert(e.message || "처리 중 오류가 발생했습니다.");
  } finally {
    createSubmitting.value = false;
  }
};
</script>

<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <!-- 좌측: 검색(기관명) -->
      <div class="col-lg-3 mb-4">
        <div class="card">
          <div class="card-header pb-0">
            <h6 class="mb-0">검색</h6>
          </div>

          <form class="card-body" @submit.prevent="onSearch">
            <label class="form-label text-sm">기관명</label>
            <input
              v-model="filters.orgName"
              type="text"
              class="form-control form-control-sm"
              placeholder="예) 대구 남구"
            />

            <div class="mt-3 d-grid gap-2">
              <button type="submit" class="btn btn-primary mb-0">
                검색
              </button>
              <button type="button" class="btn btn-outline-secondary mb-0" @click="onReset">
                초기화
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 우측: 기관 목록 -->
      <div class="col-lg-9">
        <div class="card">
          <div
            class="card-header pb-0 d-flex align-items-center justify-content-between"
          >
            <h6 class="mb-0">기관</h6>

            <!-- PDF처럼 우측 상단/하단에 등록 버튼이 있는 느낌 -->
            <button
              class="btn btn-sm btn-outline-danger mb-0"
              @click="onDeleteSelected"
            >
              선택삭제
            </button>
          </div>

          <div class="card-body pt-3">
            <p v-if="loading" class="text-muted text-sm mb-0">로딩 중...</p>
            <p v-else-if="loadError" class="text-danger text-sm mb-0">
              {{ loadError }}
            </p>
            <div v-else class="table-responsive organ-table-scroll">
              <table class="table align-items-center">
                <thead>
                  <tr>
                    <!-- ✅ 체크박스(전체 선택) -->
                    <th class="text-center text-xs" style="width: 56px">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :checked="allChecked"
                        @change="toggleAll"
                      />
                    </th>
                    <th class="text-center text-xs">순번</th>
                    <th class="text-center text-xs">사업자번호</th>
                    <th class="text-center text-xs">기관명</th>
                    <th class="text-center text-xs">주소</th>
                    <th class="text-center text-xs">연락처</th>
                    <th class="text-center text-xs">이메일</th>
                    <th class="text-center text-xs">등록일</th>
                    <th class="text-center text-xs">상태</th>

                    <th class="text-center text-xs">수정</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(row, index) in filteredRows" :key="row.no">
                    <!-- ✅ 행 체크 -->
                    <td class="text-center">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :checked="selectedNos.has(row.no)"
                        @change="toggleOne(row.no)"
                      />
                    </td>
                    <td class="text-center text-sm">{{ index + 1 }}</td>
                    <td class="text-center text-sm">
                      {{ formatOrganNo(row.no) || row.no }}
                    </td>
                    <td class="text-center text-sm">{{ row.orgName }}</td>
                    <td class="text-center text-sm">{{ row.address }}</td>
                    <td class="text-center text-sm">{{ row.tel }}</td>
                    <td class="text-center text-sm">{{ row.email }}</td>
                    <td class="text-center text-sm">{{ row.createdAt }}</td>

                    <td class="text-center">
                      <span
                        class="badge"
                        :class="{
                          'bg-success': row.org_status === 'c0_00',
                          'bg-warning text-dark': row.org_status === 'c0_10',
                          'bg-secondary': row.org_status === 'c0_99',
                        }"
                      >
                        {{ statusLabel(row.org_status) }}
                      </span>
                    </td>

                    <td class="text-center">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary mb-0 p-1"
                        title="수정"
                        @click="openEditModal(row)"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path
                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  <tr v-if="filteredRows.length === 0">
                    <td
                      colspan="12"
                      class="text-center text-sm text-muted py-4"
                    >
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              v-if="!loading && !loadError"
              class="d-flex justify-content-end mt-3"
            >
              <button
                class="btn btn-sm btn-primary mb-0"
                @click="openCreateModal"
              >
                기관 등록하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 기관 등록 모달 (기관 등록하기 클릭 시에만 표시) -->
    <div
      v-if="showCreateModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
      @click.self="closeCreateModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">기관 등록</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="닫기"
              @click="closeCreateModal"
            />
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label"
                >사업자번호 <span class="text-danger">*</span></label
              >
              <input
                v-model="createForm.organ_no"
                type="text"
                class="form-control form-control-sm"
                placeholder="000-00-00000 (또는 10자리 숫자)"
                maxlength="12"
              />
              <small class="text-muted">하이픈 없이 10자리로 저장됩니다.</small>
            </div>
            <div class="mb-3">
              <label class="form-label"
                >기관명 <span class="text-danger">*</span></label
              >
              <input
                v-model="createForm.organ_name"
                type="text"
                class="form-control form-control-sm"
                placeholder="기관명 입력"
              />
            </div>
            <div class="mb-3">
              <label class="form-label"
                >주소 <span class="text-danger">*</span></label
              >
              <input
                v-model="createForm.organ_address"
                type="text"
                class="form-control form-control-sm"
                placeholder="주소 입력"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">연락처</label>
              <input
                v-model="createForm.organ_tel"
                type="text"
                class="form-control form-control-sm"
                placeholder="하이픈 제외 11자"
                maxlength="11"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">이메일</label>
              <input
                v-model="createForm.organ_mail"
                type="text"
                class="form-control form-control-sm"
                placeholder="이메일"
              />
            </div>
            <div class="mb-3">
              <label class="form-label"
                >시작일 <span class="text-danger">*</span></label
              >
              <input
                v-model="createForm.start_time"
                type="date"
                class="form-control form-control-sm"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">사용여부</label>
              <select
                v-model="createForm.org_status"
                class="form-select form-select-sm"
              >
                <option value="c0_00">운영</option>
                <option value="c0_10">휴업</option>
                <option value="c0_99">종료</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              :disabled="createSubmitting"
              @click="closeCreateModal"
            >
              취소
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="createSubmitting"
              @click="submitCreate"
            >
              {{ createSubmitting ? "등록 중..." : "등록" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 기관 수정 모달 -->
    <div
      v-if="showEditModal"
      class="modal d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
      @click.self="closeEditModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">기관 수정</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="닫기"
              @click="closeEditModal"
            />
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">기관번호(사업자번호)</label>
              <input
                :value="formatOrganNo(editForm.organ_no)"
                type="text"
                class="form-control form-control-sm bg-light"
                readonly
              />
            </div>
            <div class="mb-3">
              <label class="form-label"
                >기관명 <span class="text-danger">*</span></label
              >
              <input
                v-model="editForm.organ_name"
                type="text"
                class="form-control form-control-sm"
                placeholder="기관명 입력"
              />
            </div>
            <div class="mb-3">
              <label class="form-label"
                >주소 <span class="text-danger">*</span></label
              >
              <input
                v-model="editForm.organ_address"
                type="text"
                class="form-control form-control-sm"
                placeholder="주소 입력"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">연락처</label>
              <input
                v-model="editForm.organ_tel"
                type="text"
                class="form-control form-control-sm"
                placeholder="하이픈 제외 11자"
                maxlength="11"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">이메일</label>
              <input
                v-model="editForm.organ_mail"
                type="text"
                class="form-control form-control-sm"
                placeholder="이메일"
              />
            </div>
            <div class="mb-3">
              <label class="form-label"
                >시작일 <span class="text-danger">*</span></label
              >
              <input
                v-model="editForm.start_time"
                type="date"
                class="form-control form-control-sm"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">종료일</label>
              <input
                v-model="editForm.end_time"
                type="date"
                class="form-control form-control-sm"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">사용여부</label>
              <select
                v-model="editForm.org_status"
                class="form-select form-select-sm"
              >
                <option value="c0_00">운영</option>
                <option value="c0_10">휴업</option>
                <option value="c0_99">종료</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              :disabled="editSubmitting"
              @click="closeEditModal"
            >
              취소
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="editSubmitting"
              @click="submitEdit"
            >
              {{ editSubmitting ? "저장 중..." : "저장" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.organ-table-scroll {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
