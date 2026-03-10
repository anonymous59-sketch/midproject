import { ref, computed, watch } from "vue";

/**
 * 공통 페이징 composable
 * - getItems: 현재 표시 대상 배열을 반환하는 함수 (예: () => filteredRows.value)
 * - initialPageSize: 기본 페이지당 건수 (기본 10)
 *
 * 반환:
 * - page: 현재 페이지 (1부터)
 * - pageSize: 페이지당 건수 (ref)
 * - totalItems: 전체 건수 (computed)
 * - pagedItems: 현재 페이지에 표시할 배열 (computed)
 * - rowDisplayNo(indexInPage): 번호(전체 기준 내림차순) 계산 함수
 */
export function usePagination(getItems, initialPageSize = 10) {
  const page = ref(1);
  const pageSize = ref(initialPageSize);

  const totalItems = computed(() => {
    const items = typeof getItems === "function" ? getItems() : [];
    return Array.isArray(items) ? items.length : 0;
  });

  const pagedItems = computed(() => {
    const items = typeof getItems === "function" ? getItems() : [];
    if (!Array.isArray(items) || items.length === 0) return [];
    const start = (page.value - 1) * pageSize.value;
    return items.slice(start, start + pageSize.value);
  });

  const rowDisplayNo = (indexInPage) =>
    totalItems.value - ((page.value - 1) * pageSize.value + indexInPage);

  watch(totalItems, () => {
    page.value = 1;
  });

  return {
    page,
    pageSize,
    totalItems,
    pagedItems,
    rowDisplayNo,
  };
}

