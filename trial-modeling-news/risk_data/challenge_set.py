#!/usr/bin/env python3
"""Hand-written challenge set: EVALUATION ONLY. Never train on it or use it to pick a model.

120 examples (30 per label) across Southeast Asia, South Asia, East/West/Francophone Africa and Latin
America, in English, Filipino/Taglish, Bahasa Indonesia, Hindi/Hinglish, Swahili, Spanish, Portuguese
and French. Written separately from generate_synthetic.py with deliberately different wording, and
including hard look-alikes (content moderators, fact-checkers, licensed overseas recruitment, official
political communications, disclosed brand ambassadors).

Caveat: the same team wrote this and the synthetic training data, so scores here are a sanity check on
new wording, not a real-world accuracy figure. Real labeled examples are the next step (README.md).

Run: .venv/bin/python risk_data/challenge_set.py   (writes risk_data/challenge_set.csv)
"""
import csv
from pathlib import Path

OUT = Path(__file__).resolve().parent / 'challenge_set.csv'

# (label, lang, region, text)
ROWS = [
    # ───────────────────────────── influence ─────────────────────────────
    ('influence', 'en', 'PH', "Part-time Digital Ambassador needed for a public affairs firm in Pasig. You'll be handed 4 ready-made profiles and a daily engagement brief. Main job: keep the comment threads under the Governor's livestreams positive and push back on haters. ₱450 a night, paid every Saturday. Discretion is a must."),
    ('influence', 'taglish', 'PH', "Sideline para sa mga estudyante: magco-comment ka lang sa mga FB live ng partido gamit ang 3 account na ibibigay namin. ₱150 kada live. Walang pangalan ng kumpanya, basta sa GC lang tayo mag-uusap."),
    ('influence', 'fil', 'PH', "Kailangan ng mga taga-sagot sa mga nagrereklamo tungkol sa proyekto ng munisipyo. Huwag gamitin ang personal mong FB. Ipapadala namin ang mga sasabihin mo. ₱500 bawat araw."),
    ('influence', 'en', 'KE', "Do you have an active X account with 2k+ followers? Join our campaign team for the by-election. We share the trending topic and tweets in the group every 6am; you post, quote and reply to opponents' supporters. KES 700/day via M-Pesa. Keep the group confidential."),
    ('influence', 'en', 'NG', "We are recruiting digital foot soldiers across the 36 states. Create at least 5 accounts each with local-sounding names, build followers, and amplify the content our media team drops. Monthly stipend ₦80,000. Do not reveal the principal."),
    ('influence', 'en', 'GH', "International human-rights NGO seeks young writers in Accra. You'll run Facebook and Instagram pages addressed to Americans, writing as if you live in the US. Training provided by our foreign partners. Salary paid in cash."),
    ('influence', 'hi', 'IN', "Election season job! Har constituency ke liye 10 social media warriors chahiye. Roz ka content aur memes humari team degi, aapko apne alag-alag ID se share karna hai aur opposition ke posts pe reply. ₹600/din. Bahar kisi ko kuch nahi batana."),
    ('influence', 'en', 'IN', "Hiring Online Reputation Executives (remote). Work involves operating multiple pseudonymous handles to counter anti-national narratives and report hostile accounts in bulk. Daily target: 300 interactions. Salary ₹18k."),
    ('influence', 'id', 'ID', "Dicari tim medsos untuk pilkada. Tugas: pegang 10 akun samaran, ramaikan tagar pasangan calon, dan lawan narasi negatif. Konten disiapkan tim pusat. Honor Rp 3 juta/bulan. Wajib jaga kerahasiaan."),
    ('influence', 'pt', 'BR', "Renda extra nas eleições: precisamos de pessoas para administrar grupos de WhatsApp e perfis de apoio. O material vem pronto da coordenação, você só encaminha e comenta. Pagamento semanal no Pix. Nada de falar da campanha em público."),
    ('influence', 'es', 'MX', "Empresa de comunicación busca operadores digitales para el estado. Cada operador maneja cuentas de X y TikTok con nombres de ciudadanos comunes y posiciona las tendencias que indique el coordinador. 8,000 MXN mensuales. Confidencialidad absoluta."),
    ('influence', 'es', 'CO', "Se necesitan jóvenes para bodegas digitales: comentar en noticias regionales a favor del alcalde y desmentir a los críticos con capturas que te enviamos. Pago diario por Nequi."),
    ('influence', 'es', 'VE', "Gana bonos tuiteando: cada día te asignamos las etiquetas oficiales y debes publicar 50 tuits desde tus cuentas. Recompensa por cumplir la meta."),
    ('influence', 'fr', 'ML', "Agence de communication recrute 20 web-activistes à Bamako. Vous publierez chaque jour des messages préparés par notre équipe sur plusieurs comptes Facebook, et vous soutiendrez le partenaire étranger dans les commentaires. 75 000 FCFA par mois. Discrétion obligatoire."),
    ('influence', 'fr', 'CI', "Recherche jeunes pour animer des pages d'actualité indépendantes. Les articles sont fournis, il suffit de les publier sous différents noms. Paiement Wave chaque vendredi."),
    ('influence', 'en', 'UG', "Paid bloggers wanted ahead of the elections. You will receive talking points from the ministry's media desk, post them as your own views, and mass-report pages critical of the government. UGX 30,000 per week."),
    ('influence', 'en', 'ZA', "Marketing internship: grow a network of community voices accounts that comment on economic news, steering conversation toward our client's talking points. Client identity withheld. Stipend R4,500."),
    ('influence', 'hi', 'PK', "Social media team ke liye log chahiye. Har banda 6 accounts chalayega, trend ko top pe lana hai aur doosri party ke supporters ko jawab dena hai. Roz ka 1,500 rupay. Kisi ko batana nahi."),
    ('influence', 'en', 'BD', "Need cyber volunteers for the ruling coalition's online cell. Tasks: like, share and comment from multiple IDs, report critical pages, write positive comments about development projects. 15,000 BDT monthly via bKash. Strict secrecy."),
    ('influence', 'en', 'LK', "Opportunity for undergraduates: manage fan pages for a national movement and post the daily content pack. Profiles will be supplied. Don't mention the organisation."),
    ('influence', 'en', 'MM', "Content team for a peace and stability page network. You'll post under assigned personas and flag terrorist supporters for removal. Accommodation provided at the base."),
    ('influence', 'en', 'VN', "Online opinion team: build ordinary citizen accounts and correct wrong views about state policy in comment sections. Training in persona building provided."),
    ('influence', 'en', 'PH', "Social listening and engagement internship. Use the provided Facebook profiles (not your own) to join barangay groups and share news links from our partner pages. Brief sent daily. Allowance ₱7,000/month. NDA."),
    ('influence', 'en', 'GLOBAL', "Freelance community moderators wanted for a geopolitical news aggregator. You'll comment from accounts that appear to be local residents of the target countries, using VPN locations we specify."),
    ('influence', 'taglish', 'PH', "Hiring reactors! Mag-react at mag-share lang ng mga post ng aming kliyente gamit ang 5-10 dummy, ₱1 per react, ₱3 per share. Payout every Friday via GCash. Walang kailangang alamin tungkol sa kliyente."),
    ('influence', 'sw', 'KE', "Kazi ya mtandaoni: tunahitaji vijana 50 kutumia akaunti zetu za Twitter kusukuma hashtag ya chama kila jioni na kuwajibu wapinzani. Malipo KES 300 kila siku. Siri kabisa."),
    ('influence', 'id', 'ID', "Butuh pasukan komentar untuk isu RUU. Pakai akun yang kami sediakan, ikuti template komentar, dan serbu kolom komentar media online. Bayaran per 100 komentar."),
    ('influence', 'en', 'ET', "Digital diaspora engagement officers: post supportive content about the government's operations under multiple profiles and counter propaganda by activists abroad. Paid in birr."),
    ('influence', 'pt', 'BR', "Precisamos de influenciadores para postar vídeos elogiando o prefeito sem marcar como publicidade. Roteiro enviado pela agência. R$ 300 por vídeo."),
    ('influence', 'en', 'PH', "Write 20 testimonials a day from different accounts praising the new reclamation project in barangay groups. Photos and names are provided. ₱600/day. Don't say you're paid."),
    # ───────────────────────────── trafficking ─────────────────────────────
    ('trafficking', 'en', 'PH', "Good evening! Our gaming company near Bangkok needs English-speaking CSRs. ₱75k monthly, free dormitory. Since processing a work visa takes months, you'll leave as a tourist and our coordinator will assist you at the airport. Please keep this between us until you land."),
    ('trafficking', 'taglish', 'PH', "Sis may opening sa Cambodia, typing job lang, 70k ang sahod. Wala nang agency agency, ticket at hotel sagot ng boss. Turista ka lang muna sa papel. Pag sa immigration, sabihin mo pupunta ka sa birthday ng pinsan mo."),
    ('trafficking', 'en', 'PH', "Exit via Zamboanga is easier for applicants without OEC. Our guide will take you by ferry to Sandakan, then you'll fly to our office in Kota Kinabalu and later transfer."),
    ('trafficking', 'en', 'KE', "Thailand jobs!! Customer care agents needed, salary $1,500 + commission. Requirements: good English, computer literate, passport. Agency fee KES 120,000 covers ticket and visa. Interview via Zoom tomorrow; departure in 10 days."),
    ('trafficking', 'sw', 'KE', "Nafasi za kazi Bangkok: kazi ya kompyuta, mshahara mzuri. Tiketi tunalipa, utarudisha kutoka mshahara. Usiseme ni kazi ukifika uwanja wa ndege, sema ni likizo."),
    ('trafficking', 'en', 'UG', "Ugandan graduates wanted for IT support in Laos. We arrange everything: flight via Bangkok, then road transfer. Your passport will be held by HR for work permit processing."),
    ('trafficking', 'en', 'ET', "Job opportunity in Thailand for Ethiopians who speak English. Free air ticket, food and housing. You go first as a visitor, then the company fixes the papers."),
    ('trafficking', 'en', 'NG', "Hello! You've been shortlisted for Digital Sales Executive in Dubai (then our Asia branch). Visit visa provided. Your role: chat with foreign clients on dating apps and guide them to our crypto platform. Targets apply."),
    ('trafficking', 'hi', 'IN', "Bhai Thailand mein data entry ki job hai, 90k mahina. Agent ko 1 lakh dena hoga, baaki company dekhegi. Tourist visa pe jao, wahan pahunch ke kaam ka visa ban jayega. Airport pe ghoomne ka bolna."),
    ('trafficking', 'en', 'IN', "Golden opportunity in the Laos SEZ: digital marketing executive for a foreign company. No experience required. Salary $1,000. Contract 1 year; early exit penalty $5,000."),
    ('trafficking', 'en', 'BD', "Work in Cambodia: online customer service, 1,10,000 taka monthly, free flight. Go as tourist. Company keeps passport for security."),
    ('trafficking', 'en', 'NP', "Manpower opportunity: IT jobs in Myanmar via Thailand. No labour permit needed, we send you on visit visa. Pay 3 lakh NPR to the agent."),
    ('trafficking', 'en', 'LK', "IT data entry posts in Thailand for Sri Lankan youth, salary USD 1,200. Travel on a tourist visa; our representative will take you across to the office."),
    ('trafficking', 'en', 'PK', "Call center jobs in Bangkok! Free visa and ticket. Must be ready to fly within a week. Don't inform the Bureau of Emigration, it causes delays."),
    ('trafficking', 'id', 'ID', "Lowongan admin customer service di Kamboja. Gaji 1.000 USD. Tiket ditanggung. Berangkat pakai visa wisata, tanpa lewat agen resmi. Paspor nanti disimpan kantor."),
    ('trafficking', 'id', 'ID', "Kerja di Myanmar perbatasan Thailand, posisi marketing online. Tugas chatting dengan orang luar negeri. Tidak bisa pulang sebelum kontrak habis kecuali bayar denda."),
    ('trafficking', 'en', 'VN', "High-salary job in Cambodia for Vietnamese youth: online sales, 20 million dong per month, free food and lodging. We cross by road at Moc Bai. No contract needed."),
    ('trafficking', 'pt', 'BR', "Vaga de atendimento em inglês na Tailândia! Salário em dólar, passagem e moradia pagas. Você entra como turista e lá a empresa resolve. Não comente com a família o endereço exato por segurança."),
    ('trafficking', 'es', 'CO', "Oferta: soporte al cliente bilingüe en Bangkok. Pasajes pagos desde Bogotá. Viaje como turista; en el aeropuerto alguien te espera y te lleva a la empresa cerca de la frontera."),
    ('trafficking', 'es', 'MX', "Trabajo en Asia para jóvenes con inglés, 2,000 USD. No necesitas visa de trabajo. La empresa guarda los pasaportes para los trámites."),
    ('trafficking', 'fr', 'SN', "Opportunité en Thaïlande pour des jeunes francophones et anglophones: service client en ligne, 1 500 USD. Billet payé. Partez avec un visa touristique; une fois sur place, plus de démarches."),
    ('trafficking', 'fr', 'CM', "Travail en Asie: chat avec des clients pour vendre des placements. Logement gratuit dans l'enceinte de l'entreprise. Sortie non autorisée sans permission."),
    ('trafficking', 'en', 'GLOBAL', "Translator job (English/Chinese) in a tech park near Myawaddy. Salary negotiable. Free accommodation inside the park. Phones are collected at the start of each shift."),
    ('trafficking', 'en', 'PH', "We will provide you a dummy return ticket and hotel booking so immigration believes you're a tourist. Once in Bangkok, our van brings you to the workplace."),
    ('trafficking', 'taglish', 'PH', "Direct hire po tayo sa Laos, no need POEA/DMW. Basic English lang, encoding. Wag mo nang sabihin sa family mo kung saan exactly, basta abroad ka."),
    ('trafficking', 'en', 'KE', "If you can't pay the agent fee upfront, the company will deduct it from your salary. You'll repay the ticket, visa and accommodation before receiving full pay. Departure to Thailand next Friday."),
    ('trafficking', 'en', 'MY', "Work in Sihanoukville as a game operator. Basic computer skills. No work permit required. Your boss will keep the passport so it doesn't get lost."),
    ('trafficking', 'en', 'GH', "Exciting role in Asia: Customer Retention Officer. Build friendships with clients online and encourage deposits on our investment app. Flight paid, visa on arrival."),
    ('trafficking', 'fil', 'PH', "May trabaho sa Myanmar bilang chat support. Libre ang lahat. Pero bawal ka umalis hangga't hindi tapos ang isang taon, kung hindi magbabayad ka ng 300k."),
    ('trafficking', 'en', 'NP', "Hotel job in Dubai; after two weeks of training you'll be transferred to our sister company in Laos. A tourist visa is enough."),
    # ───────────────────────────── scam ─────────────────────────────
    ('scam', 'en', 'PH', "Hi! This is Ms. Carla from the Digital Hiring Team. Earn ₱800–₱5,000 daily by liking TikTok videos. Add our mentor on Telegram to receive your first ₱120 bonus."),
    ('scam', 'taglish', 'PH', "Need ka ng extra? Rate ka lang ng hotels, may commission. Pero kailangan mo munang mag-deposit ng ₱1,500 para ma-unlock ang combo tasks."),
    ('scam', 'en', 'PH', "Congratulations, you passed our online interview. Kindly settle the ₱2,450 medical and training fee to the account of our HR officer (GCash) so we can process your company ID."),
    ('scam', 'en', 'KE', "Supermarket jobs available in Nairobi! Pay KES 1,500 registration and get placed within 48 hours. Send to till number."),
    ('scam', 'sw', 'KE', "Ajira za haraka: tuma KES 800 ya fomu kupitia M-Pesa ili upate interview."),
    ('scam', 'en', 'NG', "Federal agency recruitment 2026: buy the application form for ₦7,500 at our portal to be considered."),
    ('scam', 'en', 'GH', "Earn GHS 300 daily from your phone. You only need to subscribe to YouTube channels. A starter fee of GHS 100 is required."),
    ('scam', 'hi', 'IN', "Work from home: YouTube video like karo, har like ka ₹50. Pehle ₹1,000 ka task karna hoga, refund ke saath ₹1,300 milenge."),
    ('scam', 'en', 'IN', "Product review job. Pay ₹1,999 security deposit to start; earn ₹3,000/day."),
    ('scam', 'en', 'BD', "Online job: earn 2,000 taka daily. Registration 500 taka via bKash. No experience."),
    ('scam', 'en', 'PK', "Govt department jobs: pay Rs 2,500 test fee via JazzCash to the number below."),
    ('scam', 'id', 'ID', "Kerja paruh waktu: beri like ke video, komisi Rp 10.000 per tugas. Untuk tugas premium wajib top up Rp 500.000."),
    ('scam', 'pt', 'BR', "Vaga de avaliador de produtos: ganhe R$ 200 por dia. Para começar, pague a taxa de ativação de R$ 79 via Pix."),
    ('scam', 'es', 'MX', "¡Gana 1,500 pesos al día! Solo sigue cuentas y comparte capturas. Para retirar, primero deposita 500 pesos de verificación."),
    ('scam', 'es', 'CO', "Te ofrecemos trabajo como agente de pagos: recibes transferencias en tu cuenta y las envías a nuestro proveedor. Te quedas con el 10%."),
    ('scam', 'en', 'ZA', "Become a payment agent: receive client funds into your account and forward them after deducting 8% commission."),
    ('scam', 'en', 'PH', "Earn ₱3,000/week by renting out your GCash. We just need your MPIN and the OTP once."),
    ('scam', 'en', 'PH', "Urgent hiring: data encoders. ₱25,000 monthly. Reservation fee of ₱500 to secure your slot; refundable after training."),
    ('scam', 'en', 'NG', "Your CV was selected for an oil company job abroad. Pay $250 for visa processing and $150 for medicals before the interview."),
    ('scam', 'fr', 'CI', "Recrutement à la douane: frais de dossier 25 000 FCFA à verser par Orange Money avant le test."),
    ('scam', 'en', 'UG', "Data entry work, UGX 50,000 daily. Pay UGX 30,000 for training materials first."),
    ('scam', 'en', 'KE', "Hello, I'm a recruiter. Please send a photo of your ID front and back, and your M-Pesa PIN so we can pay your salary."),
    ('scam', 'taglish', 'PH', "Pwede ba namin hiramin ang SIM mo? Iparerehistro lang namin sa pangalan mo, ₱200 kada SIM."),
    ('scam', 'id', 'ID', "Butuh orang untuk buka rekening bank atas nama sendiri lalu serahkan ke kami. Imbalan Rp 1 juta per rekening."),
    ('scam', 'en', 'IN', "Telegram task job: complete prepaid merchant tasks to earn 30% returns. Deposit increases with each level."),
    ('scam', 'en', 'GLOBAL', "We have reviewed your profile and you are hired as a remote assistant. Buy the work laptop from our approved vendor ($450); we will reimburse it in your first paycheck."),
    ('scam', 'en', 'GLOBAL', "Mystery shopper job: we'll send you a cheque; deposit it, keep $300, and wire the rest to our agent."),
    ('scam', 'en', 'VN', "Part-time job: order boosting for online shops. Pay first, receive a refund with commission within 10 minutes."),
    ('scam', 'pt', 'BR', "Seu CPF foi aprovado para vaga temporária! Envie uma selfie com documento e o código que receber por SMS."),
    ('scam', 'en', 'NP', "Online typing job, earn NPR 2,000 per day. Pay NPR 1,000 to receive the software license."),
    # ───────────────────────────── legit (look-alikes) ─────────────────────────────
    ('legit', 'en', 'PH', "Social Media Manager, Sari-Sari Snacks Co. (Pasig). Own the brand's official Facebook, Instagram and TikTok accounts; plan content; reply to customer messages; brief influencers and ensure #ad disclosures. ₱35k–₱45k, HMO, 13th month. Apply via our website."),
    ('legit', 'en', 'PH', "Content Moderator (night shift), BGC. Review flagged posts and accounts for hate speech, impersonation and misinformation according to client policy. Wellness breaks and psychological support. ₱26k + night differential."),
    ('legit', 'en', 'PH', "Fact-check Intern for an independent newsroom. Verify viral posts about the elections, trace manipulated photos, and help document troll networks. Byline credit. Allowance ₱10,000/month."),
    ('legit', 'en', 'PH', "Communications Assistant, Office of the Mayor of Iloilo City. Update the city's verified Facebook page, write advisories, and coordinate press releases. Plantilla position; apply through the city HR office."),
    ('legit', 'en', 'PH', "Hiring Nurses for Saudi Arabia (MOH). DMW License No. 012-LB-02152023-R. Free airfare, housing and transport per contract. No placement fee. Process: interview, medical, visa, OEC, PDOS, then deployment."),
    ('legit', 'en', 'PH', "Caregivers for Japan (Specified Skilled Worker). Japanese language training provided. Deployed through a DMW-licensed agency; you keep your passport; contract verified by the Migrant Workers Office in Tokyo."),
    ('legit', 'taglish', 'PH', "Hiring Chat Support! Cebu IT Park. ₱22k + HMO + night diff. Walk-in tayo Mon–Fri, dala lang ng resume at 2 valid IDs. Walang bayad ang application at training."),
    ('legit', 'en', 'TH', "English Teacher in Chiang Mai. The school provides a Non-Immigrant B visa and work permit before you start. Contract in English and Thai; you hold your own passport. Salary 35,000 THB."),
    ('legit', 'en', 'KH', "Program Officer, child protection NGO in Phnom Penh. Work permit sponsored; office address listed on our website; references required. Salary USD 1,400."),
    ('legit', 'en', 'KE', "Customer Experience Agent at a Nairobi BPO (Upper Hill). Written contract, NHIF and NSSF contributions. We never charge recruitment fees. Apply on our careers portal."),
    ('legit', 'sw', 'KE', "Nafasi: Msimamizi wa mitandao ya kijamii kwa kampuni ya maziwa. Utaendesha akaunti rasmi za kampuni. Mkataba wa maandishi, hakuna ada yoyote."),
    ('legit', 'en', 'NG', "Social Media Executive for a fintech in Lagos. Manage the company's official pages, respond to customers, report on campaign analytics. HMO and pension. Interview at our Victoria Island office."),
    ('legit', 'en', 'GH', "Researcher, Disinformation and Elections, Accra-based civic tech nonprofit. Monitor coordinated inauthentic behaviour and paid influencer campaigns, and publish public reports."),
    ('legit', 'en', 'IN', "Social Media Executive (Bengaluru). Manage our verified brand handles, coordinate influencer collaborations with clear #ad disclosures, and track campaign analytics. CTC ₹4–6 LPA, PF, health insurance."),
    ('legit', 'hi', 'IN', "Hum Delhi mein customer support executive hire kar rahe hain. Offer letter, PF, ESI. Interview office mein. Hum kabhi koi fees nahi lete."),
    ('legit', 'en', 'IN', "Electricians for Qatar through an eMigrate-registered recruiting agent (RA licence displayed in office). Emigration clearance and work visa before departure. Service charge per government cap, with receipt."),
    ('legit', 'id', 'ID', "Lowongan Admin Media Sosial di Jakarta Selatan. Mengelola akun resmi brand, membuat konten, membalas pesan pelanggan. BPJS, gaji UMR+, interview di kantor. Tidak ada biaya."),
    ('legit', 'id', 'ID', "Penempatan pekerja ke Taiwan melalui P3MI resmi terdaftar di KP2MI. Visa kerja, perjanjian kerja, dan pelatihan sebelum berangkat."),
    ('legit', 'pt', 'BR', "Analista de Social Media, agência em São Paulo. Gestão dos perfis oficiais de clientes, relatórios e identificação de publi. CLT, VR, plano de saúde."),
    ('legit', 'es', 'MX', "Moderador de contenido en español (Guadalajara). Revisión de publicaciones según las políticas de la plataforma, incluida la detección de cuentas falsas. Prestaciones de ley, apoyo psicológico."),
    ('legit', 'es', 'CO', "Periodista verificador para un medio digital en Bogotá. Verificar contenidos virales y explicar la metodología al público."),
    ('legit', 'fr', 'SN', "Chargé(e) de communication, ONG de santé à Dakar. Gestion des pages officielles de l'ONG, rédaction des communiqués. CDI. Aucun frais de recrutement."),
    ('legit', 'en', 'ZA', "Campaign Volunteer Coordinator for a registered political party. Organise door-to-door canvassing and run the party's official social accounts with Authorised by notices. Volunteers sign a code of conduct."),
    ('legit', 'en', 'GLOBAL', "Data Annotator (remote). Label text and images for AI safety research through our platform. Weekly pay to your bank. No fees, ever. Use only your own single account."),
    ('legit', 'en', 'GLOBAL', "Virtual Assistant for a Canadian real estate agent. Schedule posts on the agent's own pages, manage email and calendar. Paid via Wise. Contract through a freelancing platform."),
    ('legit', 'en', 'PH', "Brand Ambassador program: post honest reviews of our skincare from your personal account; each post must say Paid partnership. We never provide accounts."),
    ('legit', 'en', 'PH', "Hotel Staff for Dubai, DMW-accredited employer. Employment visa processed before departure; OEC required. Never pay through personal e-wallets. Verify our job order at the DMW website."),
    ('legit', 'en', 'NP', "Factory workers for Malaysia: Department of Foreign Employment approved demand letter, labour permit issued before departure, free-visa free-ticket scheme as per government policy."),
    ('legit', 'en', 'UG', "Externalisation of labour: licensed company (Ministry of Gender, Labour and Social Development licence displayed) recruiting security guards for Qatar; contract attested before travel."),
    ('legit', 'en', 'GLOBAL', "Trust and Safety Analyst: investigate influence operations and remove fake account networks. Remote. Background in OSINT preferred."),
]


def main():
    labels = {}
    for label, *_ in ROWS:
        labels[label] = labels.get(label, 0) + 1
    assert all(n == 30 for n in labels.values()), labels
    with OUT.open('w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'label', 'lang', 'region', 'text'])
        for i, (label, lang, region, text) in enumerate(ROWS, 1):
            writer.writerow([f'C{i:03d}', label, lang, region, text])
    print(f'Wrote {len(ROWS)} rows to {OUT}: {labels}')


if __name__ == '__main__':
    main()
