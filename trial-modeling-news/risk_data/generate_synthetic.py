#!/usr/bin/env python3
"""Synthetic TRAINING data for the recruitment-risk model.

Four labels:
  legit        ordinary jobs, including look-alikes: brand social media, official political
               communications, content moderators, fact-checkers, licensed overseas (OFW) jobs,
               BPO chat support, legitimate jobs in Thailand/Cambodia/Laos
  scam         job scams: task scams, fees, ID / bank / OTP harvesting, money mules
  trafficking  deceptive overseas recruitment into scam compounds / forced work
  influence    covert influence work: troll farms, fake personas, scripted political posting,
               harassment of critics, undisclosed paid political content

Why synthetic: no public labeled dataset of troll-farm or scam-compound job ads exists (searched
November 2026; see README.md). These texts are written from patterns documented by researchers,
UN agencies, governments and journalists, listed in SOURCES. They are TRAINING DATA ONLY. The
model is evaluated on challenge_set.csv, which was written separately, is never trained on, and
is never used to choose the model.

Each row has a `family` (the recipe that produced it). Cross-validation groups rows by family, so
each fold is scored on recipes it never saw. All company and person names are invented.

Run:  .venv/bin/python risk_data/generate_synthetic.py   (writes risk_data/synthetic_train.csv)
"""
import csv
import random
import re
from pathlib import Path

try:  # run as a script from trial-modeling-news/ or import as a package
    from global_south_packs import PACKS, EN_GLOBAL
except ImportError:  # pragma: no cover
    from risk_data.global_south_packs import PACKS, EN_GLOBAL

SEED = 20261107
OUT = Path(__file__).resolve().parent / 'synthetic_train.csv'

SOURCES = [
    'Ong & Cabanes, Architects of Networked Disinformation (Newton Tech4Dev, 2018)',
    'Oxford Internet Institute, Industrialized Disinformation: 2020 Global Inventory',
    'OHCHR, Online scam operations and trafficking into forced criminality in Southeast Asia (2023)',
    'UNODC reports on scam centres in Southeast Asia (2023-2025)',
    'Philippine DMW / Bureau of Immigration / IACAT advisories on fake overseas job offers',
    'Mozilla Foundation, Inside the shadowy world of disinformation for hire in Kenya (2021)',
    'CNN and Facebook (March 2020) on the Russia-linked troll operation run from Ghana and Nigeria',
    'Meta adversarial threat reports and coordinated inauthentic behaviour takedowns',
]

# ─────────────────────────────────────────── shared slots ───────────────────────────────────────────
SLOTS = {
    'name': ['Jen', 'Mark', 'Joy', 'Ron', 'Liza', 'Jessa', 'Carlo', 'Mika', 'Paolo', 'Rhea', 'Arnel', 'Kim',
             'Grace', 'Bea', 'Ivy', 'Jomar', 'Anna', 'David', 'Kevin', 'Linda', 'James', 'Amina', 'Kwame',
             'Wanjiru', 'Chidi', 'Putri', 'Minh', 'Ravi', 'Sara', 'Leo', 'Tess', 'Nico'],
    'honorific': ['Ms.', 'Mr.', 'Sir', "Ma'am", 'Ate', 'Kuya', ''],
    'city': ['Makati', 'BGC, Taguig', 'Ortigas, Pasig', 'Quezon City', 'Mandaluyong', 'Cebu IT Park',
             'Davao City', 'Clark, Pampanga', 'Iloilo City', 'Bacolod', 'Alabang', 'Manila', 'Baguio',
             'Cagayan de Oro', 'Nairobi', 'Lagos', 'Accra', 'Jakarta', 'Dhaka', 'Colombo', 'Kampala',
             'Mumbai', 'Kuala Lumpur'],
    'ph_city': ['Makati', 'BGC, Taguig', 'Ortigas, Pasig', 'Quezon City', 'Mandaluyong', 'Cebu IT Park',
                'Davao City', 'Clark, Pampanga', 'Iloilo City', 'Bacolod', 'Alabang', 'Manila'],
    'n': ['5', '8', '10', '12', '15', '20', '25', '30', 'at least 10', '10 to 20'],
    'office': ['senatorial', 'mayoral', 'gubernatorial', 'congressional', 'presidential', 'party-list',
               'local'],
    'noun': ['senator', 'mayor', 'governor', 'congressman', 'party', 'administration', 'candidate'],
    'office_cap': ['Senator', 'Mayor', 'Governor', 'Representative', 'Vice Mayor'],
    'issue': ['West Philippine Sea', 'oil price', 'rice import', 'charter change', 'mining', 'reclamation',
              'vaccine', 'transport modernization', 'tax reform', 'foreign investment', 'flood control'],
    'per_comment': ['5', '8', '10', '15', '20'],
    'daily': ['300', '500', '700', '800', '1,000', '1,200'],
    'monthly': ['12,000', '15,000', '18,000', '20,000', '25,000', '30,000'],
    'quota': ['50', '80', '100', '150', '200', '300'],
    'quota2': ['20', '30', '50', '100'],
    'cur': ['₱', 'PHP ', 'KES ', 'NGN ', 'GHS ', 'Rs ', '$'],
    'phone': ['09XX XXX XXXX', '+63 9XX XXX XXXX', '+254 7XX XXX XXX', '+234 8XX XXX XXXX', '+66 8X XXX XXXX'],
    'usd': ['$800', '$1,000', '$1,200', '$1,500', '$1,800', '$2,000', '$2,500'],
    'php_high': ['50,000', '60,000', '70,000', '80,000', '90,000', '100,000', '120,000'],
    'penalty': ['3,000', '5,000', '8,000', '10,000'],
    'small': ['200', '300', '500', '1,000'],
    'small_back': ['260', '390', '650', '1,300'],
    'daily_scam': ['500', '800', '1,000', '1,500', '2,000', '3,000', '5,000'],
    'fee': ['350', '499', '500', '850', '1,000', '1,500', '2,500', '3,000'],
    'lic': ['045-LB-031524-R', '118-LB-062223-R', '231-LB-110124-R', '077-LB-050125-R'],
    'country': ['Saudi Arabia', 'Qatar', 'UAE', 'Kuwait', 'Japan', 'Taiwan', 'Canada', 'New Zealand',
                'Germany', 'Singapore', 'Hong Kong', 'United Kingdom'],
    'ofw_role': ['Staff Nurse', 'Caregiver', 'Electrician', 'Hotel Front Desk Agent', 'Welder',
                 'Domestic Worker', 'Factory Worker', 'Restaurant Server', 'Civil Engineer', 'Teacher',
                 'Heavy Equipment Operator', 'Housekeeping Attendant'],
    'domain': ['brightpath.ph', 'novareach.com', 'summitcare.com.ph', 'harborpoint.org', 'lumencreative.ph'],
    'salary_ph': ['₱18,000–₱22,000', '₱20,000–₱25,000', '₱22,000–₱28,000', '₱25,000–₱32,000',
                  '₱30,000–₱40,000', '₱35,000–₱45,000'],
}
COMPANY_A = ['Bright', 'Blue', 'Prime', 'Golden', 'Silver', 'Nova', 'Apex', 'Summit', 'Harbor', 'Lumen',
             'Vertex', 'Crest', 'Orion', 'Pacific', 'Unity', 'Zenith', 'Kairos', 'Northstar', 'Evergreen',
             'Sunrise', 'Bayview', 'Island', 'Meridian', 'Sterling']
