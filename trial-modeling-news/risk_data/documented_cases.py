#!/usr/bin/env python3
"""Documented-case set: 24 real, sourced recruitment cases. EVALUATION ONLY, scored after the system was frozen.

Each row restates, in our own words, what recruits in one specific reported case were offered or told, using
only details the source reports (no added red flags). Sources: Philippine government advisories, UN/Interpol,
platform takedowns and investigative reporting, recorded in docs/research/. Several cases are deliberately
innocuous, because the real ads were: a text check cannot catch an ad that hides everything, which is why the
risk-check chatbot asks about the situation (whose accounts, which visa, who the client is).

Run: .venv/bin/python risk_data/documented_cases.py   (writes risk_data/documented_cases.csv)
"""
import csv
from pathlib import Path

OUT = Path(__file__).resolve().parent / 'documented_cases.csv'

ROWS = [
    # trafficking / scam-compound recruitment
    ('trafficking', 'BI via Philstar, 8 Apr 2023', 'https://philstar.com/headlines/2023/04/08/2257421/filipino-trafficking-victim-scammed-online-company-paid-ransom-release-bi',
     'Customer service representative job in Thailand, $1,000 a month. Contacted through Facebook. At the airport, pose as a tourist during the immigration inspection; after arrival you will be driven to the workplace.'),
    ('trafficking', 'PNA, May 2024', 'https://alpha.pna.gov.ph/articles/1225132',
     'Hiring customer service representatives to work abroad. Monthly salary PHP 55,000.'),
    ('trafficking', 'GMA News, Dec 2023', 'https://gmanetwork.com/news/topstories/nation/931023/bi-nabs-human-trafficker-intercepts-victims-lured-by-pogo-type-jobs-abroad/story',
     'Customer service jobs abroad with a P50,000 monthly salary. Travel as a group; if asked at the airport, say you are on vacation.'),
    ('trafficking', 'DMW advisory via GMA, Dec 2022', 'https://www.gmanetwork.com/news/pinoyabroad/news/853031/dmw-warns-filipinos-vs-illegal-recruitment-for-jobs-in-cambodia-laos-myanmar/story/',
     'Now hiring: customer service, technical support and data encoder jobs in Cambodia. Free plane ticket. No visa needed because Filipinos can enter ASEAN countries visa-free as tourists. No need to process with DMW.'),
    ('trafficking', 'DMW alert via Gulf News, Jan 2025', 'https://gulfnews.com/world/asia/philippines',
     'Call centre agents needed in Thailand or Vietnam. Pay the processing fee to reserve your slot. You will travel as a tourist and get your papers after arrival.'),
    ('trafficking', 'BI via GMA, Jul 2025', 'https://www.gmanetwork.com/news/',
     'A former colleague offered a job abroad, flying through a third country first. The work: start chats with strangers in the US by pretending to send a wrong message, then build a relationship.'),
    ('trafficking', 'Kenya, regional notes [AFE-11]', 'https://www.diaspora.go.ke/news-details.php?nid=44',
     'Customer care job in Thailand, ticket paid. Agent fee KSh 150,000 covers the ticket and the tourist visa. Driver will pick you up in Bangkok.'),
    ('trafficking', 'India, regional notes [SA-13]', 'https://www.mea.gov.in/',
     'Digital Sales and Marketing Executive and Customer Support Service jobs in Laos, via Bangkok. High salary, quick online interview, visa on arrival.'),
    ('trafficking', 'Brazil MRE warning, Feb 2026 [LAC-10]', 'https://www.gov.br/mre/',
     'Atendimento ao cliente em empresa de tecnologia na Tailândia, salário de US$ 1.500 por mês, passagem paga. Contratação rápida pelo Instagram.'),
    ('trafficking', 'Morocco cases, regional notes [MENA-17]', 'https://www.ohchr.org/',
     'E-commerce and call centre job in Thailand. Salary $1,000 a month at first, rising to $2,000. Flight to Bangkok paid; the work visa will be sorted out when you arrive.'),
    ('trafficking', 'INTERPOL orange notice, Jun 2023', 'https://www.interpol.int/en/News-and-Events/News/2023/INTERPOL-issues-global-warning-on-human-trafficking-fueled-fraud',
     'Digital sales executive and IT roles in Southeast Asia, advertised on social networks and recruitment sites. Attractive salary and accommodation.'),
    ('trafficking', 'OHCHR, Feb 2026', 'https://www.ohchr.org/en/press-releases/2026/02/un-report-details-grave-abuses-against-those-trafficked-scam-centres',
     'Well-paid office job abroad. You will see the contract after you arrive. Salary will be paid after deductions for your flight and accommodation.'),
    # covert influence / troll-farm recruitment
    ('influence', 'BuzzFeed News on IRA ads, Feb 2018', 'https://www.buzzfeednews.com/article/janelytvynenko/job-ads-for-russian-troll-factory',
     'Social media specialist / content manager. Duties: preparing thematic posts and monitoring. Salary 40,000 roubles a month.'),
    ('influence', 'Yle on IRA work', 'https://kioski.yle.fi/omat/at-the-origins-of-russian-propaganda',
     'Internet operator, day and night shifts. You will post on blogs, forums, social networks and news comment sections on the topics you are given, often from several profiles at once. 50 to 100 messages per shift.'),
    ('influence', 'Meta and CyberScoop on EBLA, Mar 2020', 'https://cyberscoop.com/russia-ira-troll-farm-disinformation-outsourced/',
     'Social media job with an NGO in Accra. You will be given a mobile phone and instructions over Telegram, and post about social issues in the United States from the accounts provided.'),
    ('influence', 'Mozilla Foundation, Sep 2021', 'https://www.mozillafoundation.org/en/blog/fellow-research-inside-the-shadowy-world-of-disinformation-for-hire-in-kenya/',
     'Join our WhatsApp group: we send the hashtag, the tweets and posting times for the campaign. Paid about $10 to $15 a day through M-Pesa.'),
    ('influence', 'GMA News, Feb 2019', 'https://www.gmanetwork.com/news/topstories/nation/686376/ph-online-troll-earns-between-p30-000-p70-000-a-month-leader-bares/story/',
     'Work in shifts handling up to 200 personas each. The PR head and content editor give the narratives; the job is to boost and defend our candidates. ₱30,000 a month to start.'),
    ('influence', 'Ong & Cabañes 2018 via Leeds', 'https://www.leeds.ac.uk/news/article/4184/fake_news_production_and_social_media_trolls',
     'Part-time account handling: run fake accounts and meet a daily quota of posts and comments for a political client. Keep your day job.'),
    ('influence', 'OpenAI, Jun 2025', 'https://openai.com/global-affairs/disrupting-malicious-uses-of-ai-june-2025/',
     'Marketing firm work: write short comments in English and Taglish praising the President and attacking the Vice President, and post them on TikTok and on Facebook replies to news pages from new accounts.'),
    ('influence', 'PTV News, Apr 2025 (Senate allegation)', 'https://ptvnews.ph/chinese-funded-trolls-other-espionage-threats-bared-in-senate/',
     'PR agency project: create fake profiles posing as teachers, OFWs and community members, and post the content the agency gives you. The client will not be named.'),
    ('influence', 'El Salvador, regional notes [LAC-55]', 'https://www.elfaro.net/',
     'Trabajo de 600 dólares al mes manejando cuentas falsas en redes sociales. Firmas un contrato de confidencialidad.'),
    ('influence', 'Venezuela, regional notes [LAC-44]', 'https://www.dfrlab.org/',
     'Gana bonos: publica cada día la etiqueta del día desde tu cuenta para cumplir la meta.'),
    ('influence', 'Malaysia, regional notes [SEA-45]', 'https://www.malaysiakini.com/',
     'Cybertrooper job, about RM2,000 a month or RM50 to RM200 per task. Ready-made accounts and daily scripts are sent through WhatsApp and Telegram groups.'),
    ('influence', 'Bangladesh, regional notes [SA-30]', 'https://www.dismislab.com/',
     'Earn from home: react and comment on political pages from many accounts as instructed, paid through bKash.'),
]


def main():
    with OUT.open('w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['id', 'label', 'lang', 'region', 'text', 'source', 'url'])
        for i, (label, source, url, text) in enumerate(ROWS, 1):
            w.writerow([f'D{i:03d}', label, '', '', text, source, url])
    print(f'Wrote {len(ROWS)} rows to {OUT}')


if __name__ == '__main__':
    main()
