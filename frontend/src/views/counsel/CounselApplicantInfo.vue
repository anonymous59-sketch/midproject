<!-- 지원대상자 정보 카드 -->
<script setup>
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";

function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function genderLabel(code) {
  const m = { b0_00: "남자", b0_10: "여자" };
  return m[code] ?? code ?? "";
}

defineProps({
  support: { type: Object, default: null },
  dsblPrs: { type: Object, default: null },
  dsblLoading: { type: Boolean, default: false },
  dsblError: { type: String, default: null },
  showRightPanel: { type: Boolean, default: false },
  /** 지원자(a0_20)면 상담내역 보기 버튼 숨김 */
  isApplicant: { type: Boolean, default: false },
});

const emit = defineEmits(["toggle-panel"]);
</script>

<template>
  <div class="card shadow-sm mb-3">
    <div
      class="card-header py-2 d-flex align-items-center justify-content-between"
    >
      <h6 class="mb-0">지원대상자 정보</h6>
      <ArgonButton
        v-if="!isApplicant"
        type="button"
        size="sm"
        :variant="showRightPanel ? 'outline' : 'fill'"
        :color="showRightPanel ? 'secondary' : 'success'"
        @click="emit('toggle-panel')"
      >
        {{ showRightPanel ? "상담내역 닫기" : "상담내역 보기" }}
      </ArgonButton>
    </div>
    <div class="card-body pt-2">
      <p v-if="dsblLoading" class="text-muted text-sm mb-0">로딩 중...</p>
      <p v-else-if="dsblError" class="text-danger text-sm mb-0">
        {{ dsblError }}
      </p>
      <template v-else>
        <div class="mb-3">
          <label class="form-label text-sm mb-1">성명</label>
          <ArgonInput
            type="text"
            size="sm"
            class="bg-light"
            :model-value="dsblPrs?.mc_nm ?? ''"
            readonly
          />
        </div>
        <template v-if="dsblPrs">
          <ul class="list-unstyled text-sm mb-0">
            <li class="d-flex mb-1">
              <span class="text-muted me-2" style="min-width: 100px">생년월일</span>
              <span>{{ formatDate(dsblPrs.mc_bd) }}</span>
            </li>
            <li class="d-flex mb-1">
              <span class="text-muted me-2" style="min-width: 100px">성별</span>
              <span>{{ genderLabel(dsblPrs.mc_gender) }}</span>
            </li>
            <li class="d-flex mb-1">
              <span class="text-muted me-2" style="min-width: 100px">주소</span>
              <span>{{ dsblPrs.mc_address }}</span>
            </li>
            <li class="d-flex mb-1">
              <span class="text-muted me-2" style="min-width: 100px">유형</span>
              <span>{{ dsblPrs.mc_type }}</span>
            </li>
            <li class="d-flex mb-1">
              <span class="text-muted me-2" style="min-width: 100px">등록일</span>
              <span>{{ formatDate(dsblPrs.mc_submitdate) }}</span>
            </li>
          </ul>
        </template>
        <p v-else class="text-muted text-sm mb-0">지원 정보가 없습니다.</p>
      </template>
    </div>
  </div>
</template>
