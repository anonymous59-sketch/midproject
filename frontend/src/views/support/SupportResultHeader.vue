<script setup>
// ========== import ==========
// (없음)

// ========== 변수 ==========
defineProps({
  target_name: { type: String, default: "" },
  member_name: { type: String, default: "" },
  manager_name: { type: String, default: "" },
  priority: { type: String, default: "" },
  write_date: { type: String, default: "" },
  disability_type: { type: String, default: "" },
  plan_code: { type: String, default: "" },
  plan_date: { type: String, default: "" },
  organ_name: { type: String, default: "" },
  plan_goal: { type: String, default: "" },
});
</script>
<template>
  <div class="support-plan-header card border mb-3">
    <!-- infoData -->
    <div class="card-body p-0">
      <table class="table table-bordered mb-0">
        <tbody>
          <tr>
            <td class="bg-light fw-medium" style="width: 10%">지원대상</td>
            <td style="width: 23%">{{ target_name }}</td>
            <td class="bg-light fw-medium" style="width: 10%">장애유형</td>
            <td style="width: 23%">{{ disability_type }}</td>
            <td class="bg-light fw-medium" style="width: 10%">작성일자</td>
            <td style="width: 24%">{{ write_date }}</td>
          </tr>
          <tr>
            <td class="bg-light fw-medium">지원자</td>
            <td>{{ member_name }}</td>
            <td class="bg-light fw-medium">담당자</td>
            <td>{{ manager_name }}</td>
            <td class="bg-light fw-medium">우선순위</td>
            <td>{{ priority }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 간격 -->
    <div class="space-20"></div>
    <!-- planData -->
    <div class="card-body p-0">
      <table class="table table-bordered mb-0 plan-data-table">
        <tbody>
          <tr>
            <td class="bg-light fw-medium" style="width: 15%">NO</td>
            <td class="bg-light fw-medium" style="width: 15%">작성일자</td>
            <td class="bg-light fw-medium" style="width: 15%">작성자</td>
            <td class="bg-light fw-medium" style="width: 15%">소속기관</td>
            <td class="bg-light fw-medium">목표</td>
          </tr>
          <tr>
            <!-- plan_code 마지막 4자리-->
            <td class="bg-light fw-medium">{{ plan_code?.slice(-4) }}</td>
            <!-- plan_date -->
            <td class="bg-light fw-medium">{{ plan_date }}</td>
            <!-- manager_name -->
            <td class="bg-light fw-medium">{{ manager_name }}</td>
            <!-- organ_name -->
            <td class="bg-light fw-medium">{{ organ_name }}</td>
            <!-- plan_goal -->
            <td class="bg-light fw-medium">{{ plan_goal }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 간격 -->
    <div class="space-20"></div>
  </div>
</template>

<style scoped>
.support-plan-header .table td {
  padding: 0.5rem 0.75rem;
  vertical-align: middle;
  border: 1px solid var(--bs-border-color) !important;
}
.space-20 {
  margin: 20px 0;
}
.support-plan-header .plan-data-table td {
  text-align: center;
}
</style>
