<script setup>
/**
 * HistoryModal.vue
 * 수정이력을 테이블 형태로 표시하는 모달
 * - 행 클릭 시 수정 전/후 내용을 토글 방식으로 표시
 * - content / upd_content: JSON.stringify([{ field, value }, ...]) 형태로 저장된 값을 파싱
 * - 페이징: 페이지당 10건, 번호는 전체 건수 기준 내림차순
 */
import { ref, computed, watch } from "vue";
import TablePagination from "@/views/components/TablePagination.vue";

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: "수정이력" },
  list: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["close"]);

/** 현재 확장된 행의 history_no 집합 */
const expandedSet = ref(new Set());

const page = ref(1);
const pageSize = 10;
const totalRows = computed(() => props.list.length);
const pagedList = computed(() => {
  const start = (page.value - 1) * pageSize;
  return props.list.slice(start, start + pageSize);
});
const rowDisplayNo = (indexInPage) =>
  totalRows.value - ((page.value - 1) * pageSize + indexInPage);

watch(
  () => props.list.length,
  () => {
    page.value = 1;
  },
);
watch(
  () => props.show,
  (visible) => {
    if (!visible) page.value = 1;
  },
);

function toggleRow(historyNo) {
  const s = new Set(expandedSet.value);
  if (s.has(historyNo)) s.delete(historyNo);
  else s.add(historyNo);
  expandedSet.value = s;
}

/** content / upd_content 문자열을 [{field, value}] 배열로 파싱 */
function parseFields(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    // 문자열이면 단일 항목으로 처리
    return [{ field: "내용", value: String(parsed) }];
  } catch {
    return [{ field: "내용", value: String(raw) }];
  }
}

/** 날짜 포맷: YYYY.MM.DD HH:mm:ss */
function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="hm-fade">
      <div v-if="show" class="hm-backdrop" @click.self="emit('close')">
        <div class="hm-dialog">
          <!-- 헤더 -->
          <div class="hm-header">
            <span class="hm-title">{{ title }}</span>
            <button
              type="button"
              class="btn-close btn-sm"
              @click="emit('close')"
            />
          </div>

          <!-- 바디 -->
          <div class="hm-body">
            <p v-if="loading" class="hm-empty">로딩 중...</p>
            <p v-else-if="list.length === 0" class="hm-empty">
              수정이력이 없습니다.
            </p>

            <table v-else class="hm-table">
              <thead>
                <tr>
                  <th class="hm-th hm-th-no">번호</th>
                  <th class="hm-th hm-th-name">수정자</th>
                  <th class="hm-th hm-th-date">수정일시</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(h, idx) in pagedList" :key="h.history_no">
                  <!-- 요약 행 (클릭 → 토글) -->
                  <tr
                    class="hm-row hm-row-main"
                    :class="{
                      'hm-row-expanded': expandedSet.has(h.history_no),
                    }"
                    @click="toggleRow(h.history_no)"
                  >
                    <td class="hm-td hm-td-no">{{ rowDisplayNo(idx) }}</td>
                    <td class="hm-td hm-td-name">
                      {{ h.m_nm || h.upd_member }}
                    </td>
                    <td class="hm-td hm-td-date">
                      {{ formatDate(h.upd_date) }}
                    </td>
                  </tr>

                  <!-- 확장 행: 수정 전/후 내용 -->
                  <tr
                    v-if="expandedSet.has(h.history_no)"
                    class="hm-row hm-row-detail"
                  >
                    <td colspan="3" class="hm-td-detail p-0">
                      <table class="hm-inner-table w-100">
                        <!-- 수정전 헤더 -->
                        <tr class="hm-inner-before-header">
                          <td colspan="3" class="hm-inner-section-label">
                            수정 전 내용
                          </td>
                        </tr>
                        <template
                          v-for="(f, fi) in parseFields(h.content)"
                          :key="'before-' + fi"
                        >
                          <tr class="hm-inner-row">
                            <td class="hm-inner-field">{{ f.field }}</td>
                            <td
                              colspan="2"
                              class="hm-inner-value hm-inner-value-before"
                            >
                              {{ f.value }}
                            </td>
                          </tr>
                        </template>
                        <tr
                          v-if="parseFields(h.content).length === 0"
                          class="hm-inner-row"
                        >
                          <td colspan="3" class="hm-inner-empty">기록 없음</td>
                        </tr>

                        <!-- 수정후 헤더 -->
                        <tr class="hm-inner-after-header">
                          <td colspan="3" class="hm-inner-section-label">
                            수정 후 내용
                          </td>
                        </tr>
                        <template
                          v-for="(f, fi) in parseFields(h.upd_content)"
                          :key="'after-' + fi"
                        >
                          <tr class="hm-inner-row">
                            <td class="hm-inner-field">{{ f.field }}</td>
                            <td
                              colspan="2"
                              class="hm-inner-value hm-inner-value-after"
                            >
                              {{ f.value }}
                            </td>
                          </tr>
                        </template>
                        <tr
                          v-if="parseFields(h.upd_content).length === 0"
                          class="hm-inner-row"
                        >
                          <td colspan="3" class="hm-inner-empty">기록 없음</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
            <TablePagination
              v-if="totalRows > pageSize"
              v-model:page="page"
              :total="totalRows"
              :page-size="pageSize"
              class="hm-pagination mt-2"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── 배경/다이얼로그 ─────────────────────────────── */
