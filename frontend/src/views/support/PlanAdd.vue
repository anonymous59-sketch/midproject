<!-- 지원계획 추가 폼 컴포넌트 -->
<script setup>
import { ref, reactive } from "vue";
import { useTempStorage } from "@/composables/useTempStorage";
import TempStorageModal from "@/components/TempStorageModal.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";

const props = defineProps({
  supCode: { type: String, default: "" },
  show: { type: Boolean, default: true },
  /** 지원자(a0_20) 등 읽기 전용: 계획추가 버튼/폼 비노출 */
  readOnly: { type: Boolean, default: false },
});

const emit = defineEmits(["approval-request", "cancel", "alert", "toggle"]);

const form = reactive({
  title: "",
  content: "",
  startDate: "",
  endDate: "",
});
const files = ref([]);
const fileInput = ref(null);

function onFileChange(e) {
  const selected = Array.from(e.target.files || []);
  const oversized = selected.filter((f) => f.size > 10 * 1024 * 1024);
  if (oversized.length > 0) {
    emit("alert", {
      type: "error",
      title: "알림",
      message: `파일 용량이 10MB를 초과합니다:\n${oversized.map((f) => f.name).join("\n")}`,
    });
    if (fileInput.value) fileInput.value.value = "";
    return;
  }
  files.value = selected;
}

const {
  showModal: tempModalVisible,
  tempList,
  tempListLoading,
  saveTemp: doTempSave,
  openLoadModal,
  applyItem,
  deleteSelectedTemp,
} = useTempStorage(() => props.supCode, "j0_20", {
  getPayload: () => ({
    save_title: (form.title ?? "").trim(),
    save_content: JSON.stringify({
      content: form.content ?? "",
      startDate: form.startDate ?? "",
      endDate: form.endDate ?? "",
    }),
  }),
  setPayload: (item) => {
    if (!item) return;
    form.title = item.save_title ?? "";
    try {
      const o = JSON.parse(item.save_content || "{}");
      form.content = o.content ?? item.save_content ?? "";
      form.startDate = o.startDate ?? "";
      form.endDate = o.endDate ?? "";
    } catch {
      form.content = item.save_content ?? "";
    }
  },
  validate: (payload) => {
    if (!(payload.save_title && payload.save_title.trim())) {
      return { valid: false, message: "제목을 입력해주세요." };
    }
    return { valid: true };
  },
  onAlert: (type, title, message) => emit("alert", { type, title, message }),
});

function onApprovalRequest() {
  emit("approval-request", {
    title: form.title?.trim() ?? "",
    content: form.content?.trim() ?? "",
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    files: [...files.value],
  });
}

function onCancel() {
  emit("cancel");
}

function reset() {
  form.title = "";
  form.content = "";
  form.startDate = "";
  form.endDate = "";
  files.value = [];
  if (fileInput.value) fileInput.value.value = "";
}

defineExpose({ reset, deleteTempAfterInsert: deleteSelectedTemp });
</script>

<template>
  <div class="mb-3">
    <div class="counsel-section-header d-flex align-items-center justify-content-between mb-3">
      <h6 class="counsel-section-title text-sm text-uppercase text-muted mb-0">지원계획</h6>
      <ArgonButton
        v-if="!readOnly"
        type="button"
        size="sm"
        variant="outline"
        color="primary"
        @click="emit('toggle')"
      >
        계획추가
      </ArgonButton>
    </div>
    <div v-if="show && !readOnly" class="card shadow-sm border-radius-lg mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-end gap-2 mb-3">
          <ArgonButton type="button" size="sm" variant="outline" color="secondary" @click="openLoadModal">
            임시저장 불러오기
          </ArgonButton>
          <ArgonButton type="button" size="sm" color="secondary" @click="doTempSave">
            임시저장
          </ArgonButton>
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">제목</label>
          <ArgonInput v-model="form.title" type="text" size="sm" placeholder="지원 계획 제목" />
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">내용</label>
          <textarea
            v-model="form.content"
            class="form-control form-control-sm"
            placeholder="계획"
            rows="3"
          ></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">지원기간</label>
          <div class="d-flex align-items-center flex-wrap gap-2">
            <ArgonInput v-model="form.startDate" type="date" size="sm" style="max-width: 11rem" />
            <span class="text-body">~</span>
            <ArgonInput v-model="form.endDate" type="date" size="sm" style="max-width: 11rem" />
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">첨부파일</label>
          <input
            ref="fileInput"
            type="file"
            class="form-control form-control-sm"
            multiple
            @change="onFileChange"
          />
          <small class="text-muted">파일 1개당 10MB를 초과할 수 없습니다.</small>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <ArgonButton type="button" size="sm" variant="outline" color="primary" @click="onApprovalRequest">
            승인요청
          </ArgonButton>
          <ArgonButton type="button" size="sm" variant="outline" color="secondary" @click="onCancel">
            취소
          </ArgonButton>
        </div>
      </div>
    </div>
  </div>
  <TempStorageModal
    v-model="tempModalVisible"
    :list="tempList"
    :loading="tempListLoading"
    @select="applyItem"
  />
</template>

<style scoped>
textarea {
  resize: none;
}
</style>
