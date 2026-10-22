import type { ContentItem } from '../content/schema'

// DEVELOPMENT SAMPLE ONLY: a few common entries written for testing the app. Not official content,
// not reviewed by an expert, and not current affairs (none are included: news must come from a dated source).
export const DEV_PACK = 'dev-sample'
const base = { pack: DEV_PACK, synonyms: [], antonyms: [], examples: [], tags: ['DEV SAMPLE'], verification: 'unverified' as const, language: 'en', source: { label: 'DEV SAMPLE: written for app testing' } }

export const DEV_CONTENT: ContentItem[] = [
  { ...base, id: 'DEVC-W1', kind: 'word', front: 'Abundant', back: 'Existing in large quantities; plentiful', telugu: 'సమృద్ధిగా', synonyms: ['Plentiful', 'Ample'], antonyms: ['Scarce'], examples: ['Rainfall was abundant this year.'] },
  { ...base, id: 'DEVC-W2', kind: 'word', front: 'Benevolent', back: 'Kind and generous', synonyms: ['Kind', 'Charitable'], antonyms: ['Malevolent'], examples: ['A benevolent donor paid for the library.'] },
  { ...base, id: 'DEVC-W3', kind: 'word', front: 'Candid', back: 'Truthful and straightforward', synonyms: ['Frank', 'Honest'], antonyms: ['Evasive'], examples: ['She gave a candid answer.'] },
  { ...base, id: 'DEVC-W4', kind: 'word', front: 'Diligent', back: 'Hard-working and careful', synonyms: ['Industrious'], antonyms: ['Lazy'], examples: ['Diligent students revise every day.'] },
  { ...base, id: 'DEVC-W5', kind: 'word', front: 'Ephemeral', back: 'Lasting for a very short time', synonyms: ['Fleeting', 'Transient'], antonyms: ['Permanent'], examples: ['Fame on social media is often ephemeral.'] },
  { ...base, id: 'DEVC-I1', kind: 'idiom', front: 'Break the ice', back: 'To start a conversation in a social situation', examples: ['He told a joke to break the ice.'] },
  { ...base, id: 'DEVC-I2', kind: 'idiom', front: 'Once in a blue moon', back: 'Very rarely', examples: ['We meet once in a blue moon.'] },
  { ...base, id: 'DEVC-I3', kind: 'idiom', front: 'Hit the nail on the head', back: 'To describe exactly what is right or what the problem is', examples: ['You hit the nail on the head with that answer.'] },
  { ...base, id: 'DEVC-I4', kind: 'idiom', front: 'A piece of cake', back: 'Something very easy to do', examples: ['The first question was a piece of cake.'] },
  { ...base, id: 'DEVC-O1', kind: 'ows', front: 'One who knows everything', back: 'Omniscient' },
  { ...base, id: 'DEVC-O2', kind: 'ows', front: 'A place where birds are kept', back: 'Aviary' },
  { ...base, id: 'DEVC-O3', kind: 'ows', front: 'A person who loves books', back: 'Bibliophile' },
  { ...base, id: 'DEVC-O4', kind: 'ows', front: 'A person who cannot read or write', back: 'Illiterate' },
  { ...base, id: 'DEVC-G1', kind: 'grammar', front: 'Subject–verb agreement', back: 'A singular subject takes a singular verb and a plural subject takes a plural verb.', examples: ['She writes daily.', 'They write daily.'] },
  { ...base, id: 'DEVC-P14', kind: 'polity', article: '14', textType: 'simplified', front: 'Article 14: Equality before law', back: 'Everyone in India is equal before the law and is entitled to equal protection of the laws.' },
  { ...base, id: 'DEVC-P17', kind: 'polity', article: '17', textType: 'simplified', front: 'Article 17: Abolition of untouchability', back: 'Untouchability is abolished and its practice in any form is forbidden; enforcing any disability arising from it is an offence punishable by law.' },
  { ...base, id: 'DEVC-P21', kind: 'polity', article: '21', textType: 'simplified', front: 'Article 21: Protection of life and personal liberty', back: 'No person can be deprived of life or personal liberty except according to procedure established by law.' },
]
