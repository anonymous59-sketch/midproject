<script setup>
import { ref, onBeforeMount } from "vue";
import { useRouter } from "vue-router";
import SearchNavbar from "@/views/components/SearchNavbar.vue";
import SurveyTable from "./systemmanager_surveyComp/SurveyTable.vue";
import axios from "axios";
import ArgonButton from "@/components/ArgonButton.vue";
import ArgonInput from "@/components/ArgonInput.vue";

const router = useRouter(); // 라우터에 정보를 입력해서 그 라우터로 이동하겠다는 의미

const searchName = ref("");
const surveys = ref([]);
const error = ref(null);

// 전체 조회 또는 검색
const fetchSurveys = async () => {
  try {
    const res = await axios.get("/api/survey", {
      params: { sv_name: searchName.value.trim() },
    });
    surveys.value = res.data;
    error.value = null;
  } catch (err) {
    console.error(err);
    error.value = "데이터를 불러오는데 실패했습니다.";
  }
};

const goCreateSurvey = () => {
  router.push({
    name: "SystemManagerSurveyForm",
    query: { mode: "create" },
  });
};

const handleEdit = (data) => {
  router.push({
    name: "SystemManagerSurveyForm",
    query: {
      mode: "edit",
      sver_code: data.sver_code,
      sv_name: data.sv_name,
      writer_name: data.writer_name,
      sver_ondate: data.sver_ondate,
      sver_enddate: data.sver_enddate,
    },
  });
};

// 검색: 버튼 클릭 또는 엔터 시에만 조회
const onSearch = () => {
  fetchSurveys();
};
// 검색 초기화
const onReset = () => {
  searchName.value = "";
  fetchSurveys();
};

// 페이지 로딩 시 전체 조회
onBeforeMount(() => {
  fetchSurveys();
});
</script>

<template>
  <div class="container-fluid py-4 survey-page">
    <div class="row">
      <!-- 좌측: 조사지 검색 (다른 탭과 동일한 SearchNavbar 사용) -->
      <SearchNavbar title="조사지 검색" @search="onSearch" @reset="onReset">
        <label class="form-label text-sm">조사지명</label>
        <ArgonInput
          v-model="searchName"
          type="text"
          size="sm"
          placeholder="검색할 조사지 이름을 입력해주세요"
          @keyup.enter="onSearch"
        />
      </SearchNavbar>

      <!-- 우측: 조사지 목록 (MainTable과 동일한 카드 구조) -->
      <div class="col-12 col-lg-9">
        <div class="card">
          <div
            class="card-header pb-0 d-flex align-items-center justify-content-between"
          >
            <div>
              <h6 class="mb-0">조사지 목록</h6>
            </div>
            <ArgonButton size="sm" color="primary" type="button" @click="goCreateSurvey">
              조사지 등록
            </ArgonButton>
          </div>
          <div class="card-body pt-3">
            <SurveyTable :surveys="surveys" :error="error" @edit="handleEdit" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
