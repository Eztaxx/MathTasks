# Divi kontroldarbi (Vispārīgais, 10. klase), katrs variantos A, B, C:
#   «Kopas un varbūtība» (tēma 10.1) un «Statistikas elementi» (tēma 10.2).
# Aizstāj kopīgo darbu scripts/papers/kd-varbutiba-statistika (varbūtība + statistika vienā darbā):
# uzdevumi pārņemti ar labojumiem, 10.1 papildināta ar kopām un kombinatoriku, 10.2 — ar datu veidiem,
# grupēšanu intervālos un izlasi.
# Ģenerē paper.json: seši darbi ar vienu skaitlisku atbildi katrā uzdevumā un 6 SVG.
# Atbildes šeit rēķina ar Fraction; verify.py tās pārrēķina neatkarīgi (pārlase, kopas, permutācijas).
# Palaišana: python -I scripts/papers/kd-visp-kopas-statistika/build.py
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


def pfrac(m, n):
    """m/n un, ja saīsināms, « = » saīsinātā daļa (bez «a = a»)."""
    s = r'\dfrac{%d}{%d}' % (m, n)
    return s if F(m, n).denominator == n and m != 0 else s + ' = ' + frac(F(m, n))


def med(d):
    d = sorted(d); n = len(d)
    return F(d[n // 2]) if n % 2 else F(d[n // 2 - 1] + d[n // 2], 2)


def setx(xs):
    return r'\{' + '; '.join(lvnum(F(x)) if not isinstance(x, str) else x for x in xs) + r'\}'


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
  sets=dict(A=[2, 4, 6, 8, 10, 12], B=[3, 6, 9, 12, 15]),
  venn=dict(text='Klasē ir $28$ skolēni. $15$ no viņiem apmeklē basketbola pulciņu, $12$ — volejbola pulciņu, bet $5$ skolēni apmeklē abus pulciņus.',
            n=28, a=15, b=12, ab=5, only='apmeklē tikai basketbola pulciņu', who='apmeklē basketbola pulciņu', only_of='a', none='neapmeklē nevienu no šiem pulciņiem'),
  nums=dict(res=r'Kopai $\mathbb{Z}$ pieder $#$ skaitļi', kind='Z', ask=r'pieder kopai $\mathbb{Z}$', items=[('-3', True), ('0{,}5', False), (r'\sqrt{2}', False), ('7', True), (r'-\dfrac{4}{2}', True), (r'\pi', False)],
            why=r'$-3$ un $7$ ir veseli skaitļi, $-\dfrac{4}{2} = -2$ arī; $0{,}5$ nav vesels, $\sqrt{2}$ un $\pi$ ir iracionāli'),
  subs=dict(elems=['a', 'b', 'c'], size=None),
  mult=dict(text='Skolas ēdnīcā pusdienām var izvēlēties vienu no $4$ zupām, vienu no $5$ pamatēdieniem un vienu no $3$ desertiem.',
            q='Cik dažādu pusdienu komplektu (zupa, pamatēdiens un deserts) var izveidot?', parts=[4, 5, 3], label='Komplekti'),
  digits=dict(digits=[0, 1, 2, 3, 4, 5]),
  hands=dict(text='Sešas draudzenes satikās, un katra ar katru apskāvās tieši vienu reizi.', q='Cik apskāvienu bija pavisam?', each='Katra no $6$ draudzenēm apskauj $5$ citas', n=6, label='Apskāvieni'),
  box=dict(text=r'Kastē ir $6$ sarkanas, $9$ zilas un $5$ zaļas bumbiņas. No kastes uz labu laimi izvelk vienu bumbiņu.',
           counts=dict(sarkanas=6, zilas=9, zalas=5), ask1=('zilas', 'zila'), ask2=('zalas', 'zaļa', 'zaļu bumbiņu'),
           none='dzeltena', add_key='zalas', add_sent='Kastē ielika vēl dažas zaļas bumbiņas.', add_q='Cik zaļu bumbiņu ielika?', add_word='zaļu bumbiņu', add_x='zaļas bumbiņas', target=F(2, 5)),
  dice=dict(fav=('summa ir $7$', lambda a, b: a + b == 7),
            p2=('summa ir pāra skaitlis', lambda a, b: (a + b) % 2 == 0),
            p3=('summa ir vismaz $10$', lambda a, b: a + b >= 10),
            p4=('vismaz uz viena kauliņa uzkrīt $6$ punkti', lambda a, b: 6 in (a, b)), p4_face=6),
  freq=dict(text=r'Treniņā Jānis no $24$ soda metieniem trāpīja $18$ reizes, bet Pēteris no $30$ soda metieniem trāpīja $21$ reizi.',
            p1=('Jānis', 18, 24, 'Jāņa'), p2=('Pēteris', 21, 30, 'Pētera', 'Pēterim'), more=10, unit='soda metienus', pron='tiem', verb='jātrāpa', what='trāpījumu'),
  bars=dict(text='Klases skolēniem jautāja, cik grāmatu viņi izlasīja oktobrī. Atbildes attēlotas stabiņu diagrammā: uz horizontālās ass — izlasīto grāmatu skaits, uz vertikālās — skolēnu skaits.',
            vals=[0, 1, 2, 3, 4, 5], fq=[2, 5, 8, 6, 3, 1], exact=2, exact_q='oktobrī izlasīja tieši $2$ grāmatas', atleast=3, atleast_q='oktobrī izlasīja vismaz $3$ grāmatas',
            newval=9, mean_q='Aprēķiniet, cik grāmatu vidēji izlasīja viens skolēns.', newtext='Klasei pievienojās jauns skolēns, kurš oktobrī izlasīja $9$ grāmatas.'),
  raw=dict(text='Divpadsmit skolēni pierakstīja, cik minūtes viņi pavada ceļā uz skolu:', data=[5, 8, 12, 7, 15, 20, 10, 9, 25, 14, 6, 11],
           fix='Izrādījās, ka viens skolēns kļūdījās: viņš ceļā pavada nevis $25$, bet $35$ minūtes.', old=25, new=35),
  boxes=dict(text='Divas klases rakstīja vienu un to pašu ieskaiti (maksimāli $40$ punkti). Rezultāti attēloti kastu diagrammās; augšā — 10.a klase, apakšā — 10.b klase.',
             axis=(0, 40, 5, 1), g1=('10.a', (8, 18, 24, 30, 38)), g2=('10.b', (12, 20, 22, 25, 34)), n2=24, gen1='10.a klases', gen2='10.b klases',
             count_sent='Ieskaiti 10.b klasē rakstīja ${}$ skolēni.', where2='10.b klasē', thr='ieguva vismaz tikpat punktu, cik ir 10.b klases trešā kvartile',
             stmts=['10.a klasē vismaz puse skolēnu ieguva vairāk punktu nekā 10.b klases mediāna.',
                    '10.a klases vājākais rezultāts ir labāks nekā 10.b klases vājākais rezultāts.',
                    '10.b klases rezultātu amplitūda ir lielāka nekā 10.a klasei.'],
             expl=[r'10.a mediāna $24 > 22$ (10.b mediāna), tātad vismaz puse 10.a skolēnu ieguva vairāk nekā $22$ punktus — patiess.',
                   r'Vājākie rezultāti: 10.a — $8$, 10.b — $12$; $8 < 12$ — aplams.',
                   r'Amplitūdas: 10.a — $38 - 8 = 30$, 10.b — $34 - 12 = 22$; $22 < 30$ — aplams.'],
             true_idx=1),
  types=dict(q='Kuri no šiem datiem ir kategoriāli?', opts=['skolēna augums centimetros', 'skolēna mīļākā krāsa', 'brāļu un māsu skaits ģimenē'], ans=2,
             expl=['augums — nepārtraukts kvantitatīvs lielums', 'krāsa — kategorija, tātad kategoriāli dati', 'brāļu un māsu skaits — diskrēts kvantitatīvs lielums']),
  group=dict(text='Piecpadsmit skolēnu augums centimetros:', data=[158, 172, 165, 161, 177, 169, 155, 163, 170, 166, 174, 160, 168, 159, 171], lo=160, hi=170),
  sample=dict(text='Skolā mācās $600$ skolēni. Aptaujāja $50$ nejauši izvēlētus skolēnus; $18$ no viņiem uz skolu brauc ar autobusu.',
              q='Novērtējiet, cik skolas skolēnu uz skolu brauc ar autobusu.', N=600, n=50, k=18)),
 'B': dict(
  sets=dict(A=[1, 3, 5, 7, 9, 11, 13, 15], B=[3, 6, 9, 12, 15]),
  venn=dict(text='Klasē ir $30$ skolēni. $18$ no viņiem dzied korī, $11$ dejo tautas deju kolektīvā, bet $6$ skolēni gan dzied korī, gan dejo.',
            n=30, a=18, b=11, ab=6, only='tikai dejo, bet nedzied korī', who='dejo', only_of='b', none='ne dzied korī, ne dejo tautas deju kolektīvā'),
  nums=dict(res=r'Kopai $\mathbb{Q}$ pieder $#$ skaitļi', kind='Q', ask=r'pieder kopai $\mathbb{Q}$', items=[('1{,}5', True), ('-2', True), (r'\sqrt{9}', True), (r'\sqrt{5}', False), (r'\dfrac{3}{7}', True), (r'\pi', False)],
            why=r'$1{,}5$, $-2$, $\sqrt{9} = 3$ un $\dfrac{3}{7}$ var uzrakstīt daļas veidā; $\sqrt{5}$ un $\pi$ ir iracionāli'),
  subs=dict(elems=['p', 'q', 'r', 's'], size=None),
  mult=dict(text='Skapī ir $6$ krekli, $4$ bikses un $3$ kurpju pāri.',
            q='Cik dažādos veidos var saģērbties, izvēloties vienu kreklu, vienas bikses un vienu kurpju pāri?', parts=[6, 4, 3], label='Veidi'),
  digits=dict(digits=[0, 1, 2, 3, 4]),
  hands=dict(text='Turnīrā piedalās $8$ komandas, un katra komanda ar katru citu spēlē tieši vienu reizi.', q='Cik spēļu notiks turnīrā?', each='Katra no $8$ komandām spēlē ar $7$ citām', n=8, label='Spēles'),
  box=dict(text=r'Maisiņā ir $8$ šokolādes konfektes, $5$ karameles un $7$ marmelādes konfektes. No maisiņa uz labu laimi izņem vienu konfekti.',
           counts=dict(sok=8, kar=5, mar=7), ask1=('kar', 'karamele'), ask2=('sok', 'šokolādes konfekte', 'šokolādes konfekti'),
           none='košļājamā gumija', add_key='kar', add_sent='Maisiņā ielika vēl dažas karameles.', add_q='Cik karameļu ielika?', add_word='karameli', add_x='karameles', target=F(3, 8)),
  dice=dict(fav=('summa ir $8$', lambda a, b: a + b == 8),
            p2=('summa ir nepāra skaitlis', lambda a, b: (a + b) % 2 == 1),
            p3=('summa nav lielāka par $4$', lambda a, b: a + b <= 4),
            p4=('vismaz uz viena kauliņa uzkrīt $1$ punkts', lambda a, b: 1 in (a, b)), p4_face=1),
  freq=dict(text=r'Volejbola treniņā Anna no $20$ servēm precīzi izpildīja $17$, bet Līga no $40$ servēm precīzi izpildīja $32$.',
            p1=('Anna', 17, 20, 'Annas'), p2=('Līga', 32, 40, 'Līgas', 'Līgai'), more=20, unit='serves', pron='tām', verb='jāizpilda precīzi', what='precīzo servju'),
  bars=dict(text='Klases skolēniem jautāja, cik reizes pagājušajā nedēļā viņi sportoja ārpus sporta stundām. Atbildes attēlotas stabiņu diagrammā: uz horizontālās ass — reižu skaits, uz vertikālās — skolēnu skaits.',
            vals=[0, 1, 2, 3, 4, 5], fq=[1, 4, 5, 6, 3, 1], exact=3, exact_q='sportoja tieši $3$ reizes', atleast=3, atleast_q='sportoja vismaz $3$ reizes',
            newval=14, mean_q='Aprēķiniet, cik reizes nedēļā vidēji sportoja viens skolēns.', newtext='Klasei pievienojās jauns skolēns, kurš pagājušajā nedēļā sportoja $14$ reizes.'),
  raw=dict(text='Divpadsmit skolēni pierakstīja, cik minūtes viņi vakar lasīja grāmatu:', data=[14, 22, 9, 30, 18, 12, 25, 16, 20, 11, 35, 15],
           fix='Izrādījās, ka viens skolēns kļūdījās: viņš lasīja nevis $35$, bet $45$ minūtes.', old=35, new=45),
  boxes=dict(text='Divas klases rakstīja vienu un to pašu ieskaiti (maksimāli $50$ punkti). Rezultāti attēloti kastu diagrammās; augšā — 10.c klase, apakšā — 10.d klase.',
             axis=(0, 50, 5, 1), g1=('10.c', (15, 25, 32, 38, 46)), g2=('10.d', (20, 28, 30, 33, 42)), n2=20, gen1='10.c klases', gen2='10.d klases',
             count_sent='Ieskaiti 10.d klasē rakstīja ${}$ skolēni.', where2='10.d klasē', thr='ieguva vismaz tikpat punktu, cik ir 10.d klases trešā kvartile',
             stmts=['10.d klasē vismaz puse skolēnu ieguva vairāk punktu nekā 10.c klases mediāna.',
                    '10.d klases vājākais rezultāts ir labāks nekā 10.c klases vājākais rezultāts.',
                    '10.d klases rezultātu amplitūda ir lielāka nekā 10.c klasei.'],
             expl=[r'10.d mediāna $30 < 32$ (10.c mediāna), tātad vairāk nekā $32$ punktus ieguva mazāk nekā puse 10.d skolēnu — aplams.',
                   r'Vājākie rezultāti: 10.d — $20$, 10.c — $15$; $20 > 15$ — patiess.',
                   r'Amplitūdas: 10.d — $42 - 20 = 22$, 10.c — $46 - 15 = 31$; $22 < 31$ — aplams.'],
             true_idx=2),
  types=dict(q='Kuri no šiem datiem ir nepārtraukti kvantitatīvi?', opts=['skolēnu skaits klasē', 'skolēna ķermeņa masa kilogramos', 'skolēna dzimšanas mēnesis'], ans=2,
             expl=['skolēnu skaits — diskrēts kvantitatīvs lielums (to skaita)', 'masa — nepārtraukts kvantitatīvs lielums (to mēra, vērtība var būt jebkura)', 'mēnesis — kategorija, nevis mērījums']),
  group=dict(text='Piecpadsmit skolēni pierakstīja, cik minūtes viņi pavadīja sporta treniņā:', data=[42, 55, 60, 38, 47, 66, 50, 58, 44, 63, 52, 49, 70, 57, 45], lo=50, hi=60),
  sample=dict(text='Skolā mācās $800$ skolēni. Aptaujāja $40$ nejauši izvēlētus skolēnus; $15$ no viņiem apmeklē kādu sporta pulciņu.',
              q='Novērtējiet, cik skolas skolēnu apmeklē kādu sporta pulciņu.', N=800, n=40, k=15)),
 'C': dict(
  sets=dict(A=[4, 8, 12, 16, 20, 24], B=[5, 10, 15, 20, 25, 30]),
  venn=dict(text='Klasē ir $32$ skolēni. $20$ no viņiem apmeklē matemātikas pulciņu, $14$ — programmēšanas pulciņu, bet $7$ skolēni apmeklē abus pulciņus.',
            n=32, a=20, b=14, ab=7, only='apmeklē tikai programmēšanas pulciņu', who='apmeklē programmēšanas pulciņu', only_of='b', none='neapmeklē nevienu no šiem pulciņiem'),
  nums=dict(res='Iracionāli ir $#$ skaitļi', kind='I', ask=r'pieder kopai $\mathbb{R}$, bet nepieder kopai $\mathbb{Q}$', items=[('2{,}5', False), (r'\sqrt{7}', True), ('-1', False), (r'\pi', True), (r'\sqrt{16}', False), (r'\dfrac{1}{3}', False)],
            why=r'iracionāli ir tikai $\sqrt{7}$ un $\pi$; $2{,}5$, $-1$, $\sqrt{16} = 4$ un $\dfrac{1}{3}$ ir racionāli'),
  subs=dict(elems=['k', 'l', 'm'], size=None),
  mult=dict(text='Kafejnīcā var izvēlēties vienu no $7$ tējām, vienu no $3$ kūkām un vienu no $2$ tases izmēriem.',
            q='Cik dažādu pasūtījumu (tēja, kūka un tases izmērs) var izveidot?', parts=[7, 3, 2], label='Pasūtījumi'),
  digits=dict(digits=[0, 1, 2, 3, 4, 5, 6]),
  hands=dict(text='Septiņi skolēni sasveicinājās, katrs ar katru paspiežot roku tieši vienu reizi.', q='Cik rokasspiedienu bija pavisam?', each='Katrs no $7$ skolēniem paspiež roku $6$ citiem', n=7, label='Rokasspiedieni'),
  box=dict(text=r'Uz galda ir $25$ kartītes ar jautājumiem: $7$ matemātikā, $10$ latviešu valodā un $8$ angļu valodā. Skolēns uz labu laimi izvelk vienu kartīti.',
           counts=dict(mat=7, lat=10, ang=8), ask1=('ang', 'jautājums angļu valodā'), ask2=('mat', 'jautājuma matemātikā', 'kartīti ar jautājumu matemātikā'),
           it='tajā', none='jautājums ķīmijā', add_key='mat', add_sent='Skolotāja pielika vēl dažas kartītes ar jautājumiem matemātikā.', add_q='Cik kartīšu pielika?', add_word='kartīti ar jautājumu matemātikā', add_x='kartītes ar jautājumiem matemātikā', add_verb='pielika', target=F(1, 2)),
  dice=dict(fav=('summa ir $9$', lambda a, b: a + b == 9),
            p2=('uz abiem kauliņiem uzkrīt vienāds punktu skaits', lambda a, b: a == b),
            p3=('summa nav lielāka par $3$', lambda a, b: a + b <= 3),
            p4=('vismaz uz viena kauliņa uzkrīt $5$ punkti', lambda a, b: 5 in (a, b)), p4_face=5),
  freq=dict(text=r'Šaušanas treniņā Kārlis no $35$ šāvieniem mērķī trāpīja $28$ reizes, bet Mārtiņš no $48$ šāvieniem trāpīja $36$ reizes.',
            p1=('Kārlis', 28, 35, 'Kārļa'), p2=('Mārtiņš', 36, 48, 'Mārtiņa', 'Mārtiņam'), more=20, unit='šāvienus', pron='tiem', verb='jātrāpa', what='trāpījumu'),
  bars=dict(text='Klases skolēniem jautāja, cik cilvēku ir viņu ģimenē (kopā ar pašu skolēnu). Atbildes attēlotas stabiņu diagrammā: uz horizontālās ass — cilvēku skaits ģimenē, uz vertikālās — skolēnu skaits.',
            vals=[2, 3, 4, 5, 6], fq=[3, 7, 9, 5, 1], exact=4, exact_q='ģimenē ir tieši $4$ cilvēki', atleast=5, atleast_q='ģimenē ir vismaz $5$ cilvēki',
            newval=10, mean_q='Aprēķiniet vidējo cilvēku skaitu vienā ģimenē.', newtext='Klasei pievienojās jauns skolēns, kura ģimenē ir $10$ cilvēki.'),
  raw=dict(text='Divpadsmit skolēni pierakstīja, cik stundu pagājušajā nedēļā viņi spēlēja datorspēles:', data=[3, 12, 7, 5, 9, 14, 6, 10, 8, 4, 18, 11],
           fix='Izrādījās, ka viens skolēns kļūdījās: viņš spēlēja nevis $18$, bet $28$ stundas.', old=18, new=28),
  boxes=dict(text='Divās skolās aptaujāja skolēnus, cik minūtes dienā viņi pilda mājasdarbus. Rezultāti attēloti kastu diagrammās; augšā — 1. skola, apakšā — 2. skola.',
             axis=(0, 90, 10, 5), g1=('1. sk.', (10, 25, 40, 55, 80)), g2=('2. sk.', (20, 35, 45, 50, 70)), n2=32, gen1='1. skolas', gen2='2. skolas',
             count_sent='2. skolā aptaujāja ${}$ skolēnus.', where2='2. skolā', thr='mājasdarbiem velta vismaz tikpat minūšu, cik ir 2. skolas trešā kvartile',
             stmts=['1. skolā mediāna ir lielāka nekā 2. skolā.',
                    '2. skolā lielākais rezultāts ir lielāks nekā 1. skolā.',
                    '1. skolā rezultātu amplitūda ir lielāka nekā 2. skolā.'],
             expl=[r'Mediānas: 1. skolā $40$, 2. skolā $45$; $40 < 45$ — aplams.',
                   r'Lielākie rezultāti: 2. skolā $70$, 1. skolā $80$; $70 < 80$ — aplams.',
                   r'Amplitūdas: 1. skolā $80 - 10 = 70$, 2. skolā $70 - 20 = 50$; $70 > 50$ — patiess.'],
             true_idx=3),
  types=dict(q='Kuri no šiem datiem ir diskrēti kvantitatīvi?', opts=['gaisa temperatūra pusdienlaikā', 'skolēna acu krāsa', 'mājdzīvnieku skaits ģimenē'], ans=3,
             expl=['temperatūra — nepārtraukts kvantitatīvs lielums (to mēra)', 'acu krāsa — kategorija', 'mājdzīvnieku skaits — diskrēts kvantitatīvs lielums (to skaita)']),
  group=dict(text='Piecpadsmit skolēni pierakstīja savu rezultātu $60$ metru skrējienā sekundēs:', data=[9.4, 8.7, 10.2, 9.8, 8.9, 9.1, 10.6, 9.5, 8.6, 9.9, 9.2, 10.0, 9.0, 9.6, 8.8], lo=9, hi=10),
  sample=dict(text='Skolā mācās $450$ skolēni. Aptaujāja $60$ nejauši izvēlētus skolēnus; $22$ no viņiem katru dienu brokasto skolas ēdnīcā.',
              q='Novērtējiet, cik skolas skolēnu katru dienu brokasto skolas ēdnīcā.', N=450, n=60, k=22)),
}

