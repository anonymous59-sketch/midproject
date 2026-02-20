# Frontend 디렉토리 구조

Vue 3 + Argon Dashboard 기반 프론트엔드 구조 설명입니다. **자주 수정하는 곳**은 `components`와 `views`(및 `views/components`)이며, `examples`·`assets`는 참고/공통 리소스용입니다.

---

## 루트 및 공통 디렉토리 (요약)

| 경로 | 설명 |
|------|------|
| **`src/assets`** | 전역 CSS(SCSS), 이미지, 아이콘, 폰트, JS 유틸 등 **디자인·리소스 전체**. 테마/스타일 변경 시에만 수정. |
| **`src/examples`** | 템플릿 **샘플·참고용** (사이드바, 카드, 차트, 네비바, 푸터 등). 가급적 수정하지 않고, 필요 시 우리 코드(`components`/`views`)로 가져와서 사용. |
| **`src/router/index.js`** | 라우트 정의. 새 페이지 추가 시 여기서 path·component 등록. |
| **`src/store/index.js`** | Vuex 전역 상태(레이아웃, 사이드바, RTL 플래그 등). |
| **`src/main.js`** | 앱 진입점. |
| **`src/App.vue`** | 루트 컴포넌트. |

---

## `src/components` — 공통 UI 컴포넌트

여러 페이지에서 재사용하는 **폼·버튼·배지** 등 Argon 스타일의 기본 UI입니다. 새 공통 컴포넌트는 여기에 추가합니다.

| 파일 | 설명 |
|------|------|
| **ArgonButton.vue** | 버튼. color, size, variant(fill/outline/gradient), fullWidth, active 등 옵션 지원. |
| **ArgonInput.vue** | 텍스트 입력. size, success/error, icon, placeholder, modelValue 등 지원. |
| **ArgonTextarea.vue** | 여러 줄 텍스트 입력. |
| **ArgonCheckbox.vue** | 체크박스. |
| **ArgonRadio.vue** | 라디오 버튼. |
| **ArgonSwitch.vue** | 스위치(토글). |
| **ArgonAlert.vue** | 알림/메시지 박스. |
| **ArgonBadge.vue** | 뱃지·태그. |
| **ArgonAvatar.vue** | 아바타 이미지. |
| **ArgonProgress.vue** | 프로그레스 바. |
| **ArgonPagination.vue** | 페이지네이션 컨테이너. |
| **ArgonPaginationItem.vue** | 페이지네이션 항목(한 개 버튼). |

---

## `src/views` — 페이지(화면)

URL 하나당 하나의 **페이지**를 담당합니다. 라우터와 1:1로 연결되며, 새 화면 추가 시 여기에 `.vue` 파일을 만들고 `router/index.js`에 등록합니다.

| 파일 | 라우트 | 설명 |
|------|--------|------|
| **Dashboard.vue** | `/dashboard-default` | 메인 대시보드. 미니 통계 카드, 차트, Carousel, CategoriesList 등 사용. |
| **Tables.vue** | `/tables` | 테이블 페이지. AuthorsTable, ProjectsTable 사용. |
| **Profile.vue** | `/profile` | 프로필 페이지. ProfileCard, ArgonInput, ArgonButton 사용. |
| **Signin.vue** | `/signin` | 로그인 폼. |
| **Signup.vue** | `/signup` | 회원가입 폼. |
| **Home.vue** | (라우트 없음) | 랜딩/홈용. 현재 `@/views/dashboards/Default.vue`를 import하며, 해당 파일이 없으면 별도 처리 필요. |

---

## `src/views/components` — 뷰 전용 컴포넌트

**특정 뷰에서만 쓰는** 카드·테이블·위젯입니다. 페이지별 UI 블록을 넣는 곳입니다.

| 파일 | 주로 사용하는 뷰 | 설명 |
|------|------------------|------|
| **AuthorsTable.vue** | Tables | 작성자 목록 테이블(이름, 역할, 상태, Employed 등). |
| **ProjectsTable.vue** | Tables | 프로젝트 목록 테이블. |
| **ProjectCard.vue** | Dashboard | 프로젝트 카드. title, description, headings, rows, action(드롭다운) 등 props. |
| **Carousel.vue** | Dashboard | 이미지/캡션 캐러셀. |
| **CategoriesList.vue** | Dashboard | 카테고리 리스트. 아이콘·label·description 배열로 표시. |
| **ProfileCard.vue** | Profile | 프로필 카드. |
| **NavPill.vue** | Profile 등 | 탭/필 형태 네비게이션. |
| **DeveloperCard.vue** | (참고용) | 개발자 정보 카드. |
| **RocketCard.vue** | (참고용) | 강조용 카드. |
| **TodoListCard.vue** | (참고용) | 할 일 리스트 카드. |

---

## 정리

- **수정을 자주 하는 곳**: `components`(공통 UI), `views`(페이지), `views/components`(페이지 전용 블록).
- **참고만 하는 곳**: `examples`(샘플), `assets`(전역 CSS·리소스).
- **새 페이지 추가**: `views`에 `.vue` 추가 → `router/index.js`에 path·component 등록 → 필요 시 `views/components`에 전용 컴포넌트 추가.
