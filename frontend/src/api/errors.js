export class ApiError extends Error {
  constructor(status, code, message, data) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// 백엔드와 맞출 에러 코드 (회의록 2-4 "중복 예매 실패 시 응답 형식")
export const ERROR = {
  SEAT_ALREADY_RESERVED: 'SEAT_ALREADY_RESERVED', // 409
  AGE_RESTRICTED: 'AGE_RESTRICTED', // 403
  SCHEDULE_STARTED: 'SCHEDULE_STARTED', // 400
  ALREADY_CANCELLED: 'ALREADY_CANCELLED', // 409
  UNAUTHORIZED: 'UNAUTHORIZED', // 401
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS', // 401 아이디·비밀번호 불일치
  FORBIDDEN: 'FORBIDDEN', // 403 다른 회원의 예매
  NOT_FOUND: 'NOT_FOUND', // 404
  VALIDATION_FAILED: 'VALIDATION_FAILED', // 400 필수값 누락·형식 오류
  DUPLICATE_LOGIN_ID: 'DUPLICATE_LOGIN_ID', // 409
  DUPLICATE_PHONE: 'DUPLICATE_PHONE', // 409
};
