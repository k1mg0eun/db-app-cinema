import { formatDateTime, formatTime, formatWon, parseDateTime } from '../lib/datetime.js';
import Poster from '../components/Poster.jsx';
import RatingBadge from '../components/RatingBadge.jsx';

export const seatsText = (tickets) => tickets.map((t) => `${t.seat_row}${t.seat_col}`).join(', ');

// 백엔드는 `status`로 내려준다. (예전 목업·문서의 `reservation_status`도 받아 둔다)
export const statusOf = (r) => r.status ?? r.reservation_status ?? 'CONFIRMED';
export const isCancelled = (r) => statusOf(r) === 'CANCELLED';

export const STATUS_LABEL = { CONFIRMED: '예매 완료', CANCELLED: '예매 취소' };
export const canCancel = (r) => !isCancelled(r) && parseDateTime(r.schedule.start_time) > new Date();

// 예매 1건 (좌석이 여러 개여도 한 건으로 묶어서 표시)
export default function ReservationCard({ reservation, onCancel }) {
  const { schedule, tickets } = reservation;
  const cancelled = isCancelled(reservation);
  const movie = { title: schedule.movie_title, poster_url: schedule.poster_url };

  return (
    <article className={`resv ${cancelled ? 'resv-cancelled' : ''}`}>
      <Poster movie={movie} className="poster-thumb" />
      <div className="resv-body">
        <p className="resv-no">
          예매번호 {reservation.reservation_id}
          <span className={`status-tag ${cancelled ? 'status-cancelled' : 'status-confirmed'}`}>
            {STATUS_LABEL[statusOf(reservation)] ?? statusOf(reservation)}
          </span>
        </p>
        <h2 className="resv-title">
          <RatingBadge rating={schedule.age_rating} />
          {schedule.movie_title}
        </h2>
        <table className="info-table">
          <tbody>
            <tr>
              <th scope="row">상영일시</th>
              <td>
                {formatDateTime(schedule.start_time)} ~ {formatTime(schedule.end_time)}
              </td>
            </tr>
            <tr>
              <th scope="row">상영관</th>
              <td>{schedule.screen_name}</td>
            </tr>
            <tr>
              <th scope="row">좌석</th>
              <td>
                {seatsText(tickets)} ({tickets.length}명)
              </td>
            </tr>
            <tr>
              <th scope="row">예매일시</th>
              <td>{formatDateTime(reservation.reserved_at)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="resv-price">
        <span>{cancelled ? '취소 금액' : '결제 금액'}</span>
        <strong>{formatWon(reservation.total_price)}</strong>
        {onCancel && canCancel(reservation) && (
          <button type="button" className="btn btn-outline btn-sm resv-cancel" onClick={() => onCancel(reservation)}>
            예매 취소
          </button>
        )}
      </div>
    </article>
  );
}
