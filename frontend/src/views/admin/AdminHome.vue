<!-- src/views/admin/AdminHome.vue -->
<script setup>
import { computed, ref, onMounted } from "vue";
import { usePagination } from "@/composables/usePagination";
import SearchNavbar from "@/views/components/SearchNavbar.vue";
import MainTable from "@/views/components/MainTable.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";

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

// 선택삭제 로직은 현재 UI에서 사용하지 않아 제거. 필요 시 MainTable 액션 영역과 함께 재도입 가능.

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

// 페이징: 공통 composable 사용 (페이지당 10건, 순번은 전체 건수 기준 내림차순)
const { page, pageSize, totalItems: totalRows, pagedItems: pagedRows, rowDisplayNo } =
  usePagination(() => filteredRows.value, 10);

// ------- 기관 주소 입력(우편번호 API) 공통 유틸 -------
const createZipCode = ref("");
const createBaseAddress = ref("");
const createDetailAddress = ref("");

const editZipCode = ref("");
const editBaseAddress = ref("");
const editDetailAddress = ref("");

const makeFullAddress = (zip, base, detail) => {
  return `(${zip || ""}) ${base || ""} ${detail || ""}`
    .replace(/\s+/g, " ")
    .trim();
};

const openPostcodeForCreate = () => {
  new window.daum.Postcode({
    oncomplete: function (data) {
      createZipCode.value = data.zonecode;
      createBaseAddress.value = data.roadAddress || data.jibunAddress;
      createForm.value.organ_address = makeFullAddress(
        createZipCode.value,
        createBaseAddress.value,
        createDetailAddress.value,
      );
    },
  }).open();
};

