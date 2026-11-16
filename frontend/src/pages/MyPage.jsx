import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { ERROR } from '../api/errors.js';
import { useAuth } from '../auth.jsx';
import { useAsync } from '../lib/useAsync.js';
import { formatDate, formatDateTime, formatWon } from '../lib/datetime.js';
import Modal from '../components/Modal.jsx';
import { ErrorBox, Loading } from '../components/Status.jsx';
import ReservationCard, { isCancelled, seatsText } from './ReservationCard.jsx';

export default function MyPage() {
  const { member } = useAuth();
  const { data: list, error, loading, reload } = useAsync(() => api.getMyReservations(), []);
  const [target, setTarget] = useState(null); // 취소하려는 예매
  const [done, setDone] = useState(null); // 방금 취소한 예매번호

  return (
    <section>
      <h1 className="page-title">마이페이지</h1>
      <dl className="profile">
        <div>
          <dt>이름</dt>
          <dd>{member.name}</dd>
        </div>
        <div>
          <dt>아이디</dt>
          <dd>{member.login_id}</dd>
        </div>
        <div>
          <dt>생년월일</dt>
          <dd>{formatDate(member.birth_date)}</dd>
        </div>
      </dl>

      <h2 className="section-title">
        예매 내역 {list && <span className="count">{list.length}건</span>}
        {list && list.some(isCancelled) && (
          <span className="count-sub">
            예매 완료 {list.filter((r) => !isCancelled(r)).length} · 취소 {list.filter(isCancelled).length}
          </span>
        )}
      </h2>
      {done && (
        <p className="notice notice-done" role="status">
          예매번호 {done}의 예매를 취소했습니다. 좌석은 다른 관객이 다시 예매할 수 있습니다.
        </p>
      )}
      {loading && !list && <Loading />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {list && list.length === 0 && (
        <div className="empty">
          <p>예매 내역이 없습니다.</p>
          <Link to="/movies" className="btn btn-primary">
            상영작 보기
          </Link>
        </div>
      )}
      {list && list.length > 0 && (
        <ul className="ticket-list">
          {list.map((r) => (
            <li key={r.reservation_id}>
              <ReservationCard
                reservation={r}
                onCancel={(res) => {
                  setDone(null);
                  setTarget(res);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {target && (
        <CancelModal
          reservation={target}
          onClose={() => setTarget(null)}
          onStale={reload}
          onCancelled={(id) => {
            setTarget(null);
            setDone(id);
            reload();
          }}
        />
      )}
    </section>
  );
}

// 이미 취소됐거나 상영이 시작돼서 목록이 낡은 경우: 안내만 띄우고 목록을 새로 받는다
const STALE_CODES = [ERROR.ALREADY_CANCELLED, ERROR.SCHEDULE_STARTED];

function CancelModal({ reservation, onClose, onCancelled, onStale }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { schedule, tickets } = reservation;

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await api.cancelReservation(reservation.reservation_id);
      onCancelled(reservation.reservation_id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
      if (STALE_CODES.includes(err.code)) onStale();
    }
  }

  return (
    <Modal title="예매 취소" onClose={busy ? undefined : onClose}>
      <dl className="receipt">
        <div>
          <dt>예매번호</dt>
          <dd>{reservation.reservation_id}</dd>
        </div>
        <div>
          <dt>영화</dt>
          <dd>{schedule.movie_title}</dd>
        </div>
        <div>
          <dt>상영일시</dt>
          <dd>{formatDateTime(schedule.start_time)}</dd>
        </div>
        <div>
          <dt>좌석</dt>
          <dd>{seatsText(tickets)}</dd>
        </div>
        <div className="receipt-total">
          <dt>취소 금액</dt>
          <dd>{formatWon(reservation.total_price)}</dd>
        </div>
      </dl>
      <p className="muted small">
        좌석 {tickets.length}석이 모두 함께 취소되며 되돌릴 수 없습니다. 다시 보려면 새로 예매해야 합니다.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
          돌아가기
        </button>
        <button type="button" className="btn btn-danger" onClick={confirm} disabled={busy}>
          {busy ? '취소하는 중…' : '예매 취소하기'}
        </button>
      </div>
    </Modal>
  );
}