PROB = 'Atbildi uzrakstiet nesaīsināmas daļas veidā.'
NUM = 'Atbildē uzrakstiet derīgo apgalvojumu numuru.'


def dice_listing(f):
    """Labvēlīgie pāri (baltais; melnais): uzskaitījums vai sadalījums pēc baltā kauliņa."""
    pairs = [(a, b) for a in range(1, 7) for b in range(1, 7) if f(a, b)]
    if len(pairs) <= 8:
        return 'Labvēlīgie pāri (baltais; melnais): ' + ', '.join(f'$({a}; {b})$' for a, b in pairs) + f' — pavisam ${len(pairs)}$.'
    by = [sum(1 for b in range(1, 7) if f(a, b)) for a in range(1, 7)]
    return ('Pēc baltā kauliņa punktiem $1, 2, \\ldots, 6$ derīgo melnā kauliņa vērtību skaits: '
            + ', '.join(f'${x}$' for x in by) + f'; kopā ${" + ".join(map(str, by))} = {len(pairs)}$.')


def build_kopas(v, d, T):
    """Darbs 10.1: kopas, kombinatorika, varbūtība."""
    # Kopas
    A, B = d['sets']['A'], d['sets']['B']
    sA, sB = set(A), set(B)
    intro = f"Dotas kopas $A = {setx(A)}$ un $B = {setx(B)}$."
    inter, uni, diff = sorted(sA & sB), sorted(sA | sB), sorted(sA - sB)
    T(T_VARB, 'kopu šķēluma elementu skaits', f"{intro} Cik elementu ir kopai $A \\cap B$?", 'Elementi', str(len(inter)),
      f"1) Kopīgie elementi: $A \\cap B = {setx(inter)}$.\n2) To ir ${len(inter)}$.\nAtbilde: ${len(inter)}$.", 'Лёгкий')
    T(T_VARB, 'kopu apvienojuma elementu skaits', f"{intro} Cik elementu ir kopai $A \\cup B$?", 'Elementi', str(len(uni)),
      f"1) $A \\cup B = {setx(uni)}$ — katrs elements vienreiz.\n2) Pārbaude: $|A| + |B| - |A \\cap B| = {len(A)} + {len(B)} - {len(inter)} = {len(uni)}$.\nAtbilde: ${len(uni)}$.", 'Лёгкий')
    T(T_VARB, 'kopu starpības elementu skaits', f"{intro} Cik elementu ir kopai $A \\setminus B$?", 'Elementi', str(len(diff)),
      f"1) No kopas $A$ izņemam elementus, kas ir arī kopā $B$: ${setx(inter)}$.\n2) $A \\setminus B = {setx(diff)}$, to ir ${len(diff)}$.\nAtbilde: ${len(diff)}$.", 'Средний')
    vn = d['venn']; ab_or = vn['a'] + vn['b'] - vn['ab']; none = vn['n'] - ab_or
    only = (vn['a'] if vn['only_of'] == 'a' else vn['b']) - vn['ab']
    T(T_VARB, 'Eilera–Venna diagramma: neviens', f"{vn['text']} Cik skolēnu {vn['none']}?", 'Skolēni', str(none),
      f"1) Vismaz vienā grupā: ${vn['a']} + {vn['b']} - {vn['ab']} = {ab_or}$ (abās grupās esošie citādi būtu skaitīti divreiz).\n2) Nevienā grupā: ${vn['n']} - {ab_or} = {none}$.\nAtbilde: ${none}$.", 'Средний')
    T(T_VARB, 'Eilera–Venna diagramma: tikai viens', f"{vn['text']} Cik skolēnu {vn['only']}?",
      'Skolēni', str(only),
      f"1) No visiem, kas {vn['who']}, atņemam tos, kas ir abās grupās: ${(vn['a'] if vn['only_of'] == 'a' else vn['b'])} - {vn['ab']} = {only}$.\nAtbilde: ${only}$.", 'Лёгкий')
    nm = d['nums']; cnt = sum(1 for _, ok in nm['items'] if ok)
    T(T_VARB, 'skaitļu kopas', f"Cik no skaitļiem ${';\\; '.join(x for x, _ in nm['items'])}$ {nm['ask']}?", 'Skaits', str(cnt),
      f"1) {nm['why'][0].upper() + nm['why'][1:]}.\n2) {nm['res'].replace('#', str(cnt))}.\nAtbilde: ${cnt}$.", 'Средний')
    sb = d['subs']; k = len(sb['elems'])
    if sb['size'] is None:
        ns = 2 ** k
        T(T_VARB, 'apakškopu skaits', f"Cik apakškopu ir kopai ${setx(sb['elems'])}$? Ieskaitiet arī tukšo kopu un pašu kopu.", 'Apakškopas', str(ns),
          f"1) Katrs no ${k}$ elementiem apakškopā vai nu ir, vai nav — $2$ iespējas.\n2) $2^{{{k}}} = {ns}$.\nAtbilde: ${ns}$.", 'Средний')
    else:
        from math import comb
        ns = comb(k, sb['size'])
        T(T_VARB, 'divelementu apakškopu skaits', f"Cik ir kopas ${setx(sb['elems'])}$ apakškopu, kurās ir tieši divi elementi?", 'Apakškopas', str(ns),
          f"1) Uzskaitām: " + ', '.join('$\\{' + a + '; ' + b + '\\}$' for i, a in enumerate(sb['elems']) for b in sb['elems'][i + 1:]) + f".\n2) To ir ${ns}$.\nAtbilde: ${ns}$.", 'Средний')
    # Kombinatorika
    mu = d['mult']; prod = 1
    for x in mu['parts']:
        prod *= x
    T(T_VARB, 'reizināšanas likums', f"{mu['text']} {mu['q']}", mu['label'], str(prod),
      f"1) Izvēles ir neatkarīgas, tāpēc lieto reizināšanas likumu.\n2) ${' \\cdot '.join(map(str, mu['parts']))} = {prod}$.\nAtbilde: ${prod}$.", 'Лёгкий')
    dg = d['digits']['digits']; nz = len(dg) - 1; tot = nz * nz * (nz - 1)
    T(T_VARB, 'trīsciparu skaitļi bez atkārtošanās', f"Cik ir trīsciparu skaitļu, kurus var uzrakstīt ar cipariem ${', '.join(map(str, dg))}$, ja cipari skaitlī neatkārtojas?", 'Skaitļi', str(tot),
      f"1) Pirmais cipars nevar būt $0$: ${nz}$ iespējas.\n2) Otrais — jebkurš no atlikušajiem, arī $0$: ${nz}$ iespējas.\n3) Trešais — ${nz - 1}$ iespējas.\n4) ${nz} \\cdot {nz} \\cdot {nz - 1} = {tot}$.\nAtbilde: ${tot}$.", 'Сложный')
    hs = d['hands']; n = hs['n']; pairs = n * (n - 1) // 2
    T(T_VARB, 'katrs ar katru', f"{hs['text']} {hs['q']}", hs['label'], str(pairs),
      f"1) {hs['each']}: ${n} \\cdot {n - 1} = {n * (n - 1)}$.\n2) Katrs pāris tā skaitīts divreiz: ${n * (n - 1)} : 2 = {pairs}$.\nAtbilde: ${pairs}$.", 'Средний')

    # Klasiskā varbūtība
    b = d['box']; n = sum(b['counts'].values())
    m1 = b['counts'][b['ask1'][0]]; mbad = b['counts'][b['ask2'][0]]; m2 = n - mbad
    p1, p2 = F(m1, n), F(m2, n)
    it = b.get('it', 'tā')
    T(T_VARB, f"varbūtība, ka {b['ask1'][1]}", f"{b['text']} Aprēķiniet varbūtību, ka {it} ir {b['ask1'][1]}. {PROB}",
      'Varbūtība', frac(p1), f"1) Visu iznākumu skaits: $n = {n}$.\n2) Labvēlīgo iznākumu skaits: $m = {m1}$.\n3) $P = {pfrac(m1, n)}$.\nAtbilde: ${frac(p1)}$.", 'Лёгкий')
    T(T_VARB, f"varbūtība, ka nav {b['ask2'][1]}", f"{b['text']} Aprēķiniet varbūtību, ka {it} nav {b['ask2'][1]}. {PROB}",
      'Varbūtība', frac(p2), f"1) Notikums $A$ — {it} nav {b['ask2'][1]}; pretējais notikums $\\bar{{A}}$ — {'izņem' if 'izņem' in b['text'] else 'izvelk'} {b['ask2'][2]}: $P(\\bar{{A}}) = \\dfrac{{{mbad}}}{{{n}}}$.\n2) $P(A) = 1 - \\dfrac{{{mbad}}}{{{n}}} = {pfrac(m2, n)}$.\nAtbilde: ${frac(p2)}$.", 'Лёгкий')
    T(T_VARB, 'neiespējama notikuma varbūtība', f"{b['text']} Kāda ir varbūtība, ka {it} ir {b['none']}?",
      'Varbūtība', '0', f"1) Labvēlīgo iznākumu nav: $m = 0$.\n2) Tas ir neiespējams notikums, $P = \\dfrac{{0}}{{{n}}} = 0$.\nAtbilde: $0$.", 'Лёгкий')
    t = b['target']; ma = b['counts'][b['add_key']]; x = (t * n - ma) / (1 - t)
    assert x.denominator == 1 and x > 0
    x = int(x)
    lhs = f"{t.denominator}({ma} + x)"
    rhs = f"{n} + x" if t.numerator == 1 else f"{t.numerator}({n} + x)"
    T(T_VARB, 'cik pielika, lai mainītos varbūtība',
      f"{b['text'].split('. ')[0]}. {b['add_sent']} Tagad varbūtība uz labu laimi {'izņemt' if 'izņem' in b['text'] else 'izvilkt'} {b['add_word']} ir ${frac(t)}$. {b['add_q']}",
      'Skaits', str(x),
      f"1) Pieņemsim, ka {b.get('add_verb', 'ielika')} $x$ {b['add_x']}; tagad labvēlīgo ir ${ma} + x$, visu ${n} + x$.\n2) $\\dfrac{{{ma} + x}}{{{n} + x}} = {frac(t)}$.\n3) ${lhs} = {rhs}$, tātad $x = {x}$.\n4) Pārbaude: $\\dfrac{{{ma + x}}}{{{n + x}}} = {frac(t)}$.\nAtbilde: ${x}$.", 'Сложный')

    # Divi kauliņi
    dc = d['dice']; intro2 = 'Vienlaikus met divus metamos kauliņus — baltu un melnu — un saskaita uzmesto punktu skaitu.'
    pairs36 = [(a, bb) for a in range(1, 7) for bb in range(1, 7)]
    cnt = lambda f: sum(1 for a, bb in pairs36 if f(a, bb))
    m = cnt(dc['fav'][1])
    T(T_VARB, f"kauliņi: iznākumi, kad {dc['fav'][0].replace('$', '')}", f"{intro2} Cik ir tādu iznākumu, kuros {dc['fav'][0]}?",
      'Iznākumi', str(m), f"1) Visu iznākumu ir $6 \\cdot 6 = 36$.\n2) {dice_listing(dc['fav'][1])}\nAtbilde: ${m}$.", 'Лёгкий')
    for key, diff in (('p2', 'Лёгкий'), ('p3', 'Средний'), ('p4', 'Средний')):
        m = cnt(dc[key][1]); p = F(m, 36)
        if key == 'p4':
            k6 = dc['p4_face']
            how = (f'Baltajā kauliņā ${k6}$ — $6$ iznākumi, melnajā ${k6}$ — vēl $6$; iznākums $({k6}; {k6})$ tā ieskaitīts divreiz: '
                   f'$6 + 6 - 1 = {m}$.')
            intro_k = 'Vienlaikus met divus metamos kauliņus — baltu un melnu.'
        else:
            how = dice_listing(dc[key][1]); intro_k = intro2
        T(T_VARB, f"kauliņi: {dc[key][0].replace('$', '')}", f"{intro_k} Aprēķiniet varbūtību, ka {dc[key][0]}. {PROB}",
          'Varbūtība', frac(p), f"1) Visu iznākumu skaits: $36$.\n2) {how}\n3) $P = {pfrac(m, 36)}$.\nAtbilde: ${frac(p)}$.", diff)

    # Relatīvais biežums
    fr = d['freq']
    r1 = F(fr['p1'][1] * 100, fr['p1'][2]); r2 = F(fr['p2'][1] * 100, fr['p2'][2])
    for (name, h, tot_, gen, *_), r in ((fr['p1'], r1), (fr['p2'], r2)):
        T(T_VARB, f"{gen} relatīvais biežums", f"{fr['text']} Aprēķiniet {gen} {fr['what']} relatīvo biežumu procentos.",
          'Biežums', lvnum(r) + r'\%', f"1) $\\dfrac{{{h}}}{{{tot_}}} = {lvnum(F(h, tot_))}$.\n2) ${lvnum(F(h, tot_))} \\cdot 100\\% = {lvnum(r)}\\%$.\nAtbilde: ${lvnum(r)}\\%$.", 'Лёгкий')
    diff_pp = r1 - r2
    T(T_VARB, 'relatīvo biežumu salīdzinājums', f"{fr['text']} Par cik procentpunktiem {fr['p1'][3]} {fr['what']} relatīvais biežums ir lielāks nekā {fr['p2'][3]}?",
      'Starpība', lvnum(diff_pp), f"1) {fr['p1'][3]} biežums: ${lvnum(r1)}\\%$, {fr['p2'][3]}: ${lvnum(r2)}\\%$.\n2) ${lvnum(r1)} - {lvnum(r2)} = {lvnum(diff_pp)}$.\n3) Lai gan {fr['p2'][4]} veiksmīgo mēģinājumu skaits ir lielāks, salīdzina relatīvos biežumus.\nAtbilde: ${lvnum(diff_pp)}$.", 'Средний')
    k = 0
    while F(fr['p2'][1] + k, fr['p2'][2] + fr['more']) < r1 / 100:
        k += 1
    assert k <= fr['more']
    need = r1 / 100 * (fr['p2'][2] + fr['more'])
    T(T_VARB, 'cik vēl vajag veiksmīgu mēģinājumu', f"{fr['text']} {fr['p2'][0]} izpildīs vēl ${fr['more']}$ {fr['unit']}. Cik no {fr['pron']} {fr['verb']}, lai {fr['p2'][3]} {fr['what']} relatīvais biežums kopumā būtu vismaz tāds pats kā {fr['p1'][3]}? Atbildē uzrakstiet mazāko iespējamo skaitu.",
      'Skaits', str(k), f"1) Kopā būs ${fr['p2'][2] + fr['more']}$ mēģinājumi, vajag vismaz ${lvnum(r1)}\\%$ no tiem.\n2) ${lvnum(r1 / 100)} \\cdot {fr['p2'][2] + fr['more']} = {lvnum(need)}$, tātad kopā vajag vismaz ${-(-need // 1)}$.\n3) Jau ir ${fr['p2'][1]}$, tāpēc vēl vajag ${k}$.\nAtbilde: ${k}$.", 'Сложный')


