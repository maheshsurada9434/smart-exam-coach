// Reasoning: answers are computed (series, codes, directions, ranks, operations, Venn counts, puzzles) or come
// from fixed logic templates whose answers are known (syllogisms, blood relations).
import { collect, makeTools, mcq } from './lib.mjs'

const S = 'Reasoning'
const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')
const shift = (w, k) => [...w].map((c) => A[(A.indexOf(c) + k + 26 * 4) % 26]).join('')
const WORDS = ['CAT', 'DOG', 'SUN', 'PEN', 'BOOK', 'TREE', 'FISH', 'LAMP', 'MILK', 'ROSE', 'GOLD', 'SHIP', 'BIRD', 'CAKE', 'DESK', 'KING', 'LION', 'MOON', 'NEST', 'RAIN', 'SALT', 'TIME', 'WIND', 'BLUE', 'CODE', 'DATA', 'GAME', 'HOME', 'JUMP', 'PARK', 'ROAD', 'STAR', 'WORD', 'FARM', 'COLD', 'MIND', 'SNOW', 'BELL', 'COIN', 'FIRE']
const NAMES_M = ['Ravi', 'Amit', 'Suresh', 'Rahul', 'Vikram', 'Arjun', 'Kiran', 'Mohan', 'Rohit', 'Anil']
const NAMES_F = ['Priya', 'Sita', 'Anita', 'Meena', 'Kavya', 'Divya', 'Lakshmi', 'Neha', 'Pooja', 'Asha']
const PLURALS = ['pens', 'books', 'chairs', 'tables', 'birds', 'cars', 'trees', 'doctors', 'teachers', 'flowers', 'cups', 'boxes', 'stars', 'rivers', 'phones', 'bags', 'kites', 'lamps', 'clocks', 'shoes']
const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]
const ODD_COMPOSITES = [15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 77, 81, 85, 87, 91, 93, 95]

