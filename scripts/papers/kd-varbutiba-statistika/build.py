# Kontroldarbs «Varbūtība un statistika» (Vispārīgais, 10. klase), varianti A, B, C.
# Ģenerē paper.json: trīs darbi pa 31 uzdevumam ar vienu skaitlisku atbildi katrā, un 6 SVG.
# Atbildes šeit rēķina ar Fraction; verify.py tās pārrēķina neatkarīgi (pārlase, kārtošana).
# Palaišana: python -I scripts/papers/kd-varbutiba-statistika/build.py
# Teksts tikai latviski (īpašnieka lēmums 2026-11-23): RU lauki = LV teksts.
import json, os
from fractions import Fraction as F

HERE = os.path.dirname(os.path.abspath(__file__))
T_VARB = 'visp-kopas-un-varbutiba'
T_STAT = 'visp-statistikas-elementi'


def lvnum(x):
    """Skaitlis LaTeX formā ar komatu: 2.24 -> 2{,}24."""
    if isinstance(x, F):
        if x.denominator == 1:
            return str(x.numerator)
        x = float(x)
    s = ('%.4f' % x).rstrip('0').rstrip('.')
    return s.replace('.', '{,}')


def frac(x):
    x = F(x)
    return str(x.numerator) if x.denominator == 1 else r'\dfrac{%d}{%d}' % (x.numerator, x.denominator)


