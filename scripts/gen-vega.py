"""
Generates supabase/vega-dataset.sql — the company the demo script describes.

Targets, straight from the script:
  200 people · Austin 170 / Tokyo 30 · 90 days of history
  budget spent 61%  ·  claim rate 86%  ·  171 of 200 have sent at least one
  coverage: Austin 88%, Tokyo 6 of 30
  4 cross-office kudos, 3 of them from one person
  Aya Yoshida — QA, Tokyo, 14 months, gave 11, received 0
  One manager, 14 reports, 4 in Tokyo, every kudos he sent stayed in Austin
"""
import random, datetime, unicodedata

random.seed(20260830)
TODAY = datetime.date(2026, 8, 30)
WINDOW = 90
START = TODAY - datetime.timedelta(days=WINDOW)
ALLOWANCE = 8000                       # cents, per person per year

KEEP = ['wei', 'priya', 'sofia', 'dana', 'leah', 'tomas', 'ana', 'aisha']
TEAMS = [('engineering', 'Engineering'), ('product', 'Product'), ('design', 'Design'),
         ('sales', 'Sales'), ('marketing', 'Marketing'), ('support', 'Support'),
         ('people-ops', 'People Ops'), ('finance', 'Finance')]
CARDS = ['amazon-uk', 'costa-uk', 'apple-uk', 'adidas-uk', 'argos',
         'asda', 'asos-uk', 'boots-uk', 'cineworld', 'deliveroo-uk']
COLORS = ['#7C3AED', '#0D9488', '#059669', '#DB6D0B', '#2563EB',
          '#0891B2', '#9333EA', '#B45309', '#0F766E', '#4F46E5']

US_FIRST = """James Mary Robert Patricia John Jennifer Michael Linda David Elizabeth William Barbara
Richard Susan Joseph Jessica Thomas Sarah Chris Karen Daniel Nancy Matthew Lisa Anthony Betty Mark
Sandra Donald Ashley Steven Kimberly Andrew Emily Joshua Donna Kenneth Michelle Kevin Carol Brian
Amanda George Melissa Timothy Deborah Ronald Stephanie Jason Rebecca Ryan Laura Jacob Sharon Gary
Cynthia Nicholas Kathleen Eric Amy Jonathan Angela Stephen Shirley Larry Anna Justin Brenda Scott
Pamela Brandon Emma Benjamin Nicole Samuel Helen Gregory Samantha Alexander Katherine Patrick Christine
Frank Debra Raymond Rachel Jack Carolyn Dennis Janet Jerry Maria Tyler Heather Aaron Diane Jose Julie
Adam Joyce Nathan Victoria Henry Kelly Zachary Christina Douglas Joan Peter Evelyn Kyle Judith Noah
Andrea Ethan Hannah Jeremy Megan Walter Cheryl Keith Jacqueline Austin Martha Roger Gloria Terry Teresa
Sean Ann Gerald Sara Carl Madison Dylan Frances Harold Kathryn Jordan Janice Jesse Jean Bryan Abigail
Lawrence Alice Arthur Julia Gabriel Judy Bruce Sophia Logan Grace Billy Denise Joe Amber Alan Olivia
Juan Beverly Elijah Danielle Willie Marilyn Albert Charlotte Wayne Natalie Randy Diana Mason Brittany
Vincent Theresa Liam Isabella Roy Kelly Ralph Rose Eugene Lori""".split()
US_LAST = """Smith Johnson Williams Brown Jones Garcia Miller Davis Rodriguez Martinez Hernandez Lopez
Gonzalez Wilson Anderson Thomas Taylor Moore Jackson Martin Lee Perez Thompson White Harris Sanchez
Clark Ramirez Lewis Robinson Walker Young Allen King Wright Scott Torres Nguyen Hill Flores Green
Adams Nelson Baker Hall Rivera Campbell Mitchell Carter Roberts Gomez Phillips Evans Turner Diaz
Parker Cruz Edwards Collins Reyes Stewart Morris Morales Murphy Cook Rogers Gutierrez Ortiz Morgan
Cooper Peterson Bailey Reed Kelly Howard Ramos Kim Cox Ward Richardson Watson Brooks Chavez Wood
James Bennett Gray Mendoza Ruiz Hughes Price Alvarez Castillo Sanders Patel Myers Long Ross Foster
Jimenez Powell Jenkins Perry Russell Sullivan Bell Coleman Butler Henderson Barnes Gonzales Fisher
Vasquez Simmons Romero Jordan Patterson Alexander Hamilton Graham Reynolds Griffin Wallace Moreno
West Cole Hayes Bryant Herrera Gibson Ellis Tran Medina Aguilar Stevens Murray Ford Castro Marshall
Owens Harrison Fernandez McDonald Woods Washington Kennedy Wells Vargas Henry Chen Freeman Webb
Tucker Guzman Burns Crawford Olson Simpson Porter Hunter Gordon Mendez Silva Shaw Snyder Mason
Dixon Munoz Hunt Hicks Holmes Palmer Wagner Black Robertson Boyd Rose Stone Salazar Fox Warren
Mills Meyer Rice Schmidt Garza Daniels Ferguson Nichols Stephens Soto Weaver Ryan Gardner Payne
Grant Dunn Kelley Spencer Hawkins Arnold Pierce Vazquez Hansen Peters Santos Hart Bradley Knight
Elliott Cunningham Duncan Armstrong Hudson Carroll Lane Riley Andrews Ruiz Harper Fowler Burke""".split()
JP_FIRST = """Aya Haruto Yuki Sakura Ren Hina Sota Mei Riku Yui Kaito Rin Daiki Nanami Yuto Aoi Takumi
Miu Shota Koharu Hiroto Akari Yusuke Saki Kenta Honoka Naoki Yuna Ryo Ichika Kenji Misaki Tatsuya
Kanna Shun Emi Taiga Ayumi Masato Nao Kazuki Sora Hayato Mio Jun Kaori Satoshi Yuka Toru Chika""".split()
JP_LAST = """Yoshida Sato Suzuki Takahashi Tanaka Watanabe Ito Nakamura Kobayashi Yamamoto Kato
Matsumoto Inoue Kimura Hayashi Shimizu Yamazaki Mori Abe Ikeda Hashimoto Ishikawa Yamashita Ogawa
Maeda Okada Hasegawa Fujita Kondo Sakamoto Endo Aoki Nishimura Fukuda Ota Miura Fujii Okamoto""".split()

