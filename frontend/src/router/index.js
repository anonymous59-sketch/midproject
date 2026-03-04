import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import Signup from "../views/Signup.vue";
import Signin from "../views/Signin.vue";
import FindId from "../views/FindId.vue";
import FindPassword from "../views/FindPassword.vue";
import ResetPassword from "../views/ResetPassword.vue";
import ProxyTest from "../views/ProxyTest.vue";
import { useAuthStore } from "@/store/auth";
import kjh from "./kjh";
import psw from "./psw";
import six from "./six";
import yang from "./yang";

/** 로그인이 필요한 경로 (접두어) */
const AUTH_REQUIRED_PATHS = ["/applicant", "/manager", "/organmanager", "/admin", "/managermanage", "/applicantmanage", "/organmanagermanage", "/apply", "/mypage"];
function requiresAuth(path) {
  return AUTH_REQUIRED_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}
const routesList = [
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
        path: "applicant",
        name: "applicant",
        component: () => import("@/views/Applicant.vue"),
      },
      {
        path: "manager",
        name: "manager-home",
        component: () => import("@/views/manager/ManagerHome.vue"),
      },
      {
        path: "review/:sup_code",
        name: "review",
        component: () => import("@/views/counsel/Counsel.vue"),
      },
      {
        path: "mypage/manager",
        name: "mypage-manager",
        component: () => import("@/views/Y_ManagerInfo.vue"),
      },
      {
        path: "mypage/organmanager",
        name: "mypage-organmanager",
        component: () => import("@/views/Y_OrganManagerInfo.vue"),
      },
    ],
  },
  ...kjh,
  ...psw,
  ...six,
  ...yang,

  // 기타 페이지
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
  },
  {
    path: "/proxy-test",
    name: "ProxyTest",
    component: ProxyTest,
  },
  // {
  //   path: "/systemSurveyList",
  //   name: "systemSurveyList",
  //   component: () => import("../views/SystemManager_survey.vue"),
  // },
  // {
  //   path: "/systemSurveyForm",
  //   name: "SystemManagerSurveyForm",
  //   component: () => import("../views/systemmanager_surveyComp/SurveyForm.vue"),
  // },
  // {
  //   path: "/manager-control",
  //   name: "managerControl",
  //   component: ManagerControl,
  // },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: routesList,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const isLoggedIn = authStore.isLoggedIn && !!authStore.user;

  if (to.path === "/signin") {
    if (isLoggedIn) {
      const mAuth = authStore.user?.m_auth || "";
      if (mAuth === "a0_20") return next("/applicant");
      if (mAuth === "a0_30") return next("/manager");
      if (mAuth === "a0_40") return next("/organmanager");
      if (mAuth === "a0_99") return next("/admin");
      next("/");
    } else {
      next();
    }
    return;
  }

  if (requiresAuth(to.path) && !isLoggedIn) {
    next({ path: "/signin" });
    return;
  }

  next();
});

export default router;
