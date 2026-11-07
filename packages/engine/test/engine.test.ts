import { describe, expect, it } from 'vitest';
import { analyze, assess, countryFromPhone, handleTiplineMessage, nextStep, searchFaq, detectLanguage, type Answers } from '../src';
import { getDefaultClassifier } from '../src/default-classifier';

const classifier = getDefaultClassifier();

describe('analyze', () => {
  it('flags covert political influence work as high', () => {
    const a = analyze('Part-time job: comment on the governor\'s live videos using the 5 accounts we provide. Talking points sent daily. The client is confidential. ₱450 per night.', { classifier });
    expect(a.verdict).toBe('high');
    expect(a.topCategory).toBe('influence');
    expect(a.questions.map((q) => q.id)).toContain('Q_OWN_ACCOUNTS');
  });

  it('flags scam-compound recruitment as high trafficking risk', () => {
    const a = analyze('Customer service job in Cambodia, $1,500 a month, free flight and housing. Travel on a tourist visa, the company will process your work permit after arrival.', { classifier });
    expect(a.verdict).toBe('high');
    expect(a.topCategory).toBe('trafficking');
  });

  it('flags OTP and e-wallet requests as a high-risk scam', () => {
    const a = analyze('Hi! Earn ₱3,000 a week by renting out your GCash. We just need your MPIN and the OTP once.', { classifier });
    expect(a.verdict).toBe('high');
    expect(a.topCategory).toBe('scam');
  });

  it('does not flag a content moderator job', () => {
    const a = analyze('Content Moderator, BGC. Review flagged posts and remove fake accounts and misinformation according to platform policy. HMO, night differential. Apply via our careers page.', { classifier });
    expect(a.verdict).toBe('low');
  });

  it('does not flag a licensed overseas nursing job', () => {
    const a = analyze('Staff Nurses for Saudi Arabia. DMW License No. 012-LB-02152023-R. Free airfare and housing per contract. No placement fee. Work visa processed before departure; OEC and PDOS required.', { classifier });
    expect(a.categories.trafficking.level).toBe('low');
    expect(a.verdict).not.toBe('high');
  });

  it('says unclear for tiny inputs', () => {
    expect(analyze('ok', { classifier }).verdict).toBe('unclear');
  });

  it('works without a classifier', () => {
    const a = analyze('Kazi Thailand, tiketi bure. Utasafiri kwa visa ya utalii. Kampuni itashika pasipoti yako.');
    expect(a.verdict).toBe('high');
    expect(a.model).toBeNull();
  });
});

describe('assessment chatbot', () => {
  it('walks through steps and stops', () => {
    const answers: Answers = {};
    let guard = 0;
    for (let step = nextStep(answers); step && guard < 30; step = nextStep(answers), guard++) {
      answers[step.id] = [step.options[0]!.id];
    }
    expect(nextStep(answers)).toBeNull();
  });

  it('rates fake accounts plus political content as high influence risk', () => {
    const r = assess({ situation: ['considering'], country: ['PH'], work: ['social'], where: ['home'], posting: ['yes'], accounts: ['provided'], topic: ['politics'], instructions: ['scripts'], money: ['none'], pay: ['normal'], process: ['none'] });
    expect(r.levels.influence).toBe('high');
    expect(r.topCategory).toBe('influence');
    expect(r.help.some((h) => h.phone === '1343')).toBe(true);
  });

  it('marks taken passports as urgent', () => {
    const r = assess({ situation: ['started'], inside: ['passport_taken'] });
    expect(r.urgent).toBe(true);
    expect(r.levels.trafficking).toBe('high');
  });

  it('skips abroad questions for local jobs', () => {
    expect(nextStep({ situation: ['considering'], country: ['KE'], work: ['chat'], where: ['local'] })?.id).toBe('posting');
  });
});

describe('tipline', () => {
  it('welcomes and answers commands', () => {
    expect(handleTiplineMessage({ text: 'hi' }).kind).toBe('welcome');
    const help = handleTiplineMessage({ text: 'HELP', from: 'whatsapp:+2348012345678' });
    expect(help.messages.join('\n')).toContain('NAPTIP');
  });

  it('analyses a forwarded message with local hotlines', () => {
    const r = handleTiplineMessage({ text: 'Hiring CSR sa Thailand! ₱80k/month, libre flight. Tourist visa lang muna. Pag tinanong ka ng immigration, sabihin mo bakasyon lang.', from: 'whatsapp:+639171234567' }, { classifier });
    expect(r.kind).toBe('analysis');
    const body = r.messages.join('\n');
    expect(body).toContain('HIGH RISK');
    expect(body).toContain('1343');
    r.messages.forEach((m) => expect(m.length).toBeLessThanOrEqual(1600));
  });

  it('asks for text when an image arrives', () => {
    expect(handleTiplineMessage({ text: '', numMedia: 1, mediaTypes: ['image/jpeg'] }).kind).toBe('media');
  });
});

describe('helpers', () => {
  it('maps phone numbers to countries', () => {
    expect(countryFromPhone('whatsapp:+254712345678')?.code).toBe('KE');
    expect(countryFromPhone('+639171234567')?.code).toBe('PH');
  });
  it('answers FAQ questions locally', () => {
    expect(searchFaq('they said tourist visa is fine and fix work permit later')[0]?.entry.id).toBe('tourist_visa');
    expect(searchFaq('what is a troll farm')[0]?.entry.id).toBe('what_is_troll_farm');
  });
  it('guesses languages', () => {
    expect(detectLanguage('Hiring kami ng part-time, may sahod agad, message lang sa Telegram para sa task')).toBe('fil');
    expect(detectLanguage('Trabajo en Tailandia con pasaje pagado para atención al cliente')).toBe('es');
  });
});