COMPANY_B = ['Digital', 'Media', 'Solutions', 'Ventures', 'Marketing', 'Tech', 'Global', 'Consulting',
             'Communications', 'Creative', 'Outsourcing', 'Analytics', 'Networks', 'Interactive', 'Resources']
COMPANY_C = ['Inc.', 'Corp.', 'Co.', 'Ltd.', 'Agency', 'Group', 'PH', 'Asia', '']
EMOJI = ['✅', '📌', '💰', '🔥', '👉', '📣', '⭐', '💯', '🙏', '📲', '']


class Gen:
    """Random helpers bound to one RNG so the whole file is reproducible."""

    def __init__(self, seed):
        self.r = random.Random(seed)

    def pick(self, items):
        return self.r.choice(items)

    def some(self, items, low, high):
        k = self.r.randint(low, min(high, len(items)))
        return self.r.sample(items, k)

    def company(self):
        return ' '.join(p for p in [self.pick(COMPANY_A), self.pick(COMPANY_B), self.pick(COMPANY_C)] if p)

    def fill(self, text):
        def repl(m):
            key = m.group(1)
            if key == 'company':
                return self.company()
            return self.pick(SLOTS[key])
        return re.sub(r'\{(\w+)\}', repl, text)

    def bullets(self, items, style=None):
        style = style or self.pick(['- ', '• ', '* ', '✅ ', '👉 ', ''])
        return '\n'.join(style + i[0].upper() + i[1:] for i in items)

    def sentence_join(self, items):
        out = []
        for i in items:
            i = i.strip()
            if not i:
                continue
            i = i[0].upper() + i[1:]
            out.append(i if i[-1] in '.!?' else i + '.')
        return ' '.join(out)

    def maybe(self, p):
        return self.r.random() < p


# ─────────────────────────────────────────── influence ───────────────────────────────────────────
INF_TITLES = ['Social Media Specialist', 'Online Community Moderator', 'Digital Marketing Assistant',
              'Engagement Specialist', 'Social Media Coordinator', 'Online Brand Advocate',
              'Digital Campaign Associate', 'Comment Moderator', 'Online Reputation Associate', 'Content Creator',
              'Page Admin', 'Netizen Engagement Officer', 'Digital Volunteer', 'Political Copywriter',
              'Online Researcher', 'Social Media Virtual Assistant', 'Meme Page Creator',
              'Community Engagement Associate', 'Digital Advocacy Associate', 'Online Influence Associate']
INF_PERSONAS = [
    'create and manage {n} dummy accounts',
    'handle {n} alter accounts with different names and photos',
    'maintain fake profiles that look like ordinary people',
    'operate several personal Facebook profiles (not pages) under different names',
    'use the aged accounts we provide and never your own name',
    'run poser accounts on Facebook, X and TikTok',
    'manage troll accounts assigned by your team leader',
    'build personas, for example a nurse from Cebu or a student from QC, and post as them',
    'make each account look real with a profile photo, friends and old posts',
    'rotate between {n} accounts during your shift so none gets flagged',
    'log in to the accounts and passwords we send you every morning',
    'grow anonymous accounts to at least 1,000 friends each',
    'comment from different accounts so it looks like many people agree',
    'create new accounts using the SIM cards we give you',
    'engage with netizens using accounts provided by the company',
    'keep your personal account separate and only use the work profiles we assign',
]
INF_POLITICAL = [
    'post comments supporting our client, a {office} candidate',
    'promote the achievements of the administration',
    'defend the {noun} from criticism online',
    'share content about the upcoming elections on assigned pages',
    'counter negative posts about the {noun}',
    'push positive narratives about the party',
    'post about government programs as a neutral citizen',
    'join political discussions in community groups and steer them',
    "make the candidate's hashtags trend before the debate",
    "boost our client's posts during the campaign period",
    'shift public opinion on the {issue} issue',
    'promote the official narrative on the {issue} issue',
    'make it look like voters in the province support our candidate',
]
INF_SCRIPTS = [
    'we will give you daily talking points',
    'copy-paste the comments from our content sheet and change a few words',
    'follow the script from your team leader',
    'a list of hashtags is sent every morning',
    'use the meme templates we send to the group chat',
    'rewrite the articles we send with our angle',
    'content is prepared by our writers and you only post it',
    'you will receive a tweet sheet with the posts for the day',
    'use the exact keywords and hashtags in the daily brief',
]
INF_ATTACK = [
    'reply to critics and journalists who post against our client',
    'mass report the accounts on our list',
    'flood the comment sections of news posts',
    'discredit opposition supporters',
    'bash the other camp whenever they post',
    'make negative posts about the rival candidate',
    'drown out negative comments with positive ones',
    "call out the fact-checkers' posts as fake news",
    'tag and pressure the reporters on our target list',
]
INF_SECRECY = [
    'the client is confidential',
    'do not tell anyone who you are working for',
    'you will sign an NDA about the client and the campaign',
    'never say that you are paid to post',
    'do not post anything about this job',
    'never disclose the campaign or the client',
    'always use a VPN',
    'keep this group chat private and delete messages after reading',
    'do not use your real name anywhere',
    'posts must never be labeled as sponsored or paid',
]
INF_PAY = [
    '₱{per_comment} per comment', '₱{daily} per day for 3–4 hours', '₱{monthly}/month plus incentives for viral posts',
    'paid per 1,000 engagements', 'daily quota of {quota} comments and {quota2} shares',
    'KPI: {quota} posts per account per day', 'bonus if the hashtag trends', 'weekly payout via GCash',
    '{cur}{daily} per shift, paid weekly', 'minimum {quota} comments per shift',
]
INF_FOREIGN = [
    'post as American citizens about US politics',
    'your accounts will appear to be locals in another country',
    'write in English for audiences in the US and UK using US-based profiles',
    'set your VPN to the target country before logging in',
    'join Facebook groups in the target country and share our content as a member',
]
INF_NEWSPAGES = [
    'manage news-style pages that look independent',
    'create a page that looks like a local news outlet',
    'write breaking news posts for our network of pages',
    'run fan pages and meme pages for our client without showing the connection',
    'publish articles on our blogs that look like independent news',
    "repost our pages' content in community groups as if you found it yourself",
]
INF_APPLY = ['Message us on Telegram', 'Join our Viber group for the orientation', 'PM for details',
             'Send your FB link and number', 'Apply via the Google Form in the comments', 'DM me',
             'Text {phone}', 'WhatsApp {phone}', 'Comment "interested" and we will message you']
