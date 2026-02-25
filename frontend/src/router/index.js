import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import Dashboard from "../views/Dashboard.vue";
import Tables from "../views/Tables.vue";
import Profile from "../views/Profile.vue";
import Signup from "../views/Signup.vue";
import Signin from "../views/Signin.vue";
import FindId from "../views/FindId.vue";
import FindPassword from "../views/FindPassword.vue";
import ResetPassword from "../views/ResetPassword.vue";
import ProxyTest from "../views/ProxyTest.vue";
import ManagerControl from "@/views/ManagerControl.vue";
import kjh from "./kjh";
import psw from "./psw";
import six from "./six";
import yang from "./yang";
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
        component: () => import("@/views/ApplicantDashboard.vue"),
      },
      {
        path: "manager",
        name: "manager-home",
        component: () => import("@/views/manager/ManagerHome.vue"),
      },
    ],
  },
  ...kjh,
  ...psw,
  ...six,
  ...yang,

  // 기타 페이지
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
  },
  {
    path: "/proxy-test",
    name: "ProxyTest",
    component: ProxyTest,
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/auth/LoginPage.vue"),
  },
  {
    path: "/systemSurveyList",
    name: "systemSurveyList",
    component: () => import("../views/SystemManager_survey.vue"),
  },
  {
    path: "/systemSurveyForm",
    name: "SystemManagerSurveyForm",
    component: () => import("../views/systemmanager_surveyComp/SurveyForm.vue"),
  },
  {
    path: "/manager-control",
    name: "managerControl",
    component: ManagerControl,
  },
];

const routes = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: routesList,
});

export default routes;