.hm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1060;
}
.hm-dialog {
  background: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.2);
  width: min(92vw, 640px);
  max-height: 78vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 헤더 ────────────────────────────────────────── */
.hm-header {
  background: #495057;
  color: #fff;
  padding: 0.65rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.hm-title {
  font-weight: 600;
  font-size: 0.95rem;
}

/* ── 바디 ────────────────────────────────────────── */
.hm-body {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
.hm-empty {
  text-align: center;
  color: #6c757d;
  font-size: 0.875rem;
  padding: 2rem 1rem;
  margin: 0;
}

/* ── 요약 테이블 ─────────────────────────────────── */
.hm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.hm-th {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1;
}
.hm-th-no {
  width: 15%;
}
.hm-th-name {
  width: 30%;
}
.hm-th-date {
  width: 55%;
}

.hm-row-main {
  cursor: pointer;
  transition: background 0.12s;
}
.hm-row-main:hover,
.hm-row-main.hm-row-expanded {
  background: #e9ecef;
}
.hm-td {
  border: 1px solid #dee2e6;
  padding: 0.45rem 0.75rem;
  text-align: center;
  vertical-align: middle;
}
.hm-td-no {
  text-align: center;
  font-weight: 600;
  color: #495057;
}
.hm-td-name {
  text-align: center;
}
.hm-td-date {
  text-align: center;
  color: #495057;
  font-size: 0.82rem;
}

/* ── 상세 확장 내부 테이블 ───────────────────────── */
.hm-td-detail {
  border: 1px solid #dee2e6;
  background: #f8f9fa;
}
.hm-inner-table {
  border-collapse: collapse;
  font-size: 0.825rem;
}
.hm-inner-section-label {
  font-weight: 700;
  text-align: center;
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}
.hm-inner-before-header .hm-inner-section-label {
  background: #cfe2ff;
  color: #084298;
  border-top: 1px solid #b6d4fe;
  border-bottom: 1px solid #b6d4fe;
}
.hm-inner-after-header .hm-inner-section-label {
  background: #d1e7dd;
  color: #0a3622;
  border-top: 1px solid #a3cfbb;
  border-bottom: 1px solid #a3cfbb;
}
.hm-inner-row {
  border-bottom: 1px solid #e9ecef;
}
.hm-inner-field {
  width: 22%;
  padding: 0.35rem 0.75rem;
  font-weight: 600;
  color: #495057;
  border-right: 1px solid #dee2e6;
  background: #fff;
  vertical-align: top;
  white-space: nowrap;
}
.hm-inner-value {
  width: 78%;
  padding: 0.35rem 0.75rem;
  vertical-align: top;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
}
.hm-inner-value-before {
  color: #084298;
}
.hm-inner-value-after {
  color: #0a3622;
}
.hm-inner-empty {
  text-align: center;
  color: #adb5bd;
  padding: 0.4rem;
  font-size: 0.8rem;
}

/* ── 트랜지션 ────────────────────────────────────── */
.hm-fade-enter-active,
.hm-fade-leave-active {
  transition: opacity 0.18s ease;
}
.hm-fade-enter-from,
.hm-fade-leave-to {
  opacity: 0;
}
</style>
