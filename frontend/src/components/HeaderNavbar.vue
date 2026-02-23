<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

// TODO: 나중에 로그인 연동되면 store/pinia에서 가져오면 됨
const userName = "홍길동";

// ✅ 기관관리자 더미 정보(추후 store/API로)
const orgName = "대구 남구 지원센터";
const orgAdminName = "김태균";

const router = useRouter();
const route = useRoute();

// ✅ /organmanager 로 시작하면 기관관리자 영역으로 판단
const isOrganManagerRoute = computed(() =>
  route.path.startsWith("/organmanager"),
);

const isManagerRoute = computed(() => route.path.startsWith("/manager"));

// 담당자 더미 정보
const managerOrgName = "대구 남구 지원센터";
const managerName = "김래원";

// 로그아웃 버튼 동작(예시)
const onLogout = async () => {
  router.push("/login");
};

// ✅ 인사말 분기
const greetingText = computed(() => {
  if (isOrganManagerRoute.value) {
    return `${orgName} | ${orgAdminName} 기관관리자님`;
  }
  if (isManagerRoute.value) {
    return `${managerOrgName} | ${managerName} 담당자님`;
  }

  return `${userName} 님 반갑습니다!`;
});
// ✅ 메뉴를 경로별로 구성
const navItems = computed(() => {
  if (isOrganManagerRoute.value) {
    return [
      {
        label: "홈",
        to: "/organmanager",
        icon: "ni ni-shop",
      },
      {
        label: "담당자 관리",
        to: "/organmanager/managers",
        icon: "ni ni-single-02",
      },
      // 다음 단계에서 원하면 "상담내역"도 여기로 추가 가능
      // { label: "상담내역", to: "/organmanager/counselings", icon: "ni ni-notification-70" },
    ];
  }

  if (isManagerRoute.value) {
    return [
      { label: "홈", to: "/manager", icon: "ni ni-shop" },
      // ❌ 지원신청 제거
      // 나중에 필요하면 "내 담당목록" 추가 가능
    ];
  }

  // 일반 사용자 메뉴
  return [
    { label: "첫화면", to: "/", icon: "ni ni-shop" },
    { label: "지원신청", to: "/apply", icon: "ni ni-single-copy-04" },
  ];
});
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
        <ul class="navbar-nav flex-row gap-3 align-items-center">
          <li class="nav-item" v-for="item in navItems" :key="item.to">
            <RouterLink
              class="nav-link text-dark px-2 py-2 d-flex align-items-center gap-1"
              :to="item.to"
            >
              <i :class="`${item.icon} text-sm`"></i>
              <span>{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>

      <!-- RIGHT: 마이페이지/로그아웃/인사말 -->
      <div class="d-flex align-items-center ms-auto gap-2">
        <span class="ms-2 small text-dark fw-semibold">
          {{ greetingText }}
        </span>

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
