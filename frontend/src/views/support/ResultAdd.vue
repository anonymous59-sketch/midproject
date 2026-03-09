<!-- 지원결과 추가 폼 컴포넌트 -->
<script setup>
import { ref, reactive, computed } from "vue";
import { useTempStorage } from "@/composables/useTempStorage";
import TempStorageModal from "@/components/TempStorageModal.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";

const props = defineProps({
  supCode: { type: String, default: "" },
  show: { type: Boolean, default: true },
  /** 지원자(a0_20) 등 읽기 전용: 결과추가 버튼/폼 비노출 */
  readOnly: { type: Boolean, default: false },
});

const emit = defineEmits(["approval-request", "cancel", "alert", "toggle"]);

const form = reactive({ title: "", content: "" });
const files = ref([]);
const fileInput = ref(null);

const fileNames = computed(() =>
  files.value.length ? files.value.map((f) => f.name).join(", ") : "",
);

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

function openFileDialog() {
  if (fileInput.value) fileInput.value.click();
}

const {
  showModal: tempModalVisible,
  tempList,
  tempListLoading,
  saveTemp: doTempSave,
  openLoadModal,
  applyItem,
  deleteSelectedTemp,
} = useTempStorage(
  () => props.supCode,
  "j0_30",
  {
    getPayload: () => ({
      save_title: (form.title ?? "").trim(),
      save_content: JSON.stringify({ content: form.content ?? "" }),
    }),
    setPayload: (item) => {
      if (!item) return;
      form.title = item.save_title ?? "";
      try {
        const o = JSON.parse(item.save_content || "{}");
        form.content = o.content ?? item.save_content ?? "";
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
  },
);

function onApprovalRequest() {
  emit("approval-request", {
    title: form.title?.trim() ?? "",
    content: form.content?.trim() ?? "",
    files: [...files.value],
  });
}

function onCancel() {
  emit("cancel");
}

function reset() {
  form.title = "";
  form.content = "";
  files.value = [];
  if (fileInput.value) fileInput.value.value = "";
}

defineExpose({ reset, deleteTempAfterInsert: deleteSelectedTemp });
</script>

<template>
  <div class="mb-3">
    <div class="counsel-section-header d-flex align-items-center justify-content-between mb-3">
      <h6 class="counsel-section-title text-sm text-uppercase text-muted mb-0">지원결과</h6>
      <ArgonButton
        v-if="!readOnly"
        type="button"
        size="sm"
        variant="outline"
        color="primary"
        @click="emit('toggle')"
      >
        결과추가
      </ArgonButton>
    </div>
    <div v-if="show && !readOnly" class="card shadow-sm border-radius-lg mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-end gap-2 mb-3">
          <ArgonButton type="button" size="sm" variant="outline" color="secondary" @click="openLoadModal">임시저장 불러오기</ArgonButton>
          <ArgonButton type="button" size="sm" color="secondary" @click="doTempSave">임시저장</ArgonButton>
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">제목</label>
          <ArgonInput v-model="form.title" type="text" size="sm" placeholder="지원 결과 제목" />
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">내용</label>
          <textarea v-model="form.content" class="form-control form-control-sm" placeholder="결과" rows="3"></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label text-sm text-body mb-1">첨부파일</label>
          <input ref="fileInput" type="file" class="d-none" multiple @change="onFileChange" />
          <ArgonButton type="button" size="sm" variant="outline" color="secondary" class="text-start w-100 bg-white" @click="openFileDialog">
            <span v-if="fileNames">{{ fileNames }}</span>
            <span v-else class="text-muted">파일을 선택하세요. 10MB 초과 불가.</span>
          </ArgonButton>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <ArgonButton type="button" size="sm" variant="outline" color="primary" @click="onApprovalRequest">승인요청</ArgonButton>
          <ArgonButton type="button" size="sm" variant="outline" color="secondary" @click="onCancel">취소</ArgonButton>
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
