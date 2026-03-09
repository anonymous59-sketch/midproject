<script setup>
import { computed } from "vue";
import ArgonButton from "@/components/ArgonButton.vue";

const props = defineProps({
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  maxButtons: { type: Number, default: 5 },
});

const emit = defineEmits(["update:page"]);

const pageCount = computed(() =>
  props.pageSize > 0 ? Math.ceil(props.total / props.pageSize) : 0,
);

const currentPage = computed({
  get: () => (props.page < 1 ? 1 : props.page),
  set: (val) => emit("update:page", val),
});

const canPrev = computed(() => currentPage.value > 1);
const canNext = computed(() => currentPage.value < pageCount.value);

const pages = computed(() => {
  const total = pageCount.value;
  if (total <= 1) return [];

  const max = props.maxButtons;
  const cur = currentPage.value;

  let start = Math.max(1, cur - Math.floor(max / 2));
  let end = start + max - 1;
  if (end > total) {
    end = total;
    start = Math.max(1, end - max + 1);
  }

  const arr = [];
  for (let i = start; i <= end; i += 1) arr.push(i);
  return arr;
});

function goTo(page) {
  if (page < 1 || page > pageCount.value || page === currentPage.value) return;
  emit("update:page", page);
}
</script>

<template>
  <div v-if="pageCount > 1" class="d-flex justify-content-center mt-3">
    <nav aria-label="페이지네이션">
      <ul class="pagination pagination-sm mb-0 align-items-center">
        <li class="page-item" :class="{ disabled: !canPrev }">
          <ArgonButton
            type="button"
            size="sm"
            variant="outline"
            color="secondary"
            class="page-link border-0 rounded"
            :disabled="!canPrev"
            @click="goTo(currentPage - 1)"
          >
            ＜
          </ArgonButton>
        </li>

        <li
          v-for="p in pages"
          :key="p"
          class="page-item"
          :class="{ active: p === currentPage }"
        >
          <ArgonButton
            type="button"
            size="sm"
            :variant="p === currentPage ? 'fill' : 'outline'"
            :color="p === currentPage ? 'primary' : 'secondary'"
            class="page-link border-0 rounded"
            @click="goTo(p)"
          >
            {{ p }}
          </ArgonButton>
        </li>

        <li class="page-item" :class="{ disabled: !canNext }">
          <ArgonButton
            type="button"
            size="sm"
            variant="outline"
            color="secondary"
            class="page-link border-0 rounded"
            :disabled="!canNext"
            @click="goTo(currentPage + 1)"
          >
            ＞
          </ArgonButton>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.pagination .page-link {
  cursor: pointer;
}
</style>
