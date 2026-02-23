# Vue 템플릿 스타일 가이드 (Argon Dashboard 2)

조원들이 페이지 통일성을 위해 이 문서를 참고하세요.

---

## 1. 템플릿이란?

이 프론트엔드는 **Vue Argon Dashboard 2** (Creative Tim) 무료 템플릿을 사용합니다.

- **공식**: [Vue Argon Dashboard](https://www.creative-tim.com/product/vue-argon-dashboard)
- **스타일 로딩**: `src/argon-dashboard.js` → `src/assets/scss/argon-dashboard.scss`  
  → Bootstrap 5 + Argon 테마(커스텀 변수·컴포넌트)가 전역으로 적용됩니다.

---

## 2. ProxyTest.vue 등에서 쓰는 class는 어디서 오나요?

| 구분 | 설명 |
|------|------|
| **Bootstrap 5** | 대부분의 레이아웃·유틸·컴포넌트 클래스는 **Bootstrap 5** 문서를 따릅니다. |
| **Argon Dashboard** | Bootstrap을 가져온 뒤 `assets/scss/argon-dashboard/` 아래에서 색상·카드·버튼·알림 등을 **덮어쓰거나 확장**합니다. |

즉, **Bootstrap 5 클래스를 쓰면 되고**, Argon이 그걸 테마에 맞게 스타일링해 줍니다.  
별도 CSS 파일을 만들지 않아도, 같은 템플릿 안에서는 이미 적용된 스타일을 그대로 쓰면 됩니다.

---

## 3. 자주 쓰는 클래스 (참고)

### 페이지 공통 레이아웃 (다른 뷰와 통일)

```html
<div class="py-4 container-fluid">
  <div class="row">
    <div class="col-12">
      <!-- 여기에 카드/콘텐츠 -->
    </div>
  </div>
</div>
```

- `py-4` : Bootstrap 유틸리티 (상하 패딩)
- `container-fluid`, `row`, `col-12` : Bootstrap 그리드

### 카드

- `card`, `card-header`, `card-body`  
  → 예: `Dashboard.vue`, `Tables.vue`, `Profile.vue`, `ProxyTest.vue`

### 버튼

- `btn`, `btn-outline-primary`, `btn-sm`  
  → [Bootstrap Buttons](https://getbootstrap.com/docs/5.3/components/buttons/)

### 알림/메시지

- `alert`, `alert-success`, `alert-danger`  
  → [Bootstrap Alerts](https://getbootstrap.com/docs/5.3/components/alerts/)

### 텍스트·여백

- `text-muted`, `text-dark`, `text-sm`
- `mb-0`, `mb-3`, `mt-2`, `pb-0`  
  → [Bootstrap Spacing](https://getbootstrap.com/docs/5.3/utilities/spacing/)

---

## 4. 새 페이지 만들 때 (통일성 유지)

1. **레이아웃**: 기존 뷰와 동일하게  
   `py-4 container-fluid` → `row` → `col-12` (또는 `col-lg-12`) 구조를 사용하세요.
2. **컴포넌트**: 템플릿에 이미 있는 `@/examples/Cards/`, `@/views/components/` 등을 최대한 재사용하세요.
3. **클래스**: Bootstrap 5 + 위에서 쓴 Argon 패턴(`card`, `btn`, `alert` 등)을 그대로 쓰면 됩니다.
4. **참고할 파일**:  
   `src/views/Dashboard.vue`, `src/views/Tables.vue`, `src/views/ProxyTest.vue`

---

## 5. 공식 문서 링크

- **Bootstrap 5**: https://getbootstrap.com/docs/5.3/
- **Argon Dashboard (일반)**: https://www.creative-tim.com/product/argon-dashboard  
  (Vue 버전은 같은 디자인 시스템을 쓰므로 레이아웃·컴포넌트 개념 참고 가능)

이렇게 하면 조원 모두 같은 템플릿 기준으로 페이지 통일성을 유지할 수 있습니다.
