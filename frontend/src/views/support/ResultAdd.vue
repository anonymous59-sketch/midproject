<!-- 지원결과 추가 폼 컴포넌트 -->
<script setup>
import { ref, reactive, computed } from "vue";
import { useTempStorage } from "@/composables/useTempStorage";
import TempStorageModal from "@/components/TempStorageModal.vue";

const props = defineProps({
  supCode: { type: String, default: "" },
});

const emit = defineEmits(["approval-request", "cancel", "alert"]);

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
  <div class="card shadow-sm border-radius-lg mb-4">
    <div class="card-body">
      <div class="d-flex justify-content-end gap-2 mb-3">
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="openLoadModal">임시저장 불러오기</button>
        <button type="button" class="btn btn-sm btn-secondary" @click="doTempSave">임시저장</button>
      </div>
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">제목</label>
        <input v-model="form.title" type="text" class="form-control form-control-sm" placeholder="지원 결과 제목" />
      </div>
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">내용</label>
        <textarea v-model="form.content" class="form-control form-control-sm" placeholder="결과" rows="3"></textarea>
      </div>
      <div class="mb-3">
        <label class="form-label text-sm text-body mb-1">첨부파일</label>
        <input ref="fileInput" type="file" class="d-none" multiple @change="onFileChange" />
        <button type="button" class="form-control form-control-sm text-start bg-white" @click="openFileDialog">
          <span v-if="fileNames">{{ fileNames }}</span>
          <span v-else class="text-muted">파일을 선택하세요. 10MB 초과 불가.</span>
        </button>
      </div>
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-sm btn-outline-primary" @click="onApprovalRequest">승인요청</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="onCancel">취소</button>
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
