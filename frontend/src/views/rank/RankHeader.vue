<script setup>
defineProps({
  target_name: { type: String, default: "" },
  member_name: { type: String, default: "" },
  manager_name: { type: String, default: "" },
  priority: { type: String, default: "" },
  write_date: { type: String, default: "" },
  disability_type: { type: String, default: "" },
});
</script>
<template>
  <div class="rank-header card border mb-3">
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
  </div>
</template>

<style scoped>
.rank-header .table td {
  padding: 0.5rem 0.75rem;
  vertical-align: middle;
}
</style>
