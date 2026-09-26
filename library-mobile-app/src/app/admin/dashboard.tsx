import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { adminRequest, formatDate } from '@/lib/admin-api';
import { SearchBar } from '@/components/search-bar';
import { getSession, type AuthSession } from '@/services/api';
import type { BookCopyStatus, BorrowCard, BorrowCardStatus, FineStatus } from '@/types/library';

interface PagedResult<T> {
  data?: T[];
  pagination?: { total?: number; totalItems?: number };
}

interface DashboardData {
  cards: BorrowCard[];
  summary: DashboardSummary;
}

interface DashboardSummary {
  books: number;
  readers: number;
  copies: { total: number; byStatus: Partial<Record<BookCopyStatus, number>> };
  borrowCards: { total: number; byStatus: Partial<Record<BorrowCardStatus, number>>; overdueCopies: number };
  fines: { total: number; totalAmount: number; byStatus: Partial<Record<FineStatus, { count: number; amount: number }>> };
}

type StatusFilter = 'All' | BorrowCardStatus;

const borrowStatuses: StatusFilter[] = [
  'All',
  'Borrowing',
  'PartiallyReturned',
  'Pending',
  'Overdue',
  'Returned',
  'Cancelled',
];

const borrowStatusLabels: Record<BorrowCardStatus, string> = {
  Pending: 'Pending',
  Borrowing: 'Borrowing',
  PartiallyReturned: 'PartiallyReturned',
  Overdue: 'Overdue',
  Returned: 'Returned',
  Cancelled: 'Cancelled',
};

const copyStatusLabels: Record<BookCopyStatus, string> = {
  Available: 'Available',
  Borrowed: 'Borrowed',
  Damaged: 'Damaged',
  Lost: 'Lost',
  Maintenance: 'Maintenance',
};

const copyColors: Record<BookCopyStatus, string> = {
  Available: '#65A879',
  Borrowed: '#5594B0',
  Damaged: '#E7A342',
  Lost: '#D9685C',
  Maintenance: '#8D79AE',
};

const copyStatuses: BookCopyStatus[] = ['Available', 'Borrowed', 'Damaged', 'Lost', 'Maintenance'];
const emptyBorrowCards: BorrowCard[] = [];

function unwrapList<T>(response: PagedResult<T> | T[]): { items: T[]; total: number } {
  if (Array.isArray(response)) return { items: response, total: response.length };
  const items = response.data ?? [];
  return { items, total: response.pagination?.totalItems ?? response.pagination?.total ?? items.length };
}

function readerName(readerId: BorrowCard['readerId']): string {
  if (typeof readerId === 'string') return 'Độc giả';
  if (readerId && typeof readerId === 'object' && typeof readerId.full_name === 'string') {
    return readerId.full_name;
  }
  return 'Độc giả';
}

function borrowedBookTitles(card: BorrowCard): string {
  const details = Array.isArray(card.details) ? card.details : [];
  return details
    .map(({ bookId }) => {
      if (typeof bookId === 'string') return 'Sách mượn';
      if (bookId && typeof bookId === 'object' && typeof bookId.title === 'string') return bookId.title;
      return 'Sách mượn';
    })
    .filter(Boolean)
    .slice(0, 2)
    .join(', ') || 'Chưa có thông tin';
}

function isOverdue(card: BorrowCard): boolean {
  return card.status === 'Overdue'
    || (['Borrowing', 'PartiallyReturned'].includes(card.status) && new Date(card.dueDate).getTime() < Date.now());
}

