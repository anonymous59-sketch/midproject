<script setup>
import { defineProps, defineEmits } from "vue";

defineProps({
  surveys: {
    type: Array,
    required: true,       // 부모가 반드시 데이터를 줘야 함
    default: () => [],    // 기본값: 빈 배열
  },
  error: {
    type: String,
    required: false,      
    default: "",          
  },
});

const emit = defineEmits(["edit"]);
</script>

<template>
  <div>
    <div v-if="error" class="text-danger">{{ error }}</div>

    <table v-if="surveys.length" class="table survey-table">
      <thead>
        <tr>
          <th>조사지 Ver</th>
          <th>조사지명</th>
          <th>작성자</th>
          <th>유효시작일</th>
          <th>유효종료일</th>
          <th>상세보기/수정</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="data in surveys" :key="data.sver_code">
          <td>{{ data.sver_code }}</td>
          <td>{{ data.sv_name }}</td>
          <td>{{ data.writer_name }}</td>
          <td>{{ data.sver_ondate }}</td>
          <td>{{ data.sver_enddate == null ? "2999-12-31" : data.sver_enddate }}</td>
          <td>
            <button
              class="btn btn-sm btn-outline-dark"
              type="button"
              @click="emit('edit', data)"
            >
              ✏
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="surveys.length == 0">데이터가 없습니다.</div>
  </div>
</template>