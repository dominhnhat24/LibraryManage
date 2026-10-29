import { useEffect, useState } from 'react';
import { Check, ChevronRight, Crown, LoaderCircle, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ReaderShell } from '../components/ReaderShell';
import { createReaderSubscription, errorMessage, fetchMySubscription } from '../api/client';
import type { Subscription } from '../types';

type PaidPlan = 'vip_monthly' | 'premium_monthly';

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

export function MembershipPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<PaidPlan | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true, state: { from: '/membership' } });
      return;
    }
    let active = true;
    fetchMySubscription()
      .then((result) => { if (active) setSubscription(result); })
      .catch((loadError: unknown) => { if (active) setError(errorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, navigate, user]);

  const isPremium = user?.role === 'ADMIN' || Boolean(user?.is_premium);
  const isVip = isPremium || Boolean(user?.is_vip);
  const currentPlan = isPremium ? 'premium_monthly' : isVip ? 'vip_monthly' : 'free';
  const pending = subscription?.status === 'pending';

  async function choosePlan(plan: PaidPlan) {
    setSubmitting(plan);
    setError('');
    setNotice('');
    try {
      const created = await createReaderSubscription(plan);
      setSubscription(created);
      setNotice('Đã tạo yêu cầu thành viên. Vui lòng chuyển khoản theo thông tin bên dưới và chờ xác nhận.');
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(null);
    }
  }

  const statusTitle = pending
    ? 'Yêu cầu thành viên đang chờ xác nhận'
    : isPremium ? 'Bạn đang sử dụng gói PREMIUM'
      : isVip ? 'Bạn đang sử dụng gói VIP'
        : 'Bạn đang sử dụng gói FREE';

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
          const isFeatured = 'featured' in plan && plan.featured;
          const isCurrent = plan.id === currentPlan;
          const included = (plan.id === 'free' && currentPlan !== 'free')
            || (plan.id === 'vip_monthly' && isPremium);
          const paid = plan.id !== 'free';
          const selectedPlan = plan.id === 'vip_monthly' || plan.id === 'premium_monthly' ? plan.id : null;
          const isSubmitting = selectedPlan !== null && submitting === selectedPlan;
          const disabled = loading || pending || isSubmitting || (paid && (isCurrent || included));
          const buttonText = isCurrent ? 'Đang sử dụng'
            : included ? 'Đã bao gồm trong gói'
              : pending ? 'Đang chờ xác nhận'
                : isSubmitting ? 'Đang tạo yêu cầu…'
                  : plan.id === 'free' ? 'Gói cơ bản' : `Chọn gói ${plan.name}`;

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
