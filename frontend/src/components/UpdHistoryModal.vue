<!-- 수정이력 목록 모달 (review 지원신청서·상담·지원계획·지원결과 등 공통) -->
<template>
  <div
    v-if="modelValue"
    class="modal d-block"
    tabindex="-1"
    style="background: rgba(0,0,0,0.5)"
    @click.self="$emit('update:modelValue', false)"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header py-2">
          <h6 class="modal-title">수정이력</h6>
          <button
            type="button"
            class="btn-close btn-sm"
            aria-label="닫기"
            @click="$emit('update:modelValue', false)"
          />
        </div>
        <div class="modal-body py-2">
          <p v-if="loading" class="text-muted text-sm mb-0">로딩 중...</p>
          <p
            v-else-if="!loading && list.length === 0"
            class="text-muted text-sm mb-0"
          >
            수정이력이 없습니다.
          </p>
          <ul v-else class="list-group list-group-flush">
            <li
              v-for="item in list"
              :key="item.history_no"
              class="list-group-item py-2"
            >
              <div class="d-flex justify-content-between align-items-start flex-wrap gap-1">
                <span class="text-muted small">{{ formatDate(item.upd_date) }}</span>
                <span class="small">
                  <span class="fw-semibold">{{ item.m_nm ?? "-" }}</span>
                  <span class="text-muted ms-1">({{ authLabel(item.m_auth) }})</span>
                </span>
              </div>
              <div v-if="item.content || item.upd_content" class="mt-2 small">
                <div v-if="item.content" class="text-muted">
                  <span class="text-uppercase text-muted" style="font-size: 0.7rem">이전</span>
                  <div class="text-break">{{ contentPreview(item.content) }}</div>
                </div>
                <div v-if="item.upd_content" class="mt-1">
                  <span class="text-uppercase text-muted" style="font-size: 0.7rem">변경 후</span>
                  <div class="text-break">{{ contentPreview(item.upd_content) }}</div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  list: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

defineEmits(["update:modelValue"]);

function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function authLabel(code) {
  if (!code) return "-";
  const map = { a0_10: "관리자", a0_20: "기관", a0_30: "담당자", a0_40: "승인자" };
  return map[code] ?? code;
}

function contentPreview(text, max = 80) {
  if (!text || typeof text !== "string") return "";
  const str = text.length > max ? text.slice(0, max) + "..." : text;
  return str;
}
</script>
