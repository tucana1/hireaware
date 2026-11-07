#!/usr/bin/env python3
"""Fresh held-out set v2: 60 examples written AFTER the rules and model were frozen (2026-11-07).

Used once, for the final report of the shipped system (rules + classifier). Never tune on it.
Challenge v1 was seen while the red-flag rules were written, so v1 scores for the full system are
optimistic; v2 is the more honest number. Both are still written by the project team, not collected
from real recruiters.

Run: .venv/bin/python risk_data/challenge_v2.py   (writes risk_data/challenge_v2.csv)
"""
import csv
from pathlib import Path

OUT = Path(__file__).resolve().parent / 'challenge_v2.csv'

ROWS = [
    # influence
    ('influence', 'en', 'PH', 'Looking for night-shift "community voices". We hand you a phone with 8 logged-in profiles. Your job: keep the comment section on the congressman\'s page lively and shut down negative threads. ₱18k a month. Sign the confidentiality form first.'),
    ('influence', 'taglish', 'PH', 'Raket para sa eleksyon: may ibibigay kaming 4 na FB profiles, ikaw na bahala mag-like at mag-comment sa mga post ng aming senador. ₱300 kada araw. Walang ibang dapat makaalam.'),
    ('influence', 'en', 'KE', 'Wanted: X accounts with big followings for the county race. Every evening you will get the tweets to post and the opponents to tag. KSh 1,000 per day, paid on M-Pesa. Do not add #ad.'),
    ('influence', 'en', 'NG', 'Content officers needed for a "grassroots" movement. Each officer manages a cluster of personal-looking profiles and shares the material our strategy desk prepares. N60,000 monthly. The sponsor will not be named.'),
    ('influence', 'es', 'SV', 'Empleo en comunicación digital: administrarás varias cuentas con nombres inventados y publicarás los mensajes que te mande la coordinación para defender al gobierno. Firmas un contrato de confidencialidad.'),
    ('influence', 'pt', 'BR', 'Trabalho remoto para as eleições municipais: você vai usar os perfis que a equipe passar para comentar a favor do candidato e responder aos opositores. Pagamento por Pix toda sexta. Sigilo total.'),
    ('influence', 'fr', 'CF', 'Recrutement de jeunes rédacteurs: vous publierez sous plusieurs noms des articles fournis par nos partenaires étrangers sur des pages d\'information locales. Rémunération mensuelle. Discrétion exigée.'),
    ('influence', 'id', 'ID', 'Lowongan admin akun: kelola 15 akun anonim, ikuti arahan konten harian, dan dukung paslon di kolom komentar. Gaji Rp 2,5 juta. Jangan sebut nama klien ke siapa pun.'),
    ('influence', 'hi', 'IN', 'Party ke liye online team: tumhe 5 alag ID milengi, roz ka content group mein aayega, bas post aur share karna hai. ₹500 roz. Ye kaam kisi ko batana mana hai.'),
    ('influence', 'en', 'GH', 'Remote writers wanted to run Facebook pages for a US audience. Write as if you are an American activist. Use the VPN settings we send. Cash payment monthly.'),
    ('influence', 'en', 'ZA', 'Social media internship with a public-affairs consultancy: build realistic-looking profiles, join community groups and steer discussions toward our client\'s position on the mining bill. Client name withheld.'),
    ('influence', 'en', 'UG', 'Paid bloggers: we send talking points daily, you post them as your personal opinion and report pages that oppose the government. UGX 25,000 per week.'),
    ('influence', 'sw', 'TZ', 'Kazi ya mtandaoni: utapewa akaunti kadhaa za Twitter, utaweka ujumbe tunaokutumia kumuunga mkono mgombea na kuwajibu wapinzani. Usimwambie mtu kuhusu malipo.'),
    ('influence', 'en', 'LK', 'Part-time campaign support: comment on news posts from the multiple accounts we create for you, using our daily message sheet. Never mention the campaign.'),
    ('influence', 'en', 'GLOBAL', 'Freelance "engagement specialists" to post reviews and comments that appear to come from residents of the target country. Personas, photos and scripts provided.'),
    # trafficking
    ('trafficking', 'en', 'PH', 'Online chat support in Phnom Penh, ₱95k a month, plane ticket and condo free. Process is easy: you just fly as a tourist, and our coordinator at the airport will guide you through. We will handle your permit later.'),
    ('trafficking', 'taglish', 'PH', 'Need encoder sa Myanmar, libre lahat, 80k sahod. Hindi mo na kailangan ng OEC. Sa immigration, sabihin mo lang na mamamasyal ka sa Bangkok.'),
    ('trafficking', 'en', 'KE', 'IT assistant jobs in Bangkok for Kenyans. $1,300 monthly. Pay the agent KSh 140,000 for the ticket and tourist visa. A driver will take you from the airport to the company near the border.'),
    ('trafficking', 'en', 'UG', 'Customer support work in Laos. Flight via Nairobi and Bangkok paid by the company. HR keeps your passport during the work permit process. Early resignation means you repay all costs.'),
    ('trafficking', 'en', 'IN', 'Data entry operator vacancy in Thailand, ₹1 lakh salary. Agent fee ₹1.8 lakh. Visa on arrival is enough. Do not tell the immigration officer about the job.'),
    ('trafficking', 'en', 'BD', 'Online marketing job in Cambodia for Bangladeshi graduates, free flight, tourist visa. Company will hold passports for safety.'),
    ('trafficking', 'en', 'NP', 'Computer jobs in Myanmar via Thailand, no labour permit required. Agent fee 2.5 lakh. You will cross into Myanmar by road after landing in Bangkok.'),
    ('trafficking', 'id', 'ID', 'Kerja customer service di Kamboja, gaji 1.200 USD, tiket gratis. Berangkat pakai visa kunjungan, visa kerja diurus nanti. Paspor dipegang kantor.'),
    ('trafficking', 'vi', 'VN', 'Việc nhẹ lương cao ở Campuchia: online sales job, 25 million dong, free housing. We will take you across the border by car.'),
    ('trafficking', 'pt', 'BR', 'Vaga de atendente bilíngue em Bangkok com salário em dólar. Passagem paga. Você entra como turista e a empresa resolve tudo lá. Multa se sair antes de um ano.'),
    ('trafficking', 'es', 'CO', 'Trabajo de soporte al cliente en Tailandia, 1.800 USD. Te pagamos el pasaje. Viaja como turista; en migración di que vas de vacaciones.'),
    ('trafficking', 'fr', 'CI', 'Emploi en Thaïlande: service client en ligne, 1 400 USD, billet offert. Partez avec un visa touristique; la société garde votre passeport à l\'arrivée.'),
    ('trafficking', 'en', 'NG', 'Customer retention role in Asia: chat with clients on dating apps and help them invest on our crypto platform. Flight paid. Visit visa only.'),
    ('trafficking', 'en', 'ET', 'Hotel and IT jobs in Thailand for Ethiopians. Travel first as a visitor through Nairobi. The company will fix the papers. You cannot leave the company compound during the contract.'),
    ('trafficking', 'en', 'GLOBAL', 'Security guard and cook positions in Russia with fast citizenship. Free ticket. Sign the Russian-language contract on arrival.'),
    # scam
    ('scam', 'en', 'PH', 'Congrats! You are hired as an online encoder. Pay the ₱950 onboarding fee via GCash so we can create your employee account.'),
    ('scam', 'taglish', 'PH', 'Part-time lang, i-like mo lang mga video tapos may bayad. Pero mag-top up ka muna ng ₱2,000 para ma-unlock ang mga VIP task.'),
    ('scam', 'en', 'KE', 'Supermarket attendant jobs: send KSh 1,200 for registration to the till number and report on Monday.'),
    ('scam', 'en', 'NG', 'Customs recruitment 2026: purchase the application scratch card for ₦10,000 to be shortlisted.'),
    ('scam', 'en', 'IN', 'Earn ₹4,000 daily rating hotels online. Join our Telegram mentor. First task requires a ₹1,500 deposit, returned with commission.'),
    ('scam', 'en', 'PK', 'WAPDA jobs open: deposit Rs 3,000 test fee through Easypaisa to the number given.'),
    ('scam', 'en', 'ZA', 'Earn R500 a day processing payments: receive transfers into your bank account and send them on to our partner, keep 10%.'),
    ('scam', 'pt', 'BR', 'Trabalhe curtindo posts no Instagram e ganhe R$ 150 por dia. Para liberar o saque, faça um depósito de R$ 100.'),
    ('scam', 'es', 'MX', 'Gana desde casa evaluando productos. Antes de empezar paga 350 pesos de inscripción por transferencia.'),
    ('scam', 'fr', 'SN', 'Recrutement à la police: payez 20 000 FCFA de frais de dossier par Wave avant le concours.'),
    ('scam', 'id', 'ID', 'Kerja sampingan: beri bintang 5 untuk toko online, komisi per tugas. Wajib isi saldo Rp 300.000 untuk tugas premium.'),
    ('scam', 'en', 'GH', 'You have been selected. Send your Mobile Money PIN and the code we text you so payroll can verify your wallet.'),
    ('scam', 'en', 'GLOBAL', 'Remote admin role: we will mail you a check for equipment. Deposit it, keep $200, and send the rest to our approved vendor.'),
    ('scam', 'sw', 'KE', 'Kazi ya haraka: lipa ada ya usajili KES 500 kupitia M-Pesa ili upate nafasi.'),
    ('scam', 'en', 'BD', 'Work from home typing, 1,500 taka per day. Registration 600 taka by bKash. No interview needed.'),
    # legit
    ('legit', 'en', 'PH', 'Digital Marketing Specialist, Cebu. Manage our resort\'s official Facebook and Instagram pages, run boosted posts from our verified ad account, and report results monthly. HMO, 13th month pay. Apply through our careers page.'),
    ('legit', 'en', 'PH', 'Trust and Safety Associate, Taguig. Investigate and remove fake account networks and coordinated spam according to platform policy. Night differential, wellness support.'),
    ('legit', 'en', 'PH', 'Factory workers for Taiwan through a DMW-licensed agency. Job order verified; work permit and contract before departure; OEC required. No placement fee for Taiwan factory roles as per policy.'),
    ('legit', 'en', 'KE', 'Communications Officer for a Nairobi NGO. Run the organisation\'s official social media accounts and write press releases. Written contract, NSSF and NHIF. Interview at our office.'),
    ('legit', 'en', 'NG', 'Fact-check Researcher. Verify viral claims during the election period and document coordinated inauthentic behaviour for public reports. Hybrid, Lagos.'),
    ('legit', 'en', 'IN', 'Nurses for the UK NHS through an eMigrate-registered recruiting agent. Work visa and certificate of sponsorship before travel. No fees charged to candidates.'),
    ('legit', 'id', 'ID', 'Lowongan Social Media Officer di Bandung. Mengelola akun resmi perusahaan, membuat kalender konten. BPJS, kontrak tertulis, interview di kantor.'),
    ('legit', 'pt', 'BR', 'Moderador de conteúdo em português, São Paulo. Revisar publicações conforme as políticas da plataforma e remover contas falsas. CLT, plano de saúde.'),
    ('legit', 'es', 'MX', 'Community Manager para una cafetería en Monterrey. Publicar desde las cuentas oficiales de la marca y responder mensajes de clientes. Contrato, prestaciones de ley.'),
    ('legit', 'fr', 'SN', 'Agent de service client à Dakar pour un opérateur télécom. CDI, formation payée, entretien dans nos locaux. Aucun frais demandé.'),
    ('legit', 'en', 'TH', 'Kindergarten teacher in Bangkok. The school arranges the non-immigrant B visa and work permit before you start. You keep your own passport.'),
    ('legit', 'en', 'GLOBAL', 'Influencer partnership: post an honest review of our phone on your own account, labelled #ad. Paid on delivery per the written agreement.'),
    ('legit', 'en', 'UG', 'Licensed external employment company (MGLSD licence displayed) recruiting drivers for Saudi Arabia. Contract attested and work visa issued before departure.'),
    ('legit', 'taglish', 'PH', 'Hiring Chat Support para sa e-commerce account, Pasig. ₱24k + night diff + HMO. Libre ang training at walang bayad ang application.'),
    ('legit', 'en', 'ZA', 'Election observer volunteer for a nonpartisan civic organisation. Training on electoral law provided. Volunteers wear official IDs.'),
]


def main():
    from collections import Counter
    counts = Counter(r[0] for r in ROWS)
    assert all(n == 15 for n in counts.values()), counts
    with OUT.open('w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['id', 'label', 'lang', 'region', 'text'])
        for i, (label, lang, region, text) in enumerate(ROWS, 1):
            w.writerow([f'V{i:03d}', label, lang, region, text])
    print(f'Wrote {len(ROWS)} rows to {OUT}: {dict(counts)}')


if __name__ == '__main__':
    main()
