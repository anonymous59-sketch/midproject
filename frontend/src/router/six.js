import OrganManager from "@/views/OrganManager.vue";
import admin from "@/views/AdminLayout.vue";

export default [
  // {
  //   path: "",
  //   name: "home",
  //   component: () => import("@/views/MainContent.vue"),
  // },

  // 1) 기관관리자 영역
  {
    path: "/organmanager",
    component: OrganManager,
    children: [
      {
        path: "",
        name: "organmanager-home",
        component: () => import("@/views/organmanager/ApplicantList.vue"),
      },
      {
        path: "managers",
        name: "organmanager-managers",
        component: () => import("@/views/organmanager/ManagerList.vue"),
      },
    ],
  },
  // 2) 시스템관리자 영역
  {
    path: "/admin",
    component: admin,
    children: [
      {
        path: "",
        name: "admin-home",
        component: () => import("@/views/admin/AdminHome.vue"),
      },
    ],
  },
  // 3) 담당자 관리 (헤더 유지를 위해 admin 레이아웃 사용)
  {
    path: "/managermanage",
    component: admin,
    children: [
      {
        path: "",
        name: "managermanage",
        component: () => import("@/views/ManagerControl.vue"),
      },
    ],
  },
];