INF_PERKS = ['No experience needed', 'Work from home', 'Students welcome', 'Flexible hours',
             'Phone or laptop only', 'Training provided', 'Start ASAP', 'Daily pay', 'Part-time or full-time']
INF_FIL_INTRO = ['Hiring! Work from home', 'Need keyboard warriors para sa campaign',
                 'Naghahanap kami ng social media worker', 'Raket alert', 'Extra income habang nasa bahay',
                 'Kailangan namin ng page admin', 'Hiring ng online volunteers para sa kandidato']
INF_FIL_BODY = [
    'gumawa at magpatakbo ng {n} dummy account', 'gagamit ka ng mga alter account',
    "iba-ibang pangalan at picture ang gagamitin sa bawat account", 'bawal gamitin ang totoong pangalan mo',
    'bibigyan ka namin ng mga account at password', 'dapat mukhang totoong tao ang mga account',
    'mag-comment para suportahan ang kandidato namin', 'ipagtanggol ang {noun} sa mga basher',
    'sagutin ang mga kritiko sa comments', "i-share ang mga post tungkol sa eleksyon",
    'paangatin ang hashtag bago ang debate', 'mag-post ng positibo tungkol sa administrasyon',
    'may script na ibibigay araw-araw', 'kopyahin lang ang mga comment sa content sheet',
    'ibibigay ng TL ang mga hashtag tuwing umaga', 'kami na ang gagawa ng content, ikaw ang magpo-post',
]
INF_FIL_SECRET = ['bawal ipagsabi kahit kanino', 'confidential ang client', 'huwag sabihin na bayad ka',
                  'burahin ang mga chat pagkabasa', 'bawal i-post na nagtatrabaho ka dito']
INF_FIL_PAY = ['₱{per_comment} kada comment', '₱{daily} kada araw, 3-4 oras lang', 'may bonus pag nag-trending',
               'sahod tuwing Biyernes via GCash', 'target {quota} comments kada shift']
INF_FIL_APPLY = ['PM me', 'Message sa Telegram', 'Sali sa Viber group', 'Comment "interested"',
                 'I-send ang FB link mo']


def influence_ad(g):
    resp = g.some(INF_PERSONAS, 1, 2) + g.some(INF_POLITICAL, 1, 2) + g.some(INF_SCRIPTS, 0, 1) \
        + g.some(INF_ATTACK, 0, 1) + g.some(INF_SECRECY, 0, 2)
    g.r.shuffle(resp)
    title = g.pick(INF_TITLES)
    parts = [f'{title} | {g.company()}', f'Location: Work from home ({g.pick(SLOTS["city"])})',
             g.pick(['Responsibilities:', 'What you will do:', 'Job description:', 'Tasks:']),
             g.bullets(resp), f'Compensation: {g.pick(INF_PAY)}', g.sentence_join(g.some(INF_PERKS, 1, 3)),
             g.pick(INF_APPLY) + '.']
    return '\n'.join(parts)


def influence_post(g):
    lines = [g.pick(['HIRING!', 'WE ARE HIRING', 'Raket alert!', 'Online job opportunity', 'URGENT HIRING'])
             + ' ' + g.pick(EMOJI), g.pick(INF_TITLES) + ' (work from home)',
             g.bullets(g.some(INF_PERSONAS, 1, 1) + g.some(INF_POLITICAL + INF_ATTACK, 1, 2)
                       + g.some(INF_SCRIPTS + INF_SECRECY, 1, 2) + [g.pick(INF_PAY)]),
             g.sentence_join(g.some(INF_PERKS, 1, 3)), g.pick(INF_APPLY) + ' ' + g.pick(EMOJI)]
    return '\n'.join(lines)


