<script setup>
import { ref, onBeforeMount, watch } from "vue";
import { useRouter } from "vue-router";
import SurveyTable from "./systemmanager_surveyComp/SurveyTable.vue";
import axios from "axios";

const router = useRouter();

const searchName = ref("");
const surveys = ref([]);
const loading = ref(false);
const error = ref(null);

// 전체 조회 또는 검색
const fetchSurveys = async () => {
  try {
    loading.value = true;
    const res = await axios.get("/api/survey", {
      params: { sv_name: searchName.value },
    });
    surveys.value = res.data;
    error.value = null;
  } catch (err) {
    console.error(err);
    error.value = "데이터를 불러오는데 실패했습니다.";
  } finally {
    loading.value = false;
  }
};

const goCreateSurvey = () => {
  router.push({
    name: "SystemManagerSurveyForm",
    query: { mode: "create" },
  });
};

const handleEdit = (item) => {
  router.push({
    name: "SystemManagerSurveyForm",
    query: {
      mode: "edit",
      sver_code: item.sver_code,
      sv_name: item.sv_name,
      sver_ondate: item.sver_ondate,
      sver_enddate: item.sver_enddate,
    },
  });
};

// 페이지 로딩 시 전체 조회
onBeforeMount(() => {
  fetchSurveys();
});

// searchName 값 변경 시 자동 검색
watch(searchName, () => {
  fetchSurveys();
});
</script>

<template>
  <div class="container-fluid py-4 survey-page">
    <!-- 상단 버튼 영역 -->
    <div class="top-bar d-flex justify-content-between align-items-center mb-3">
      <button class="btn btn-primary" @click="goCreateSurvey">✏️ 조사지 등록</button>

      <div class="search-box">
        <i class="bi bi-search"></i>
        <input v-model="searchName" placeholder="검색할 조사지 이름을 입력해주세요" />
      </div>
    </div>

    <!-- 테이블 영역 -->
    <div class="card-box">
      <SurveyTable
        :surveys="surveys"
        :loading="loading"
        :error="error"
        @edit="handleEdit"
      />
    </div>
  </div>
</template>

<style scoped>
.search-box input {
  padding: 6px 10px 6px 30px;
  border: 1px solid #cfcfcf;
  border-radius: 2px;

  width: 300px;       
  min-width: 200px;   
  max-width: 100%;    
  box-sizing: border-box; 
} 
</style>