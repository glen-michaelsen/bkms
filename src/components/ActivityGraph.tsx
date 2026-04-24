type DayData = { date: string; count: number; isFuture: boolean }

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"]

function cellColor(count: number, isFuture: boolean): string {
  if (isFuture) return "bg-transparent"
  if (count === 0) return "bg-slate-100"
  if (count <= 3) return "bg-violet-200"
  if (count <= 8) return "bg-violet-400"
  return "bg-violet-600"
}

function monthLabel(weeks: DayData[][], weekIndex: number): string | null {
  const date = new Date(weeks[weekIndex][0].date + "T00:00:00Z")
  const month = date.toLocaleString("en", { month: "short", timeZone: "UTC" })
  if (weekIndex === 0) return month
  const prevDate = new Date(weeks[weekIndex - 1][0].date + "T00:00:00Z")
  const prevMonth = prevDate.toLocaleString("en", { month: "short", timeZone: "UTC" })
  return month !== prevMonth ? month : null
}

export function ActivityGraph({
  weeks,
  streak,
  totalDaysActive,
  numWeeks = 16,
}: {
  weeks: DayData[][]
  streak: number
  totalDaysActive: number
  numWeeks?: number
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">
          🔥
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-2 rounded-2xl">
          <span className="text-base font-extrabold text-amber-700 leading-none">{streak}</span>
          <span className="text-xs text-amber-500 font-medium">day streak</span>
        </div>
      </div>
      <h3 className="text-xl font-extrabold text-slate-900 mb-1">Training activity</h3>
      <p className="text-sm text-slate-400 mb-5">{totalDaysActive} active days in the last {numWeeks} weeks</p>

      {/* Graph */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Day labels column */}
          <div className="flex flex-col justify-around pt-5 pr-2 gap-1">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-3 flex items-center justify-end">
                <span className="text-[10px] text-slate-400 w-6 text-right leading-none">{label}</span>
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          <div className="flex flex-col">
            {/* Month labels */}
            <div className="flex gap-1 mb-1.5 h-4">
              {weeks.map((_, wi) => {
                const label = monthLabel(weeks, wi)
                return (
                  <div key={wi} className="w-3 relative">
                    {label && (
                      <span className="absolute text-[10px] text-slate-400 whitespace-nowrap leading-none">
                        {label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Cells */}
            <div className="flex gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      title={day.isFuture ? "" : `${day.date}: ${day.count} answer${day.count !== 1 ? "s" : ""}`}
                      className={`w-3 h-3 rounded-sm transition-colors ${cellColor(day.count, day.isFuture)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-4 justify-end">
        <span className="text-[10px] text-slate-400 mr-1">Less</span>
        {["bg-slate-100", "bg-violet-200", "bg-violet-400", "bg-violet-600"].map((cls) => (
          <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-slate-400 ml-1">More</span>
      </div>
    </div>
  )
}