def influence_chat(g):
    intro = g.pick([f'Hi! I am {g.pick(SLOTS["honorific"])} {g.pick(SLOTS["name"])} from {g.company()}.',
                    'Good day! Thanks for your interest in our online job.',
                    'Hello po, about the work-from-home social media job:',
                    'Hi, this is the recruiter you talked to yesterday.'])
    body = g.some(INF_PERSONAS, 1, 2) + g.some(INF_POLITICAL, 1, 1) + g.some(INF_SECRECY, 1, 2) \
        + g.some(INF_SCRIPTS + INF_ATTACK, 0, 2)
    g.r.shuffle(body)
    end = g.pick(['Pay: ' + g.pick(INF_PAY) + '.', 'You start tomorrow if you agree.',
                  'Send me your GCash number for the salary.', 'Can you start this week?'])
    return ' '.join([intro, g.sentence_join(body), end])


def influence_newspages(g):
    body = g.some(INF_NEWSPAGES, 1, 2) + g.some(INF_POLITICAL, 0, 1) + g.some(INF_SECRECY, 1, 1) \
        + g.some(INF_SCRIPTS, 0, 1)
    g.r.shuffle(body)
    head = g.pick(['Content Writer / Page Admin', 'News Page Moderator', 'Digital Publisher',
                   'Online News Writer (work from home)', 'Social Media Editor'])
    return f'{head}\n{g.company()}\n' + g.sentence_join(body) + ' ' + g.fill(g.pick(INF_PAY)) + '. ' + g.pick(INF_APPLY) + '.'


def influence_foreign(g):
    body = g.some(INF_FOREIGN, 2, 3) + g.some(INF_PERSONAS, 1, 1) + g.some(INF_SECRECY, 0, 1)
    g.r.shuffle(body)
    head = g.pick(['Social media job for an international NGO', 'Remote content team (English writers)',
                   'Digital advocacy officer, international project', 'Online writer for overseas audiences'])
    loc = g.pick(['Accra', 'Lagos', 'Nairobi', 'Manila', 'Cebu', 'Kampala', 'Dhaka'])
    salary = g.pick(['₱{monthly}', 'GHS 3,000', 'NGN 250,000', 'KES 40,000', '$400', '$600', 'Tk 30,000'])
    return f'{head} ({loc}). ' + g.sentence_join(body) + ' Salary ' + g.fill(salary) + ' monthly.'


def influence_kenya(g):
    cur = g.pick(['KES', 'NGN', 'GHS', 'Rs'])
    amt = g.pick(['250', '500', '1,000', '2,000'])
    body = [g.pick(['tweet with the hashtag of the day', 'post the hashtag we send in the WhatsApp group',
                    'retweet and quote the posts in the tweet sheet']),
            g.pick([f'{cur} {amt} per campaign', f'{cur} {amt} per hashtag', f'{cur} {amt} per day']),
            g.pick(['accounts with 1,000+ followers earn more', 'verified accounts get double pay',
                    'bring as many accounts as you can']),
            g.pick(['the topic is the court ruling and the judges', 'the topic is the new bill and its critics',
                    'we target the journalists who wrote against the governor',
                    'the campaign supports the ruling party']),
            g.pick(['do not mention you are paid', 'never use #ad', 'keep the group private'])]
    g.r.shuffle(body)
    return g.pick(['Influencers needed!', 'Twitter jobs available.', 'Paid hashtag campaign.',
                   'Earn from your X account.']) + ' ' + g.sentence_join(body) + ' ' + g.pick(['DM me.', 'Join the WhatsApp group.', 'Reply with your handle.'])


def influence_taglish(g):
    body = g.some(INF_FIL_BODY, 2, 4) + g.some(INF_FIL_SECRET, 1, 2) + [g.pick(INF_FIL_PAY)]
    g.r.shuffle(body)
    sep = g.pick(['\n', '. ', ' ✅ '])
    return g.pick(INF_FIL_INTRO) + ' ' + g.pick(EMOJI) + '\n' + sep.join(body) + '\n' + g.pick(INF_FIL_APPLY)


def influence_subtle(g):
    # Unaware-recruit framing: innocent title, red flags buried in the details.
    title = g.pick(['Community Engagement Associate', 'Online Brand Advocate', 'Digital Research Assistant',
                    'Social Listening Analyst', 'Content Moderator (Advocacy)', 'Customer Engagement Specialist'])
    body = [f'{g.company()} is hiring a {title} for a client in the {g.pick(["civic", "advocacy", "public affairs", "government relations", "consulting"])} sector.',
            g.pick(['You will engage with netizens in online communities.', 'You will join discussions in Facebook groups and comment sections.',
                    'You will help shape conversations online.']),
            g.pick(['Accounts and content guidelines are provided.', 'The team gives you profiles to use.',
                    'You will use the work profiles we assign, not your personal account.']),
            g.pick(['Daily briefs tell you which posts to engage with.', 'You will receive talking points each morning.',
                    'Targets and keywords are sent daily.']),
            g.pick(['The client is confidential.', 'An NDA is required.', 'Do not discuss the client publicly.']),
            g.pick(INF_PAY) + '.']
    return '\n'.join(g.fill(b) for b in body)


# ─────────────────────────────────────────── trafficking ───────────────────────────────────────────
TRF_TITLES = ['Customer Service Representative', 'Chat Support Agent', 'Online Sales Associate',
              'Typist / Data Encoder', 'Marketing Specialist', 'IT Support Staff', 'Game Tester', 'Casino Host',
              'Translator (English/Chinese)', 'Live Chat Agent', 'Telemarketer', 'Online Marketing Staff',
              'Admin Assistant', 'Customer Care Specialist', 'Social Media Marketer', 'Encoder']
TRF_DEST = ['Myawaddy, Myanmar', 'Thailand (Mae Sot area)', 'Bangkok, Thailand', 'Sihanoukville, Cambodia',
            'Phnom Penh, Cambodia', 'Bavet, Cambodia', 'Poipet, Cambodia', 'the Golden Triangle, Laos',
            'Bokeo, Laos', 'Laos', 'Cambodia', 'Myanmar', 'Thailand', 'Dubai', 'Malaysia', 'Vietnam border area']
TRF_PROMISE = ['salary {usd} per month plus commission', '₱{php_high} per month', 'free airfare, food and accommodation',
               'no experience needed', 'basic English and typing skills only', 'age 18 to 35',
               'fast hiring with an interview today', 'direct hiring with no agency',
               'everything is shouldered by the company', 'visa and ticket provided', 'you fly within one week']