def med(d):
    d = sorted(d); n = len(d)
    return F(d[n // 2]) if n % 2 else F(d[n // 2 - 1] + d[n // 2], 2)


# ── SVG (tīri, viena rinda, bez skriptiem; robots: diagramma ar «0» un līnijām) ──
FONT = "font-family='Arial,sans-serif' font-size='15' fill='#1d1d1f'"


def svg_hist(vals, fq):
    ymax = max(fq) + 1
    W, H = 420, 290
    x0, y0, top = 50, 250, 20
    step = (y0 - top) / ymax
    bw = (W - x0 - 20) / len(vals)
    s = [f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {W} {H}' width='{W}' height='{H}'>",
         f"<rect width='{W}' height='{H}' fill='#ffffff'/>"]
    for i in range(1, ymax + 1):
        y = round(y0 - i * step, 1)
        s.append(f"<line x1='{x0}' y1='{y}' x2='{W - 15}' y2='{y}' stroke='#d5d9de' stroke-width='1'/>")
    for i, f in enumerate(fq):
        x = round(x0 + i * bw + bw * 0.18, 1)
        h = round(f * step, 1)
        s.append(f"<rect x='{x}' y='{round(y0 - h, 1)}' width='{round(bw * 0.64, 1)}' height='{h}' fill='#9bb6dd' stroke='#2b5fab' stroke-width='1.5'/>")
    s.append(f"<line x1='{x0}' y1='{y0}' x2='{W - 15}' y2='{y0}' stroke='#1d1d1f' stroke-width='1.6'/>")
    s.append(f"<line x1='{x0}' y1='{y0}' x2='{x0}' y2='{top - 8}' stroke='#1d1d1f' stroke-width='1.6'/>")
    for i in range(0, ymax + 1):
        y = round(y0 - i * step + 5, 1)
        s.append(f"<text x='{x0 - 8}' y='{y}' text-anchor='end' {FONT}>{i}</text>")
    for i, v in enumerate(vals):
        x = round(x0 + i * bw + bw / 2, 1)
        s.append(f"<text x='{x}' y='{y0 + 22}' text-anchor='middle' {FONT}>{v}</text>")
    s.append('</svg>')
    return ''.join(s)


def svg_boxes(lo, hi, label_every, minor, boxes):
    W, H = 420, 200
    x0, x1 = 72, 400
    k = (x1 - x0) / (hi - lo)
    X = lambda v: round(x0 + (v - lo) * k, 1)
    ya = 165
    s = [f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {W} {H}' width='{W}' height='{H}'>",
         f"<rect width='{W}' height='{H}' fill='#ffffff'/>"]
    marks = list(range(lo, hi + 1, minor))
    s.append("<g stroke='#e6e9ed' stroke-width='1'>" + ''.join(
        f"<line x1='{X(v)}' y1='14' x2='{X(v)}' y2='{ya - 6}'" + (" stroke='#c4cad1'" if v % label_every == 0 else '') + '/>' for v in marks) + '</g>')
    cols = ['#dbe6f6', '#f6e3d4']
    for i, (name, (mn, q1, me, q3, mx)) in enumerate(boxes):
        cy = 50 + 65 * i
        s.append(f"<text x='8' y='{cy + 5}' {FONT}>{name}</text>")
        s.append(f"<g stroke='#1d1d1f' stroke-width='1.8'>"
                 f"<line x1='{X(mn)}' y1='{cy}' x2='{X(q1)}' y2='{cy}'/><line x1='{X(q3)}' y1='{cy}' x2='{X(mx)}' y2='{cy}'/>"
                 f"<line x1='{X(mn)}' y1='{cy - 11}' x2='{X(mn)}' y2='{cy + 11}'/><line x1='{X(mx)}' y1='{cy - 11}' x2='{X(mx)}' y2='{cy + 11}'/>"
                 f"<rect x='{X(q1)}' y='{cy - 20}' width='{round(X(q3) - X(q1), 1)}' height='40' fill='{cols[i]}'/>"
                 f"<line x1='{X(me)}' y1='{cy - 20}' x2='{X(me)}' y2='{cy + 20}' stroke-width='3'/></g>")
    s.append(f"<line x1='{x0}' y1='{ya}' x2='{x1}' y2='{ya}' stroke='#1d1d1f' stroke-width='1.6'/>")
    s.append("<g stroke='#1d1d1f' stroke-width='1.2'>" + ''.join(
        f"<line x1='{X(v)}' y1='{ya - (6 if v % label_every == 0 else 3)}' x2='{X(v)}' y2='{ya + (6 if v % label_every == 0 else 3)}'/>" for v in marks) + '</g>')
    s.append(f"<g text-anchor='middle' {FONT}>" + ''.join(f"<text x='{X(v)}' y='{ya + 24}'>{v}</text>" for v in marks if v % label_every == 0) + '</g>')
    s.append('</svg>')
    return ''.join(s)


# ── Variantu dati ──
V = {
 'A': dict(
  box=dict(text=r'Kastē ir $6$ sarkanas, $9$ zilas un $5$ zaļas bumbiņas. No kastes uz labu laimi izvelk vienu bumbiņu.',
           counts=dict(sarkanas=6, zilas=9, zalas=5), ask1=('zilas', 'zila'), ask2=('zalas', 'zaļa'),
           none='dzeltena', add_key='zalas', add_sent='Kastē ielika vēl dažas zaļas bumbiņas.', add_q='Cik zaļo bumbiņu ielika?', add='zaļas', add_one='zaļu bumbiņu', add_word='zaļu bumbiņu', target=F(2, 5), thing='bumbiņu'),
  dice=dict(fav=('summa ir $7$', lambda a, b: a + b == 7),
            p2=('summa ir pāra skaitlis', lambda a, b: (a + b) % 2 == 0),
            p3=('summa ir vismaz $10$', lambda a, b: a + b >= 10),
            p4=('vismaz uz viena kauliņa uzkrīt $6$ punkti', lambda a, b: 6 in (a, b))),
  freq=dict(text=r'Treniņā Jānis no $24$ soda metieniem trāpīja $18$ reizes, bet Pēteris no $30$ soda metieniem trāpīja $21$ reizi.',
            p1=('Jānis', 18, 24, 'Jāņa'), p2=('Pēteris', 21, 30, 'Pētera', 'Pēterim'), more=10, unit='soda metienus', hitword='trāpīt'),
  bars=dict(text='Klases skolēniem jautāja, cik grāmatu viņi izlasīja oktobrī. Atbildes attēlotas stabiņu diagrammā: uz horizontālās ass — izlasīto grāmatu skaits, uz vertikālās — skolēnu skaits.',
            vals=[0, 1, 2, 3, 4, 5], fq=[2, 5, 8, 6, 3, 1], what='grāmatas', what_gen='grāmatu', per='izlasīja',
            exact=2, atleast=3, newval=9, mean_q='Aprēķiniet, cik grāmatu vidēji izlasīja viens skolēns.', newtext='Klasē ienāca jauns skolēns, kurš oktobrī izlasīja $9$ grāmatas.'),
  raw=dict(text='$12$ skolēni pierakstīja, cik minūtes viņi pavada ceļā uz skolu:', data=[5, 8, 12, 7, 15, 20, 10, 9, 25, 14, 6, 11],
           unit='minūtēs', fix='Izrādījās, ka viens skolēns kļūdījās: viņš ceļā pavada nevis $25$, bet $35$ minūtes.', old=25, new=35),
  boxes=dict(text='Divas klases rakstīja vienu un to pašu ieskaiti (maksimāli $40$ punkti). Rezultāti attēloti kastu diagrammās; augšā — 10.a klase, apakšā — 10.b klase.',
             axis=(0, 40, 5, 1), g1=('10.a', (8, 18, 24, 30, 38)), g2=('10.b', (12, 20, 22, 25, 34)), n2=24, gen1='10.a klases', gen2='10.b klases',
             unit='punktu', where2='10.b klasē', thr_word='vismaz $25$ punktus',
             stmts=['10.a klasē vismaz puse skolēnu ieguva vairāk punktu nekā 10.b klases mediāna.',
                    '10.a klases vājākais rezultāts ir labāks nekā 10.b klases vājākais rezultāts.',
                    '10.b klases rezultātu amplitūda ir lielāka nekā 10.a klasei.'],
             true_idx=1)),
 'B': dict(
  box=dict(text=r'Maisiņā ir $8$ šokolādes konfektes, $5$ karameles un $7$ marmelādes konfektes. No maisiņa uz labu laimi izņem vienu konfekti.',
           counts=dict(sok=8, kar=5, mar=7), ask1=('kar', 'karamele'), ask2=('sok', 'šokolādes konfekte'),
           none='košļājamā gumija', add_key='kar', add_sent='Maisiņā ielika vēl dažas karameles.', add_q='Cik karameļu ielika?', add='karameles', add_one='karameli', add_word='karameli', target=F(3, 8), thing='konfekti'),
  dice=dict(fav=('summa ir $8$', lambda a, b: a + b == 8),
            p2=('summa ir nepāra skaitlis', lambda a, b: (a + b) % 2 == 1),
            p3=('summa nav lielāka par $4$', lambda a, b: a + b <= 4),
            p4=('vismaz uz viena kauliņa uzkrīt $1$ punkts', lambda a, b: 1 in (a, b))),
  freq=dict(text=r'Volejbola treniņā Anna no $20$ servēm precīzi izpildīja $17$, bet Līga no $40$ servēm precīzi izpildīja $32$.',
            p1=('Anna', 17, 20, 'Annas'), p2=('Līga', 32, 40, 'Līgas', 'Līgai'), more=20, unit='serves', hitword='izpildīt precīzi'),
  bars=dict(text='Klases skolēniem jautāja, cik reizes pagājušajā nedēļā viņi sportoja ārpus sporta stundām. Atbildes attēlotas stabiņu diagrammā: uz horizontālās ass — reižu skaits, uz vertikālās — skolēnu skaits.',
            vals=[0, 1, 2, 3, 4, 5], fq=[1, 4, 5, 6, 3, 1], what='reizes', what_gen='reižu', per='sportoja',
            exact=3, atleast=3, newval=14, mean_q='Aprēķiniet, cik reizes nedēļā vidēji sportoja viens skolēns.', newtext='Klasē ienāca jauns skolēns, kurš pagājušajā nedēļā sportoja $14$ reizes.'),
  raw=dict(text='$12$ skolēni pierakstīja, cik minūtes viņi vakar lasīja grāmatu:', data=[14, 22, 9, 30, 18, 12, 25, 16, 20, 11, 35, 15],
           unit='minūtēs', fix='Izrādījās, ka viens skolēns kļūdījās: viņš lasīja nevis $35$, bet $45$ minūtes.', old=35, new=45),
  boxes=dict(text='Divas klases rakstīja vienu un to pašu ieskaiti (maksimāli $50$ punkti). Rezultāti attēloti kastu diagrammās; augšā — 10.c klase, apakšā — 10.d klase.',
             axis=(0, 50, 5, 1), g1=('10.c', (15, 25, 32, 38, 46)), g2=('10.d', (20, 28, 30, 33, 42)), n2=20, gen1='10.c klases', gen2='10.d klases',
             unit='punktu', where2='10.d klasē', thr_word='vismaz $33$ punktus',
             stmts=['10.d klasē vismaz puse skolēnu ieguva vairāk nekā $32$ punktus.',
                    '10.d klases vājākais rezultāts ir labāks nekā 10.c klases vājākais rezultāts.',
                    '10.d klases rezultātu amplitūda ir lielāka nekā 10.c klasei.'],
             true_idx=2)),
 'C': dict(
  box=dict(text=r'Uz galda ir $25$ kartītes ar jautājumiem: $7$ matemātikā, $10$ latviešu valodā un $8$ angļu valodā. Skolēns uz labu laimi izvelk vienu kartīti.',
           counts=dict(mat=7, lat=10, ang=8), ask1=('ang', 'jautājums angļu valodā'), ask2=('mat', 'jautājuma matemātikā'),
           it='tajā', none='jautājums ķīmijā', add_key='mat', add_sent='Skolotāja pielika vēl dažas kartītes ar jautājumiem matemātikā.', add_q='Cik kartīšu pielika?', add='kartītes ar jautājumiem matemātikā', add_one='kartīti matemātikā', add_word='kartīti matemātikā', target=F(1, 2), thing='kartīti'),
  dice=dict(fav=('summa ir $9$', lambda a, b: a + b == 9),
            p2=('summa dalās ar $3$', lambda a, b: (a + b) % 3 == 0),
            p3=('summa ir $7$', lambda a, b: a + b == 7),
            p4=('vismaz uz viena kauliņa uzkrīt $5$ punkti', lambda a, b: 5 in (a, b))),
  freq=dict(text=r'Šaušanas treniņā Kārlis no $35$ šāvieniem mērķī trāpīja $28$ reizes, bet Mārtiņš no $48$ šāvieniem trāpīja $36$ reizes.',
            p1=('Kārlis', 28, 35, 'Kārļa'), p2=('Mārtiņš', 36, 48, 'Mārtiņa', 'Mārtiņam'), more=20, unit='šāvienus', hitword='trāpīt'),
  bars=dict(text='Klases skolēniem jautāja, cik cilvēku ir viņu ģimenē (kopā ar pašu skolēnu). Atbildes attēlotas stabiņu diagrammā: uz horizontālās ass — cilvēku skaits ģimenē, uz vertikālās — skolēnu skaits.',
            vals=[2, 3, 4, 5, 6], fq=[3, 7, 9, 5, 1], what='cilvēki', what_gen='cilvēku', per='ir ģimenē',
            exact=4, atleast=5, newval=10, mean_q='Aprēķiniet vidējo cilvēku skaitu vienā ģimenē.', newtext='Klasē ienāca jauns skolēns, kura ģimenē ir $10$ cilvēku.'),
  raw=dict(text='$12$ skolēni pierakstīja, cik stundu pagājušajā nedēļā viņi spēlēja datorspēles:', data=[3, 12, 7, 5, 9, 14, 6, 10, 8, 4, 18, 11],
           unit='stundās', fix='Izrādījās, ka viens skolēns kļūdījās: viņš spēlēja nevis $18$, bet $28$ stundas.', old=18, new=28),
  boxes=dict(text='Divās skolās aptaujāja skolēnus, cik minūtes dienā viņi pilda mājasdarbus. Rezultāti attēloti kastu diagrammās; augšā — A skola, apakšā — B skola.',
             axis=(0, 90, 10, 5), g1=('A', (10, 25, 40, 55, 80)), g2=('B', (20, 35, 45, 50, 70)), n2=32, gen1='A skolas', gen2='B skolas',
             unit='minūtes', where2='B skolā', thr_word='vismaz $50$ minūtes',
             stmts=['A skolā mediāna ir augstāka nekā B skolā.',
                    'B skolā vismaz ceturtā daļa skolēnu mājasdarbiem velta vairāk nekā $55$ minūtes.',
                    'A skolā rezultātu amplitūda ir lielāka nekā B skolā.'],
             true_idx=3)),
}

PROB = 'Atbildi uzrakstiet nesaīsināmas daļas veidā.'


def build(v, d):
    tasks = []
    def T(topic, title, cond, label, value, sol, diff='Средний', fig=None):
        ans = r'$\text{%s} = %s$' % (label, value)
        tasks.append(dict(topic=topic, title=f'KD {v}: {title}', c=cond, a=ans, s=sol, d=diff, fig=fig))

    # 1. Klasiskā varbūtība
    b = d['box']; n = sum(b['counts'].values())
    m1 = b['counts'][b['ask1'][0]]; m2 = n - b['counts'][b['ask2'][0]]
    p1, p2 = F(m1, n), F(m2, n)
    T(T_VARB, f"varbūtība, ka {b['ask1'][1]}", f"{b['text']} Aprēķiniet varbūtību, ka {b.get('it', 'tā')} ir {b['ask1'][1]}. {PROB}",
      'Varbūtība', frac(p1), f"1) Visu iznākumu skaits: $n = {n}$.\n2) Labvēlīgo iznākumu skaits: $m = {m1}$.\n3) $P = \\dfrac{{{m1}}}{{{n}}}{'' if F(m1, n).denominator == n else ' = ' + frac(p1)}$.\nAtbilde: ${frac(p1)}$.", 'Лёгкий')
    T(T_VARB, f"varbūtība, ka nav {b['ask2'][1]}", f"{b['text']} Aprēķiniet varbūtību, ka {b.get('it', 'tā')} nav {b['ask2'][1]}. {PROB}",
      'Varbūtība', frac(p2), f"1) Pretējā notikuma labvēlīgo iznākumu skaits: ${n - m2}$ no ${n}$: $P = \\dfrac{{{n - m2}}}{{{n}}}$.\n2) $P = 1 - \\dfrac{{{n - m2}}}{{{n}}} = \\dfrac{{{m2}}}{{{n}}} = {frac(p2)}$.\nAtbilde: ${frac(p2)}$.", 'Лёгкий')
    T(T_VARB, 'neiespējama notikuma varbūtība', f"{b['text']} Kāda ir varbūtība, ka {b.get('it', 'tā')} ir {b['none']}?",
      'Varbūtība', '0', f"1) Labvēlīgo iznākumu nav: $m = 0$.\n2) Tas ir neiespējams notikums, $P = \\dfrac{{0}}{{{n}}} = 0$.\nAtbilde: $0$.", 'Лёгкий')
    t = b['target']; ma = b['counts'][b['add_key']]; x = (t * n - ma) / (1 - t)
    assert x.denominator == 1 and x > 0
    x = int(x)
    T(T_VARB, 'cik pielika, lai mainītos varbūtība',
      f"{b['text'].split('. ')[0]}. {b['add_sent']} Tagad varbūtība uz labu laimi {'izņemt' if 'izņem' in b['text'] else 'izvilkt'} {b['add_word']} ir ${frac(t)}$. {b['add_q']}",
      'Skaits', str(x),
      f"1) Pieliek $x$; tagad labvēlīgo ir ${ma} + x$, visu ${n} + x$.\n2) $\\dfrac{{{ma} + x}}{{{n} + x}} = {frac(t)}$.\n3) ${t.denominator}({ma} + x) = {t.numerator}({n} + x)$, tātad $x = {x}$.\n4) Pārbaude: $\\dfrac{{{ma + x}}}{{{n + x}}} = {frac(t)}$.\nAtbilde: ${x}$.", 'Сложный')

    # 2. Divi kauliņi
    dc = d['dice']; intro = 'Vienlaikus met divus metamos kauliņus — baltu un melnu — un saskaita uzmesto punktu skaitu.'
    pairs = [(a, bb) for a in range(1, 7) for bb in range(1, 7)]
    cnt = lambda f: sum(1 for a, bb in pairs if f(a, bb))
    m = cnt(dc['fav'][1])
    T(T_VARB, f"kauliņi: iznākumi, kad {dc['fav'][0].replace('$', '')}", f"{intro} Cik ir tādu iznākumu, kuros {dc['fav'][0]}?",
      'Iznākumi', str(m), f"1) Iznākumu tabulā ir $6 \\cdot 6 = 36$ iznākumi.\n2) Saskaitām rūtiņas, kur {dc['fav'][0]}: to ir ${m}$.\nAtbilde: ${m}$.", 'Лёгкий')
    for key, diff in (('p2', 'Лёгкий'), ('p3', 'Средний'), ('p4', 'Средний')):
        m = cnt(dc[key][1]); p = F(m, 36)
        extra = '\n2) Rinda un kolonna kopā: $6 + 6 - 1 = %d$ (kopīgā rūtiņa skaitīta vienreiz).' % m if key == 'p4' else f"\n2) Labvēlīgo iznākumu skaits tabulā: ${m}$."
        T(T_VARB, f"kauliņi: {dc[key][0].replace('$', '')}", f"{intro} Aprēķiniet varbūtību, ka {dc[key][0]}. {PROB}",
          'Varbūtība', frac(p), f"1) Visu iznākumu skaits: $36$.{extra}\n3) $P = \\dfrac{{{m}}}{{36}} = {frac(p)}$.\nAtbilde: ${frac(p)}$.", diff)

    # 3. Relatīvais biežums
    fr = d['freq']
    r1 = F(fr['p1'][1] * 100, fr['p1'][2]); r2 = F(fr['p2'][1] * 100, fr['p2'][2])
    for (name, h, tot, gen, *_), r in ((fr['p1'], r1), (fr['p2'], r2)):
        T(T_VARB, f"{gen} relatīvais biežums", f"{fr['text']} Aprēķiniet {gen} relatīvo biežumu procentos.",
          'Biežums', lvnum(r) + r'\%', f"1) $\\dfrac{{{h}}}{{{tot}}} = {lvnum(F(h, tot))}$.\n2) ${lvnum(F(h, tot))} \\cdot 100\\% = {lvnum(r)}\\%$.\nAtbilde: ${lvnum(r)}\\%$.", 'Лёгкий')
    diff_pp = r1 - r2
    T(T_VARB, 'relatīvo biežumu salīdzinājums', f"{fr['text']} Par cik procentpunktiem {fr['p1'][3]} relatīvais biežums ir lielāks nekā {fr['p2'][3]}?",
      'Starpība', lvnum(diff_pp), f"1) {fr['p1'][3]} biežums: ${lvnum(r1)}\\%$, {fr['p2'][3]}: ${lvnum(r2)}\\%$.\n2) ${lvnum(r1)} - {lvnum(r2)} = {lvnum(diff_pp)}$.\n3) Lai gan {fr['p2'][4]} veiksmīgo mēģinājumu skaits ir lielāks, salīdzina relatīvos biežumus.\nAtbilde: ${lvnum(diff_pp)}$.", 'Средний')
    k = 0
    while F(fr['p2'][1] + k, fr['p2'][2] + fr['more']) < r1 / 100:
        k += 1
    assert k <= fr['more']
    T(T_VARB, 'cik vēl jātrāpa', f"{fr['text']} {fr['p2'][0]} izpildīs vēl ${fr['more']}$ {fr['unit']}. Cik no tiem jā{fr['hitword'].replace('trāpīt', 'trāpa').replace('izpildīt precīzi', 'izpilda precīzi')}, lai {fr['p2'][3]} relatīvais biežums kopā būtu vismaz tāds pats kā {fr['p1'][3]}? Atbildē uzrakstiet mazāko iespējamo skaitu.",
      'Skaits', str(k), f"1) Kopā būs ${fr['p2'][2] + fr['more']}$ mēģinājumi, vajag vismaz ${lvnum(r1)}\\%$ no tiem.\n2) ${lvnum(r1 / 100)} \\cdot {fr['p2'][2] + fr['more']} = {lvnum(r1 / 100 * (fr['p2'][2] + fr['more']))}$, tātad kopā vajag vismaz ${-(-(r1 / 100 * (fr['p2'][2] + fr['more'])) // 1)}$.\n3) Jau ir ${fr['p2'][1]}$, tāpēc vēl vajag ${k}$.\nAtbilde: ${k}$.", 'Сложный')

    # 4. Stabiņu diagramma
    bs = d['bars']; vals, fq = bs['vals'], bs['fq']
    fig4 = f'{v}-bars'
    data = [x for x, f in zip(vals, fq) for _ in range(f)]; N = len(data)
    S = sum(data)
    mode = vals[fq.index(max(fq))]
    T(T_STAT, 'aptaujāto skolēnu skaits', f"{bs['text']} Cik skolēnu piedalījās aptaujā?", 'Skolēni', str(N),
      f"1) Saskaitām stabiņu augstumus: ${' + '.join(map(str, fq))} = {N}$.\nAtbilde: ${N}$.", 'Лёгкий', fig4)
    pe = F(fq[vals.index(bs['exact'])] * 100, N)
    T(T_STAT, 'relatīvais biežums procentos', f"{bs['text']} Cik procentu skolēnu atbildēja «${bs['exact']}$»?", 'Biežums', lvnum(pe) + r'\%',
      f"1) Atbildi «${bs['exact']}$» deva ${fq[vals.index(bs['exact'])]}$ skolēni no ${N}$.\n2) $\\dfrac{{{fq[vals.index(bs['exact'])]}}}{{{N}}} \\cdot 100\\% = {lvnum(pe)}\\%$.\nAtbilde: ${lvnum(pe)}\\%$.", 'Лёгкий', fig4)
    T(T_STAT, 'datu moda', f"{bs['text']} Nosakiet datu modu.", 'Moda', str(mode),
      f"1) Augstākais stabiņš ir pie vērtības ${mode}$ (${max(fq)}$ skolēni).\n2) Moda ir vērtība, nevis tās biežums.\nAtbilde: ${mode}$.", 'Лёгкий', fig4)
    T(T_STAT, 'datu amplitūda', f"{bs['text']} Nosakiet datu amplitūdu.", 'Amplitūda', str(max(data) - min(data)),
      f"1) Lielākā vērtība ${max(data)}$, mazākā ${min(data)}$.\n2) ${max(data)} - {min(data)} = {max(data) - min(data)}$.\nAtbilde: ${max(data) - min(data)}$.", 'Лёгкий', fig4)
    me = med(data)
    cum = []; c = 0
    for f in fq:
        c += f; cum.append(str(c))
    where = f"${N // 2 + 1}.$ vērtība" if N % 2 else f"${N // 2}.$ un ${N // 2 + 1}.$ vērtības vidējais"
    T(T_STAT, 'mediāna pēc diagrammas', f"{bs['text']} Nosakiet datu mediānu.", 'Mediāna', lvnum(me),
      f"1) Datu skaits ${N}$, mediāna ir {where} sakārtotajā rindā.\n2) Uzkrātie biežumi: ${'; '.join(cum)}$.\n3) Mediāna: ${lvnum(me)}$.\nAtbilde: ${lvnum(me)}$.", 'Средний', fig4)
    mean = F(S, N)
    T(T_STAT, 'vidējā vērtība pēc diagrammas', f"{bs['text']} {bs['mean_q']}", 'Vidējais', lvnum(mean),
      f"1) Reizinājumu summa: ${' + '.join(f'{x} \\cdot {f}' for x, f in zip(vals, fq))} = {S}$.\n2) $\\bar x = \\dfrac{{{S}}}{{{N}}} = {lvnum(mean)}$.\nAtbilde: ${lvnum(mean)}$.", 'Средний', fig4)
    al = sum(f for x, f in zip(vals, fq) if x >= bs['atleast']); pa = F(al * 100, N)
    T(T_STAT, 'daļa procentos ar nosacījumu', f"{bs['text']} Cik procentu skolēnu atbildēja vismaz «${bs['atleast']}$»?", 'Daļa', lvnum(pa) + r'\%',
      f"1) Vismaz ${bs['atleast']}$: ${' + '.join(str(f) for x, f in zip(vals, fq) if x >= bs['atleast'])} = {al}$ skolēni.\n2) $\\dfrac{{{al}}}{{{N}}} \\cdot 100\\% = {lvnum(pa)}\\%$.\nAtbilde: ${lvnum(pa)}\\%$.", 'Средний', fig4)
    nm = F(S + bs['newval'], N + 1)
    assert (nm * 100).denominator == 1
    T(T_STAT, 'jaunā vidējā vērtība', f"{bs['text']} {bs['newtext']} Kāda tagad ir vidējā vērtība?", 'Vidējais', lvnum(nm),
      f"1) Līdzšinējā summa ${S}$, jaunā ${S} + {bs['newval']} = {S + bs['newval']}$.\n2) Datu skaits ${N + 1}$.\n3) $\\dfrac{{{S + bs['newval']}}}{{{N + 1}}} = {lvnum(nm)}$.\nAtbilde: ${lvnum(nm)}$.", 'Сложный', fig4)

    # 5. Kvartiles
    rw = d['raw']; dd = sorted(rw['data']); n5 = len(dd); h = n5 // 2
    lst = '; '.join(f'${x}$' for x in rw['data'])
    intro5 = f"{rw['text']} {lst}."
    me5, q1, q3 = med(dd), med(dd[:h]), med(dd[-h:])
    srt = '; '.join(map(str, dd))  # risinājumā
    T(T_STAT, 'amplitūda no datu rindas', f"{intro5} Nosakiet datu amplitūdu.", 'Amplitūda', str(dd[-1] - dd[0]),
      f"1) Sakārtojam: ${srt}$.\n2) ${dd[-1]} - {dd[0]} = {dd[-1] - dd[0]}$.\nAtbilde: ${dd[-1] - dd[0]}$.", 'Лёгкий')
    T(T_STAT, 'mediāna no datu rindas', f"{intro5} Nosakiet datu mediānu.", 'Mediāna', lvnum(me5),
      f"1) Sakārtojam: ${srt}$.\n2) Datu skaits pāra, mediāna ir ${h}.$ un ${h + 1}.$ vērtības vidējais: $\\dfrac{{{dd[h - 1]} + {dd[h]}}}{{2}} = {lvnum(me5)}$.\nAtbilde: ${lvnum(me5)}$.", 'Лёгкий')
    T(T_STAT, 'pirmā kvartile', f"{intro5} Nosakiet pirmo kvartili $Q_1$.", 'Kvartile', lvnum(q1),
      f"1) Apakšējā puse: ${'; '.join(map(str, dd[:h]))}$.\n2) Tās mediāna: $\\dfrac{{{dd[h // 2 - 1]} + {dd[h // 2]}}}{{2}} = {lvnum(q1)}$.\nAtbilde: ${lvnum(q1)}$.", 'Средний')
    T(T_STAT, 'trešā kvartile', f"{intro5} Nosakiet trešo kvartili $Q_3$.", 'Kvartile', lvnum(q3),
      f"1) Augšējā puse: ${'; '.join(map(str, dd[-h:]))}$.\n2) Tās mediāna: $\\dfrac{{{dd[h + h // 2 - 1]} + {dd[h + h // 2]}}}{{2}} = {lvnum(q3)}$.\nAtbilde: ${lvnum(q3)}$.", 'Средний')
    T(T_STAT, 'starpkvartiļu izkliede', f"{intro5} Aprēķiniet starpkvartiļu izkliedi $Q_3 - Q_1$.", 'Izkliede', lvnum(q3 - q1),
      f"1) $Q_1 = {lvnum(q1)}$, $Q_3 = {lvnum(q3)}$.\n2) ${lvnum(q3)} - {lvnum(q1)} = {lvnum(q3 - q1)}$.\nAtbilde: ${lvnum(q3 - q1)}$.", 'Средний')
    nd = sorted(dd[:-1] + [rw['new']]) if dd[-1] == rw['old'] else None
    assert nd is not None and med(nd) == me5
    T(T_STAT, 'amplitūda pēc kļūdas labojuma', f"{intro5} {rw['fix']} Kāda ir datu amplitūda pēc labojuma?", 'Amplitūda', str(nd[-1] - nd[0]),
      f"1) Lielākā vērtība tagad ${nd[-1]}$, mazākā ${nd[0]}$.\n2) ${nd[-1]} - {nd[0]} = {nd[-1] - nd[0]}$.\n3) Mediāna nemainās (${lvnum(me5)}$): lielākās vērtības maiņa vidējos datus neietekmē.\nAtbilde: ${nd[-1] - nd[0]}$.", 'Средний')

    # 6. Kastveida diagrammas
    bx = d['boxes']; fig6 = f'{v}-boxes'
    (n1, b1), (n2, b2) = bx['g1'], bx['g2']
    dm = b1[2] - b2[2]
    T(T_STAT, 'mediānu salīdzinājums', f"{bx['text']} Par cik {bx['gen1']} mediāna atšķiras no {bx['gen2']} mediānas? Atbildē uzrakstiet pozitīvu skaitli.",
      'Starpība', str(abs(dm)), f"1) Mediāna ir treknā līnija kastē: ${b1[2]}$ un ${b2[2]}$.\n2) $|{b1[2]} - {b2[2]}| = {abs(dm)}$.\nAtbilde: ${abs(dm)}$.", 'Лёгкий', fig6)
    for (nm_, bb), gen in (((n1, b1), bx['gen1']), ((n2, b2), bx['gen2'])):
        T(T_STAT, f"starpkvartiļu izkliede: {gen}", f"{bx['text']} Aprēķiniet {gen} starpkvartiļu izkliedi $Q_3 - Q_1$.", 'Izkliede', str(bb[3] - bb[1]),
          f"1) Kastes malas: $Q_1 = {bb[1]}$, $Q_3 = {bb[3]}$.\n2) ${bb[3]} - {bb[1]} = {bb[3] - bb[1]}$.\nAtbilde: ${bb[3] - bb[1]}$.", 'Средний', fig6)
    q = F(bx['n2'], 4)
    assert q.denominator == 1
    T(T_STAT, 'skolēnu skaits virs Q3', f"{bx['text']} {bx['where2'][0].upper() + bx['where2'][1:]} aptaujāja ${bx['n2']}$ skolēnus. Aptuveni cik no viņiem ieguva {bx['thr_word']}?".replace('ieguva vismaz $50$ minūtes', 'mājasdarbiem velta vismaz $50$ minūtes') if v == 'C' else
      f"{bx['text']} {bx['where2'][0].upper() + bx['where2'][1:]} ir ${bx['n2']}$ skolēni. Aptuveni cik no viņiem ieguva {bx['thr_word']}?",
      'Skolēni', str(int(q)), f"1) Robeža sakrīt ar $Q_3 = {b2[3]}$.\n2) Virs $Q_3$ ir aptuveni ceturtā daļa datu: ${bx['n2']} : 4 = {int(q)}$.\nAtbilde: ${int(q)}$.", 'Средний', fig6)
    st = bx['stmts']; ti = bx['true_idx']
    # pārbaude: tieši viens apgalvojums patiess
    lst6 = '\n'.join(f"{i + 1}) {s}" for i, s in enumerate(st))
    T(T_STAT, 'patiesais apgalvojums par diagrammām', f"{bx['text']} Kurš no apgalvojumiem ir patiess? {' '.join(f'{i + 1}) {s}' for i, s in enumerate(st))} Atbildē uzrakstiet apgalvojuma numuru.",
      'Numurs', str(ti), f"Pārbaudām katru apgalvojumu pēc diagrammu rādītājiem (minimums, $Q_1$, mediāna, $Q_3$, maksimums: {n1} — ${'; '.join(map(str, b1))}$, {n2} — ${'; '.join(map(str, b2))}$).\nPatiess ir tikai ${ti}.$ apgalvojums.\nAtbilde: ${ti}$.", 'Сложный', fig6)

    figs = {fig4: svg_hist(vals, fq), fig6: svg_boxes(*bx['axis'], [(n1, b1), (n2, b2)])}
    paper = dict(slug=f'kd-varbutiba-statistika-{v.lower()}', title=f'Kontroldarbs: Varbūtība un statistika ({v} variants)',
                 minutes=50, topics=[T_VARB, T_STAT], tasks=tasks)
    return paper, figs


def main():
    out = dict(grade=10, papers=[], figures={})
    for v, d in V.items():
        p, f = build(v, d)
        out['papers'].append(p)
        out['figures'].update(f)
    with open(os.path.join(HERE, 'paper.json'), 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print({p['slug']: len(p['tasks']) for p in out['papers']})


if __name__ == '__main__':
    main()
