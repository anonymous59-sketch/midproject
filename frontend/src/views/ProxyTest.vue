<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const result = ref(null);
const loading = ref(false);
const error = ref(null);

async function testProxy() {
  loading.value = true;
  error.value = null;
  result.value = null;
  try {
    // vue.config.js proxy: /api -> http://localhost:3000, pathRewrite로 /api 제거
    // 따라서 /api/hello -> http://localhost:3000/hello
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

onMounted(() => {
  testProxy();
});
</script>

<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header pb-0">
            <h5>프록시 테스트</h5>
            <p class="text-sm text-muted mb-0">
              Vue devServer proxy 설정 확인: <code>/api</code> → <code>http://localhost:3000</code>
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
              <div class="mt-2 small">
                백엔드가 <code>npm run dev</code>로 실행 중인지, 포트 3000인지 확인하세요.
              </div>
            </div>
            <div v-else-if="result" class="alert alert-success mb-0">
              <strong>프록시 정상 동작</strong>
              <pre class="mb-0 mt-2 text-dark">{{ JSON.stringify(result, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
