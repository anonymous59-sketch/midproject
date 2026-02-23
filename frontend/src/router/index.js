import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import OrganManager from "@/views/OrganManager.vue";
import Dashboard from "../views/Dashboard.vue";
import Tables from "../views/Tables.vue";
import Profile from "../views/Profile.vue";
import Signup from "../views/Signup.vue";
import Signin from "../views/Signin.vue";
import FindId from "../views/FindId.vue"; // 아이디 찾기
import FindPassword from "../views/FindPassword.vue"; // 비밀번호 찾기
import ResetPassword from "../views/ResetPassword.vue"; // 비밀번호 재설정
import ProxyTest from "../views/ProxyTest.vue";

const routes = [
  {
    path: "/",
    name: "/",
    redirect: "/dashboard-default",
  },
  {
    path: "/dashboard-default",
    name: "Dashboard",
    component: Dashboard,
  },
  {
    path: "/tables",
    name: "Tables",
    component: Tables,
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
  },
  {
    path: "/signin",
    name: "Signin",
    component: Signin,
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
  },
  {
    path: "/find-id",
    name: "FindId",
    component: FindId,
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPassword,
  },
  {
    path: "/find-password",
    name: "FindPassword",
    component: FindPassword,
    path: "/proxy-test",
    name: "ProxyTest",
    component: ProxyTest,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL), // Vue CLI면 이게 더 안전
  routes: [
    // 1) 지원자(기존) 영역: MainLayout 아래
    {
      path: "/",
      component: MainLayout,
      children: [
        {
          path: "",
          name: "home",
          component: () => import("@/views/MainContent.vue"),
        },
        {
          path: "apply",
          name: "apply",
          component: () => import("@/views/apply/ApplyPage.vue"),
        },
        {
          path: "mypage",
          name: "mypage",
          component: () => import("@/views/mypage/MyPage.vue"),
        },
        {
          path: "applicant", // ✅ 슬래시 제거
          name: "applicant",
          component: () => import("@/views/ApplicantDashboard.vue"),
        },
        {
          path: "manager",
          name: "manager-home",
          component: () => import("@/views/manager/ManagerHome.vue"),
        },
      ],
    },

    // 2) 기관관리자 영역: MainLayout 밖에서 별도 트리로
    {
      path: "/organmanager",
      component: OrganManager,
      children: [
        {
          path: "",
          name: "organmanager-home",
          // OrganManager 메인 content가 따로 있으면 그걸 넣고,
          component: () => import("@/views/organmanager/ApplicantList.vue"),
        },
        {
          path: "managers",
          name: "organmanager-managers",
          component: () => import("@/views/organmanager/ManagerList.vue"),
        },
      ],
    },

    // 기타
    {
      path: "/dashboard-default",
      name: "Dashboard",
      component: () => import("../views/Dashboard.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/auth/LoginPage.vue"),
    },
  ],
});

export default router;
