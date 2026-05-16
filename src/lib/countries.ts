export type Country = {
  value: string   // English name — stored in DB
  label: string   // English display
  srIn: string    // Serbian: goes after "u " → "Živim u ___"
  srFrom: string  // Serbian: goes after "iz " → "Porijeklom sam iz ___"
  hrIn: string    // Croatian: goes after "u "
  hrFrom: string  // Croatian: goes after "iz "
}

export const COUNTRIES: Country[] = [
  // ── Balkans ────────────────────────────────────────────────────────────────
  { value: "Serbia",                label: "Serbia",               srIn: "Srbiji",              srFrom: "Srbije",              hrIn: "Srbiji",              hrFrom: "Srbije" },
  { value: "Croatia",               label: "Croatia",              srIn: "Hrvatskoj",            srFrom: "Hrvatske",            hrIn: "Hrvatskoj",           hrFrom: "Hrvatske" },
  { value: "Bosnia and Herzegovina",label: "Bosnia & Herzegovina", srIn: "Bosni i Hercegovini", srFrom: "Bosne i Hercegovine", hrIn: "Bosni i Hercegovini", hrFrom: "Bosne i Hercegovine" },
  { value: "Montenegro",            label: "Montenegro",           srIn: "Crnoj Gori",          srFrom: "Crne Gore",           hrIn: "Crnoj Gori",          hrFrom: "Crne Gore" },
  { value: "North Macedonia",       label: "North Macedonia",      srIn: "Severnoj Makedoniji", srFrom: "Severne Makedonije",  hrIn: "Sjevernoj Makedoniji",hrFrom: "Sjeverne Makedonije" },
  { value: "Slovenia",              label: "Slovenia",             srIn: "Sloveniji",           srFrom: "Slovenije",           hrIn: "Sloveniji",           hrFrom: "Slovenije" },
  { value: "Albania",               label: "Albania",              srIn: "Albaniji",            srFrom: "Albanije",            hrIn: "Albaniji",            hrFrom: "Albanije" },
  { value: "Kosovo",                label: "Kosovo",               srIn: "Kosovu",              srFrom: "Kosova",              hrIn: "Kosovu",              hrFrom: "Kosova" },
  // ── Western Europe ─────────────────────────────────────────────────────────
  { value: "Germany",               label: "Germany",              srIn: "Nemačkoj",            srFrom: "Nemačke",             hrIn: "Njemačkoj",           hrFrom: "Njemačke" },
  { value: "Austria",               label: "Austria",              srIn: "Austriji",            srFrom: "Austrije",            hrIn: "Austriji",            hrFrom: "Austrije" },
  { value: "Switzerland",           label: "Switzerland",          srIn: "Švajcarskoj",         srFrom: "Švajcarske",          hrIn: "Švicarskoj",          hrFrom: "Švicarske" },
  { value: "France",                label: "France",               srIn: "Francuskoj",          srFrom: "Francuske",           hrIn: "Francuskoj",          hrFrom: "Francuske" },
  { value: "Italy",                 label: "Italy",                srIn: "Italiji",             srFrom: "Italije",             hrIn: "Italiji",             hrFrom: "Italije" },
  { value: "Spain",                 label: "Spain",                srIn: "Španiji",             srFrom: "Španije",             hrIn: "Španjolskoj",         hrFrom: "Španjolske" },
  { value: "Portugal",              label: "Portugal",             srIn: "Portugalu",           srFrom: "Portugala",           hrIn: "Portugalu",           hrFrom: "Portugala" },
  { value: "United Kingdom",        label: "United Kingdom",       srIn: "Ujedinjenom Kraljevstvu", srFrom: "Ujedinjenog Kraljevstva", hrIn: "Ujedinjenom Kraljevstvu", hrFrom: "Ujedinjenog Kraljevstva" },
  { value: "Ireland",               label: "Ireland",              srIn: "Irskoj",              srFrom: "Irske",               hrIn: "Irskoj",              hrFrom: "Irske" },
  { value: "Netherlands",           label: "Netherlands",          srIn: "Holandiji",           srFrom: "Holandije",           hrIn: "Nizozemskoj",         hrFrom: "Nizozemske" },
  { value: "Belgium",               label: "Belgium",              srIn: "Belgiji",             srFrom: "Belgije",             hrIn: "Belgiji",             hrFrom: "Belgije" },
  { value: "Luxembourg",            label: "Luxembourg",           srIn: "Luksemburgu",         srFrom: "Luksemburga",         hrIn: "Luksemburgu",         hrFrom: "Luksemburga" },
  // ── Northern Europe ────────────────────────────────────────────────────────
  { value: "Sweden",                label: "Sweden",               srIn: "Švedskoj",            srFrom: "Švedske",             hrIn: "Švedskoj",            hrFrom: "Švedske" },
  { value: "Norway",                label: "Norway",               srIn: "Norveškoj",           srFrom: "Norveške",            hrIn: "Norveškoj",           hrFrom: "Norveške" },
  { value: "Denmark",               label: "Denmark",              srIn: "Danskoj",             srFrom: "Danske",              hrIn: "Danskoj",             hrFrom: "Danske" },
  { value: "Finland",               label: "Finland",              srIn: "Finskoj",             srFrom: "Finske",              hrIn: "Finskoj",             hrFrom: "Finske" },
  { value: "Iceland",               label: "Iceland",              srIn: "Islandu",             srFrom: "Islanda",             hrIn: "Islandu",             hrFrom: "Islanda" },
  // ── Eastern Europe ─────────────────────────────────────────────────────────
  { value: "Poland",                label: "Poland",               srIn: "Poljskoj",            srFrom: "Poljske",             hrIn: "Poljskoj",            hrFrom: "Poljske" },
  { value: "Czech Republic",        label: "Czech Republic",       srIn: "Češkoj",              srFrom: "Češke",               hrIn: "Češkoj",              hrFrom: "Češke" },
  { value: "Slovakia",              label: "Slovakia",             srIn: "Slovačkoj",           srFrom: "Slovačke",            hrIn: "Slovačkoj",           hrFrom: "Slovačke" },
  { value: "Hungary",               label: "Hungary",              srIn: "Mađarskoj",           srFrom: "Mađarske",            hrIn: "Mađarskoj",           hrFrom: "Mađarske" },
  { value: "Romania",               label: "Romania",              srIn: "Rumuniji",            srFrom: "Rumunije",            hrIn: "Rumunjskoj",          hrFrom: "Rumunjske" },
  { value: "Bulgaria",              label: "Bulgaria",             srIn: "Bugarskoj",           srFrom: "Bugarske",            hrIn: "Bugarskoj",           hrFrom: "Bugarske" },
  { value: "Greece",                label: "Greece",               srIn: "Grčkoj",              srFrom: "Grčke",               hrIn: "Grčkoj",              hrFrom: "Grčke" },
  { value: "Russia",                label: "Russia",               srIn: "Rusiji",              srFrom: "Rusije",              hrIn: "Rusiji",              hrFrom: "Rusije" },
  { value: "Ukraine",               label: "Ukraine",              srIn: "Ukrajini",            srFrom: "Ukrajine",            hrIn: "Ukrajini",            hrFrom: "Ukrajine" },
  { value: "Belarus",               label: "Belarus",              srIn: "Belorusiji",          srFrom: "Belorusije",          hrIn: "Bjelorusiji",         hrFrom: "Bjelorusije" },
  { value: "Moldova",               label: "Moldova",              srIn: "Moldaviji",           srFrom: "Moldavije",           hrIn: "Moldaviji",           hrFrom: "Moldavije" },
  { value: "Lithuania",             label: "Lithuania",            srIn: "Litvaniji",           srFrom: "Litvanije",           hrIn: "Litvi",               hrFrom: "Litve" },
  { value: "Latvia",                label: "Latvia",               srIn: "Letoniji",            srFrom: "Letonije",            hrIn: "Latviji",             hrFrom: "Latvije" },
  { value: "Estonia",               label: "Estonia",              srIn: "Estoniji",            srFrom: "Estonije",            hrIn: "Estoniji",            hrFrom: "Estonije" },
  { value: "Turkey",                label: "Turkey",               srIn: "Turskoj",             srFrom: "Turske",              hrIn: "Turskoj",             hrFrom: "Turske" },
  // ── Americas ───────────────────────────────────────────────────────────────
  { value: "United States",         label: "United States",        srIn: "SAD-u",               srFrom: "SAD-a",               hrIn: "SAD-u",               hrFrom: "SAD-a" },
  { value: "Canada",                label: "Canada",               srIn: "Kanadi",              srFrom: "Kanade",              hrIn: "Kanadi",              hrFrom: "Kanade" },
  { value: "Mexico",                label: "Mexico",               srIn: "Meksiku",             srFrom: "Meksika",             hrIn: "Meksiku",             hrFrom: "Meksika" },
  { value: "Brazil",                label: "Brazil",               srIn: "Brazilu",             srFrom: "Brazila",             hrIn: "Brazilu",             hrFrom: "Brazila" },
  { value: "Argentina",             label: "Argentina",            srIn: "Argentini",           srFrom: "Argentine",           hrIn: "Argentini",           hrFrom: "Argentine" },
  { value: "Colombia",              label: "Colombia",             srIn: "Kolumbiji",           srFrom: "Kolumbije",           hrIn: "Kolumbiji",           hrFrom: "Kolumbije" },
  { value: "Chile",                 label: "Chile",                srIn: "Čileu",               srFrom: "Čilea",               hrIn: "Čileu",               hrFrom: "Čilea" },
  // ── Asia & Oceania ─────────────────────────────────────────────────────────
  { value: "Australia",             label: "Australia",            srIn: "Australiji",          srFrom: "Australije",          hrIn: "Australiji",          hrFrom: "Australije" },
  { value: "New Zealand",           label: "New Zealand",          srIn: "Novom Zelandu",       srFrom: "Novog Zelanda",       hrIn: "Novom Zelandu",       hrFrom: "Novog Zelanda" },
  { value: "China",                 label: "China",                srIn: "Kini",                srFrom: "Kine",                hrIn: "Kini",                hrFrom: "Kine" },
  { value: "Japan",                 label: "Japan",                srIn: "Japanu",              srFrom: "Japana",              hrIn: "Japanu",              hrFrom: "Japana" },
  { value: "South Korea",           label: "South Korea",          srIn: "Južnoj Koreji",       srFrom: "Južne Koreje",        hrIn: "Južnoj Koreji",       hrFrom: "Južne Koreje" },
  { value: "India",                 label: "India",                srIn: "Indiji",              srFrom: "Indije",              hrIn: "Indiji",              hrFrom: "Indije" },
  { value: "Thailand",              label: "Thailand",             srIn: "Tajlandu",            srFrom: "Tajlanda",            hrIn: "Tajlandu",            hrFrom: "Tajlanda" },
  { value: "Vietnam",               label: "Vietnam",              srIn: "Vijetnamu",           srFrom: "Vijetnama",           hrIn: "Vijetnamu",           hrFrom: "Vijetnama" },
  { value: "Indonesia",             label: "Indonesia",            srIn: "Indoneziji",          srFrom: "Indonezije",          hrIn: "Indoneziji",          hrFrom: "Indonezije" },
  // ── Middle East & Africa ───────────────────────────────────────────────────
  { value: "Israel",                label: "Israel",               srIn: "Izraelu",             srFrom: "Izraela",             hrIn: "Izraelu",             hrFrom: "Izraela" },
  { value: "Egypt",                 label: "Egypt",                srIn: "Egiptu",              srFrom: "Egipta",              hrIn: "Egiptu",              hrFrom: "Egipta" },
  { value: "Morocco",               label: "Morocco",              srIn: "Maroku",              srFrom: "Maroka",              hrIn: "Maroku",              hrFrom: "Maroka" },
  { value: "South Africa",          label: "South Africa",         srIn: "Južnoj Africi",       srFrom: "Južne Afrike",        hrIn: "Južnoj Africi",       hrFrom: "Južne Afrike" },
  { value: "Nigeria",               label: "Nigeria",              srIn: "Nigeriji",            srFrom: "Nigerije",            hrIn: "Nigeriji",            hrFrom: "Nigerije" },
]

export function findCountry(englishName: string | null | undefined): Country | undefined {
  if (!englishName) return undefined
  return COUNTRIES.find((c) => c.value.toLowerCase() === englishName.toLowerCase())
}
