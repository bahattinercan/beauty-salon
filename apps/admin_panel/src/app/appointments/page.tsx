"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import PageHeader from "@/components/shell/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Dialog from "@/components/ui/Dialog";
import Pagination from "@/components/ui/Pagination";
import { StatusBadge, APPOINTMENT_STATUS, localizeStatusMap } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/States";
import FilterBar from "@/components/ui/FilterBar";
import FilterChips from "@/components/ui/FilterChips";
import AppointmentActions, {
  type AppointmentPendingAction,
} from "@/components/appointments/AppointmentActions";
import AppointmentDetailDialog from "@/components/appointments/AppointmentDetailDialog";
import useDebouncedValue from "@/lib/useDebouncedValue";
import type { Locale } from "@/lib/i18n";
import { useI18n } from "@/providers/LocaleProvider";
import type { AppointmentStatus } from "@/lib/enums";
import {
  APPOINTMENT_SORT_OPTIONS,
  APPOINTMENT_STATUS_FILTERS,
  APPOINTMENTS_PAGE_SIZES,
  DATE_PRESET_OPTIONS,
  DEFAULT_APPOINTMENTS_QUERY,
  PAGE_SIZE_STORAGE_KEY,
  STATUS_LABEL_KEYS,
  activeChips,
  buildAppointmentsQuery,
  normalizeQuery,
  parseAppointmentsQuery,
  toApiSearchParams,
  type AppointmentStatusFilter,
  type AppointmentsQueryState,
} from "@/lib/appointmentsQuery";

interface ApiAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  customer?: { fullName: string; email: string };
  salon?: { name: string };
  staff?: { fullName: string };
  service?: { name: string; price: number };
  note?: string | null;
  cancellationReason?: string | null;
  createdAt?: string;
}

interface AppointmentsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Filtrelerden bağımsız global sayaçlar (AP-008 §5.2: sekmeler `meta.counts`tan). */
  counts?: Partial<Record<AppointmentStatusFilter, number>>;
  /** Filtre select'lerinin global kaynağı (randevularda geçen salon/personel). */
  salons?: { id: string; name: string }[];
  staff?: { id: string; fullName: string }[];
}

interface ApiResponse {
  success: boolean;
  data: { data: ApiAppointment[]; meta: AppointmentsMeta };
}

/** Satır aksiyonu → API durumu ve onay metinleri. `confirm` onay istemez. */
type StatusActionKey = "confirm" | "complete" | "noShow" | "cancel";

/**
 * `keyPrefix` altında dört i18n yaprağı var: `verb` (onay cümlesindeki eylem),
 * `title` (onay diyalogu başlığı), `label` (onay butonu), `success` (bildirim).
 */
const STATUS_ACTIONS: Record<
  StatusActionKey,
  {
    status: AppointmentStatus;
    keyPrefix: string;
    needsConfirm: boolean;
    variant: "primary" | "danger";
  }
> = {
  confirm: {
    status: "CONFIRMED",
    keyPrefix: "appointments.statusActions.confirm",
    needsConfirm: false,
    variant: "primary",
  },
  complete: {
    status: "COMPLETED",
    keyPrefix: "appointments.statusActions.complete",
    needsConfirm: true,
    variant: "primary",
  },
  noShow: {
    status: "NO_SHOW",
    keyPrefix: "appointments.statusActions.noShow",
    needsConfirm: true,
    variant: "primary",
  },
  cancel: {
    status: "CANCELLED",
    keyPrefix: "appointments.statusActions.cancel",
    needsConfirm: true,
    variant: "danger",
  },
};

/** DATEONLY alanları yerel güne çevrilir: `new Date('2026-09-30')` UTC okur ve
 *  negatif saat dilimlerinde bir gün geriye kayardı. */
