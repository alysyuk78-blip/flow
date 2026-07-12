import { Download, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import { useBackupReminder } from "../hooks/useReminders";

const RECOVERY_NOTICE_KEY = "flow-storage-recovered";

export function DataSafetyNotice() {
  const { backupDue, downloadBackup, snoozeBackup } = useBackupReminder();
  const [recovered, setRecovered] = useState(
    () => sessionStorage.getItem(RECOVERY_NOTICE_KEY) === "1"
  );

  if (!backupDue && !recovered) return null;

  function dismissRecovery() {
    sessionStorage.removeItem(RECOVERY_NOTICE_KEY);
    setRecovered(false);
  }

  return (
    <div
      role="status"
      className="safe-x fixed bottom-4 left-4 right-4 z-40 flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-3 shadow-lg md:left-auto md:w-[360px] dark:border-gray-700 dark:bg-gray-900"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
      <div className="min-w-0 flex-1">
        <div className="text-ios-body font-medium text-gray-800 dark:text-gray-100">
          {recovered
            ? "Flow відновив запуск"
            : "Час створити резервну копію"}
        </div>
        <div className="mt-0.5 text-ios-footnote text-gray-500 dark:text-gray-400">
          {recovered
            ? "Пошкоджені локальні дані ізольовано, щоб застосунок міг відкритися."
            : "Дані Flow зберігаються лише в цьому браузері."}
        </div>
        {!recovered && (
          <button
            onClick={downloadBackup}
            className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-ios-footnote font-medium text-white hover:bg-brand-600"
          >
            <Download className="h-4 w-4" />
            Завантажити копію
          </button>
        )}
      </div>
      <button
        onClick={recovered ? dismissRecovery : snoozeBackup}
        aria-label={recovered ? "Закрити" : "Нагадати завтра"}
        title={recovered ? "Закрити" : "Нагадати завтра"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
