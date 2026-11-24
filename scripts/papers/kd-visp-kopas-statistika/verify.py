# Neatkarīgs atbilžu pārrēķins abiem kontroldarbiem: citi paņēmieni nekā build.py
# (Python set, itertools pārlase, statistics modulis, meklēšana pa visiem x un k, apgalvojumu predikāti).
# Pēdējā izvades rinda — JSON {uzdevuma nosaukums: vērtība, ko ieraksta skolēns}.
import itertools, json, os, statistics, sys
from fractions import Fraction as F

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from build import V  # tikai sākuma dati (skaitļi no nosacījumiem)


def fr(x):
    x = F(x)
    return str(x.numerator) if x.denominator == 1 else f'{x.numerator}/{x.denominator}'


def dec(x):
    x = F(x)
    return str(x.numerator) if x.denominator == 1 else ('%.4f' % float(x)).rstrip('0').rstrip('.')


def quart(d):
    d = sorted(d)
    lo, hi = d[:len(d) // 2], d[(len(d) + 1) // 2:]
    return F(statistics.median(lo)).limit_denominator(), F(statistics.median(hi)).limit_denominator()


# Skaitļu kopas: vērtības un piederība, rēķinātas no jauna (nevis no build.py karodziņiem)
NUMS = {
    'A': ('Z', [F(-3), F(1, 2), None, F(7), F(-2), None]),          # None — iracionāls (√2, π)
    'B': ('Q', [F(3, 2), F(-2), F(3), None, F(3, 7), None]),
    'C': ('I', [F(5, 2), None, F(-1), None, F(4), F(1, 3)]),
}
STMT = {
    'A': lambda b1, b2: [b1[2] > b2[2], b1[0] > b2[0], (b2[4] - b2[0]) > (b1[4] - b1[0])],
    'B': lambda b1, b2: [b2[2] > b1[2], b2[0] > b1[0], (b2[4] - b2[0]) > (b1[4] - b1[0])],
    'C': lambda b1, b2: [b1[2] > b2[2], b2[4] > b1[4], (b1[4] - b1[0]) > (b2[4] - b2[0])],
}
TYPES = {'A': 2, 'B': 2, 'C': 3}  # pārbaudīts ar roku: krāsa — kategoriāla; masa — nepārtraukta; mājdzīvnieku skaits — diskrēts

out = {}
for v, d in V.items():
    p = f'KV {v}: '
    A, B = set(d['sets']['A']), set(d['sets']['B'])
    out[p + 'kopu šķēluma elementu skaits'] = str(len(A & B))
    out[p + 'kopu apvienojuma elementu skaits'] = str(len(A | B))
    out[p + 'kopu starpības elementu skaits'] = str(len(A - B))
    vn = d['venn']
    # skolēnu modelis: katram skolēnam (a?, b?)
    people = [(1, 1)] * vn['ab'] + [(1, 0)] * (vn['a'] - vn['ab']) + [(0, 1)] * (vn['b'] - vn['ab'])
    people += [(0, 0)] * (vn['n'] - len(people))
    assert sum(x for x, _ in people) == vn['a'] and sum(y for _, y in people) == vn['b']
    out[p + 'Eilera–Venna diagramma: neviens'] = str(people.count((0, 0)))
    out[p + 'Eilera–Venna diagramma: tikai viens'] = str(people.count((1, 0) if vn['only_of'] == 'a' else (0, 1)))
    kind, vals = NUMS[v]
    if kind == 'Z':
        c = sum(1 for x in vals if x is not None and x.denominator == 1)
    elif kind == 'Q':
        c = sum(1 for x in vals if x is not None)
    else:
        c = sum(1 for x in vals if x is None)
    out[p + 'skaitļu kopas'] = str(c)
    el = d['subs']['elems']
    subsets = [s for r in range(len(el) + 1) for s in itertools.combinations(el, r)]
    if d['subs']['size'] is None:
        out[p + 'apakškopu skaits'] = str(len(subsets))
    else:
        out[p + 'divelementu apakškopu skaits'] = str(sum(1 for s in subsets if len(s) == d['subs']['size']))
    out[p + 'reizināšanas likums'] = str(len(list(itertools.product(*[range(k) for k in d['mult']['parts']]))))
    dg = d['digits']['digits']
    out[p + 'trīsciparu skaitļi bez atkārtošanās'] = str(sum(1 for t in itertools.permutations(dg, 3) if t[0] != 0))
    out[p + 'katrs ar katru'] = str(len(list(itertools.combinations(range(d['hands']['n']), 2))))

    b = d['box']
    balls = [k for k, c in b['counts'].items() for _ in range(c)]
    n = len(balls)
    out[p + f"varbūtība, ka {b['ask1'][1]}"] = fr(F(sum(x == b['ask1'][0] for x in balls), n))
    out[p + f"varbūtība, ka nav {b['ask2'][1]}"] = fr(F(sum(x != b['ask2'][0] for x in balls), n))
    out[p + 'neiespējama notikuma varbūtība'] = '0'
    sols = [x for x in range(1, 200) if F(b['counts'][b['add_key']] + x, n + x) == b['target']]
    assert len(sols) == 1
    out[p + 'cik pielika, lai mainītos varbūtība'] = str(sols[0])
    dc = d['dice']
    omega = list(itertools.product(range(1, 7), repeat=2))
    out[p + f"kauliņi: iznākumi, kad {dc['fav'][0].replace('$', '')}"] = str(len([w for w in omega if dc['fav'][1](*w)]))
    for key in ('p2', 'p3', 'p4'):
        out[p + f"kauliņi: {dc[key][0].replace('$', '')}"] = fr(F(len([w for w in omega if dc[key][1](*w)]), len(omega)))
    f = d['freq']
    pct = lambda h, t: F(h, t) * 100
    out[p + f"{f['p1'][3]} relatīvais biežums"] = dec(pct(f['p1'][1], f['p1'][2]))
    out[p + f"{f['p2'][3]} relatīvais biežums"] = dec(pct(f['p2'][1], f['p2'][2]))
    out[p + 'relatīvo biežumu salīdzinājums'] = dec(pct(f['p1'][1], f['p1'][2]) - pct(f['p2'][1], f['p2'][2]))
    ks = [k for k in range(0, f['more'] + 1) if (f['p2'][1] + k) * f['p1'][2] >= f['p1'][1] * (f['p2'][2] + f['more'])]
    out[p + 'cik vēl vajag veiksmīgu mēģinājumu'] = str(min(ks))

    p = f'KS {v}: '
    out[p + 'datu veidi'] = str(TYPES[v])
    gr = d['group']
    out[p + 'datu grupēšana intervālos'] = str(sum(1 for x in gr['data'] if F(str(x)) >= gr['lo'] and F(str(x)) < gr['hi']))
    sm = d['sample']
    est = F(sm['N']) * F(sm['k'], sm['n'])
    assert est.denominator == 1
    out[p + 'novērtējums pēc izlases'] = str(est)
    bs = d['bars']
    data = []
    for val, cnt in zip(bs['vals'], bs['fq']):
        data += [val] * cnt
    N = len(data)
    out[p + 'aptaujāto skolēnu skaits'] = str(N)
    out[p + 'relatīvais biežums procentos'] = dec(F(data.count(bs['exact']) * 100, N))
    out[p + 'datu moda'] = str(statistics.mode(data))
    out[p + 'datu amplitūda'] = str(max(data) - min(data))
    out[p + 'mediāna pēc diagrammas'] = dec(F(statistics.median(data)).limit_denominator())
    out[p + 'vidējā vērtība pēc diagrammas'] = dec(F(sum(data), N))
    out[p + 'daļa procentos ar nosacījumu'] = dec(F(sum(x >= bs['atleast'] for x in data) * 100, N))
    out[p + 'jaunā vidējā vērtība'] = dec(F(sum(data) + bs['newval'], N + 1))
    rw = d['raw']['data']
    q1, q3 = quart(rw)
    out[p + 'amplitūda no datu rindas'] = str(max(rw) - min(rw))
    out[p + 'mediāna no datu rindas'] = dec(F(statistics.median(rw)).limit_denominator())
    out[p + 'pirmā kvartile'] = dec(q1)
    out[p + 'trešā kvartile'] = dec(q3)
    out[p + 'starpkvartiļu izkliede'] = dec(q3 - q1)
    fixed = [d['raw']['new'] if x == d['raw']['old'] else x for x in rw]
    assert statistics.median(fixed) == statistics.median(rw)
    out[p + 'amplitūda pēc kļūdas labojuma'] = str(max(fixed) - min(fixed))
    bx = d['boxes']
    (n1, b1), (n2, b2) = bx['g1'], bx['g2']
    out[p + 'skolēnu skaits virs Q3'] = str(bx['n2'] // 4)
    out[p + 'mediānu salīdzinājums'] = str(abs(b1[2] - b2[2]))
    out[p + f"starpkvartiļu izkliede: {bx['gen1']}"] = str(b1[3] - b1[1])
    out[p + f"starpkvartiļu izkliede: {bx['gen2']}"] = str(b2[3] - b2[1])
    truth = STMT[v](b1, b2)
    assert truth.count(True) == 1, (v, truth)
    out[p + 'patiesais apgalvojums par diagrammām'] = str(truth.index(True) + 1)

print(len(out))
print(json.dumps(out))  # ASCII: на Windows труба не в UTF-8