function formatDate(value: string, locale: Locale = "tr"): string {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

function money(value: number, locale: Locale = "tr"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

const EMPTY_META: AppointmentsMeta = {
  total: 0,
  page: 1,
  limit: DEFAULT_APPOINTMENTS_QUERY.limit,
  totalPages: 1,
};

export default function AppointmentsPage() {
  const { locale, t } = useI18n();
  const router = useRouter();

  // Durum adları paylaşılan `APPOINTMENT_STATUS` haritasından; ton orada kalır,
  // etiket `appointments.status.*` sözlüğünden aktif dile çevrilir. Değer başına
  // elle `{ ...MAP.X, label: t(...) }` yazılmaz — yeni enum değeri derlemeyi kırar.
  const statusMap = useMemo(
    () => localizeStatusMap(APPOINTMENT_STATUS, t, STATUS_LABEL_KEYS),
    [t]
  );

  const [query, setQuery] = useState<AppointmentsQueryState>(DEFAULT_APPOINTMENTS_QUERY);
  const [hydrated, setHydrated] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [meta, setMeta] = useState<AppointmentsMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [detailTarget, setDetailTarget] = useState<ApiAppointment | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    appointment: ApiAppointment;
    action: StatusActionKey;
  } | null>(null);

  // Arama 300ms debounce; filtreler anında. Sunucu isteği debounce edilmiş değerle.
  const debouncedQ = useDebouncedValue(query.q, 300);
  const apiQuery = toApiSearchParams({ ...query, q: debouncedQ }, new Date());

  /**
   * İlk açılış: URL'den durum okunur, sayfa boyutu tercihi localStorage'dan gelir
   * (URL'de açık `limit` varsa o kazanır). `useSearchParams` statik prerender'da
   * Suspense sınırı zorunlu kıldığı için `window.location` (AP-007 deseni).
   */
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const fromUrl = parseAppointmentsQuery(window.location.search);
    const stored = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
    const limit = params.has("limit")
      ? fromUrl.limit
      : APPOINTMENTS_PAGE_SIZES.includes(stored)
        ? stored
        : fromUrl.limit;

    setQuery(normalizeQuery({ ...fromUrl, limit }));
    setHydrated(true);
  }, [router]);

  const fetchAppointments = useCallback(
    async (search: string, signal: AbortSignal) => {
      try {
        setError(null);
        setLoading(true);
        const result = await apiFetch<ApiResponse>(`/admin/appointments?${search}`, { signal });
        if (result.success && result.data) {
          setAppointments(result.data.data);
          setMeta(result.data.meta);
        }
      } catch (err) {
        // İptal edilen istek state yazmaz: yavaş cevap yeni filtreyi ezmesin.
        if (signal.aborted) return;
        const message = err instanceof Error ? err.message : t("appointments.notice.loadError");
        if (message.includes("401") || message.includes("403")) {
          router.push("/login");
          return;
        }
        setError(message);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [router, t]
  );

  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    void fetchAppointments(apiQuery, controller.signal);
    return () => controller.abort();
  }, [apiQuery, fetchAppointments, hydrated, reloadKey]);

  /**
   * Tek kaynak `query` → URL. İlk render yazmaz (URL zaten okunuyor), sonra her
   * değişiklik `router.replace` ile yazılır (`scroll: false`).
   */
  const lastWrittenQuery = useRef<string | null>(null);
  useEffect(() => {
    const next = buildAppointmentsQuery(query);
    if (lastWrittenQuery.current === null) {
      lastWrittenQuery.current = next;
      return;
    }
    if (lastWrittenQuery.current === next) return;
    lastWrittenQuery.current = next;
    router.replace(next ? `/appointments?${next}` : "/appointments", { scroll: false });
  }, [query, router]);

  /** Filtre değişimi sayfayı 1'e döndürür; sayfa değişimi açıkça `page` verir. */
  const updateFilter = useCallback((patch: Partial<AppointmentsQueryState>) => {
    setQuery((prev) => normalizeQuery({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  /** Temizle: tüm filtreler varsayılana, sayfa 1 — sayfa boyutu korunur. */
  const clearFilters = useCallback(() => {
    setQuery((prev) => normalizeQuery({ ...DEFAULT_APPOINTMENTS_QUERY, limit: prev.limit }));
  }, []);

  const changePageSize = (size: number) => {
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size));
    updateFilter({ limit: size });
  };

  const runStatusAction = async (appointment: ApiAppointment, action: StatusActionKey) => {
    const config = STATUS_ACTIONS[action];
    try {
      setPending(`${appointment.id}-${action}`);
      setNotice(null);
      await apiFetch(`/appointments/${appointment.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: config.status }),
      });
      setAppointments((prev) =>
        prev.map((row) => (row.id === appointment.id ? { ...row, status: config.status } : row))
      );
      setConfirmTarget(null);
      setNotice({ kind: "success", text: t(`${config.keyPrefix}.success`) });
    } catch (err) {
      setNotice({
        kind: "error",
        text: err instanceof Error ? err.message : t("appointments.notice.actionError"),
      });
    } finally {
      setPending(null);
    }
  };

  /** `confirm` dışındaki geçişler önce onay ister (yanlış tıklama geri alınamaz). */
  const requestStatusAction = (appointment: ApiAppointment, action: StatusActionKey) => {
    if (STATUS_ACTIONS[action].needsConfirm) {
      setConfirmTarget({ appointment, action });
      return;
    }
    void runStatusAction(appointment, action);
  };

  const pendingFor = (id: string): AppointmentPendingAction => {
    if (pending === `${id}-confirm`) return "confirm";
    if (pending === `${id}-complete`) return "complete";
    if (pending === `${id}-noShow`) return "noShow";
    if (pending === `${id}-cancel`) return "cancel";
    return null;
  };

  const rowActions = (appointment: ApiAppointment) => (
    <AppointmentActions
      status={appointment.status}
      pending={pendingFor(appointment.id)}
      onDetail={() => setDetailTarget(appointment)}
      onConfirm={() => requestStatusAction(appointment, "confirm")}
      onComplete={() => requestStatusAction(appointment, "complete")}
      onNoShow={() => requestStatusAction(appointment, "noShow")}
      onCancel={() => requestStatusAction(appointment, "cancel")}
    />
  );

  const counts = meta.counts ?? {};
  const salonList = meta.salons ?? [];
  const staffList = meta.staff ?? [];

  // Deep-link'te seçili kimlik meta listesinde yoksa select boş görünmesin.
  const salonOptions =
    query.salonId && !salonList.some((salon) => salon.id === query.salonId)
      ? [...salonList, { id: query.salonId, name: query.salonId }]
      : salonList;
  const staffOptions =
    query.staffId && !staffList.some((member) => member.id === query.staffId)
      ? [...staffList, { id: query.staffId, fullName: query.staffId }]
      : staffList;

  const selectedSalonName = salonList.find((salon) => salon.id === query.salonId)?.name;
  const selectedStaffName = staffList.find((member) => member.id === query.staffId)?.fullName;

  const hasFilters = Boolean(
    query.q ||
      query.status !== "tümü" ||
      query.salonId ||
      query.staffId ||
      query.date !== "tümü"
  );

  const confirmConfig = confirmTarget ? STATUS_ACTIONS[confirmTarget.action] : null;
  const confirmText = confirmTarget
    ? t("appointments.confirm.message", {
        customer:
          confirmTarget.appointment.customer?.fullName ??
          t("appointments.confirm.anonymousCustomer"),
        date: formatDate(confirmTarget.appointment.date, locale),
        verb: t(`${STATUS_ACTIONS[confirmTarget.action].keyPrefix}.verb`),
      })
    : "";

  const columns: Column<ApiAppointment>[] = [
    {
      key: "salon",
      header: t("appointments.columns.salonService"),
      mobile: "primary",
      cell: (appointment) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-fg">{appointment.salon?.name ?? "—"}</div>
          <div className="truncate text-xs text-fg-muted">{appointment.service?.name ?? "—"}</div>
        </div>
      ),
    },
    {
      key: "customer",
      header: t("appointments.columns.customer"),
      cell: (appointment) => (
        <span className="truncate">{appointment.customer?.fullName ?? "—"}</span>
      ),
    },
    {
      key: "staff",
      header: t("appointments.columns.staff"),
      mobile: "meta",
      cell: (appointment) => (
        <span className="text-fg-muted">{appointment.staff?.fullName ?? "—"}</span>
      ),
    },
    {
      key: "when",
      header: t("appointments.columns.when"),
      mobile: "meta",
      cell: (appointment) => (
        <span className="tnum whitespace-nowrap">
          {formatDate(appointment.date, locale)}
          <span className="text-fg-muted">
            {" "}
            {appointment.startTime.slice(0, 5)}–{appointment.endTime.slice(0, 5)}
          </span>
        </span>
      ),
    },
    {
      key: "price",
      header: t("appointments.columns.price"),
      align: "right",
      cell: (appointment) => (
        <span className="tnum font-semibold">{money(appointment.service?.price ?? 0, locale)}</span>
      ),
    },
    {
      key: "status",
      header: t("appointments.columns.status"),
      cell: (appointment) => <StatusBadge map={statusMap} value={appointment.status} />,
    },
    {
      key: "actions",
      header: t("appointments.columns.actions"),
      align: "right",
      mobile: false,
      cell: (appointment) => rowActions(appointment),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("pages.appointments.title")}
        // Sayaçlar filtreli `meta.total` değil, filtrelerden bağımsız global `meta.counts`.
        subtitle={t("pages.appointments.subtitle", {
          count: counts["tümü"] ?? meta.total,
          pending: counts.PENDING ?? 0,
        })}
        actions={
          <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            {t("appointments.page.refresh")}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2">
        <FilterBar
          leading={
            // Ölçü sarmalayıcıda: Field kontrolünün taban sınıfı `w-full` olduğu için
            // genişlik/daralma sınıfları doğrudan kontrole verilince eziliyor (AP-007).
            <div className="min-w-[10rem] flex-1 overflow-hidden">
              <Input
                icon={Search}
                value={query.q}
                onChange={(e) => updateFilter({ q: e.target.value })}
                placeholder={t("appointments.page.searchPlaceholder")}
                aria-label={t("appointments.page.searchAriaLabel")}
              />
            </div>
          }
        >
          {/* Durum filtresi Tabs yerine Select: 6 kontrollü tek satırda Tabs şeridi
              (shrink-0, 624px) 1280px'te 4 select'e yer bırakmıyordu (AP-008 T9).
              Sayaçlar seçenek etiketinde, `meta.counts`tan (filtresiz global). */}
          <div className="!min-w-[9.5rem] max-w-48 flex-1">
            <Select
              aria-label={t("appointments.page.statusFilter")}
              value={query.status}
              onChange={(e) =>
                updateFilter({ status: e.target.value as AppointmentStatusFilter })
              }
            >
              {APPOINTMENT_STATUS_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {t("appointments.statusOption", {
                    label: t(STATUS_LABEL_KEYS[value]),
                    count: counts[value] ?? 0,
                  })}
                </option>
              ))}
            </Select>
          </div>
          {/* `!` şart: FilterBar kökündeki `[&>*]:min-w-0` doğrudan çocukların
              `min-w-*` tabanını eziyordu (aynı özgüllük, sonra gelen kazanıyor) ve
              4 select ~40px'e çöküp "Tü…", "En…" diye kırpılıyordu (AP-008 T9). */}
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t("appointments.page.salonFilter")}
              value={query.salonId}
              onChange={(e) => updateFilter({ salonId: e.target.value })}
            >
              <option value="">{t("appointments.page.allSalons")}</option>
              {salonOptions.map((salon) => (
                <option key={salon.id} value={salon.id}>
                  {salon.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t("appointments.page.staffFilter")}
              value={query.staffId}
              onChange={(e) => updateFilter({ staffId: e.target.value })}
            >
              <option value="">{t("appointments.page.allStaff")}</option>
              {staffOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t("appointments.page.dateFilter")}
              value={query.date}
              onChange={(e) => updateFilter({ date: e.target.value as AppointmentsQueryState["date"] })}
            >
              {DATE_PRESET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
          </div>
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t("appointments.page.sortFilter")}
              value={`${query.sort}:${query.order}`}
              onChange={(e) => {
                const option = APPOINTMENT_SORT_OPTIONS.find((item) => item.value === e.target.value);
                if (option) updateFilter({ sort: option.sort, order: option.order });
              }}
            >
              {APPOINTMENT_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
          </div>
        </FilterBar>

        <FilterChips
          chips={activeChips(query, { salon: selectedSalonName, staff: selectedStaffName }).map(
            (chip) => ({
              key: chip.key,
              // Çip metni iki anahtardan kurulur: şablon + (varsa) değer anahtarı.
              label: t(chip.labelKey, {
                ...chip.vars,
                ...(chip.valueKey ? { label: t(chip.valueKey) } : null),
              }),
              onRemove: () => updateFilter(chip.patch),
            })
          )}
          onClearAll={clearFilters}
          clearLabel={t("appointments.chips.clear")}
        />
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {notice?.kind === "success" ? notice.text : ""}
      </p>
      {notice?.kind === "error" ? (
        <p role="alert" className="mb-3 text-sm text-error">
          {notice.text}
        </p>
      ) : null}

      {error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : null}

      <DataTable<ApiAppointment>
        rows={appointments}
        columns={columns}
        rowKey={(appointment) => appointment.id}
        loading={loading}
        actions={rowActions}
        minWidthClass="min-w-[52rem]"
        emptyTitle={
          hasFilters ? t("appointments.empty.filteredTitle") : t("appointments.empty.noneTitle")
        }
        emptyDescription={
          hasFilters
            ? t("appointments.empty.filteredDescription")
            : t("appointments.empty.noneDescription")
        }
      />

      <Pagination
        page={query.page}
        totalPages={meta.totalPages}
        total={meta.total}
        pageSize={query.limit}
        onPage={(page) => updateFilter({ page })}
        onPageSize={changePageSize}
      />

      <AppointmentDetailDialog
        open={detailTarget !== null}
        appointment={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      <Dialog
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        title={confirmConfig ? t(`${confirmConfig.keyPrefix}.title`) : t("appointments.confirm.defaultTitle")}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmTarget(null)} disabled={pending !== null}>
              {t("appointments.confirm.back")}
            </Button>
            <Button
              variant={confirmConfig?.variant ?? "primary"}
              disabled={pending !== null}
              onClick={() => {
                if (confirmTarget) void runStatusAction(confirmTarget.appointment, confirmTarget.action);
              }}
            >
              {pending !== null ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {confirmConfig ? t(`${confirmConfig.keyPrefix}.label`) : t("appointments.actions.confirm")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">{confirmText}</p>
      </Dialog>
    </>
  );
}