export function reasoning(seed = 202) {
  const t = makeTools(seed)
  const { int, pick, shuffle } = t
  const Q = (topic, o) => mcq(t, { subject: S, topic, ...o })
  const topics = {
    Series: () => {
      const v = int(0, 5)
      const n = 5
      let xs
      let next
      let rule
      if (v === 0) {
        const a = int(2, 40), d = int(3, 15)
        xs = Array.from({ length: n }, (_, i) => a + i * d)
        next = a + n * d
        rule = `Each term increases by ${d}.`
      } else if (v === 1) {
        const a = int(1, 6), r = pick([2, 3])
        xs = Array.from({ length: n }, (_, i) => a * r ** i)
        next = a * r ** n
        rule = `Each term is multiplied by ${r}.`
      } else if (v === 2) {
        const s = int(1, 8)
        xs = Array.from({ length: n }, (_, i) => (s + i) ** 2)
        next = (s + n) ** 2
        rule = `The terms are squares: ${s}², ${s + 1}², … so the next is ${s + n}².`
      } else if (v === 3) {
        const s = int(1, 5)
        xs = Array.from({ length: n }, (_, i) => (s + i) ** 3)
        next = (s + n) ** 3
        rule = `The terms are cubes: ${s}³, ${s + 1}³, … so the next is ${s + n}³.`
      } else if (v === 4) {
        const a = int(1, 20), d0 = int(1, 5), inc = int(1, 4)
        xs = [a]
        for (let i = 1; i <= n; i++) xs.push(xs[i - 1] + d0 + (i - 1) * inc)
        next = xs.pop()
        rule = `The differences increase by ${inc}: ${xs.slice(1).map((x, i) => x - xs[i]).join(', ')}, then ${next - xs[n - 1]}.`
      } else {
        const s = int(1, 9)
        xs = Array.from({ length: n }, (_, i) => (s + i) ** 2 + 1)
        next = (s + n) ** 2 + 1
        rule = `Each term is n² + 1 for n = ${s}, ${s + 1}, …`
      }
      return Q('Series', { text: `Find the next number in the series: ${xs.join(', ')}, ?`, answer: String(next), distractors: [next + 1, next - 2, next + 3, next * 2 - xs[n - 1]].map(String), explanation: `${rule} Next term = ${next}.`, difficulty: v >= 4 ? 'medium' : 'easy' })
    },
    'Coding-Decoding': () => {
      const v = int(0, 2)
      if (v === 0) {
        const k = pick([1, 2, 3, -1, -2])
        const [w1, w2] = shuffle(WORDS).slice(0, 2)
        const ans = shift(w2, k)
        return Q('Coding-Decoding', { text: `If ${w1} is coded as ${shift(w1, k)}, how is ${w2} coded?`, answer: ans, distractors: [shift(w2, k + 1), shift(w2, k - 1), shift(w2, -k), [...ans].reverse().join('')], explanation: `Each letter moves ${Math.abs(k)} place${Math.abs(k) > 1 ? 's' : ''} ${k > 0 ? 'forward' : 'back'} in the alphabet: ${w2} → ${ans}.`, difficulty: 'easy' })
      }
      if (v === 1) {
        const [w1, w2] = shuffle(WORDS).slice(0, 2)
        const val = (w) => [...w].reduce((s, c) => s + A.indexOf(c) + 1, 0)
        return Q('Coding-Decoding', { text: `If ${w1} = ${val(w1)} (sum of the alphabet positions of its letters), what is ${w2}?`, answer: String(val(w2)), distractors: [val(w2) + 1, val(w2) - 2, val(w2) + w2.length, val(w1)].map(String), explanation: `${[...w2].map((c) => `${c}=${A.indexOf(c) + 1}`).join(', ')}; total = ${val(w2)}.`, difficulty: 'medium' })
      }
      const [w1, w2] = shuffle(WORDS.filter((w) => w.length === 4)).slice(0, 2)
      const rev = (w) => [...w].reverse().join('')
      return Q('Coding-Decoding', { text: `If ${w1} is written as ${rev(w1)}, how is ${w2} written?`, answer: rev(w2), distractors: [shift(w2, 1), w2.slice(2) + w2.slice(0, 2), rev(shift(w2, 1)), w2[1] + w2[0] + w2[3] + w2[2]], explanation: `The letters are written in reverse order: ${w2} → ${rev(w2)}.`, difficulty: 'easy' })
    },
    Analogy: () => {
      const v = int(0, 2)
      const a = int(2, 12)
      let b = int(2, 12)
      if (a === b) b = a + 1
      if (v === 0) return Q('Analogy', { text: `${a} : ${a * a} :: ${b} : ?`, answer: String(b * b), distractors: [b * b + 1, b * 2, b ** 3, b * b - b].map(String), explanation: `The second number is the square of the first: ${b}² = ${b * b}.`, difficulty: 'easy' })
      if (v === 1) {
        const x = int(2, 9)
        let y = int(2, 9)
        if (x === y) y = x === 9 ? 2 : x + 1
        return Q('Analogy', { text: `${x} : ${x ** 3} :: ${y} : ?`, answer: String(y ** 3), distractors: [y * y, y ** 3 + y, y ** 3 - 1, y * 3].map(String), explanation: `The second number is the cube of the first: ${y}³ = ${y ** 3}.`, difficulty: 'easy' })
      }
      const k = int(1, 4)
      const i = int(0, 20 - k)
      let j = int(0, 20 - k)
      if (i === j) j = (i + 3) % (20 - k)
      const pair = (p) => A[p] + A[p + 1]
      const ans = A[j + k] + A[j + k + 1]
      return Q('Analogy', { text: `${pair(i)} : ${A[i + k] + A[i + k + 1]} :: ${pair(j)} : ?`, answer: ans, distractors: [A[j + k + 1] + A[j + k + 2], A[j + k - 1] + A[j + k], A[j + k] + A[j + k + 2], A[j + k + 1] + A[j + k]], explanation: `Each letter moves ${k} place${k > 1 ? 's' : ''} forward: ${pair(j)} → ${ans}.`, difficulty: 'medium' })
    },
    Classification: () => {
      const v = int(0, 1)
      if (v === 0) {
        const ps = shuffle(PRIMES).slice(0, 3)
        const odd = pick(ODD_COMPOSITES)
        const set = shuffle([...ps, odd])
        return Q('Classification', { text: `Find the odd one out: ${set.join(', ')}`, answer: String(odd), distractors: ps.map(String), explanation: `${ps.join(', ')} are prime numbers; ${odd} is not (it has factors other than 1 and itself).`, difficulty: 'medium' })
      }
      const k = pick([3, 4, 6, 7, 8, 9, 11, 12])
      const ms = shuffle(Array.from({ length: 9 }, (_, i) => k * (i + 2))).slice(0, 3)
      let other = int(k * 2, k * 10)
      while (other % k === 0) other++
      // Reject sets where another number also stands out (only even/odd one, or only perfect square).
      const all = [...ms, other]
      const loner = (test) => {
        const hit = all.filter(test)
        if (hit.length === 1) return hit[0]
        if (hit.length === 3) return all.find((n) => !test(n))
        return hit.length === 2 ? -1 : null
      }
      for (const test of [(n) => n % 2 === 0, (n) => Number.isInteger(Math.sqrt(n))]) {
        const l = loner(test)
        if (l !== null && l !== other) return null
      }
      return Q('Classification', { text: `Find the odd one out: ${shuffle([...ms, other]).join(', ')}`, answer: String(other), distractors: ms.map(String), explanation: `${ms.join(', ')} are multiples of ${k}; ${other} is not.`, difficulty: 'easy' })
    },
    'Direction Sense': () => {
      const [x, y, h] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25]])
      const name = pick([...NAMES_M, ...NAMES_F])
      const first = pick(['north', 'south'])
      const turn = pick(['right', 'left'])
      const east = (first === 'north') === (turn === 'right')
      const dir = `${first === 'north' ? 'North' : 'South'}-${east ? 'East' : 'West'}`
      if (int(0, 1) === 0)
        return Q('Direction Sense', { text: `${name} walks ${y} km ${first}, then turns ${turn} and walks ${x} km. How far is ${name} from the starting point?`, answer: `${h} km`, distractors: [x + y, y - x, h + 1, x * 2].map((d) => `${d} km`), explanation: `The two walks are at right angles, so distance = √(${y}² + ${x}²) = √${y * y + x * x} = ${h} km.`, difficulty: 'medium' })
      const others = ['North-East', 'North-West', 'South-East', 'South-West'].filter((d) => d !== dir)
      return Q('Direction Sense', { text: `${name} walks ${y} km ${first}, then turns ${turn} and walks ${x} km. In which direction is ${name} now from the starting point?`, answer: dir, distractors: others, explanation: `Facing ${first}, a ${turn} turn means facing ${east ? 'east' : 'west'}. So ${name} ends up to the ${dir} of the start.`, difficulty: 'medium' })
    },
    'Order and Ranking': () => {
      const v = int(0, 1)
      if (v === 0) {
        const l = int(3, 30), r = int(3, 30)
        const name = pick([...NAMES_M, ...NAMES_F])
        return Q('Order and Ranking', { text: `In a row, ${name} is ${ord(l)} from the left and ${ord(r)} from the right. How many people are in the row?`, answer: String(l + r - 1), distractors: [l + r, l + r + 1, l + r - 2, Math.abs(l - r) + 1].map(String), explanation: `Total = left position + right position − 1 = ${l} + ${r} − 1 = ${l + r - 1}.`, difficulty: 'easy' })
      }
      const n = int(20, 60), top = int(2, n - 1)
      const name = pick([...NAMES_M, ...NAMES_F])
      return Q('Order and Ranking', { text: `In a class of ${n} students, ${name} ranks ${ord(top)} from the top. What is ${name}'s rank from the bottom?`, answer: String(n - top + 1), distractors: [n - top, n - top + 2, top, n - top - 1].map(String), explanation: `Rank from bottom = total − rank from top + 1 = ${n} − ${top} + 1 = ${n - top + 1}.`, difficulty: 'easy' })
    },
    'Mathematical Operations': () => {
      // Symbols are swapped; the expression is evaluated with normal BODMAS after replacing them.
      const maps = [
        { '+': '×', '×': '−', '−': '÷', '÷': '+' },
        { '+': '−', '−': '+', '×': '÷', '÷': '×' },
        { '+': '÷', '÷': '+', '×': '−', '−': '×' },
      ]
      const m = pick(maps)
      const desc = Object.entries(m).map(([k, v]) => `'${k}' means '${v}'`).join(', ')
      const ops = ['+', '×', '−', '÷']
      const shown = shuffle(ops).slice(0, 3)
      const real = shown.map((o) => m[o])
      const nums = [int(2, 20), int(2, 12), int(2, 12), int(2, 12)]
      // Make every real division exact by choosing the dividend as a multiple.
      for (let i = 0; i < 3; i++) if (real[i] === '÷') nums[i] = nums[i + 1] * int(1, 6)
      const js = (o) => ({ '+': '+', '−': '-', '×': '*', '÷': '/' })[o]
      const expr = nums.map((n, i) => (i < 3 ? `${n} ${js(real[i])} ` : `${n}`)).join('')
      const val = Function(`return (${expr})`)()
      if (!Number.isInteger(val)) return null
      const shownExpr = nums.map((n, i) => (i < 3 ? `${n} ${shown[i]} ` : `${n}`)).join('')
      const realExpr = nums.map((n, i) => (i < 3 ? `${n} ${real[i]} ` : `${n}`)).join('')
      return Q('Mathematical Operations', { text: `If ${desc}, what is the value of ${shownExpr}?`, answer: String(val), distractors: [val + 2, val - 3, val + 10, -val || 7].map(String), explanation: `Replace the symbols: ${realExpr}. Using BODMAS, the value is ${val}.`, difficulty: 'hard' })
    },
    'Blood Relations': () => {
      const m = shuffle(NAMES_M), f = shuffle(NAMES_F)
      const T = [
        [`${m[0]} is the brother of ${f[0]}. ${f[0]} is the daughter of ${m[1]}. How is ${m[0]} related to ${m[1]}?`, 'Son', ['Brother', 'Father', 'Nephew'], `${f[0]} is ${m[1]}'s daughter and ${m[0]} is her brother, so ${m[0]} is ${m[1]}'s son.`],
        [`${f[0]} is the mother of ${m[0]}. ${m[0]} is the father of ${f[1]}. How is ${f[0]} related to ${f[1]}?`, 'Grandmother', ['Mother', 'Aunt', 'Sister'], `${f[0]} is the mother of ${f[1]}'s father, i.e. her grandmother.`],
        [`${m[0]} is the son of ${m[1]}. ${m[2]} is the brother of ${m[1]}. How is ${m[2]} related to ${m[0]}?`, 'Uncle', ['Father', 'Brother', 'Cousin'], `${m[2]} is the brother of ${m[0]}'s father, so he is ${m[0]}'s uncle.`],
        [`${f[0]} is the sister of ${m[0]}. ${m[0]} is the son of ${f[1]}. How is ${f[1]} related to ${f[0]}?`, 'Mother', ['Sister', 'Aunt', 'Grandmother'], `${f[0]} and ${m[0]} are siblings, and ${f[1]} is ${m[0]}'s mother, so she is also ${f[0]}'s mother.`],
        [`${m[0]} is the husband of ${f[0]}. ${f[0]} is the mother of ${m[1]}. How is ${m[0]} related to ${m[1]}?`, 'Father', ['Uncle', 'Brother', 'Grandfather'], `${m[0]} is married to ${m[1]}'s mother, so he is ${m[1]}'s father.`],
        [`${m[0]} is the father of ${m[1]}. ${m[1]} is the father of ${m[2]}. How is ${m[2]} related to ${m[0]}?`, 'Grandson', ['Son', 'Nephew', 'Brother'], `${m[2]} is the son of ${m[0]}'s son, i.e. his grandson.`],
        [`${f[0]} is the daughter of ${m[0]}. ${m[1]} is the son of ${m[0]}. How is ${f[0]} related to ${m[1]}?`, 'Sister', ['Daughter', 'Mother', 'Cousin'], `Both are children of ${m[0]}, so ${f[0]} is ${m[1]}'s sister.`],
        [`${m[0]} is the brother of ${m[1]}. ${f[0]} is the daughter of ${m[1]}. How is ${m[0]} related to ${f[0]}?`, 'Uncle', ['Father', 'Brother', 'Grandfather'], `${m[0]} is the brother of ${f[0]}'s father, so he is her uncle.`],
        [`${f[0]} is the wife of ${m[0]}. ${m[0]} is the only son of ${f[1]}. How is ${f[1]} related to ${f[0]}?`, 'Mother-in-law', ['Mother', 'Sister-in-law', 'Aunt'], `${f[1]} is the mother of ${f[0]}'s husband, i.e. her mother-in-law.`],
        [`${m[0]} is the father of ${f[0]}. ${f[1]} is the sister of ${m[0]}. How is ${f[1]} related to ${f[0]}?`, 'Aunt', ['Mother', 'Sister', 'Grandmother'], `${f[1]} is the sister of ${f[0]}'s father, so she is ${f[0]}'s aunt.`],
      ]
      const [text, answer, wrong, explanation] = pick(T)
      return Q('Blood Relations', { text, answer, distractors: wrong, explanation, difficulty: 'medium' })
    },
    Syllogism: () => {
      const [x, y, z] = shuffle(PLURALS).slice(0, 3)
      const O = ['Only conclusion I follows', 'Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows']
      const T = [
        [`All ${x} are ${y}. All ${y} are ${z}.`, `I. All ${x} are ${z}. II. Some ${z} are ${x}.`, 2, `All ${x} are inside ${y}, which are inside ${z}, so all ${x} are ${z}; and then some ${z} must be ${x}.`],
        [`Some ${x} are ${y}. All ${y} are ${z}.`, `I. Some ${x} are ${z}. II. All ${z} are ${x}.`, 0, `The ${x} that are ${y} are also ${z}, so some ${x} are ${z}. Nothing says every ${z} is a ${x}.`],
        [`No ${x} are ${y}. All ${y} are ${z}.`, `I. No ${x} are ${z}. II. Some ${z} are not ${x}.`, 1, `The ${z} that are ${y} cannot be ${x}, so some ${z} are not ${x}. But some ${x} could still be ${z}.`],
        [`All ${x} are ${y}. No ${y} are ${z}.`, `I. No ${x} are ${z}. II. Some ${y} are ${x}.`, 2, `Every ${x} is a ${y} and no ${y} is a ${z}, so no ${x} is a ${z}; and some ${y} are ${x}.`],
        [`Some ${x} are ${y}. Some ${y} are ${z}.`, `I. Some ${x} are ${z}. II. All ${z} are ${y}.`, 3, `Two "some" statements give no definite link between ${x} and ${z}, and nothing says every ${z} is a ${y}, so neither conclusion follows.`],
        [`All ${x} are ${y}. Some ${z} are ${x}.`, `I. Some ${z} are ${y}. II. All ${y} are ${x}.`, 0, `The ${z} that are ${x} are also ${y}, so some ${z} are ${y}. The second does not follow.`],
      ]
      const [st, concl, ans, why] = pick(T)
      return Q('Syllogism', { text: `Statements: ${st} Conclusions: ${concl} Which conclusion(s) follow?`, answer: O[ans], distractors: O.filter((_, i) => i !== ans), explanation: why, difficulty: 'medium' })
    },
    'Venn Diagrams': () => {
      const n = int(40, 120)
      const both = int(3, 20)
      const a = int(both + 5, Math.floor(n / 2))
      const b = int(both + 5, Math.floor(n / 2))
      const neither = n - (a + b - both)
      if (neither < 0) return null
      const [p, q] = pick([['tea', 'coffee'], ['cricket', 'football'], ['Hindi', 'English'], ['music', 'dance'], ['maths', 'science']])
      return Q('Venn Diagrams', { text: `In a group of ${n} people, ${a} like ${p}, ${b} like ${q} and ${both} like both. How many like neither?`, answer: String(neither), distractors: [n - a - b, neither + both, n - both, neither + 5].map(String), explanation: `At least one = ${a} + ${b} − ${both} = ${a + b - both}. Neither = ${n} − ${a + b - both} = ${neither}.`, difficulty: 'medium' })
    },
    Puzzles: () => {
      const v = int(0, 1)
      const [p, q] = [pick(NAMES_M), pick(NAMES_F)]
      if (v === 0) {
        const younger = int(8, 30), d = int(2, 12)
        const s = 2 * younger + d
        return Q('Puzzles', { text: `${p} is ${d} years older than ${q}. The sum of their ages is ${s}. How old is ${p}?`, answer: String(younger + d), distractors: [younger, s / 2, younger + d + 2, s - d].map(String), explanation: `${q} = (${s} − ${d}) ÷ 2 = ${younger}; ${p} = ${younger} + ${d} = ${younger + d}.`, difficulty: 'easy' })
      }
      const now = int(5, 15), k = pick([2, 3, 4])
      const yrs = int(2, 10)
      const father = now * k
      return Q('Puzzles', { text: `A father is ${k} times as old as his son. The son is ${now} years old. How old will the father be after ${yrs} years?`, answer: String(father + yrs), distractors: [father, (now + yrs) * k, father - yrs, father + yrs * k].map(String), explanation: `Father now = ${k} × ${now} = ${father}. After ${yrs} years: ${father + yrs}.`, difficulty: 'easy' })
    },
  }
  const per = { Series: 50, 'Coding-Decoding': 45, Analogy: 40, Classification: 35, 'Direction Sense': 35, 'Order and Ranking': 35, 'Mathematical Operations': 35, 'Blood Relations': 30, Syllogism: 25, 'Venn Diagrams': 35, Puzzles: 35 }
  return Object.entries(per).flatMap(([topic, n]) => collect(n, () => topics[topic]()))
}
