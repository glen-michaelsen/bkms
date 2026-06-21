export type LetterPhonetic = {
  sounds: string   // short description of the sound
  think: string    // English word/phrase that mimics it
}

export const SR_PHONETICS: Record<string, LetterPhonetic> = {
  "A":  { sounds: 'Pure "ah" — open and clear',              think: '"f**a**ther", "sp**a**"' },
  "B":  { sounds: 'Like "b" in English',                     think: '"**b**ed", "**b**all"' },
  "C":  { sounds: '"ts" — both sounds run together',         think: '"pi**zz**a", "ca**ts**"' },
  "Č":  { sounds: '"ch" — strong and sharp',                 think: '"**ch**urch", "**ch**eese"' },
  "Ć":  { sounds: 'Softer "ch" — tip of tongue forward',    think: '"**ch**eer", "a**ch**ieve" (but lighter)' },
  "D":  { sounds: 'Like "d" in English',                     think: '"**d**og", "**d**ay"' },
  "DŽ": { sounds: '"j" as in jungle — hard affricate',       think: '"**j**ungle", "**j**udge"' },
  "Đ":  { sounds: 'Soft "j" — between D and the Y in "you"', think: '"**d**uke" (British), "sol**d**ier"' },
  "E":  { sounds: '"eh" — short and clean',                  think: '"b**e**d", "t**e**n"' },
  "F":  { sounds: 'Like "f" in English',                     think: '"**f**un", "**f**ifty"' },
  "G":  { sounds: 'Always a hard "g" — never soft',          think: '"**g**o", "**g**ift"' },
  "H":  { sounds: '"h" but from deeper in the throat',       think: 'Stronger than "**h**at" — closer to "lo**ch**" (Scottish)' },
  "I":  { sounds: '"ee" — long and clear',                   think: '"s**ee**", "f**ee**t"' },
  "J":  { sounds: '"y" — always like in "yes", never like English J', think: '"**y**es", "**y**acht"' },
  "K":  { sounds: 'Like "k" in English',                     think: '"**k**it", "s**k**y"' },
  "L":  { sounds: 'Like "l" in English',                     think: '"**l**ove", "**l**amp"' },
  "LJ": { sounds: '"ly" run together — palatal L',           think: '"mi**ll**ion", "bi**ll**ion"' },
  "M":  { sounds: 'Like "m" in English',                     think: '"**m**ap", "**m**ilk"' },
  "N":  { sounds: 'Like "n" in English',                     think: '"**n**o", "**n**ame"' },
  "NJ": { sounds: '"ny" blended into one sound',             think: '"ca**ny**on", "o**ni**on"' },
  "O":  { sounds: '"oh" — round and pure, no glide',         think: '"m**o**re", "st**o**re" (without the trailing "w" sound)' },
  "P":  { sounds: 'Like "p" in English',                     think: '"**p**en", "**p**ark"' },
  "R":  { sounds: 'Rolled — the tip of the tongue vibrates', think: '"**R**oma" (Italian) or "pe**r**o" (Spanish)' },
  "S":  { sounds: 'Always a sharp "s" — never buzzy',        think: '"**s**un", "**s**even"' },
  "Š":  { sounds: '"sh"',                                    think: '"**sh**oe", "wi**sh**"' },
  "T":  { sounds: 'Like "t" in English',                     think: '"**t**op", "**t**ime"' },
  "U":  { sounds: '"oo" — round and pure',                   think: '"m**oo**n", "s**oo**n"' },
  "V":  { sounds: 'Like "v" in English',                     think: '"**v**an", "**v**ery"' },
  "Z":  { sounds: 'Like "z" in English',                     think: '"**z**oo", "**z**ero"' },
  "Ž":  { sounds: '"zh" — the voiced "sh"',                  think: '"mea**s**ure", "**g**enre"' },
}