export default function AdminDashboardScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [librarian, setLibrarian] = useState<AuthSession | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [cardsResponse, summary, session] = await Promise.all([
        adminRequest<PagedResult<BorrowCard> | BorrowCard[]>('/borrow-cards?limit=100'),
        adminRequest<DashboardSummary>('/dashboard'),
        getSession(),
      ]);
      const cardsResult = unwrapList(cardsResponse);
      setData({
        cards: cardsResult.items,
        summary,
      });
      setLibrarian(session);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải dữ liệu tổng quan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadDashboard(), 0);
    return () => clearTimeout(timer);
  }, [loadDashboard]);

  const cards = data?.cards ?? emptyBorrowCards;
  const overdueCards = useMemo(() => cards.filter(isOverdue), [cards]);
  const recentCards = useMemo(() => [...cards].slice(0, 7), [cards]);
  const filteredRecent = recentCards.filter((card) => {
    const normalized = search.trim().toLocaleLowerCase();
    const matchesSearch = !normalized
      || card._id.toLocaleLowerCase().includes(normalized)
      || readerName(card.readerId).toLocaleLowerCase().includes(normalized)
      || borrowedBookTitles(card).toLocaleLowerCase().includes(normalized);
    return matchesSearch && (statusFilter === 'All' || card.status === statusFilter);
  });
  const fineTotal = data?.summary.fines.totalAmount ?? 0;
  const totalCopies = data?.summary.copies.total ?? 0;
  const borrowedCopies = data?.summary.copies.byStatus.Borrowed ?? 0;
  const overdueCopies = data?.summary.borrowCards.overdueCopies ?? 0;
  const updatedAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const metrics = [
    { icon: '▤', title: 'Đầu sách', value: (data?.summary.books ?? 0).toLocaleString('vi-VN'), note: 'Tổng số đầu sách', accent: '#E97824', tint: '#FFF3E0' },
    { icon: '▣', title: 'Bản sao', value: totalCopies.toLocaleString('vi-VN'), note: `${(data?.summary.copies.byStatus.Available ?? 0).toLocaleString('vi-VN')} bản có sẵn`, accent: '#508AA1', tint: '#EAF4F7' },
    { icon: '♙', title: 'Độc giả', value: (data?.summary.readers ?? 0).toLocaleString('vi-VN'), note: 'Tổng số độc giả', accent: '#7582A0', tint: '#EEF0F6' },
    { icon: '⇄', title: 'Đang mượn', value: borrowedCopies.toLocaleString('vi-VN'), note: 'Bản sao đang được mượn', accent: '#D48B37', tint: '#FFF4E5' },
    { icon: '◉', title: 'Tiền phạt', value: formatCompactMoney(fineTotal), note: `${(data?.summary.fines.byStatus.Pending?.count ?? 0).toLocaleString('vi-VN')} khoản chưa thanh toán`, accent: '#C9685A', tint: '#FBEDEA' },
  ] as const;

  const exportReport = async () => {
    setExporting(true);
    setError(null);
    setExportNotice(null);
    try {
      const [summary, cardsResponse] = await Promise.all([
        adminRequest<DashboardSummary>('/dashboard'),
        adminRequest<PagedResult<BorrowCard> | BorrowCard[]>('/borrow-cards?limit=100'),
      ]);
      const reportCards = unwrapList(cardsResponse).items;
      const rows = [
        ['Loại dữ liệu', 'Tên', 'Giá trị'],
        ['Thống kê', 'Đầu sách', String(summary.books)],
        ['Thống kê', 'Độc giả', String(summary.readers)],
        ['Thống kê', 'Tổng bản sao', String(summary.copies.total)],
        ['Thống kê', 'Bản sao đang mượn', String(summary.copies.byStatus.Borrowed ?? 0)],
        ['Thống kê', 'Bản sao quá hạn', String(summary.borrowCards.overdueCopies)],
        ['Thống kê', 'Tiền phạt', String(summary.fines.totalAmount)],
        [],
        ['Phiếu mượn', 'Độc giả', 'Sách', 'Hạn trả', 'Trạng thái'],
        ...reportCards.map((card) => [
          card._id,
          readerName(card.readerId),
          borrowedBookTitles(card),
          formatDate(card.dueDate),
          card.status,
        ]),
      ];
      const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n')}`;
      const filename = `readify-report-${new Date().toISOString().slice(0, 10)}.csv`;
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        setExportNotice(`Đã tải xuống ${filename}.`);
      } else {
        await Share.share({ title: filename, message: csv });
        setExportNotice('Đã mở bảng chia sẻ báo cáo CSV.');
      }
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Không thể xuất báo cáo.');
    } finally {
      setExporting(false);
    }
  };

  const openQuickAction = (action: 'return' | 'book' | 'reader' | 'fine') => {
    if (action === 'book') router.push({ pathname: '/admin/books_inventory', params: { action: 'create' } });
    else if (action === 'reader') router.push({ pathname: '/admin/reader_management', params: { action: 'create' } });
    else if (action === 'fine') router.push('/admin/fines');
    else router.push('/admin/borrow_cards');
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.page}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadDashboard(true)} colors={['#FF9F43']} />}>
      <View style={[styles.pageHeading, !isWide && styles.pageHeadingStacked]}>
        <View style={styles.headingCopy}>
          <Text style={styles.greeting}>Chào buổi sáng, {librarian?.full_name ?? 'Thủ thư'}</Text>
          <Text style={styles.pageSubtitle}>Tổng quan vận hành thư viện hôm nay - cập nhật lúc {updatedAt}</Text>
        </View>
        <View style={styles.headingActions}>
          <Pressable style={styles.branchButton} onPress={() => setError('Đang xem toàn bộ chi nhánh.')}>
            <Text style={styles.branchIcon}>▣</Text><Text style={styles.branchText}>Tất cả chi nhánh</Text><Text style={styles.chevron}>⌄</Text>
          </Pressable>
          <Pressable disabled={exporting} style={styles.exportButton} onPress={() => void exportReport()}>
            {exporting ? <ActivityIndicator size="small" color="#475569" /> : <Text style={styles.exportIcon}>⇩</Text>}<Text style={styles.exportText}>{exporting ? 'Đang xuất...' : 'Xuất báo cáo'}</Text>
          </Pressable>
        </View>
      </View>

      {exportNotice && <View style={styles.exportNotice}><Text style={styles.exportNoticeText}>{exportNotice}</Text></View>}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => setError(null)}><Text style={styles.dismiss}>×</Text></Pressable>
        </View>
      )}

      <View style={styles.metrics}>
        {metrics.map((metric) => (
          <MetricCard
            key={metric.title}
            icon={metric.icon}
            title={metric.title}
            value={metric.value}
            note={metric.note}
            accent={metric.accent}
            tint={metric.tint}
          />
        ))}
      </View>

      {loading ? (
        <View style={styles.statePanel}>
          <ActivityIndicator size="large" color="#FF9F43" />
          <Text style={styles.stateMessage}>Đang tải dữ liệu tổng quan...</Text>
        </View>
      ) : error && !data ? (
        <View style={styles.statePanel}>
          <Text style={styles.stateMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadDashboard()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : data ? (
        <>
          <View style={[styles.contentGrid, !isWide && styles.contentGridStacked]}>
            <View style={styles.recentPanel}>
              <View style={styles.panelHeading}>
                <View>
                  <Text style={styles.panelTitle}>Mượn / trả gần đây</Text>
                  <Text style={styles.panelSubtitle}>Danh sách phiếu mượn mới nhất</Text>
                </View>
                <Pressable style={styles.viewAllButton} onPress={() => router.push('/admin/borrow_cards')}>
                  <Text style={styles.viewAllText}>Xem tất cả</Text>
                </Pressable>
              </View>

              <View style={styles.tableTools}>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Tìm mã phiếu, độc giả..."
                  placeholderTextColor="#94A3B8"
                  containerStyle={styles.tableSearchBox}
                  inputStyle={styles.tableSearch}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFilters}>
                  {borrowStatuses.map((status) => (
                    <Pressable
                      key={status}
                      style={[styles.statusFilter, statusFilter === status && styles.statusFilterActive]}
                      onPress={() => setStatusFilter(status)}>
                      <Text style={[styles.statusFilterText, statusFilter === status && styles.statusFilterTextActive]}>
                        {status === 'All' ? 'Tất cả' : status}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeadingText, styles.idColumn]}>MÃ PHIẾU</Text>
                  <Text style={[styles.tableHeadingText, styles.readerColumn]}>ĐỘC GIẢ</Text>
                  <Text style={[styles.tableHeadingText, styles.bookColumn]}>SÁCH</Text>
                  <Text style={[styles.tableHeadingText, styles.dueColumn]}>HẠN TRẢ</Text>
                  <Text style={[styles.tableHeadingText, styles.statusColumn]}>TRẠNG THÁI</Text>
                </View>
                {filteredRecent.length > 0 ? filteredRecent.map((card) => (
                  <BorrowRow key={card._id} card={card} wide={isWide} />
                )) : (
                  <View style={styles.emptyRows}>
                    <Text style={styles.emptyText}>
                      {search || statusFilter !== 'All' ? 'Không có phiếu phù hợp với bộ lọc.' : 'Chưa có phiếu mượn để hiển thị.'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.sideColumn}>
              <View style={styles.panel}>
                <View style={styles.panelHeading}>
                  <View>
                    <Text style={styles.panelTitle}>Cảnh báo quá hạn</Text>
                    <Text style={styles.panelSubtitle}>{overdueCopies.toLocaleString('vi-VN')} bản sao cần xử lý</Text>
                  </View>
                  <View style={styles.alertCount}><Text style={styles.alertCountText}>{overdueCopies.toLocaleString('vi-VN')}</Text></View>
                </View>
                {overdueCards.length > 0 ? overdueCards.slice(0, 3).map((card, index) => (
                  <View style={styles.overdueRow} key={card._id}>
                    <View style={[styles.overdueIcon, index % 2 === 0 ? styles.overdueIconOrange : styles.overdueIconRed]}>
                      <Text style={styles.overdueBookIcon}>▤</Text>
                    </View>
                    <View style={styles.overdueCopy}>
                      <Text numberOfLines={1} style={styles.overdueBook}>{borrowedBookTitles(card)}</Text>
                      <Text numberOfLines={1} style={styles.overdueReader}>{readerName(card.readerId)} · #{card._id.slice(-6).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.overdueAge}>{overdueDays(card.dueDate)} ngày</Text>
                  </View>
                )) : (
                  <Text style={styles.noOverdue}>Không có phiếu quá hạn từ dữ liệu hiện tại.</Text>
                )}
                <Pressable style={styles.overdueAction} onPress={() => router.push('/admin/borrow_cards')}>
                  <Text style={styles.overdueActionText}>Xem danh sách quá hạn</Text>
                  <Text style={styles.overdueActionArrow}>→</Text>
                </Pressable>
              </View>

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Thao tác nhanh</Text>
                <View style={styles.quickGrid}>
                  <QuickAction icon="↻" label="Quét trả sách" onPress={() => openQuickAction('return')} />
                  <QuickAction icon="▤" label="Thêm đầu sách" onPress={() => openQuickAction('book')} />
                  <QuickAction icon="♙" label="Tạo độc giả" onPress={() => openQuickAction('reader')} />
                  <QuickAction icon="◉" label="Ghi nhận phạt" onPress={() => openQuickAction('fine')} />
                </View>
              </View>

              <View style={styles.panel}>
                <View style={styles.panelHeading}>
                  <View>
                    <Text style={styles.panelTitle}>Tổng tiền phạt</Text>
                    <Text style={styles.panelSubtitle}>Số liệu tổng hợp từ toàn bộ khoản phạt</Text>
                  </View>
                  <Text style={styles.fineTotal}>{formatCompactMoney(fineTotal)}</Text>
                </View>
                <View style={styles.fineSummary}>
                  <FineSummary label="Đang chờ" count={data.summary.fines.byStatus.Pending?.count ?? 0} color="#FF9F43" />
                  <FineSummary label="Đã thu" count={data.summary.fines.byStatus.Paid?.count ?? 0} color="#65A879" />
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.bottomGrid, !isWide && styles.bottomGridStacked]}>
            <View style={styles.panel}>
              <View style={styles.panelHeading}>
                <View>
                  <Text style={styles.panelTitle}>Trạng thái kho sách</Text>
                  <Text style={styles.panelSubtitle}>{totalCopies.toLocaleString('vi-VN')} bản sao được đồng bộ</Text>
                </View>
                <Text style={styles.updatedLabel}>●  Vừa cập nhật</Text>
              </View>
              <View style={styles.progressTrack}>
                {copyStatuses.map((status) => (
                  <View
                    key={status}
                    style={[
                      styles.progressSegment,
                      {
                        backgroundColor: copyColors[status],
                        flex: data.summary.copies.byStatus[status] || 0.001,
                      },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.inventoryLegend}>
                {copyStatuses.map((status) => (
                  <View key={status} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: copyColors[status] }]} />
                    <Text style={styles.legendLabel}>{copyStatusLabels[status]}</Text>
                    <Text style={styles.legendValue}>{(data.summary.copies.byStatus[status] ?? 0).toLocaleString('vi-VN')}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.panel, styles.systemPanel]}>
              <Text style={styles.panelTitle}>Mẫu trạng thái hệ thống</Text>
              <Text style={styles.panelSubtitle}>Quy ước màu sắc trạng thái</Text>
              <View style={styles.systemBadges}>
                <SystemBadge label="Available" color="#E7F3E9" textColor="#39784C" />
                <SystemBadge label="Borrowing" color="#E8F1F8" textColor="#3D718F" />
                <SystemBadge label="Pending" color="#FFF3E0" textColor="#B95E12" />
                <SystemBadge label="Overdue" color="#FCE9E6" textColor="#B7463C" />
                <SystemBadge label="Returned" color="#E7F3E9" textColor="#39784C" />
                <SystemBadge label="Cancelled" color="#EEF0F3" textColor="#687383" />
              </View>
            </View>
          </View>
        </>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Readify · Hệ thống quản lý thư viện</Text>
        <Text style={styles.footerText}>Node.js · MongoDB</Text>
      </View>
    </ScrollView>
  );
}

function MetricCard({
  icon,
  title,
  value,
  note,
  accent,
  tint,
}: {
  icon: string;
  title: string;
  value: string;
  note: string;
  accent: string;
  tint: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Text style={styles.metricTitle}>{title}</Text>
        <View style={[styles.metricIcon, { backgroundColor: tint }]}>
          <Text style={[styles.metricIconText, { color: accent }]}>{icon}</Text>
        </View>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.metricNote}>{note}</Text>
    </View>
  );
}

function BorrowRow({ card, wide }: { card: BorrowCard; wide: boolean }) {
  const bookCount = Array.isArray(card.details) ? card.details.length : 0;
  const bookSummary = `${bookCount} cuốn · ${borrowedBookTitles(card)}`;
  return (
    <View style={[styles.borrowRow, !wide && styles.borrowRowStacked]}>
      {wide ? (
        <>
          <Text numberOfLines={1} style={[styles.borrowId, styles.idColumn]}>BC-{card._id.slice(-6).toUpperCase()}</Text>
          <Text numberOfLines={1} style={[styles.borrowReader, styles.readerColumn]}>{readerName(card.readerId)}</Text>
          <Text numberOfLines={1} style={[styles.borrowBook, styles.bookColumn]}>{bookSummary}</Text>
          <Text style={[styles.borrowDue, styles.dueColumn]}>{formatDate(card.dueDate)}</Text>
          <View style={styles.statusColumn}><StatusBadge status={card.status} /></View>
        </>
      ) : (
        <>
          <View style={styles.mobileRowHeading}>
            <Text style={styles.borrowId}>BC-{card._id.slice(-6).toUpperCase()}</Text>
            <StatusBadge status={card.status} />
          </View>
          <Text numberOfLines={1} style={styles.borrowReader}>{readerName(card.readerId)}</Text>
          <Text numberOfLines={1} style={styles.borrowBook}>{bookSummary}</Text>
          <Text style={styles.borrowDue}>Hạn trả: {formatDate(card.dueDate)}</Text>
        </>
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: BorrowCardStatus }) {
  const colorStyle = status === 'Borrowing'
    ? styles.statusBlue
    : status === 'PartiallyReturned' || status === 'Pending'
      ? styles.statusOrange
      : status === 'Overdue'
        ? styles.statusRed
        : status === 'Returned'
          ? styles.statusGreen
          : styles.statusGray;
  return (
    <View style={[styles.statusBadge, colorStyle]}>
      <Text style={styles.statusText}>{borrowStatusLabels[status]}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickIcon}><Text style={styles.quickIconText}>{icon}</Text></View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function FineSummary({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={styles.fineSummaryRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.fineSummaryLabel}>{label}</Text>
      <Text style={styles.fineSummaryCount}>{count} khoản</Text>
    </View>
  );
}

function SystemBadge({ label, color, textColor }: { label: string; color: string; textColor: string }) {
  return <View style={[styles.systemBadge, { backgroundColor: color }]}><Text style={[styles.systemBadgeText, { color: textColor }]}>{label}</Text></View>;
}

function formatCompactMoney(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr`;
  return `${amount.toLocaleString('vi-VN')}đ`;
}

function overdueDays(dueDate: string): number {
  return Math.max(1, Math.ceil((Date.now() - new Date(dueDate).getTime()) / 86_400_000));
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8F9FA' },
  page: { width: '100%', maxWidth: 1600, alignSelf: 'center', paddingHorizontal: 26, paddingTop: 22, paddingBottom: 18, gap: 17 },
  pageHeading: { minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  pageHeadingStacked: { alignItems: 'flex-start', flexDirection: 'column' },
  headingCopy: { gap: 5 },
  greeting: { color: '#1F2937', fontSize: 22, fontWeight: '700' },
  pageSubtitle: { color: '#84909F', fontSize: 13 },
  headingActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  branchButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  branchIcon: { color: '#64748B', fontSize: 12 },
  branchText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  chevron: { color: '#94A3B8', fontSize: 13 },
  exportButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  exportIcon: { color: '#64748B', fontSize: 15 },
  exportText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  exportNotice: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 2, borderWidth: 1, borderColor: '#B8DFC4', backgroundColor: '#EAF6EE' },
  exportNoticeText: { color: '#277247', fontSize: 12, fontWeight: '600' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 2, borderWidth: 1, borderColor: '#F2C5BE', backgroundColor: '#FFF4F1' },
  errorText: { flex: 1, color: '#A94438', fontSize: 12 },
  dismiss: { color: '#A94438', fontSize: 20, paddingHorizontal: 5 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { flex: 1, minWidth: 170, minHeight: 112, padding: 14, borderRadius: 2, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', elevation: 2 },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricTitle: { color: '#7B8794', fontSize: 13, fontWeight: '600' },
  metricIcon: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  metricIconText: { fontSize: 15, fontWeight: '700' },
  metricValue: { color: '#1F2937', fontSize: 25, fontWeight: '800', marginTop: 8 },
  metricNote: { color: '#96A0AD', fontSize: 11, marginTop: 4 },
  statePanel: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, borderRadius: 2, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', elevation: 2 },
  stateMessage: { color: '#64748B', fontSize: 12, textAlign: 'center' },
  retryButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 4, backgroundColor: '#FF9F43' },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  contentGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  contentGridStacked: { flexDirection: 'column' },
  recentPanel: { flex: 7, minWidth: 0, padding: 15, borderRadius: 2, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', elevation: 2 },
  sideColumn: { flex: 3, minWidth: 250, gap: 12 },
  panel: { padding: 15, borderRadius: 2, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', elevation: 2 },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  panelTitle: { color: '#273444', fontSize: 13, fontWeight: '700' },
  panelSubtitle: { color: '#94A0AE', fontSize: 11, marginTop: 4 },
  viewAllButton: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  viewAllText: { color: '#536273', fontSize: 9, fontWeight: '700' },
  tableTools: { marginTop: 13, marginBottom: 10, gap: 9 },
  tableSearchBox: { minHeight: 38, marginBottom: 10 },
  tableSearch: { paddingVertical: 4, fontSize: 12 },
  statusFilters: { alignItems: 'center', gap: 6 },
  statusFilter: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  statusFilterActive: { borderColor: '#FF9F43', backgroundColor: '#FFF3E0' },
  statusFilterText: { color: '#687586', fontSize: 11, fontWeight: '600' },
  statusFilterTextActive: { color: '#B94E0C' },
  table: { overflow: 'hidden', borderRadius: 2, borderWidth: 1, borderColor: '#E9EDF2' },
  tableHeader: { minHeight: 34, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E9EDF2' },
  tableHeadingText: { color: '#8994A2', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  idColumn: { width: '16%' },
  readerColumn: { width: '21%' },
  bookColumn: { flex: 1, minWidth: 70 },
  dueColumn: { width: 82 },
  statusColumn: { width: 124, alignItems: 'flex-start' },
  borrowRow: { minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  borrowRowStacked: { alignItems: 'flex-start', flexDirection: 'column', gap: 5, paddingVertical: 9 },
  mobileRowHeading: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  borrowId: { color: '#D77321', fontSize: 11, fontWeight: '800' },
  borrowReader: { color: '#3D4A58', fontSize: 11 },
  borrowBook: { color: '#657182', fontSize: 11 },
  borrowDue: { color: '#697586', fontSize: 11 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 2 },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusBlue: { backgroundColor: '#E8F1F8' },
  statusOrange: { backgroundColor: '#FFF3E0' },
  statusRed: { backgroundColor: '#FCE9E6' },
  statusGreen: { backgroundColor: '#E7F3E9' },
  statusGray: { backgroundColor: '#EEF0F3' },
  emptyRows: { minHeight: 90, alignItems: 'center', justifyContent: 'center', padding: 16 },
  emptyText: { color: '#8B96A3', fontSize: 11, textAlign: 'center' },
  alertCount: { minWidth: 29, height: 27, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderRadius: 6, borderWidth: 1, borderColor: '#F1C5BE', backgroundColor: '#FFF3F0' },
  alertCountText: { color: '#B74537', fontSize: 11, fontWeight: '800' },
  overdueRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 9, padding: 8, borderRadius: 2, borderWidth: 1, borderColor: '#F2D5D0', backgroundColor: '#FFFCFB' },
  overdueIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  overdueIconOrange: { backgroundColor: '#FFF1DF' },
  overdueIconRed: { backgroundColor: '#FBE9E6' },
  overdueBookIcon: { color: '#D66B35', fontSize: 15 },
  overdueCopy: { flex: 1, minWidth: 0 },
  overdueBook: { color: '#3C4957', fontSize: 11, fontWeight: '700' },
  overdueReader: { color: '#909AA6', fontSize: 10, marginTop: 3 },
  overdueAge: { color: '#B74B3C', fontSize: 10, fontWeight: '700' },
  noOverdue: { paddingVertical: 16, color: '#7E8B98', fontSize: 10, lineHeight: 16 },
  overdueAction: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#FFF3E0' },
  overdueActionText: { color: '#AD4D0D', fontSize: 9, fontWeight: '700' },
  overdueActionArrow: { color: '#AD4D0D', fontSize: 13 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quickAction: { width: '47%', minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1, borderColor: '#E8ECF0', backgroundColor: '#FFFFFF' },
  quickIcon: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#FFF3E0' },
  quickIconText: { color: '#E97824', fontSize: 14, fontWeight: '700' },
  quickLabel: { flexShrink: 1, color: '#526071', fontSize: 11, fontWeight: '600' },
  fineTotal: { color: '#B95D20', fontSize: 17, fontWeight: '800' },
  fineSummary: { gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EDF0F3' },
  fineSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  fineSummaryLabel: { flex: 1, color: '#718091', fontSize: 9 },
  fineSummaryCount: { color: '#4B5969', fontSize: 9, fontWeight: '700' },
  bottomGrid: { flexDirection: 'row', alignItems: 'stretch', gap: 14 },
  bottomGridStacked: { flexDirection: 'column' },
  updatedLabel: { color: '#6B9878', fontSize: 9, fontWeight: '600' },
  progressTrack: { height: 11, flexDirection: 'row', overflow: 'hidden', marginTop: 17, borderRadius: 5, backgroundColor: '#EEF1F4' },
  progressSegment: { height: '100%' },
  inventoryLegend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 17, rowGap: 10, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLabel: { color: '#718091', fontSize: 11 },
  legendValue: { color: '#465465', fontSize: 11, fontWeight: '700' },
  systemPanel: { flex: 1, minWidth: 250 },
  systemBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  systemBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  systemBadgeText: { fontSize: 8, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingTop: 3 },
  footerText: { color: '#A0A9B4', fontSize: 9 },
});