TRF_VISA = ['travel on a tourist visa first and the company will process your work permit after arrival',
            'visa on arrival only, no need for a work visa', 'just bring your passport and we handle everything',
            'you will enter as a tourist and we convert your visa later', 'no OEC needed',
            'no need to go through DMW', 'skip the agency because our boss hires directly abroad']
TRF_COACH = ['if immigration asks, say you are on vacation', 'tell the officer you are visiting a friend',
             'do not mention work at the airport', 'our escort will help you pass immigration',
             "we have a contact at the airport so you won't be offloaded",
             'delete our chats before you reach immigration',
             'bring pocket money and a return ticket so you look like a tourist']
TRF_ROUTE = ['fly to Bangkok and our driver will pick you up', 'from the airport you will cross the border by car',
             'you will travel by land to Mae Sot', 'you will exit through Zamboanga and take a boat to Sabah',
             'fly via Kuala Lumpur and our team will meet you',
             'after landing, hand your passport to the driver for safekeeping']
TRF_WORK = ['chat with foreign clients and promote our investment platform',
            'build relationships with customers using our scripts', 'customer service for a crypto platform',
            'customer service for an online casino', 'target: convince 3 clients per week to deposit',
            'use the profiles provided to talk to people on dating apps',
            'manage several WhatsApp and WeChat accounts to find clients',
            'message leads from a list and move them to the trading app']
TRF_CONTROL = ['the company keeps your passport for visa processing',
               'the contract is 12 months and leaving early means a ${penalty} penalty',
               'you must repay your flight and accommodation if you quit',
               'phones are kept by the supervisor during work hours', 'work 12 to 14 hours a day, 7 days a week',
               'you cannot leave the compound without permission',
               'you owe the company for your ticket until your first salary']
TRF_URGENCY = ['Limited slots', 'Flight next week', 'Send your passport copy now', 'Interview today via Telegram',
               'Urgent hiring', 'Only 5 slots left']
TRF_FIL_INTRO = ['Hiring CSR abroad!', 'Urgent hiring sa Thailand', 'May opening sa Cambodia',
                 'Work abroad, direct hire', 'Need chat support sa Myanmar border', 'Laos hiring, libre lahat']
TRF_FIL_BODY = ['₱{php_high} kada buwan', 'libre ang flight, pagkain at tirahan', 'basic English lang',
                'walang experience okay lang', 'walang placement fee', 'alis agad next week',
                'tourist visa lang muna, kami na bahala sa working visa pagdating', 'passport lang ang kailangan',
                'hindi na kailangan dumaan sa agency', 'hindi na kailangan ng OEC', 'visa on arrival lang',
                'pag tinanong ka ng immigration, sabihin mo bakasyon lang', 'wag mong sabihin na magtatrabaho ka',
                'may escort tayo sa airport para hindi ka ma-offload',
                'burahin mo ang chat natin bago ka dumaan sa immigration',
                'makikipag-chat ka sa mga foreigner para mag-invest sila',
                'gagamit ka ng script para kausapin ang mga client', 'customer service sa crypto at online casino',
                'ang kumpanya ang magtatabi ng passport mo',
                'may penalty kapag umalis ka bago matapos ang kontrata', 'hindi ka pwedeng lumabas ng compound']


def trafficking_ad(g):
    title, dest = g.pick(TRF_TITLES), g.pick(TRF_DEST)
    items = g.some(TRF_PROMISE, 2, 4) + g.some(TRF_VISA, 1, 1) + g.some(TRF_WORK + TRF_CONTROL + TRF_ROUTE, 0, 2)
    g.r.shuffle(items)
    return '\n'.join([f'{title} – {dest}', g.pick(['Requirements and benefits:', 'Details:', 'Offer:', 'Package:']),
                      g.bullets(items), g.pick(TRF_URGENCY) + '! ' + g.pick(['Apply via Telegram.', 'PM your passport copy.', 'WhatsApp {phone}.', 'Message us now.'])])


def trafficking_chat(g):
    dest = g.pick(TRF_DEST)
    body = [g.pick([f'Hi, I am {g.pick(SLOTS["name"])}, HR of {g.company()} in {dest}.',
                    f'Good day! Our company in {dest} needs {g.pick(TRF_TITLES).lower()}s.',
                    f'Hello friend, there is a job for you in {dest}.']),
            g.pick(TRF_PROMISE), g.pick(TRF_VISA)] + g.some(TRF_COACH + TRF_ROUTE, 1, 2) + g.some(TRF_WORK + TRF_CONTROL, 0, 2)
    return g.sentence_join(body) + ' ' + g.pick(TRF_URGENCY) + '.'


def trafficking_coached(g):
    body = g.some(TRF_COACH, 2, 3) + g.some(TRF_ROUTE, 1, 2) + [g.pick(TRF_PROMISE)]
    g.r.shuffle(body)
    return g.pick(['Instructions for your flight:', 'Before you fly, remember:', 'Important for departure:',
                   'Read carefully before going to the airport.']) + ' ' + g.sentence_join(body)


def trafficking_scamwork(g):
    dest = g.pick(TRF_DEST)
    body = [f'{g.pick(TRF_TITLES)} needed in {dest}.'] + g.some(TRF_WORK, 1, 2) + g.some(TRF_CONTROL, 1, 2) \
        + g.some(TRF_PROMISE, 1, 2)
    return g.sentence_join(body)


def trafficking_taglish(g):
    body = g.some(TRF_FIL_BODY, 3, 6)
    g.r.shuffle(body)
    sep = g.pick(['\n', '. ', ' ✅ '])
    return g.pick(TRF_FIL_INTRO) + ' ' + g.pick(EMOJI) + '\n' + sep.join(body) + '\n' + g.pick(['PM lang', 'Message sa Telegram', 'Chat sa WhatsApp', 'I-send ang passport copy'])