def slug(name):
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()
    return s.lower().replace(' ', '-').replace("'", '')

def initials(name):
    p = name.split()
    return (p[0][0] + p[-1][0]).upper()

people, used_ids, used_names = [], set(KEEP), set()

def add(name, title, team, office, manager=None, start=None, pid=None):
    pid = pid or slug(name)
    base, n = pid, 2
    while pid in used_ids:
        pid, n = f'{base}{n}', n + 1
    used_ids.add(pid)
    start = start or TODAY - datetime.timedelta(days=random.randint(120, 2400))
    people.append(dict(id=pid, name=name, title=title, team=team, office=office,
                       manager=manager, start=start,
                       color=random.choice(COLORS), initials=initials(name)))
    return pid

def us_name():
    while True:
        n = f'{random.choice(US_FIRST)} {random.choice(US_LAST)}'
        if n not in used_names:
            used_names.add(n); return n

def jp_name():
    while True:
        n = f'{random.choice(JP_FIRST)} {random.choice(JP_LAST)}'
        if n not in used_names:
            used_names.add(n); return n

# --- the two people the script names ------------------------------------------
AYA = add('Aya Yoshida', 'QA Engineer', 'engineering', 'tokyo',
          start=TODAY - datetime.timedelta(days=426))          # 14 months
MGR = add('Daniel Reyes', 'Engineering Manager', 'engineering', 'austin',
          start=TODAY - datetime.timedelta(days=1500))

# --- the eight who already exist, so Send / Slack / SodaGift keep working ------
EXISTING = [('wei', 'Wei Chen'), ('priya', 'Priya Raman'), ('sofia', 'Sofia Marchetti'),
            ('dana', 'Dana Whitfield'), ('leah', 'Leah Osborne'), ('tomas', 'Tomás Iglesias'),
            ('ana', 'Ana Duarte'), ('aisha', 'Aisha Nkemdi')]
for pid, name in EXISTING:
    used_names.add(name)

# --- team leads ---------------------------------------------------------------
leads = {}
for tid, tname in TEAMS:
    if tid == 'engineering':
        leads[tid] = MGR
    else:
        leads[tid] = add(us_name(), f'{tname} Lead', tid, 'austin')

