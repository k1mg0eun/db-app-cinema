# 별빛시네마 프론트엔드

10주차 회의록(2026.11.05)의 예매 흐름 화면을 구현한 React + Vite 앱입니다.

(회원가입 →) 로그인 → 영화 목록 → 영화 상세 → 상영회차 선택 → 좌석 선택 → 결제 확인 → 예매 완료 → 마이페이지

## 실행

```bash
cd frontend
npm install
npm run dev
```

http://localhost:5173 에서 열립니다.

### 목업 모드 / 백엔드 연결

- `VITE_API_BASE_URL`이 비어 있으면 **목업 모드**로 동작합니다. 데이터는 브라우저 localStorage에 저장되고, 상영회차는 실행한 날부터 3일치가 자동 생성됩니다.
- 백엔드가 준비되면 `.env.example`을 `.env`로 복사한 뒤 주소를 넣으면 실제 API를 호출합니다.

```
VITE_API_BASE_URL=http://localhost:8080/api
```

백엔드의 모든 경로는 `/api`로 시작하므로 주소에 `/api`까지 넣습니다. 백엔드 쪽 명세는 `cinema-backend/docs/API.md`에 있습니다.

목업 테스트 계정 (비밀번호 모두 `test1234`)

| 아이디 | 설명 |
| --- | --- |
| adult01 | 1999.03.14생. 모든 영화 예매 가능 |
| teen01 | 2012.05.20생, 만 14세. 전체 관람가만 예매 가능하고 15세·19세 영화는 막힘 |

## 화면 ↔ 테이블

| 화면 | 경로 | 관련 테이블 |
| --- | --- | --- |
| 로그인 | `/login` | member |
| 회원가입 | `/signup` | member |
| 영화 목록 / 상세 | `/movies`, `/movies/:id` | movie |
| 상영회차 선택 | `/movies/:id/schedules` | schedule, screen |
| 좌석 선택 + 결제 창 | `/schedules/:id/seats` | seat, ticket, reservation |
| 예매 완료 | `/reservations/:id/complete` | reservation, ticket |
| 마이페이지 | `/mypage` | reservation, ticket |

## 백엔드와 맞출 API (안)

필드 이름은 통합 ERD의 컬럼명을 그대로 씁니다. DATETIME은 `"2026-11-12T14:30:00"` 또는 `"2026-11-12 14:30:00"` 둘 다 받습니다. 로그인 후에는 `Authorization: Bearer <token>` 헤더를 붙여 보냅니다.

회의록 2-4 표에 없던 로그인 API 2개(`POST /auth/login`, `GET /members/me`)를 추가했습니다.

### `POST /auth/login`

```json
// 요청
{ "login_id": "adult01", "password": "test1234" }
// 200
{ "token": "...", "member": { "member_id": 1, "login_id": "adult01", "name": "김예매", "phone": "010-...", "birth_date": "1999-03-14" } }
```

### `POST /auth/signup` → 201

```json
// 요청
{ "login_id": "newuser1", "password": "password1234", "name": "홍길동", "phone": "010-1111-2222", "birth_date": "2000-01-01" }
// 201 — member 객체 (password 제외)
```

- `login_id`: 영문·숫자·`_` 4~20자, `password`: 8~64자, `phone`: `01012345678` 또는 `010-1234-5678`, `birth_date`: 과거 날짜
- 아이디·전화번호 중복은 409 `DUPLICATE_LOGIN_ID` / `DUPLICATE_PHONE` → 해당 입력칸 아래에 메시지를 띄웁니다.
- 가입이 끝나면 로그인 화면으로 이동하고 아이디를 미리 채워 둡니다. (자동 로그인은 하지 않음)

### `GET /members/me` → member 객체 (위와 같음, password 제외)

### `GET /movies`, `GET /movies/{id}`

```json
{ "movie_id": 1, "title": "...", "running_time": 108, "age_rating": "ALL", "release_date": "2026-10-22", "poster_url": "/posters/1.svg", "description": "..." }
```

`age_rating`은 `ALL` / `12` / `15` / `19` 중 하나. `poster_url`이 null이면 제목으로 대체 포스터를 그립니다.

### `GET /movies/{id}/schedules` — schedule + screen JOIN

