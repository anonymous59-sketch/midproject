<!-- 임시저장 불러오기 목록 모달 (review 상담내역·지원계획·지원결과 등 공통) -->
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
          <h6 class="modal-title">임시저장 불러오기</h6>
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
            저장된 임시저장이 없습니다.
          </p>
          <ul v-else class="list-group list-group-flush">
            <li
              v-for="item in list"
              :key="item.tmp_code"
              class="list-group-item list-group-item-action py-2 cursor-pointer"
              @click="$emit('select', item)"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div class="text-sm">
                  <span class="fw-semibold">{{ item.save_title || "(제목 없음)" }}</span>
                  <span class="text-muted ms-2 small">{{ formatTime(item.save_time) }}</span>
                </div>
              </div>
              <div v-if="contentPreview(item.save_content)" class="text-muted small mt-1">
                {{ contentPreview(item.save_content) }}
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

defineEmits(["update:modelValue", "select"]);

function formatTime(val) {
  if (!val) return "";
  const d = new Date(val);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function contentPreview(text, max = 50) {
  if (!text || typeof text !== "string") return "";
  try {
    const str = text.length > 200 ? text.slice(0, 200) + "..." : text;
    return str.length <= max ? str : str.slice(0, max) + "...";
  } catch {
    return "";
  }
}
</script>
