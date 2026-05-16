export type CaseEnding = {
  gender: string
  singular: string
  plural: string
}

export type Example = {
  sr: string       // Serbian sentence
  hr?: string      // Croatian — only set when it differs from Serbian
  english: string
}

export type CaseQuestion = {
  sr: string       // Serbian question word(s)
  hr?: string      // Croatian — only set when it differs
  english: string
}

export type GrammarCase = {
  id: string
  number: number
  srName: string
  hrName: string
  englishName: string
  usedFor: string[]
  prepositions?: { prep: string; meaning: string }[]
  prepositionNote?: string
  examples: Example[]
  questions: CaseQuestion[]
  endings: CaseEnding[]
  endingNote?: string
}

export const CASES: GrammarCase[] = [
  {
    id: "nominative",
    number: 1,
    srName: "Nominativ",
    hrName: "Nominativ",
    englishName: "Nominative",
    usedFor: [
      "The subject of the sentence — the person or thing doing the action",
      "Saying what or who something is (with the verb 'to be')",
      "This is the dictionary form — how you find a word in a dictionary",
    ],
    examples: [
      { sr: "On je student.",        english: "He is a student." },
      { sr: "Ona je učiteljica.",     english: "She is a teacher." },
      { sr: "Pas spava.",             english: "The dog is sleeping." },
      { sr: "Kuća je velika.",        english: "The house is big." },
      { sr: "Marko i Ana su prijatelji.", english: "Marko and Ana are friends." },
    ],
    questions: [
      { sr: "Ko?",   hr: "Tko?",  english: "Who?" },
      { sr: "Šta?",  hr: "Što?",  english: "What?" },
    ],
    endings: [
      { gender: "Masculine",  singular: "– / -o / -e",  plural: "-i" },
      { gender: "Feminine",   singular: "-a",            plural: "-e" },
      { gender: "Neuter",     singular: "-o / -e",       plural: "-a" },
    ],
  },

  {
    id: "genitive",
    number: 2,
    srName: "Genitiv",
    hrName: "Genitiv",
    englishName: "Genitive",
    usedFor: [
      "Possession or belonging — 'something of/belonging to someone'",
      "After many prepositions (see list below)",
      "Expressing absence or lack ('there is no …')",
    ],
    prepositions: [
      { prep: "od",   meaning: "from / of" },
      { prep: "do",   meaning: "to / until" },
      { prep: "iz",   meaning: "from / out of" },
      { prep: "bez",  meaning: "without" },
      { prep: "oko",  meaning: "around / about" },
      { prep: "pored",meaning: "next to" },
      { prep: "blizu",meaning: "near / close to" },
    ],
    examples: [
      { sr: "Knjiga brata je na stolu.",  english: "My brother's book is on the table." },
      { sr: "Idem do škole.",             english: "I am going to school." },
      { sr: "Dolazim iz Beograda.",       english: "I come from Belgrade." },
      { sr: "Bojim se psa.",              english: "I am afraid of the dog." },
      { sr: "Nema vode.",                 english: "There is no water." },
    ],
    questions: [
      { sr: "Čij / Čija / Čije?", english: "Whose?" },
      { sr: "Odakle?",            english: "Where from?" },
    ],
    endings: [
      { gender: "Masculine", singular: "-a",  plural: "-a / -ova / -eva" },
      { gender: "Feminine",  singular: "-e",  plural: "-a" },
      { gender: "Neuter",    singular: "-a",  plural: "-a" },
    ],
  },

  {
    id: "dative",
    number: 3,
    srName: "Dativ",
    hrName: "Dativ",
    englishName: "Dative",
    usedFor: [
      "The indirect object — showing who something is given, said, or done to",
      "Corresponds to 'to someone' or 'for someone' in English",
      "Used with verbs like: dati (give), reći (say), pisati (write), pokazati (show), pomagati (help)",
    ],
    examples: [
      { sr: "Dajem knjigu bratu.",       english: "I am giving the book to my brother." },
      { sr: "Pišem pismo učiteljici.",   english: "I am writing a letter to the teacher." },
      { sr: "Pomogao sam drugovima.",    english: "I helped my friends." },
      { sr: "On priča detetu.",          english: "He is talking to the child." },
      { sr: "Hvala tebi!",               english: "Thank you! (lit. Thanks to you!)" },
    ],
    questions: [
      { sr: "Kome?", english: "To whom?" },
      { sr: "Čemu?", english: "To what?" },
    ],
    endings: [
      { gender: "Masculine", singular: "-u",  plural: "-ima" },
      { gender: "Feminine",  singular: "-i",  plural: "-ima" },
      { gender: "Neuter",    singular: "-u",  plural: "-ima" },
    ],
  },

  {
    id: "accusative",
    number: 4,
    srName: "Akuzativ",
    hrName: "Akuzativ",
    englishName: "Accusative",
    usedFor: [
      "The direct object — the person or thing that the action directly affects",
      "Corresponds to 'what' or 'whom' after a verb: 'I see the dog', 'She has a book'",
      "Also used after many prepositions of direction (u, na, za, kroz, etc.)",
    ],
    examples: [
      { sr: "Vidim brata.",        english: "I see my brother." },
      { sr: "Imam knjigu.",        english: "I have a book." },
      { sr: "Kupujem auto.",       english: "I am buying a car." },
      { sr: "Volim tebe.",         english: "I love you." },
      { sr: "Gledam film.",        english: "I am watching a film." },
    ],
    questions: [
      { sr: "Koga?",  english: "Whom?" },
      { sr: "Šta?",  hr: "Što?",  english: "What?" },
    ],
    endings: [
      { gender: "Masculine (animate)", singular: "-a",            plural: "-e" },
      { gender: "Masculine (inanimate)",singular: "= nominative", plural: "= nominative" },
      { gender: "Feminine",            singular: "-u",            plural: "-e" },
      { gender: "Neuter",              singular: "= nominative",  plural: "= nominative" },
    ],
  },

  {
    id: "vocative",
    number: 5,
    srName: "Vokativ",
    hrName: "Vokativ",
    englishName: "Vocative",
    usedFor: [
      "Directly addressing a person, animal, or personified thing",
      "Used in speech, exclamations, and when calling out to someone",
      "In English we don't change the word, just add a comma: 'Hello, Peter!' — in Serbian/Croatian the name itself changes form",
    ],
    examples: [
      { sr: "Zdravo, Petre!",        english: "Hello, Peter!" },
      { sr: "Ćao, Milice!",          english: "Hey, Milica!" },
      { sr: "Dođi, sine!",           english: "Come, son!" },
      { sr: "Gde si, brate?",  hr: "Gdje si, brate?",  english: "Where are you, brother?" },
      { sr: "Hvala ti, druže.",       english: "Thank you, friend." },
    ],
    questions: [
      { sr: "–", english: "No question word — it's used when calling or addressing directly" },
    ],
    endings: [
      { gender: "Masculine (ends in consonant)", singular: "-e",                      plural: "–" },
      { gender: "Masculine (ends in -a)",        singular: "-o",                      plural: "–" },
      { gender: "Feminine",                      singular: "-o",                      plural: "–" },
      { gender: "Neuter",                        singular: "rarely changes",           plural: "–" },
    ],
    endingNote: "Vocative plural is rarely used — most speakers default to nominative plural.",
  },

  {
    id: "instrumental",
    number: 6,
    srName: "Instrumental",
    hrName: "Instrumental",
    englishName: "Instrumental",
    usedFor: [
      "Expressing means or instrument — 'with what' something is done",
      "Expressing company or accompaniment — 'with whom' something happens",
      "Corresponds to English 'with', 'by means of', or 'by' (e.g. by car)",
    ],
    prepositions: [
      { prep: "sa / s",  meaning: "with (a person or thing)" },
      { prep: "između",  meaning: "between" },
      { prep: "pred",    meaning: "in front of" },
      { prep: "za",      meaning: "behind / for (position)" },
      { prep: "nad",     meaning: "above / over" },
      { prep: "pod",     meaning: "under / below" },
    ],
    prepositionNote: "Without a preposition the instrumental expresses the means/tool. With 'sa/s' it expresses company.",
    examples: [
      { sr: "Idem sa prijateljem.",          english: "I am going with a friend." },
      { sr: "Pišem olovkom.",                english: "I am writing with a pencil." },
      { sr: "Putujem autom.",                english: "I am travelling by car." },
      { sr: "Ona jede kašikom.",             english: "She is eating with a spoon." },
      { sr: "On govori sa učiteljicom.",     english: "He is talking with the teacher." },
    ],
    questions: [
      { sr: "S kim?",  english: "With whom?" },
      { sr: "Čim?",   english: "With what? / By means of what?" },
    ],
    endings: [
      { gender: "Masculine", singular: "-om / -em", plural: "-ima" },
      { gender: "Feminine",  singular: "-om",        plural: "-ama" },
      { gender: "Neuter",    singular: "-om",        plural: "-ima" },
    ],
  },

  {
    id: "locative",
    number: 7,
    srName: "Lokativ",
    hrName: "Lokativ",
    englishName: "Locative",
    usedFor: [
      "Indicating location — where something is or where something happens",
      "Indicating topic — what something is about",
      "Always used with a preposition — never alone",
    ],
    prepositions: [
      { prep: "u",   meaning: "in / inside" },
      { prep: "na",  meaning: "on / at" },
      { prep: "o",   meaning: "about (when talking about something)" },
      { prep: "po",  meaning: "around / throughout / after" },
      { prep: "pri", meaning: "at / by (less common)" },
    ],
    prepositionNote: "The locative is the only case that is never used without a preposition.",
    examples: [
      { sr: "Ja sam u školi.",          english: "I am at school." },
      { sr: "Knjiga je na stolu.",       english: "The book is on the table." },
      { sr: "Razmišljam o tebi.",        english: "I am thinking about you." },
      { sr: "On radi u firmi.",          english: "He works in a company." },
      { sr: "Mi živimo u Beogradu.",     english: "We live in Belgrade." },
    ],
    questions: [
      { sr: "Gde?",    hr: "Gdje?",   english: "Where?" },
      { sr: "O čemu?",                english: "About what?" },
      { sr: "Na čemu?",               english: "On what?" },
    ],
    endings: [
      { gender: "Masculine", singular: "-u",  plural: "-ima" },
      { gender: "Feminine",  singular: "-i",  plural: "-ima" },
      { gender: "Neuter",    singular: "-u",  plural: "-ima" },
    ],
  },
]
