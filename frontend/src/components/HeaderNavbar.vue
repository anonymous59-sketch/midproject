<script setup>
import { computed } from "vue";
import { useRouter, useRoute, RouterLink } from "vue-router";
import { useAuthStore } from "@/store/auth";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

// 로그아웃: Pinia 초기화 후 로그인 페이지로
const onLogout = () => {
  authStore.logout();
  router.push("/signin");
};

// 권한별 마이페이지 이동
const onMyPageClick = () => {
  const auth = authStore.user?.m_auth;
  if (auth === "a0_30") {
    router.push("/mypage/manager");
  } else if (auth === "a0_40") {
    router.push("/mypage/organmanager");
  } else {
    router.push("/mypage");
  }
};

// 권한별 첫화면 경로 (사이트명 클릭 시 이동)
const homeRoute = computed(() => {
  const auth = authStore.user?.m_auth;
  if (auth === "a0_99") return "/admin";
  if (auth === "a0_40") return "/organmanager";
  if (auth === "a0_30") return "/manager";
  if (auth === "a0_20") return "/applicant";
  return "/";
});

// 현재 로그인 권한 (경로가 아닌 권한으로 메뉴 고정)
const currentAuth = computed(() => authStore.user?.m_auth || "");

// m_org로 조인한 organ_name 사용 (로그인 응답에 organ_name 포함 시 사용, 없으면 m_org 표시)
const organDisplayName = computed(
  () => authStore.user?.organ_name || authStore.user?.m_org || "",
);

// 인사말: 권한 기준, a0_40/a0_30은 organ_name(조인값) 사용
const greetingText = computed(() => {
  const name = authStore.userName || "게스트";
  const org = organDisplayName.value;
  const auth = currentAuth.value;
  if (auth === "a0_99") return `${name} 님 반갑습니다!`;
  if (auth === "a0_40")
    return org ? `${org} | ${name} 기관관리자님` : `${name} 기관관리자님`;
  if (auth === "a0_30")
    return org ? `${org} | ${name} 담당자님` : `${name} 담당자님`;
  return `${name} 님 반갑습니다!`;
});

/**
 * 메뉴 순서(왼쪽→오른쪽): 지원신청(a0_20만), 지원자 관리, 담당자 관리, 관리자 관리, 조사지 관리, 기간 관리 / 오른쪽: 마이페이지, 로그아웃
 * 마이페이지는 로그아웃 왼쪽(우측 영역)에 표시
 */
const fullMenuItems = [
  {
    key: "apply",
    label: "지원신청",
    to: "/apply",
    show: (auth) => auth === "a0_20",
  },
  {
    key: "support",
    label: "지원자 관리",
    to: "/applicantmanage",
    show: (auth) => auth === "a0_99" || auth === "a0_40",
  },
  {
    key: "manager",
    label: "담당자 관리",
    to: "/managermanage",
    show: (auth) => auth === "a0_99" || auth === "a0_40",
  },
  {
    key: "admin",
    label: "관리자 관리",
    to: "/organmanagermanage",
    show: (auth) => auth === "a0_99",
  },
  {
    key: "survey",
    label: "조사지 관리",
    to: "/admin/systemSurveyList",
    show: (auth) => auth === "a0_99",
  },
  {
    key: "period",
    label: "기관 관리",
    to: "/admin",
    show: (auth) => auth === "a0_99",
  },
];

const navItems = computed(() => {
  const auth = currentAuth.value;
  return fullMenuItems
    .filter((item) => item.show(auth))
    .map((item) => ({
      ...item,
      to: item.getTo ? item.getTo(auth) : item.to,
    }));
});

// 마이페이지 노출 여부 (우측에 로그아웃 왼쪽으로 표시)
const showMypage = computed(
  () =>
    currentAuth.value === "a0_40" ||
    currentAuth.value === "a0_30" ||
    currentAuth.value === "a0_20",
);

// 현재 경로가 해당 메뉴의 to와 일치할 때만 음영(active)
function isNavActive(itemTo) {
  return route.path === itemTo;
}
</script>

<template>
  <nav
    class="navbar navbar-main navbar-expand-lg px-0 mx-4 border-radius-xl shadow-none"
    id="navbarBlur"
    data-scroll="true"
  >
    <div class="container-fluid py-1 px-3">
      <!-- LEFT: 사이트명 + 메뉴 (순서 고정) -->
      <div class="d-flex align-items-center gap-3">
        <RouterLink class="navbar-brand m-0 fw-bold text-dark" :to="homeRoute">
          발달장애인 지원 프로그램
        </RouterLink>

        <ul class="navbar-nav flex-row gap-3 align-items-center">
          <li v-for="item in navItems" :key="item.key" class="nav-item">
            <RouterLink
              class="nav-link text-dark px-2 py-2 d-flex align-items-center gap-1"
              :class="{ 'nav-link-active': isNavActive(item.to) }"
              :to="item.to"
            >
              <span>{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>

      <!-- RIGHT: 인사말 + 마이페이지 + 로그아웃 -->
      <div class="d-flex align-items-center ms-auto gap-2">
        <span class="ms-2 small text-dark fw-semibold">
          {{ greetingText }}
        </span>
        <button
          v-if="showMypage"
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

.nav-link-active {
  font-weight: 700;
  background: rgba(0, 0, 0, 0.06);
}
</style>