def trafficking_post(g):
    lines = [g.pick(['WORK ABROAD!', 'HIRING ABROAD', 'OVERSEAS JOB OPENING', 'URGENT: ABROAD']) + ' ' + g.pick(EMOJI),
             f'{g.pick(TRF_TITLES)} | {g.pick(TRF_DEST)}',
             g.bullets([g.pick(TRF_PROMISE), g.pick(TRF_PROMISE), g.pick(TRF_VISA)]),
             g.pick(TRF_URGENCY) + ' ' + g.pick(EMOJI)]
    return '\n'.join(lines)


# ─────────────────────────────────────────── scam ───────────────────────────────────────────
SCM_INTRO = ['Hi! Good day. I am {name} from {company} HR.', 'Congratulations! Your resume has been shortlisted.',
             'Hello, we are hiring part-time online staff.', 'Hi dear, are you interested in a part-time job?',
             'Good news! You have been selected for our online job.', 'Hello! We found your profile on a job site.']
SCM_TASK = ['just like and follow accounts and earn per task', 'rate products and hotels online for commission',
            'like YouTube videos and send screenshots', 'follow online shops and get paid per follow',
            'complete simple tasks on your phone for 10 to 30 minutes a day',
            'prepaid tasks: deposit ₱{small} and receive ₱{small_back}',
            'reach VIP level to unlock higher commissions', 'merchant tasks with 30% commission']
SCM_PAY = ['earn ₱{daily_scam} a day', 'daily salary ₱500 to ₱3,000', 'earn $50 to $300 per day',
           'get paid instantly via GCash', 'withdraw anytime', 'commission of 5% to 30% per order']
SCM_FEE = ['pay a ₱{fee} registration fee to activate your account',
           'a refundable security deposit of ₱{fee} is required', 'training fee of ₱{fee} before you start',
           'processing fee of ₱{fee} for your company ID', 'top up your account to withdraw your earnings',
           'medical and placement fee must be paid before the interview',
           'send ₱{fee} via GCash to reserve your slot', 'pay for your starter kit first']
SCM_IDBANK = ['send a selfie holding your ID', 'send your bank account and online banking login',
              'share the OTP we send to your phone', 'we need your GCash or Maya account and PIN for your salary',
              'send your passport copy and NBI clearance before the interview',
              'rent your e-wallet account to us for ₱{small} a week',
              'receive payments in your bank account and transfer them to our agent',
              'buy 5 SIM cards and register them for the company']
SCM_CHANNEL = ['add our receptionist on Telegram', 'message me on WhatsApp', 'contact our mentor on Telegram to start',
               'click this link to chat with HR', 'reply YES to continue']
SCM_URGENCY = ['Limited slots only!', 'Offer valid today only.', 'Reply within 1 hour.', 'Hurry, only 3 slots left!',
               '100% guaranteed income.', 'No interview needed.']
SCM_FIL = ['Hello po! Hiring kami ng part-time, ₱{daily_scam} kada araw, cellphone lang kailangan.',
           'Mag-like at follow lang, may sahod agad.', 'Magbayad lang ng ₱{fee} registration fee para ma-activate ang account mo.',
           'Mag-top up muna bago ma-withdraw ang kita.', 'I-send ang OTP para ma-verify ang GCash mo.',
           'Message sa Telegram para sa task.', 'Walang interview, sure hired!',
           'May bayad na ₱{fee} para sa training kit.', 'Ipahiram mo lang ang GCash mo, may bayad kada linggo.']
SCM_OTHER = ['Pay KES 1,000 registration to secure your job slot.', 'NGN 5,000 form fee is required before screening.',
             'Pay Rs 999 to confirm your interview.', 'Send GHS 200 for your uniform and ID card.',
             'A refundable deposit of $50 is needed for the training laptop.']


def scam_task(g):
    body = [g.pick(SCM_INTRO)] + g.some(SCM_TASK, 1, 2) + [g.pick(SCM_PAY)] + g.some(SCM_FEE + SCM_IDBANK, 0, 1) \
        + [g.pick(SCM_CHANNEL)]
    return g.sentence_join(body) + ' ' + g.pick(SCM_URGENCY)


def scam_fee(g):
    title = g.pick(['Data Entry Clerk', 'Online Encoder', 'Home-based Typist', 'Customer Service (WFH)',
                    'Office Assistant', 'Cashier', 'Warehouse Staff', 'Virtual Assistant'])
    body = [f'{title} needed!', g.pick(SCM_PAY)] + g.some(SCM_FEE, 1, 2) + g.some(SCM_URGENCY, 1, 2)
    if g.maybe(0.3):
        body.append(g.pick(SCM_OTHER))
    return g.sentence_join(body)


def scam_mule(g):
    body = [g.pick(['Payment processing assistant needed.', 'Finance agent, work from home.',
                    'Part-time e-wallet agent wanted.', 'Earn by lending your account.'])] \
        + g.some(SCM_IDBANK, 2, 3) + [g.pick(SCM_PAY), g.pick(SCM_CHANNEL)]
    return g.sentence_join(body)


def scam_taglish(g):
    return ' '.join(g.some(SCM_FIL, 3, 5))


# ─────────────────────────────────────────── legit (look-alikes) ───────────────────────────────────────────
LEG_SOCIAL = ['manage the official Facebook, Instagram and TikTok accounts of our brand',
              'plan the monthly content calendar with the marketing team',
              'prepare weekly analytics reports on reach and engagement',
              'respond to customer comments and messages on our official pages',
              'work with influencers and make sure sponsored posts carry #ad or Paid partnership labels',
              'follow platform community standards and our brand guidelines',
              'coordinate with designers for graphics and short videos',
              'run paid ads through our verified business account',
              'manage social media accounts for our 5 client brands']
LEG_POLITICAL = ['manage the official, COMELEC-registered social media accounts of the Office of the {office_cap}',
                 "draft press releases and statements published under the office's name",
                 'make sure all campaign materials comply with election rules on advertising and disclosure',
                 'fact-check every claim before it is published', 'coordinate media interviews and press briefings',
                 "answer constituents' questions on official channels",
                 "run paid political ads only from the campaign's verified page with Paid for by disclaimers",
                 'prepare talking points for the spokesperson']
