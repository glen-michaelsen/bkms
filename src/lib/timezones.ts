export type TzOption = { value: string; label: string }

export const TIMEZONES: TzOption[] = [
  // Europe
  { value: "Europe/London",     label: "London (GMT/BST)" },
  { value: "Europe/Lisbon",     label: "Lisbon (WET/WEST)" },
  { value: "Europe/Paris",      label: "Paris / Amsterdam / Berlin (CET)" },
  { value: "Europe/Copenhagen", label: "Copenhagen / Stockholm (CET)" },
  { value: "Europe/Rome",       label: "Rome / Madrid / Vienna (CET)" },
  { value: "Europe/Belgrade",   label: "Belgrade / Zagreb / Sarajevo (CET)" },
  { value: "Europe/Warsaw",     label: "Warsaw / Prague / Budapest (CET)" },
  { value: "Europe/Helsinki",   label: "Helsinki / Tallinn / Riga (EET)" },
  { value: "Europe/Athens",     label: "Athens / Bucharest (EET)" },
  { value: "Europe/Moscow",     label: "Moscow (MSK)" },
  // Americas
  { value: "America/New_York",    label: "New York / Toronto (ET)" },
  { value: "America/Chicago",     label: "Chicago / Dallas (CT)" },
  { value: "America/Denver",      label: "Denver / Phoenix (MT)" },
  { value: "America/Los_Angeles", label: "Los Angeles / Vancouver (PT)" },
  { value: "America/Sao_Paulo",   label: "São Paulo / Buenos Aires (BRT)" },
  // Middle East & Africa
  { value: "Asia/Dubai",          label: "Dubai / Abu Dhabi (GST)" },
  { value: "Asia/Riyadh",         label: "Riyadh / Kuwait (AST)" },
  { value: "Africa/Cairo",        label: "Cairo / Johannesburg (EET/SAST)" },
  // Asia-Pacific
  { value: "Asia/Kolkata",        label: "Mumbai / Delhi (IST)" },
  { value: "Asia/Bangkok",        label: "Bangkok / Jakarta (ICT)" },
  { value: "Asia/Singapore",      label: "Singapore / Kuala Lumpur (SGT)" },
  { value: "Asia/Tokyo",          label: "Tokyo / Seoul (JST)" },
  { value: "Australia/Sydney",    label: "Sydney / Melbourne (AEST)" },
  { value: "Pacific/Auckland",    label: "Auckland (NZST)" },
]