const openPostcodeForEdit = () => {
  new window.daum.Postcode({
    oncomplete: function (data) {
      editZipCode.value = data.zonecode;
      editBaseAddress.value = data.roadAddress || data.jibunAddress;
      editForm.value.organ_address = makeFullAddress(
        editZipCode.value,
        editBaseAddress.value,
        editDetailAddress.value,
      );
    },
  }).open();
};

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
  // 기존 주소에서 우편번호/기본주소 대략 분리 (형식: "(우편번호) 주소 ...")
  const addr = row.address || "";
  const zipMatch = addr.match(/\((\d+)\)/);
  const zip = zipMatch ? zipMatch[1] : "";
  const rest = addr.replace(/^\(\d+\)\s*/, "");

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
  editZipCode.value = zip;
  editBaseAddress.value = rest;
  editDetailAddress.value = "";
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
  createZipCode.value = "";
  createBaseAddress.value = "";
  createDetailAddress.value = "";
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
      <SearchNavbar title="검색" @search="onSearch" @reset="onReset">
        <label class="form-label text-sm">기관명</label>
        <ArgonInput
          v-model="filters.orgName"
          type="text"
          size="sm"
          placeholder="예) 대구 남구"
        />
      </SearchNavbar>

      <MainTable
        title="기관"
        :subtitle="'선택삭제 및 기관 등록 관리'"
        :list-error="loadError || ''"
        :loading="loading"
        :rows-count="filteredRows.length"
        empty-text="검색 결과가 없습니다."
        :colspan="12"
        v-model:page="page"
        :page-size="pageSize"
        :total="totalRows"
      >
        <template #header>
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
        </template>
        <template #body>
          <tr v-for="(row, idx) in pagedRows" :key="row.no">
            <!-- ✅ 행 체크 -->
            <td class="text-center">
              <input
                class="form-check-input"
                type="checkbox"
                :checked="selectedNos.has(row.no)"
                @change="toggleOne(row.no)"
              />
            </td>
            <td class="text-center text-sm">{{ rowDisplayNo(idx) }}</td>
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
              <a
                href="javascript:;"
                class="text-secondary"
                title="수정"
                @click.prevent="openEditModal(row)"
              >
                <i class="fas fa-pencil-alt"></i>
              </a>
            </td>
          </tr>

          <tr v-if="!loading && !loadError && filteredRows.length === 0">
            <td colspan="12" class="text-center text-sm text-muted py-4">
              검색 결과가 없습니다.
            </td>
          </tr>

          <tr v-if="!loading && !loadError">
            <td colspan="12" class="text-end pt-3">
              <ArgonButton size="sm" color="primary" @click="openCreateModal">
                기관 등록하기
              </ArgonButton>
            </td>
          </tr>
        </template>
      </MainTable>
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
              <label class="form-label">사업자번호 <span class="text-danger">*</span></label>
              <ArgonInput
                v-model="createForm.organ_no"
                type="text"
                size="sm"
                placeholder="000-00-00000 (또는 10자리 숫자)"
                maxlength="12"
              />
              <small class="text-muted">하이픈 없이 10자리로 저장됩니다.</small>
            </div>
            <div class="mb-3">
              <label class="form-label">기관명 <span class="text-danger">*</span></label>
              <ArgonInput
                v-model="createForm.organ_name"
                type="text"
                size="sm"
                placeholder="기관명 입력"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">주소 <span class="text-danger">*</span></label>
              <div class="d-flex gap-2 mb-2">
                <ArgonInput
                  v-model="createZipCode"
                  type="text"
                  size="sm"
                  placeholder="우편번호"
                  readonly
                />
                <ArgonButton
                  type="button"
                  size="sm"
                  variant="outline"
                  color="primary"
                  @click="openPostcodeForCreate"
                >
                  주소 검색
                </ArgonButton>
              </div>
              <ArgonInput
                v-model="createBaseAddress"
                type="text"
                size="sm"
                class="mb-2"
                placeholder="기본 주소"
                readonly
              />
              <ArgonInput
                v-model="createDetailAddress"
                type="text"
                size="sm"
                placeholder="상세 주소를 입력해주세요"
                @update:model-value="
                  createForm.organ_address = makeFullAddress(
                    createZipCode,
                    createBaseAddress,
                    createDetailAddress,
                  )
                "
              />
            </div>
            <div class="mb-3">
              <label class="form-label">연락처</label>
              <ArgonInput
                v-model="createForm.organ_tel"
                type="text"
                size="sm"
                placeholder="하이픈 제외 11자"
                maxlength="11"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">이메일</label>
              <ArgonInput
                v-model="createForm.organ_mail"
                type="text"
                size="sm"
                placeholder="이메일"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">시작일 <span class="text-danger">*</span></label>
              <ArgonInput
                v-model="createForm.start_time"
                type="date"
                size="sm"
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
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              :disabled="createSubmitting"
              @click="closeCreateModal"
            >
              취소
            </ArgonButton>
            <ArgonButton
              type="button"
              size="sm"
              color="primary"
              :disabled="createSubmitting"
              @click="submitCreate"
            >
              {{ createSubmitting ? "등록 중..." : "등록" }}
            </ArgonButton>
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
              <ArgonInput
                :model-value="formatOrganNo(editForm.organ_no)"
                type="text"
                size="sm"
                readonly
                class="bg-light"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">기관명 <span class="text-danger">*</span></label>
              <ArgonInput
                v-model="editForm.organ_name"
                type="text"
                size="sm"
                placeholder="기관명 입력"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">주소 <span class="text-danger">*</span></label>
              <div class="d-flex gap-2 mb-2">
                <ArgonInput
                  v-model="editZipCode"
                  type="text"
                  size="sm"
                  placeholder="우편번호"
                  readonly
                />
                <ArgonButton
                  type="button"
                  size="sm"
                  variant="outline"
                  color="primary"
                  @click="openPostcodeForEdit"
                >
                  주소 검색
                </ArgonButton>
              </div>
              <ArgonInput
                v-model="editBaseAddress"
                type="text"
                size="sm"
                class="mb-2"
                placeholder="기본 주소"
                readonly
              />
              <ArgonInput
                v-model="editDetailAddress"
                type="text"
                size="sm"
                placeholder="상세 주소를 입력해주세요"
                @update:model-value="
                  editForm.organ_address = makeFullAddress(
                    editZipCode,
                    editBaseAddress,
                    editDetailAddress,
                  )
                "
              />
            </div>
            <div class="mb-3">
              <label class="form-label">연락처</label>
              <ArgonInput
                v-model="editForm.organ_tel"
                type="text"
                size="sm"
                placeholder="하이픈 제외 11자"
                maxlength="11"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">이메일</label>
              <ArgonInput
                v-model="editForm.organ_mail"
                type="text"
                size="sm"
                placeholder="이메일"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">시작일 <span class="text-danger">*</span></label>
              <ArgonInput
                v-model="editForm.start_time"
                type="date"
                size="sm"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">종료일</label>
              <ArgonInput
                v-model="editForm.end_time"
                type="date"
                size="sm"
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
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              :disabled="editSubmitting"
              @click="closeEditModal"
            >
              취소
            </ArgonButton>
            <ArgonButton
              type="button"
              size="sm"
              color="primary"
              :disabled="editSubmitting"
              @click="submitEdit"
            >
              {{ editSubmitting ? "저장 중..." : "저장" }}
            </ArgonButton>
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
