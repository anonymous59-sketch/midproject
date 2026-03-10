<!-- 상담내역 우측 패널 -->
<script setup>
import { reactive, watch } from "vue";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";

function formatCounselDate(val) {
  if (!val) return "";
  const d = new Date(val);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function contentPreview(text, max = 30) {
  if (!text) return "";
  return text.length <= max ? text : text.slice(0, max) + "...";
}

const props = defineProps({
  /** 지원자(a0_20) 등 읽기 전용 모드: 상담추가/등록 폼 비노출 */
  readOnly: { type: Boolean, default: false },
  counselList: { type: Array, default: () => [] },
  counselListLoading: { type: Boolean, default: false },
  counselListError: { type: String, default: null },
  writerList: { type: Array, default: () => [] },
  writerListLoading: { type: Boolean, default: false },
  showForm: { type: Boolean, default: false },
  counselForm: { type: Object, default: () => ({}) },
  counselFormSaving: { type: Boolean, default: false },
  tempSaveLoading: { type: Boolean, default: false },
  tempStorageListLoading: { type: Boolean, default: false },
  selectedCounselDetail: { type: Object, default: null },
});

const form = reactive({
  csl_title: "",
  counselDate: "",
  csl_content: "",
  csl_writer: "",
});

const emit = defineEmits([
  "update:counselForm",
  "open-add-form",
  "close-detail",
  "open-detail",
  "cancel-form",
  "save-counsel",
  "temp-save",
  "open-temp-load",
  "set-counsel-files",
]);

watch(
  () => props.counselForm,
  (val) => {
    if (val) {
      form.csl_title = val.csl_title ?? "";
      form.counselDate = val.counselDate ?? "";
      form.csl_content = val.csl_content ?? "";
      form.csl_writer = val.csl_writer ?? "";
    }
  },
  { immediate: true, deep: true }
);

watch(
  form,
  () => {
    emit("update:counselForm", { ...form });
  },
  { deep: true }
);
</script>

<template>
  <div class="card shadow-sm">
    <div
      class="card-header py-2 d-flex align-items-center justify-content-between"
    >
      <div class="d-flex align-items-center gap-2">
        <h6 class="mb-0 fw-bold">상담내역</h6>
        <ArgonButton
          v-if="!readOnly"
          type="button"
          size="sm"
          variant="outline"
          color="primary"
          class="d-inline-flex align-items-center gap-1"
          @click="emit('open-add-form')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>상담추가</span>
        </ArgonButton>
      </div>
    </div>
    <div class="card-body">
      <!-- 상담 상세보기 (readonly) -->
      <div
        v-if="selectedCounselDetail"
        class="border rounded p-3 mb-4 bg-light"
      >
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 class="text-sm text-uppercase text-muted mb-0">상담 상세</h6>
          <ArgonButton
            type="button"
            size="sm"
            variant="outline"
            color="secondary"
            @click="emit('close-detail')"
          >
            닫기
          </ArgonButton>
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">제목</label>
          <ArgonInput
            type="text"
            size="sm"
            class="bg-white"
            :model-value="selectedCounselDetail.csl_title"
            readonly
          />
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">상담일</label>
          <ArgonInput
            type="text"
            size="sm"
            class="bg-white"
            :model-value="formatCounselDate(selectedCounselDetail.csl_date)"
            readonly
          />
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">상담진행자</label>
          <ArgonInput
            type="text"
            size="sm"
            class="bg-white"
            :model-value="selectedCounselDetail.csl_writer_nm || selectedCounselDetail.csl_name || selectedCounselDetail.csl_writer"
            readonly
          />
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">내용</label>
          <textarea
            class="form-control form-control-sm bg-white"
            rows="4"
            readonly
            :value="selectedCounselDetail.csl_content"
          />
        </div>
      </div>

      <!-- 상담등록 폼 -->
      <div v-if="showForm && !readOnly" class="border rounded p-3 mb-4 bg-light">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 class="text-sm text-uppercase text-muted mb-0">상담등록</h6>
          <div class="d-flex gap-2">
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              :disabled="tempSaveLoading"
              @click="emit('temp-save')"
            >
              {{ tempSaveLoading ? "저장 중..." : "임시저장" }}
            </ArgonButton>
            <ArgonButton
              type="button"
              size="sm"
              variant="outline"
              color="primary"
              :disabled="tempStorageListLoading"
              @click="emit('open-temp-load')"
            >
              {{ tempStorageListLoading ? "로딩..." : "임시저장 불러오기" }}
            </ArgonButton>
          </div>
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">제목</label>
          <ArgonInput
            v-model="form.csl_title"
            type="text"
            size="sm"
            placeholder="제목을 입력해주세요"
          />
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">상담일</label>
          <ArgonInput
            v-model="form.counselDate"
            type="date"
            size="sm"
          />
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">상담진행자</label>
          <select
            v-model="form.csl_writer"
            class="form-select form-select-sm"
            :disabled="writerListLoading"
          >
            <option value="">선택하세요</option>
            <option
              v-for="w in writerList"
              :key="w.m_no"
              :value="w.m_no"
            >
              {{ w.m_nm }}
            </option>
          </select>
        </div>
        <div class="mb-2">
          <label class="form-label text-xs mb-0">내용</label>
          <textarea
            v-model="form.csl_content"
            class="form-control form-control-sm"
            rows="3"
            placeholder="내용을 입력해주세요"
          />
        </div>
        <div class="mb-3">
          <label class="form-label text-xs mb-0">첨부파일</label>
          <input
            type="file"
            class="form-control form-control-sm"
            multiple
            @change="emit('set-counsel-files', $event.target.files)"
          />
          <small class="text-muted"
            >첨부파일 저장은 추후 연동 예정입니다.</small
          >
        </div>
        <div class="d-flex justify-content-end gap-2">
          <ArgonButton
            type="button"
            size="sm"
            color="warning"
            :disabled="counselFormSaving"
            @click="emit('save-counsel', { ...form })"
          >
            {{ counselFormSaving ? "저장 중..." : "저장" }}
          </ArgonButton>
          <ArgonButton
            type="button"
            size="sm"
            variant="outline"
            color="secondary"
            :disabled="counselFormSaving"
            @click="emit('cancel-form')"
          >
            취소
          </ArgonButton>
        </div>
      </div>

      <!-- 상담내역 목록 -->
      <h6 class="text-sm text-uppercase text-muted mb-2">상담내역 목록</h6>
      <p v-if="counselListLoading" class="text-muted text-sm mb-0">
        로딩 중...
      </p>
      <p v-else-if="counselListError" class="text-danger text-sm mb-0">
        {{ counselListError }}
      </p>
      <div v-else class="list-group list-group-flush">
        <div
          v-for="item in counselList"
          :key="item.csl_code"
          class="list-group-item px-0 border-bottom d-flex align-items-center justify-content-between"
        >
          <div class="flex-grow-1 text-sm">
            <div class="d-flex flex-wrap gap-2 align-items-center mb-1">
              <span class="text-muted">{{
                formatCounselDate(item.csl_date)
              }}</span>
              <span
                v-if="item.csl_writer_nm || item.csl_name"
                class="text-muted"
              >{{
                item.csl_writer_nm || item.csl_name
              }}</span>
            </div>
            <div class="fw-semibold">{{ item.csl_title }}</div>
            <div class="text-muted small">
              {{ contentPreview(item.csl_content) }}
            </div>
          </div>
          <ArgonButton
            type="button"
            size="sm"
            variant="outline"
            color="secondary"
            class="flex-shrink-0"
            @click="emit('open-detail', item)"
          >
            상세보기
          </ArgonButton>
        </div>
        <div
          v-if="
            !counselListLoading &&
            !counselListError &&
            counselList.length === 0
          "
          class="list-group-item text-center text-muted py-4"
        >
          저장된 상담내역이 없습니다.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  resize: none;
}
</style>
