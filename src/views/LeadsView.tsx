import { useMemo, useState } from "react";
import {
  CalendarClock,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import clsx from "clsx";
import { LeadEditor } from "../components/LeadEditor";
import { useStore } from "../store/useStore";
import {
  Lead,
  LeadKind,
  LeadSource,
  LeadStatus,
  LEAD_KIND_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
} from "../types";
import { todayISO } from "../lib/dates";

type LeadFilter<T extends string> = T | "any";

const statusStyles: Record<LeadStatus, string> = {
  new: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  contacted:
    "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  qualified:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  proposal:
    "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  negotiation:
    "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  won: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  lost: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const selectClass =
  "min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-ios-footnote outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900";

export function LeadsView() {
  const leads = useStore((state) => state.leads);
  const updateLead = useStore((state) => state.updateLead);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadFilter<LeadStatus>>("any");
  const [source, setSource] = useState<LeadFilter<LeadSource>>("any");
  const [kind, setKind] = useState<LeadFilter<LeadKind>>("any");
  const [editing, setEditing] = useState<Lead | "new" | null>(null);
  const today = todayISO();

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("uk");
    return [...leads]
      .filter((lead) => {
        if (status !== "any" && lead.status !== status) return false;
        if (source !== "any" && lead.source !== source) return false;
        if (kind !== "any" && lead.kind !== kind) return false;
        if (!normalizedQuery) return true;
        return [
          lead.name,
          lead.company,
          lead.phone,
          lead.telegram,
          lead.email,
          lead.city,
          lead.partnerCode,
          lead.model,
          lead.notes,
        ]
          .join(" ")
          .toLocaleLowerCase("uk")
          .includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (a.nextActionDate && b.nextActionDate) {
          const dateOrder = a.nextActionDate.localeCompare(b.nextActionDate);
          if (dateOrder !== 0) return dateOrder;
        } else if (a.nextActionDate) {
          return -1;
        } else if (b.nextActionDate) {
          return 1;
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [kind, leads, query, source, status]);

  const activeCount = leads.filter(
    (lead) => lead.status !== "won" && lead.status !== "lost"
  ).length;
  const overdueCount = leads.filter(
    (lead) =>
      lead.nextActionDate &&
      lead.nextActionDate < today &&
      lead.status !== "won" &&
      lead.status !== "lost"
  ).length;
  const wonValue = leads
    .filter((lead) => lead.status === "won")
    .reduce((total, lead) => total + (lead.estimatedValue ?? 0), 0);

  return (
    <div className="page-container-lg">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <UsersRound className="h-6 w-6 text-brand-500" />
            <h1 className="ios-page-title">Ліди</h1>
          </div>
          <p className="mt-1 ios-page-subtitle">
            Контакти, джерела, наступні дії та результат продажу
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-500 px-4 text-ios-body font-medium text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Додати лід
        </button>
      </header>

      <section
        aria-label="Показники лідів"
        className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 dark:border-gray-800 dark:bg-gray-800 sm:grid-cols-4"
      >
        <Metric label="Усього" value={leads.length.toLocaleString("uk-UA")} />
        <Metric label="Активні" value={activeCount.toLocaleString("uk-UA")} />
        <Metric
          label="Прострочені дії"
          value={overdueCount.toLocaleString("uk-UA")}
          alert={overdueCount > 0}
        />
        <Metric
          label="Замовлення, грн"
          value={wonValue.toLocaleString("uk-UA")}
        />
      </section>

      <section aria-label="Фільтри" className="mb-4 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук за ім'ям, компанією, телефоном, кодом..."
            className="min-h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-ios-body outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as LeadFilter<LeadStatus>)
            }
            aria-label="Фільтр за статусом"
            className={selectClass}
          >
            <option value="any">Усі статуси</option>
            {LEAD_STATUS_ORDER.map((value) => (
              <option key={value} value={value}>
                {LEAD_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <select
            value={source}
            onChange={(event) =>
              setSource(event.target.value as LeadFilter<LeadSource>)
            }
            aria-label="Фільтр за джерелом"
            className={selectClass}
          >
            <option value="any">Усі джерела</option>
            {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as LeadFilter<LeadKind>)
            }
            aria-label="Фільтр за типом клієнта"
            className={selectClass}
          >
            <option value="any">Усі типи клієнтів</option>
            {Object.entries(LEAD_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <UsersRound className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-700" />
          <p className="mt-3 text-ios-body font-medium">
            {leads.length ? "Нічого не знайдено" : "Лідів ще немає"}
          </p>
          <p className="mt-1 ios-page-subtitle">
            {leads.length
              ? "Змініть фільтри або пошуковий запит."
              : "Додайте перший контакт і відразу заплануйте наступну дію."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="hidden grid-cols-[minmax(12rem,1.4fr)_minmax(9rem,1fr)_minmax(10rem,1fr)_10rem_2.75rem] gap-3 bg-gray-50 px-4 py-2 ios-section-label md:grid dark:bg-gray-900">
            <span>Клієнт</span>
            <span>Джерело</span>
            <span>Наступна дія</span>
            <span>Статус</span>
            <span />
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filtered.map((lead) => {
              const overdue =
                Boolean(lead.nextActionDate) &&
                lead.nextActionDate! < today &&
                lead.status !== "won" &&
                lead.status !== "lost";
              return (
                <article
                  key={lead.id}
                  className="grid gap-3 bg-white px-4 py-3 md:grid-cols-[minmax(12rem,1.4fr)_minmax(9rem,1fr)_minmax(10rem,1fr)_10rem_2.75rem] md:items-center dark:bg-gray-950"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setEditing(lead)}
                      className="max-w-full truncate text-left text-ios-body font-semibold hover:text-brand-500"
                    >
                      {lead.name}
                    </button>
                    <div className="mt-0.5 truncate text-ios-footnote text-gray-500">
                      {[lead.company, lead.city].filter(Boolean).join(" · ") ||
                        LEAD_KIND_LABELS[lead.kind]}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          aria-label={`Подзвонити ${lead.name}`}
                          className="inline-flex items-center gap-1 text-ios-footnote text-gray-500 hover:text-brand-500"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {lead.phone}
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          aria-label={`Написати ${lead.name}`}
                          className="inline-flex items-center text-gray-400 hover:text-brand-500"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 text-ios-footnote">
                    <div className="truncate text-gray-700 dark:text-gray-300">
                      {LEAD_SOURCE_LABELS[lead.source]}
                    </div>
                    {lead.partnerCode && (
                      <div className="mt-0.5 truncate font-mono text-gray-400">
                        {lead.partnerCode}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={clsx(
                        "truncate text-ios-footnote",
                        overdue
                          ? "font-medium text-red-600 dark:text-red-400"
                          : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {lead.nextAction || "Не заплановано"}
                    </div>
                    {lead.nextActionDate && (
                      <div
                        className={clsx(
                          "mt-0.5 inline-flex items-center gap-1 text-ios-footnote",
                          overdue ? "text-red-500" : "text-gray-400"
                        )}
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatDate(lead.nextActionDate)}
                      </div>
                    )}
                  </div>

                  <select
                    value={lead.status}
                    onChange={(event) =>
                      updateLead(lead.id, {
                        status: event.target.value as LeadStatus,
                      })
                    }
                    aria-label={`Статус ліда ${lead.name}`}
                    className={clsx(
                      "min-h-10 w-full rounded-lg border-0 px-2 text-ios-footnote font-medium outline-none",
                      statusStyles[lead.status]
                    )}
                  >
                    {LEAD_STATUS_ORDER.map((value) => (
                      <option key={value} value={value}>
                        {LEAD_STATUS_LABELS[value]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setEditing(lead)}
                    aria-label={`Редагувати ${lead.name}`}
                    title="Редагувати"
                    className="touch-target flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-gray-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {editing && (
        <LeadEditor
          key={editing === "new" ? "new" : editing.id}
          lead={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
  alert?: boolean;
}

function Metric({ label, value, alert = false }: MetricProps) {
  return (
    <div className="min-w-0 bg-white px-3 py-3 dark:bg-gray-950 sm:px-4">
      <div
        className={clsx(
          "truncate text-ios-title3 font-semibold tabular-nums",
          alert && "text-red-600 dark:text-red-400"
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 truncate text-ios-footnote text-gray-500">
        {label}
      </div>
    </div>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}