def build_stat(v, d, T):
    """Darbs 10.2: datu veidi, grupēšana, izlase, diagrammas, kvartiles."""
    ty = d['types']
    T(T_STAT, 'datu veidi', f"{ty['q']} {' '.join(f'{i + 1}) {o[0].upper() + o[1:]}.' for i, o in enumerate(ty['opts']))} Pareizs ir tieši viens variants. Atbildē uzrakstiet pareizā varianta numuru.", 'Numurs', str(ty['ans']),
      '\n'.join(f"{i + 1}) {e[0].upper() + e[1:]}." for i, e in enumerate(ty['expl'])) + f"\nAtbilde: ${ty['ans']}$.", 'Лёгкий')
    gr = d['group']; inside = [x for x in gr['data'] if gr['lo'] <= x < gr['hi']]
    show = lambda x: ('%.1f' % x).replace('.', '{,}') if isinstance(x, float) else str(x)
    T(T_STAT, 'datu grupēšana intervālos', f"{gr['text']} ${'; '.join(show(x) for x in gr['data'])}$. Datus grupē intervālos. Cik vērtību ir intervālā $[{gr['lo']}; {gr['hi']})$?", 'Skaits', str(len(inside)),
      f"1) Intervālā $[{gr['lo']}; {gr['hi']})$ ietilpst vērtības, kas ir vismaz ${gr['lo']}$, bet mazākas par ${gr['hi']}$ (pati vērtība ${gr['hi']}$ pieder nākamajam intervālam).\n2) Tās ir: ${'; '.join(show(x) for x in sorted(inside))}$.\n3) To ir ${len(inside)}$.\nAtbilde: ${len(inside)}$.", 'Средний')
    sm = d['sample']; est = F(sm['k'] * sm['N'], sm['n'])
    assert est.denominator == 1
    T(T_STAT, 'novērtējums pēc izlases', f"{sm['text']} {sm['q']}", 'Skolēni', str(int(est)),
      f"1) Izlasē daļa ir $\\dfrac{{{sm['k']}}}{{{sm['n']}}}$.\n2) Pieņemam, ka ģenerālkopā (visā skolā) daļa ir tāda pati: ${sm['N']} \\cdot \\dfrac{{{sm['k']}}}{{{sm['n']}}} = {int(est)}$.\nAtbilde: ${int(est)}$.", 'Средний')

    # Stabiņu diagramma
    bs = d['bars']; vals, fq = bs['vals'], bs['fq']
    fig4 = f'{v}-bars'
    data = [x for x, f in zip(vals, fq) for _ in range(f)]; N = len(data)
    S = sum(data)
    mode = vals[fq.index(max(fq))]
    T(T_STAT, 'aptaujāto skolēnu skaits', f"{bs['text']} Cik skolēnu piedalījās aptaujā?", 'Skolēni', str(N),
      f"1) Saskaitām stabiņu augstumus: ${' + '.join(map(str, fq))} = {N}$.\nAtbilde: ${N}$.", 'Лёгкий', fig4)
    fe = fq[vals.index(bs['exact'])]; pe = F(fe * 100, N)
    T(T_STAT, 'relatīvais biežums procentos', f"{bs['text']} Cik procentu skolēnu {bs['exact_q']}?", 'Biežums', lvnum(pe) + r'\%',
      f"1) Stabiņš pie vērtības ${bs['exact']}$: ${fe}$ skolēni no ${N}$.\n2) $\\dfrac{{{fe}}}{{{N}}} \\cdot 100\\% = {lvnum(pe)}\\%$.\nAtbilde: ${lvnum(pe)}\\%$.", 'Лёгкий', fig4)
    T(T_STAT, 'datu moda', f"{bs['text']} Nosakiet datu modu.", 'Moda', str(mode),
      f"1) Augstākais stabiņš ir pie vērtības ${mode}$ (${max(fq)}$ skolēni).\n2) Moda ir vērtība, nevis tās biežums.\nAtbilde: ${mode}$.", 'Лёгкий', fig4)
    T(T_STAT, 'datu amplitūda', f"{bs['text']} Nosakiet datu amplitūdu.", 'Amplitūda', str(max(data) - min(data)),
      f"1) Lielākā vērtība ${max(data)}$, mazākā ${min(data)}$.\n2) ${max(data)} - {min(data)} = {max(data) - min(data)}$.\nAtbilde: ${max(data) - min(data)}$.", 'Лёгкий', fig4)
    me = med(data)
    cum = []; c = 0
    for f in fq:
        c += f; cum.append(str(c))
    if N % 2:
        where = f"${N // 2 + 1}.$ vērtība"
        pick = f"${N // 2 + 1}.$ vērtība ir ${data[N // 2]}$"
    else:
        where = f"${N // 2}.$ un ${N // 2 + 1}.$ vērtības vidējais"
        pick = f"${N // 2}.$ vērtība ir ${data[N // 2 - 1]}$, ${N // 2 + 1}.$ — ${data[N // 2]}$; $\\dfrac{{{data[N // 2 - 1]} + {data[N // 2]}}}{{2}} = {lvnum(me)}$"
    T(T_STAT, 'mediāna pēc diagrammas', f"{bs['text']} Nosakiet datu mediānu.", 'Mediāna', lvnum(me),
      f"1) Datu skaits ${N}$, mediāna ir {where} sakārtotajā rindā.\n2) Uzkrātie biežumi: ${'; '.join(cum)}$.\n3) {pick}.\nAtbilde: ${lvnum(me)}$.", 'Средний', fig4)
    mean = F(S, N)
    T(T_STAT, 'vidējā vērtība pēc diagrammas', f"{bs['text']} {bs['mean_q']}", 'Vidējais', lvnum(mean),
      f"1) Reizinājumu summa: ${' + '.join(f'{x} \\cdot {f}' for x, f in zip(vals, fq))} = {S}$.\n2) $\\bar x = \\dfrac{{{S}}}{{{N}}} = {lvnum(mean)}$.\nAtbilde: ${lvnum(mean)}$.", 'Средний', fig4)
    al = sum(f for x, f in zip(vals, fq) if x >= bs['atleast']); pa = F(al * 100, N)
    T(T_STAT, 'daļa procentos ar nosacījumu', f"{bs['text']} Cik procentu skolēnu {bs['atleast_q']}?", 'Daļa', lvnum(pa) + r'\%',
      f"1) Vismaz ${bs['atleast']}$: ${' + '.join(str(f) for x, f in zip(vals, fq) if x >= bs['atleast'])} = {al}$ skolēni.\n2) $\\dfrac{{{al}}}{{{N}}} \\cdot 100\\% = {lvnum(pa)}\\%$.\nAtbilde: ${lvnum(pa)}\\%$.", 'Средний', fig4)
    nm = F(S + bs['newval'], N + 1)
    assert (nm * 100).denominator == 1
    T(T_STAT, 'jaunā vidējā vērtība', f"{bs['text']} {bs['newtext']} Aprēķiniet jauno vidējo vērtību.", 'Vidējais', lvnum(nm),
      f"1) Līdzšinējā summa ${S}$, jaunā ${S} + {bs['newval']} = {S + bs['newval']}$.\n2) Datu skaits ${N + 1}$.\n3) $\\dfrac{{{S + bs['newval']}}}{{{N + 1}}} = {lvnum(nm)}$.\nAtbilde: ${lvnum(nm)}$.", 'Сложный', fig4)

    # Kvartiles
    rw = d['raw']; dd = sorted(rw['data']); n5 = len(dd); h = n5 // 2
    lst = '; '.join(f'${x}$' for x in rw['data'])
    intro5 = f"{rw['text']} {lst}."
    me5, q1, q3 = med(dd), med(dd[:h]), med(dd[-h:])
    srt = '; '.join(map(str, dd))
    T(T_STAT, 'amplitūda no datu rindas', f"{intro5} Nosakiet datu amplitūdu.", 'Amplitūda', str(dd[-1] - dd[0]),
      f"1) Sakārtojam: ${srt}$.\n2) ${dd[-1]} - {dd[0]} = {dd[-1] - dd[0]}$.\nAtbilde: ${dd[-1] - dd[0]}$.", 'Лёгкий')
    T(T_STAT, 'mediāna no datu rindas', f"{intro5} Nosakiet datu mediānu.", 'Mediāna', lvnum(me5),
      f"1) Sakārtojam: ${srt}$.\n2) Datu skaits pāra, mediāna ir ${h}.$ un ${h + 1}.$ vērtības vidējais: $\\dfrac{{{dd[h - 1]} + {dd[h]}}}{{2}} = {lvnum(me5)}$.\nAtbilde: ${lvnum(me5)}$.", 'Лёгкий')
    T(T_STAT, 'pirmā kvartile', f"{intro5} Nosakiet pirmo kvartili $Q_1$.", 'Kvartile', lvnum(q1),
      f"1) Apakšējā puse: ${'; '.join(map(str, dd[:h]))}$.\n2) Tās mediāna: $\\dfrac{{{dd[h // 2 - 1]} + {dd[h // 2]}}}{{2}} = {lvnum(q1)}$.\nAtbilde: ${lvnum(q1)}$.", 'Средний')
    T(T_STAT, 'trešā kvartile', f"{intro5} Nosakiet trešo kvartili $Q_3$.", 'Kvartile', lvnum(q3),
      f"1) Augšējā puse: ${'; '.join(map(str, dd[-h:]))}$.\n2) Tās mediāna: $\\dfrac{{{dd[h + h // 2 - 1]} + {dd[h + h // 2]}}}{{2}} = {lvnum(q3)}$.\nAtbilde: ${lvnum(q3)}$.", 'Средний')
    T(T_STAT, 'starpkvartiļu izkliede', f"{intro5} Aprēķiniet starpkvartiļu izkliedi $Q_3 - Q_1$.", 'Izkliede', lvnum(q3 - q1),
      f"1) Apakšējās puses mediāna $Q_1 = {lvnum(q1)}$, augšējās — $Q_3 = {lvnum(q3)}$.\n2) ${lvnum(q3)} - {lvnum(q1)} = {lvnum(q3 - q1)}$.\nAtbilde: ${lvnum(q3 - q1)}$.", 'Средний')
    nd = sorted(dd[:-1] + [rw['new']]) if dd[-1] == rw['old'] else None
    assert nd is not None and med(nd) == me5
    T(T_STAT, 'amplitūda pēc kļūdas labojuma', f"{intro5} {rw['fix']} Kāda ir datu amplitūda pēc labojuma?", 'Amplitūda', str(nd[-1] - nd[0]),
      f"1) Lielākā vērtība tagad ${nd[-1]}$, mazākā ${nd[0]}$.\n2) ${nd[-1]} - {nd[0]} = {nd[-1] - nd[0]}$.\nAtbilde: ${nd[-1] - nd[0]}$.", 'Лёгкий')

    # Kastu diagrammas
    bx = d['boxes']; fig6 = f'{v}-boxes'
    (n1, b1), (n2, b2) = bx['g1'], bx['g2']
    dm = b1[2] - b2[2]
    q = F(bx['n2'], 4)
    assert q.denominator == 1
    T(T_STAT, 'skolēnu skaits virs Q3', f"{bx['text']} {bx['count_sent'].format(bx['n2'])} Aptuveni cik no viņiem {bx['thr']}?",
      'Skolēni', str(int(q)), f"1) Trešā kvartile atdala augšējo ceturtdaļu datu.\n2) $Q_3 = {b2[3]}$; rezultātu $Q_3$ vai lielāku ir aptuveni ceturtajai daļai: ${bx['n2']} : 4 = {int(q)}$.\nAtbilde: ${int(q)}$.", 'Средний', fig6)
    T(T_STAT, 'mediānu salīdzinājums', f"{bx['text']} Par cik {bx['gen1']} mediāna atšķiras no {bx['gen2']} mediānas? Atbildē uzrakstiet pozitīvu skaitli.",
      'Starpība', str(abs(dm)), f"1) Mediāna ir treknā līnija kastē: ${b1[2]}$ un ${b2[2]}$.\n2) $|{b1[2]} - {b2[2]}| = {abs(dm)}$.\nAtbilde: ${abs(dm)}$.", 'Лёгкий', fig6)
    for (nm_, bb), gen in (((n1, b1), bx['gen1']), ((n2, b2), bx['gen2'])):
        T(T_STAT, f"starpkvartiļu izkliede: {gen}", f"{bx['text']} Aprēķiniet {gen} starpkvartiļu izkliedi $Q_3 - Q_1$.", 'Izkliede', str(bb[3] - bb[1]),
          f"1) Kastes malas: $Q_1 = {bb[1]}$, $Q_3 = {bb[3]}$.\n2) ${bb[3]} - {bb[1]} = {bb[3] - bb[1]}$.\nAtbilde: ${bb[3] - bb[1]}$.", 'Средний', fig6)
    st = bx['stmts']; ti = bx['true_idx']
    T(T_STAT, 'patiesais apgalvojums par diagrammām', f"{bx['text']} Kurš no apgalvojumiem ir patiess? {' '.join(f'{i + 1}) {s}' for i, s in enumerate(st))} Atbildē uzrakstiet apgalvojuma numuru.",
      'Numurs', str(ti), '\n'.join(f"{i + 1}) {e}" for i, e in enumerate(bx['expl'])) + f"\nAtbilde: ${ti}$.", 'Сложный', fig6)

    return {fig4: svg_hist(vals, fq), fig6: svg_boxes(*bx['axis'], [(n1, b1), (n2, b2)])}