```json
[{ "schedule_id": 11, "movie_id": 3, "screen_id": 3, "screen_name": "IMAX관", "start_time": "...", "end_time": "...", "price": 18000 }]
```

### `GET /schedules/{id}/seats`

```json
{
  "schedule": { "schedule_id": 11, "movie_id": 3, "movie_title": "붉은 장막", "age_rating": "19", "screen_id": 3, "screen_name": "IMAX관", "start_time": "...", "end_time": "...", "price": 18000 },
  "seats": [{ "seat_id": 1, "seat_row": "A", "seat_col": 1, "reserved": false }]
}
```

`reserved`는 해당 회차에 ticket이 있는지 여부입니다.

### `POST /reservations`

```json
// 요청
{ "schedule_id": 11, "seat_ids": [1, 2] }
// 201 — 마이페이지 목록의 한 항목과 같은 모양
```

### `GET /members/me/reservations` — 예매 1건 단위, 최신순

```json
[{
  "reservation_id": 622,
  "status": "CONFIRMED",
  "reserved_at": "...",
  "total_price": 36000,
  "schedule": { "movie_title": "...", "age_rating": "19", "screen_name": "IMAX관", "start_time": "...", "end_time": "..." },
  "tickets": [{ "seat_id": 1, "seat_row": "A", "seat_col": 1, "price": 18000, "status": "ACTIVE" }]
}]
```

`total_price`는 저장하지 않는 유도 속성이므로 백엔드에서 `SUM(ticket.price)`로 계산해서 내려주는 것을 제안합니다.

`status`는 `CONFIRMED` / `CANCELLED`입니다. 마이페이지에서 `CONFIRMED`는 "예매 완료", `CANCELLED`는 "예매 취소"로 표시하고, 취소된 예매에는 취소 버튼을 보이지 않습니다. (예전 필드명 `reservation_status`도 받습니다)

### `POST /reservations/{id}/cancel`: 예매 취소

본문 없이 보냅니다. 새 DDL에 맞춰 행을 지우지 않고 상태만 바꿉니다.

- `reservations.reservation_status` → `CANCELLED`
- 해당 예매의 `tickets.ticket_status` → `CANCELLED` (그러면 `active_seat_id`가 NULL이 되어 같은 좌석을 다시 예매할 수 있음)
- 응답 200: 취소된 예매 1건 (위 목록의 한 항목과 같은 모양)
- 본인 예매만, 상영 시작 전까지만 취소 가능

### 에러 응답 (안)

모든 에러는 `{ "code": "...", "message": "사용자에게 보여줄 문장" }` 형태로 보내 주세요. 프론트는 `message`를 그대로 화면에 띄웁니다.

| 상황 | 상태 코드 | code | 추가 필드 |
| --- | --- | --- | --- |
| 이미 예매된 좌석 (ticket UNIQUE 위반) | 409 | `SEAT_ALREADY_RESERVED` | `seat_ids`: 겹친 좌석 번호 배열 |
| 관람 연령 미달 | 403 | `AGE_RESTRICTED` | |
| 상영이 이미 시작된 회차 (예매·취소 모두) | 400 | `SCHEDULE_STARTED` | |
| 이미 취소된 예매를 다시 취소 | 409 | `ALREADY_CANCELLED` | |
| 로그인 필요 / 토큰 만료 | 401 | `UNAUTHORIZED` | |
| 아이디·비밀번호 불일치 | 401 | `INVALID_CREDENTIALS` | |
| 다른 회원의 예매 취소 | 403 | `FORBIDDEN` | |
| 아이디 / 전화번호 중복 (회원가입) | 409 | `DUPLICATE_LOGIN_ID` / `DUPLICATE_PHONE` | |

409를 받으면 프론트는 결제 창을 닫고, 좌석 현황을 다시 불러오고, 겹친 좌석을 선택에서 빼고 안내 문구를 띄웁니다.

## 정해야 할 것

- 연령 제한은 프론트에서 막고 있습니다(상영일 기준 만 나이 ≥ 등급 숫자). 백엔드에서도 한 번 더 검사하면 위 403 형식으로 응답하면 됩니다. 목업은 두 곳 모두 검사합니다.
- 영화 3편의 제목·포스터는 임시입니다. 확정되면 목업 데이터(`src/api/mockData.js`)를 바꾸면 됩니다.
