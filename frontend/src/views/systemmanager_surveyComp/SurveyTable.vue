<script setup>
import { defineProps, defineEmits } from "vue";

defineProps({
  surveys: {
    type: Array,
    required: true,       // 부모가 반드시 데이터를 줘야 함
    default: () => [],    // 기본값: 빈 배열
  },
  loading: {
    type: Boolean,
    required: false,      // 필수 아님
    default: false,       // 기본값: false
  },
  error: {
    type: String,
    required: false,      // 필수 아님
    default: "",          // 기본값: 빈 문자열
  },
});

const emit = defineEmits(["edit"]);
</script>

<template>
  <div>
    <div v-if="loading">로딩중...</div>
    <div v-if="error" class="text-danger">{{ error }}</div>

    <table v-if="!loading && surveys.length" class="table survey-table">
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
        <tr v-for="item in surveys" :key="item.sver_code">
          <td>{{ item.sver_code }}</td>
          <td>{{ item.sv_name }}</td>
          <td>{{ item.writer_name }}</td>
          <td>{{ item.sver_ondate }}</td>
          <td>{{ item.sver_enddate }}</td>
          <td>
            <button
              class="btn btn-sm btn-outline-dark"
              type="button"
              @click="emit('edit', item)"
            >
              ✏
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && surveys.length === 0">데이터가 없습니다.</div>
  </div>
</template>