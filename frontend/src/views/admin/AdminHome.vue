<!-- src/views/admin/AdminHome.vue -->
<script setup>
import { computed, ref } from "vue";

// ✅ 체크박스 선택 상태(선택된 기관 no 목록)
const selectedNos = ref(new Set());

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

// ✅ 선택삭제(화면만: confirm + 삭제 후 선택 초기화)
const onDeleteSelected = () => {
  const ids = Array.from(selectedNos.value);

  if (ids.length === 0) {
    alert("삭제할 기관을 선택해주세요.");
    return;
  }

  const ok = confirm(`선택한 ${ids.length}개 기관을 삭제할까요?`);
  if (!ok) return;

  rows.value = rows.value.filter((r) => !selectedNos.value.has(r.no));
  selectedNos.value = new Set();
  alert("선택삭제 완료(더미).");
};

/**
 * [1] 좌측 검색 상태값 (기관명)
 */
const filters = ref({
  orgName: "",
});

/**
 * [2] 우측 테이블 더미 데이터 (나중에 API로 교체)
 * - PDF(1p) 구조처럼 목록/버튼/토글만 구성
 */
const rows = ref([
  {
    no: 10,
    orgName: "대구 남구 지원센터",
    address: "대구 남구 ○○로 12",
    tel: "053-123-4567",
    email: "namgu@example.com",
    createdAt: "2024.02.20",
    isActive: true,
  },
  {
    no: 9,
    orgName: "대구 달서 지원센터",
    address: "대구 달서구 △△로 34",
    tel: "053-222-3333",
    email: "dalseo@example.com",
    createdAt: "2024.02.18",
    isActive: false,
  },
  {
    no: 8,
    orgName: "대구 수성 지원센터",
    address: "대구 수성구 □□로 56",
    tel: "053-555-7777",
    email: "suseong@example.com",
    createdAt: "2024.02.10",
    isActive: true,
  },
]);

/**
 * [3] 검색/초기화 (지금은 화면 필터링 + alert)
 */
const onSearch = () => {
  alert(`검색(기관명): ${filters.value.orgName || "(전체)"}`);
};

const onReset = () => {
  filters.value.orgName = "";
};

/**
 * [4] 화면 필터링(computed)
 */
const filteredRows = computed(() => {
  const q = filters.value.orgName.trim();
  if (!q) return rows.value;

  return rows.value.filter((r) => r.orgName.includes(q));
});

/**
 * [5] 버튼 동작은 모두 alert 처리
 */
const onEdit = (row) => alert(`기관 정보 수정: ${row.orgName} (#${row.no})`);
const onToggleActive = (row) => {
  row.isActive = !row.isActive;
  alert(`사용여부 변경: ${row.orgName} -> ${row.isActive ? "ON" : "OFF"}`);
};
const onCreate = () => alert("기관 등록하기(화면/라우터는 추후)");
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

          <div class="card-body">
            <label class="form-label text-sm">기관명</label>
            <input
              v-model="filters.orgName"
              type="text"
              class="form-control form-control-sm"
              placeholder="예) 대구 남구"
            />

            <div class="mt-3 d-grid gap-2">
              <button class="btn btn-primary mb-0" @click="onSearch">
                검색
              </button>
              <button class="btn btn-outline-secondary mb-0" @click="onReset">
                초기화
              </button>
            </div>
          </div>
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
            <div class="table-responsive">
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
                    <th class="text-center text-xs">번호</th>
                    <th class="text-center text-xs">기관명</th>
                    <th class="text-center text-xs">주소</th>
                    <th class="text-center text-xs">연락처</th>
                    <th class="text-center text-xs">이메일</th>
                    <th class="text-center text-xs">등록일</th>
                    <th class="text-center text-xs">사용여부</th>

                    <th class="text-center text-xs">수정</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="row in filteredRows" :key="row.no">
                    <!-- ✅ 행 체크 -->
                    <td class="text-center">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :checked="selectedNos.has(row.no)"
                        @change="toggleOne(row.no)"
                      />
                    </td>
                    <td class="text-center text-sm">{{ row.no }}</td>
                    <td class="text-center text-sm">{{ row.orgName }}</td>
                    <td class="text-center text-sm">{{ row.address }}</td>
                    <td class="text-center text-sm">{{ row.tel }}</td>
                    <td class="text-center text-sm">{{ row.email }}</td>
                    <td class="text-center text-sm">{{ row.createdAt }}</td>

                    <td class="text-center">
                      <button
                        class="btn btn-sm mb-0"
                        :class="row.isActive ? 'btn-success' : 'btn-secondary'"
                        @click="onToggleActive(row)"
                      >
                        {{ row.isActive ? "ON" : "OFF" }}
                      </button>
                    </td>

                    <td class="text-center">
                      <button
                        class="btn btn-sm btn-warning mb-0"
                        @click="onEdit(row)"
                      >
                        수정
                      </button>
                    </td>
                  </tr>

                  <tr v-if="filteredRows.length === 0">
                    <td
                      colspan="11"
                      class="text-center text-sm text-muted py-4"
                    >
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 페이지네이션(형태만, 동작은 추후) -->
            <div class="d-flex justify-content-between align-items-center mt-3">
              <div class="text-sm text-muted">1 / 1</div>
              <div class="d-flex gap-2">
                <button
                  class="btn btn-sm btn-outline-secondary mb-0"
                  @click="alert('이전 페이지')"
                >
                  이전
                </button>
                <button
                  class="btn btn-sm btn-outline-secondary mb-0"
                  @click="alert('다음 페이지')"
                >
                  다음
                </button>
              </div>
            </div>

            <!-- 하단 등록하기(원하면 제거 가능) -->
            <div class="d-flex justify-content-end mt-3">
              <button class="btn btn-sm btn-primary mb-0" @click="onCreate">
                기관 등록하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