LEG_MODERATION = ['review user-generated content for violations of community guidelines, including hate speech, misinformation, spam and fake accounts',
                  'remove fake accounts and coordinated spam according to platform policy',
                  'escalate possible coordinated inauthentic behavior to the trust and safety team',
                  'access to wellness programs and counseling', 'night differential and HMO from day one']
LEG_FACTCHECK = ['monitor disinformation narratives and troll networks on social media',
                 'write fact-checks of viral claims following IFCN standards',
                 'investigate coordinated inauthentic behavior and fake account networks',
                 'verify photos and videos using open-source tools', 'publish methodology and corrections openly',
                 'track paid political content during the election period']
LEG_BPO = ['handle chat and email support for an international e-commerce account',
           'answer inbound calls from US customers', 'night differential, HMO for you and 1 dependent, and 13th month pay',
           'SSS, PhilHealth and Pag-IBIG contributions', 'walk-in applicants welcome Monday to Friday, 9 AM to 3 PM',
           'bring your resume and one valid ID', 'we never charge applicants any fee', 'paid training']
LEG_OFW = ['licensed by the Department of Migrant Workers (License No. DMW-{lic})',
           'job order verified by the Migrant Workers Office in {country}',
           'free airfare and accommodation as stated in the DMW-approved employment contract', 'no placement fee',
           'deployment only after OEC issuance and PDOS', 'work visa processed by the employer before departure',
           'apply in person at our office in Ermita, Manila',
           'requirements: valid passport, PRC license and 2 years of experience',
           'we never ask for payment through GCash or personal accounts']
LEG_ABROAD_ROLE = ['English Teacher in Bangkok', 'Hotel Guest Relations Officer in Phuket',
                   'NGO Program Officer in Phnom Penh', 'Production Engineer in Vientiane', 'Teacher in Ho Chi Minh City',
                   'Restaurant Supervisor in Kuala Lumpur', 'IT Analyst in Dubai']
LEG_ABROAD_PROC = ['a non-immigrant B visa and work permit are arranged by the employer before you fly',
                   'the contract is signed before departure and verified by the labor attaché',
                   'deployment through a DMW-licensed agency',
                   "the employer's address and registration are listed on the government website",
                   'you keep your passport at all times', 'return airfare is covered at the end of the contract']
LEG_VA = ['a US-based small business seeks a virtual assistant for email management and social media scheduling',
          'paid hourly via PayPal or Wise with the contract on a freelancing platform',
          'the trial task is paid at the same rate', 'you use our company accounts only and we never ask for your personal logins']
LEG_DATA = ['label images and text for AI training', 'paid per task through our platform', 'no fees ever',
            'flexible hours and you choose your own projects']
LEG_NEWS = ['reporter for our national desk', 'verify sources and follow our editorial standards',
            'cover elections and public policy fairly', 'your byline is published under your real name']
LEG_VOLUNTEER = ['volunteer for a nonpartisan voter education drive', 'help at polling precincts as an election monitor',
                 'training on election rules is provided', 'volunteers wear official IDs and are not paid to campaign']
LEG_AMBASSADOR = ['brand ambassador program: post about our products from your own account',
                  'every post must include #ad or #sponsored', 'we never ask you to create extra accounts',
                  'contract and payment terms are in writing']
LEG_APPLY = ['Apply through our careers page.', 'Send your CV to careers@{domain}.', 'Apply on JobStreet.',
             'Apply on our LinkedIn page.', 'Visit our office for an interview.',
             'Online interview with our HR manager, then an on-site exam.']
LEG_BENEFITS = ['HMO', '13th month pay', 'paid leave', 'performance bonus', 'government-mandated benefits',
                'hybrid work setup', 'laptop provided']
LEG_FIL = ['Hiring CSR! {ph_city} site.', '{salary_ph} + night diff + HMO.', 'Walk-in applicants welcome Mon-Fri 9AM-3PM.',
           'Dalhin ang resume at isang valid ID.', 'Walang bayad ang pag-apply.', 'Libre ang training, may sahod habang nagte-training.',
           'Hindi kami humihingi ng bayad sa GCash.', 'Mag-apply sa aming official page o sa JobStreet.',
           'Kumpleto ang government benefits: SSS, PhilHealth, Pag-IBIG.', 'May 13th month pay.']


def legit_role(g, title, pool, n_low=2, n_high=4, loc=None):
    items = g.some(pool, n_low, n_high)
    loc = loc or g.pick(SLOTS['ph_city'])
    head = g.pick([f'{title} – {g.company()} ({loc})', f'{g.company()} is hiring: {title}',
                   f'{title}\n{g.company()} | {loc}'])
    ben = 'Benefits: ' + ', '.join(g.some(LEG_BENEFITS, 2, 4)) + '.'
    sal = 'Salary: ' + g.pick(SLOTS['salary_ph']) + ' per month.' if g.maybe(0.6) else ''
    return '\n'.join(p for p in [head, g.pick(['Responsibilities:', 'What you will do:', 'The role:']),
                                 g.bullets(items), sal, ben, g.pick(LEG_APPLY)] if p)


def legit_social(g):
    return legit_role(g, g.pick(['Social Media Manager', 'Social Media Specialist', 'Digital Marketing Associate',
                                 'Community Manager', 'Content Creator']), LEG_SOCIAL)


def legit_political(g):
    return legit_role(g, g.pick(['Communications Officer', 'Digital Communications Associate', 'Press Officer',
                                 'Social Media Officer, Campaign Communications']), LEG_POLITICAL)


def legit_moderation(g):
    return legit_role(g, g.pick(['Content Moderator', 'Trust and Safety Associate', 'Community Operations Specialist']),
                      LEG_MODERATION, 2, 4)


