<template>
  <div class="sample-support-plan-header">
    <table class="table">
      <tbody>
        <tr>
          <td>지원대상</td>
          <td>{{ summary.supportTarget }}</td>
          <td>장애유형</td>
          <td>{{ summary.disabilityType }}</td>
          <td>작성일자</td>
          <td>{{ summary.writeDate }}</td>
        </tr>
        <tr>
          <td>지원자</td>
          <td>{{ summary.applicant }}</td>
          <td>담당자</td>
          <td>{{ summary.manager }}</td>
          <td>우선순위</td>
          <td>{{ summary.priority }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
