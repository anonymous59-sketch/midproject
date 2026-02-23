<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

// 1. 기본 프록시 테스트 (GET /api/hello)
const result = ref(null);
const loading = ref(false);
const error = ref(null);

async function testProxy() {
  loading.value = true;
  error.value = null;
  result.value = null;
  try {
    const res = await axios.get("/api/hello");
    result.value = res.data;
  } catch (e) {
    error.value = e.message || String(e);
    if (e.response) {
      error.value += ` (${e.response.status})`;
    }
  } finally {
    loading.value = false;
  }
}

// 2. psw_survey 테스트 (router → service → database, GET /api/survey)
const surveyResult = ref(null);
const surveyLoading = ref(false);
const surveyError = ref(null);

async function testPswSurvey() {
  surveyLoading.value = true;
  surveyError.value = null;
  surveyResult.value = null;
  try {
    const res = await axios.get("/api/survey");
    surveyResult.value = Array.isArray(res.data) ? res.data : [res.data];
  } catch (e) {
    surveyError.value = e.message || String(e);
    if (e.response) {
      surveyError.value += ` (${e.response.status})`;
    }
  } finally {
    surveyLoading.value = false;
  }
}

onMounted(() => {
  testProxy();
  testPswSurvey();
});
</script>

<!--
  스타일 클래스 출처 (페이지 통일성용):
  - Bootstrap 5 (package.json: "bootstrap": "5.3.3")
  - Argon Dashboard 테마: src/argon-dashboard.js → assets/scss/argon-dashboard.scss
  - 레이아웃: Dashboard.vue, Tables.vue와 동일하게 py-4 container-fluid + row + col-12 사용
  - 자세한 활용법: frontend/STYLE_GUIDE.md 참고
-->
<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="card mb-4">
          <div class="card-header pb-0">
            <h5>1. 기본 프록시 테스트</h5>
            <p class="text-sm text-muted mb-0">
              <code>/api</code> → <code>http://localhost:3000</code> (GET
              /api/hello)
            </p>
          </div>
          <div class="card-body">
            <button
              class="btn btn-outline-primary btn-sm mb-3"
              :disabled="loading"
              @click="testProxy"
            >
              {{ loading ? "요청 중..." : "다시 테스트" }}
            </button>
            <div v-if="loading" class="text-muted">백엔드에 요청 중...</div>
            <div v-else-if="error" class="alert alert-danger mb-0">
              <strong>실패:</strong> {{ error }}
            </div>
            <div v-else-if="result" class="alert alert-success mb-0">
              <strong>프록시 정상 동작</strong>
              <pre class="mb-0 mt-2 text-dark">{{
                JSON.stringify(result, null, 2)
              }}</pre>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header pb-0">
            <h5>2. psw_survey 테스트</h5>
            <p class="text-sm text-muted mb-0">
              콘솔창에 fetch('/api/(주소)') .then(res => res.json())
              .then(console.log) .catch(console.error); 를 입력해서 데이터 잘 넘어가는지 테스트 해볼 수 있음
            </p>
            <p class="text-sm text-muted mb-0">
              주의: 콘솔창에서는 axios가 아닌 fetch로 테스트를 해 볼 수 있고 컴포넌트에서 데이터 통신을 할 경우에는 axios로 하는게 더 좋을듯
              axios 모듈은 설치되어있으니 import 하기
            </p>
            <p class="text-sm text-muted mb-0">
              router (<code>psw_survey_router</code>) → service
              (<code>psw_survey_service</code>) → database
              (<code>psw_survey_sql</code>), GET <code>/api/survey</code>
            </p>
          </div>
          <div class="card-body">
            <button
              class="btn btn-outline-primary btn-sm mb-3"
              :disabled="surveyLoading"
              @click="testPswSurvey"
            >
              {{ surveyLoading ? "요청 중..." : "설문 목록 조회 테스트" }}
            </button>
            <div v-if="surveyLoading" class="text-muted">
              설문 목록 요청 중...
            </div>
            <div v-else-if="surveyError" class="alert alert-danger mb-0">
              <strong>실패:</strong> {{ surveyError }}
              <div class="mt-2 small">
                DB 연결 및 <code>survey</code> 테이블 존재 여부를 확인하세요.
              </div>
            </div>
            <div
              v-else-if="surveyResult !== null"
              class="alert alert-success mb-0"
            >
              <strong>설문 목록 조회 성공</strong>
              <pre class="mb-0 mt-2 text-dark">{{
                JSON.stringify(surveyResult, null, 2)
              }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
