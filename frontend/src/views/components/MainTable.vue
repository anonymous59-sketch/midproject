<script setup>
import TablePagination from "@/views/components/TablePagination.vue";

defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  listError: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  rowsCount: { type: Number, default: 0 },
  emptyText: { type: String, default: "검색 결과가 없습니다." },
  colspan: { type: Number, default: 10 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
});

const emit = defineEmits(["update:page"]);

const onPageChange = (p) => {
  emit("update:page", p);
};
</script>

<template>
  <div class="col-12 col-lg-9">
    <div class="card">
      <div
        class="card-header pb-0 d-flex align-items-center justify-content-between"
      >
        <div>
          <h5 class="mb-2">{{ title }}</h5>
          <!-- <span v-if="subtitle" class="text-xs text-muted">
            {{ subtitle }}
          </span> -->
        </div>
        <slot name="header-actions" />
      </div>

      <div class="card-body pt-3">
        <p v-if="listError" class="text-danger small mb-2">
          {{ listError }}
        </p>
        <div class="table-responsive">
          <table class="table align-items-center">
            <thead>
              <tr>
                <slot name="header" />
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td :colspan="colspan" class="text-center text-muted py-4">
                  불러오는 중...
                </td>
              </tr>
              <tr v-else-if="rowsCount === 0">
                <td
                  :colspan="colspan"
                  class="text-center text-sm text-muted py-4"
                >
                  {{ emptyText }}
                </td>
              </tr>
              <slot v-else name="body" />
            </tbody>
          </table>
        </div>

        <TablePagination
          v-if="total > pageSize"
          :page="page"
          :total="total"
          :page-size="pageSize"
          class="mt-3"
          @update:page="onPageChange"
        />
      </div>
    </div>
  </div>
</template>