def legit_factcheck(g):
    return legit_role(g, g.pick(['Fact-Checker', 'Disinformation Researcher', 'Investigative Researcher',
                                 'Open-Source Investigator']), LEG_FACTCHECK)


def legit_bpo(g):
    return legit_role(g, g.pick(['Customer Service Representative', 'Chat Support Associate', 'Technical Support Representative',
                                 'Email Support Specialist']), LEG_BPO, 3, 5)


def legit_ofw(g):
    role, country = g.pick(SLOTS['ofw_role']), g.pick(SLOTS['country'])
    items = [i.replace('{country}', country) for i in g.some(LEG_OFW, 3, 6)]
    return '\n'.join([f'{role} for {country}', g.company() + ' Manpower Services', g.bullets(items),
                      g.pick(['Apply in person.', 'Bring original documents for verification.',
                              'Verify our license at the DMW website before applying.'])])


def legit_abroad(g):
    role = g.pick(LEG_ABROAD_ROLE)
    items = g.some(LEG_ABROAD_PROC, 2, 4)
    return f'{role}. ' + g.sentence_join(items) + ' ' + g.pick(LEG_APPLY)


def legit_misc(g):
    pool = g.pick([LEG_VA, LEG_DATA, LEG_NEWS, LEG_VOLUNTEER, LEG_AMBASSADOR])
    title = {id(LEG_VA): 'Virtual Assistant', id(LEG_DATA): 'Data Annotator', id(LEG_NEWS): 'Reporter',
             id(LEG_VOLUNTEER): 'Election Volunteer', id(LEG_AMBASSADOR): 'Brand Ambassador'}[id(pool)]
    return f'{title}. ' + g.sentence_join(g.some(pool, 2, 4)) + ' ' + g.pick(LEG_APPLY)


def legit_taglish(g):
    return ' '.join(g.some(LEG_FIL, 3, 6))


def legit_post(g):
    lines = [g.pick(['WE ARE HIRING!', 'Join our team!', 'Now hiring', 'Career opportunity']) + ' ' + g.pick(EMOJI),
             g.pick(['Social Media Associate', 'Customer Service Representative', 'Graphic Designer', 'Accounting Staff',
                     'Sales Coordinator', 'Content Writer', 'HR Assistant']) + f' – {g.pick(SLOTS["ph_city"])}',
             g.bullets(g.some(['full-time, Monday to Friday', 'with government-mandated benefits', 'HMO upon regularization',
                               '1 year of experience preferred', 'fresh graduates may apply', 'no fees will be collected from applicants',
                               'interview at our office'], 2, 4)),
             g.pick(LEG_APPLY)]
    return '\n'.join(lines)


def make_pack_recipe(lang, label):
    def recipe(g):
        spec = PACKS[lang][label]
        body = g.some(spec['body'], 3, 5)
        g.r.shuffle(body)
        sep = g.pick(['\n', '. ', ' ✅ ', '\n- '])
        return g.pick(spec['intro']) + ' ' + g.pick(EMOJI) + sep + sep.join(body) + '\n' + g.pick(spec['end'])
    recipe.__name__ = f'{label}_{lang}'
    recipe.lang = lang
    return recipe


def make_en_global(label):
    def recipe(g):
        lines = g.some(EN_GLOBAL[label], 1, 2)
        extra = {'trafficking': [g.pick(TRF_COACH), g.pick(TRF_CONTROL), g.pick(TRF_URGENCY)],
                 'legit': [g.pick(['You keep your passport.', 'Never pay anyone in cash or by mobile money to get a slot.',
                                   'Verify our license on the government website.'])]}[label]
        return ' '.join(lines) + ' ' + g.sentence_join(g.some(extra, 1, 2))
    recipe.__name__ = f'{label}_en_global'
    return recipe


RECIPES = {
    'influence': [influence_ad, influence_post, influence_chat, influence_newspages, influence_foreign,
                  influence_kenya, influence_taglish, influence_subtle],
    'trafficking': [trafficking_ad, trafficking_chat, trafficking_coached, trafficking_scamwork,
                    trafficking_taglish, trafficking_post],
    'scam': [scam_task, scam_fee, scam_mule, scam_taglish],
    'legit': [legit_social, legit_political, legit_moderation, legit_factcheck, legit_bpo, legit_ofw,
              legit_abroad, legit_misc, legit_taglish, legit_post],
}
for _lang in PACKS:
    for _label in PACKS[_lang]:
        RECIPES[_label].append(make_pack_recipe(_lang, _label))
for _label in EN_GLOBAL:
    RECIPES[_label].append(make_en_global(_label))
PER_RECIPE = {'influence': 180, 'trafficking': 230, 'scam': 300, 'legit': 220}
PER_PACK_RECIPE = 110


def lang_of(text):
    fil = len(re.findall(r'\b(ang|ng|mga|sa|na|lang|kami|ka|mo|po|kada|wag|huwag|bawal|para)\b', text.lower()))
    return 'taglish' if fil >= 3 else 'en'


def generate(seed=SEED):
    g = Gen(seed)
    rows, seen = [], set()
    for label, recipes in RECIPES.items():
        for recipe in recipes:
            target = PER_PACK_RECIPE if hasattr(recipe, 'lang') else PER_RECIPE[label]
            made, attempts = 0, 0
            while made < target and attempts < target * 20:
                attempts += 1
                text = g.fill(recipe(g))
                text = re.sub(r'[ \t]+', ' ', text).strip()
                if text in seen:
                    continue
                seen.add(text)
                rows.append({'text': text, 'label': label, 'family': f'{label}:{recipe.__name__}',
                             'lang': getattr(recipe, 'lang', None) or lang_of(text), 'synthetic': 1})
                made += 1
    return rows


def main():
    rows = generate()
    with OUT.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['text', 'label', 'family', 'lang', 'synthetic'])
        writer.writeheader()
        writer.writerows(rows)
    from collections import Counter
    print(f'Wrote {len(rows)} rows to {OUT}')
    print(Counter(r['label'] for r in rows))
    print(Counter(r['lang'] for r in rows))


if __name__ == '__main__':
    main()