def build(v, d):
    out = []
    for key, prefix, title, topic, fn in (('kopas', 'KV', 'Kopas un varbūtība', T_VARB, build_kopas),
                                          ('stat', 'KS', 'Statistikas elementi', T_STAT, build_stat)):
        tasks = []

        def T(topic_, ttl, cond, label, value, sol, diff='Средний', fig=None):
            assert topic_ == topic
            tasks.append(dict(topic=topic_, title=f'{prefix} {v}: {ttl}', c=cond, a=r'$\text{%s} = %s$' % (label, value), s=sol, d=diff, fig=fig))
        figs = fn(v, d, T) or {}
        slug = ('kd-kopas-un-varbutiba-' if key == 'kopas' else 'kd-statistikas-elementi-') + v.lower()
        out.append((dict(slug=slug, title=f'Kontroldarbs: {title} ({v} variants)', minutes=45, topics=[topic], tasks=tasks), figs))
    return out


def main():
    out = dict(grade=10, papers=[], figures={})
    for key in ('kopas', 'stat'):
        for v, d in V.items():
            for p, f in build(v, d):
                if p['topics'][0] == (T_VARB if key == 'kopas' else T_STAT):
                    out['papers'].append(p)
                    out['figures'].update(f)
    with open(os.path.join(HERE, 'paper.json'), 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    print({p['slug']: len(p['tasks']) for p in out['papers']})


if __name__ == '__main__':
    main()
