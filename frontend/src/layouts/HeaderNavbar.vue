<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

// TODO: 나중에 로그인 연동되면 store/pinia에서 가져오면 됨
const userName = "홍길동";

const router = useRouter();

// 로그아웃 버튼 동작(예시)
const onLogout = async () => {
  // 1) 토큰/세션 삭제 (예: localStorage.removeItem("accessToken"))
  // 2) 로그인 페이지로 이동
  // 3) 필요하면 API 로그아웃 호출
  router.push("/login");
};

const greetingText = computed(() => `${userName} 님 반갑습니다!`);
</script>

<template>
  <!-- Argon: navbar / glass blur 느낌 -->
  <nav
    class="navbar navbar-main navbar-expand-lg px-0 mx-4 border-radius-xl shadow-none"
    id="navbarBlur"
    data-scroll="true"
  >
    <div class="container-fluid py-1 px-3">
      <!-- LEFT: 브랜드 + 메인 내비 -->
      <div class="d-flex align-items-center gap-3">
        <!-- 브랜드/타이틀 -->
        <RouterLink class="navbar-brand m-0 fw-bold text-dark" to="/">
          발달장애인 지원 프로그램
        </RouterLink>

        <!-- 링크들 -->
        <ul class="navbar-nav flex-row gap-2">
          <li class="nav-item">
            <RouterLink class="nav-link text-dark px-2 py-2" to="/">
              첫화면
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link text-dark px-2 py-2" to="/apply">
              지원신청
            </RouterLink>
          </li>
        </ul>
      </div>

      <!-- RIGHT: 마이페이지/로그아웃/인사말 -->
      <div class="d-flex align-items-center ms-auto gap-2">
        <RouterLink class="btn btn-outline-secondary btn-sm mb-0" to="/mypage">
          마이페이지
        </RouterLink>

        <button
          class="btn btn-outline-danger btn-sm mb-0"
          type="button"
          @click="onLogout"
        >
          로그아웃
        </button>

        <span class="ms-2 small text-dark fw-semibold">
          {{ greetingText }}
        </span>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* PDF처럼 상단바를 더 “단정하게” 보이게 약간 조정 */
.navbar-brand {
  letter-spacing: -0.2px;
  white-space: nowrap;
}

.nav-link {
  border-radius: 0.5rem;
}

.nav-link.router-link-active {
  font-weight: 700;
  background: rgba(0, 0, 0, 0.06);
}
</style>
