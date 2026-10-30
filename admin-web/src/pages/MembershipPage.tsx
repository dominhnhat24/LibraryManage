// Import { useEffect, useState } từ react để dùng trong giao diện.
/**
 * Tệp admin-web/src/pages/MembershipPage.tsx: thành phần/module của ứng dụng React. Chú thích giải thích phụ thuộc, state/biến, điều kiện và luồng gọi.
 */
import { useEffect, useState } from 'react';
// Import { Check, ChevronRight, Crown, LoaderCircle, RefreshCw, ShieldCheck, Sparkles } từ lucide-react để dùng trong giao diện.
import { Check, ChevronRight, Crown, LoaderCircle, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
// Import { Link, useNavigate } từ react-router-dom để dùng trong giao diện.
import { Link, useNavigate } from 'react-router-dom';
// Import { useAuth } từ ../auth/AuthContext để dùng trong giao diện.
import { useAuth } from '../auth/AuthContext';
// Import { ReaderShell } từ ../components/ReaderShell để dùng trong giao diện.
import { ReaderShell } from '../components/ReaderShell';
// Import { createReaderSubscription, errorMessage, fetchMySubscription } từ ../api/client để dùng trong giao diện.
import { createReaderSubscription, errorMessage, fetchMySubscription } from '../api/client';
// Import type { Subscription } từ ../types để dùng trong giao diện.
import type { Subscription } from '../types';

// Kiểu PaidPlan mô tả hình dạng dữ liệu để TypeScript kiểm tra lúc biên dịch.
type PaidPlan = 'vip_monthly' | 'premium_monthly';

// Biến plans nhận giá trị từ [ { id: 'free', name: 'FREE', description: 'Gói cơ bản'. const không gán lại; let có thể cập nhật.
const plans = [
  {
    id: 'free',
    name: 'FREE',
    description: 'Gói cơ bản',
    price: 0,
    features: ['Đọc sách miễn phí', 'Quảng cáo khi đọc sách miễn phí', 'Truy cập kho sách cơ bản', 'Đánh dấu và lưu sách yêu thích'],
  },
  {
    id: 'vip_monthly',
    name: 'VIP',
    description: 'Trải nghiệm đọc không quảng cáo',
    price: 10000,
    features: ['Tất cả quyền lợi của gói FREE', 'Đọc sách không quảng cáo', 'Trải nghiệm đọc liền mạch', 'Truy cập nội dung dành cho VIP'],
  },
  {
    id: 'premium_monthly',
    name: 'PREMIUM',
    description: 'Trải nghiệm toàn diện',
    price: 20000,
    features: ['Tất cả quyền lợi của gói FREE & VIP', 'Đọc sách không quảng cáo', 'Tải sách dưới dạng PDF', 'Trải nghiệm đọc liền mạch'],
    featured: true,
  },
] as const;

/**
 * Hàm/thành phần MembershipPage: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
 * Tham số/props: không có tham số.
 * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
 * Gọi tiếp: useAuth, useNavigate, useState, useEffect, navigate, fetchMySubscription, then, setSubscription.
 */
export function MembershipPage() {
  // Biến { user, loading: authLoading } nhận giá trị từ useAuth(). const không gán lại; let có thể cập nhật.
  const { user, loading: authLoading } = useAuth();
  // Biến navigate nhận giá trị từ useNavigate(). const không gán lại; let có thể cập nhật.
  const navigate = useNavigate();
  // Biến [subscription, setSubscription] nhận giá trị từ useState<Subscription | null>(null). const không gán lại; let có thể cập nhật.
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  // Biến [loading, setLoading] nhận giá trị từ useState(true). const không gán lại; let có thể cập nhật.
  const [loading, setLoading] = useState(true);
  // Biến [submitting, setSubmitting] nhận giá trị từ useState<PaidPlan | null>(null). const không gán lại; let có thể cập nhật.
  const [submitting, setSubmitting] = useState<PaidPlan | null>(null);
  // Biến [error, setError] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [error, setError] = useState('');
  // Biến [notice, setNotice] nhận giá trị từ useState(''). const không gán lại; let có thể cập nhật.
  const [notice, setNotice] = useState('');

  // Gọi/thực thi useEffect với đối số để cập nhật logic/giao diện: useEffect(() => { if (authLoading) return; if (!user) { navigate('/login', { rep
  useEffect(() => {
    // if chỉ chạy nhánh này khi điều kiện authLoading đúng.
    if (authLoading) return;
    // if chỉ chạy nhánh này khi điều kiện !user đúng.
    if (!user) {
      // Gọi/thực thi navigate với đối số để cập nhật logic/giao diện: navigate('/login', { replace: true, state: { from: '/membership' } })
      navigate('/login', { replace: true, state: { from: '/membership' } });
      // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: undefined.
      return;
    }
    // Biến active nhận giá trị từ true. const không gán lại; let có thể cập nhật.
    let active = true;
    // Gọi/thực thi fetchMySubscription với đối số để cập nhật logic/giao diện: fetchMySubscription() .then((result) => { if (active) setSubscription(result); }
    fetchMySubscription()
      .then((result) => { if (active) setSubscription(result); })
      .catch((loadError: unknown) => { if (active) setError(errorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: () => { active = false; }.
    return () => { active = false; };
  }, [authLoading, navigate, user]);

  // Biến isPremium nhận giá trị từ user?.role === 'ADMIN' || Boolean(user?.is_premium). const không gán lại; let có thể cập nhật.
  const isPremium = user?.role === 'ADMIN' || Boolean(user?.is_premium);
  // Biến isVip nhận giá trị từ isPremium || Boolean(user?.is_vip). const không gán lại; let có thể cập nhật.
  const isVip = isPremium || Boolean(user?.is_vip);
  // Biến currentPlan nhận giá trị từ isPremium ? 'premium_monthly' : isVip ? 'vip_monthly' :. const không gán lại; let có thể cập nhật.
  const currentPlan = isPremium ? 'premium_monthly' : isVip ? 'vip_monthly' : 'free';
  // Biến pending nhận giá trị từ subscription?.status === 'pending'. const không gán lại; let có thể cập nhật.
  const pending = subscription?.status === 'pending';

  /**
   * Hàm/thành phần choosePlan: xử lý phần giao diện hoặc logic theo tên và trách nhiệm của nó.
   * Tham số/props: plan.
   * Kết quả: trả giá trị hoặc giao diện cho thành phần/nơi gọi.
   * Gọi tiếp: setSubmitting, setError, setNotice, createReaderSubscription, setSubscription, errorMessage.
   */
  async function choosePlan(plan: PaidPlan) {
    // Gọi/thực thi setSubmitting với đối số để cập nhật logic/giao diện: setSubmitting(plan)
    setSubmitting(plan);
    // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError('')
    setError('');
    // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('')
    setNotice('');
    // try gom thao tác có thể lỗi; catch/finally xử lý lỗi hoặc dọn trạng thái.
    try {
      // Biến created nhận giá trị từ await createReaderSubscription(plan). const không gán lại; let có thể cập nhật.
      const created = await createReaderSubscription(plan);
      // Gọi/thực thi setSubscription với đối số để cập nhật logic/giao diện: setSubscription(created)
      setSubscription(created);
      // Gọi/thực thi setNotice với đối số để cập nhật logic/giao diện: setNotice('Đã tạo yêu cầu thành viên. Vui lòng chuyển khoản theo thông tin bên d
      setNotice('Đã tạo yêu cầu thành viên. Vui lòng chuyển khoản theo thông tin bên dưới và chờ xác nhận.');
    } catch (requestError: unknown) {
      // Gọi/thực thi setError với đối số để cập nhật logic/giao diện: setError(errorMessage(requestError))
      setError(errorMessage(requestError));
    } finally {
      // Gọi/thực thi setSubmitting với đối số để cập nhật logic/giao diện: setSubmitting(null)
      setSubmitting(null);
    }
  }

  // Biến statusTitle nhận giá trị từ pending ? 'Yêu cầu thành viên đang chờ xác nhận' : isPr. const không gán lại; let có thể cập nhật.
  const statusTitle = pending
    ? 'Yêu cầu thành viên đang chờ xác nhận'
    : isPremium ? 'Bạn đang sử dụng gói PREMIUM'
      : isVip ? 'Bạn đang sử dụng gói VIP'
        : 'Bạn đang sử dụng gói FREE';

  // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <ReaderShell> <div className="hb-membership-page"> <nav aria-label="Điều hướng p.
  return <ReaderShell>
    <div className="hb-membership-page">
      <nav aria-label="Điều hướng phân cấp" className="hb-membership-breadcrumb"><Link to="/">Trang chủ</Link><ChevronRight size={15} /><span>Gói thành viên</span></nav>
      <div className="hb-membership-intro">
        <div>
          <h1>Gói thành viên HarveyBook</h1>
          <p>Chọn gói phù hợp để tận hưởng trải nghiệm đọc sách tuyệt vời hơn<br className="hidden sm:block" /> và ủng hộ tác giả bạn yêu thích.</p>
        </div>
        <section className="hb-membership-status" aria-live="polite">
          <Crown aria-hidden="true" size={38} strokeWidth={1.5} />
          <div><strong>{statusTitle}</strong><p>{pending ? 'Hoàn tất chuyển khoản theo hướng dẫn để quản trị viên xác nhận.' : 'Nâng cấp để tận hưởng thêm quyền lợi khi đọc sách.'}</p></div>
          <ChevronRight aria-hidden="true" size={22} />
        </section>
      </div>

      {error && <p className="hb-membership-message is-error" role="alert">{error}</p>}
      {notice && <p className="hb-membership-message is-success" role="status">{notice}</p>}

      <div className="hb-membership-plans">
        {plans.map((plan) => {
          // Biến isFeatured nhận giá trị từ 'featured' in plan && plan.featured. const không gán lại; let có thể cập nhật.
          const isFeatured = 'featured' in plan && plan.featured;
          // Biến isCurrent nhận giá trị từ plan.id === currentPlan. const không gán lại; let có thể cập nhật.
          const isCurrent = plan.id === currentPlan;
          // Biến included nhận giá trị từ (plan.id === 'free' && currentPlan !== 'free') || (plan. const không gán lại; let có thể cập nhật.
          const included = (plan.id === 'free' && currentPlan !== 'free')
            || (plan.id === 'vip_monthly' && isPremium);
          // Biến paid nhận giá trị từ plan.id !== 'free'. const không gán lại; let có thể cập nhật.
          const paid = plan.id !== 'free';
          // Biến selectedPlan nhận giá trị từ plan.id === 'vip_monthly' || plan.id === 'premium_month. const không gán lại; let có thể cập nhật.
          const selectedPlan = plan.id === 'vip_monthly' || plan.id === 'premium_monthly' ? plan.id : null;
          // Biến isSubmitting nhận giá trị từ selectedPlan !== null && submitting === selectedPlan. const không gán lại; let có thể cập nhật.
          const isSubmitting = selectedPlan !== null && submitting === selectedPlan;
          // Biến disabled nhận giá trị từ loading || pending || isSubmitting || (paid && (isCurre. const không gán lại; let có thể cập nhật.
          const disabled = loading || pending || isSubmitting || (paid && (isCurrent || included));
          // Biến buttonText nhận giá trị từ isCurrent ? 'Đang sử dụng' : included ? 'Đã bao gồm tro. const không gán lại; let có thể cập nhật.
          const buttonText = isCurrent ? 'Đang sử dụng'
            : included ? 'Đã bao gồm trong gói'
              : pending ? 'Đang chờ xác nhận'
                : isSubmitting ? 'Đang tạo yêu cầu…'
                  : plan.id === 'free' ? 'Gói cơ bản' : `Chọn gói ${plan.name}`;

          // return kết thúc hàm và gửi giá trị về thành phần/nơi gọi: <section className={`hb-membership-plan ${isFeatured ? 'is-featured' : ''}`} key.
          return <section className={`hb-membership-plan ${isFeatured ? 'is-featured' : ''}`} key={plan.id}>
            {isFeatured && <div className="hb-membership-featured"><Crown size={17} fill="currentColor" /> Đề xuất <Sparkles className="ml-auto" size={16} /></div>}
            <div className="hb-membership-plan-body">
              <h2>{plan.name}</h2>
              <p className="hb-membership-plan-description">{plan.description}</p>
              <p className="hb-membership-price"><strong>{plan.price === 0 ? '0' : plan.price.toLocaleString('vi-VN')}<span>đ</span></strong><small>/ tháng</small></p>
              <ul>{plan.features.map((feature) => <li key={feature}><span><Check size={14} strokeWidth={2.5} /></span>{feature}</li>)}</ul>
              <button className={`hb-membership-button ${isFeatured ? 'is-featured' : ''} ${isCurrent ? 'is-current' : ''}`} disabled={disabled} onClick={() => { if (selectedPlan) void choosePlan(selectedPlan); }} type="button">
                {isSubmitting && <LoaderCircle className="animate-spin" size={16} />}{buttonText}
              </button>
            </div>
          </section>;
        })}
      </div>

      {pending && subscription && <section className="hb-membership-payment">
        <div className="hb-membership-payment-heading"><Crown size={21} /><div><h2>Thông tin chuyển khoản</h2><p>Gói {subscription.plan === 'vip_monthly' ? 'VIP' : 'PREMIUM'} · đang chờ quản trị viên xác nhận</p></div></div>
        <dl>
          <div><dt>Số tiền</dt><dd>{(subscription.payment_instructions?.amount_vnd ?? subscription.amount_vnd).toLocaleString('vi-VN')} ₫</dd></div>
          <div><dt>Nội dung chuyển khoản</dt><dd>{subscription.payment_instructions?.transfer_note ?? subscription.transfer_note}</dd></div>
          <div><dt>Ngân hàng</dt><dd>{subscription.payment_instructions?.bank_name || 'Chưa cấu hình'}</dd></div>
          <div><dt>Tài khoản nhận</dt><dd>{subscription.payment_instructions?.bank_account || 'Chưa cấu hình'}{subscription.payment_instructions?.bank_account_name ? ` · ${subscription.payment_instructions.bank_account_name}` : ''}</dd></div>
        </dl>
      </section>}

      {loading && <p className="hb-membership-loading">Đang tải trạng thái thành viên…</p>}
      <section className="hb-membership-benefits">
        <div><span><ShieldCheck size={23} /></span><p><strong>Thanh toán an toàn</strong><small>Mọi giao dịch đều được xác nhận trước khi kích hoạt.</small></p></div>
        <div><span><RefreshCw size={23} /></span><p><strong>Gia hạn linh hoạt</strong><small>Gói thành viên được quản lý theo thời hạn hiển thị.</small></p></div>
        <div><span><Crown size={23} /></span><p><strong>Đọc sách thuận tiện</strong><small>Chọn gói phù hợp với thói quen đọc của bạn.</small></p></div>
      </section>
    </div>
  </ReaderShell>;
}
