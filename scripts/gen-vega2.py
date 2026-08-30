import json, random, datetime
random.seed(7)
d = json.load(open('/tmp/vega_people.json'))
people = d['people']; by_id = {p['id']: p for p in people}
AYA, MGR, TOKYO_LEAD = d['aya'], d['mgr'], d['tokyo_lead']
austin, tokyo = d['austin'], d['tokyo']

TODAY = datetime.date(2026, 8, 30)
START = TODAY - datetime.timedelta(days=90)
CARDS = ['amazon-uk','costa-uk','apple-uk','adidas-uk','argos','asda','asos-uk','boots-uk','cineworld','deliveroo-uk']
AMOUNTS = [500,1000,1000,1500,1500,1500,2000,2000,2500,3000]

# Coverage targets: Austin 150/170 = 88%, Tokyo 6/30. Aya receives nothing.
austin_cov = random.sample([a for a in austin], 150)
tokyo_pool = [t for t in tokyo if t != AYA]
tokyo_cov  = random.sample(tokyo_pool, 6)

# 171 of 200 send at least one.
tokyo_senders  = random.sample([t for t in tokyo if t != AYA], 25) + [AYA]
austin_senders = random.sample(austin, 145)

def day():
    return START + datetime.timedelta(days=random.randint(0, 89))

K = []
def push(f, t, dt=None, amt=None):
    K.append(dict(f=f, t=t, d=dt or day(), a=amt or random.choice(AMOUNTS),
                  c=random.choice(CARDS)))

# --- the two stories the script tells -----------------------------------------
# Aya thanks Austin, because she picks up their work at the end of their day and
# sees everything they did. Eleven colleagues in ninety days. Receives nothing.
for t in random.sample(austin_cov, 11):
    push(AYA, t)

# "It came back four times." Four thank-yous reached Tokyo in ninety days,
# three of them from the one Austin engineer whose shift overlaps.
KEEP = {'wei','priya','sofia','dana','leah','tomas','ana','aisha'}
bridge = next(a for a in austin
              if by_id[a]['team'] == 'engineering' and a != MGR and a not in KEEP)
for t in random.sample(tokyo_cov, 3):
    push(bridge, t)
push(random.choice([a for a in austin_senders if a not in (bridge, MGR)]),
     random.choice(tokyo_cov))

# Guarantee coverage lands exactly: every covered person gets at least one.
for r in austin_cov:
    s = random.choice([a for a in austin_senders if a != r])
    push(s, r)
for r in tokyo_cov:
    s = random.choice([t for t in tokyo_senders if t not in (r, AYA)])
    push(s, r)

# Daniel Reyes recognises only people he can see — all Austin, none of his Tokyo four.
for t in random.sample([a for a in austin_cov if a != MGR], 7):
    push(MGR, t)

# --- everyone else ------------------------------------------------------------
for s in tokyo_senders:
    if s == AYA: continue
    for _ in range(random.randint(1, 3)):
        r = random.choice([x for x in tokyo_cov if x != s])
        push(s, r)
# A few Tokyo folk also thank Austin colleagues — outbound, so it does not change
# how many people in Tokyo were reached.
for s in random.sample([t for t in tokyo_senders if t != AYA], 8):
    push(s, random.choice(austin_cov))

for s in austin_senders:
    if s == MGR: continue
    for _ in range(random.choices([1,2,3,4,5,6,7], weights=[8,14,20,20,16,12,10])[0]):
        r = random.choice([x for x in austin_cov if x != s])
        push(s, r)

# --- scale amounts to land on 61% of a 200 x $80 pot ---------------------------
TARGET = round(200 * 8000 * 0.61)
DENOMS = [500, 1000, 1500, 2000, 2500, 3000]
scale = TARGET / sum(k['a'] for k in K)
for k in K:
    k['a'] = min(DENOMS, key=lambda d: abs(d - k['a'] * scale))
for _ in range(6000):                      # snap-to-denomination drift
    total = sum(k['a'] for k in K)
    if abs(total - TARGET) <= 500: break
    k = random.choice(K)
    step = 500 if total < TARGET else -500
    if 500 <= k['a'] + step <= 3000:
        k['a'] += step

random.shuffle(K)
K.sort(key=lambda k: k['d'])

# 86% claimed.
for i, k in enumerate(K):
    k['claimed'] = i < round(len(K) * 0.86)
random.shuffle(K); K.sort(key=lambda k: k['d'])

senders = {k['f'] for k in K}; recips = {k['t'] for k in K}
ac = len([a for a in austin if a in recips]); tc = len([t for t in tokyo if t in recips])
into_tokyo = [k for k in K if by_id[k['f']]['office'] == 'austin' and by_id[k['t']]['office'] == 'tokyo']
from collections import Counter
top = Counter(k['f'] for k in into_tokyo).most_common(1)
print(f"kudos           {len(K)}")
print(f"budget spent    {sum(k['a'] for k in K)/ (200*8000) *100:.1f}%   (target 61)")
print(f"claim rate      {sum(1 for k in K if k['claimed'])/len(K)*100:.1f}%   (target 86)")
print(f"senders >=1     {len(senders)} of 200   (target 171)")
print(f"coverage austin {ac}/170 = {ac/170*100:.0f}%   (target 88)")
print(f"coverage tokyo  {tc}/30 = {tc/30*100:.0f}%   (script says 19)")
print(f"austin->tokyo   {len(into_tokyo)}   (target 4; {top[0][1]} from one person, target 3)")
print(f"Aya gave        {sum(1 for k in K if k['f']==AYA)}  received {sum(1 for k in K if k['t']==AYA)}")
print(f"Reyes to Tokyo  {sum(1 for k in K if k['f']==MGR and by_id[k['t']]['office']=='tokyo')}  (target 0)")
json.dump({'K': K}, open('/tmp/vega_kudos.json','w'), default=str)
