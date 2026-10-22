// Quantitative Aptitude: every answer, distractor and explanation is computed, so the key is correct by construction.
import { collect, fmt, frac, gcd, lcm, makeTools, mcq, rs } from './lib.mjs'

const S = 'Quantitative Aptitude'

export function quant(seed = 101) {
  const t = makeTools(seed)
  const { int, pick } = t
  const Q = (topic, o) => mcq(t, { subject: S, topic, ...o })
  const near = (a, ...d) => d.map((x) => a + x)
  const topics = {
    Percentage: () => {
      const v = int(0, 2)
      if (v === 0) {
        const p = pick([5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 60, 75, 80])
        const n = pick([40, 60, 80, 120, 140, 160, 180, 200, 240, 250, 300, 360, 400, 450, 500, 640, 720, 800])
        const a = (p * n) / 100
        if (!Number.isInteger(a)) return null
        return Q('Percentage', { text: `What is ${p}% of ${n}?`, answer: fmt(a), distractors: [a + p, a * 2, n - a, a + 10, a - 5].map(fmt), explanation: `${p}% of ${n} = ${n} × ${p} ÷ 100 = ${fmt(a)}.`, difficulty: 'easy' })
      }
      if (v === 1) {
        const y = pick([40, 50, 60, 80, 120, 150, 200, 250, 400, 500])
        const p = pick([10, 15, 20, 25, 30, 40, 45, 60, 75])
        const x = (p * y) / 100
        if (!Number.isInteger(x)) return null
        return Q('Percentage', { text: `${x} is what percent of ${y}?`, answer: `${p}%`, distractors: [p + 5, p - 5, p * 2, 100 - p].map((d) => `${d}%`), explanation: `${x} ÷ ${y} × 100 = ${p}%.` })
      }
      const n = pick([200, 250, 400, 500, 600, 800, 1200])
      const p = pick([10, 20, 25, 30, 40])
      const up = int(0, 1) === 1
      const a = up ? n + (n * p) / 100 : n - (n * p) / 100
      return Q('Percentage', { text: `If ${n} is ${up ? 'increased' : 'decreased'} by ${p}%, what is the new value?`, answer: fmt(a), distractors: [up ? n - (n * p) / 100 : n + (n * p) / 100, (n * p) / 100, a + 10, a - 20].map(fmt), explanation: `New value = ${n} × (100 ${up ? '+' : '−'} ${p}) ÷ 100 = ${fmt(a)}.` })
    },
    'Profit and Loss': () => {
      const cp = pick([200, 250, 400, 500, 600, 800, 1000, 1200, 1500, 2000])
      const p = pick([5, 10, 12, 15, 20, 25, 30, 40])
      const v = int(0, 2)
      if (v === 0) {
        const sp = (cp * (100 + p)) / 100
        return Q('Profit and Loss', { text: `An article bought for ${rs(cp)} is sold at a profit of ${p}%. What is the selling price?`, answer: rs(sp), distractors: [rs((cp * (100 - p)) / 100), rs(cp + p), rs(sp + 50), rs((cp * p) / 100)], explanation: `SP = CP × (100 + profit%) ÷ 100 = ${cp} × ${100 + p} ÷ 100 = ${rs(sp)}.` })
      }
      if (v === 1) {
        const sp = (cp * (100 - p)) / 100
        return Q('Profit and Loss', { text: `An article bought for ${rs(cp)} is sold at a loss of ${p}%. What is the selling price?`, answer: rs(sp), distractors: [rs((cp * (100 + p)) / 100), rs(cp - p), rs(sp - 40), rs((cp * p) / 100)], explanation: `SP = CP × (100 − loss%) ÷ 100 = ${cp} × ${100 - p} ÷ 100 = ${rs(sp)}.` })
      }
      const sp = (cp * (100 + p)) / 100
      return Q('Profit and Loss', { text: `A shopkeeper buys an item for ${rs(cp)} and sells it for ${rs(sp)}. What is his profit percentage?`, answer: `${p}%`, distractors: [p + 5, p - 2, p * 2, Math.round(((sp - cp) / sp) * 100) === p ? p + 10 : Math.round(((sp - cp) / sp) * 100)].map((d) => `${d}%`), explanation: `Profit = ${sp} − ${cp} = ${sp - cp}. Profit% = ${sp - cp} ÷ ${cp} × 100 = ${p}%.` })
    },
    Discount: () => {
      const v = int(0, 1)
      if (v === 0) {
        const mp = pick([400, 500, 800, 1000, 1200, 1500, 2000, 2400, 3000])
        const d = pick([10, 15, 20, 25, 30, 40])
        const sp = (mp * (100 - d)) / 100
        return Q('Discount', { text: `The marked price of a shirt is ${rs(mp)}. A discount of ${d}% is given. What is the selling price?`, answer: rs(sp), distractors: [rs((mp * d) / 100), rs(mp - d), rs((mp * (100 + d)) / 100), rs(sp + 100)], explanation: `SP = ${mp} × (100 − ${d}) ÷ 100 = ${rs(sp)}.`, difficulty: 'easy' })
      }
      const [d1, d2] = pick([[10, 10], [20, 10], [20, 20], [10, 5], [25, 20], [30, 10], [40, 25], [20, 25], [15, 20], [50, 10]])
      const single = d1 + d2 - (d1 * d2) / 100
      return Q('Discount', { text: `Two successive discounts of ${d1}% and ${d2}% are equal to a single discount of:`, answer: `${fmt(single)}%`, distractors: [`${d1 + d2}%`, `${fmt(single - 2)}%`, `${fmt(single + 1.5)}%`, `${Math.abs(d1 - d2) || 5}%`], explanation: `Single discount = ${d1} + ${d2} − (${d1} × ${d2}) ÷ 100 = ${fmt(single)}%.` })
    },
    'Simple Interest': () => {
      const P = pick([1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000])
      const R = pick([4, 5, 6, 8, 10, 12, 15])
      const T = pick([2, 3, 4, 5])
      const si = (P * R * T) / 100
      const v = int(0, 2)
      if (v === 0) return Q('Simple Interest', { text: `What is the simple interest on ${rs(P)} at ${R}% per annum for ${T} years?`, answer: rs(si), distractors: [rs((P * R) / 100), rs(si + P / 100), rs(P + si), rs(si * 2)], explanation: `SI = P × R × T ÷ 100 = ${P} × ${R} × ${T} ÷ 100 = ${rs(si)}.`, difficulty: 'easy' })
      if (v === 1) return Q('Simple Interest', { text: `What amount will ${rs(P)} become at ${R}% simple interest per annum after ${T} years?`, answer: rs(P + si), distractors: [rs(si), rs(P + si / T), rs(P + si * 2), rs(P + si + 100)], explanation: `SI = ${P} × ${R} × ${T} ÷ 100 = ${si}. Amount = ${P} + ${si} = ${rs(P + si)}.` })
      return Q('Simple Interest', { text: `${rs(P)} earns ${rs(si)} as simple interest in ${T} years. What is the rate of interest per annum?`, answer: `${R}%`, distractors: [R + 1, R + 2, R - 1 || 3, R * 2].map((d) => `${d}%`), explanation: `R = SI × 100 ÷ (P × T) = ${si} × 100 ÷ (${P} × ${T}) = ${R}%.` })
    },
    'Compound Interest': () => {
      const [P, R, T] = pick([[1000, 10, 2], [2000, 10, 2], [5000, 10, 2], [10000, 10, 2], [1000, 10, 3], [2000, 10, 3], [10000, 10, 3], [1000, 20, 2], [2500, 20, 2], [5000, 20, 2], [4000, 5, 2], [8000, 5, 2], [10000, 5, 2], [6250, 4, 2], [1600, 25, 2], [10000, 20, 3]])
      const amt = P * (1 + R / 100) ** T
      const ci = Math.round((amt - P) * 100) / 100
      const si = (P * R * T) / 100
      const v = int(0, 1)
      if (v === 0) return Q('Compound Interest', { text: `What is the compound interest on ${rs(P)} at ${R}% per annum for ${T} years, compounded annually?`, answer: rs(ci), distractors: [rs(si), rs(ci + P / 100), rs(Math.round(amt)), rs(ci - (P * R) / 1000)], explanation: `Amount = ${P} × (1 + ${R}/100)^${T} = ${fmt(amt)}. CI = ${fmt(amt)} − ${P} = ${rs(ci)}.`, difficulty: 'medium' })
      return Q('Compound Interest', { text: `What is the difference between compound interest and simple interest on ${rs(P)} at ${R}% per annum for ${T} years?`, answer: rs(Math.round((ci - si) * 100) / 100), distractors: [rs((P * R) / 100), rs(Math.round((ci - si) * 2 * 100) / 100), rs(si / T), rs(Math.round((ci - si + 10) * 100) / 100)], explanation: `CI = ${fmt(ci)}, SI = ${P} × ${R} × ${T} ÷ 100 = ${si}. Difference = ${rs(Math.round((ci - si) * 100) / 100)}.`, difficulty: 'hard' })
    },
    Average: () => {
      const v = int(0, 2)
      if (v === 0) {
        const n = int(4, 7)
        const xs = Array.from({ length: n }, () => int(10, 90))
        const s = xs.reduce((a, b) => a + b, 0)
        if (s % n) return null
        return Q('Average', { text: `What is the average of ${xs.join(', ')}?`, answer: fmt(s / n), distractors: [s / n + 1, s / n - 2, s / (n - 1), s / n + 3].map((x) => fmt(Math.round(x * 100) / 100)), explanation: `Sum = ${s}, count = ${n}, average = ${s} ÷ ${n} = ${fmt(s / n)}.`, difficulty: 'easy' })
      }
      if (v === 1) {
        const n = pick([10, 20, 25, 30, 40, 50, 60, 99, 100])
        return Q('Average', { text: `What is the average of the first ${n} natural numbers?`, answer: fmt((n + 1) / 2), distractors: [n / 2, (n + 2) / 2, n, (n - 1) / 2].map(fmt), explanation: `Average of 1 to n = (n + 1) ÷ 2 = (${n} + 1) ÷ 2 = ${fmt((n + 1) / 2)}.` })
      }
      const n = int(5, 12)
      const avg = int(20, 60)
      const extra = int(avg + 5, avg + 40)
      const newAvg = (n * avg + extra) / (n + 1)
      if (!Number.isInteger(newAvg)) return null
      return Q('Average', { text: `The average of ${n} numbers is ${avg}. When one more number is added, the average becomes ${newAvg}. What is the new number?`, answer: fmt(extra), distractors: [extra + n, extra - n, newAvg * 2, extra + 1].map(fmt), explanation: `New number = ${n + 1} × ${newAvg} − ${n} × ${avg} = ${(n + 1) * newAvg} − ${n * avg} = ${extra}.`, difficulty: 'medium' })
    },
    'Ratio and Proportion': () => {
      const v = int(0, 1)
      if (v === 0) {
        const a = int(1, 7)
        const b = int(1, 9)
        if (gcd(a, b) !== 1 || a === b) return null
        const k = pick([20, 25, 40, 50, 60, 80, 100, 120, 150, 200])
        const total = (a + b) * k
        return Q('Ratio and Proportion', { text: `${rs(total)} is divided between A and B in the ratio ${a} : ${b}. What is B's share?`, answer: rs(b * k), distractors: [rs(a * k), rs(total / 2), rs(b * k + k), rs(Math.abs(b - a) * k || k * 2)], explanation: `B's share = ${total} × ${b} ÷ (${a} + ${b}) = ${rs(b * k)}.`, difficulty: 'easy' })
      }
      const a = int(2, 9)
      const b = int(2, 12) * a
      const c = int(2, 9)
      const x = (b * c) / a
      return Q('Ratio and Proportion', { text: `Find the fourth proportional to ${a}, ${b} and ${c}.`, answer: fmt(x), distractors: [(a * c) / b, x + c, x - a, b + c].map((d) => fmt(Math.round(d * 100) / 100)), explanation: `${a} : ${b} = ${c} : x, so x = ${b} × ${c} ÷ ${a} = ${fmt(x)}.` })
    },
    'Time and Work': () => {
      const v = int(0, 2)
      if (v === 1) {
        const m1 = pick([4, 6, 8, 10, 12, 15, 16, 18, 20, 24, 30])
        const d1 = pick([5, 6, 8, 9, 10, 12, 15, 18, 20])
        const m2 = pick([3, 4, 5, 6, 8, 9, 10, 12, 15, 20, 24, 36, 40])
        const d2 = (m1 * d1) / m2
        if (!Number.isInteger(d2) || m1 === m2) return null
        return Q('Time and Work', { text: `${m1} workers can complete a job in ${d1} days. How many days will ${m2} workers take to complete the same job?`, answer: `${d2} days`, distractors: [(m2 * d1) / m1, d2 + 2, d1 + m1 - m2, d2 * 2].map((x) => `${fmt(Math.round(x * 10) / 10)} days`), explanation: `Work = workers × days = ${m1} × ${d1} = ${m1 * d1}. Days = ${m1 * d1} ÷ ${m2} = ${d2}.`, difficulty: 'easy' })
      }
      if (v === 2) {
        const a = int(6, 40)
        const d = int(2, a - 1)
        const b = (a * d) / (a - d)
        if (!Number.isInteger(b)) return null
        return Q('Time and Work', { text: `A and B together can finish a work in ${d} days. A alone can finish it in ${a} days. In how many days can B alone finish it?`, answer: `${b} days`, distractors: [a - d, b + 3, a + d, b - 2].map((x) => `${x} days`), explanation: `B's one-day work = 1/${d} − 1/${a} = ${a - d}/${a * d}. B alone takes ${a * d} ÷ ${a - d} = ${b} days.`, difficulty: 'medium' })
      }
      const a = int(4, 40)
      const b = int(a + 1, 60)
      const d = (a * b) / (a + b)
      if (!Number.isInteger(d)) return null
      return Q('Time and Work', { text: `A can finish a work in ${a} days and B can finish it in ${b} days. In how many days can they finish it working together?`, answer: `${d} days`, distractors: [(a + b) / 2, d + 2, d - 1, Math.abs(b - a)].map((x) => `${fmt(Math.round(x * 10) / 10)} days`), explanation: `Together per day = 1/${a} + 1/${b} = ${a + b}/${a * b}. Days = ${a * b} ÷ ${a + b} = ${d}.`, difficulty: 'medium' })
    },
    'Time, Speed and Distance': () => {
      const v = int(0, 3)
      if (v === 0) {
        const k = pick([18, 36, 54, 72, 90, 108, 126, 144])
        return Q('Time, Speed and Distance', { text: `Convert ${k} km/h into metres per second.`, answer: `${(k * 5) / 18} m/s`, distractors: [(k * 18) / 5, k / 2, (k * 5) / 18 + 5, k / 3.6 + 2].map((x) => `${fmt(Math.round(x * 10) / 10)} m/s`), explanation: `Multiply by 5/18: ${k} × 5 ÷ 18 = ${(k * 5) / 18} m/s.`, difficulty: 'easy' })
      }
      if (v === 1) {
        const s = pick([36, 54, 72, 90, 108])
        const ms = (s * 5) / 18
        const tm = int(6, 30)
        const L = ms * tm
        return Q('Time, Speed and Distance', { text: `A train ${L} m long runs at ${s} km/h. How long does it take to cross a pole?`, answer: `${tm} seconds`, distractors: [tm + 2, tm * 2, Math.round(L / s), tm - 3].map((x) => `${x} seconds`), explanation: `Speed = ${s} × 5/18 = ${ms} m/s. Time = ${L} ÷ ${ms} = ${tm} s.` })
      }
      if (v === 2) {
        const [x, y] = pick([[40, 60], [30, 60], [20, 30], [60, 90], [36, 45], [40, 120], [30, 70], [45, 90], [12, 24], [15, 30]])
        const avg = (2 * x * y) / (x + y)
        return Q('Time, Speed and Distance', { text: `A person goes to a place at ${x} km/h and returns at ${y} km/h. What is the average speed for the whole journey?`, answer: `${fmt(avg)} km/h`, distractors: [(x + y) / 2, avg + 4, avg - 3, y - x].map((z) => `${fmt(z)} km/h`), explanation: `Average speed for equal distances = 2xy ÷ (x + y) = 2 × ${x} × ${y} ÷ ${x + y} = ${fmt(avg)} km/h.`, difficulty: 'medium' })
      }
      const sp = pick([30, 40, 45, 50, 60, 72, 80])
      const h = pick([2, 3, 4, 5, 6])
      return Q('Time, Speed and Distance', { text: `A car travels at ${sp} km/h for ${h} hours. How far does it travel?`, answer: `${sp * h} km`, distractors: [sp + h, sp * (h + 1), (sp * h) / 2, sp * h + 20].map((z) => `${z} km`), explanation: `Distance = speed × time = ${sp} × ${h} = ${sp * h} km.`, difficulty: 'easy' })
    },
    'Number System': () => {
      const v = int(0, 2)
      if (v === 0) {
        const b = int(2, 19)
        const e = int(11, 99)
        let u = 1
        for (let i = 0; i < e; i++) u = (u * b) % 10
        return Q('Number System', { text: `What is the unit digit of ${b}^${e}?`, answer: String(u), distractors: [(u + 1) % 10, (u + 3) % 10, (u + 5) % 10, (u + 7) % 10].map(String), explanation: `Unit digits of powers of ${b % 10} repeat in a cycle. ${b}^${e} ends in ${u}.`, difficulty: 'medium' })
      }
      if (v === 1) {
        const d = pick([7, 9, 11, 12, 13, 15, 17, 19, 23])
        const n = int(100, 999)
        const add = (d - (n % d)) % d
        if (add === 0) return null
        return Q('Number System', { text: `What is the smallest number that must be added to ${n} to make it exactly divisible by ${d}?`, answer: String(add), distractors: [n % d, add + 1, d - 1, add + d - 2].map(String), explanation: `${n} ÷ ${d} leaves remainder ${n % d}. Add ${d} − ${n % d} = ${add}.` })
      }
      const n = pick([10, 15, 20, 25, 30, 40, 50, 60, 100])
      return Q('Number System', { text: `What is the sum of the first ${n} natural numbers?`, answer: fmt((n * (n + 1)) / 2), distractors: [n * n, (n * (n - 1)) / 2, (n * (n + 1)) / 2 + n, n * (n + 1)].map(fmt), explanation: `Sum = n(n + 1) ÷ 2 = ${n} × ${n + 1} ÷ 2 = ${fmt((n * (n + 1)) / 2)}.`, difficulty: 'easy' })
    },
    'HCF and LCM': () => {
      const v = int(0, 2)
      const h = int(2, 15)
      const a = h * int(2, 9)
      const b = h * int(2, 9)
      if (a === b) return null
      if (v === 0) {
        const g = gcd(a, b)
        return Q('HCF and LCM', { text: `Find the HCF of ${a} and ${b}.`, answer: String(g), distractors: [lcm(a, b), g * 2, g === 1 ? 3 : g / 2 + 1, Math.min(a, b)].map(String), explanation: `The highest number dividing both ${a} and ${b} is ${g}.`, difficulty: 'easy' })
      }
      if (v === 1) {
        const l = lcm(a, b)
        return Q('HCF and LCM', { text: `Find the LCM of ${a} and ${b}.`, answer: String(l), distractors: [a * b === l ? l * 2 : a * b, gcd(a, b), l + Math.min(a, b), l / 2].map((x) => String(Math.round(x))), explanation: `LCM = ${a} × ${b} ÷ HCF(${gcd(a, b)}) = ${l}.` })
      }
      const g = gcd(a, b)
      const l = lcm(a, b)
      return Q('HCF and LCM', { text: `The HCF of two numbers is ${g} and their LCM is ${l}. If one number is ${a}, what is the other?`, answer: String(b), distractors: [l / g, (l * g) / a + g, b + g, a].map(String), explanation: `Product of the numbers = HCF × LCM. Other = ${g} × ${l} ÷ ${a} = ${b}.`, difficulty: 'medium' })
    },
    Simplification: () => {
      const v = int(0, 2)
      if (v === 0) {
        const a = int(10, 99)
        const b = int(2, 12)
        const c = int(2, 12)
        const e = int(2, 9)
        const d = e * int(2, 12)
        const val = a + b * c - d / e
        return Q('Simplification', { text: `Simplify: ${a} + ${b} × ${c} − ${d} ÷ ${e}`, answer: fmt(val), distractors: [((a + b) * c - d) / e, a + b * c - d, (a + b) * c - d / e, val + e].map((x) => fmt(Math.round(x * 100) / 100)), explanation: `BODMAS: ${b} × ${c} = ${b * c}, ${d} ÷ ${e} = ${d / e}. So ${a} + ${b * c} − ${d / e} = ${fmt(val)}.`, difficulty: 'easy' })
      }
      if (v === 1) {
        const r = int(11, 35)
        return Q('Simplification', { text: `What is the square root of ${r * r}?`, answer: String(r), distractors: [r + 1, r - 1, r + 2, r * 2].map(String), explanation: `${r} × ${r} = ${r * r}, so √${r * r} = ${r}.`, difficulty: 'easy' })
      }
      const a = int(11, 29)
      const b = int(11, 29)
      return Q('Simplification', { text: `Calculate ${a} × ${b}.`, answer: String(a * b), distractors: [a * b + 10, a * b - a, a * (b + 1), a * b + 1].map(String), explanation: `${a} × ${b} = ${a} × ${b - (b % 10)} + ${a} × ${b % 10} = ${a * (b - (b % 10))} + ${a * (b % 10)} = ${a * b}.`, difficulty: 'easy' })
    },
    'Mixture and Alligation': () => {
      const v = int(0, 1)
      if (v === 0) {
        const p1 = pick([20, 24, 30, 32, 40, 45, 50])
        const p2 = p1 + pick([10, 12, 15, 18, 20, 24, 30])
        const p = int(p1 + 1, p2 - 1)
        const x = p2 - p
        const y = p - p1
        const g = gcd(x, y)
        return Q('Mixture and Alligation', { text: `In what ratio must rice at ${rs(p1)}/kg be mixed with rice at ${rs(p2)}/kg so that the mixture costs ${rs(p)}/kg?`, answer: `${x / g} : ${y / g}`, distractors: [`${y / g} : ${x / g}`, `${x / g + 1} : ${y / g}`, `1 : 1`, `${p1 / gcd(p1, p2)} : ${p2 / gcd(p1, p2)}`], explanation: `Alligation: (${p2} − ${p}) : (${p} − ${p1}) = ${x} : ${y} = ${x / g} : ${y / g}.`, difficulty: 'medium' })
      }
      const total = pick([40, 60, 80, 100, 120])
      const [m, w] = pick([[3, 1], [4, 1], [3, 2], [5, 3], [7, 3], [2, 1]])
      const k = total / (m + w)
      if (!Number.isInteger(k)) return null
      const water = w * k
      return Q('Mixture and Alligation', { text: `A ${total}-litre mixture contains milk and water in the ratio ${m} : ${w}. How much water is in it?`, answer: `${water} litres`, distractors: [m * k, water + 5, total / 2, water - 4].map((z) => `${z} litres`), explanation: `Water = ${total} × ${w} ÷ (${m} + ${w}) = ${water} litres.`, difficulty: 'easy' })
    },
    Algebra: () => {
      const v = int(0, 2)
      if (v === 0) {
        const k = int(3, 12)
        return Q('Algebra', { text: `If x + 1/x = ${k}, what is the value of x² + 1/x²?`, answer: String(k * k - 2), distractors: [k * k, k * k + 2, 2 * k, k * k - 1].map(String), explanation: `(x + 1/x)² = x² + 1/x² + 2, so x² + 1/x² = ${k}² − 2 = ${k * k - 2}.`, difficulty: 'medium' })
      }
      if (v === 1) {
        const s = int(5, 20)
        const p = int(2, Math.floor((s * s) / 4))
        return Q('Algebra', { text: `If a + b = ${s} and ab = ${p}, what is a² + b²?`, answer: String(s * s - 2 * p), distractors: [s * s, s * s + 2 * p, s * s - p, 2 * s * p].map(String), explanation: `a² + b² = (a + b)² − 2ab = ${s * s} − ${2 * p} = ${s * s - 2 * p}.`, difficulty: 'medium' })
      }
      const a = int(2, 9)
      const x = int(-9, 15)
      const b = int(1, 30)
      const c = a * x + b
      return Q('Algebra', { text: `Solve for x: ${a}x + ${b} = ${c}`, answer: String(x), distractors: [x + 1, -x || 2, x + 2, (c + b) / a].map((z) => fmt(Math.round(z * 100) / 100)), explanation: `${a}x = ${c} − ${b} = ${c - b}, so x = ${c - b} ÷ ${a} = ${x}.`, difficulty: 'easy' })
    },
    Geometry: () => {
      const v = int(0, 2)
      if (v === 0) {
        const a = int(25, 90)
        const b = int(20, 160 - a)
        const c = 180 - a - b
        if (c <= 0) return null
        return Q('Geometry', { text: `Two angles of a triangle are ${a}° and ${b}°. What is the third angle?`, answer: `${c}°`, distractors: [360 - a - b, c + 10, 90 - c > 0 ? 90 - c : c + 20, a + b].map((z) => `${z}°`), explanation: `The angles of a triangle add up to 180°: 180 − ${a} − ${b} = ${c}°.`, difficulty: 'easy' })
      }
      if (v === 1) {
        const n = pick([5, 6, 8, 9, 10, 12, 15, 18, 20])
        const ang = (180 * (n - 2)) / n
        return Q('Geometry', { text: `What is each interior angle of a regular polygon with ${n} sides?`, answer: `${fmt(ang)}°`, distractors: [360 / n, 180 - 360 / n + 10, (180 * n) / (n + 2), ang - 12].map((z) => `${fmt(Math.round(z * 10) / 10)}°`), explanation: `Each interior angle = 180(n − 2) ÷ n = 180 × ${n - 2} ÷ ${n} = ${fmt(ang)}°.`, difficulty: 'medium' })
      }
      const n = pick([5, 6, 7, 8, 9, 10, 12])
      return Q('Geometry', { text: `What is the sum of the interior angles of a polygon with ${n} sides?`, answer: `${180 * (n - 2)}°`, distractors: [180 * n, 180 * (n - 1), 360 * (n - 2), 180 * (n - 2) + 90].map((z) => `${z}°`), explanation: `Sum = (n − 2) × 180° = ${n - 2} × 180° = ${180 * (n - 2)}°.`, difficulty: 'easy' })
    },
    Mensuration: () => {
      const v = int(0, 3)
      if (v === 0) {
        const r = 7 * int(1, 6)
        const area = (22 / 7) * r * r
        return Q('Mensuration', { text: `What is the area of a circle of radius ${r} cm? (Take π = 22/7)`, answer: `${fmt(area)} cm²`, distractors: [2 * (22 / 7) * r, area / 2, (22 / 7) * (2 * r) ** 2, area + 22].map((z) => `${fmt(z)} cm²`), explanation: `Area = πr² = 22/7 × ${r} × ${r} = ${fmt(area)} cm².`, difficulty: 'easy' })
      }
      if (v === 1) {
        const l = int(5, 30)
        const b = int(3, l)
        return Q('Mensuration', { text: `A rectangle is ${l} m long and ${b} m wide. What is its perimeter?`, answer: `${2 * (l + b)} m`, distractors: [l * b, l + b, 2 * l + b, 4 * l].map((z) => `${z} m`), explanation: `Perimeter = 2(l + b) = 2(${l} + ${b}) = ${2 * (l + b)} m.`, difficulty: 'easy' })
      }
      if (v === 2) {
        const a = int(3, 15)
        return Q('Mensuration', { text: `What is the total surface area of a cube with edge ${a} cm?`, answer: `${6 * a * a} cm²`, distractors: [a ** 3, 4 * a * a, 12 * a, 6 * a].map((z) => `${z} cm²`), explanation: `Total surface area = 6a² = 6 × ${a}² = ${6 * a * a} cm².`, difficulty: 'easy' })
      }
      const r = 7 * int(1, 3)
      const h = int(2, 20)
      const vol = (22 / 7) * r * r * h
      return Q('Mensuration', { text: `Find the volume of a cylinder of radius ${r} cm and height ${h} cm. (Take π = 22/7)`, answer: `${fmt(vol)} cm³`, distractors: [2 * (22 / 7) * r * h, vol / 3, (22 / 7) * r * h, vol + 154].map((z) => `${fmt(Math.round(z))} cm³`), explanation: `Volume = πr²h = 22/7 × ${r}² × ${h} = ${fmt(vol)} cm³.`, difficulty: 'medium' })
    },
    Trigonometry: () => {
      // Exact values as [numerator, denominator] of squares or values that are rational.
      const T = [
        ['sin 30° + cos 60°', [1, 1]], ['sin² 45° + cos² 45°', [1, 1]], ['tan 45° + cot 45°', [2, 1]], ['sin 90° − cos 90°', [1, 1]],
        ['sin² 60° + cos² 30°', [3, 2]], ['tan² 60° − sec² 45°', [1, 1]], ['2 sin 30° cos 60°', [1, 2]], ['sec 60° + cosec 30°', [4, 1]],
        ['sin² 30° + cos² 60°', [1, 2]], ['tan² 30° + tan² 60°', [10, 3]], ['cos 0° + sin 0°', [1, 1]], ['4 sin² 60° − 1', [2, 1]],
        ['sec² 60° − tan² 60°', [1, 1]], ['cosec² 45° − cot² 45°', [1, 1]], ['3 tan² 30° + cos 0°', [2, 1]], ['sin 30° × tan 45°', [1, 2]],
        ['cos² 30° − sin² 30°', [1, 2]], ['2 cos² 45° + tan 45°', [2, 1]], ['sin² 60° − sin² 30°', [1, 2]], ['tan 60° × cot 60°', [1, 1]],
        ['cos 60° × sec 60°', [1, 1]], ['sin² 45° + tan² 45°', [3, 2]], ['cosec 30° × sin 30°', [1, 1]], ['sec² 30°', [4, 3]],
        ['cot² 30°', [3, 1]], ['cos² 60° + sin² 90°', [5, 4]], ['tan² 45° + sec² 0°', [2, 1]], ['1 − 2 sin² 30°', [1, 2]],
      ]
      const [expr, [n, d]] = pick(T)
      const ans = frac(n, d)
      const wrong = [frac(n + d, d), frac(n, d + 1), frac(n * 2, d), frac(Math.abs(n - d) || 3, d * 2), '0', '1', '2', '3/4'].filter((x) => x !== ans)
      return Q('Trigonometry', { text: `Find the value of ${expr}.`, answer: ans, distractors: wrong, explanation: `Use the standard values (sin 30° = cos 60° = 1/2, sin 45° = cos 45° = 1/√2, tan 45° = 1, tan 60° = √3, sec 60° = 2, cosec 30° = 2). The value is ${ans}.`, difficulty: 'medium' })
    },
    'Data Interpretation': () => {
      const years = [2020, 2021, 2022, 2023, 2024]
      const base = pick([20, 25, 40, 50, 60, 80])
      const vals = years.map(() => base + 5 * int(0, 12))
      const passage = `Sales of a company (in ₹ lakh): ${years.map((y, i) => `${y}: ${vals[i]}`).join(', ')}.`
      const v = int(0, 2)
      if (v === 0) {
        const s = vals.reduce((a, b) => a + b, 0)
        return Q('Data Interpretation', { passage, text: 'What were the total sales over the five years (in ₹ lakh)?', answer: String(s), distractors: [s + 5, s - 10, s + 15, s / 5].map((x) => fmt(x)), explanation: `Total = ${vals.join(' + ')} = ${s}.`, difficulty: 'easy' })
      }
      if (v === 1) {
        const s = vals.reduce((a, b) => a + b, 0)
        if (s % 5) return null
        return Q('Data Interpretation', { passage, text: 'What were the average yearly sales (in ₹ lakh)?', answer: String(s / 5), distractors: [s / 5 + 2, s / 5 - 3, s / 4, Math.max(...vals)].map((x) => fmt(Math.round(x * 100) / 100)), explanation: `Average = ${s} ÷ 5 = ${s / 5}.`, difficulty: 'easy' })
      }
      const i = int(0, 3)
      const a = vals[i]
      const b = vals[i + 1]
      const pct = ((b - a) / a) * 100
      if (!Number.isInteger(pct) || pct <= 0) return null
      return Q('Data Interpretation', { passage, text: `By what percentage did sales increase from ${years[i]} to ${years[i + 1]}?`, answer: `${pct}%`, distractors: [Math.round(((b - a) / b) * 100), pct + 5, b - a, pct * 2].map((x) => `${x}%`), explanation: `Increase = ${b} − ${a} = ${b - a}. Percentage = ${b - a} ÷ ${a} × 100 = ${pct}%.`, difficulty: 'medium' })
    },
  }
  const per = { Percentage: 30, 'Profit and Loss': 26, Discount: 22, 'Simple Interest': 24, 'Compound Interest': 18, Average: 24, 'Ratio and Proportion': 22, 'Time and Work': 20, 'Time, Speed and Distance': 26, 'Number System': 26, 'HCF and LCM': 22, Simplification: 26, 'Mixture and Alligation': 18, Algebra: 22, Geometry: 20, Mensuration: 24, Trigonometry: 22, 'Data Interpretation': 18 }
  return Object.entries(per).flatMap(([topic, n]) => collect(n, () => topics[topic]()))
}
