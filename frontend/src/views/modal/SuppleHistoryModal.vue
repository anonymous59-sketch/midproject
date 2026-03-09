<script setup>
/**
 * SuppleHistoryModal.vue
 * 보완이력 모달. variant: rank(등급/신청사유/보완사유) | plan(목표/내용/보완사유) | result(제목/내용/보완사유)
 * 페이징: 페이지당 10건, 번호는 전체 건수 기준 내림차순
 */
import { ref, computed, watch } from "vue";
import TablePagination from "@/views/components/TablePagination.vue";
import ArgonButton from "@/components/ArgonButton.vue";

const props = defineProps({
  show:    { type: Boolean, default: false },
  list:    { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
  variant: { type: String,  default: "rank" }, // 'rank' | 'plan' | 'result'
});

const emit = defineEmits(["close"]);

/** 행 식별 키 (req_code | plan_code | result_code) */
const rowKey = computed(() => {
  if (props.variant === "plan") return "plan_code";
  if (props.variant === "result") return "result_code";
  return "req_code";
});

/** 현재 확장된 행의 키 집합 */
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

watch(() => props.list.length, () => { page.value = 1; });
watch(() => props.show, (visible) => { if (!visible) page.value = 1; });

function toggleRow(key) {
  const s = new Set(expandedSet.value);
  if (s.has(key)) s.delete(key);
  else s.add(key);
  expandedSet.value = s;
}

function getItemKey(item) {
  return item[rowKey.value] ?? item.req_code ?? item.plan_code ?? item.result_code ?? "";
}
</script>

<template>
  <Teleport to="body">
    <Transition name="shm-fade">
      <div v-if="show" class="shm-backdrop" @click.self="emit('close')">
        <div class="shm-dialog">
          <div class="shm-header">
            <span class="shm-title">보완이력</span>
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              class="text-white border-light"
              @click="emit('close')"
            >
              닫기
            </ArgonButton>
          </div>

          <div class="shm-body">
            <p v-if="loading" class="shm-empty">로딩 중...</p>
            <p v-else-if="list.length === 0" class="shm-empty">보완이력이 없습니다.</p>

            <!-- rank: 등급 / 신청 사유 / 보완 사유 -->
            <table v-else-if="variant === 'rank'" class="shm-table">
              <thead>
                <tr>
                  <th class="shm-th shm-th-no">번호</th>
                  <th class="shm-th shm-th-rank">등급</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, idx) in pagedList" :key="getItemKey(item)">
                  <tr
                    class="shm-row shm-row-main"
                    :class="{ 'shm-row-expanded': expandedSet.has(getItemKey(item)) }"
                    @click="toggleRow(getItemKey(item))"
                  >
                    <td class="shm-td shm-td-no">{{ rowDisplayNo(idx) }}</td>
                    <td class="shm-td shm-td-rank">{{ item.rank_name || '-' }}</td>
                  </tr>
                  <tr v-if="expandedSet.has(getItemKey(item))" class="shm-row shm-row-detail">
                    <td colspan="2" class="shm-td-detail p-0">
                      <table class="shm-inner-table w-100">
                        <tr class="shm-inner-row"><td class="shm-inner-field">등급</td><td class="shm-inner-value">{{ item.rank_name || '-' }}</td></tr>
                        <tr class="shm-inner-row"><td class="shm-inner-field">신청 사유</td><td class="shm-inner-value">{{ item.apply_for || '-' }}</td></tr>
                        <tr class="shm-inner-row"><td class="shm-inner-field">보완 사유</td><td class="shm-inner-value shm-inner-value-supple">{{ item.rank_cmt || '-' }}</td></tr>
                      </table>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>

            <!-- plan: 목표 / 내용 / 보완 사유 -->
            <table v-else-if="variant === 'plan'" class="shm-table">
              <thead>
                <tr>
                  <th class="shm-th shm-th-no">번호</th>
                  <th class="shm-th shm-th-rank">목표</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, idx) in pagedList" :key="getItemKey(item)">
                  <tr
                    class="shm-row shm-row-main"
                    :class="{ 'shm-row-expanded': expandedSet.has(getItemKey(item)) }"
                    @click="toggleRow(getItemKey(item))"
                  >
                    <td class="shm-td shm-td-no">{{ rowDisplayNo(idx) }}</td>
                    <td class="shm-td shm-td-rank">{{ item.plan_goal || '-' }}</td>
                  </tr>
                  <tr v-if="expandedSet.has(getItemKey(item))" class="shm-row shm-row-detail">
                    <td colspan="2" class="shm-td-detail p-0">
                      <table class="shm-inner-table w-100">
                        <tr class="shm-inner-row"><td class="shm-inner-field">목표</td><td class="shm-inner-value">{{ item.plan_goal || '-' }}</td></tr>
                        <tr class="shm-inner-row"><td class="shm-inner-field">내용</td><td class="shm-inner-value">{{ item.plan_content || '-' }}</td></tr>
                        <tr class="shm-inner-row"><td class="shm-inner-field">보완 사유</td><td class="shm-inner-value shm-inner-value-supple">{{ item.plan_cmt || '-' }}</td></tr>
                      </table>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>

            <!-- result: 제목 / 내용 / 보완 사유 -->
            <table v-else class="shm-table">
              <thead>
                <tr>
                  <th class="shm-th shm-th-no">번호</th>
                  <th class="shm-th shm-th-rank">제목</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, idx) in pagedList" :key="getItemKey(item)">
                  <tr
                    class="shm-row shm-row-main"
                    :class="{ 'shm-row-expanded': expandedSet.has(getItemKey(item)) }"
                    @click="toggleRow(getItemKey(item))"
                  >
                    <td class="shm-td shm-td-no">{{ rowDisplayNo(idx) }}</td>
                    <td class="shm-td shm-td-rank">{{ item.result_title || '-' }}</td>
                  </tr>
                  <tr v-if="expandedSet.has(getItemKey(item))" class="shm-row shm-row-detail">
                    <td colspan="2" class="shm-td-detail p-0">
                      <table class="shm-inner-table w-100">
                        <tr class="shm-inner-row"><td class="shm-inner-field">제목</td><td class="shm-inner-value">{{ item.result_title || '-' }}</td></tr>
                        <tr class="shm-inner-row"><td class="shm-inner-field">내용</td><td class="shm-inner-value">{{ item.result_content || '-' }}</td></tr>
                        <tr class="shm-inner-row"><td class="shm-inner-field">보완 사유</td><td class="shm-inner-value shm-inner-value-supple">{{ item.result_cmt || '-' }}</td></tr>
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
              class="shm-pagination mt-2"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── 배경/다이얼로그 ─────────────────────────────── */
