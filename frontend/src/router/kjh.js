import SupportPlan from "@/views/SupportPlan.vue";
import SupportResult from "@/views/SupportResult.vue";
import Rank from "@/views/Rank.vue";

export default [
  {
    path: "",
    name: "home",
    component: () => import("@/views/MainContent.vue"),
  },
  {
    path: "/support-plan/:supportCode",
    name: "SupportPlan",
    component: SupportPlan,
  },
  {
    path: "/rank/:supCode",
    name: "Rank",
    component: Rank,
  },
  {
    path: "/support-result/:supportCode",
    name: "SupportResult",
    component: SupportResult,
  },
];
