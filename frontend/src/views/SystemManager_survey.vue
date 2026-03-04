<script setup>
import { ref, onBeforeMount } from "vue";
import { useRouter } from "vue-router";
import SurveyTable from "./systemmanager_surveyComp/SurveyTable.vue";
import axios from "axios";

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

// 페이지 로딩 시 전체 조회
onBeforeMount(() => {
  fetchSurveys();
});
</script>

<template>
  <div class="container-fluid py-4 survey-page">
    <!-- 상단 버튼 영역 -->
    <div class="top-bar d-flex justify-content-between align-items-center mb-3">
      <button class="btn btn-primary" @click="goCreateSurvey">✏️ 조사지 등록</button>

      <div class="search-box d-flex align-items-center gap-2">
        <i class="fas fa-search"></i>
        <input
          v-model="searchName"
          placeholder="검색할 조사지 이름을 입력해주세요"
          @keyup.enter="onSearch"
        />
        <button type="button" class="btn btn-sm btn-primary" @click="onSearch">
          검색
        </button>
      </div>
    </div>

    <!-- 테이블 영역 -->
    <div class="card-box">
      <SurveyTable
        :surveys="surveys"
        :error="error"
        @edit="handleEdit"
      />
    </div>
  </div>
</template>

<style scoped>
.search-box input {
  padding: 6px 10px 6px 4px;
  border: 1px solid #cfcfcf;
  border-radius: 2px;

  width: 300px;       
  min-width: 200px;   
  max-width: 100%;    
  box-sizing: border-box; 
} 
</style>