.shm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1060;
}
.shm-dialog {
  background: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.2);
  width: min(92vw, 560px);
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 헤더 ────────────────────────────────────────── */
.shm-header {
  background: #6f42c1;
  color: #fff;
  padding: 0.65rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.shm-title {
  font-weight: 600;
  font-size: 0.95rem;
}

/* ── 바디 ────────────────────────────────────────── */
.shm-body {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
.shm-empty {
  text-align: center;
  color: #6c757d;
  font-size: 0.875rem;
  padding: 2rem 1rem;
  margin: 0;
}

/* ── 요약 테이블 ─────────────────────────────────── */
.shm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.shm-th {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1;
}
.shm-th-no   { width: 20%; }
.shm-th-rank { width: 80%; }

.shm-row-main {
  cursor: pointer;
  transition: background 0.12s;
}
.shm-row-main:hover,
.shm-row-main.shm-row-expanded {
  background: #e9ecef;
}
.shm-td {
  border: 1px solid #dee2e6;
  padding: 0.45rem 0.75rem;
  text-align: center;
  vertical-align: middle;
}
.shm-td-no   { font-weight: 600; color: #495057; }
.shm-td-rank { text-align: center; }

/* ── 상세 확장 내부 테이블 ───────────────────────── */
.shm-td-detail {
  border: 1px solid #dee2e6;
  background: #f8f9fa;
}
.shm-inner-table {
  border-collapse: collapse;
  font-size: 0.825rem;
}
.shm-inner-row {
  border-bottom: 1px solid #e9ecef;
}
.shm-inner-field {
  width: 28%;
  padding: 0.45rem 0.75rem;
  font-weight: 600;
  color: #495057;
  border-right: 1px solid #dee2e6;
  background: #fff;
  vertical-align: top;
  white-space: nowrap;
}
.shm-inner-value {
  width: 72%;
  padding: 0.45rem 0.75rem;
  vertical-align: top;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
}
.shm-inner-value-supple {
  color: #6f42c1;
}

/* ── 트랜지션 ────────────────────────────────────── */
.shm-fade-enter-active,
.shm-fade-leave-active {
  transition: opacity 0.18s ease;
}
.shm-fade-enter-from,
.shm-fade-leave-to {
  opacity: 0;
}
</style>