# --- Tokyo: 30 people, night coverage, so engineering + support heavy ----------
TOKYO_TEAMS = ['engineering'] * 14 + ['support'] * 9 + ['product'] * 3 + ['design'] * 2 + ['sales'] * 2
TOKYO_TITLES = {'engineering': ['Software Engineer', 'SRE', 'QA Engineer', 'Senior Engineer'],
                'support': ['Support Engineer', 'Support Specialist', 'Escalations Lead'],
                'product': ['Product Manager', 'Technical PM'], 'design': ['Product Designer'],
                'sales': ['Account Executive', 'Solutions Engineer']}
tokyo_lead = add(jp_name(), 'Tokyo Site Lead', 'engineering', 'tokyo')
tokyo = [AYA, tokyo_lead]
for t in TOKYO_TEAMS[:28]:
    tokyo.append(add(jp_name(), random.choice(TOKYO_TITLES[t]), t, 'tokyo', manager=tokyo_lead))

# --- Austin: fill to 200 ------------------------------------------------------
AUSTIN_TITLES = {'engineering': ['Software Engineer', 'Senior Engineer', 'Staff Engineer', 'SRE'],
                 'product': ['Product Manager', 'Senior PM'], 'design': ['Product Designer', 'Design Lead'],
                 'sales': ['Account Executive', 'Sales Development Rep', 'Enterprise AE'],
                 'marketing': ['Marketing Manager', 'Content Lead', 'Growth Marketer'],
                 'support': ['Support Engineer', 'Support Specialist'],
                 'people-ops': ['People Ops Partner', 'Recruiter', 'People Ops Lead'],
                 'finance': ['Financial Analyst', 'Controller']}
WEIGHTS = ['engineering'] * 34 + ['sales'] * 20 + ['product'] * 10 + ['support'] * 10 + \
          ['marketing'] * 9 + ['design'] * 8 + ['people-ops'] * 5 + ['finance'] * 4

for pid, name in EXISTING:
    t = 'engineering' if pid in ('wei', 'priya', 'dana', 'tomas') else \
        'design' if pid == 'sofia' else 'people-ops' if pid == 'leah' else \
        'marketing' if pid == 'ana' else 'support'
    add(name, 'Senior Engineer' if t == 'engineering' else f'{dict(TEAMS)[t]} Specialist',
        t, 'austin', manager=leads[t], pid=pid)

while len(people) < 200:
    t = random.choice(WEIGHTS)
    add(us_name(), random.choice(AUSTIN_TITLES[t]), t, 'austin', manager=leads[t])

by_id = {p['id']: p for p in people}
austin = [p['id'] for p in people if p['office'] == 'austin']
tokyo_ids = [p['id'] for p in people if p['office'] == 'tokyo']

# Daniel Reyes: 14 reports, 4 of them in Tokyo.
eng_austin = [p['id'] for p in people
              if p['office'] == 'austin' and p['team'] == 'engineering' and p['id'] != MGR][:10]
eng_tokyo = [i for i in tokyo_ids if by_id[i]['team'] == 'engineering' and i != AYA][:4]
for i in eng_austin + eng_tokyo:
    by_id[i]['manager'] = MGR
for i in tokyo_ids:
    if by_id[i]['manager'] is None and i != tokyo_lead:
        by_id[i]['manager'] = tokyo_lead
by_id[AYA]['manager'] = tokyo_lead
# Team leads keep managerId null — useKudosGraph's managerOfTeam() finds the
# lead of a team by exactly that, and asserts non-null. A lead pointing at
# itself leaves seven teams with no lead and crashes the insights page.
lead_ids = set(leads.values())
for p in people:
    if p['manager'] is None and p['id'] not in lead_ids and p['id'] != MGR:
        p['manager'] = leads.get(p['team'])
by_id[MGR]['manager'] = None

print(f'people: {len(people)}  austin: {len(austin)}  tokyo: {len(tokyo_ids)}')
import json
json.dump({'people': people, 'aya': AYA, 'mgr': MGR, 'tokyo_lead': tokyo_lead,
           'austin': austin, 'tokyo': tokyo_ids,
           'reports': eng_austin + eng_tokyo},
          open('/tmp/vega_people.json', 'w'), default=str)
