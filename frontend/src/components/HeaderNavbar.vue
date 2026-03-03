<script setup>
import { computed } from "vue";
import { useRouter, useRoute, RouterLink } from "vue-router";

// TODO: 나중에 로그인 연동되면 store/pinia에서 가져오면 됨
const userName = "홍길동";

// ✅ 기관관리자 더미 정보(추후 store/API로)
const orgName = "대구 남구 지원센터";
const orgAdminName = "김태균";

// 담당자 더미 정보
const managerOrgName = "대구 남구 지원센터";
const managerName = "김래원";

const routes = useRouter();
const route = useRoute();

// ✅ /organmanager 로 시작하면 기관관리자 영역으로 판단
const isOrganManagerRoute = computed(() =>
  route.path.startsWith("/organmanager"),
);

const isManagerRoute = computed(() => route.path.startsWith("/manager"));

// ✅ /admin 또는 /managermanage 이면 시스템관리자 영역 (담당자 관리 포함)
const isAdminRoute = computed(() =>
  route.path.startsWith("/admin") || route.path.startsWith("/managermanage"),
);

// 로그아웃 버튼 동작
const onLogout = () => {
  routes.push("/signin");
};

// ✅ 마이페이지 alert 처리
const onMyPageClick = () => {
  alert("마이페이지는 준비중입니다.");
};

// ✅ 시스템관리자 더미 (추후 store/로그인 연동 시 m_auth 기준으로 표시)
const adminName = "시스템관리자";

// ✅ 인사말 분기
const greetingText = computed(() => {
  if (isAdminRoute.value) {
    return `${adminName} 님 반갑습니다!`;
  }
  if (isOrganManagerRoute.value) {
    return `${orgName} | ${orgAdminName} 기관관리자님`;
  }
  if (isManagerRoute.value) {
    return `${managerOrgName} | ${managerName} 담당자님`;
  }

  return `${userName} 님 반갑습니다!`;
});

// ✅ 메뉴를 경로별로 구성 (admin: 기간 관리(홈), 담당자 관리 a0_30, 기관관리자 관리 a0_40, 설문 목록 / 마이페이지 숨김)
const navItems = computed(() => {
  if (isAdminRoute.value) {
    return [
      { label: "기간 관리", to: "/admin", icon: "ni ni-calendar-grid-58" },
      {
        label: "담당자 관리",
        to: "/managermanage",
        icon: "ni ni-single-02",
      },
      {
        label: "기관관리자 관리",
        to: "/admin/organ-managers",
        icon: "ni ni-building",
      },
      {
        label: "설문 목록",
        to: "/systemSurveyList",
        icon: "ni ni-single-copy-04",
      },
    ];
  }
  if (isOrganManagerRoute.value) {
    return [
      { label: "홈", to: "/organmanager", icon: "ni ni-shop" },
      {
        label: "담당자 관리",
        to: "/managermanage",
        icon: "ni ni-single-02",
      },
    ];
  }

  if (isManagerRoute.value) {
    return [{ label: "홈", to: "/manager", icon: "ni ni-shop" }];
  }

  return [
    { label: "첫화면", to: "/", icon: "ni ni-shop" },
    { label: "지원신청", to: "/apply", icon: "ni ni-single-copy-04" },
  ];
});
</script>

<template>
  <nav
    class="navbar navbar-main navbar-expand-lg px-0 mx-4 border-radius-xl shadow-none"
    id="navbarBlur"
    data-scroll="true"
  >
    <div class="container-fluid py-1 px-3">
      <!-- LEFT -->
      <div class="d-flex align-items-center gap-3">
        <RouterLink class="navbar-brand m-0 fw-bold text-dark" to="/">
          발달장애인 지원 프로그램
        </RouterLink>

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

      <!-- RIGHT -->
      <div class="d-flex align-items-center ms-auto gap-2">
        <span class="ms-2 small text-dark fw-semibold">
          {{ greetingText }}
        </span>

        <!-- 시스템관리자(/admin)일 때는 마이페이지 숨김 -->
        <button
          v-if="!isAdminRoute"
          class="btn btn-outline-secondary btn-sm mb-0"
          type="button"
          @click="onMyPageClick"
        >
          마이페이지
        </button>

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
