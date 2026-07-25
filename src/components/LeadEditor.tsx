import { useEffect, useRef, useState } from "react";
import { Save, Trash2, X } from "lucide-react";
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

type LeadDraft = Omit<Lead, "id" | "createdAt" | "updatedAt">;

const EMPTY_LEAD: LeadDraft = {
  name: "",
  company: "",
  phone: "",
  telegram: "",
  email: "",
  kind: "b2c",
  source: "other",
  partnerCode: "",
  status: "new",
  nextAction: "",
  nextActionDate: null,
  followUpTaskId: null,
  estimatedValue: null,
  model: "",
  quantity: null,
  city: "",
  notes: "",
};

const fieldClass =
  "min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-ios-body outline-none transition focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900";
const labelClass = "space-y-1.5";

interface LeadEditorProps {
  lead: Lead | null;
  onClose: () => void;
}

export function LeadEditor({ lead, onClose }: LeadEditorProps) {
  const addLead = useStore((state) => state.addLead);
  const updateLead = useStore((state) => state.updateLead);
  const deleteLead = useStore((state) => state.deleteLead);
  const [draft, setDraft] = useState<LeadDraft>(() =>
    lead ? toDraft(lead) : { ...EMPTY_LEAD }
  );
  const dialogRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function setField<K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    const name = draft.name.trim();
    if (!name) {
      nameRef.current?.focus();
      return;
    }
    const normalized = { ...draft, name };
    if (lead) updateLead(lead.id, normalized);
    else addLead(normalized);
    onClose();
  }

  function remove() {
    if (!lead || !confirm(`Видалити лід «${lead.name}»?`)) return;
    deleteLead(lead.id);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-editor-title"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-lg bg-white shadow-2xl dark:bg-gray-900 sm:rounded-lg"
      >
        <header className="flex min-h-14 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800">
          <h2
            id="lead-editor-title"
            className="min-w-0 flex-1 truncate text-ios-title3 font-semibold"
          >
            {lead ? "Редагувати лід" : "Новий лід"}
          </h2>
          {lead && (
            <button
              type="button"
              onClick={remove}
              aria-label="Видалити лід"
              title="Видалити"
              className="touch-target flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            title="Закрити"
            className="touch-target flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-5">
          <section>
            <h3 className="mb-3 ios-section-label">Клієнт</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className="ios-form-label">Ім&apos;я або контакт *</span>
                <input
                  ref={nameRef}
                  value={draft.name}
                  onChange={(event) => setField("name", event.target.value)}
                  className={fieldClass}
                  placeholder="Олександр"
                />
              </label>
              <label className={labelClass}>
                <span className="ios-form-label">Компанія / ОСББ</span>
                <input
                  value={draft.company}
                  onChange={(event) => setField("company", event.target.value)}
                  className={fieldClass}
                  placeholder="Назва організації"
                />
              </label>
              <label className={labelClass}>
                <span className="ios-form-label">Тип клієнта</span>
                <select
                  value={draft.kind}
                  onChange={(event) =>
                    setField("kind", event.target.value as LeadKind)
                  }
                  className={fieldClass}
                >
                  {Object.entries(LEAD_KIND_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className="ios-form-label">Місто</span>
                <input
                  value={draft.city}
                  onChange={(event) => setField("city", event.target.value)}
                  className={fieldClass}
                  placeholder="Хмельницький"
                />
              </label>
              <label className={labelClass}>
                <span className="ios-form-label">Телефон</span>
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  className={fieldClass}
                  placeholder="+380..."
                />
              </label>
              <label className={labelClass}>
                <span className="ios-form-label">Telegram</span>
                <input
                  value={draft.telegram}
                  onChange={(event) => setField("telegram", event.target.value)}
                  className={fieldClass}
                  placeholder="@username"
                />
              </label>
              <label className={labelClass}>
                <span className="ios-form-label">Email</span>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(event) => setField("email", event.target.value)}
                  className={fieldClass}
                  placeholder="name@example.com"
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-3 ios-section-label">Джерело і замовлення</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className="ios-form-label">Джерело</span>
                <select
                  value={draft.source}
                  onChange={(event) =>
                    setField("source", event.target.value as LeadSource)
                  }
                  className={fieldClass}
                >
                  {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className="ios-form-label">Код партнера / QR</span>
                <input
                  value={draft.partnerCode}
                  onChange={(event) =>
                    setField("partnerCode", event.target.value)
                  }
                  className={fieldClass}
                  placeholder="OSBB001"
                />
              </label>
              <label className={labelClass}>
                <span className="ios-form-label">Модель кошика</span>
                <input
                  value={draft.model}
                  onChange={(event) => setField("model", event.target.value)}
                  className={fieldClass}
                  placeholder="Модель або короткий опис"
                />
              </label>
              <label className={labelClass}>
                <span className="ios-form-label">Кількість</span>
                <input
                  type="number"
                  min="1"
                  value={draft.quantity ?? ""}
                  onChange={(event) =>
                    setField(
                      "quantity",
                      event.target.value ? Number(event.target.value) : null
                    )
                  }
                  className={fieldClass}
                  placeholder="1"
                />
              </label>
              <label className={labelClass}>
                <span className="ios-form-label">Орієнтовна сума, грн</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={draft.estimatedValue ?? ""}
                  onChange={(event) =>
                    setField(
                      "estimatedValue",
                      event.target.value ? Number(event.target.value) : null
                    )
                  }
                  className={fieldClass}
                  placeholder="0"
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-3 ios-section-label">Наступна дія</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                <span className="ios-form-label">Статус</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setField("status", event.target.value as LeadStatus)
                  }
                  className={fieldClass}
                >
                  {LEAD_STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {LEAD_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className="ios-form-label">Дата наступної дії</span>
                <input
                  type="date"
                  value={draft.nextActionDate ?? ""}
                  onChange={(event) =>
                    setField("nextActionDate", event.target.value || null)
                  }
                  className={fieldClass}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                <span className="ios-form-label">Що зробити далі</span>
                <input
                  value={draft.nextAction}
                  onChange={(event) =>
                    setField("nextAction", event.target.value)
                  }
                  className={fieldClass}
                  placeholder="Передзвонити, надіслати прайс, уточнити розміри..."
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                <span className="ios-form-label">Нотатки</span>
                <textarea
                  value={draft.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                  rows={4}
                  className={`${fieldClass} resize-y`}
                  placeholder="Потреба клієнта, домовленості, заперечення"
                />
              </label>
            </div>
          </section>
        </div>

        <footer className="flex justify-end border-t border-gray-200 p-3 dark:border-gray-800">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-500 px-4 text-ios-body font-medium text-white hover:bg-brand-600"
          >
            <Save className="h-4 w-4" />
            Зберегти
          </button>
        </footer>
      </form>
    </div>
  );
}

function toDraft(lead: Lead): LeadDraft {
  return {
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    telegram: lead.telegram,
    email: lead.email,
    kind: lead.kind,
    source: lead.source,
    partnerCode: lead.partnerCode,
    status: lead.status,
    nextAction: lead.nextAction,
    nextActionDate: lead.nextActionDate,
    followUpTaskId: lead.followUpTaskId,
    estimatedValue: lead.estimatedValue,
    model: lead.model,
    quantity: lead.quantity,
    city: lead.city,
    notes: lead.notes,
  };
}
