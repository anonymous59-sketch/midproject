// import OrganManager from "@/views/OrganManager.vue";
// import AdminLayout from "@/layouts/AdminLayout.vue";

export default [
  // {
  //   path: "",
  //   name: "home",
  //   component: () => import("@/views/MainContent.vue"),
  // },

  // 1) 기관관리자 영역
  // {
  //   path: "/organmanager",
  //   component: OrganManager,
  //   children: [
  //     {
  //       path: "managers",
  //       name: "organmanager-managers",
  //       component: () => import("@/views/organmanager/ManagerList.vue"),
  //     },
  //   ],
  // },
  // 2) 시스템관리자 영역
  {
    path: "/admin",
    // component: AdminLayout,
    children: [
      {
        path: "",
        name: "admin-home",
        component: () => import("@/views/admin/AdminHome.vue"),
      },
      {
        path: "manager-control",
        name: "admin-manager-control",
        component: () => import("@/views/admin/ManagerControl.vue"),
      },
      {
        path: "organ-managers",
        name: "admin-organ-managers",
        component: () => import("@/views/OrganManager.vue"),
      },
      {
        path: "systemSurveyList",
        name: "admin-survey-list",
        component: () => import("@/views/SystemManager_survey.vue"),
      },
      {
        path: "/systemSurveyForm",
        name: "SystemManagerSurveyForm",
        component: () =>
          import("@/views/systemmanager_surveyComp/SurveyForm.vue"),
      },
    ],
  },
  // 3) 담당자 관리 (헤더 유지를 위해 admin 레이아웃 사용)
  {
    path: "/managermanage",
    // component: AdminLayout,
    children: [
      {
        path: "",
        name: "managermanage",
        component: () => import("@/views/admin/ManagerControl.vue"),
      },
    ],
  },
  // 4) 지원자 관리 (a0_20, a0_21)
  {
    path: "/applicantmanage",
    // component: AdminLayout,
    children: [
      {
        path: "",
        name: "applicantmanage",
        component: () => import("@/views/admin/ApplicantControl.vue"),
      },
    ],
  },
  // 5) 관리자 관리 (a0_40, a0_41)
  {
    path: "/organmanagermanage",
    // component: AdminLayout,
    children: [
      {
        path: "",
        name: "organmanagermanage",
        component: () => import("@/views/admin/OrganManagerManage.vue"),
      },
    ],
  },
];
