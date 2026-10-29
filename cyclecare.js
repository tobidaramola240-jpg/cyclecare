/**
 * CycleCare — Modern Women's Health & Mindful Cycle Companion
 * Powered by React 18, Tailwind CSS, and Local-First Privacy Architecture.
 */

(function () {
  'use strict';

  const React = typeof window !== 'undefined' ? window.React : (typeof global !== 'undefined' ? global.React : null);
  const ReactDOM = typeof window !== 'undefined' ? window.ReactDOM : (typeof global !== 'undefined' ? global.ReactDOM : null);

  if ((!React || !ReactDOM) && typeof module === 'undefined') {
    console.error('React or ReactDOM not found. Please ensure React 18 is loaded in index.html.');
    return;
  }

  const { useState, useEffect, useMemo } = React || {};
  const h = React ? React.createElement : () => {};

  // ==================== 1. DEFAULT SAMPLE DATA ====================
  const DEFAULT_USER_PROFILE = {
    name: 'Maya Chen',
    isAnonymous: false,
    goal: 'track_period',
    lastPeriodStartDate: '2026-10-15',
    averageCycleLength: 28,
    averagePeriodLength: 5,
    lutealPhaseLength: 14,
    isIrregularCycle: false,
    pinLockEnabled: false,
    pinCode: '1234',
    biometricSimulation: true,
    periodReminderEnabled: true,
    discreetNotifications: true,
    periodReminderDaysBefore: 2,
    fertileAlert: true,
    pillReminderEnabled: true,
    pillReminderTime: '09:00',
    appMode: 'period', // 'period' | 'ttc' | 'pregnancy'
    pregnancyDueDate: '2027-05-15',
    pregnancyWeeks: 12,
    prenatalVitaminTaken: true,
    lhTestResult: 'peak',
    hasCompletedOnboarding: true,
  };

  const INITIAL_LOGS = {
    '2026-10-15': {
      date: '2026-10-15',
      isPeriodDay: true,
      flow: 'medium',
      symptoms: ['cramps_mild', 'backache', 'fatigue'],
      moods: ['low', 'sensitive'],
      energy: 'sluggish',
      sleepHours: 7.0,
      sleepQuality: 'fair',
      waterGlasses: 6,
      notes: 'Period arrived this morning. Cozy herbal tea and warm heating pad helped.',
      pillTaken: true,
    },
    '2026-10-16': {
      date: '2026-10-16',
      isPeriodDay: true,
      flow: 'heavy',
      symptoms: ['cramps_severe', 'backache', 'bloating'],
      moods: ['sensitive', 'irritable'],
      energy: 'exhausted',
      sleepHours: 8.0,
      sleepQuality: 'fair',
      waterGlasses: 7,
      notes: 'Heavy flow day. Rested after work with magnesium balm.',
      pillTaken: true,
    },
    '2026-10-17': {
      date: '2026-10-17',
      isPeriodDay: true,
      flow: 'medium',
      symptoms: ['cramps_mild', 'fatigue'],
      moods: ['calm'],
      energy: 'sluggish',
      sleepHours: 7.5,
      sleepQuality: 'restful',
      waterGlasses: 8,
      notes: 'Cramps easing off nicely.',
      pillTaken: true,
    },
    '2026-10-18': {
      date: '2026-10-18',
      isPeriodDay: true,
      flow: 'light',
      symptoms: ['bloating'],
      moods: ['calm', 'happy'],
      energy: 'balanced',
      sleepHours: 8.0,
      sleepQuality: 'restful',
      waterGlasses: 8,
      pillTaken: true,
    },
    '2026-10-19': {
      date: '2026-10-19',
      isPeriodDay: true,
      flow: 'spotting',
      symptoms: [],
      moods: ['happy', 'energetic'],
      energy: 'high',
      sleepHours: 7.5,
      sleepQuality: 'restful',
      waterGlasses: 9,
      notes: 'Last day of flow. Energy rebounding noticeably!',
      pillTaken: true,
    },
    '2026-10-21': {
      date: '2026-10-21',
      isPeriodDay: false,
      flow: 'none',
      symptoms: [],
      moods: ['energetic', 'happy'],
      cervicalFluid: 'sticky',
      energy: 'high',
      sleepHours: 8.0,
      sleepQuality: 'restful',
      waterGlasses: 8,
      notes: 'Great workout session. Felt focused and mentally sharp.',
      pillTaken: true,
    },
    '2026-10-24': {
      date: '2026-10-24',
      isPeriodDay: false,
      flow: 'none',
      symptoms: [],
      moods: ['happy', 'energetic'],
      cervicalFluid: 'creamy',
      energy: 'high',
      sleepHours: 7.5,
      sleepQuality: 'restful',
      waterGlasses: 8,
      libido: 'moderate',
      pillTaken: true,
    },
    '2026-10-27': {
      date: '2026-10-27',
      isPeriodDay: false,
      flow: 'none',
      symptoms: ['pelvic_pressure'],
      moods: ['energetic', 'happy'],
      cervicalFluid: 'egg_white',
      energy: 'high',
      sleepHours: 8.0,
      sleepQuality: 'restful',
      waterGlasses: 8,
      libido: 'high',
      temperature: 97.7,
      sexActivity: 'protected',
      notes: 'Clear egg-white discharge observed. Mild unilateral twinge.',
      pillTaken: true,
    },
    '2026-10-28': {
      date: '2026-10-28',
      isPeriodDay: false,
      flow: 'none',
      symptoms: ['tender_breasts'],
      moods: ['energetic', 'calm'],
      cervicalFluid: 'egg_white',
      energy: 'high',
      sleepHours: 7.8,
      sleepQuality: 'restful',
      waterGlasses: 9,
      libido: 'high',
      temperature: 97.9,
      sexActivity: 'protected',
      notes: 'Ovulation peak. Mood is vibrant and social.',
      pillTaken: true,
    },
    '2026-10-29': {
      date: '2026-10-29',
      isPeriodDay: false,
      flow: 'none',
      symptoms: ['tender_breasts'],
      moods: ['calm', 'happy'],
      cervicalFluid: 'egg_white',
      energy: 'high',
      sleepHours: 8.0,
      sleepQuality: 'restful',
      waterGlasses: 6,
      libido: 'high',
      temperature: 98.2,
      sexActivity: 'protected',
      notes: 'Today: Estimated peak ovulation window. Feeling energized and balanced.',
      pillTaken: true,
    },
  };

  const INITIAL_PAST_CYCLES = [
    {
      id: 'cycle-5',
      startDate: '2026-09-17',
      endDate: '2026-10-14',
      cycleLength: 28,
      periodDuration: 5,
      ovulationDate: '2026-09-30',
      symptomsSummary: ['Mild cramps Day 1-2', 'Headache Day 27', 'Egg-white mucus Day 14'],
    },
    {
      id: 'cycle-4',
      startDate: '2026-08-20',
      endDate: '2026-09-16',
      cycleLength: 28,
      periodDuration: 5,
      ovulationDate: '2026-09-02',
      symptomsSummary: ['Heavy flow Day 2', 'Tender breasts Day 24-27', 'Peak libido Day 13'],
    },
    {
      id: 'cycle-3',
      startDate: '2026-07-22',
      endDate: '2026-08-19',
      cycleLength: 29,
      periodDuration: 6,
      ovulationDate: '2026-08-05',
      symptomsSummary: ['Backache Day 1', 'Bloating Day 26', 'High energy follicular phase'],
    },
    {
      id: 'cycle-2',
      startDate: '2026-06-24',
      endDate: '2026-07-21',
      cycleLength: 28,
      periodDuration: 5,
      ovulationDate: '2026-07-07',
      symptomsSummary: ['Moderate cramps', 'Clear skin ovulation', 'Mild PMS moodiness'],
    },
    {
      id: 'cycle-1',
      startDate: '2026-05-26',
      endDate: '2026-06-23',
      cycleLength: 29,
      periodDuration: 5,
      ovulationDate: '2026-06-09',
      symptomsSummary: ['Spotting on Day 5', 'Headache Day 28', 'Regular flow pattern'],
    },
    {
      id: 'cycle-0',
      startDate: '2026-04-28',
      endDate: '2026-05-25',
      cycleLength: 28,
      periodDuration: 5,
      ovulationDate: '2026-05-11',
      symptomsSummary: ['Light cramping', 'Optimal basal temperature shift detected'],
    },
  ];


  const ARTICLES_DATA = [
    {
      id: 'season-of-cycle',
      title: 'The 4 Seasons of Your Cycle: Understanding Your Hormonal Rhythm',
      subtitle: 'How estrogen and progesterone shift your mood, energy, and cognitive focus every week.',
      category: 'hormones',
      readTimeMinutes: 5,
      featuredImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
      author: 'Dr. Elena Vance, MD',
      authorTitle: 'Endocrinology & Women\'s Health Specialist',
      publishDate: 'Oct 20, 2026',
      medicalReviewer: 'Dr. Sarah Jenkins, MD, FACOG',
      medicalReviewerTitle: 'Board Certified Obstetrician & Gynecologist',
      reviewDate: 'October 18, 2026',
      sources: [
        {
          title: 'Physiology of the Menstrual Cycle',
          citation: 'The Journal of Clinical Endocrinology & Metabolism, Oxford University Press',
          year: '2024',
        },
        {
          title: 'Estrogen, Progesterone, and Cognitive Neurobiology',
          citation: 'Nature Reviews Neuroscience',
          year: '2023',
        },
      ],
      disclaimer: 'Medical Disclaimer: This educational article is strictly for informational and cycle literacy purposes. It does not provide medical diagnoses or replace direct consultation with a qualified physician.',
      isBookmarked: true,
      summary: 'A complete guide to aligning your schedule, workouts, and nutrition with the four biological phases of your menstrual cycle.',
      keyTakeaways: [
        'Winter (Menstrual): Baseline hormones; optimal time for deep rest, gentle movement, and iron-rich foods.',
        'Spring (Follicular): Estrogen ascends; peak time for creative ideation, social bonding, and high learning speed.',
        'Summer (Ovulatory): Estrogen & LH peak; maximal confidence, communication charisma, and physical strength.',
        'Autumn (Luteal): Progesterone dominates; prioritize completing projects, calming the nervous system, and complex carbs.',
      ],
      contentParagraphs: [
        'For decades, conventional wellness routines treated the body as though every single 24-hour cycle was identical. Yet for individuals with menstrual cycles, our physiology operates on a continuous 28-to-30-day infradian rhythm modulating metabolism, immune response, brain chemistry, and stress tolerance.',
        'During the Follicular phase, follicle-stimulating hormone (FSH) prompts the ovaries to nurture mature follicles. Estrogen steadily climbs, stimulating serotonin production in the brain. You may naturally feel more optimistic, social, and resilient to physical exertion.',
        'At Ovulation—typically around Day 14 of an average 28-day cycle—estrogen reaches its crest, accompanied by a surge of luteinizing hormone (LH). This window triggers the release of an ovum. Energy, libido, and vocal resonance often peak here.',
        'Following ovulation, the ruptured follicle transforms into the corpus luteum, pumping out progesterone. Progesterone has a natural GABA-ergic, soothing effect on the brain. However, as it tapers toward the end of the luteal phase, the sudden drop can provoke premenstrual sensitivity or physical bloating.',
        'When you learn to honor each season rather than fight your biology, cyclical fatigue transforms into cyclical empowerment.'
      ],
    },
    {
      id: 'cycle-syncing-nutrition',
      title: 'Cycle Syncing Your Nutrition: What to Plate in Each Phase',
      subtitle: 'Nourish your microbiome and optimize liver metabolism for smooth hormonal transitions.',
      category: 'nutrition',
      readTimeMinutes: 6,
      featuredImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
      author: 'Sora Tanaka, MS, RD',
      authorTitle: 'Clinical Nutritionist & Hormone Health Coach',
      publishDate: 'Oct 14, 2026',
      medicalReviewer: 'Dr. Rebecca Martinez, MD, MS',
      medicalReviewerTitle: 'Integrative Women\'s Health Physician',
      reviewDate: 'October 12, 2026',
      sources: [
        {
          title: 'Energy Expenditure Across the Menstrual Cycle',
          citation: 'The American Journal of Clinical Nutrition',
          year: '2023',
        },
        {
          title: 'Dietary Micronutrients in Premenstrual Symptom Mitigation',
          citation: 'Journal of the Academy of Nutrition and Dietetics',
          year: '2025',
        },
      ],
      disclaimer: 'Medical Disclaimer: Nutritional guidance in this article provides general educational information and is not personalized dietary or medical treatment. Consult an accredited dietitian or physician before changing your dietary regimen.',
      isBookmarked: false,
      summary: 'Discover key micronutrients like magnesium, zinc, B-vitamins, and cruciferous glucosinolates that support hormone clearance and energy.',
      keyTakeaways: [
        'Menstrual: Rebuild red blood cells with iron-rich legumes, leafy greens, and vitamin C for bioavailability.',
        'Follicular: Support developing eggs with fermented foods, sprouted grains, and healthy omega-3 fatty acids.',
        'Ovulatory: Support estrogen clearance through cruciferous vegetables (broccoli, arugula) rich in DIM and calcium d-glucarate.',
        'Luteal: Stabilize blood sugar with sweet root veggies, pumpkin seeds, magnesium glycinate, and adequate complex carbs.',
      ],
      contentParagraphs: [
        'Nutritional demands are not static across the menstrual cycle. In the luteal phase, for example, resting metabolic rate increases by roughly 100 to 300 calories per day as the body produces heat and maintains the uterine lining.',
        'A common pitfall is attempting strict calorie restriction during the late luteal phase. When blood sugar drops, cortisol elevates, which further exacerbates PMS irritability, cravings, and sleep disruptions.',
        'Incorporating slow-burning complex carbohydrates—such as roasted squash, sweet potatoes, and quinoa—provides sustained glucose that supports thyroid function and serotonin synthesis.',
        'Hydration also needs phase-specific attention. In the days leading to menstruation, progesterone causes slight sodium and fluid retention in tissues while leaving blood volume lower. Drinking electrolyte-rich water counteracts cellular dehydration and reduces menstrual migraine frequency.'
      ],
    },
    {
      id: 'ovulation-demystified',
      title: 'Ovulation Demystified: Cervical Mucus, Basal Temp & Fertile Windows',
      subtitle: 'How to accurately pinpoint your fertile days whether trying to conceive or avoiding pregnancy.',
      category: 'fertility',
      readTimeMinutes: 4,
      featuredImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      author: 'Dr. Rachel Aris, OB/GYN',
      authorTitle: 'Reproductive Endocrinology Consultant',
      publishDate: 'Oct 02, 2026',
      medicalReviewer: 'Dr. Sarah Jenkins, MD, FACOG',
      medicalReviewerTitle: 'Board Certified Obstetrician & Gynecologist',
      reviewDate: 'October 15, 2026',
      sources: [
        {
          title: 'Diagnostic Evaluation of the Fertile Window',
          citation: 'The New England Journal of Medicine (NEJM)',
          year: '2023',
        },
        {
          title: 'ACOG Clinical Guidelines: Fertility Awareness-Based Methods',
          citation: 'American College of Obstetricians and Gynecologists',
          year: '2024',
        },
      ],
      disclaimer: 'Medical Disclaimer: Fertility windows generated in this app are statistical estimates and must not be used as contraception or medical fertility guarantees. Consult a reproductive endocrinologist or OB/GYN for personalized fertility evaluation.',
      isBookmarked: true,
      summary: 'The science behind fertility awareness: tracking basal body temperature shifts, cervical fluid patterns, and LH test strips.',
      keyTakeaways: [
        'Sperm can survive in fertile cervical mucus for up to 5 days, while an egg survives for 12-24 hours after release.',
        'Your fertile window is approximately 6 days: the 5 days leading up to ovulation plus ovulation day itself.',
        'Cervical fluid shifts from dry/sticky to creamy, culminating in clear, slippery "raw egg white" consistency at peak fertility.',
        'Basal Body Temperature (BBT) rises 0.4°F - 0.8°F after ovulation occurs, confirming the egg has already been released.',
      ],
      contentParagraphs: [
        'While mobile apps use standard mathematical algorithms to estimate ovulation, your actual biological signs provide real-time confirmation of your fertility status.',
        'Cervical mucus is produced by crypts inside the cervix in response to rising estrogen. When estrogen is low, mucus acts as a barrier. As ovulation nears, estrogen thins the mucus into parallel micro-channels that nourish and propel sperm.',
        'Tracking your basal body temperature using a two-decimal thermometer immediately upon waking reveals a distinct biphasic pattern: lower temperatures pre-ovulation and a steady rise post-ovulation sustained by thermogenic progesterone.',
        'Together, cervical mucus observation and BBT tracking provide over 98% accuracy in charting your cycle rhythms when practiced consistently.'
      ],
    },
    {
      id: 'cramps-and-pain-guide',
      title: 'Cramps & Pelvic Pain: What Is Normal vs. When to Seek Medical Care',
      subtitle: 'Distinguishing between primary dysmenorrhea and secondary indicators like endometriosis or fibroids.',
      category: 'basics',
      readTimeMinutes: 5,
      featuredImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
      author: 'Dr. Naomi Sterling, MD',
      authorTitle: 'Gynecologic Surgeon & Women\'s Health Advocate',
      publishDate: 'Sep 26, 2026',
      medicalReviewer: 'Dr. Patricia Alvarez, MD, FACOG',
      medicalReviewerTitle: 'Minimally Invasive Gynecologic Surgery Specialist',
      reviewDate: 'September 24, 2026',
      sources: [
        {
          title: 'Clinical Practice Guideline: Dysmenorrhea and Pelvic Pain',
          citation: 'Obstetrics & Gynecology (Green Journal), ACOG',
          year: '2024',
        },
        {
          title: 'Global Consensus on the Diagnosis of Endometriosis',
          citation: 'World Health Organization (WHO)',
          year: '2023',
        },
      ],
      disclaimer: 'Medical Disclaimer: This guide is educational and non-diagnostic. Severe pelvic pain, pain accompanied by vomiting or syncope, or pain that resists standard analgesics requires thorough clinical examination by a physician.',
      isBookmarked: false,
      summary: 'A compassionate, evidence-based guide on menstrual prostaglandins, pain thresholds, and advocating for your pelvic health.',
      keyTakeaways: [
        'Primary dysmenorrhea is caused by prostaglandins causing uterine contractions and typically responds well to heat and anti-inflammatories.',
        'Severe pain that renders you bedridden, does not respond to NSAIDs, or occurs throughout the entire month warrants clinical evaluation.',
        'Red flags to discuss with your provider: pain during intercourse, deep bowel pain during periods, or unexplained heavy bleeding.',
        'Natural relief options backed by clinical trials: topical heat therapy (40°C), ginger root extract, and magnesium glycinate.',
      ],
      contentParagraphs: [
        'Mild to moderate cramping during the first 24 to 48 hours of your period is a standard physiological consequence of the uterus shedding its endometrium. To accomplish this, the endometrium produces prostaglandins (specifically PGF2-alpha), which cause muscular contractions.',
        'However, severe pain that causes nausea, vomiting, fainting, or inability to attend school or work is NOT "just part of being a woman." Pain of this magnitude may indicate secondary dysmenorrhea, including conditions such as endometriosis, adenomyosis, or uterine leiomyomas (fibroids).',
        'Keeping an objective symptom diary in CycleCare—documenting pain level on a 1-10 scale, exact cycle days, and medication response—is the most powerful tool you can bring to an appointment with your OB/GYN.',
        'Do not hesitate to seek a second opinion if your concerns are dismissed. Compassionate, thorough pelvic health care is a fundamental right.'
      ],
    },
    {
      id: 'pms-vs-pmdd',
      title: 'PMS vs. PMDD: Recognizing the Signs and Finding Real Relief',
      subtitle: 'Understanding Premenstrual Dysphoric Disorder as a neurobiological sensitivity to normal hormone shifts.',
      category: 'wellness',
      readTimeMinutes: 4,
      featuredImage: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?auto=format&fit=crop&w=800&q=80',
      author: 'Dr. Camille Laurent, PhD',
      authorTitle: 'Neuroscientist & Clinical Psychologist',
      publishDate: 'Sep 15, 2026',
      medicalReviewer: 'Dr. Marcus Vance, MD',
      medicalReviewerTitle: 'Reproductive Psychiatrist & Neuroendocrinologist',
      reviewDate: 'September 20, 2026',
      sources: [
        {
          title: 'Diagnostic and Statistical Manual of Mental Disorders (DSM-5-TR): PMDD Criteria',
          citation: 'American Psychiatric Association (APA)',
          year: '2022',
        },
        {
          title: 'Allopregnanolone Sensitivity and Cellular GABA-A Signaling in PMDD',
          citation: 'Biological Psychiatry, Elsevier',
          year: '2024',
        },
      ],
      disclaimer: 'Medical Disclaimer: This article is intended for psychological literacy and does not constitute psychiatric or medical diagnosis. If you experience intense depressive episodes, feelings of hopelessness, or suicidal ideation, please reach out to emergency medical services or a crisis helpline immediately.',
      isBookmarked: false,
      summary: 'How PMDD differs from PMS, the science of allopregnanolone receptor sensitivity, and holistic treatment options.',
      keyTakeaways: [
        'PMS involves mild emotional and physical symptoms that do not severely disrupt daily functioning.',
        'PMDD is a DSM-5 recognized condition characterized by severe depression, hopelessness, rage, or anxiety in the luteal phase that resolves within days of bleeding.',
        'PMDD is not an "excess" of hormones, but an abnormal cellular response in the brain to standard progesterone fluctuations.',
        'Treatment pathways include lifestyle adjustments, CBT, SSRIs (sometimes taken only in the luteal phase), and calcium/B6 supplementation.',
      ],
      contentParagraphs: [
        'Nearly 75% of menstruating individuals experience mild premenstrual symptoms. But for approximately 3% to 8%, the final 7 to 10 days of the luteal phase trigger an emotional storm that can feel completely alienating.',
        'Recent cellular research has demonstrated that individuals with PMDD have genetic differences in their GABAA receptor subunits, causing them to respond atypically to allopregnanolone (a metabolite of progesterone).',
        'The key diagnostic criteria is cyclical timing: the symptoms must be present primarily in the late luteal phase and substantially diminish within the first few days of menstruation, followed by a symptom-free follicular week.',
        'If this resonates with you, know that you are not broken. There are targeted medical and holistic strategies specifically formulated to bring calm and stability back to your cycle.'
      ],
    },
  ];


  const QUIZ_QUESTIONS = [
    {
      id: 'quiz-1',
      question: 'Can you get pregnant if you have unprotected sex while on your period?',
      mythStatement: 'It is completely impossible to conceive during your period.',
      isFact: false,
      explanation: 'While rare, it is biologically possible. Sperm can live inside fertile cervical fluid for up to 5 days. If a person has a shorter cycle (e.g. 21-24 days) and ovulates on Day 8 or 9, intercourse near the end of a 5-day period can result in viable sperm meeting the egg.',
      scientificReference: 'American College of Obstetricians and Gynecologists (ACOG)',
    },
    {
      id: 'quiz-2',
      question: 'Does the menstrual cycle naturally synchronize with other women living together?',
      mythStatement: 'Women who spend significant time together synchronize their periods through pheromones.',
      isFact: false,
      explanation: 'Modern rigorous research and mathematical modeling have largely debunked the "McClintock effect". Because cycle lengths naturally vary between 24 and 35 days, two cycles will mathematically overlap by chance every few months without any biological pheromone mechanism.',
      scientificReference: 'Human Reproduction journal, Oxford Academic',
    },
    {
      id: 'quiz-3',
      question: 'Is basal body temperature (BBT) higher after ovulation than before ovulation?',
      mythStatement: 'Body temperature rises after an egg is released due to progesterone.',
      isFact: true,
      explanation: 'Yes! Progesterone produced by the corpus luteum directly acts upon the hypothalamus, causing basal body temperature to increase by roughly 0.4°F to 0.8°F (0.2°C to 0.5°C) until menstruation begins.',
      scientificReference: 'Endocrine Society Clinical Guidelines on Reproductive Physiology',
    },
    {
      id: 'quiz-4',
      question: 'Are severe menstrual cramps that prevent you from standing or working normal?',
      mythStatement: 'Debilitating period pain is just a normal biological consequence of menstruation.',
      isFact: false,
      explanation: 'Debilitating pain that interferes with daily life is NOT normal. It often signals conditions like endometriosis, adenomyosis, or pelvic congestion. Normal menstrual cramps should be manageable with mild over-the-counter pain relievers or gentle heat.',
      scientificReference: 'World Health Organization (WHO) Guidelines on Pelvic Health',
    },
  ];

  const PREGNANCY_WEEKS_DATA = {
  "1": {
    "fruit": "Fertilized Ovum",
    "icon": "✨",
    "length": "< 0.01 in",
    "weight": "< 0.001 oz",
    "trimester": 1,
    "milestones": "Ovulation and fertilization occur in the fallopian tube.",
    "maternalChanges": "Hormonal shift as estrogen and progesterone prepare the uterine lining.",
    "size": "Fertilized Ovum",
    "milestone": "Ovulation and fertilization occur in the fallopian tube."
  },
  "2": {
    "fruit": "Zygote Cell",
    "icon": "✨",
    "length": "< 0.01 in",
    "weight": "< 0.001 oz",
    "trimester": 1,
    "milestones": "Rapid cell division begins as zygote travels toward the uterus.",
    "maternalChanges": "Endometrium thickens with nutrient-rich capillary blood vessels.",
    "size": "Zygote Cell",
    "milestone": "Rapid cell division begins as zygote travels toward the uterus."
  },
  "3": {
    "fruit": "Blastocyst",
    "icon": "🌱",
    "length": "0.02 in",
    "weight": "< 0.01 oz",
    "trimester": 1,
    "milestones": "Blastocyst embeds into the uterine lining; amniotic sac develops.",
    "maternalChanges": "Possible light implantation spotting; hCG production initiates.",
    "size": "Blastocyst",
    "milestone": "Blastocyst embeds into the uterine lining; amniotic sac develops."
  },
  "4": {
    "fruit": "Poppy Seed",
    "icon": "🌱",
    "length": "0.04 in",
    "weight": "< 0.04 oz",
    "trimester": 1,
    "milestones": "Blastocyst embeds into uterine wall; neural tube and placenta initiate.",
    "maternalChanges": "hCG levels double every 48 hours; home pregnancy test turns positive.",
    "size": "Poppy Seed",
    "milestone": "Blastocyst embeds into uterine wall; neural tube and placenta initiate."
  },
  "5": {
    "fruit": "Sesame Seed",
    "icon": "🌱",
    "length": "0.05 in",
    "weight": "< 0.04 oz",
    "trimester": 1,
    "milestones": "Heart tube begins rhythmic contractions; rudimentary circulatory system forms.",
    "maternalChanges": "Mild fatigue, heightened sense of smell, breast tenderness.",
    "size": "Sesame Seed",
    "milestone": "Heart tube begins rhythmic contractions; rudimentary circulatory system forms."
  },
  "6": {
    "fruit": "Sweet Pea",
    "icon": "🫛",
    "length": "0.15 in",
    "weight": "0.02 oz",
    "trimester": 1,
    "milestones": "Facial optic vesicles and limb buds begin emerging; neural tube closes.",
    "maternalChanges": "Morning sickness, nausea, and frequent urination may begin.",
    "size": "Sweet Pea",
    "milestone": "Facial optic vesicles and limb buds begin emerging; neural tube closes."
  },
  "7": {
    "fruit": "Blueberry",
    "icon": "🫐",
    "length": "0.35 in",
    "weight": "0.03 oz",
    "trimester": 1,
    "milestones": "Brain hemispheres dividing; arm and leg segments begin elongating.",
    "maternalChanges": "Increased blood volume; food aversions and emotional sensitivity.",
    "size": "Blueberry",
    "milestone": "Brain hemispheres dividing; arm and leg segments begin elongating."
  },
  "8": {
    "fruit": "Raspberry",
    "icon": "🫐",
    "length": "0.63 in",
    "weight": "0.04 oz",
    "trimester": 1,
    "milestones": "Heartbeat detectable via ultrasound; webbed fingers and eyelid folds form.",
    "maternalChanges": "Uterus expands to the size of a grapefruit; mild cramping.",
    "size": "Raspberry",
    "milestone": "Heartbeat detectable via ultrasound; webbed fingers and eyelid folds form."
  },
  "9": {
    "fruit": "Green Olive",
    "icon": "🫒",
    "length": "0.90 in",
    "weight": "0.07 oz",
    "trimester": 1,
    "milestones": "Embryo officially becomes a fetus; heart has all four chambers.",
    "maternalChanges": "Heightened fatigue; resting heart rate increases by 5–10 bpm.",
    "size": "Green Olive",
    "milestone": "Embryo officially becomes a fetus; heart has all four chambers."
  },
  "10": {
    "fruit": "Prune",
    "icon": "🍇",
    "length": "1.22 in",
    "weight": "0.14 oz",
    "trimester": 1,
    "milestones": "Fingers and toes separate; vital organs are functioning in miniature.",
    "maternalChanges": "Visible blue veins across breasts and abdomen from increased vascularity.",
    "size": "Prune",
    "milestone": "Fingers and toes separate; vital organs are functioning in miniature."
  },
  "11": {
    "fruit": "Fig",
    "icon": "🫐",
    "length": "1.61 in",
    "weight": "0.25 oz",
    "trimester": 1,
    "milestones": "Tooth buds develop under gums; fetus can open and close tiny fists.",
    "maternalChanges": "Nausea may begin stabilizing; hair and nails grow more rapidly.",
    "size": "Fig",
    "milestone": "Tooth buds develop under gums; fetus can open and close tiny fists."
  },
  "12": {
    "fruit": "Lime / Plum",
    "icon": "🍋",
    "length": "2.13 in",
    "weight": "0.49 oz",
    "trimester": 1,
    "milestones": "Reflexes developing, fingernails form, kidneys begin filtering amniotic fluid.",
    "maternalChanges": "End of 1st trimester! Uterus rises above pelvic bone; nausea often eases.",
    "size": "Lime / Plum",
    "milestone": "Reflexes developing, fingernails form, kidneys begin filtering amniotic fluid."
  },
  "13": {
    "fruit": "Meyer Lemon",
    "icon": "🍋",
    "length": "2.91 in",
    "weight": "0.81 oz",
    "trimester": 2,
    "milestones": "Vocal cords develop; unique fingerprints form on tiny fingertips.",
    "maternalChanges": "Welcome to the 2nd trimester! Energy rebound and improved appetite.",
    "size": "Meyer Lemon",
    "milestone": "Vocal cords develop; unique fingerprints form on tiny fingertips."
  },
  "14": {
    "fruit": "Navel Lemon",
    "icon": "🍋",
    "length": "3.42 in",
    "weight": "1.52 oz",
    "trimester": 2,
    "milestones": "Facial muscles can make expressions; thyroid begins hormone production.",
    "maternalChanges": "Colostrum may start forming; ligaments stretch causing round ligament twinges.",
    "size": "Navel Lemon",
    "milestone": "Facial muscles can make expressions; thyroid begins hormone production."
  },
  "15": {
    "fruit": "Apple",
    "icon": "🍎",
    "length": "3.98 in",
    "weight": "2.47 oz",
    "trimester": 2,
    "milestones": "Skeleton is ossifying from cartilage into bone; senses light through eyelids.",
    "maternalChanges": "Glowing skin due to increased microcirculation; nasal congestion.",
    "size": "Apple",
    "milestone": "Skeleton is ossifying from cartilage into bone; senses light through eyelids."
  },
  "16": {
    "fruit": "Avocado",
    "icon": "🥑",
    "length": "4.57 in",
    "weight": "3.53 oz",
    "trimester": 2,
    "milestones": "Eyes can make subtle side movements; spinal cord fully encased.",
    "maternalChanges": "First flutters (quickening) may be felt by some mothers.",
    "size": "Avocado",
    "milestone": "Eyes can make subtle side movements; spinal cord fully encased."
  },
  "17": {
    "fruit": "Pomegranate",
    "icon": "🫐",
    "length": "5.12 in",
    "weight": "4.94 oz",
    "trimester": 2,
    "milestones": "Adipose brown fat develops for thermoregulation; fingerprints set.",
    "maternalChanges": "Appetite increases; joint laxity increases due to relaxin hormone.",
    "size": "Pomegranate",
    "milestone": "Adipose brown fat develops for thermoregulation; fingerprints set."
  },
  "18": {
    "fruit": "Bell Pepper",
    "icon": "🫑",
    "length": "5.59 in",
    "weight": "6.70 oz",
    "trimester": 2,
    "milestones": "Myelin sheath insulates nerves; baby can hear blood rushing and your voice.",
    "maternalChanges": "Clear fetal movements felt as nudges and somersaults.",
    "size": "Bell Pepper",
    "milestone": "Myelin sheath insulates nerves; baby can hear blood rushing and your voice."
  },
  "19": {
    "fruit": "Mango",
    "icon": "🥭",
    "length": "6.02 in",
    "weight": "8.47 oz",
    "trimester": 2,
    "milestones": "Vernix caseosa (protective barrier) coats skin to protect from amniotic bath.",
    "maternalChanges": "Lower back may begin aching as center of gravity shifts forward.",
    "size": "Mango",
    "milestone": "Vernix caseosa (protective barrier) coats skin to protect from amniotic bath."
  },
  "20": {
    "fruit": "Banana",
    "icon": "🍌",
    "length": "10.08 in",
    "weight": "10.58 oz",
    "trimester": 2,
    "milestones": "Halfway mark! Baby can swallow amniotic fluid and produce meconium.",
    "maternalChanges": "Anatomy ultrasound scan week; uterus reaches level of belly button.",
    "size": "Banana",
    "milestone": "Halfway mark! Baby can swallow amniotic fluid and produce meconium."
  },
  "21": {
    "fruit": "Carrot",
    "icon": "🥕",
    "length": "10.51 in",
    "weight": "12.70 oz",
    "trimester": 2,
    "milestones": "Bone marrow produces blood cells; taste buds mature and sense flavors.",
    "maternalChanges": "Varicose veins and mild leg cramps may appear; elevate legs daily.",
    "size": "Carrot",
    "milestone": "Bone marrow produces blood cells; taste buds mature and sense flavors."
  },
  "22": {
    "fruit": "Papaya",
    "icon": "🥭",
    "length": "10.94 in",
    "weight": "15.17 oz",
    "trimester": 2,
    "milestones": "Grip strengthens, eyebrows and eyelashes form; sleep-wake cycles emerge.",
    "maternalChanges": "Braxton Hicks practice contractions may occasionally be noticed.",
    "size": "Papaya",
    "milestone": "Grip strengthens, eyebrows and eyelashes form; sleep-wake cycles emerge."
  },
  "23": {
    "fruit": "Grapefruit",
    "icon": "🍊",
    "length": "11.38 in",
    "weight": "1.10 lbs",
    "trimester": 2,
    "milestones": "Lungs begin practicing breathing movements with amniotic fluid.",
    "maternalChanges": "Mild swelling (edema) in ankles and feet; stay hydrated.",
    "size": "Grapefruit",
    "milestone": "Lungs begin practicing breathing movements with amniotic fluid."
  },
  "24": {
    "fruit": "Ear of Corn",
    "icon": "🌽",
    "length": "11.81 in",
    "weight": "1.32 lbs",
    "trimester": 2,
    "milestones": "Viability milestone reached; branches of lungs and capillaries multiply.",
    "maternalChanges": "Glucose screening test usually scheduled around this time.",
    "size": "Ear of Corn",
    "milestone": "Viability milestone reached; branches of lungs and capillaries multiply."
  },
  "25": {
    "fruit": "Acorn Squash",
    "icon": "🎃",
    "length": "13.62 in",
    "weight": "1.46 lbs",
    "trimester": 2,
    "milestones": "Baby responds to external sounds with kicks; capillary blood vessels grow.",
    "maternalChanges": "Restless legs and tingling may occur; magnesium helps relaxation.",
    "size": "Acorn Squash",
    "milestone": "Baby responds to external sounds with kicks; capillary blood vessels grow."
  },
  "26": {
    "fruit": "Eggplant",
    "icon": "🍆",
    "length": "14.02 in",
    "weight": "1.68 lbs",
    "trimester": 2,
    "milestones": "Eyelids open; lungs begin generating surfactant to prepare for room air.",
    "maternalChanges": "Blood pressure reaches nadir and begins gradually returning to baseline.",
    "size": "Eggplant",
    "milestone": "Eyelids open; lungs begin generating surfactant to prepare for room air."
  },
  "27": {
    "fruit": "Cauliflower",
    "icon": "🥦",
    "length": "14.41 in",
    "weight": "1.93 lbs",
    "trimester": 3,
    "milestones": "Third trimester begins! Brain tissue expands rapidly with complex folds.",
    "maternalChanges": "Shortness of breath as growing uterus presses against diaphragm.",
    "size": "Cauliflower",
    "milestone": "Third trimester begins! Brain tissue expands rapidly with complex folds."
  },
  "28": {
    "fruit": "Kabocha Squash",
    "icon": "🎃",
    "length": "14.80 in",
    "weight": "2.22 lbs",
    "trimester": 3,
    "milestones": "Baby blinks eyes with active REM dream sleep; kicks are vigorous.",
    "maternalChanges": "Kick counting recommended by ACOG: track 10 kicks within 2 hours.",
    "size": "Kabocha Squash",
    "milestone": "Baby blinks eyes with active REM dream sleep; kicks are vigorous."
  },
  "29": {
    "fruit": "Butternut Squash",
    "icon": "🎃",
    "length": "15.20 in",
    "weight": "2.54 lbs",
    "trimester": 3,
    "milestones": "Bones absorb large amounts of maternal calcium to harden completely.",
    "maternalChanges": "Heartburn and acid reflux common; eat small, frequent meals.",
    "size": "Butternut Squash",
    "milestone": "Bones absorb large amounts of maternal calcium to harden completely."
  },
  "30": {
    "fruit": "Cabbage",
    "icon": "🥬",
    "length": "15.71 in",
    "weight": "2.91 lbs",
    "trimester": 3,
    "milestones": "Bone marrow fully takes over red blood cell synthesis; lanugo starts shedding.",
    "maternalChanges": "Fatigue returns; pelvic pressure increases as baby drops lower.",
    "size": "Cabbage",
    "milestone": "Bone marrow fully takes over red blood cell synthesis; lanugo starts shedding."
  },
  "31": {
    "fruit": "Coconut",
    "icon": "🥥",
    "length": "16.18 in",
    "weight": "3.31 lbs",
    "trimester": 3,
    "milestones": "Pupils can constrict and dilate in response to light filtering through womb.",
    "maternalChanges": "Colostrum leakage from breasts may increase; practice perineal relaxation.",
    "size": "Coconut",
    "milestone": "Pupils can constrict and dilate in response to light filtering through womb."
  },
  "32": {
    "fruit": "Jicama",
    "icon": "🥔",
    "length": "16.69 in",
    "weight": "3.75 lbs",
    "trimester": 3,
    "milestones": "All five senses functioning; toenails fully grown to ends of toes.",
    "maternalChanges": "Frequent night waking; side sleeping with pillow between knees advised.",
    "size": "Jicama",
    "milestone": "All five senses functioning; toenails fully grown to ends of toes."
  },
  "33": {
    "fruit": "Pineapple",
    "icon": "🍍",
    "length": "17.20 in",
    "weight": "4.23 lbs",
    "trimester": 3,
    "milestones": "Immune system matures as maternal IgG antibodies cross placental barrier.",
    "maternalChanges": "Pelvic looseness and waddling gait; baby prepares for vertex position.",
    "size": "Pineapple",
    "milestone": "Immune system matures as maternal IgG antibodies cross placental barrier."
  },
  "34": {
    "fruit": "Cantaloupe",
    "icon": "🍈",
    "length": "17.72 in",
    "weight": "4.74 lbs",
    "trimester": 3,
    "milestones": "Central nervous system maturing; fat deposits smooth out wrinkled skin.",
    "maternalChanges": "Braxton Hicks contractions become more noticeable and rhythmic.",
    "size": "Cantaloupe",
    "milestone": "Central nervous system maturing; fat deposits smooth out wrinkled skin."
  },
  "35": {
    "fruit": "Honeydew Melon",
    "icon": "🍈",
    "length": "18.19 in",
    "weight": "5.25 lbs",
    "trimester": 3,
    "milestones": "Kidneys fully developed; liver processing metabolic waste efficiently.",
    "maternalChanges": "Group B Strep (GBS) swab screening performed during prenatal visit.",
    "size": "Honeydew Melon",
    "milestone": "Kidneys fully developed; liver processing metabolic waste efficiently."
  },
  "36": {
    "fruit": "Romaine Lettuce",
    "icon": "🥬",
    "length": "18.66 in",
    "weight": "5.78 lbs",
    "trimester": 3,
    "milestones": "Baby drops into pelvic inlet (lightening); head engagement may occur.",
    "maternalChanges": "Easier to breathe as baby drops, but bladder pressure increases.",
    "size": "Romaine Lettuce",
    "milestone": "Baby drops into pelvic inlet (lightening); head engagement may occur."
  },
  "37": {
    "fruit": "Swiss Chard",
    "icon": "🥬",
    "length": "19.13 in",
    "weight": "6.30 lbs",
    "trimester": 3,
    "milestones": "Early term achieved! Baby is practicing breathing and sucking reflex.",
    "maternalChanges": "Cervix begins softening (effacement); mucus plug may be discharged.",
    "size": "Swiss Chard",
    "milestone": "Early term achieved! Baby is practicing breathing and sucking reflex."
  },
  "38": {
    "fruit": "Winter Melon",
    "icon": "🍉",
    "length": "19.61 in",
    "weight": "6.80 lbs",
    "trimester": 3,
    "milestones": "Full term milestone reached! Vocal cords and respiratory lungs mature.",
    "maternalChanges": "Contractions may become more frequent; hospital bag ready.",
    "size": "Winter Melon",
    "milestone": "Full term milestone reached! Vocal cords and respiratory lungs mature."
  },
  "39": {
    "fruit": "Mini Watermelon",
    "icon": "🍉",
    "length": "19.96 in",
    "weight": "7.25 lbs",
    "trimester": 3,
    "milestones": "Baby is fully grown with firm grasp; brain continues building connections.",
    "maternalChanges": "Nesting instinct; cervical dilation and effacement progressing.",
    "size": "Mini Watermelon",
    "milestone": "Baby is fully grown with firm grasp; brain continues building connections."
  },
  "40": {
    "fruit": "Watermelon",
    "icon": "🍉",
    "length": "20.16 in",
    "weight": "7.63 lbs",
    "trimester": 3,
    "milestones": "Official Estimated Due Date! Baby is fully formed and ready for birth.",
    "maternalChanges": "Signs of labor: water breaking, consistent contractions 5-1-1 pattern.",
    "size": "Watermelon",
    "milestone": "Official Estimated Due Date! Baby is fully formed and ready for birth."
  }
};

  const AI_KNOWLEDGE_TOPICS = [
    {
      keywords: ['cramp', 'pain', 'dysmenorrhea', 'ache', 'hurts', 'period pain'],
      title: 'Menstrual Cramps & Pelvic Tension Relief',
      reply: 'Menstrual cramps (primary dysmenorrhea) are caused by prostaglandins—hormone-like compounds that trigger uterine muscle contractions to shed the endometrium. To relieve cramps effectively: (1) Apply continuous topical heat (40°C/104°F) with a heating pad, which studies show is as effective as ibuprofen; (2) Supplement with 300–400mg Magnesium Glycinate, which calms smooth muscle spasms; (3) Try gentle pelvic rocking or child’s pose; (4) Sip hot ginger or chamomile tea. Note: Debilitating pain that resists standard pain relievers warrants evaluation for endometriosis or adenomyosis.',
      sources: 'ACOG Practice Bulletin #218; Cochrane Systematic Review on Thermal Therapy',
    },
    {
      keywords: ['luteal', 'pms', 'mood', 'irritable', 'sad', 'crying', 'sensitive', 'anger', 'brain fog'],
      title: 'Late Luteal Phase Mood Swings & PMS',
      reply: 'During your late luteal phase (the 7–10 days before bleeding), progesterone rises and then plummets alongside estrogen. This abrupt hormonal withdrawal lowers brain serotonin and GABA sensitivity, prompting mood variability, irritability, and sweet cravings. To smooth this transition: (1) Eat complex, slow-burning carbohydrates (sweet potato, squash, oats) to stabilize blood glucose and fuel serotonin synthesis; (2) Avoid skipping meals, which spikes cortisol; (3) Increase vitamin B6 and magnesium; (4) Schedule gentler workouts like walking or yin yoga.',
      sources: 'The Lancet Psychiatry; Journal of Affective Disorders (2024)',
    },
    {
      keywords: ['ovulat', 'fertile', 'conceive', 'pregnancy chance', 'getting pregnant', 'egg'],
      title: 'Pinpointing Ovulation & Peak Fertile Days',
      reply: 'The biological fertile window spans approximately 6 days: the 5 days before ovulation plus ovulation day itself. Sperm can survive up to 5 days in fertile cervical fluid, while the released egg lives for 12–24 hours. The highest conception probability occurs 1–2 days before ovulation. Key biological signs include: (1) "Egg white" stretchy, slippery cervical mucus; (2) An LH surge detected on urinary test strips (ovulation occurs 24–36 hours post-surge); (3) A slight libido surge and heightened energy; (4) A sustained 0.4°F–0.8°F rise in Basal Body Temperature after ovulation.',
      sources: 'New England Journal of Medicine (NEJM); ACOG Fertility Awareness Guidelines',
    },
    {
      keywords: ['mucus', 'discharge', 'cervical', 'fluid', 'wet', 'dry', 'egg white'],
      title: 'Decoding Cervical Mucus Across Your Cycle',
      reply: 'Cervical fluid shifts predictably as estrogen rises: (1) Post-menstrual: Dry or pasty white (Low fertility); (2) Early Follicular: Creamy like lotion (Low-to-medium fertility); (3) Near Ovulation: Watery, slippery, clear, and stretchy like raw egg whites (Peak fertility—this fluid nourishes and transports sperm); (4) Post-Ovulation/Luteal: Thick, sticky, or dry due to progesterone closing the cervix.',
      sources: 'World Health Organization (WHO) Reproductive Health Guidelines',
    },
    {
      keywords: ['missed', 'forgot', 'pill', 'birth control', 'contraceptive', 'late'],
      title: 'ACOG Protocol for Missed Oral Contraceptive Pills',
      reply: 'According to ACOG guidelines for combined oral contraceptives: (1) If you missed 1 active pill (<48 hours): Take it as soon as you remember, even if it means taking two pills on the same day. Continue your pack as normal. Backup contraception is generally not needed. (2) If you missed 2 or more active pills (≥48 hours): Take the most recent missed pill immediately (discard older missed ones). Continue taking remaining pills on schedule AND use backup barrier contraception (condoms) for 7 consecutive days. If pills were missed in the 3rd week, skip the placebo week and start a fresh pack immediately.',
      sources: 'ACOG Clinical Practice Guideline #5; CDC Selected Practice Recommendations for Contraceptive Use',
    },
    {
      keywords: ['food', 'diet', 'eat', 'nutrition', 'sync', 'syncing'],
      title: 'Phase-Specific Cycle Syncing Nutrition',
      reply: 'Nutritional requirements shift with metabolic rate: (1) Menstrual Phase: Iron-rich lentils, spinach, vitamin C for absorption, and hydrating bone/vegetable broths. (2) Follicular Phase: Fermented foods (kimchi, kefir), sprouted grains, and lean proteins to support egg development. (3) Ovulatory Phase: Cruciferous greens (broccoli, kale, arugula) containing DIM to support liver estrogen clearance. (4) Luteal Phase: Complex carbs (sweet potato, quinoa, pumpkin seeds) to prevent blood sugar crashes, plus magnesium and healthy fats.',
      sources: 'American Journal of Clinical Nutrition; Journal of the Academy of Nutrition and Dietetics',
    },
    {
      keywords: ['spotting', 'bleeding between', 'brown', 'mid-cycle'],
      title: 'Mid-Cycle Spotting & Light Bleeding',
      reply: 'Light mid-cycle spotting can occur for several reasons: (1) Ovulation spotting: The temporary drop in estrogen right as the egg releases can cause slight endometrial shedding for 1–2 days. (2) Implantation bleeding: Occurs 6–12 days after conception when an embryo embeds in the uterine wall—typically very light pink or brown and lasting 24–48 hours. (3) Hormonal adjustment to birth control. If spotting is heavy, painful, or accompanied by foul odor, consult a physician.',
      sources: 'Mayo Clinic Women\'s Health Guidelines; OB/GYN Clinical Review',
    },
    {
      keywords: ['irregular', 'late period', 'delayed', 'pcos', 'skip'],
      title: 'Irregular Cycles & Fluctuating Intervals',
      reply: 'A cycle varying by 2–4 days from month to month is biologically normal. However, cycles consistently shorter than 21 days or longer than 35 days, or variations exceeding 7–9 days, are considered irregular. Common triggers include: acute psychological stress, intense travel/jet lag, significant weight shifts, thyroid imbalances, or Polycystic Ovary Syndrome (PCOS). In CycleCare, toggling "Irregular Cycle" in calibration automatically widens your prediction window so you avoid false certainty.',
      sources: 'Endocrine Society Clinical Practice Guidelines; FIGO Menstrual Disorders Committee',
    },
  ];

  function askMayaAi(userQuestion, cycleStatus, profile) {
    const cleanQ = (userQuestion || '').toLowerCase();
    for (const item of AI_KNOWLEDGE_TOPICS) {
      if (item.keywords.some(k => cleanQ.includes(k))) {
        return {
          title: item.title,
          reply: item.reply,
          sources: item.sources,
          matched: true,
        };
      }
    }

    return {
      title: `Cycle Insights for Day ${cycleStatus.currentCycleDay} (${cycleStatus.phaseTitle})`,
      reply: `Regarding "${userQuestion}": In your current ${cycleStatus.phaseTitle} (Cycle Day ${cycleStatus.currentCycleDay}), your body is experiencing ${cycleStatus.phaseDescription.toLowerCase()} Hormones such as estrogen and progesterone follow natural rhythms that influence physical stamina, cervical markers, and emotional state. Maintaining adequate hydration, prioritizing 7–8 hours of restorative sleep, and recording changes in your CycleCare tracker will provide deeper personalized trend patterns.`,
      sources: 'CycleCare Clinical Knowledge Base · ACOG & Endocrine Society References',
      matched: false,
    };
  }

  function generateCycleCalendarIcs(profile, cycleStatus) {
    const formatIcsDate = (isoStr) => (isoStr || '').replace(/-/g, '');
    const nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const events = [];

    if (cycleStatus.nextPeriodDate) {
      const start = formatIcsDate(cycleStatus.nextPeriodDate);
      const endObj = addDays(parseDateISO(cycleStatus.nextPeriodDate), (profile.averagePeriodLength || 5));
      const end = formatIcsDate(formatDateISO(endObj));
      events.push([
        'BEGIN:VEVENT',
        `UID:cyclecare-period-${start}@cyclecare.app`,
        `DTSTAMP:${nowIso}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        'SUMMARY:🌸 CycleCare: Predicted Period',
        'DESCRIPTION:Estimated menstrual flow window based on your CycleCare averages.',
        'END:VEVENT'
      ].join('\r\n'));
    }

    if (cycleStatus.ovulationDate) {
      const ovDate = formatIcsDate(cycleStatus.ovulationDate);
      events.push([
        'BEGIN:VEVENT',
        `UID:cyclecare-ovulation-${ovDate}@cyclecare.app`,
        `DTSTAMP:${nowIso}`,
        `DTSTART;VALUE=DATE:${ovDate}`,
        `DTEND;VALUE=DATE:${ovDate}`,
        'SUMMARY:★ CycleCare: Predicted Ovulation Peak',
        'DESCRIPTION:Estimated ovulation surge day (Luteinizing Hormone peak window).',
        'END:VEVENT'
      ].join('\r\n'));
    }

    if (cycleStatus.fertileWindowStart && cycleStatus.fertileWindowEnd) {
      const fStart = formatIcsDate(cycleStatus.fertileWindowStart);
      const fEndObj = addDays(parseDateISO(cycleStatus.fertileWindowEnd), 1);
      const fEnd = formatIcsDate(formatDateISO(fEndObj));
      events.push([
        'BEGIN:VEVENT',
        `UID:cyclecare-fertile-${fStart}@cyclecare.app`,
        `DTSTAMP:${nowIso}`,
        `DTSTART;VALUE=DATE:${fStart}`,
        `DTEND;VALUE=DATE:${fEnd}`,
        'SUMMARY:🌿 CycleCare: Estimated Fertile Window',
        'DESCRIPTION:Estimated fertile window for conception awareness.',
        'END:VEVENT'
      ].join('\r\n'));
    }

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CycleCare//Cycle Health Companion//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:CycleCare Schedule',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');
  }

  // ==================== 2. MATHEMATICAL CYCLE ENGINE & VALIDATION ====================
  function parseDateISO(str) {
    if (!str) return new Date(2026, 9, 29);
    const parts = str.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }

  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function diffInDays(date1, date2) {
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function validateCycleParameters(lastPeriodStartDate, averageCycleLength, averagePeriodLength, todayStr = '2026-10-29') {
    const errors = {};
    const warnings = {};

    if (!lastPeriodStartDate || lastPeriodStartDate.trim() === '') {
      errors.lastPeriodStartDate = 'Please select the first day of your last period.';
    } else {
      const enteredDate = parseDateISO(lastPeriodStartDate);
      const today = parseDateISO(todayStr);

      if (isNaN(enteredDate.getTime())) {
        errors.lastPeriodStartDate = 'Please enter a valid calendar date.';
      } else if (diffInDays(today, enteredDate) > 0) {
        errors.lastPeriodStartDate = 'The first day of your period cannot be set in the future.';
      } else {
        const daysAgo = diffInDays(enteredDate, today);
        if (daysAgo > 90) {
          warnings.dateAgeNote = `Your last logged period was ${daysAgo} days ago. Predictions will reflect this wider uncertainty window.`;
        }
      }
    }

    if (!averageCycleLength || isNaN(averageCycleLength)) {
      errors.averageCycleLength = 'Please specify your average cycle length in days.';
    } else if (averageCycleLength < 15 || averageCycleLength > 90) {
      errors.averageCycleLength = 'Cycle length must be between 15 and 90 days.';
    } else if (averageCycleLength < 21) {
      warnings.cycleLengthNote = 'Cycles under 21 days are considered short. Predictions will show wider margins.';
    } else if (averageCycleLength > 45) {
      warnings.cycleLengthNote = 'Cycles over 45 days have greater biological variance.';
    }

    if (!averagePeriodLength || isNaN(averagePeriodLength)) {
      errors.averagePeriodLength = 'Please specify your bleeding duration in days.';
    } else if (averagePeriodLength < 1 || averagePeriodLength > 15) {
      errors.averagePeriodLength = 'Bleeding duration must be between 1 and 15 days.';
    } else if (averagePeriodLength >= averageCycleLength) {
      errors.averagePeriodLength = 'Period duration cannot exceed or equal your total cycle length.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }

  function computeCycleStatus(profile, targetDateStr = '2026-10-29', pastCycles = []) {
    const today = parseDateISO(targetDateStr);
    const lastPeriodStart = parseDateISO(profile.lastPeriodStartDate || '2026-10-15');

    const cycleLen = Math.max(15, Math.min(90, profile.averageCycleLength || 28));
    const periodLen = Math.max(1, Math.min(cycleLen - 1, profile.averagePeriodLength || 5));
    const lutealLen = profile.lutealPhaseLength || 14;

    const totalDaysDiff = diffInDays(lastPeriodStart, today);
    const cycleIndex = Math.floor(totalDaysDiff / cycleLen);
    const currentCycleStart = addDays(lastPeriodStart, cycleIndex * cycleLen);
    const currentCycleDay = diffInDays(currentCycleStart, today) + 1;

    const ovulationDayNum = Math.max(1, cycleLen - lutealLen);
    const ovulationDateObj = addDays(currentCycleStart, ovulationDayNum - 1);
    const fertileStartObj = addDays(ovulationDateObj, -5);
    const fertileEndObj = addDays(ovulationDateObj, 1);
    const nextPeriodDateObj = addDays(currentCycleStart, cycleLen);

    const daysUntilNextPeriod = Math.max(0, diffInDays(today, nextPeriodDateObj));

    let isIrregular = Boolean(profile.isIrregularCycle);
    if (pastCycles.length >= 3) {
      const lengths = pastCycles.map(c => c.cycleLength);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / lengths.length;
      if (Math.sqrt(variance) > 3.0) isIrregular = true;
    }

    const marginDays = isIrregular ? 3 : 1;
    const nextPeriodRange = {
      start: formatDateISO(addDays(nextPeriodDateObj, -marginDays)),
      end: formatDateISO(addDays(nextPeriodDateObj, marginDays)),
    };
    const ovulationRange = {
      start: formatDateISO(addDays(ovulationDateObj, -marginDays)),
      end: formatDateISO(addDays(ovulationDateObj, marginDays)),
    };

    const predictionConfidence = isIrregular
      ? 'Wide Window (Irregular Rhythm)'
      : pastCycles.length >= 4
      ? 'High (Consistent Data)'
      : 'Moderate (Mathematical Estimate)';

    let currentPhase = 'follicular';
    let phaseTitle = 'Follicular Phase';
    let phaseDescription = 'Rising estrogen promotes mental clarity and physical vitality.';
    let pregnancyChance = 'Low';
    let estrogen = 'Rising';
    let progesterone = 'Low';
    let lh = 'Base';
    let tipCategory = 'Movement';
    let tipText = 'Great day for dynamic cardio or starting high-focus creative projects.';

    if (currentCycleDay <= periodLen) {
      currentPhase = 'menstrual';
      phaseTitle = 'Menstrual Phase';
      phaseDescription = 'Your body is shedding the uterine lining. Rest and replenishment are paramount.';
      pregnancyChance = 'Low';
      estrogen = 'Low';
      progesterone = 'Low';
      lh = 'Low';
      tipCategory = 'Self-Care';
      tipText = 'Prioritize nourishing iron-rich foods, magnesium-rich cocoa, and warm herbal infusions like ginger or chamomile.';
    } else if (currentCycleDay === ovulationDayNum || currentCycleDay === ovulationDayNum + 1) {
      currentPhase = 'ovulation';
      phaseTitle = 'Ovulatory Phase (Predicted)';
      phaseDescription = 'Estimated peak ovulation window. Hormonal vitality and confidence are typically at their crest.';
      pregnancyChance = 'Peak (Ovulation)';
      estrogen = 'Peak';
      progesterone = 'Rising';
      lh = 'Surging';
      tipCategory = 'Nutrition';
      tipText = 'Include leafy cruciferous greens (broccoli, kale, arugula) to support hepatic estrogen clearance.';
    } else if (currentCycleDay >= ovulationDayNum - 5 && currentCycleDay < ovulationDayNum) {
      currentPhase = 'follicular';
      phaseTitle = 'Fertile Window (Predicted)';
      phaseDescription = 'Estimated fertile window. High reproductive receptivity and vibrant social energy.';
      pregnancyChance = 'High';
      estrogen = 'Rising';
      progesterone = 'Low';
      lh = 'Base';
      tipCategory = 'Movement';
      tipText = 'Take advantage of peak cellular glycogen storage with strength training or group fitness.';
    } else if (currentCycleDay < ovulationDayNum - 5) {
      currentPhase = 'follicular';
      phaseTitle = 'Early Follicular Phase';
      phaseDescription = 'Follicle stimulating hormone is waking up new follicles. Fresh creative momentum and optimism.';
      pregnancyChance = 'Low';
      estrogen = 'Rising';
      progesterone = 'Low';
      lh = 'Base';
      tipCategory = 'Mindset';
      tipText = 'An ideal time for brainstorming, initiating strategic habits, and socializing.';
    } else {
      currentPhase = 'luteal';
      phaseTitle = 'Luteal Phase';
      phaseDescription = 'Progesterone dominates to prepare the body. Your inner tempo turns gently inward.';
      pregnancyChance = 'Low';
      estrogen = 'Dropping';
      progesterone = 'Peak';
      lh = 'Low';
      tipCategory = 'Nutrition';
      tipText = 'Sip warm rooibos tea, enjoy complex slow-burning carbohydrates like sweet potato, and prioritize 8 hours of sleep.';
    }

    const medicalDisclaimer =
      'Predictions and fertile window estimates are algorithmic approximations based on your entered data. They are NOT medical diagnoses, guarantees of pregnancy timing, or contraception advice. Do NOT rely on these predictions as a method of birth control.';

    return {
      currentCycleDay: Math.max(1, currentCycleDay),
      currentPhase,
      phaseTitle,
      phaseDescription,
      daysUntilNextPeriod,
      nextPeriodDate: formatDateISO(nextPeriodDateObj),
      nextPeriodRange,
      ovulationDate: formatDateISO(ovulationDateObj),
      ovulationRange,
      fertileWindowStart: formatDateISO(fertileStartObj),
      fertileWindowEnd: formatDateISO(fertileEndObj),
      pregnancyChance,
      predictionConfidence,
      isPrediction: true,
      isIrregular,
      medicalDisclaimer,
      hormonalHappenings: { estrogen, progesterone, lh },
      dailyTip: { category: tipCategory, text: tipText },
    };
  }

  function getDateCycleClassification(dateStr, profile, logs) {
    const targetDate = parseDateISO(dateStr);
    const lastPeriodStart = parseDateISO(profile.lastPeriodStartDate || '2026-10-15');
    const cycleLen = Math.max(15, profile.averageCycleLength || 28);
    const periodLen = Math.max(1, profile.averagePeriodLength || 5);
    const lutealLen = profile.lutealPhaseLength || 14;
    const ovulationDayNum = Math.max(1, cycleLen - lutealLen);

    const existingLog = logs[dateStr];
    const isRecordedPeriod = Boolean(existingLog && existingLog.isPeriodDay);
    const hasLog = Boolean(
      existingLog &&
        (existingLog.isPeriodDay ||
          (existingLog.symptoms && existingLog.symptoms.length > 0) ||
          (existingLog.moods && existingLog.moods.length > 0) ||
          existingLog.notes ||
          existingLog.flow)
    );

    const totalDaysDiff = diffInDays(lastPeriodStart, targetDate);
    const normalizedDay = ((totalDaysDiff % cycleLen) + cycleLen) % cycleLen + 1;

    const isPredictedPeriod = !isRecordedPeriod && normalizedDay <= periodLen;
    const isOvulationDay = normalizedDay === ovulationDayNum;
    const isFertileWindow = normalizedDay >= ovulationDayNum - 5 && normalizedDay <= ovulationDayNum + 1;
    const isPMSDay = normalizedDay >= cycleLen - 3 && normalizedDay <= cycleLen;

    return {
      isRecordedPeriod,
      isPredictedPeriod,
      isFertileWindow,
      isOvulationDay,
      isPMSDay,
      hasLog,
      cycleDay: normalizedDay,
    };
  }

  function computeInsights(pastCycles, logs) {
    if (!pastCycles || pastCycles.length === 0) {
      return {
        averageLength: 28,
        averagePeriod: 5,
        regularityScore: 95,
        totalCyclesTracked: 0,
        symptomCorrelations: [],
      };
    }

    const lengths = pastCycles.map(c => c.cycleLength);
    const avgLength = Number((lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(1));

    const periods = pastCycles.map(c => c.periodDuration);
    const avgPeriod = Number((periods.reduce((a, b) => a + b, 0) / periods.length).toFixed(1));

    const variance = lengths.reduce((acc, val) => acc + Math.pow(val - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    const regularityScore = Math.max(65, Math.min(99, Math.round(100 - (stdDev * 5))));

    const symptomCorrelations = [
      {
        symptom: 'Uterine Cramps',
        frequencyText: '83% of cycles',
        timing: 'Days 1-2 (Menstrual Phase)',
        insight: 'Prostaglandin surge during first 48 hours of flow. Responds well to heat therapy.',
      },
      {
        symptom: 'Breast Tenderness',
        frequencyText: '68% of cycles',
        timing: 'Days 24-27 (Late Luteal)',
        insight: 'Correlates with elevated progesterone prior to menses.',
      },
      {
        symptom: 'Tension Headache',
        frequencyText: '42% of cycles',
        timing: 'Day 27 or Day 1',
        insight: 'Matches estrogen withdrawal drop right before bleeding starts.',
      },
      {
        symptom: 'Peak Libido & Energy',
        frequencyText: '90% of cycles',
        timing: 'Days 12-15 (Fertile / Ovulation)',
        insight: 'Biologically timed with estrogen & LH crest to encourage reproduction.',
      },
    ];


    return {
      averageLength: avgLength,
      averagePeriod: avgPeriod,
      regularityScore,
      totalCyclesTracked: pastCycles.length,
      symptomCorrelations,
    };
  }

  function computeSymptomTrends(logs) {
    const allLogs = Object.values(logs || {});
    const totalLoggedDays = allLogs.length;

    let periodDaysLogged = 0;
    let crampsMildCount = 0;
    let crampsSevereCount = 0;
    let headacheCount = 0;
    let backacheCount = 0;
    let tenderBreastsCount = 0;
    let bloatingCount = 0;
    let fatigueCount = 0;

    const moodCounts = {
      calm: 0,
      happy: 0,
      energetic: 0,
      sensitive: 0,
      irritable: 0,
      anxious: 0,
      low: 0,
      brain_fog: 0,
    };

    const energyCounts = {
      high: 0,
      balanced: 0,
      sluggish: 0,
      exhausted: 0,
    };

    for (const log of allLogs) {
      if (log.isPeriodDay) periodDaysLogged++;

      const symptoms = log.symptoms || [];
      if (symptoms.includes('cramps_mild')) crampsMildCount++;
      if (symptoms.includes('cramps_severe')) crampsSevereCount++;
      if (symptoms.includes('headache')) headacheCount++;
      if (symptoms.includes('backache')) backacheCount++;
      if (symptoms.includes('tender_breasts')) tenderBreastsCount++;
      if (symptoms.includes('bloating')) bloatingCount++;
      if (symptoms.includes('fatigue')) fatigueCount++;

      for (const mood of log.moods || []) {
        if (moodCounts[mood] !== undefined) {
          moodCounts[mood]++;
        }
      }

      if (log.energy && energyCounts[log.energy] !== undefined) {
        energyCounts[log.energy]++;
      }
    }

    const totalCrampsCount = crampsMildCount + crampsSevereCount;
    const crampsPeriodRatioPct =
      periodDaysLogged > 0 ? Math.min(100, Math.round((totalCrampsCount / periodDaysLogged) * 100)) : 0;

    let maxMoodCount = 0;
    let mostFrequentMood = null;
    for (const [mood, count] of Object.entries(moodCounts)) {
      if (count > maxMoodCount) {
        maxMoodCount = count;
        mostFrequentMood = mood;
      }
    }

    let maxEnergyCount = 0;
    let mostFrequentEnergy = null;
    for (const [energy, count] of Object.entries(energyCounts)) {
      if (count > maxEnergyCount) {
        maxEnergyCount = count;
        mostFrequentEnergy = energy;
      }
    }

    const physicalSymptomsList = [
      { id: 'cramps', label: 'Uterine Cramps (Mild & Severe)', count: totalCrampsCount },
      { id: 'headache', label: 'Headaches & Head Tension', count: headacheCount },
      { id: 'fatigue', label: 'Fatigue & Low Stamina', count: fatigueCount },
      { id: 'bloating', label: 'Abdominal Bloating', count: bloatingCount },
      { id: 'backache', label: 'Lower Back Tension', count: backacheCount },
      { id: 'tender_breasts', label: 'Breast Tenderness', count: tenderBreastsCount },
    ];


    const topPhysicalSymptoms = physicalSymptomsList
      .map(item => ({
        ...item,
        percentage: totalLoggedDays > 0 ? Math.round((item.count / totalLoggedDays) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalLoggedDays,
      periodDaysLogged,
      crampsMildCount,
      crampsSevereCount,
      totalCrampsCount,
      crampsPeriodRatioPct,
      headacheCount,
      backacheCount,
      tenderBreastsCount,
      bloatingCount,
      fatigueCount,
      moodCounts,
      mostFrequentMood,
      energyCounts,
      mostFrequentEnergy,
      topPhysicalSymptoms,
    };
  }

  // ==================== 3. LOCAL STORAGE HELPERS ====================
  const KEY_PROFILE = 'cyclecare_user_profile_v1';
  const KEY_LOGS = 'cyclecare_daily_logs_v1';
  const KEY_PAST_CYCLES = 'cyclecare_past_cycles_v1';
  const KEY_BOOKMARKS = 'cyclecare_bookmarked_articles_v1';

  function loadProfile() {
    try {
      const raw = localStorage.getItem(KEY_PROFILE);
      if (raw) return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
    } catch (e) {}
    return DEFAULT_USER_PROFILE;
  }

  function saveProfile(p) {
    try { localStorage.setItem(KEY_PROFILE, JSON.stringify(p)); } catch (e) {}
  }

  function loadLogs() {
    try {
      const raw = localStorage.getItem(KEY_LOGS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return INITIAL_LOGS;
  }

  function saveLogs(l) {
    try { localStorage.setItem(KEY_LOGS, JSON.stringify(l)); } catch (e) {}
  }

  function loadPastCycles() {
    try {
      const raw = localStorage.getItem(KEY_PAST_CYCLES);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return INITIAL_PAST_CYCLES;
  }

  function savePastCycles(pc) {
    try { localStorage.setItem(KEY_PAST_CYCLES, JSON.stringify(pc)); } catch (e) {}
  }

  function loadBookmarks() {
    try {
      const raw = localStorage.getItem(KEY_BOOKMARKS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return ['season-of-cycle', 'ovulation-demystified'];
  }

  function saveBookmarks(b) {
    try { localStorage.setItem(KEY_BOOKMARKS, JSON.stringify(b)); } catch (e) {}
  }

  // ==================== 3.5. SUPABASE AUTH & RLS STORAGE HELPERS ====================
  const KEY_SUPABASE_URL = 'cyclecare_supabase_url';
  const KEY_SUPABASE_ANON = 'cyclecare_supabase_anon_key';
  const KEY_AUTH_SESSION = 'cyclecare_auth_session';

  function validateSupabaseKey(key) {
    if (!key || key.trim() === '') return { isValid: false, error: 'Supabase Anon Key is required.' };
    const clean = key.trim().toLowerCase();
    if (clean.includes('service_role') || clean.startsWith('sb_secret_') || clean.startsWith('secret_')) {
      return {
        isValid: false,
        error: 'CRITICAL SECURITY ERROR: Secret service_role key detected! Never expose administrative service_role keys in client applications.',
      };
    }
    const parts = key.trim().split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1]));
        if (payload && payload.role === 'service_role') {
          return {
            isValid: false,
            error: 'CRITICAL SECURITY ERROR: Decoded JWT payload has role "service_role". Only public "anon" keys are permitted.',
          };
        }
      } catch (e) {}
    }
    return { isValid: true };
  }

  function getSupabaseConfig() {
    const envUrl = (typeof window !== 'undefined' && (window.__ENV__?.VITE_SUPABASE_URL || window.VITE_SUPABASE_URL)) || '';
    const envKey = (typeof window !== 'undefined' && (window.__ENV__?.VITE_SUPABASE_ANON_KEY || window.VITE_SUPABASE_ANON_KEY)) || '';
    const storedUrl = (typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_SUPABASE_URL) : null) || envUrl || '';
    const storedKey = (typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_SUPABASE_ANON) : null) || envKey || '';
    const cleanUrl = storedUrl.trim();
    const cleanKey = storedKey.trim();
    return {
      url: cleanUrl,
      anonKey: cleanKey,
      isConfigured: Boolean(cleanUrl && cleanKey && !cleanUrl.includes('your-project-id')),
    };
  }

  function setSupabaseConfig(url, anonKey) {
    const val = validateSupabaseKey(anonKey);
    if (!val.isValid) throw new Error(val.error);
    let u = url.trim();
    if (u.endsWith('/')) u = u.slice(0, -1);
    localStorage.setItem(KEY_SUPABASE_URL, u);
    localStorage.setItem(KEY_SUPABASE_ANON, anonKey.trim());
  }

  function clearSupabaseConfig() {
    localStorage.removeItem(KEY_SUPABASE_URL);
    localStorage.removeItem(KEY_SUPABASE_ANON);
  }

  function getStoredSession() {
    try {
      const raw = localStorage.getItem(KEY_AUTH_SESSION);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function saveStoredSession(s) {
    if (!s) {
      localStorage.removeItem(KEY_AUTH_SESSION);
    } else {
      localStorage.setItem(KEY_AUTH_SESSION, JSON.stringify(s));
    }
  }

  async function supabaseFetch(endpoint, options = {}, customToken) {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      throw new Error('Supabase is not configured. Please supply a valid URL and public Anon Key.');
    }
    const session = getStoredSession();
    const token = customToken || (session && session.accessToken) || config.anonKey;

    const url = `${config.url}${endpoint}`;
    const headers = {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {}),
    };

    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = text; }
    }
    if (!res.ok) {
      const msg = data?.error_description || data?.msg || data?.message || data?.error || `Request failed with status ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  async function supabaseSignUp({ email, password, fullName, isAnonymous }) {
    const payload = {
      email,
      password,
      data: {
        full_name: fullName || 'CycleCare Friend',
        is_anonymous: Boolean(isAnonymous),
      },
    };
    const res = await supabaseFetch('/auth/v1/signup', { method: 'POST', body: JSON.stringify(payload) });
    const user = {
      id: res.user?.id || res.id,
      email: res.user?.email || res.email,
      fullName: res.user?.user_metadata?.full_name || fullName || 'CycleCare Friend',
      isAnonymous: Boolean(res.user?.user_metadata?.is_anonymous),
      createdAt: res.user?.created_at || new Date().toISOString(),
    };
    let session = null;
    if (res.access_token) {
      session = {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        expiresAt: Date.now() + (res.expires_in || 3600) * 1000,
        user,
      };
      saveStoredSession(session);
    }
    return { user, session, requiresEmailConfirmation: !res.access_token };
  }

  async function supabaseSignIn({ email, password }) {
    const payload = { email, password };
    const res = await supabaseFetch('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify(payload) });
    const user = {
      id: res.user.id,
      email: res.user.email,
      fullName: res.user.user_metadata?.full_name || 'CycleCare Friend',
      isAnonymous: Boolean(res.user.user_metadata?.is_anonymous),
      createdAt: res.user.created_at,
    };
    const session = {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresAt: Date.now() + (res.expires_in || 3600) * 1000,
      user,
    };
    saveStoredSession(session);
    return { user, session };
  }

  async function supabaseResetPassword(email) {
    await supabaseFetch('/auth/v1/recover', { method: 'POST', body: JSON.stringify({ email }) });
    return { success: true, message: `Password reset instructions dispatched to ${email}.` };
  }

  async function supabaseSignOut() {
    const session = getStoredSession();
    if (session) {
      try { await supabaseFetch('/auth/v1/logout', { method: 'POST' }); } catch (e) {}
    }
    saveStoredSession(null);
  }

  async function fetchUserProfileCloud(userId) {
    try {
      const res = await supabaseFetch(`/rest/v1/profiles?id=eq.${userId}&select=*`, { method: 'GET' });
      if (Array.isArray(res) && res.length > 0) {
        const row = res[0];
        return {
          name: row.name,
          isAnonymous: Boolean(row.is_anonymous),
          goal: row.goal || 'track_period',
          lastPeriodStartDate: row.last_period_start_date,
          averageCycleLength: Number(row.average_cycle_length) || 28,
          averagePeriodLength: Number(row.average_period_length) || 5,
          lutealPhaseLength: Number(row.luteal_phase_length) || 14,
          isIrregularCycle: Boolean(row.is_irregular_cycle),
          pinLockEnabled: Boolean(row.pin_lock_enabled),
          pinCode: row.pin_code || '1234',
          periodReminderEnabled: row.period_reminder_enabled !== undefined ? Boolean(row.period_reminder_enabled) : true,
          periodReminderDaysBefore: Number(row.period_reminder_days_before) || 2,
          discreetNotifications: row.discreet_notifications !== undefined ? Boolean(row.discreet_notifications) : true,
          fertileAlert: row.fertile_alert !== undefined ? Boolean(row.fertile_alert) : true,
          hasCompletedOnboarding: row.has_completed_onboarding !== undefined ? Boolean(row.has_completed_onboarding) : true,
        };
      }
    } catch (e) {
      console.warn('Could not fetch cloud profile:', e);
    }
    return null;
  }

  async function upsertUserProfileCloud(userId, profile) {
    const payload = {
      id: userId,
      name: profile.name,
      is_anonymous: Boolean(profile.isAnonymous),
      goal: profile.goal || 'track_period',
      last_period_start_date: profile.lastPeriodStartDate,
      average_cycle_length: Number(profile.averageCycleLength) || 28,
      average_period_length: Number(profile.averagePeriodLength) || 5,
      luteal_phase_length: Number(profile.lutealPhaseLength) || 14,
      is_irregular_cycle: Boolean(profile.isIrregularCycle),
      pin_lock_enabled: Boolean(profile.pinLockEnabled),
      pin_code: profile.pinCode || '1234',
      period_reminder_enabled: profile.periodReminderEnabled !== false,
      period_reminder_days_before: Number(profile.periodReminderDaysBefore) || 2,
      discreet_notifications: Boolean(profile.discreetNotifications),
      fertile_alert: profile.fertileAlert !== false,
      has_completed_onboarding: Boolean(profile.hasCompletedOnboarding),
      updated_at: new Date().toISOString(),
    };
    await supabaseFetch('/rest/v1/profiles', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    });
  }

  async function fetchCycleLogsCloud(userId) {
    const res = await supabaseFetch(`/rest/v1/cycle_logs?user_id=eq.${userId}&select=*`, { method: 'GET' });
    const logs = {};
    if (Array.isArray(res)) {
      for (const row of res) {
        logs[row.date] = {
          date: row.date,
          isPeriodDay: Boolean(row.is_period_day),
          flow: row.flow || 'none',
          symptoms: row.symptoms || [],
          moods: row.moods || [],
          cervicalFluid: row.cervical_fluid,
          energy: row.energy,
          sleepHours: row.sleep_hours ? Number(row.sleep_hours) : undefined,
          sleepQuality: row.sleep_quality,
          waterGlasses: row.water_glasses !== undefined ? Number(row.water_glasses) : 8,
          temperature: row.temperature ? Number(row.temperature) : undefined,
          libido: row.libido,
          sexActivity: row.sex_activity,
          notes: row.notes || '',
          pillTaken: row.pill_taken !== undefined ? Boolean(row.pill_taken) : true,
        };
      }
    }
    return logs;
  }

  async function upsertCycleLogCloud(userId, log) {
    const payload = {
      user_id: userId,
      date: log.date,
      is_period_day: Boolean(log.isPeriodDay),
      flow: log.flow || 'none',
      symptoms: log.symptoms || [],
      moods: log.moods || [],
      cervical_fluid: log.cervicalFluid || null,
      energy: log.energy || null,
      sleep_hours: log.sleepHours !== undefined ? log.sleepHours : null,
      sleep_quality: log.sleepQuality || null,
      water_glasses: log.waterGlasses !== undefined ? log.waterGlasses : 8,
      temperature: log.temperature !== undefined ? log.temperature : null,
      libido: log.libido || null,
      sex_activity: log.sexActivity || null,
      notes: log.notes || '',
      pill_taken: log.pillTaken !== undefined ? log.pillTaken : true,
      updated_at: new Date().toISOString(),
    };
    await supabaseFetch('/rest/v1/cycle_logs', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    });
  }

  async function deleteCycleLogCloud(userId, dateStr) {
    await supabaseFetch(`/rest/v1/cycle_logs?user_id=eq.${userId}&date=eq.${dateStr}`, {
      method: 'DELETE',
    });
  }

  async function fetchPastCyclesCloud(userId) {
    const res = await supabaseFetch(`/rest/v1/past_cycles?user_id=eq.${userId}&order=start_date.desc&select=*`, { method: 'GET' });
    if (Array.isArray(res)) {
      return res.map(r => ({
        id: r.id,
        startDate: r.start_date,
        endDate: r.end_date,
        cycleLength: Number(r.cycle_length),
        periodDuration: Number(r.period_duration),
        ovulationDate: r.ovulation_date,
        symptomsSummary: r.symptoms_summary || [],
      }));
    }
    return [];
  }

  async function pushAllLocalToCloud(userId, profile, logs, pastCycles) {
    await upsertUserProfileCloud(userId, profile);
    for (const log of Object.values(logs)) {
      await upsertCycleLogCloud(userId, log);
    }
    for (const cycle of pastCycles) {
      const payload = {
        user_id: userId,
        start_date: cycle.startDate,
        end_date: cycle.endDate,
        cycle_length: cycle.cycleLength,
        period_duration: cycle.periodDuration,
        ovulation_date: cycle.ovulationDate,
        symptoms_summary: cycle.symptomsSummary || [],
      };
      await supabaseFetch('/rest/v1/past_cycles', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(payload),
      });
    }
  }

  // ==================== 4. MASTER APP COMPONENT ====================
  function CycleCareApp() {
    const [authUser, setAuthUser] = useState(() => {
      const s = getStoredSession();
      return s ? s.user : null;
    });
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const [profile, setProfile] = useState(loadProfile);
    const [currentPage, setCurrentPage] = useState(() => profile.hasCompletedOnboarding ? 'dashboard' : 'onboarding');
    const [logs, setLogs] = useState(loadLogs);
    const [pastCycles, setPastCycles] = useState(loadPastCycles);
    const [bookmarkedArticles, setBookmarkedArticles] = useState(loadBookmarks);

    const [isLocked, setIsLocked] = useState(false);
    const [quickLogModalOpen, setQuickLogModalOpen] = useState(false);
    const [quickLogDate, setQuickLogDate] = useState('2026-10-29');
    const [doctorReportModalOpen, setDoctorReportModalOpen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [pwaModalOpen, setPwaModalOpen] = useState(false);
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

    useEffect(() => {
      const handleBeforeInstall = (e) => {
        e.preventDefault();
        setDeferredInstallPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    const handlePromptInstall = async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          addToast('CycleCare added to Home Screen! 📱');
        }
        setDeferredInstallPrompt(null);
        setPwaModalOpen(false);
      }
    };

    useEffect(() => { saveProfile(profile); }, [profile]);
    useEffect(() => { saveLogs(logs); }, [logs]);
    useEffect(() => { savePastCycles(pastCycles); }, [pastCycles]);
    useEffect(() => { saveBookmarks(bookmarkedArticles); }, [bookmarkedArticles]);

    const addToast = (message, type = 'success') => {
      const t = { id: `t-${Date.now()}-${Math.random()}`, message, type };
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, 3500);
    };

    const removeToast = (id) => {
      setToasts(prev => prev.filter(x => x.id !== id));
    };

    const syncWithCloud = async (user) => {
      setIsSyncing(true);
      try {
        const remoteProfile = await fetchUserProfileCloud(user.id);
        if (remoteProfile) {
          setProfile(prev => ({ ...prev, ...remoteProfile }));
        } else {
          await upsertUserProfileCloud(user.id, profile);
        }

        const remoteLogs = await fetchCycleLogsCloud(user.id);
        if (Object.keys(remoteLogs).length > 0) {
          setLogs(remoteLogs);
        } else {
          for (const l of Object.values(logs)) {
            await upsertCycleLogCloud(user.id, l);
          }
        }

        const remotePast = await fetchPastCyclesCloud(user.id);
        if (remotePast.length > 0) {
          setPastCycles(remotePast);
        }

        addToast(`Encrypted cloud vault connected for ${user.email} (RLS Active)`);
      } catch (err) {
        console.error('Cloud sync error:', err);
        addToast(`Sync notice: ${err.message || 'Offline mode active'}`, 'warning');
      } finally {
        setIsSyncing(false);
      }
    };

    const handleManualPushCloud = async () => {
      if (!authUser) {
        setAuthModalOpen(true);
        return;
      }
      setIsSyncing(true);
      try {
        await pushAllLocalToCloud(authUser.id, profile, logs, pastCycles);
        addToast('All cycle records pushed to Supabase Cloud! ☁️');
      } catch (err) {
        addToast(`Push failed: ${err.message}`, 'warning');
      } finally {
        setIsSyncing(false);
      }
    };

    const handleAuthSuccess = (user) => {
      setAuthUser(user);
      syncWithCloud(user);
    };

    const handleSignOut = async () => {
      await supabaseSignOut();
      setAuthUser(null);
      addToast('Signed out of cloud account. Now running in Demo Mode.');
    };

    const todayDateStr = '2026-10-29';
    const cycleStatus = useMemo(() => computeCycleStatus(profile, todayDateStr, pastCycles), [profile, todayDateStr, pastCycles]);
    const todayLog = logs[todayDateStr] || {
      date: todayDateStr,
      isPeriodDay: false,
      flow: 'none',
      symptoms: [],
      moods: [],
      waterGlasses: 6,
      pillTaken: true,
    };

    const handleUpdateTodayLog = async (updated) => {
      const existing = logs[todayDateStr] || todayLog;
      const merged = { ...existing, ...updated };
      setLogs(prev => ({ ...prev, [todayDateStr]: merged }));
      addToast('Dashboard updated immediately!');

      if (authUser) {
        try { await upsertCycleLogCloud(authUser.id, merged); } catch (e) { console.warn(e); }
      }
    };

    const handleSaveLogForDate = async (log) => {
      setLogs(prev => ({ ...prev, [log.date]: log }));
      addToast(`Saved entry for ${log.date}!`);

      if (authUser) {
        try { await upsertCycleLogCloud(authUser.id, log); } catch (e) { console.warn(e); }
      }
    };

    const handleDeleteLogForDate = async (dateStr) => {
      setLogs(prev => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
      addToast(`Deleted entry for ${dateStr}`, 'info');

      if (authUser) {
        try { await deleteCycleLogCloud(authUser.id, dateStr); } catch (e) { console.warn(e); }
      }
    };

    const handleUpdateProfile = async (updated) => {
      const nextProfile = { ...profile, ...updated };
      setProfile(nextProfile);
      addToast('Recalculated cycle predictions & updated dashboard!');

      if (authUser) {
        try { await upsertUserProfileCloud(authUser.id, nextProfile); } catch (e) { console.warn(e); }
      }
    };

    const handleToggleBookmark = (articleId) => {
      setBookmarkedArticles(prev => {
        const exists = prev.includes(articleId);
        const next = exists ? prev.filter(x => x !== articleId) : [...prev, articleId];
        addToast(exists ? 'Article removed from saved' : 'Article bookmarked! 🔖');
        return next;
      });
    };

    const handleResetDemo = () => {
      saveProfile(DEFAULT_USER_PROFILE);
      saveLogs(INITIAL_LOGS);
      savePastCycles(INITIAL_PAST_CYCLES);
      saveBookmarks(['season-of-cycle', 'ovulation-demystified']);
      setProfile(DEFAULT_USER_PROFILE);
      setLogs(INITIAL_LOGS);
      setPastCycles(INITIAL_PAST_CYCLES);
      setBookmarkedArticles(['season-of-cycle', 'ovulation-demystified']);
      setCurrentPage('dashboard');
      addToast('Reset to realistic demo cycle data!');
    };

    const handleClearAll = () => {
      localStorage.clear();
      setLogs({});
      setPastCycles([]);
      setProfile({ ...DEFAULT_USER_PROFILE, hasCompletedOnboarding: false });
      setCurrentPage('onboarding');
      addToast('All local storage cleared', 'warning');
    };

    if (currentPage === 'onboarding' || !profile.hasCompletedOnboarding) {
      return h(React.Fragment, null,
        h(WelcomeOnboardingView, {
          profile,
          onComplete: (newProfile) => {
            setProfile(newProfile);
            setCurrentPage('dashboard');
            addToast('Welcome to CycleCare! Your journey begins.');
          },
          onUseDemoData: handleResetDemo,
          onOpenLogin: () => setAuthModalOpen(true),
        }),
        authModalOpen && h(AuthModalView, {
          isOpen: authModalOpen,
          onClose: () => setAuthModalOpen(false),
          authUser,
          onAuthSuccess: handleAuthSuccess,
          onEnterDemoMode: () => {
            setAuthUser(null);
            addToast('Now running in Demo Mode with local sample data.');
          },
          onSignOut: handleSignOut,
        }),
        h(ToastContainerView, { toasts, onDismiss: removeToast })
      );
    }

    return h('div', { className: 'min-h-screen bg-[#FFF5F7] text-slate-800 flex flex-col font-sans selection:bg-pink-200 selection:text-pink-900' },
      isLocked && h(PinLockModalView, {
        correctPin: profile.pinCode || '1234',
        onUnlock: () => {
          setIsLocked(false);
          addToast('CycleCare unlocked 🌸');
        },
      }),

      h('div', { className: 'flex-1 flex flex-col lg:flex-row min-h-screen' },
        h(NavigationView, {
          currentPage,
          onNavigate: (p) => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setCurrentPage(p);
          },
          onOpenQuickLog: () => {
            setQuickLogDate(todayDateStr);
            setQuickLogModalOpen(true);
          },
          isAnonymous: profile.isAnonymous,
          authUser,
          onOpenAuthModal: () => setAuthModalOpen(true),
        }),

        h('div', { className: 'flex-1 flex flex-col min-w-0' },
          h(HeaderView, {
            profile,
            cycleStatus,
            currentPage,
            onNavigate: setCurrentPage,
            onOpenQuickLog: () => {
              setQuickLogDate(todayDateStr);
              setQuickLogModalOpen(true);
            },
            onTogglePinLock: () => setIsLocked(true),
            authUser,
            onOpenAuthModal: () => setAuthModalOpen(true),
            isSyncing,
            onOpenAiModal: () => setAiModalOpen(true),
            onOpenPwaModal: () => setPwaModalOpen(true),
          }),

          h('main', { className: 'flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8' },
            currentPage === 'dashboard' && h(HomeDashboardView, {
              profile,
              cycleStatus,
              todayLog,
              onUpdateTodayLog: handleUpdateTodayLog,
              onDeleteLogForDate: handleDeleteLogForDate,
              onUpdateProfile: handleUpdateProfile,
              onOpenQuickLog: () => {
                setQuickLogDate(todayDateStr);
                setQuickLogModalOpen(true);
              },
              onNavigate: setCurrentPage,
              onOpenAiModal: () => setAiModalOpen(true),
            }),

            currentPage === 'calendar' && h(PeriodCalendarView, {
              profile,
              logs,
              onOpenLogForDate: (dStr) => {
                setQuickLogDate(dStr);
                setQuickLogModalOpen(true);
              },
              onUpdateLog: async (dStr, data) => {
                const existing = logs[dStr] || { date: dStr, flow: 'none', symptoms: [], moods: [] };
                const merged = { ...existing, ...data };
                setLogs(prev => ({ ...prev, [dStr]: merged }));
                addToast(`Updated record for ${dStr}`);
                if (authUser) {
                  try { await upsertCycleLogCloud(authUser.id, merged); } catch (e) { console.warn(e); }
                }
              },
              onDeleteLog: handleDeleteLogForDate,
            }),

            currentPage === 'tracker' && h(SymptomTrackerView, {
              initialDate: quickLogDate,
              logs,
              onSaveLog: handleSaveLogForDate,
              onDeleteLog: handleDeleteLogForDate,
            }),

            currentPage === 'insights' && h(CycleInsightsView, {
              profile,
              pastCycles,
              logs,
              onOpenDoctorReport: () => setDoctorReportModalOpen(true),
            }),

            currentPage === 'education' && h(HealthEducationView, {
              bookmarkedIds: bookmarkedArticles,
              onToggleBookmark: handleToggleBookmark,
            }),

            currentPage === 'settings' && h(SettingsPrivacyView, {
              profile,
              cycleStatus,
              logs,
              onUpdateProfile: handleUpdateProfile,
              onResetDemoData: handleResetDemo,
              onClearAllData: handleClearAll,
              onRevisitOnboarding: () => setCurrentPage('onboarding'),
              authUser,
              onOpenAuthModal: () => setAuthModalOpen(true),
              onSignOut: handleSignOut,
              onSyncCloud: handleManualPushCloud,
              isSyncing,
              onOpenPwaModal: () => setPwaModalOpen(true),
            })
          )
        )
      ),

      authModalOpen && h(AuthModalView, {
        isOpen: authModalOpen,
        onClose: () => setAuthModalOpen(false),
        authUser,
        onAuthSuccess: handleAuthSuccess,
        onEnterDemoMode: () => {
          setAuthUser(null);
          addToast('Now running in Demo Mode with local sample data.');
        },
        onSignOut: handleSignOut,
      }),

      quickLogModalOpen && h(QuickLogModalView, {
        dateStr: quickLogDate,
        existingLog: logs[quickLogDate],
        onClose: () => setQuickLogModalOpen(false),
        onSave: handleSaveLogForDate,
        onDelete: handleDeleteLogForDate,
      }),

      doctorReportModalOpen && h(DoctorReportModalView, {
        profile,
        pastCycles,
        logs,
        onClose: () => setDoctorReportModalOpen(false),
      }),

      // Floating Maya AI Assistant Button
      h('button', {
        type: 'button',
        onClick: () => setAiModalOpen(true),
        className: 'fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/30',
        title: 'Open Maya AI Cycle Assistant'
      },
        h('span', { className: 'text-base sm:text-lg animate-pulse' }, '💬'),
        h('span', null, 'Ask Maya AI')
      ),

      aiModalOpen && h(AiCompanionModalView, {
        isOpen: aiModalOpen,
        onClose: () => setAiModalOpen(false),
        cycleStatus,
        profile,
      }),

      pwaModalOpen && h(PwaInstallModalView, {
        isOpen: pwaModalOpen,
        onClose: () => setPwaModalOpen(false),
        deferredPrompt: deferredInstallPrompt,
        onPromptInstall: handlePromptInstall,
      }),

      h(ToastContainerView, { toasts, onDismiss: removeToast })
    );
  }

  // ==================== 5. SUB-COMPONENTS ====================

  // ----- NAVIGATION -----
  function NavigationView({ currentPage, onNavigate, onOpenQuickLog, isAnonymous, authUser, onOpenAuthModal }) {
    const navItems = [
      { id: 'dashboard', label: 'Today', icon: '🌸' },
      { id: 'calendar', label: 'Calendar', icon: '📅' },
      { id: 'tracker', label: 'Log Symptoms', icon: '💓' },
      { id: 'insights', label: 'Insights', icon: '📊' },
      { id: 'education', label: 'Learn', icon: '📖' },
      { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];


    return h(React.Fragment, null,
      h('aside', { className: 'hidden lg:flex flex-col w-64 bg-white/80 backdrop-blur-md border-r border-pink-100/80 p-5 shrink-0 z-30 select-none' },
        h('div', {
          onClick: () => onNavigate('dashboard'),
          className: 'flex items-center gap-3 cursor-pointer group mb-8 px-2'
        },
          h('div', { className: 'w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-purple-400 p-0.5 shadow-md shadow-pink-200/50 group-hover:scale-105 transition-all' },
            h('div', { className: 'w-full h-full bg-white rounded-[14px] flex items-center justify-center text-pink-500 text-lg' }, '🌸')
          ),
          h('div', null,
            h('span', { className: 'font-extrabold text-xl tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent block' }, 'CycleCare'),
            h('p', { className: 'text-[11px] font-medium text-purple-900/60 uppercase tracking-wider' }, 'Mindful Cycle Wellness')
          )
        ),

        h('button', {
          onClick: onOpenQuickLog,
          className: 'w-full mb-6 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold text-sm shadow-md shadow-pink-200/60 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2'
        }, '+ Log Today'),

        h('nav', { className: 'flex-1 space-y-1.5' },
          navItems.map(item => {
            const isActive = currentPage === item.id;
            return h('button', {
              key: item.id,
              onClick: () => onNavigate(item.id),
              className: `w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                isActive ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 font-semibold shadow-sm border border-pink-100/70' : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50/50'
              }`
            },
              h('span', { className: 'text-base' }, item.icon),
              h('span', { className: 'flex-1 text-left' }, item.label),
              isActive && h('span', { className: 'w-1.5 h-1.5 rounded-full bg-pink-500' })
            );
          })
        ),

        h('div', { className: 'mt-auto pt-4 border-t border-pink-100/60 space-y-2.5' },
          onOpenAuthModal && (
            !authUser ? h('button', {
              onClick: onOpenAuthModal,
              className: 'w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all'
            }, '🔑 Sign In / Log In') : h('button', {
              onClick: onOpenAuthModal,
              className: 'w-full py-2 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs flex items-center justify-between transition-all'
            },
              h('span', { className: 'flex items-center gap-1.5 truncate text-[11px]' },
                h('span', { className: 'w-2 h-2 rounded-full bg-emerald-500 shrink-0' }),
                authUser.email
              ),
              h('span', { className: 'text-[10px] text-emerald-600 font-bold shrink-0' }, 'Account')
            )
          ),
          h('div', { className: 'p-3 rounded-2xl bg-gradient-to-br from-pink-50/70 to-purple-50/70 border border-pink-100/80' },
            h('div', { className: 'flex items-center justify-between mb-1' },
              h('span', { className: 'text-[11px] font-semibold text-purple-900/80 flex items-center gap-1.5' }, '🛡️ On-Device Vault'),
              isAnonymous && h('span', { className: 'text-[9px] bg-purple-200 text-purple-800 font-bold px-1.5 py-0.5 rounded' }, 'ANON')
            ),
            h('p', { className: 'text-[11px] text-slate-500 leading-snug' }, 'Encrypted locally. Zero trackers or advertising profiling.')
          )
        )
      ),

      h('div', { className: 'lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-pink-100/90 px-2 py-1.5 shadow-[0_-4px_20px_rgba(244,114,182,0.12)]' },
        h('div', { className: 'flex items-center justify-around max-w-md mx-auto' },
          navItems.slice(0, 2).map(item => {
            const isActive = currentPage === item.id;
            return h('button', {
              key: item.id,
              onClick: () => onNavigate(item.id),
              className: `flex flex-col items-center py-1 px-3 rounded-xl transition-all ${isActive ? 'text-pink-600' : 'text-slate-400'}`
            },
              h('span', { className: 'text-lg' }, item.icon),
              h('span', { className: 'text-[10px] font-medium' }, item.label)
            );
          }),
          h('button', {
            onClick: onOpenQuickLog,
            className: '-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-500 text-white shadow-lg shadow-pink-300 flex items-center justify-center active:scale-95 transition-transform text-xl font-bold'
          }, '+'),
          navItems.slice(2, 5).map(item => {
            const isActive = currentPage === item.id;
            return h('button', {
              key: item.id,
              onClick: () => onNavigate(item.id),
              className: `flex flex-col items-center py-1 px-3 rounded-xl transition-all ${isActive ? 'text-pink-600' : 'text-slate-400'}`
            },
              h('span', { className: 'text-lg' }, item.icon),
              h('span', { className: 'text-[10px] font-medium' }, item.label)
            );
          })
        )
      )
    );
  }

  // ----- HEADER -----
  function HeaderView({ profile, cycleStatus, currentPage, onNavigate, onOpenQuickLog, onTogglePinLock, authUser, onOpenAuthModal, isSyncing, onOpenAiModal, onOpenPwaModal }) {
    const displayName = profile.isAnonymous ? 'CycleCare Friend' : (profile.name || 'Maya').split(' ')[0];

    return h('header', { className: 'sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-pink-100/70 px-4 sm:px-8 py-3.5 flex items-center justify-between' },
      h('div', { className: 'flex items-center gap-3' },
        h('div', {
          onClick: () => onNavigate('dashboard'),
          className: 'lg:hidden flex items-center gap-2 cursor-pointer'
        },
          h('div', { className: 'w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-500 p-0.5' },
            h('div', { className: 'w-full h-full bg-white rounded-[10px] flex items-center justify-center text-pink-500 font-bold text-xs' }, '🌸')
          ),
          h('span', { className: 'font-bold text-lg text-slate-800 tracking-tight' }, 'CycleCare')
        ),
        h('div', { className: 'hidden lg:block' },
          h('h2', { className: 'text-lg font-bold text-slate-800 flex items-center gap-2' },
            h('span', null, `Hello, ${displayName}`),
            h('span', { className: 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200/80' },
              `Day ${cycleStatus.currentCycleDay} of Cycle`
            )
          ),
          h('p', { className: 'text-xs text-slate-500' },
            `${cycleStatus.phaseTitle} · Predicted Next: ${cycleStatus.nextPeriodDate}`
          )
        )
      ),

      h('div', { className: 'flex items-center gap-2 sm:gap-3' },
        h('button', {
          type: 'button',
          onClick: onOpenAiModal,
          className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-sm transition-all',
          title: 'Chat with Maya AI'
        },
          h('span', null, '💬'),
          h('span', { className: 'hidden sm:inline' }, 'Maya AI')
        ),

        h('button', {
          type: 'button',
          onClick: onOpenPwaModal,
          className: 'hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-all',
          title: 'Install as Mobile App'
        },
          h('span', null, '📱'),
          h('span', null, 'Install')
        ),

        !authUser && h('button', {
          type: 'button',
          onClick: onOpenAuthModal,
          className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm transition-all'
        }, '🔑 Log In'),

        h('a', {
          href: '/login',
          title: 'Open standalone full-page login template',
          className: 'hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 px-2 py-1'
        }, 'Full Login ↗'),

        h('button', {
          type: 'button',
          onClick: onOpenAuthModal,
          className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            authUser
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
          }`,
          title: authUser ? `Signed in as ${authUser.email}. Click for Cloud settings.` : 'Running in local Demo Mode. Click to sign in or connect Supabase.'
        },
          isSyncing ? h('span', { className: 'w-2 h-2 rounded-full border border-purple-600 border-t-transparent animate-spin' })
          : authUser ? h('span', { className: 'w-2 h-2 rounded-full bg-emerald-500' })
          : h('span', { className: 'text-[10px]' }, '🧪'),
          h('span', { className: 'hidden md:inline' }, authUser ? (authUser.email.length > 20 ? `${authUser.email.slice(0, 18)}...` : authUser.email) : 'Demo Mode (Sample Data)'),
          h('span', { className: 'md:hidden' }, authUser ? 'Cloud' : 'Demo')
        ),

        h('div', { className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 text-xs font-semibold text-pink-800' },
          h('span', { className: 'w-2 h-2 rounded-full bg-pink-500 animate-ping' }),
          h('span', { className: 'hidden sm:inline' }, cycleStatus.phaseTitle),
          h('span', { className: 'sm:hidden' }, `Day ${cycleStatus.currentCycleDay}`)
        ),
        profile.pinLockEnabled && h('button', { onClick: onTogglePinLock, title: 'Lock App', className: 'p-2 rounded-xl bg-purple-50 text-purple-700' }, '🔒'),
        h('button', { onClick: onOpenQuickLog, className: 'hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-500 text-white text-xs font-semibold shadow-sm' }, '+ Log'),
        h('button', { onClick: () => onNavigate('settings'), className: `p-2 rounded-xl ${currentPage === 'settings' ? 'bg-pink-100 text-pink-700' : 'text-slate-500'}` }, '⚙️')
      )
    );
  }

  // ----- ONBOARDING WITH VALIDATION -----
  function WelcomeOnboardingView({ profile, onComplete, onUseDemoData, onOpenLogin }) {
    const [step, setStep] = useState(1);
    const [formProfile, setFormProfile] = useState({ ...profile });
    const [validation, setValidation] = useState({ isValid: true, errors: {}, warnings: {} });
    const totalSteps = 4;

    const goals = [
      { id: 'track_period', icon: '🌸', title: 'Track My Period & Menstrual Cycle', desc: 'Predict upcoming cycles, track flow intensity, and monitor personal health.' },
      { id: 'conceive', icon: '🌿', title: 'Trying to Conceive (TTC)', desc: 'Identify fertile windows, ovulation surges, and peak conception probability days.' },
      { id: 'symptoms', icon: '✨', title: 'Hormonal & Mood Wellness', desc: 'Connect physical symptoms, mood shifts, and nutrition to natural hormonal waves.' },
      { id: 'perimenopause', icon: '🌙', title: 'Perimenopause & Cycle Changes', desc: 'Track irregular intervals, hot flushes, and body transformations with compassion.' },
    ];


    const handleContinueFromStep3 = () => {
      const result = validateCycleParameters(formProfile.lastPeriodStartDate, formProfile.averageCycleLength, formProfile.averagePeriodLength);
      setValidation(result);
      if (result.isValid) {
        setStep(4);
      }
    };

    return h('div', { className: 'min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-6' },
      h('div', { className: 'w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-3xl border border-pink-100 shadow-xl shadow-pink-100/50 p-6 sm:p-10 relative overflow-hidden' },
        h('div', { className: 'relative z-10 mb-8' },
          h('div', { className: 'flex items-center justify-between text-xs font-semibold text-purple-900/60 mb-2' },
            h('span', null, `Step ${step} of ${totalSteps}`),
            h('div', { className: 'flex items-center gap-3' },
              onOpenLogin && h('button', { onClick: onOpenLogin, className: 'text-purple-700 font-bold hover:underline text-xs' }, '🔑 Log In'),
              h('span', { className: 'text-slate-300' }, '·'),
              h('button', { onClick: onUseDemoData, className: 'text-pink-600 hover:underline text-xs' }, 'Explore Demo →')
            )
          ),
          h('div', { className: 'h-1.5 w-full bg-pink-100/60 rounded-full overflow-hidden' },
            h('div', {
              className: 'h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 rounded-full',
              style: { width: `${(step / totalSteps) * 100}%` }
            })
          )
        ),

        step === 1 && h('div', { className: 'text-center' },
          h('div', { className: 'w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-500 p-1 shadow-lg shadow-pink-200' },
            h('div', { className: 'w-full h-full bg-white rounded-[20px] flex items-center justify-center text-3xl' }, '🌸')
          ),
          h('h1', { className: 'text-3xl font-extrabold text-slate-800 tracking-tight mb-3' }, 'Welcome to CycleCare'),
          h('p', { className: 'text-slate-600 leading-relaxed text-sm max-w-md mx-auto mb-6' },
            'Your mindful, private cycle companion. Track natural rhythms, record symptoms, and receive calibrated predictions.'
          ),
          h('div', { className: 'bg-pink-50/70 border border-pink-100 rounded-2xl p-4 text-left mb-8 space-y-1.5' },
            h('div', { className: 'text-xs font-bold text-pink-900' }, '🛡️ Privacy Guarantee'),
            h('p', { className: 'text-xs text-slate-600 leading-relaxed' },
              'Your health data is completely private. CycleCare stores logs exclusively on your device.'
            )
          ),
          h('button', {
            onClick: () => setStep(2),
            className: 'w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all'
          }, 'Let’s Personalize Your Journey →'),
          onOpenLogin && h('div', { className: 'mt-5 pt-4 border-t border-pink-100 text-center text-xs text-slate-500' },
            'Already have an account? ',
            h('button', {
              onClick: onOpenLogin,
              className: 'font-bold text-purple-700 hover:text-purple-900 underline'
            }, 'Sign In / Log In')
          )
        ),

        step === 2 && h('div', null,
          h('h2', { className: 'text-2xl font-bold text-slate-800 tracking-tight mb-2' }, 'What is your primary goal?'),
          h('div', { className: 'space-y-3 mb-8' },
            goals.map(g => {
              const isSelected = formProfile.goal === g.id;
              return h('div', {
                key: g.id,
                onClick: () => setFormProfile({ ...formProfile, goal: g.id }),
                className: `p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  isSelected ? 'border-pink-500 bg-pink-50/60 shadow-sm ring-2 ring-pink-400/30' : 'border-pink-100 bg-white'
                }`
              },
                h('span', { className: 'text-2xl mt-0.5' }, g.icon),
                h('div', { className: 'flex-1' },
                  h('h4', { className: 'font-semibold text-slate-800 text-sm' }, g.title),
                  h('p', { className: 'text-xs text-slate-500 mt-0.5 leading-relaxed' }, g.desc)
                )
              );
            })
          ),
          h('div', { className: 'flex items-center gap-3' },
            h('button', { onClick: () => setStep(1), className: 'py-3 px-5 rounded-2xl border text-slate-600 text-sm' }, 'Back'),
            h('button', { onClick: () => setStep(3), className: 'flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm shadow-md' }, 'Continue')
          )
        ),

        step === 3 && h('div', null,
          h('h2', { className: 'text-2xl font-bold text-slate-800 tracking-tight mb-2' }, 'Your Cycle Parameters'),
          h('p', { className: 'text-slate-500 text-sm mb-5' }, 'Enter your first day of last period and averages with validation.'),
          h('div', { className: 'space-y-5 mb-8' },
            h('div', null,
              h('label', { className: 'block text-xs font-semibold uppercase text-slate-600 mb-1.5' }, 'First Day of Last Period'),
              h('input', {
                type: 'date',
                value: formProfile.lastPeriodStartDate,
                onChange: (e) => setFormProfile({ ...formProfile, lastPeriodStartDate: e.target.value }),
                className: `w-full px-4 py-3 rounded-2xl border bg-white text-sm ${validation.errors.lastPeriodStartDate ? 'border-rose-400 bg-rose-50/20' : 'border-pink-200'}`
              }),
              validation.errors.lastPeriodStartDate && h('p', { className: 'text-xs text-rose-600 font-semibold mt-1' }, `⚠️ ${validation.errors.lastPeriodStartDate}`)
            ),
            h('div', null,
              h('div', { className: 'flex justify-between items-center mb-1' },
                h('label', { className: 'text-xs font-semibold uppercase text-slate-600' }, 'Average Cycle Length'),
                h('span', { className: 'text-sm font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200' }, `${formProfile.averageCycleLength} days`)
              ),
              h('input', {
                type: 'range',
                min: '15',
                max: '60',
                value: formProfile.averageCycleLength,
                onChange: (e) => setFormProfile({ ...formProfile, averageCycleLength: Number(e.target.value) }),
                className: 'w-full accent-pink-500'
              }),
              validation.errors.averageCycleLength && h('p', { className: 'text-xs text-rose-600 font-semibold mt-1' }, `⚠️ ${validation.errors.averageCycleLength}`)
            ),
            h('div', null,
              h('div', { className: 'flex justify-between items-center mb-1' },
                h('label', { className: 'text-xs font-semibold uppercase text-slate-600' }, 'Bleeding Duration'),
                h('span', { className: 'text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200' }, `${formProfile.averagePeriodLength} days`)
              ),
              h('input', {
                type: 'range',
                min: '1',
                max: '12',
                value: formProfile.averagePeriodLength,
                onChange: (e) => setFormProfile({ ...formProfile, averagePeriodLength: Number(e.target.value) }),
                className: 'w-full accent-purple-500'
              }),
              validation.errors.averagePeriodLength && h('p', { className: 'text-xs text-rose-600 font-semibold mt-1' }, `⚠️ ${validation.errors.averagePeriodLength}`)
            )
          ),
          h('div', { className: 'flex items-center gap-3' },
            h('button', { onClick: () => setStep(2), className: 'py-3 px-5 rounded-2xl border text-slate-600 text-sm' }, 'Back'),
            h('button', { onClick: handleContinueFromStep3, className: 'flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm shadow-md' }, 'Continue')
          )
        ),

        step === 4 && h('div', null,
          h('h2', { className: 'text-2xl font-bold text-slate-800 tracking-tight mb-2' }, 'Personalization & Ready!'),
          h('div', { className: 'space-y-4 mb-8' },
            h('div', null,
              h('label', { className: 'block text-xs font-semibold uppercase text-slate-600 mb-1.5' }, 'Your Name or Alias'),
              h('input', {
                type: 'text',
                value: formProfile.name,
                onChange: (e) => setFormProfile({ ...formProfile, name: e.target.value }),
                className: 'w-full px-4 py-3 rounded-2xl border border-pink-200 text-sm'
              })
            ),
            h('div', { className: 'p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed' },
              h('span', { className: 'font-bold block mb-0.5' }, '⚠️ Medical Notice:'),
              'CycleCare calculations are statistical forecasts for personal awareness, not medical guarantees or contraception advice.'
            )
          ),
          h('div', { className: 'flex items-center gap-3' },
            h('button', { onClick: () => setStep(3), className: 'py-3 px-5 rounded-2xl border text-slate-600 text-sm' }, 'Back'),
            h('button', {
              onClick: () => onComplete({ ...formProfile, hasCompletedOnboarding: true }),
              className: 'flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm shadow-lg'
            }, 'Finish & Enter CycleCare ✨')
          )
        )
      )
    );
  }

  // ----- HOME DASHBOARD WITH EDIT CALIBRATION & ESTIMATES -----
  function HomeDashboardView({ profile, cycleStatus, todayLog, onUpdateTodayLog, onDeleteLogForDate, onUpdateProfile, onOpenQuickLog, onNavigate, onOpenAiModal }) {
    const currentMode = profile.appMode || 'period';
    const [isEditingCycle, setIsEditingCycle] = useState(false);
    const [calibLastPeriod, setCalibLastPeriod] = useState(profile.lastPeriodStartDate || '2026-10-15');
    const [calibCycleLength, setCalibCycleLength] = useState(profile.averageCycleLength || 28);
    const [calibPeriodLength, setCalibPeriodLength] = useState(profile.averagePeriodLength || 5);
    const [calibIsIrregular, setCalibIsIrregular] = useState(Boolean(profile.isIrregularCycle));
    const [calibErrors, setCalibErrors] = useState({});
    const [showMissedPillInfo, setShowMissedPillInfo] = useState(false);

    // TTC States
    const [ttcBbtInput, setTtcBbtInput] = useState(todayLog.bbt || '97.8');
    const [ttcMucus, setTtcMucus] = useState(todayLog.cervicalMucus || 'creamy');
    const [ttcIntimacy, setTtcIntimacy] = useState(todayLog.intimacy || 'none');
    const [ttcLhResult, setTtcLhResult] = useState(profile.lhTestResult || todayLog.lhTestResult || 'low');

    // Pregnancy States
    const currentWeek = profile.pregnancyWeeks || 12;
    const [selectedWeek, setSelectedWeek] = useState(currentWeek);
    const [kickCount, setKickCount] = useState(0);
    const [lastKickTime, setLastKickTime] = useState(null);
    const [isEditingDueDate, setIsEditingDueDate] = useState(false);
    const [dueDateInput, setDueDateInput] = useState(profile.pregnancyDueDate || '2027-05-15');

    const calcDaysToDueDate = (eddStr) => {
      try {
        const edd = new Date(eddStr + 'T00:00:00');
        const now = new Date('2026-10-29T00:00:00');
        const diffDays = Math.ceil((edd - now) / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
      } catch (e) {
        return 196;
      }
    };
    const daysToDueDate = calcDaysToDueDate(profile.pregnancyDueDate || '2027-05-15');
    const weekData = PREGNANCY_WEEKS_DATA[selectedWeek] || PREGNANCY_WEEKS_DATA[12] || {
      fruit: 'Plum / Lime',
      length: '~2.1 in',
      weight: '~0.49 oz',
      trimester: 1,
      milestones: 'Fingernails developing, kidneys producing urine, reflexes forming.',
      maternalChanges: 'Morning sickness may begin easing; uterus size expanding above pelvic bone.'
    };

    const cycleLength = profile.averageCycleLength || 28;
    const currentDay = cycleStatus.currentCycleDay;
    const cyclePercent = Math.min(100, Math.round((currentDay / cycleLength) * 100));

    const radius = 100;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (cyclePercent / 100) * circumference;

    const currentGlasses = todayLog.waterGlasses || 0;
    const setWater = (count) => {
      onUpdateTodayLog({ waterGlasses: Math.max(0, Math.min(12, count)) });
    };

    const handleMoodSelect = (mood) => {
      const existing = todayLog.moods || [];
      const updated = existing.includes(mood) ? existing.filter(m => m !== mood) : [...existing, mood];
      onUpdateTodayLog({ moods: updated });
    };

    const togglePeriodToday = () => {
      const isPeriod = Boolean(todayLog.isPeriodDay);
      onUpdateTodayLog({
        isPeriodDay: !isPeriod,
        flow: !isPeriod ? (todayLog.flow && todayLog.flow !== 'none' ? todayLog.flow : 'medium') : 'none',
      });
    };

    const handleSaveCalibration = (e) => {
      e.preventDefault();
      const val = validateCycleParameters(calibLastPeriod, calibCycleLength, calibPeriodLength);
      setCalibErrors(val.errors);
      if (val.isValid) {
        onUpdateProfile({
          lastPeriodStartDate: calibLastPeriod,
          averageCycleLength: calibCycleLength,
          averagePeriodLength: calibPeriodLength,
          isIrregularCycle: calibIsIrregular,
        });
        setIsEditingCycle(false);
      }
    };

    const timelineDays = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
      const d = new Date(2026, 9, 29);
      d.setDate(d.getDate() + offset);
      const dayNum = currentDay + offset;
      const isToday = offset === 0;
      const isPeriod = dayNum <= (profile.averagePeriodLength || 5);
      const isOvulation = dayNum === (cycleLength - (profile.lutealPhaseLength || 14));
      const isFertile = dayNum >= (cycleLength - (profile.lutealPhaseLength || 14) - 5) && dayNum <= (cycleLength - (profile.lutealPhaseLength || 14) + 1);

      return {
        offset,
        dayNum: Math.max(1, dayNum),
        isToday,
        isPeriod,
        isOvulation,
        isFertile,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: d.getDate(),
      };
    });

    return h('div', { className: 'space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn' },
      // 1. Top Mode Switcher Bar
      h('div', { className: 'bg-white rounded-3xl p-2 sm:p-2.5 border border-pink-100 shadow-sm' },
        h('div', { className: 'grid grid-cols-3 gap-2' },
          [
            { id: 'period', label: 'Track Period', icon: '🌸', subtitle: 'Cycle & Flow' },
            { id: 'ttc', label: 'Trying to Conceive', icon: '🌿', subtitle: 'LH & Fertile Days' },
            { id: 'pregnancy', label: 'Track Pregnancy', icon: '🤰', subtitle: 'Fetal Milestones' },
          ].map(m => {
            const active = currentMode === m.id;
            return h('button', {
              key: m.id,
              type: 'button',
              onClick: () => onUpdateProfile({ appMode: m.id }),
              className: `py-2.5 sm:py-3 px-2 sm:px-4 rounded-2xl transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 ${
                active
                  ? m.id === 'period'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : m.id === 'ttc'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'hover:bg-pink-50/60 text-slate-600'
              }`
            },
              h('span', { className: 'text-xl sm:text-lg' }, m.icon),
              h('div', { className: 'text-left leading-tight hidden sm:block' },
                h('span', { className: 'block font-bold text-xs' }, m.label),
                h('span', { className: `text-[10px] ${active ? 'text-white/80' : 'text-slate-400'}` }, m.subtitle)
              ),
              h('span', { className: 'font-bold text-[11px] sm:hidden' }, m.label.replace('Track ', ''))
            );
          })
        )
      ),

      // Medical Advisory Banner
      h('aside', { className: 'p-4 rounded-3xl bg-amber-50/90 border border-amber-200 shadow-sm flex items-start gap-3.5' },
        h('span', { className: 'text-xl' }, '⚠️'),
        h('div', { className: 'flex-1 text-xs text-amber-900 leading-relaxed' },
          h('span', { className: 'font-bold uppercase tracking-wider block mb-0.5' }, 'Prediction Notice & Health Advisory'),
          'All upcoming period dates, fertile windows, and ovulation days are statistical estimates. They are ',
          h('strong', { className: 'underline' }, 'predictions, not medical diagnoses or fertility guarantees'),
          '. Do NOT rely on these predictions for contraception or birth control.'
        )
      ),

      // Optional Upcoming Period Reminder Card (Period Mode)
      currentMode === 'period' && profile.periodReminderEnabled !== false && cycleStatus.daysUntilNextPeriod <= (profile.periodReminderDaysBefore || 2) && (
        h('aside', { className: 'p-4 rounded-3xl bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 border border-pink-200 shadow-sm flex items-start gap-3.5 animate-fadeIn' },
          h('span', { className: 'text-xl' }, '🔔'),
          h('div', { className: 'flex-1 text-xs text-slate-800 leading-relaxed' },
            h('div', { className: 'flex items-center justify-between' },
              h('span', { className: 'font-bold text-pink-700 uppercase tracking-wider text-[11px]' },
                profile.discreetNotifications ? 'Personal Health Reminder' : 'Upcoming Period Alert'
              ),
              h('button', {
                onClick: () => onNavigate('settings'),
                className: 'text-[11px] text-purple-700 font-semibold hover:underline'
              }, 'Reminder Settings')
            ),
            h('p', { className: 'mt-0.5 text-slate-700' },
              profile.discreetNotifications
                ? `Your CycleCare wellness window begins in ${cycleStatus.daysUntilNextPeriod} day${cycleStatus.daysUntilNextPeriod === 1 ? '' : 's'}. Remember to stay hydrated, prioritize rest, and track changes.`
                : `Your next period is predicted to arrive in approximately ${cycleStatus.daysUntilNextPeriod} day${cycleStatus.daysUntilNextPeriod === 1 ? '' : 's'} (${cycleStatus.nextPeriodDate}). Keep your period products ready.`
            ),
            h('span', { className: 'text-[10px] text-slate-400 block mt-1' },
              `* Prediction estimate based on your personal ${profile.averageCycleLength}-day cycle rhythm. Not a medical guarantee.`
            )
          )
        )
      ),

      // ==================== MODE 1: PERIOD TRACKING ====================
      currentMode === 'period' && h(React.Fragment, null,
        // Hero Card
        h('section', { className: 'bg-gradient-to-br from-pink-50/90 via-white to-purple-50/80 rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm relative overflow-hidden' },
          h('div', { className: 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-center' },
            h('div', { className: 'lg:col-span-5 flex flex-col items-center justify-center' },
              h('div', { className: 'relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center' },
                h('svg', { className: 'w-full h-full transform -rotate-90', viewBox: '0 0 240 240' },
                  h('circle', { cx: '120', cy: '120', r: radius, fill: 'transparent', stroke: '#FCE7EC', strokeWidth: '14' }),
                  h('defs', null,
                    h('linearGradient', { id: 'dashCycleGrad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
                      h('stop', { offset: '0%', stopColor: '#EC4899' }),
                      h('stop', { offset: '100%', stopColor: '#A855F7' })
                    )
                  ),
                  h('circle', {
                    cx: '120',
                    cy: '120',
                    r: radius,
                    fill: 'transparent',
                    stroke: 'url(#dashCycleGrad)',
                    strokeWidth: '14',
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                    strokeLinecap: 'round',
                    className: 'transition-all duration-1000 ease-out'
                  })
                ),
                h('div', { className: 'absolute inset-0 flex flex-col items-center justify-center text-center p-6' },
                  h('span', { className: 'text-xs font-bold tracking-widest uppercase text-purple-900/60 mb-1' }, 'Day of Cycle'),
                  h('span', { className: 'text-5xl sm:text-6xl font-extrabold text-slate-800 tracking-tight leading-none' }, cycleStatus.currentCycleDay),
                  h('span', { className: 'text-xs font-semibold text-pink-600 mt-2 px-3 py-1 rounded-full bg-pink-100/80' }, cycleStatus.phaseTitle),
                  h('span', { className: 'text-[11px] text-slate-500 mt-1 font-medium' }, `${cycleStatus.daysUntilNextPeriod} days to next predicted period`)
                )
              ),
              h('div', { className: 'mt-4 flex flex-col items-center gap-1 text-center' },
                h('div', { className: 'flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/90 border border-purple-100 shadow-sm text-xs' },
                  h('span', { className: 'w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse' }),
                  h('span', { className: 'text-slate-600 font-medium' }, 'Forecast Confidence:'),
                  h('span', { className: 'font-bold text-purple-800' }, cycleStatus.predictionConfidence)
                ),
                h('span', { className: 'text-[10px] text-slate-400 italic' }, profile.isIrregularCycle ? 'Irregular rhythm active — wider prediction margins' : 'Calculated from user-entered cycle inputs')
              )
            ),

            // Overview Details & Calibration Button
            h('div', { className: 'lg:col-span-7 space-y-5' },
              h('div', { className: 'flex justify-between items-start gap-4' },
                h('div', null,
                  h('div', { className: 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/70 text-purple-800 text-xs font-semibold mb-2.5' },
                    h('span', { className: 'w-2 h-2 rounded-full bg-purple-500' }),
                    h('span', null, cycleStatus.phaseTitle)
                  ),
                  h('h3', { className: 'text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight' },
                    cycleStatus.isPeriodDay ? 'Menstrual Flow Active' : cycleStatus.isOvulationDay ? 'Ovulation Day ★' : cycleStatus.isFertileWindow ? 'Fertile Window' : 'Follicular / Luteal Phase'
                  ),
                  h('p', { className: 'text-slate-600 text-xs sm:text-sm mt-1.5 leading-relaxed' }, cycleStatus.phaseDescription)
                ),
                h('button', {
                  onClick: () => setIsEditingCycle(!isEditingCycle),
                  className: 'py-2 px-3.5 rounded-2xl border border-pink-200 bg-white/90 hover:bg-pink-50/80 text-pink-700 text-xs font-semibold transition-all shadow-2xs shrink-0'
                }, isEditingCycle ? 'Close Edit' : '✏️ Recalibrate')
              ),

              // Quick Info Grid
              h('div', { className: 'grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2' },
                h('div', { className: 'p-3.5 rounded-2xl bg-white/80 border border-pink-100/80 shadow-2xs' },
                  h('span', { className: 'block text-[11px] text-slate-400 font-medium' }, 'Predicted Period'),
                  h('span', { className: 'block text-sm font-bold text-slate-800 mt-0.5' }, cycleStatus.nextPeriodDate),
                  h('span', { className: 'block text-[10px] text-pink-600 font-semibold' }, `in ${cycleStatus.daysUntilNextPeriod} days`)
                ),
                h('div', { className: 'p-3.5 rounded-2xl bg-white/80 border border-purple-100/80 shadow-2xs' },
                  h('span', { className: 'block text-[11px] text-slate-400 font-medium' }, 'Ovulation Day'),
                  h('span', { className: 'block text-sm font-bold text-slate-800 mt-0.5' }, cycleStatus.ovulationDate),
                  h('span', { className: 'block text-[10px] text-purple-600 font-semibold' }, cycleStatus.isOvulationDay ? 'Today ★' : 'Predicted peak')
                ),
                h('div', { className: 'p-3.5 rounded-2xl bg-white/80 border border-pink-100/80 shadow-2xs col-span-2 sm:col-span-1' },
                  h('span', { className: 'block text-[11px] text-slate-400 font-medium' }, 'Fertile Window'),
                  h('span', { className: 'block text-xs font-bold text-slate-800 mt-0.5' }, `${cycleStatus.fertileWindowStart} → ${cycleStatus.fertileWindowEnd}`),
                  h('span', { className: 'block text-[10px] text-emerald-600 font-semibold' }, cycleStatus.isFertileWindow ? 'Active Window' : 'Estimated range')
                )
              ),

              // Period Log Toggle Button
              h('div', { className: 'pt-2 flex flex-wrap items-center gap-3' },
                h('button', {
                  type: 'button',
                  onClick: togglePeriodToday,
                  className: `py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                    todayLog.isPeriodDay
                      ? 'bg-rose-600 text-white shadow-rose-200'
                      : 'bg-white border-2 border-pink-300 text-pink-700 hover:bg-pink-50'
                  }`
                },
                  h('span', null, todayLog.isPeriodDay ? '🩸 Period Logged Today' : '🌸 Log Period Today'),
                  todayLog.isPeriodDay && h('span', { className: 'text-xs bg-rose-700/60 px-2 py-0.5 rounded-full' }, todayLog.flow || 'medium')
                ),
                h('button', {
                  type: 'button',
                  onClick: onOpenQuickLog,
                  className: 'py-3 px-5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-sm hover:opacity-95'
                }, '+ Log Symptoms & Moods')
              )
            )
          ),

          // Inline Recalibration Form
          isEditingCycle && h('div', { className: 'mt-6 pt-6 border-t border-pink-100 animate-fadeIn' },
            h('h4', { className: 'text-xs font-bold uppercase tracking-wider text-purple-900 mb-3' }, 'Recalibrate Personal Cycle Model'),
            h('form', { onSubmit: handleSaveCalibration, className: 'grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs' },
              h('div', null,
                h('label', { className: 'block font-semibold text-slate-700 mb-1' }, 'Last Period Start Date'),
                h('input', {
                  type: 'date',
                  value: calibLastPeriod,
                  onChange: (e) => setCalibLastPeriod(e.target.value),
                  className: `w-full p-2.5 rounded-xl border text-xs font-bold ${calibErrors.lastPeriodStartDate ? 'border-rose-400 bg-rose-50/20' : 'border-pink-200'}`
                }),
                calibErrors.lastPeriodStartDate && h('p', { className: 'text-rose-600 text-[11px] mt-1' }, calibErrors.lastPeriodStartDate)
              ),
              h('div', null,
                h('label', { className: 'block font-semibold text-slate-700 mb-1' }, `Cycle Length: ${calibCycleLength} days`),
                h('input', {
                  type: 'range',
                  min: '15',
                  max: '60',
                  value: calibCycleLength,
                  onChange: (e) => setCalibCycleLength(Number(e.target.value)),
                  className: 'w-full accent-pink-500 mt-2'
                }),
                calibErrors.averageCycleLength && h('p', { className: 'text-rose-600 text-[11px] mt-1' }, calibErrors.averageCycleLength)
              ),
              h('div', null,
                h('label', { className: 'block font-semibold text-slate-700 mb-1' }, `Period Duration: ${calibPeriodLength} days`),
                h('input', {
                  type: 'range',
                  min: '1',
                  max: '12',
                  value: calibPeriodLength,
                  onChange: (e) => setCalibPeriodLength(Number(e.target.value)),
                  className: 'w-full accent-purple-500 mt-2'
                }),
                calibErrors.averagePeriodLength && h('p', { className: 'text-rose-600 text-[11px] mt-1' }, calibErrors.averagePeriodLength)
              ),
              h('div', { className: 'sm:col-span-3 flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-100' },
                h('div', null,
                  h('span', { className: 'font-bold text-slate-800 block text-xs' }, 'Irregular Cycle Detection Mode'),
                  h('span', { className: 'text-[11px] text-slate-500' }, 'Widens statistical forecast margins to reflect natural menstrual variance.')
                ),
                h('input', {
                  type: 'checkbox',
                  checked: calibIsIrregular,
                  onChange: (e) => setCalibIsIrregular(e.target.checked),
                  className: 'w-5 h-5 accent-purple-600 rounded cursor-pointer'
                })
              ),
              h('div', { className: 'sm:col-span-3 flex justify-end gap-2 pt-2 border-t' },
                h('button', { type: 'button', onClick: () => setIsEditingCycle(false), className: 'py-2 px-4 rounded-xl border text-xs text-slate-600' }, 'Cancel'),
                h('button', { type: 'submit', className: 'py-2 px-5 rounded-xl bg-pink-500 text-white text-xs font-bold' }, 'Save & Recalculate')
              )
            )
          )
        ),

        // 7-Day Timeline Strip
        h('section', { className: 'bg-white rounded-3xl p-5 border border-pink-100/80 shadow-sm' },
          h('div', { className: 'flex items-center justify-between mb-4' },
            h('h3', { className: 'text-sm font-bold text-slate-800' }, 'Cycle Horizon (7-Day Strip)'),
            h('button', { onClick: () => onNavigate('calendar'), className: 'text-xs font-semibold text-pink-600 hover:underline' }, 'Open Calendar →')
          ),
          h('div', { className: 'grid grid-cols-7 gap-1.5 sm:gap-3' },
            timelineDays.map(item => h('div', {
              key: item.offset,
              onClick: () => onNavigate('calendar'),
              className: `p-2.5 sm:p-3 rounded-2xl text-center cursor-pointer transition-all border ${
                item.isToday ? 'bg-gradient-to-b from-pink-50 to-purple-50 border-pink-400 ring-2 ring-pink-300/40 shadow-sm' : 'bg-slate-50/60 border-slate-100 hover:border-pink-200'
              }`
            },
              h('span', { className: 'block text-[11px] text-slate-400' }, item.dayName),
              h('span', { className: `block text-base sm:text-lg font-bold my-0.5 ${item.isToday ? 'text-pink-600 font-extrabold' : 'text-slate-700'}` }, item.dateNum),
              h('div', { className: 'h-5 flex items-center justify-center' },
                item.isPeriod ? h('span', { className: 'w-2 h-2 rounded-full bg-rose-500' })
                  : item.isOvulation ? h('span', { className: 'w-3 h-3 rounded-full bg-purple-500 text-white text-[8px] flex items-center justify-center' }, '★')
                  : item.isFertile ? h('span', { className: 'w-2 h-2 rounded-full bg-emerald-400' })
                  : h('span', { className: 'w-1.5 h-1.5 rounded-full bg-slate-200' })
              ),
              h('span', { className: 'block text-[10px] text-slate-400 font-medium' }, `d${item.dayNum}`)
            ))
          )
        ),

        // Hormonal Synergy & Pill Pack Grid
        h('div', { className: 'grid grid-cols-1 lg:grid-cols-12 gap-6' },
          h('div', { className: 'lg:col-span-7 space-y-6' },
            h('div', { className: 'bg-gradient-to-br from-purple-50/60 via-white to-pink-50/40 rounded-3xl p-6 border border-purple-100/90 shadow-sm' },
              h('div', { className: 'flex items-center gap-2 mb-3' },
                h('span', { className: 'text-xl' }, '🌿'),
                h('span', { className: 'text-xs font-bold uppercase tracking-wider text-purple-800' },
                  `Daily Hormonal Synergy · ${cycleStatus.dailyTip.category}`
                )
              ),
              h('h4', { className: 'text-lg font-bold text-slate-800 mb-2' }, 'How to support your body today'),
              h('p', { className: 'text-slate-600 text-sm leading-relaxed mb-4' }, cycleStatus.dailyTip.text),
              h('div', { className: 'pt-3 border-t border-purple-100/70 flex items-center justify-between text-xs text-purple-900/70' },
                h('span', { className: 'italic' }, '“Listen to your rhythmic cycles with mindful reverence.”'),
                h('button', { onClick: () => onNavigate('education'), className: 'font-semibold text-pink-600 hover:underline' }, 'Read Guide →')
              )
            )
          ),
          h('div', { className: 'lg:col-span-5 space-y-6' },
            // Pill & Contraceptive Card
            h('div', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4' },
              h('div', { className: 'flex items-center justify-between' },
                h('div', { className: 'flex items-center gap-2' },
                  h('span', { className: 'text-lg' }, '💊'),
                  h('h4', { className: 'text-sm font-bold text-slate-800' }, 'Daily Pill & Contraceptive')
                ),
                h('span', {
                  className: `text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    todayLog.pillTaken !== false
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`
                }, todayLog.pillTaken !== false ? '✓ Taken' : 'Pending')
              ),

              // Daily action toggle
              h('div', { className: `p-3.5 rounded-2xl border transition-all ${
                todayLog.pillTaken !== false
                  ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border-emerald-200'
                  : 'bg-gradient-to-r from-pink-50/80 to-purple-50/60 border-pink-200'
              }` },
                h('div', { className: 'flex items-center justify-between gap-3' },
                  h('div', { className: 'flex items-center gap-2.5' },
                    h('div', { className: `w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      todayLog.pillTaken !== false ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white text-purple-600 border border-purple-200'
                    }` }, todayLog.pillTaken !== false ? '✓' : '💊'),
                    h('div', null,
                      h('span', { className: 'text-xs font-bold text-slate-800 block' },
                        todayLog.pillTaken !== false ? 'Pill recorded for today' : 'Daily dose reminder'
                      ),
                      h('span', { className: 'text-[11px] text-slate-500' },
                        `Scheduled daily at ${profile.pillReminderTime || '09:00 AM'}`
                      )
                    )
                  ),
                  h('button', {
                    type: 'button',
                    onClick: () => onUpdateTodayLog({ pillTaken: todayLog.pillTaken === false ? true : false }),
                    className: `py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      todayLog.pillTaken !== false
                        ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm hover:shadow'
                    }`
                  }, todayLog.pillTaken !== false ? 'Undo' : 'Mark Taken')
                )
              ),

              // 28-Day Pill Pack Visualizer (4 weeks of 7 pills)
              h('div', { className: 'space-y-1.5 pt-1' },
                h('div', { className: 'flex items-center justify-between text-[11px] text-slate-500' },
                  h('span', { className: 'font-semibold text-slate-700' }, `28-Day Pill Pack · Day ${((currentDay - 1) % 28) + 1} of 28`),
                  h('span', null, currentDay <= 21 ? 'Active Hormone Week' : 'Placebo / Rest Week')
                ),
                h('div', { className: 'p-3 rounded-2xl bg-slate-50/80 border border-slate-100' },
                  h('div', { className: 'grid grid-cols-7 gap-1.5 text-center' },
                    Array.from({ length: 28 }).map((_, pIdx) => {
                      const pillDay = pIdx + 1;
                      const isPlacebo = pillDay > 21;
                      const isCurrentPill = pillDay === (((currentDay - 1) % 28) + 1);
                      const isPastPill = pillDay < (((currentDay - 1) % 28) + 1);

                      let pillStyle = isPlacebo ? 'bg-purple-100 text-purple-700' : 'bg-pink-200 text-pink-800';
                      if (isPastPill) pillStyle = isPlacebo ? 'bg-purple-200 text-purple-900 opacity-60' : 'bg-pink-400 text-white';
                      if (isCurrentPill) pillStyle = todayLog.pillTaken !== false ? 'bg-emerald-500 text-white ring-2 ring-emerald-300' : 'bg-pink-500 text-white ring-2 ring-pink-400 animate-pulse';

                      return h('div', {
                        key: pillDay,
                        title: `Day ${pillDay}: ${isPlacebo ? 'Placebo / Non-hormonal pill' : 'Active pill'}`,
                        className: `h-6 rounded-lg text-[9px] font-bold flex items-center justify-center transition-all ${pillStyle}`
                      }, pillDay);
                    })
                  ),
                  h('div', { className: 'flex justify-between items-center text-[9px] text-slate-400 pt-2 px-1' },
                    h('span', { className: 'flex items-center gap-1' }, h('span', { className: 'w-2 h-2 rounded-full bg-pink-400' }), 'Days 1-21: Active'),
                    h('span', { className: 'flex items-center gap-1' }, h('span', { className: 'w-2 h-2 rounded-full bg-purple-200' }), 'Days 22-28: Placebo / Menses')
                  )
                )
              ),

              // Missed Pill Guide Toggle
              h('div', { className: 'pt-1' },
                h('button', {
                  type: 'button',
                  onClick: () => setShowMissedPillInfo(!showMissedPillInfo),
                  className: 'w-full py-1.5 text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center justify-between border-t border-slate-100 pt-2'
                },
                  h('span', null, '💡 Forgot a pill? Clinical ACOG Guidance'),
                  h('span', null, showMissedPillInfo ? '▲ Hide' : '▼ View')
                ),
                showMissedPillInfo && h('div', { className: 'mt-2 p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-slate-700 space-y-2 animate-fadeIn' },
                  h('p', { className: 'font-semibold text-purple-900 text-[11px]' }, 'Clinical Protocol (Combined Oral Contraceptives):'),
                  h('ul', { className: 'space-y-1.5 text-[11px] list-disc list-inside text-slate-600' },
                    h('li', null, h('strong', null, '1 Missed Pill (<48h): '), 'Take it as soon as remembered. Take your next pill at your usual time (even if taking 2 pills in 1 day). Backup contraception is generally not needed.'),
                    h('li', null, h('strong', null, '2+ Missed Pills (≥48h): '), 'Take the most recent missed pill immediately. Discard older missed pills. Continue pack daily and use barrier contraception (condoms) for 7 consecutive days.')
                  ),
                  h('span', { className: 'text-[10px] text-slate-400 block pt-1' }, '* Informational clinical guidance only. Consult your pharmacist or prescribing doctor.')
                )
              )
            )
          )
        )
      ),

      // ==================== MODE 2: TRYING TO CONCEIVE (TTC) ====================
      currentMode === 'ttc' && h('div', { className: 'space-y-6 animate-fadeIn' },
        // Fertility Probability Banner
        h('section', { className: 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/80 rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm relative overflow-hidden' },
          h('div', { className: 'flex flex-col md:flex-row md:items-center justify-between gap-6' },
            h('div', { className: 'space-y-2' },
              h('div', { className: 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold' },
                h('span', { className: 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse' }),
                h('span', null, `TTC Mode · Cycle Day ${cycleStatus.currentCycleDay}`)
              ),
              h('h3', { className: 'text-2xl font-extrabold text-slate-800 tracking-tight' },
                cycleStatus.isOvulationDay ? '🌟 Peak Ovulation Today!' : cycleStatus.isFertileWindow ? '✨ High Fertile Window Active' : 'Low Conception Likelihood Today'
              ),
              h('p', { className: 'text-xs text-slate-600 max-w-xl leading-relaxed' },
                cycleStatus.isOvulationDay
                  ? 'Your estimated ovulation occurs today! An unfertilized ovum remains viable for 12–24 hours after release.'
                  : cycleStatus.isFertileWindow
                  ? `You are inside your 6-day fertile window. Conception odds are highest 1–2 days before ovulation. Predicted ovulation: ${cycleStatus.ovulationDate}.`
                  : `Next fertile window is predicted from ${cycleStatus.fertileWindowStart} to ${cycleStatus.fertileWindowEnd}. Use this follicular phase to prioritize nutrient-dense nutrition and rest.`
              )
            ),
            h('div', { className: 'p-4 rounded-2xl bg-white/90 border border-emerald-100 text-center shadow-sm shrink-0 min-w-[200px]' },
              h('span', { className: 'text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider' }, 'Conception Odds'),
              h('span', { className: `text-lg font-extrabold px-3 py-1 rounded-xl block ${
                cycleStatus.isOvulationDay || ttcLhResult === 'peak' ? 'text-emerald-700 bg-emerald-100' : cycleStatus.isFertileWindow ? 'text-teal-700 bg-teal-100' : 'text-slate-600 bg-slate-100'
              }` },
                cycleStatus.isOvulationDay || ttcLhResult === 'peak' ? 'Peak (35%–42%)' : cycleStatus.isFertileWindow ? 'High (25%–30%)' : 'Low (<5%)'
              ),
              h('span', { className: 'text-[10px] text-slate-400 block mt-1.5' }, '* Statistical estimate based on cycle day')
            )
          )
        ),

        // LH Ovulation Test Strip Logger Card
        h('section', { className: 'bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4' },
          h('div', { className: 'flex items-center justify-between' },
            h('div', { className: 'flex items-center gap-2.5' },
              h('span', { className: 'text-2xl' }, '🧪'),
              h('div', null,
                h('h4', { className: 'text-sm font-bold text-slate-800' }, 'LH (Luteinizing Hormone) Ovulation Test Strip'),
                h('p', { className: 'text-xs text-slate-500' }, 'Log today\'s urine ovulation predictor kit (OPK) result')
              )
            ),
            h('span', { className: 'text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200' },
              `Today: ${ttcLhResult.toUpperCase()}`
            )
          ),

          h('div', { className: 'grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1' },
            [
              { id: 'negative', label: 'Negative', ratio: '< 0.5 T/C', color: 'border-slate-200 hover:border-slate-300' },
              { id: 'low', label: 'Low', ratio: '0.5 - 0.9 T/C', color: 'border-amber-200 hover:border-amber-300' },
              { id: 'high', label: 'High', ratio: '1.0 T/C', color: 'border-teal-300 hover:border-teal-400' },
              { id: 'peak', label: 'Peak Surge ★', ratio: '≥ 1.2 T/C', color: 'border-emerald-400 bg-emerald-50/50' },
            ].map(tier => {
              const selected = ttcLhResult === tier.id;
              return h('button', {
                key: tier.id,
                type: 'button',
                onClick: () => {
                  setTtcLhResult(tier.id);
                  onUpdateTodayLog({ lhTestResult: tier.id });
                  onUpdateProfile({ lhTestResult: tier.id });
                },
                className: `p-3 rounded-2xl border-2 text-left transition-all ${
                  selected
                    ? 'border-emerald-500 bg-emerald-50/90 shadow-sm ring-2 ring-emerald-200'
                    : tier.color + ' bg-slate-50/50'
                }`
              },
                h('div', { className: 'flex items-center justify-between mb-1' },
                  h('span', { className: 'text-xs font-bold text-slate-800' }, tier.label),
                  selected && h('span', { className: 'text-xs text-emerald-600' }, '✓')
                ),
                h('span', { className: 'text-[11px] text-slate-500 block' }, tier.ratio)
              );
            })
          ),

          h('div', { className: 'p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-700 leading-relaxed' },
            h('span', { className: 'font-semibold text-emerald-900 block mb-0.5' }, '💡 Clinical Guidance on LH Surges:'),
            'A peak LH surge signals an egg will typically be released within 24–36 hours. Intercourse on the surge day and the following 2 days maximizes conception probability. A surge does not guarantee an egg was released; combine with BBT tracking to confirm ovulation.'
          )
        ),

        // Basal Body Temp (BBT) & Cervical Mucus Grid
        h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
          // BBT Card
          h('section', { className: 'bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-3.5' },
            h('div', { className: 'flex items-center justify-between' },
              h('div', null,
                h('h4', { className: 'text-sm font-bold text-slate-800 flex items-center gap-1.5' },
                  h('span', null, '🌡️'),
                  h('span', null, 'Basal Body Temp (BBT)')
                ),
                h('p', { className: 'text-xs text-slate-500' }, 'Morning resting temperature before getting out of bed')
              ),
              h('span', { className: 'text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200' }, `${ttcBbtInput}°F`)
            ),
            h('div', { className: 'flex items-center gap-3' },
              h('input', {
                type: 'number',
                step: '0.1',
                min: '96.0',
                max: '101.0',
                value: ttcBbtInput,
                onChange: (e) => {
                  setTtcBbtInput(e.target.value);
                  onUpdateTodayLog({ bbt: e.target.value });
                },
                className: 'w-32 px-3.5 py-2 rounded-xl border border-emerald-200 text-sm font-bold text-slate-800'
              }),
              h('span', { className: 'text-xs text-slate-500 font-medium' }, '°F (Target: 97.2°F – 98.6°F)')
            ),
            h('p', { className: 'text-[11px] text-slate-500 leading-relaxed' },
              '📈 Thermal Shift: Progesterone secreted by the corpus luteum causes BBT to rise by 0.5°F–1.0°F after ovulation and remain elevated until menstruation.'
            )
          ),

          // Cervical Mucus Card
          h('section', { className: 'bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-3.5' },
            h('div', null,
              h('h4', { className: 'text-sm font-bold text-slate-800 flex items-center gap-1.5' },
                h('span', null, '💧'),
                h('span', null, 'Cervical Mucus Quality')
              ),
              h('p', { className: 'text-xs text-slate-500' }, 'Indicator of estrogen surge and sperm receptivity')
            ),
            h('div', { className: 'grid grid-cols-2 gap-2' },
              [
                { id: 'dry', label: 'Dry / None', desc: 'Low fertility' },
                { id: 'sticky', label: 'Sticky / Thick', desc: 'Low fertility' },
                { id: 'creamy', label: 'Creamy / Lotion', desc: 'Medium fertility' },
                { id: 'eggwhite', label: 'Egg-White ★', desc: 'Peak fertility (Stretchy)' },
              ].map(mucus => {
                const isSelected = ttcMucus === mucus.id;
                return h('button', {
                  key: mucus.id,
                  type: 'button',
                  onClick: () => {
                    setTtcMucus(mucus.id);
                    onUpdateTodayLog({ cervicalMucus: mucus.id });
                  },
                  className: `p-2.5 rounded-xl border text-left text-xs transition-all ${
                    isSelected ? 'border-teal-500 bg-teal-50/80 font-bold text-teal-900 ring-1 ring-teal-200' : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                  }`
                },
                  h('span', { className: 'block font-semibold' }, mucus.label),
                  h('span', { className: 'text-[10px] text-slate-400 block' }, mucus.desc)
                );
              })
            )
          )
        ),

        // Intimacy & Insemination Tracker
        h('section', { className: 'bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-3' },
          h('div', { className: 'flex items-center justify-between' },
            h('h4', { className: 'text-sm font-bold text-slate-800 flex items-center gap-1.5' },
              h('span', null, '💓'),
              h('span', null, 'Intercourse / Insemination Log')
            ),
            h('span', { className: 'text-xs font-semibold text-slate-500' }, 'Recorded for conception tracking')
          ),
          h('div', { className: 'flex flex-wrap gap-2.5' },
            [
              { id: 'unprotected', label: '✨ Unprotected (Fertile Window Timing)' },
              { id: 'protected', label: '🛡️ Protected' },
              { id: 'insemination', label: '💉 Insemination / IUI / IVF' },
              { id: 'none', label: 'None Today' },
            ].map(opt => {
              const active = ttcIntimacy === opt.id;
              return h('button', {
                key: opt.id,
                type: 'button',
                onClick: () => {
                  setTtcIntimacy(opt.id);
                  onUpdateTodayLog({ intimacy: opt.id });
                },
                className: `py-2 px-3.5 rounded-xl text-xs font-medium border transition-all ${
                  active ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`
              }, opt.label);
            })
          )
        )
      ),

      // ==================== MODE 3: PREGNANCY ====================
      currentMode === 'pregnancy' && h('div', { className: 'space-y-6 animate-fadeIn' },
        // Pregnancy Progress & EDD Banner
        h('section', { className: 'bg-gradient-to-br from-purple-50/90 via-white to-pink-50/80 rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-5' },
          h('div', { className: 'flex flex-col md:flex-row md:items-center justify-between gap-6' },
            h('div', { className: 'space-y-1.5' },
              h('div', { className: 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 text-purple-800 text-xs font-semibold' },
                h('span', { className: 'w-2 h-2 rounded-full bg-purple-600 animate-pulse' }),
                h('span', null, `Pregnancy Journey · Trimester ${weekData.trimester}`)
              ),
              h('h3', { className: 'text-3xl font-extrabold text-slate-800 tracking-tight' },
                `Week ${selectedWeek} of 40`
              ),
              h('p', { className: 'text-xs text-slate-600 leading-relaxed' },
                `Estimated Due Date: ${profile.pregnancyDueDate || '2027-05-15'} · Approximately ${daysToDueDate} days remaining until delivery`
              )
            ),
            h('div', { className: 'flex items-center gap-3 shrink-0' },
              h('button', {
                type: 'button',
                onClick: () => setIsEditingDueDate(!isEditingDueDate),
                className: 'py-2 px-4 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs transition-colors'
              }, isEditingDueDate ? 'Close EDD Form' : '📅 Change Due Date')
            )
          ),

          // Optional EDD form
          isEditingDueDate && h('div', { className: 'p-4 rounded-2xl bg-white border border-purple-200 space-y-3 animate-fadeIn' },
            h('label', { className: 'block text-xs font-bold text-slate-700' }, 'Set Your Estimated Due Date (EDD):'),
            h('div', { className: 'flex items-center gap-2' },
              h('input', {
                type: 'date',
                value: dueDateInput,
                onChange: (e) => setDueDateInput(e.target.value),
                className: 'px-3 py-2 rounded-xl border border-purple-200 text-xs font-bold text-slate-800'
              }),
              h('button', {
                type: 'button',
                onClick: () => {
                  onUpdateProfile({ pregnancyDueDate: dueDateInput });
                  setIsEditingDueDate(false);
                },
                className: 'py-2 px-4 rounded-xl bg-purple-600 text-white font-bold text-xs'
              }, 'Save Due Date')
            )
          ),

          // Week Progress Bar
          h('div', { className: 'space-y-1.5' },
            h('div', { className: 'flex justify-between text-xs font-bold text-slate-600' },
              h('span', null, 'Gestational Age Progress'),
              h('span', { className: 'text-purple-700' }, `${Math.round((selectedWeek / 40) * 100)}% Complete`)
            ),
            h('div', { className: 'w-full h-3 rounded-full bg-purple-100 overflow-hidden' },
              h('div', {
                className: 'h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-500',
                style: { width: `${(selectedWeek / 40) * 100}%` }
              })
            ),
            h('div', { className: 'flex justify-between text-[10px] text-slate-400 font-medium pt-0.5' },
              h('span', null, 'Conception (W1)'),
              h('span', null, 'Trimester 2 (W13)'),
              h('span', null, 'Trimester 3 (W27)'),
              h('span', null, 'Full Term (W40)')
            )
          ),

          // Week Stepper & Slider
          h('div', { className: 'pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-purple-100' },
            h('div', { className: 'flex items-center gap-2' },
              h('button', {
                type: 'button',
                disabled: selectedWeek <= 1,
                onClick: () => {
                  const w = Math.max(1, selectedWeek - 1);
                  setSelectedWeek(w);
                  onUpdateProfile({ pregnancyWeeks: w });
                },
                className: 'px-3 py-1.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-800 text-xs font-bold disabled:opacity-40'
              }, '◀ Prev Week'),
              h('span', { className: 'text-xs font-bold text-slate-700 px-2' }, `Week ${selectedWeek}`),
              h('button', {
                type: 'button',
                disabled: selectedWeek >= 40,
                onClick: () => {
                  const w = Math.min(40, selectedWeek + 1);
                  setSelectedWeek(w);
                  onUpdateProfile({ pregnancyWeeks: w });
                },
                className: 'px-3 py-1.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-800 text-xs font-bold disabled:opacity-40'
              }, 'Next Week ▶')
            ),
            h('div', { className: 'flex-1 max-w-xs flex items-center gap-2' },
              h('span', { className: 'text-[11px] text-slate-500 font-semibold' }, 'Jump:'),
              h('input', {
                type: 'range',
                min: '1',
                max: '40',
                value: selectedWeek,
                onChange: (e) => {
                  const w = Number(e.target.value);
                  setSelectedWeek(w);
                  onUpdateProfile({ pregnancyWeeks: w });
                },
                className: 'w-full accent-purple-600'
              }),
              h('span', { className: 'text-xs font-bold text-purple-700 w-8' }, `W${selectedWeek}`)
            )
          )
        ),

        // Fruit / Veg Size Visualizer Card
        h('section', { className: 'bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm' },
          h('div', { className: 'grid grid-cols-1 md:grid-cols-12 gap-6 items-center' },
            h('div', { className: 'md:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 border border-purple-100 text-center' },
              h('div', { className: 'w-24 h-24 rounded-3xl bg-white shadow-md flex items-center justify-center text-5xl mb-3' },
                weekData.fruit ? weekData.fruit.split(' ')[0] : '🫐'
              ),
              h('span', { className: 'text-xs font-bold uppercase tracking-wider text-purple-700' }, `Week ${selectedWeek} Size Comparison`),
              h('h4', { className: 'text-xl font-extrabold text-slate-800 mt-1' }, weekData.fruit || 'Lime'),
              h('div', { className: 'flex items-center gap-2 mt-2 text-xs font-semibold text-slate-600' },
                h('span', { className: 'px-2.5 py-1 rounded-lg bg-white border border-purple-100 shadow-2xs' }, `📏 ${weekData.length || '~2 inches'}`),
                h('span', { className: 'px-2.5 py-1 rounded-lg bg-white border border-purple-100 shadow-2xs' }, `⚖️ ${weekData.weight || '~0.5 oz'}`)
              )
            ),
            h('div', { className: 'md:col-span-7 space-y-4' },
              h('div', null,
                h('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-pink-600 block mb-1' }, 'Fetal Development Milestones'),
                h('h4', { className: 'text-base font-bold text-slate-800' }, 'What\'s happening with your baby this week:'),
                h('p', { className: 'text-xs text-slate-600 leading-relaxed mt-1.5' }, weekData.milestones)
              ),
              h('div', { className: 'pt-3 border-t border-slate-100' },
                h('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-purple-600 block mb-1' }, 'Maternal Body Changes'),
                h('p', { className: 'text-xs text-slate-600 leading-relaxed' }, weekData.maternalChanges)
              )
            )
          )
        ),

        // Interactive Baby Kick Counter & Daily Prenatal Checkoff
        h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
          // Kick Counter Card
          h('section', { className: 'bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4' },
            h('div', { className: 'flex items-center justify-between' },
              h('div', null,
                h('h4', { className: 'text-sm font-bold text-slate-800 flex items-center gap-1.5' },
                  h('span', null, '🦶'),
                  h('span', null, 'Interactive Kick Counter')
                ),
                h('p', { className: 'text-xs text-slate-500' }, 'Monitor fetal movement session')
              ),
              h('span', { className: 'text-xs font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200' },
                `${kickCount} Kicks`
              )
            ),

            h('div', { className: 'flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-tr from-purple-50 to-pink-50 border border-purple-100 text-center space-y-3' },
              h('button', {
                type: 'button',
                onClick: () => {
                  setKickCount(prev => prev + 1);
                  setLastKickTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                },
                className: 'w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white text-3xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer'
              }, '🦶'),
              h('div', null,
                h('span', { className: 'text-xs font-bold text-slate-800 block' }, 'Tap every time you feel a kick or flutter'),
                h('span', { className: 'text-[11px] text-slate-500' },
                  lastKickTime ? `Last kick recorded at ${lastKickTime}` : 'No kicks recorded yet in this session'
                )
              )
            ),

            h('div', { className: 'flex items-center justify-between pt-1' },
              h('button', {
                type: 'button',
                onClick: () => { setKickCount(0); setLastKickTime(null); },
                className: 'text-xs text-slate-500 hover:text-slate-700 font-semibold underline'
              }, 'Reset Session Count'),
              h('span', { className: 'text-[10px] text-slate-400' }, 'Target: 10 kicks within 2 hours (ACOG)')
            )
          ),

          // Daily Prenatal Vitamin & Hydration Checkoff
          h('section', { className: 'bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4 flex flex-col justify-between' },
            h('div', { className: 'space-y-2' },
              h('div', { className: 'flex items-center justify-between' },
                h('h4', { className: 'text-sm font-bold text-slate-800 flex items-center gap-1.5' },
                  h('span', null, '💊'),
                  h('span', null, 'Prenatal Vitamin Tracker')
                ),
                h('span', { className: `text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  profile.prenatalVitaminTaken ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-100 text-pink-800'
                }` }, profile.prenatalVitaminTaken ? 'Taken Today' : 'Pending')
              ),
              h('p', { className: 'text-xs text-slate-500 leading-relaxed' },
                'Daily prenatal vitamins deliver essential folic acid (400–800 mcg) to support neural tube closure and iron for hemoglobin development.'
              )
            ),

            h('button', {
              type: 'button',
              onClick: () => onUpdateProfile({ prenatalVitaminTaken: !profile.prenatalVitaminTaken }),
              className: `w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
                profile.prenatalVitaminTaken
                  ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-95'
              }`
            },
              h('span', { className: 'text-lg' }, profile.prenatalVitaminTaken ? '✅' : '💊'),
              h('span', null, profile.prenatalVitaminTaken ? 'Prenatal Vitamin Logged for Today (Tap to Undo)' : 'Mark Prenatal Vitamin as Taken Today')
            )
          )
        )
      ),

      // ==================== UNIVERSAL: HYDRATION & MOOD REFLECTION ====================
      h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
        // Hydration Card
        h('div', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm' },
          h('div', { className: 'flex items-center justify-between mb-3' },
            h('h4', { className: 'text-sm font-bold text-slate-800' }, '💧 Hydration Tracker'),
            h('span', { className: 'text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200' }, `${currentGlasses} / 8 Glasses`)
          ),
          h('div', { className: 'grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4' },
            Array.from({ length: 8 }).map((_, idx) => {
              const isFilled = idx < currentGlasses;
              return h('button', {
                key: idx,
                type: 'button',
                onClick: () => setWater(idx + 1),
                className: `h-11 rounded-xl flex items-center justify-center transition-all ${
                  isFilled ? 'bg-gradient-to-t from-pink-400 to-rose-400 text-white shadow-sm scale-105' : 'bg-slate-100 hover:bg-pink-100 text-slate-400'
                }`
              }, '💧');
            })
          ),
          h('div', { className: 'flex items-center gap-2' },
            h('button', { type: 'button', onClick: () => setWater(currentGlasses - 1), className: 'flex-1 py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold' }, '- Remove'),
            h('button', { type: 'button', onClick: () => setWater(currentGlasses + 1), className: 'flex-1 py-1.5 px-3 rounded-xl bg-pink-50 border border-pink-200 text-xs font-semibold text-pink-700' }, '+ Add Glass')
          )
        ),
        // Moods Card
        h('div', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm' },
          h('h4', { className: 'text-sm font-bold text-slate-800 mb-1' }, '🌸 Today\'s Mood Reflection'),
          h('div', { className: 'flex flex-wrap gap-2 mt-3' },
            [
              { id: 'calm', label: 'Calm & Centered', icon: '🕊️' },
              { id: 'happy', label: 'Joyful / Radiant', icon: '☀️' },
              { id: 'energetic', label: 'Vibrant Energy', icon: '⚡' },
              { id: 'sensitive', label: 'Tender / Soft', icon: '🌧️' },
              { id: 'irritable', label: 'Edgy / Irritable', icon: '🌪️' },
              { id: 'anxious', label: 'Anxious', icon: '💭' },
              { id: 'brain_fog', label: 'Brain Fog', icon: '🌫️' },
            ].map(m => {
              const isSelected = (todayLog.moods || []).includes(m.id);
              return h('button', {
                key: m.id,
                type: 'button',
                onClick: () => handleMoodSelect(m.id),
                className: `py-1.5 px-3 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isSelected ? 'bg-purple-100 border-purple-300 text-purple-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`
              }, `${m.icon} ${m.label}`);
            })
          )
        )
      )
    );
  }

  // ----- PERIOD CALENDAR WITH EDIT & DELETE -----
  function PeriodCalendarView({ profile, logs, onOpenLogForDate, onUpdateLog, onDeleteLog }) {
    const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(2026, 9, 1));
    const [selectedDateStr, setSelectedDateStr] = useState('2026-10-29');

    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const handlePrevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));
    const handleJumpToday = () => {
      setCurrentMonthDate(new Date(2026, 9, 1));
      setSelectedDateStr('2026-10-29');
    };

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const selectedClassification = getDateCycleClassification(selectedDateStr, profile, logs);
    const selectedLog = logs[selectedDateStr];

    const handleTogglePeriodForSelected = () => {
      const isPeriod = Boolean(selectedLog && selectedLog.isPeriodDay);
      onUpdateLog(selectedDateStr, {
        date: selectedDateStr,
        isPeriodDay: !isPeriod,
        flow: !isPeriod ? (selectedLog?.flow || 'medium') : 'none',
        symptoms: selectedLog?.symptoms || [],
        moods: selectedLog?.moods || [],
      });
    };

    const handleDeleteSelected = () => {
      if (window.confirm(`Delete all logged data for ${selectedDateStr}?`)) {
        onDeleteLog(selectedDateStr);
      }
    };

    return h('div', { className: 'space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn' },
      h('div', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4' },
        h('div', null,
          h('h2', { className: 'text-2xl font-extrabold text-slate-800 tracking-tight' }, monthName),
          h('p', { className: 'text-xs text-slate-500 mt-0.5' }, `Color-coded calendar showing recorded flows and estimated biological predictions`)
        ),
        h('div', { className: 'flex items-center gap-2' },
          h('button', { onClick: handleJumpToday, className: 'px-3.5 py-2 rounded-2xl bg-pink-50 border border-pink-200 text-xs font-semibold text-pink-700' }, 'Today'),
          h('div', { className: 'flex items-center border border-slate-200 rounded-2xl overflow-hidden bg-white' },
            h('button', { onClick: handlePrevMonth, className: 'p-2.5 hover:bg-slate-50 text-slate-600' }, '‹'),
            h('button', { onClick: handleNextMonth, className: 'p-2.5 hover:bg-slate-50 text-slate-600' }, '›')
          )
        )
      ),

      h('div', { className: 'grid grid-cols-1 lg:grid-cols-12 gap-6' },
        // Calendar Grid
        h('div', { className: 'lg:col-span-8 bg-white rounded-3xl p-5 sm:p-7 border border-pink-100 shadow-sm' },
          h('div', { className: 'grid grid-cols-7 gap-1 text-center mb-3' },
            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d =>
              h('span', { key: d, className: 'text-xs font-bold uppercase text-slate-400 py-1' }, d)
            )
          ),
          h('div', { className: 'grid grid-cols-7 gap-1.5 sm:gap-2' },
            Array.from({ length: firstDayOfMonth }).map((_, i) =>
              h('div', { key: `prev-${i}`, className: 'min-h-[56px] sm:min-h-[68px] p-1.5 rounded-2xl bg-slate-50/40 text-slate-300 text-xs flex items-center justify-center' },
                daysInPrevMonth - firstDayOfMonth + i + 1
              )
            ),
            Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDateStr === dStr;
              const isToday = dStr === '2026-10-29';
              const classification = getDateCycleClassification(dStr, profile, logs);

              return h('div', {
                key: dStr,
                onClick: () => setSelectedDateStr(dStr),
                className: `min-h-[60px] sm:min-h-[74px] p-1.5 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-between border ${
                  isSelected ? 'border-pink-500 ring-2 ring-pink-400/40 shadow-sm z-10' : 'border-slate-100 hover:border-pink-200'
                } ${
                  classification.isRecordedPeriod ? 'bg-rose-50/90 text-rose-900 border-rose-200'
                    : classification.isPredictedPeriod ? 'bg-pink-50/50 text-pink-900 border-dashed border-pink-200'
                    : classification.isOvulationDay ? 'bg-purple-50/80 text-purple-900 border-purple-200'
                    : classification.isFertileWindow ? 'bg-emerald-50/60 text-emerald-900 border-emerald-100'
                    : 'bg-white text-slate-700'
                }`
              },
                h('div', { className: 'w-full flex items-center justify-between px-1' },
                  h('span', { className: `text-xs font-bold ${isToday ? 'w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px]' : ''}` }, dayNum),
                  h('span', { className: 'text-[9px] text-slate-400' }, `d${classification.cycleDay}`)
                ),
                h('div', { className: 'my-auto flex items-center justify-center' },
                  classification.isRecordedPeriod ? h('span', { className: 'text-xs' }, '🩸')
                    : classification.isPredictedPeriod ? h('span', { className: 'px-1 py-0.5 rounded text-[8px] font-bold bg-pink-100 text-pink-700 border border-pink-200' }, 'Est.')
                    : classification.isOvulationDay ? h('span', { className: 'w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[9px] font-bold' }, '★')
                    : classification.isFertileWindow ? h('span', { className: 'text-[10px]' }, '🌿')
                    : null
                ),
                h('div', { className: 'h-2 flex items-center' },
                  classification.hasLog && h('span', { className: 'w-1.5 h-1.5 rounded-full bg-pink-500' })
                )
              );
            })
          ),

          // Legend
          h('div', { className: 'mt-6 pt-5 border-t border-pink-100/80 flex flex-wrap items-center gap-4 text-xs text-slate-600' },
            h('span', { className: 'flex items-center gap-1.5' }, h('span', { className: 'text-xs' }, '🩸'), h('span', { className: 'font-semibold text-rose-800' }, 'Period (Recorded)')),
            h('span', { className: 'flex items-center gap-1.5' }, h('span', { className: 'px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-50 border border-dashed border-pink-300 text-pink-700' }, 'Est.'), 'Estimated Prediction'),
            h('span', { className: 'flex items-center gap-1.5' }, h('span', { className: 'w-3 h-3 rounded bg-purple-500 text-white text-[8px] flex items-center justify-center font-bold' }, '★'), 'Estimated Ovulation'),
            h('span', { className: 'flex items-center gap-1.5' }, h('span', { className: 'text-xs' }, '🌿'), 'Estimated Fertile Window'),
            h('span', { className: 'flex items-center gap-1.5' }, h('span', { className: 'w-2 h-2 rounded-full bg-pink-500' }), 'Logged Entry')
          )
        ),

        // Inspector Sidebar
        h('div', { className: 'lg:col-span-4 bg-gradient-to-b from-white to-pink-50/30 rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col' },
          h('div', { className: 'border-b border-pink-100 pb-4 mb-4' },
            h('span', { className: 'text-xs font-bold text-pink-600 uppercase tracking-wider' }, 'Selected Date Inspector'),
            h('h3', { className: 'text-xl font-extrabold text-slate-800 mt-1' }, selectedDateStr),
            h('p', { className: 'text-xs text-slate-500 mt-0.5' },
              `Cycle Day ${selectedClassification.cycleDay} · ${
                selectedClassification.isRecordedPeriod ? 'Recorded Menstrual Day' :
                selectedClassification.isOvulationDay ? 'Estimated Ovulation Day' :
                selectedClassification.isFertileWindow ? 'Estimated Fertile Window' : 'Normal Cycle Rhythm'
              }`
            )
          ),

          h('div', { className: 'flex-1 space-y-4' },
            h('div', { className: 'p-3.5 rounded-2xl bg-white border border-pink-100 flex items-center justify-between shadow-sm' },
              h('div', null,
                h('span', { className: 'text-xs font-semibold text-slate-700 block' }, 'Menstrual Bleeding'),
                h('span', { className: 'text-xs text-slate-500' }, selectedLog?.isPeriodDay ? `Flow: ${selectedLog.flow || 'Recorded'}` : 'No flow recorded for this day')
              ),
              h('button', {
                onClick: handleTogglePeriodForSelected,
                className: 'px-3 py-1.5 rounded-xl text-xs font-semibold border bg-slate-50 hover:bg-pink-50'
              }, selectedLog?.isPeriodDay ? 'Remove Flow' : '+ Mark Flow')
            ),

            h('div', { className: 'p-3.5 rounded-2xl bg-white border border-pink-100 shadow-sm' },
              h('span', { className: 'text-xs font-semibold text-slate-700 block mb-1.5' }, 'Symptoms Logged'),
              selectedLog && selectedLog.symptoms && selectedLog.symptoms.length > 0 ? (
                h('div', { className: 'flex flex-wrap gap-1.5' },
                  selectedLog.symptoms.map(s => h('span', { key: s, className: 'px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-[11px] font-medium' }, s.replace('_', ' ')))
                )
              ) : h('p', { className: 'text-xs text-slate-400 italic' }, 'No symptoms recorded.')
            ),

            h('div', { className: 'p-3.5 rounded-2xl bg-white border border-pink-100 shadow-sm' },
              h('span', { className: 'text-xs font-semibold text-slate-700 block mb-1.5' }, 'Moods Logged'),
              selectedLog && selectedLog.moods && selectedLog.moods.length > 0 ? (
                h('div', { className: 'flex flex-wrap gap-1.5' },
                  selectedLog.moods.map(m => h('span', { key: m, className: 'px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-medium' }, m))
                )
              ) : h('p', { className: 'text-xs text-slate-400 italic' }, 'No moods recorded.')
            ),

            selectedLog?.notes && h('div', { className: 'p-3.5 rounded-2xl bg-white border border-pink-100 shadow-sm' },
              h('span', { className: 'text-xs font-semibold text-slate-700 block mb-1' }, 'Journal Note'),
              h('p', { className: 'text-xs text-slate-600 italic' }, `"${selectedLog.notes}"`)
            )
          ),

          h('div', { className: 'pt-4 mt-auto border-t border-pink-100 space-y-2' },
            h('button', {
              onClick: () => onOpenLogForDate(selectedDateStr),
              className: 'w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5'
            }, selectedLog ? '✏️ Edit Full Day Entry' : '+ Add Log For This Day'),

            selectedLog && h('button', {
              onClick: handleDeleteSelected,
              className: 'w-full py-2 px-3 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1'
            }, '🗑️ Delete This Day\'s Log')
          )
        )
      )
    );
  }

  // ----- SYMPTOM TRACKER WITH EDIT & DELETE -----
  function SymptomTrackerView({ initialDate, logs, onSaveLog, onDeleteLog }) {
    const [selectedDate, setSelectedDate] = useState(initialDate || '2026-10-29');
    const [currentTab, setCurrentTab] = useState('log');
    const [formLog, setFormLog] = useState(() => logs[selectedDate] || {
      date: selectedDate,
      isPeriodDay: false,
      flow: 'none',
      symptoms: [],
      moods: [],
      notes: '',
      pillTaken: true,
      waterGlasses: 8,
    });
    const [savedNotice, setSavedNotice] = useState(false);

    useEffect(() => {
      const existing = logs[selectedDate];
      if (existing) {
        setFormLog({ ...existing });
      } else {
        setFormLog({
          date: selectedDate,
          isPeriodDay: false,
          flow: 'none',
          symptoms: [],
          moods: [],
          notes: '',
          pillTaken: true,
          waterGlasses: 8,
        });
      }
    }, [selectedDate, logs]);

    const handleSave = (e) => {
      e.preventDefault();
      onSaveLog(formLog);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    };

    const handleDelete = () => {
      if (window.confirm(`Delete entry for ${selectedDate}?`)) {
        onDeleteLog(selectedDate);
        setFormLog({
          date: selectedDate,
          isPeriodDay: false,
          flow: 'none',
          symptoms: [],
          moods: [],
          notes: '',
        });
      }
    };

    const toggleSymptom = (s) => {
      const current = formLog.symptoms || [];
      const updated = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
      setFormLog({ ...formLog, symptoms: updated });
    };

    const toggleMood = (m) => {
      const current = formLog.moods || [];
      const updated = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
      setFormLog({ ...formLog, moods: updated });
    };

    const pastLogsList = Object.values(logs).sort((a, b) => b.date.localeCompare(a.date));
    const hasExistingEntry = Boolean(logs[selectedDate]);

    return h('div', { className: 'space-y-6 max-w-4xl mx-auto pb-12 animate-fadeIn' },
      h('div', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex items-center justify-between' },
        h('div', null,
          h('h2', { className: 'text-2xl font-extrabold text-slate-800 tracking-tight' }, 'Record Period & Symptoms'),
          h('p', { className: 'text-xs text-slate-500 mt-0.5' }, 'Log your flow intensity, physical discomfort, and emotional rhythms')
        ),
        h('div', { className: 'flex items-center p-1 bg-pink-50/70 rounded-2xl border border-pink-100' },
          h('button', {
            onClick: () => setCurrentTab('log'),
            className: `px-4 py-1.5 rounded-xl text-xs font-semibold ${currentTab === 'log' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-600'}`
          }, 'Log / Edit Entry'),
          h('button', {
            onClick: () => setCurrentTab('history'),
            className: `px-4 py-1.5 rounded-xl text-xs font-semibold ${currentTab === 'history' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-600'}`
          }, `Past Logs (${pastLogsList.length})`)
        )
      ),

      currentTab === 'history' ? (
        pastLogsList.length === 0 ? (
          h('div', { className: 'bg-white rounded-3xl p-12 text-center border border-pink-100 shadow-sm space-y-3 animate-fadeIn' },
            h('span', { className: 'text-4xl block mb-2' }, '📝'),
            h('h3', { className: 'text-base font-bold text-slate-800' }, 'No Symptom Entries Logged Yet'),
            h('p', { className: 'text-xs text-slate-500 max-w-sm mx-auto leading-relaxed' },
              'Start tracking your daily flows, body sensations, and emotional patterns to uncover your personal rhythm.'
            ),
            h('button', {
              type: 'button',
              onClick: () => setCurrentTab('log'),
              className: 'mt-3 py-2.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all'
            }, '+ Log Your First Entry')
          )
        ) : (
          h('div', { className: 'space-y-3' },
            pastLogsList.map(log => h('div', {
              key: log.date,
              className: 'bg-white rounded-3xl p-5 border border-pink-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'
            },
              h('div', { className: 'space-y-1' },
                h('div', { className: 'flex items-center gap-2' },
                  h('span', { className: 'font-bold text-slate-800 text-sm' }, log.date),
                  log.isPeriodDay && h('span', { className: 'px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold' }, `🩸 Flow: ${log.flow}`),
                  log.temperature && h('span', { className: 'px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs' }, `🌡️ ${log.temperature}°F`)
                ),
                h('div', { className: 'flex flex-wrap gap-1.5' },
                  (log.symptoms || []).map(s => h('span', { key: s, className: 'px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 text-[11px]' }, s.replace('_', ' '))),
                  (log.moods || []).map(m => h('span', { key: m, className: 'px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px]' }, m))
                ),
                log.notes && h('p', { className: 'text-xs text-slate-500 italic' }, `"${log.notes}"`)
              ),
              h('div', { className: 'flex items-center gap-2' },
                h('button', {
                  onClick: () => { setSelectedDate(log.date); setCurrentTab('log'); },
                  className: 'px-3 py-1.5 rounded-xl border border-pink-200 text-pink-700 text-xs font-semibold hover:bg-pink-50'
                }, 'Edit'),
                h('button', {
                  onClick: () => {
                    if (window.confirm(`Delete entry for ${log.date}?`)) {
                      onDeleteLog(log.date);
                    }
                  },
                  className: 'px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold'
                }, 'Delete')
              )
            ))
          )
        )
      ) : (
        h('form', { onSubmit: handleSave, className: 'space-y-6' },
          // Date Selector
          h('div', { className: 'bg-white rounded-3xl p-5 border border-pink-100 shadow-sm flex items-center justify-between' },
            h('span', { className: 'text-xs font-bold text-slate-700 uppercase tracking-wider' }, 'Selected Date:'),
            h('div', { className: 'flex items-center gap-2' },
              h('button', { type: 'button', onClick: () => setSelectedDate('2026-10-29'), className: 'text-xs font-semibold text-pink-600 hover:underline mr-1' }, 'Today'),
              h('input', {
                type: 'date',
                value: selectedDate,
                onChange: (e) => setSelectedDate(e.target.value),
                className: 'px-3 py-1.5 rounded-xl border border-pink-200 text-xs font-semibold text-slate-800 bg-pink-50/50'
              })
            )
          ),

          // Flow Category
          h('section', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-3' },
            h('h3', { className: 'text-sm font-bold text-slate-800' }, '🩸 Menstrual Flow (Record Period)'),
            h('div', { className: 'grid grid-cols-2 sm:grid-cols-5 gap-2.5' },
              [
                { id: 'none', label: 'No Bleeding', icon: '⚪' },
                { id: 'spotting', label: 'Spotting', icon: '🔹' },
                { id: 'light', label: 'Light Flow', icon: '💧' },
                { id: 'medium', label: 'Medium Flow', icon: '💧💧' },
                { id: 'heavy', label: 'Heavy Flow', icon: '🩸🩸' },
              ].map(f => {
                const isSelected = formLog.flow === f.id;
                return h('button', {
                  key: f.id,
                  type: 'button',
                  onClick: () => setFormLog({ ...formLog, flow: f.id, isPeriodDay: f.id !== 'none' }),
                  className: `py-3 px-3 rounded-2xl border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                    isSelected ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-200' : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-pink-50/30'
                  }`
                },
                  h('span', null, f.icon),
                  h('span', null, f.label)
                );
              })
            )
          ),

          // Symptoms Category
          h('section', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-3' },
            h('h3', { className: 'text-sm font-bold text-slate-800' }, '⚡ Physical Symptoms'),
            h('div', { className: 'flex flex-wrap gap-2' },
              [
                { id: 'cramps_mild', label: 'Mild Cramps', icon: '🌿' },
                { id: 'cramps_severe', label: 'Severe Cramps', icon: '💥' },
                { id: 'backache', label: 'Lower Back Ache', icon: '🦴' },
                { id: 'tender_breasts', label: 'Tender Breasts', icon: '🌸' },
                { id: 'headache', label: 'Headache / Migraine', icon: '⚡' },
                { id: 'bloating', label: 'Abdominal Bloating', icon: '🎈' },
                { id: 'pelvic_pressure', label: 'Pelvic Pressure', icon: '🪨' },
                { id: 'fatigue', label: 'Body Fatigue', icon: '🛌' },
              ].map(sym => {
                const isSelected = (formLog.symptoms || []).includes(sym.id);
                return h('button', {
                  key: sym.id,
                  type: 'button',
                  onClick: () => toggleSymptom(sym.id),
                  className: `py-2 px-3.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    isSelected ? 'bg-pink-100 border-pink-300 text-pink-800 font-semibold shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`
                }, `${sym.icon} ${sym.label} ${isSelected ? '✓' : '+'}`);
              })
            )
          ),

          // Moods Category
          h('section', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-3' },
            h('h3', { className: 'text-sm font-bold text-slate-800' }, '✨ Mood & Emotional State'),
            h('div', { className: 'flex flex-wrap gap-2' },
              [
                { id: 'calm', label: 'Calm & Grounded', icon: '🕊️' },
                { id: 'happy', label: 'Joyful & Confident', icon: '☀️' },
                { id: 'energetic', label: 'High Vitality', icon: '⚡' },
                { id: 'sensitive', label: 'Tender & Sensitive', icon: '🌧️' },
                { id: 'irritable', label: 'Edgy / Irritable', icon: '🌪️' },
                { id: 'anxious', label: 'Anxious / Overthinking', icon: '💭' },
                { id: 'brain_fog', label: 'Brain Fog', icon: '🌫️' },
              ].map(m => {
                const isSelected = (formLog.moods || []).includes(m.id);
                return h('button', {
                  key: m.id,
                  type: 'button',
                  onClick: () => toggleMood(m.id),
                  className: `py-2 px-3.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    isSelected ? 'bg-purple-100 border-purple-300 text-purple-900 font-semibold shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`
                }, `${m.icon} ${m.label}`);
              })
            )
          ),

          // Notes
          h('section', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-3' },
            h('h3', { className: 'text-sm font-bold text-slate-800' }, '📝 Journal Notes'),
            h('textarea', {
              rows: 2,
              placeholder: 'Record any details, supplements taken, or notes...',
              value: formLog.notes || '',
              onChange: (e) => setFormLog({ ...formLog, notes: e.target.value }),
              className: 'w-full p-3 rounded-2xl border border-pink-200 text-xs'
            })
          ),

          // Submit & Delete Bar
          h('div', { className: 'flex items-center justify-between pt-2' },
            h('div', null,
              hasExistingEntry && h('button', {
                type: 'button',
                onClick: handleDelete,
                className: 'py-2.5 px-4 rounded-2xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold'
              }, `🗑️ Delete Entry for ${selectedDate}`)
            ),
            h('div', { className: 'flex items-center gap-3' },
              savedNotice && h('span', { className: 'text-emerald-600 text-xs font-bold' }, '✓ Saved successfully!'),
              h('button', {
                type: 'submit',
                className: 'py-3 px-8 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all'
              }, 'Save Changes ✨')
            )
          )
        )
      )
    );
  }

  // ----- CYCLE INSIGHTS -----
  function CycleInsightsView({ profile, pastCycles, logs, onOpenDoctorReport }) {
    const insights = computeInsights(pastCycles, logs);
    const symptomTrends = computeSymptomTrends(logs);
    const [activeTab, setActiveTab] = useState('symptoms');

    const moodColorMap = {
      calm: 'from-emerald-400 to-teal-500',
      happy: 'from-amber-400 to-yellow-500',
      energetic: 'from-pink-500 to-rose-500',
      sensitive: 'from-purple-400 to-indigo-500',
      irritable: 'from-rose-500 to-red-600',
      anxious: 'from-orange-400 to-amber-600',
      low: 'from-blue-400 to-indigo-600',
      brain_fog: 'from-slate-400 to-slate-600',
    };

    return h('div', { className: 'space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn' },
      h('div', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4' },
        h('div', null,
          h('span', { className: 'text-xs font-bold text-pink-600 uppercase tracking-wider' }, 'Biometric Analytics & Body Literacy'),
          h('h2', { className: 'text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5' }, 'Cycle Insights & Symptom Trends'),
          h('p', { className: 'text-xs text-slate-500 mt-0.5' }, `Personal observations derived from ${symptomTrends.totalLoggedDays} logged daily entries across ${pastCycles.length} tracked cycles`)
        ),
        h('button', {
          onClick: onOpenDoctorReport,
          className: 'py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2'
        }, '📋 Export Clinical Summary')
      ),

      // Prominent Non-Diagnostic & Prediction Disclaimer Box
      h('div', { className: 'p-4 rounded-3xl bg-amber-50/90 border border-amber-200 shadow-sm flex items-start gap-3.5' },
        h('span', { className: 'text-xl shrink-0' }, '⚠️'),
        h('div', { className: 'text-xs text-amber-900 leading-relaxed' },
          h('span', { className: 'font-bold uppercase tracking-wider block mb-0.5' }, 'Important Medical & Prediction Notice'),
          'These trends and summaries reflect exclusively your ',
          h('strong', { className: 'underline' }, 'self-reported log entries'),
          ' to foster personal body literacy. CycleCare ',
          h('strong', { className: 'underline' }, 'does not diagnose medical conditions'),
          ' (such as endometriosis, PMDD, or migraine disorders) and does not replace consultation with a physician. Furthermore, cycle estimates and fertile windows are statistical projections derived from entered averages and are ',
          h('strong', { className: 'underline' }, 'not guaranteed predictions or contraception advice'),
          '.'
        )
      ),

      // Scorecards
      h('div', { className: 'grid grid-cols-2 lg:grid-cols-4 gap-4' },
        h('div', { className: 'bg-white p-5 rounded-3xl border border-pink-100 shadow-sm' },
          h('span', { className: 'text-[11px] font-bold uppercase text-slate-400 block mb-1' }, 'Regularity Score'),
          h('div', { className: 'flex items-baseline gap-2' },
            h('span', { className: 'text-3xl font-extrabold text-pink-600' }, `${insights.regularityScore}%`),
            h('span', { className: 'text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full' }, 'Predictable')
          ),
          h('p', { className: 'text-[11px] text-slate-500 mt-2' }, `Variability within ±1.5 days across ${pastCycles.length} recorded cycles.`)
        ),
        h('div', { className: 'bg-white p-5 rounded-3xl border border-pink-100 shadow-sm' },
          h('span', { className: 'text-[11px] font-bold uppercase text-slate-400 block mb-1' }, 'Avg Cycle Length'),
          h('div', { className: 'flex items-baseline gap-1' },
            h('span', { className: 'text-3xl font-extrabold text-purple-700' }, insights.averageLength),
            h('span', { className: 'text-xs text-slate-500 font-medium' }, 'days')
          ),
          h('p', { className: 'text-[11px] text-slate-500 mt-2' }, 'Personal rhythm (standard reference: 24–35 days).')
        ),
        h('div', { className: 'bg-white p-5 rounded-3xl border border-pink-100 shadow-sm' },
          h('span', { className: 'text-[11px] font-bold uppercase text-slate-400 block mb-1' }, 'Avg Bleeding Duration'),
          h('div', { className: 'flex items-baseline gap-1' },
            h('span', { className: 'text-3xl font-extrabold text-rose-600' }, insights.averagePeriod),
            h('span', { className: 'text-xs text-slate-500 font-medium' }, 'days')
          ),
          h('p', { className: 'text-[11px] text-slate-500 mt-2' }, 'Average self-reported flow duration (3–7 days).')
        ),
        h('div', { className: 'bg-white p-5 rounded-3xl border border-pink-100 shadow-sm' },
          h('span', { className: 'text-[11px] font-bold uppercase text-slate-400 block mb-1' }, 'Symptom Logs'),
          h('div', { className: 'flex items-baseline gap-1' },
            h('span', { className: 'text-3xl font-extrabold text-indigo-600' }, symptomTrends.totalLoggedDays),
            h('span', { className: 'text-xs text-slate-500 font-medium' }, 'days logged')
          ),
          h('p', { className: 'text-[11px] text-slate-500 mt-2' }, `${symptomTrends.periodDaysLogged} period days recorded with sensations.`)
        )
      ),

      // Tabs Navigation
      h('div', { className: 'flex border-b border-pink-100 space-x-6 text-sm font-semibold overflow-x-auto' },
        h('button', {
          onClick: () => setActiveTab('symptoms'),
          className: `pb-3 transition-colors relative shrink-0 ${activeTab === 'symptoms' ? 'text-pink-600 font-bold border-b-2 border-pink-500' : 'text-slate-500 hover:text-slate-800'}`
        }, 'Symptom History & Trends'),
        h('button', {
          onClick: () => setActiveTab('overview'),
          className: `pb-3 transition-colors relative shrink-0 ${activeTab === 'overview' ? 'text-pink-600 font-bold border-b-2 border-pink-500' : 'text-slate-500 hover:text-slate-800'}`
        }, 'Cycle Length Consistency'),
        h('button', {
          onClick: () => setActiveTab('correlations'),
          className: `pb-3 transition-colors relative shrink-0 ${activeTab === 'correlations' ? 'text-pink-600 font-bold border-b-2 border-pink-500' : 'text-slate-500 hover:text-slate-800'}`
        }, 'Reference Literature Patterns')
      ),

      // TAB 1: SYMPTOMS
      activeTab === 'symptoms' && (
        symptomTrends.totalLoggedDays === 0 ? (
          h('div', { className: 'bg-white rounded-3xl p-12 text-center border border-pink-100 shadow-sm space-y-3 animate-fadeIn' },
            h('span', { className: 'text-4xl block mb-2' }, '📊'),
            h('h3', { className: 'text-base font-bold text-slate-800' }, 'No Symptom History Recorded Yet'),
            h('p', { className: 'text-xs text-slate-500 max-w-md mx-auto leading-relaxed' },
              'Once you log your daily flow, body sensations, or moods in the Tracker or Calendar, your personalized cramps breakdown, headache correlations, and emotional rhythm charts will automatically generate here.'
            )
          )
        ) : (
          h('div', { className: 'space-y-6' },
            // Section 1: Cramps and Headaches
        h('section', { className: 'bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-6' },
          h('div', { className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2' },
            h('div', null,
              h('h3', { className: 'text-base font-bold text-slate-800' }, 'Cramps, Headaches & Physical Sensations'),
              h('p', { className: 'text-xs text-slate-500' }, 'Calculated directly from your personal symptom diary entries')
            ),
            h('span', { className: 'text-xs font-semibold px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200' }, 'Self-Reported Data')
          ),

          h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            // Cramp intensity
            h('div', { className: 'p-5 rounded-2xl bg-gradient-to-br from-rose-50/70 to-pink-50/50 border border-rose-100 space-y-3' },
              h('div', { className: 'flex items-center justify-between' },
                h('div', { className: 'flex items-center gap-2' },
                  h('span', { className: 'text-xl' }, '⚡'),
                  h('h4', { className: 'font-bold text-slate-800 text-sm' }, 'Menstrual Cramps Breakdown')
                ),
                h('span', { className: 'text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full' }, `${symptomTrends.totalCrampsCount} days logged`)
              ),
              h('p', { className: 'text-xs text-slate-600' },
                'Reported on ',
                h('strong', { className: 'font-bold text-slate-800' }, `${symptomTrends.crampsPeriodRatioPct}%`),
                ' of your recorded period days.'
              ),
              h('div', { className: 'space-y-2 pt-1' },
                h('div', null,
                  h('div', { className: 'flex justify-between text-[11px] font-semibold text-slate-600 mb-1' },
                    h('span', null, 'Mild Cramps'),
                    h('span', { className: 'font-bold text-pink-700' }, `${symptomTrends.crampsMildCount} day${symptomTrends.crampsMildCount === 1 ? '' : 's'}`)
                  ),
                  h('div', { className: 'h-3 w-full bg-pink-100 rounded-full overflow-hidden' },
                    h('div', {
                      style: { width: `${symptomTrends.totalLoggedDays > 0 ? (symptomTrends.crampsMildCount / symptomTrends.totalLoggedDays) * 100 : 0}%` },
                      className: 'h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full'
                    })
                  )
                ),
                h('div', null,
                  h('div', { className: 'flex justify-between text-[11px] font-semibold text-slate-600 mb-1' },
                    h('span', null, 'Severe Cramps'),
                    h('span', { className: 'font-bold text-rose-800' }, `${symptomTrends.crampsSevereCount} day${symptomTrends.crampsSevereCount === 1 ? '' : 's'}`)
                  ),
                  h('div', { className: 'h-3 w-full bg-rose-100 rounded-full overflow-hidden' },
                    h('div', {
                      style: { width: `${symptomTrends.totalLoggedDays > 0 ? (symptomTrends.crampsSevereCount / symptomTrends.totalLoggedDays) * 100 : 0}%` },
                      className: 'h-full bg-gradient-to-r from-rose-600 to-red-600 rounded-full'
                    })
                  )
                )
              ),
              h('div', { className: 'text-[11px] text-slate-500 pt-2 border-t border-rose-100/70' },
                'Pattern Note: Cramps were self-reported primarily during the first 48 hours of flow.'
              )
            ),

            // Headaches
            h('div', { className: 'p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 to-indigo-50/50 border border-purple-100 space-y-3' },
              h('div', { className: 'flex items-center justify-between' },
                h('div', { className: 'flex items-center gap-2' },
                  h('span', { className: 'text-xl' }, '🤕'),
                  h('h4', { className: 'font-bold text-slate-800 text-sm' }, 'Headaches & Tension')
                ),
                h('span', { className: 'text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full' }, `${symptomTrends.headacheCount} day${symptomTrends.headacheCount === 1 ? '' : 's'} logged`)
              ),
              h('p', { className: 'text-xs text-slate-600' },
                'Self-recorded on ',
                h('strong', { className: 'font-bold text-slate-800' }, `${symptomTrends.totalLoggedDays > 0 ? Math.round((symptomTrends.headacheCount / symptomTrends.totalLoggedDays) * 100) : 0}%`),
                ' of all logged days.'
              ),
              h('div', { className: 'space-y-2 pt-1' },
                h('div', null,
                  h('div', { className: 'flex justify-between text-[11px] font-semibold text-slate-600 mb-1' },
                    h('span', null, 'Headache Occurrences'),
                    h('span', { className: 'font-bold text-purple-700' }, symptomTrends.headacheCount)
                  ),
                  h('div', { className: 'h-3 w-full bg-purple-100 rounded-full overflow-hidden' },
                    h('div', {
                      style: { width: `${symptomTrends.totalLoggedDays > 0 ? (symptomTrends.headacheCount / symptomTrends.totalLoggedDays) * 100 : 0}%` },
                      className: 'h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full'
                    })
                  )
                ),
                h('div', null,
                  h('div', { className: 'flex justify-between text-[11px] font-semibold text-slate-600 mb-1' },
                    h('span', null, 'Backache & Pelvic Tension'),
                    h('span', { className: 'font-bold text-indigo-700' }, symptomTrends.backacheCount)
                  ),
                  h('div', { className: 'h-3 w-full bg-indigo-100 rounded-full overflow-hidden' },
                    h('div', {
                      style: { width: `${symptomTrends.totalLoggedDays > 0 ? (symptomTrends.backacheCount / symptomTrends.totalLoggedDays) * 100 : 0}%` },
                      className: 'h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full'
                    })
                  )
                )
              ),
              h('div', { className: 'text-[11px] text-slate-500 pt-2 border-t border-purple-100/70' },
                'Pattern Note: Head tension clustered in the late luteal transition and day 1 of menses.'
              )
            )
          ),

          // Physical symptoms ranking
          h('div', { className: 'space-y-3 pt-2' },
            h('h4', { className: 'text-xs font-bold uppercase tracking-wider text-slate-600' }, 'Frequency Ranking of All Self-Reported Physical Symptoms'),
            h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3' },
              symptomTrends.topPhysicalSymptoms.map(item => h('div', {
                key: item.id,
                className: 'p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between'
              },
                h('div', null,
                  h('span', { className: 'text-xs font-bold text-slate-700 block' }, item.label),
                  h('span', { className: 'text-[10px] text-slate-400' }, `${item.count} occurrences recorded`)
                ),
                h('div', { className: 'text-right' },
                  h('span', { className: 'text-sm font-extrabold text-pink-600' }, `${item.percentage}%`),
                  h('span', { className: 'text-[10px] text-slate-400 block' }, 'of log days')
                )
              ))
            )
          )
        ),

        // Section 2: Mood Changes
        h('section', { className: 'bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-5' },
          h('div', { className: 'flex items-center justify-between' },
            h('div', null,
              h('h3', { className: 'text-base font-bold text-slate-800' }, 'Mood Changes & Emotional Shifts'),
              h('p', { className: 'text-xs text-slate-500' }, 'Self-recorded moods across your logged cycle days')
            ),
            symptomTrends.mostFrequentMood && h('div', { className: 'text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200' },
              'Most Frequent: ',
              h('strong', { className: 'capitalize' }, symptomTrends.mostFrequentMood.replace('_', ' '))
            )
          ),
          h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3' },
            Object.entries(symptomTrends.moodCounts).map(([mood, count]) => {
              const pct = symptomTrends.totalLoggedDays > 0 ? Math.round((count / symptomTrends.totalLoggedDays) * 100) : 0;
              const gradient = moodColorMap[mood] || 'from-pink-400 to-purple-500';
              return h('div', { key: mood, className: 'p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2' },
                h('div', { className: 'flex items-center justify-between' },
                  h('span', { className: 'text-xs font-bold text-slate-700 capitalize' }, mood.replace('_', ' ')),
                  h('span', { className: 'text-xs font-extrabold text-slate-800' }, `${count}d`)
                ),
                h('div', { className: 'h-2 w-full bg-slate-200 rounded-full overflow-hidden' },
                  h('div', { style: { width: `${pct}%` }, className: `h-full bg-gradient-to-r ${gradient} rounded-full` })
                ),
                h('span', { className: 'text-[10px] text-slate-400 block text-right font-medium' }, `${pct}% of logged days`)
              );
            })
          ),
          h('div', { className: 'p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-slate-700 leading-relaxed' },
            '💡 ',
            h('strong', null, 'Self-Reported Observation: '),
            'Calm and energetic feelings were logged predominantly in the follicular and ovulatory phases, whereas sensitivity and irritability aligned with the late luteal window before menstruation.'
          )
        ),

        // Section 3: Energy Levels
        h('section', { className: 'bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-5' },
          h('div', { className: 'flex items-center justify-between' },
            h('div', null,
              h('h3', { className: 'text-base font-bold text-slate-800' }, 'Energy Levels & Vitality Trends'),
              h('p', { className: 'text-xs text-slate-500' }, 'Proportion of self-reported stamina ratings')
            ),
            symptomTrends.mostFrequentEnergy && h('div', { className: 'text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200' },
              'Dominant: ',
              h('strong', { className: 'capitalize' }, symptomTrends.mostFrequentEnergy)
            )
          ),
          h('div', { className: 'grid grid-cols-2 sm:grid-cols-4 gap-4' },
            [
              { id: 'high', label: 'High Energy', icon: '⚡', color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' },
              { id: 'balanced', label: 'Balanced', icon: '🌿', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
              { id: 'sluggish', label: 'Sluggish', icon: '☕', color: 'text-purple-600', bg: 'bg-purple-50', bar: 'bg-purple-500' },
              { id: 'exhausted', label: 'Exhausted', icon: '🌙', color: 'text-rose-600', bg: 'bg-rose-50', bar: 'bg-rose-500' },
            ].map(lvl => {
              const count = symptomTrends.energyCounts[lvl.id] || 0;
              const pct = symptomTrends.totalLoggedDays > 0 ? Math.round((count / symptomTrends.totalLoggedDays) * 100) : 0;
              return h('div', { key: lvl.id, className: `p-4 rounded-2xl ${lvl.bg} border border-slate-100 space-y-2` },
                h('div', { className: 'flex items-center justify-between' },
                  h('span', { className: 'text-base' }, lvl.icon),
                  h('span', { className: `text-xl font-extrabold ${lvl.color}` }, count)
                ),
                h('span', { className: 'text-xs font-bold text-slate-800 block' }, lvl.label),
                h('div', { className: 'h-2 w-full bg-white rounded-full overflow-hidden' },
                  h('div', { style: { width: `${pct}%` }, className: `h-full ${lvl.bar} rounded-full` })
                ),
                h('span', { className: 'text-[10px] text-slate-500 block' }, `${pct}% frequency`)
              );
            })
          )
        )
      ))),

      // TAB 2: OVERVIEW (BAR CHART)
      activeTab === 'overview' && h('section', { className: 'bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm space-y-5' },
        h('div', { className: 'flex justify-between items-center' },
          h('h3', { className: 'text-base font-bold text-slate-800' }, 'Cycle Length Consistency (Last 6 Cycles)'),
          h('div', { className: 'flex items-center gap-3 text-xs' },
            h('span', { className: 'flex items-center gap-1.5' }, h('span', { className: 'w-3 h-3 rounded bg-rose-400' }), 'Bleeding'),
            h('span', { className: 'flex items-center gap-1.5' }, h('span', { className: 'w-3 h-3 rounded bg-purple-200' }), 'Non-bleeding')
          )
        ),
        h('div', { className: 'space-y-3 pt-2' },
          pastCycles.map(c => {
            const periodPct = (c.periodDuration / 35) * 100;
            const remainingPct = ((c.cycleLength - c.periodDuration) / 35) * 100;
            return h('div', { key: c.id, className: 'space-y-1' },
              h('div', { className: 'flex justify-between text-xs font-medium text-slate-700' },
                h('span', null, c.startDate),
                h('span', { className: 'font-bold' }, `${c.cycleLength} days (${c.periodDuration}d bleeding)`)
              ),
              h('div', { className: 'h-6 w-full bg-slate-100 rounded-xl overflow-hidden flex' },
                h('div', { style: { width: `${periodPct}%` }, className: 'h-full bg-rose-400 flex items-center justify-center text-[10px] text-white font-bold' }, `${c.periodDuration}d`),
                h('div', { style: { width: `${remainingPct}%` }, className: 'h-full bg-purple-200 flex items-center justify-end px-2 text-[10px] text-purple-900 font-semibold' }, `${c.cycleLength}d`)
              )
            );
          })
        )
      ),

      // TAB 3: CORRELATIONS
      activeTab === 'correlations' && h('section', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4' },
        h('h3', { className: 'text-base font-bold text-slate-800' }, 'Identified Symptom Patterns in Clinical Literature'),
        h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
          insights.symptomCorrelations.map((corr, idx) => h('div', {
            key: idx,
            className: 'p-4 rounded-2xl bg-gradient-to-br from-pink-50/50 to-purple-50/40 border border-pink-100 space-y-2'
          },
            h('div', { className: 'flex justify-between items-center' },
              h('h4', { className: 'font-bold text-slate-800 text-sm' }, corr.symptom),
              h('span', { className: 'text-xs font-bold text-pink-600 bg-pink-100/70 px-2.5 py-0.5 rounded-full' }, corr.frequencyText)
            ),
            h('div', { className: 'text-xs text-purple-900 font-semibold' }, `Timing: ${corr.timing}`),
            h('p', { className: 'text-xs text-slate-600 leading-relaxed' }, corr.insight)
          ))
        )
      )
    );
  }

  // ----- HEALTH EDUCATION -----
  function HealthEducationView({ bookmarkedIds, onToggleBookmark }) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [activeQuizIndex, setActiveQuizIndex] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState({});

    const categories = [
      { id: 'all', label: 'All Topics' },
      { id: 'hormones', label: 'Hormones 101' },
      { id: 'nutrition', label: 'Nutrition & Syncing' },
      { id: 'fertility', label: 'Fertility & TTC' },
      { id: 'basics', label: 'Pelvic Health' },
    ];


    const filtered = ARTICLES_DATA.filter(a => {
      const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    const currentQuiz = QUIZ_QUESTIONS[activeQuizIndex];
    const answer = quizAnswers[currentQuiz.id];

    return h('div', { className: 'space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn' },
      h('div', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4' },
        h('div', null,
          h('span', { className: 'text-xs font-bold text-pink-600 uppercase tracking-wider' }, 'Health Academy'),
          h('h2', { className: 'text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5' }, 'Evidence-Based Articles'),
          h('p', { className: 'text-xs text-slate-500 mt-0.5' }, 'Medically reviewed guides written in plain, empowering language')
        ),
        h('input', {
          type: 'text',
          placeholder: 'Search topics, hormones, symptoms...',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          className: 'w-full md:w-72 px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/40'
        })
      ),

      // Top Medical Disclaimer Banner
      h('div', { className: 'p-4 rounded-3xl bg-purple-50/80 border border-purple-200 shadow-sm flex items-start gap-3.5' },
        h('span', { className: 'text-xl shrink-0' }, '🛡️'),
        h('div', { className: 'text-xs text-purple-950 leading-relaxed' },
          h('span', { className: 'font-bold uppercase tracking-wider block mb-0.5' }, 'Medical Disclaimer & Clinical Care Notice'),
          'All educational materials in CycleCare are written and medically reviewed for educational purposes only. ',
          h('strong', { className: 'underline font-bold' }, 'This app does not provide medical diagnoses, treatment plans, or clinical care, and does NOT replace consultation with a qualified healthcare provider.'),
          ' If you experience severe pain, sudden cycle changes, or concerning symptoms, please seek professional medical attention.'
        )
      ),

      // Quiz Widget
      h('section', { className: 'bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 rounded-3xl p-6 border border-pink-200/80 shadow-sm' },
        h('div', { className: 'flex justify-between items-center mb-2' },
          h('span', { className: 'text-xs font-bold uppercase text-purple-900 bg-purple-200/60 px-3 py-1 rounded-full' },
            `🧠 Myth vs Fact · Question ${activeQuizIndex + 1} of ${QUIZ_QUESTIONS.length}`
          ),
          h('button', {
            onClick: () => setActiveQuizIndex((activeQuizIndex + 1) % QUIZ_QUESTIONS.length),
            className: 'text-xs font-semibold text-purple-700 hover:underline'
          }, 'Next Question →')
        ),
        h('h3', { className: 'text-base sm:text-lg font-bold text-slate-800 mb-2' }, `"${currentQuiz.mythStatement}"`),
        h('p', { className: 'text-xs text-slate-600 mb-4' }, currentQuiz.question),
        !answer ? (
          h('div', { className: 'flex gap-3 max-w-sm' },
            h('button', {
              onClick: () => setQuizAnswers({ ...quizAnswers, [currentQuiz.id]: { chosen: true, isCorrect: currentQuiz.isFact } }),
              className: 'flex-1 py-2 px-4 rounded-xl bg-white border border-pink-200 text-xs font-bold text-slate-700 hover:bg-pink-50'
            }, '✅ Fact'),
            h('button', {
              onClick: () => setQuizAnswers({ ...quizAnswers, [currentQuiz.id]: { chosen: false, isCorrect: !currentQuiz.isFact } }),
              className: 'flex-1 py-2 px-4 rounded-xl bg-white border border-purple-200 text-xs font-bold text-slate-700 hover:bg-purple-50'
            }, '❌ Myth')
          )
        ) : (
          h('div', { className: `p-4 rounded-2xl border text-xs ${answer.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}` },
            h('div', { className: 'font-bold text-sm mb-1' }, answer.isCorrect ? '🎉 Correct!' : '💡 Actually...'),
            h('p', null, currentQuiz.explanation),
            h('span', { className: 'text-[10px] text-slate-400 font-semibold block mt-1' }, `Ref: ${currentQuiz.scientificReference}`)
          )
        )
      ),

      // Categories
      h('div', { className: 'flex flex-wrap gap-2' },
        categories.map(c => h('button', {
          key: c.id,
          onClick: () => setSelectedCategory(c.id),
          className: `py-1.5 px-3.5 rounded-full text-xs font-semibold transition-all border ${
            selectedCategory === c.id ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-slate-600 border-slate-200'
          }`
        }, c.label))
      ),

      // Grid of Articles
      h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
        filtered.length === 0 ? (
          h('div', { className: 'col-span-full bg-white rounded-3xl p-10 text-center border border-pink-100 shadow-sm space-y-3 animate-fadeIn' },
            h('span', { className: 'text-3xl block mb-1' }, '🔍'),
            h('h3', { className: 'text-base font-bold text-slate-800' }, 'No Articles Found'),
            h('p', { className: 'text-xs text-slate-500 max-w-sm mx-auto' },
              searchQuery ? `No articles matched your search query "${searchQuery}". Try searching for hormones, cramps, nutrition, or fertility.` : 'No articles match the current filter.'
            ),
            h('button', {
              onClick: () => { setSearchQuery(''); setSelectedCategory('all'); },
              className: 'mt-2 py-1.5 px-4 rounded-xl bg-pink-50 text-pink-700 border border-pink-200 text-xs font-semibold hover:bg-pink-100'
            }, 'Reset Filters')
          )
        ) : (
          filtered.map(article => {
            const isBookmarked = bookmarkedIds.includes(article.id);
            return h('article', {
              key: article.id,
              className: 'bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all'
            },
              h('div', { className: 'h-40 w-full relative overflow-hidden bg-pink-100' },
                h('img', { src: article.featuredImage, alt: article.title, className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500' }),
                h('button', {
                  type: 'button',
                  onClick: (e) => { e.stopPropagation(); onToggleBookmark(article.id); },
                  className: `absolute top-3 right-3 p-2 rounded-full backdrop-blur-md ${isBookmarked ? 'bg-purple-600 text-white' : 'bg-white/80 text-slate-600'}`
                }, isBookmarked ? '🔖' : '☆')
              ),
              h('div', { className: 'p-5 flex-1 flex flex-col justify-between' },
                h('div', null,
                  h('span', { className: 'text-[11px] text-slate-400 font-medium' }, `${article.readTimeMinutes} min read • By ${article.author}`),
                  h('h3', { className: 'font-extrabold text-base text-slate-800 mt-1 group-hover:text-pink-600 transition-colors' }, article.title),
                  h('p', { className: 'text-xs text-slate-500 mt-2 line-clamp-2' }, article.subtitle),
                  article.medicalReviewer && h('div', { className: 'mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100' },
                    h('span', null, '✓'),
                    h('span', null, `Medically reviewed by ${article.medicalReviewer}`),
                    h('span', null, '·'),
                    h('span', null, article.reviewDate)
                  )
                ),
                h('div', { className: 'mt-4 pt-3 border-t border-pink-50 flex items-center justify-between' },
                  h('span', { className: 'text-[11px] text-purple-900/60' }, article.publishDate),
                  h('button', {
                    onClick: () => setSelectedArticle(article),
                    className: 'text-xs font-bold text-pink-600 hover:underline'
                  }, 'Read Article →')
                )
              )
            );
          })
        )
      ),

      // Article Reader Modal
      selectedArticle && h('div', { className: 'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn' },
        h('div', { className: 'bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-pink-100 shadow-2xl relative my-auto' },
          h('button', { onClick: () => setSelectedArticle(null), className: 'absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-600' }, '✕'),
          h('span', { className: 'px-3 py-1 rounded-full bg-pink-100 text-pink-800 text-[11px] font-bold uppercase' }, selectedArticle.category),
          h('h2', { className: 'text-2xl font-extrabold text-slate-800 mt-3 mb-2' }, selectedArticle.title),
          h('p', { className: 'text-slate-600 text-sm italic mb-2' }, selectedArticle.subtitle),
          h('div', { className: 'flex flex-wrap items-center gap-2 text-xs text-slate-500 pb-3 border-b border-slate-100' },
            h('span', { className: 'font-bold text-slate-800' }, selectedArticle.author),
            h('span', null, '•'),
            h('span', null, selectedArticle.authorTitle),
            h('span', null, '•'),
            h('span', null, `${selectedArticle.readTimeMinutes} min read`)
          ),
          selectedArticle.medicalReviewer && h('div', { className: 'mt-3 mb-4 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5' },
            h('span', { className: 'text-base shrink-0' }, '🩺'),
            h('div', null,
              h('span', { className: 'font-bold' }, `Medically Reviewed by ${selectedArticle.medicalReviewer}`),
              h('span', { className: 'block text-[11px] text-emerald-800' }, selectedArticle.medicalReviewerTitle),
              h('span', { className: 'block text-[10px] text-emerald-700/80 mt-0.5' }, `Reviewed and verified for clinical accuracy on ${selectedArticle.reviewDate}`)
            )
          ),
          h('div', { className: 'p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 mb-6' },
            h('h4', { className: 'text-xs font-bold text-purple-900 mb-2' }, 'Key Takeaways:'),
            h('ul', { className: 'space-y-1 text-xs text-slate-700' },
              selectedArticle.keyTakeaways.map((t, idx) => h('li', { key: idx }, `• ${t}`))
            )
          ),
          h('div', { className: 'space-y-3 text-sm text-slate-700 leading-relaxed mb-6' },
            selectedArticle.contentParagraphs.map((p, idx) => h('p', { key: idx }, p))
          ),
          selectedArticle.sources && selectedArticle.sources.length > 0 && h('div', { className: 'p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 mb-6 space-y-2' },
            h('h4', { className: 'font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider' },
              h('span', null, '📚'),
              h('span', null, 'Scientific Sources & Medical Guidelines')
            ),
            h('ul', { className: 'space-y-1.5' },
              selectedArticle.sources.map((src, i) => h('li', { key: i, className: 'flex items-start gap-2 text-[11px] text-slate-600' },
                h('span', { className: 'font-bold text-purple-700' }, `[${i + 1}]`),
                h('div', null,
                  h('strong', { className: 'text-slate-800' }, src.title),
                  ' — ',
                  src.citation,
                  src.year ? ` (${src.year})` : ''
                )
              ))
            )
          ),
          h('div', { className: 'p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed mb-6' },
            h('strong', null, 'Medical Disclaimer: '),
            selectedArticle.disclaimer || 'This educational article is strictly for informational and body literacy purposes. It does not provide medical diagnoses, treatment instructions, or clinical guarantees. Always consult a licensed healthcare professional.'
          ),
          h('div', { className: 'pt-4 border-t flex justify-end' },
            h('button', { onClick: () => setSelectedArticle(null), className: 'py-2 px-5 rounded-xl bg-slate-800 text-white text-xs font-bold' }, 'Done Reading')
          )
        )
      )
    );
  }

  // ----- SETTINGS & PRIVACY WITH CYCLE VALIDATION -----
  function SettingsPrivacyView({ profile, cycleStatus, logs, onUpdateProfile, onResetDemoData, onClearAllData, onRevisitOnboarding, authUser, onOpenAuthModal, onSignOut, onSyncCloud, isSyncing, onOpenPwaModal }) {
    const [pinInput, setPinInput] = useState(profile.pinCode || '1234');
    const [lastPeriodInput, setLastPeriodInput] = useState(profile.lastPeriodStartDate || '2026-10-15');
    const [cycleLengthInput, setCycleLengthInput] = useState(profile.averageCycleLength || 28);
    const [periodLengthInput, setPeriodLengthInput] = useState(profile.averagePeriodLength || 5);
    const [isIrregularInput, setIsIrregularInput] = useState(Boolean(profile.isIrregularCycle));
    const [valErrors, setValErrors] = useState({});
    const [testNotificationVisible, setTestNotificationVisible] = useState(false);
    const [testNotificationMessage, setTestNotificationMessage] = useState('');
    const [browserPerm, setBrowserPerm] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'));

    const handleRequestRealPush = async () => {
      if (typeof Notification === 'undefined') {
        alert('Browser notifications are not supported in this browser.');
        return;
      }
      try {
        const perm = await Notification.requestPermission();
        setBrowserPerm(perm);
        if (perm === 'granted') {
          new Notification('CycleCare Notifications Active 🌸', {
            body: `Reminders enabled! You will receive alerts 2 days before predicted periods and daily pill reminders.`,
            icon: '/assets/icon-192.png',
          });
        }
      } catch (e) {
        console.warn(e);
      }
    };

    const handleExportCalendarIcs = () => {
      try {
        const fallbackStatus = {
          currentCycleDay: 15,
          phaseTitle: 'Ovulatory Phase',
          nextPeriodDate: '2026-11-12',
          ovulationDate: '2026-10-29',
          fertileWindowStart: '2026-10-24',
          fertileWindowEnd: '2026-10-30',
        };
        const icsContent = generateCycleCalendarIcs(profile, cycleStatus || fallbackStatus);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cyclecare_schedule_${profile.lastPeriodStartDate || 'cycle'}.ics`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('ICS export error:', err);
      }
    };

    const handleTestNotification = () => {
      const msg = profile.discreetNotifications
        ? 'CycleCare Update: Your wellness preparation window begins in 2 days. Drink plenty of water and prioritize rest.'
        : 'CycleCare Alert: Your next period is estimated to arrive in 2 days (Nov 12). Period essentials checklist ready!';
      setTestNotificationMessage(msg);
      setTestNotificationVisible(true);
      setTimeout(() => setTestNotificationVisible(false), 5000);
    };

    const handleSaveCycle = (e) => {
      e.preventDefault();
      const val = validateCycleParameters(lastPeriodInput, cycleLengthInput, periodLengthInput);
      setValErrors(val.errors);
      if (val.isValid) {
        onUpdateProfile({
          lastPeriodStartDate: lastPeriodInput,
          averageCycleLength: cycleLengthInput,
          averagePeriodLength: periodLengthInput,
          isIrregularCycle: isIrregularInput,
        });
      }
    };

    const downloadBackupJson = () => {
      const data = { profile, logs, exportDate: new Date().toISOString(), app: 'CycleCare' };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyclecare_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const handleRestoreBackupFile = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed && (parsed.profile || parsed.logs)) {
            if (parsed.profile) onUpdateProfile(parsed.profile);
            if (parsed.logs) {
              const merged = { ...logs, ...parsed.logs };
              saveLogs(merged);
            }
            alert('Backup restored successfully on this device! 🌸');
            window.location.reload();
          } else {
            alert('Invalid backup file format.');
          }
        } catch (err) {
          alert('Failed to read backup: ' + err.message);
        }
      };
      reader.readAsText(file);
    };

    const downloadCsv = () => {
      const headers = ['Date', 'PeriodDay', 'Flow', 'Symptoms', 'Moods', 'Notes'];
      const rows = Object.values(logs).map(l => [
        l.date,
        l.isPeriodDay ? 'Yes' : 'No',
        l.flow || 'none',
        `"${(l.symptoms || []).join(';')}"`,
        `"${(l.moods || []).join(';')}"`,
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ]);
      const csvStr = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvStr], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyclecare_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return h('div', { className: 'space-y-6 max-w-4xl mx-auto pb-12 animate-fadeIn' },
      h('div', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm' },
        h('span', { className: 'text-xs font-bold text-pink-600 uppercase tracking-wider' }, 'Preferences & Security'),
        h('h2', { className: 'text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5' }, 'Settings & Privacy'),
        h('p', { className: 'text-xs text-slate-500 mt-0.5' }, 'Full control over your health parameters, security lock, and data export')
      ),

      // Cycle Parameters Form
      h('section', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4' },
        h('h3', { className: 'text-sm font-bold text-slate-800' }, '⚙️ Cycle Calibration & Mathematical Forecasting'),
        h('form', { onSubmit: handleSaveCycle, className: 'space-y-4' },
          h('div', null,
            h('label', { className: 'block text-xs font-bold text-slate-700 uppercase mb-1' }, 'First Day of Last Period'),
            h('input', {
              type: 'date',
              value: lastPeriodInput,
              onChange: (e) => setLastPeriodInput(e.target.value),
              className: `w-full max-w-xs px-3 py-2 rounded-xl border text-xs font-semibold ${valErrors.lastPeriodStartDate ? 'border-rose-400 bg-rose-50/20' : 'border-pink-200'}`
            }),
            valErrors.lastPeriodStartDate && h('p', { className: 'text-xs text-rose-600 font-semibold mt-1' }, `⚠️ ${valErrors.lastPeriodStartDate}`)
          ),
          h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
            h('div', null,
              h('div', { className: 'flex justify-between text-xs font-bold mb-1' },
                h('span', null, 'Average Cycle Length'),
                h('span', { className: 'text-pink-600' }, `${cycleLengthInput} days`)
              ),
              h('input', {
                type: 'range',
                min: '15',
                max: '60',
                value: cycleLengthInput,
                onChange: (e) => setCycleLengthInput(Number(e.target.value)),
                className: 'w-full accent-pink-500'
              }),
              valErrors.averageCycleLength && h('p', { className: 'text-xs text-rose-600 font-semibold mt-1' }, `⚠️ ${valErrors.averageCycleLength}`)
            ),
            h('div', null,
              h('div', { className: 'flex justify-between text-xs font-bold mb-1' },
                h('span', null, 'Bleeding Duration'),
                h('span', { className: 'text-purple-600' }, `${periodLengthInput} days`)
              ),
              h('input', {
                type: 'range',
                min: '1',
                max: '12',
                value: periodLengthInput,
                onChange: (e) => setPeriodLengthInput(Number(e.target.value)),
                className: 'w-full accent-purple-500'
              }),
              valErrors.averagePeriodLength && h('p', { className: 'text-xs text-rose-600 font-semibold mt-1' }, `⚠️ ${valErrors.averagePeriodLength}`)
            )
          ),
          h('div', { className: 'p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between' },
            h('div', null,
              h('h4', { className: 'text-xs font-bold text-slate-800' }, 'Irregular or Fluctuating Cycle Rhythm'),
              h('p', { className: 'text-[11px] text-slate-500' }, 'Presents wider estimated prediction margins to prevent false certainty.')
            ),
            h('input', {
              type: 'checkbox',
              checked: isIrregularInput,
              onChange: (e) => setIsIrregularInput(e.target.checked),
              className: 'w-5 h-5 accent-purple-600 rounded cursor-pointer'
            })
          ),
          h('button', { type: 'submit', className: 'py-2 px-5 rounded-xl bg-pink-500 text-white text-xs font-bold' }, 'Save Parameters & Recalculate')
        )
      ),

      // Privacy
      h('section', { className: 'bg-gradient-to-br from-pink-50/80 via-white to-purple-50/60 rounded-3xl p-6 border border-pink-200 shadow-sm space-y-4' },
        h('div', { className: 'flex items-center gap-2.5' },
          h('span', { className: 'text-2xl' }, '🛡️'),
          h('div', null,
            h('h3', { className: 'text-base font-bold text-slate-800' }, 'The CycleCare Privacy Guarantee'),
            h('p', { className: 'text-xs text-slate-500' }, 'Your sensitive health markers never leave your local device storage.')
          )
        ),
        h('div', { className: 'p-4 rounded-2xl bg-white border border-pink-100 flex items-center justify-between' },
          h('div', null,
            h('h4', { className: 'text-xs font-bold text-slate-800' }, 'Anonymous Mode'),
            h('p', { className: 'text-[11px] text-slate-500' }, 'Hides your real name and replaces identifiable headers.')
          ),
          h('button', {
            type: 'button',
            onClick: () => onUpdateProfile({ isAnonymous: !profile.isAnonymous }),
            className: `w-12 h-6 rounded-full transition-colors relative ${profile.isAnonymous ? 'bg-purple-600' : 'bg-slate-300'}`
          },
            h('div', { className: `w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${profile.isAnonymous ? 'translate-x-6' : 'translate-x-0.5'}` })
          )
        )
      ),

      // Supabase Cloud Sync Section
      h('section', { className: 'bg-gradient-to-br from-purple-50/80 via-white to-pink-50/70 rounded-3xl p-6 border border-purple-200/80 shadow-sm space-y-4' },
        h('div', { className: 'flex items-center justify-between' },
          h('div', { className: 'flex items-center gap-3' },
            h('div', { className: 'w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-lg shadow-sm' }, '☁️'),
            h('div', null,
              h('h3', { className: 'text-sm font-bold text-slate-800 flex items-center gap-2' },
                h('span', null, 'Supabase Cloud Sync'),
                h('span', { className: 'text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200' }, 'RLS Protected')
              ),
              h('p', { className: 'text-xs text-slate-500' }, 'End-to-end database storage backed by Supabase PostgreSQL Row Level Security')
            )
          ),
          h('button', {
            type: 'button',
            onClick: onOpenAuthModal,
            className: 'py-1.5 px-3.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm'
          }, authUser ? 'Account Settings' : 'Connect / Sign In')
        ),
        h('div', { className: 'p-4 rounded-2xl bg-white border border-purple-100 space-y-3' },
          h('div', { className: 'flex items-center justify-between text-xs' },
            h('span', { className: 'text-slate-500 font-medium' }, 'Connection State:'),
            authUser
              ? h('span', { className: 'font-bold text-emerald-700 flex items-center gap-1.5' },
                  h('span', { className: 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse' }),
                  h('span', null, `Authenticated (${authUser.email})`)
                )
              : h('span', { className: 'font-semibold text-purple-700' }, '🧪 Demo Mode (Local Sample Data)')
          ),
          h('div', { className: 'flex items-center justify-between text-xs' },
            h('span', { className: 'text-slate-500 font-medium' }, 'Row Level Security (RLS):'),
            h('span', { className: 'font-bold text-slate-800' }, 'Active (auth.uid() = user_id)')
          ),
          h('div', { className: 'pt-2 border-t border-purple-50 flex flex-wrap gap-2' },
            authUser ? [
              h('button', {
                key: 'sync',
                type: 'button',
                onClick: onSyncCloud,
                disabled: isSyncing,
                className: 'py-2 px-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 font-bold text-xs hover:bg-purple-100 transition-colors flex items-center gap-1.5'
              }, isSyncing ? 'Syncing...' : '🔄 Push & Sync to Cloud'),
              h('button', {
                key: 'signout',
                type: 'button',
                onClick: onSignOut,
                className: 'py-2 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100'
              }, 'Sign Out')
            ] : [
              h('button', {
                key: 'signin',
                type: 'button',
                onClick: onOpenAuthModal,
                className: 'py-2 px-4 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors'
              }, '✨ Sign In or Create Private Account')
            ]
          )
        ),
        h('p', { className: 'text-[11px] text-slate-500 leading-relaxed bg-white/70 p-3 rounded-xl border border-purple-100' },
          '🔒 Privacy Guarantee: CycleCare never exposes your secret administrative key. Client transactions run strictly via Row Level Security policies, ensuring only your verified authentication token can access your private records.'
        )
      ),

      // Period & Wellness Reminders (Optional)
      h('section', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-5' },
        h('div', { className: 'flex items-center justify-between' },
          h('div', { className: 'flex items-center gap-2.5' },
            h('span', { className: 'text-xl' }, '🔔'),
            h('div', null,
              h('h3', { className: 'text-sm font-bold text-slate-800' }, 'Period & Wellness Reminders (Optional)'),
              h('p', { className: 'text-xs text-slate-500' }, 'Gentle on-device alerts to help you prepare ahead of upcoming cycles')
            )
          ),
          h('span', { className: 'text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full' }, 'Customizable')
        ),

        h('div', { className: 'space-y-4' },
          // Main toggle
          h('div', { className: 'p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center justify-between' },
            h('div', null,
              h('h4', { className: 'text-xs font-bold text-slate-800' }, 'Upcoming Period Reminders'),
              h('p', { className: 'text-[11px] text-slate-500' }, 'Receive early warnings before your next predicted bleeding phase begins.')
            ),
            h('button', {
              type: 'button',
              onClick: () => {
                const next = profile.periodReminderEnabled === false ? true : false;
                onUpdateProfile({ periodReminderEnabled: next });
              },
              className: `w-12 h-6 rounded-full transition-colors relative ${profile.periodReminderEnabled !== false ? 'bg-pink-500' : 'bg-slate-300'}`
            },
              h('div', { className: `w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${profile.periodReminderEnabled !== false ? 'translate-x-6' : 'translate-x-0.5'}` })
            )
          ),

          // Advance days
          profile.periodReminderEnabled !== false && h('div', { className: 'p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn' },
            h('div', null,
              h('h4', { className: 'text-xs font-bold text-slate-800' }, 'Advance Notice Window'),
              h('p', { className: 'text-[11px] text-slate-500' }, 'How many days in advance to display upcoming period alerts.')
            ),
            h('div', { className: 'flex gap-1.5' },
              [1, 2, 3, 5].map(days => h('button', {
                key: days,
                type: 'button',
                onClick: () => onUpdateProfile({ periodReminderDaysBefore: days }),
                className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  (profile.periodReminderDaysBefore || 2) === days
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`
              }, `${days}d`))
            )
          ),

          // Fertile alert toggle
          h('div', { className: 'p-4 rounded-2xl bg-white border border-slate-100 flex items-center justify-between' },
            h('div', null,
              h('h4', { className: 'text-xs font-bold text-slate-800' }, 'Fertile Window & Ovulation Notification'),
              h('p', { className: 'text-[11px] text-slate-500' }, 'Estimates your statistical fertile days for cycle awareness. Not for contraception.')
            ),
            h('button', {
              type: 'button',
              onClick: () => onUpdateProfile({ fertileAlert: profile.fertileAlert === false ? true : false }),
              className: `w-12 h-6 rounded-full transition-colors relative ${profile.fertileAlert !== false ? 'bg-pink-500' : 'bg-slate-300'}`
            },
              h('div', { className: `w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${profile.fertileAlert !== false ? 'translate-x-6' : 'translate-x-0.5'}` })
            )
          ),

          // Discreet notifications
          h('div', { className: 'p-4 rounded-2xl bg-white border border-slate-100 flex items-center justify-between' },
            h('div', null,
              h('h4', { className: 'text-xs font-bold text-slate-800' }, 'Discreet Privacy Framing'),
              h('p', { className: 'text-[11px] text-slate-500' }, 'Substitutes period terms with neutral reminders (e.g. "Your CycleCare update is ready").')
            ),
            h('button', {
              type: 'button',
              onClick: () => onUpdateProfile({ discreetNotifications: !profile.discreetNotifications }),
              className: `w-12 h-6 rounded-full transition-colors relative ${profile.discreetNotifications ? 'bg-purple-600' : 'bg-slate-300'}`
            },
              h('div', { className: `w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${profile.discreetNotifications ? 'translate-x-6' : 'translate-x-0.5'}` })
            )
          ),

          // Daily Pill Reminder
          h('div', { className: 'p-4 rounded-2xl bg-white border border-slate-100 space-y-3' },
            h('div', { className: 'flex items-center justify-between' },
              h('div', null,
                h('h4', { className: 'text-xs font-bold text-slate-800' }, '💊 Daily Pill & Contraceptive Reminder'),
                h('p', { className: 'text-[11px] text-slate-500' }, 'Receive a daily prompt at your preferred time to take your birth control pill or supplements.')
              ),
              h('button', {
                type: 'button',
                onClick: () => onUpdateProfile({ pillReminderEnabled: profile.pillReminderEnabled === false ? true : false }),
                className: `w-12 h-6 rounded-full transition-colors relative ${profile.pillReminderEnabled !== false ? 'bg-pink-500' : 'bg-slate-300'}`
              },
                h('div', { className: `w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${profile.pillReminderEnabled !== false ? 'translate-x-6' : 'translate-x-0.5'}` })
              )
            ),
            profile.pillReminderEnabled !== false && h('div', { className: 'flex items-center justify-between pt-2 border-t border-slate-100 text-xs' },
              h('span', { className: 'text-slate-600 font-medium' }, 'Daily Reminder Time:'),
              h('input', {
                type: 'time',
                value: profile.pillReminderTime || '09:00',
                onChange: (e) => onUpdateProfile({ pillReminderTime: e.target.value }),
                className: 'px-2.5 py-1 rounded-xl border border-pink-200 text-xs font-bold text-purple-900 bg-pink-50/40'
              })
            )
          ),

          // Real Browser Push Notifications
          h('div', { className: 'p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-pink-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs' },
            h('div', null,
              h('h4', { className: 'text-xs font-bold text-slate-800 flex items-center gap-2' },
                h('span', null, '🌐 Real Browser Push Notifications'),
                h('span', { className: `text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                  browserPerm === 'granted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : browserPerm === 'denied' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }` }, browserPerm.toUpperCase())
              ),
              h('p', { className: 'text-[11px] text-slate-600 mt-0.5' },
                browserPerm === 'granted'
                  ? 'System notifications active! CycleCare will deliver reminders to your desktop or mobile lock screen.'
                  : 'Receive real system alerts 2 days before your predicted period arrives or for daily pill reminders.'
              )
            ),
            h('button', {
              type: 'button',
              onClick: handleRequestRealPush,
              className: 'py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-colors shrink-0'
            }, browserPerm === 'granted' ? '🔔 Send Test System Alert' : 'Enable Real Push')
          ),

          // Interactive live test alert
          h('div', { className: 'pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100' },
            h('button', {
              type: 'button',
              onClick: handleTestNotification,
              className: 'py-2 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold text-xs flex items-center gap-1.5 transition-colors self-start'
            }, '🔔 Test In-App Notification Preview'),
            h('span', { className: 'text-[10px] text-slate-400' }, '* Reminders are calculated from personal averages and are not medical guarantees.')
          ),

          testNotificationVisible && h('div', { className: 'p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs shadow-lg flex items-center gap-2.5 animate-fadeIn' },
            h('span', { className: 'text-base' }, '📱'),
            h('div', { className: 'flex-1' },
              h('span', { className: 'font-bold block text-[11px]' }, 'Lock Screen Notification Preview:'),
              h('span', { className: 'opacity-95' }, testNotificationMessage)
            ),
            h('button', {
              type: 'button',
              onClick: () => setTestNotificationVisible(false),
              className: 'text-white/80 hover:text-white text-xs font-bold ml-2'
            }, '✕')
          )
        )
      ),

      // PIN Lock
      h('section', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4' },
        h('h3', { className: 'text-sm font-bold text-slate-800' }, '🔒 App Passcode Lock'),
        h('div', { className: 'p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between' },
          h('div', null,
            h('h4', { className: 'text-xs font-bold text-slate-800' }, 'Require 4-Digit Passcode'),
            h('p', { className: 'text-[11px] text-slate-500' }, 'Locks the app when idle or opened.')
          ),
          h('button', {
            type: 'button',
            onClick: () => onUpdateProfile({ pinLockEnabled: !profile.pinLockEnabled }),
            className: `w-12 h-6 rounded-full transition-colors relative ${profile.pinLockEnabled ? 'bg-pink-500' : 'bg-slate-300'}`
          },
            h('div', { className: `w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${profile.pinLockEnabled ? 'translate-x-6' : 'translate-x-0.5'}` })
          )
        ),
        profile.pinLockEnabled && h('div', { className: 'p-4 rounded-2xl bg-pink-50/50 border border-pink-200 space-y-2' },
          h('label', { className: 'block text-xs font-bold text-slate-700' }, 'Set 4-Digit PIN Code (Default: 1234)'),
          h('div', { className: 'flex gap-2' },
            h('input', {
              type: 'password',
              maxLength: 4,
              value: pinInput,
              onChange: (e) => setPinInput(e.target.value),
              className: 'w-28 px-3 py-1.5 rounded-xl border border-pink-300 text-center text-sm font-bold bg-white'
            }),
            h('button', {
              onClick: () => onUpdateProfile({ pinCode: pinInput }),
              className: 'px-4 py-1.5 rounded-xl bg-pink-600 text-white text-xs font-bold'
            }, 'Save PIN')
          )
        )
      ),

      // Backups & Reset
      h('section', { className: 'bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4' },
        h('h3', { className: 'text-sm font-bold text-slate-800' }, '💾 Data Management & Backups'),
        h('div', { className: 'flex flex-wrap gap-3' },
          h('button', { onClick: handleExportCalendarIcs, className: 'py-2.5 px-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5' }, '📅 Export to Calendar (.ICS)'),
          h('button', { onClick: onOpenPwaModal, className: 'py-2.5 px-4 rounded-2xl bg-pink-50 border border-pink-200 text-xs font-bold text-pink-700 hover:bg-pink-100 transition-colors flex items-center gap-1.5' }, '📱 Install Mobile App (PWA)'),
          h('button', { onClick: downloadBackupJson, className: 'py-2.5 px-4 rounded-2xl bg-pink-50 border border-pink-200 text-xs font-bold text-pink-700' }, '📥 Download Backup (JSON)'),
          h('label', { className: 'py-2.5 px-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs font-bold text-teal-700 hover:bg-teal-100 transition-colors flex items-center gap-1.5 cursor-pointer' },
            h('span', null, '📤 Transfer / Restore (JSON)'),
            h('input', {
              type: 'file',
              accept: '.json',
              onChange: handleRestoreBackupFile,
              className: 'hidden'
            })
          ),
          h('button', { onClick: downloadCsv, className: 'py-2.5 px-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700' }, '📊 Export Logs (CSV)'),
          h('button', { onClick: onResetDemoData, className: 'py-2.5 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700' }, '🔄 Reset to Demo Data'),
          h('button', { onClick: onRevisitOnboarding, className: 'py-2.5 px-4 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-600' }, 'Re-run Setup Wizard')
        ),
        h('div', { className: 'pt-4 border-t flex justify-between items-center' },
          h('div', null,
            h('h4', { className: 'text-xs font-bold text-rose-700' }, 'Clear Local Storage'),
            h('p', { className: 'text-[11px] text-slate-400' }, 'Permanently erase all cycle logs.')
          ),
          h('button', { onClick: onClearAllData, className: 'py-1.5 px-3 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50' }, 'Confirm Clear')
        )
      )
    );
  }

  // ----- QUICK LOG MODAL WITH DELETE -----
  function QuickLogModalView({ dateStr, existingLog, onClose, onSave, onDelete }) {
    const [flow, setFlow] = useState(existingLog?.flow || (existingLog?.isPeriodDay ? 'medium' : 'none'));
    const [symptoms, setSymptoms] = useState(existingLog?.symptoms || []);
    const [moods, setMoods] = useState(existingLog?.moods || []);
    const [notes, setNotes] = useState(existingLog?.notes || '');

    const toggleSymptom = (s) => setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    const toggleMood = (m) => setMoods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({
        date: dateStr,
        isPeriodDay: flow !== 'none',
        flow,
        symptoms,
        moods,
        notes,
      });
      onClose();
    };

    const handleDelete = () => {
      if (onDelete && window.confirm(`Delete entry for ${dateStr}?`)) {
        onDelete(dateStr);
        onClose();
      }
    };

    return h('div', { className: 'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4' },
      h('div', { className: 'bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-pink-100 shadow-2xl space-y-4' },
        h('div', { className: 'flex justify-between items-center border-b border-pink-100 pb-3' },
          h('h3', { className: 'text-lg font-bold text-slate-800' }, `Quick Log · ${dateStr}`),
          h('button', { onClick: onClose, className: 'p-1 text-slate-400 hover:text-slate-600' }, '✕')
        ),
        h('form', { onSubmit: handleSubmit, className: 'space-y-4' },
          h('div', null,
            h('label', { className: 'block text-xs font-bold text-slate-700 mb-2' }, '🩸 Menstrual Flow'),
            h('div', { className: 'grid grid-cols-5 gap-1.5' },
              [
                { id: 'none', label: 'None' },
                { id: 'spotting', label: 'Spotting' },
                { id: 'light', label: 'Light' },
                { id: 'medium', label: 'Medium' },
                { id: 'heavy', label: 'Heavy' },
              ].map(f => h('button', {
                key: f.id,
                type: 'button',
                onClick: () => setFlow(f.id),
                className: `py-2 px-1 rounded-xl text-xs font-semibold border ${flow === f.id ? 'bg-rose-50 border-rose-400 text-rose-800' : 'bg-slate-50 border-slate-200'}`
              }, f.label))
            )
          ),
          h('div', null,
            h('label', { className: 'block text-xs font-bold text-slate-700 mb-2' }, '⚡ Symptoms'),
            h('div', { className: 'flex flex-wrap gap-1.5' },
              ['cramps_mild', 'cramps_severe', 'backache', 'tender_breasts', 'headache', 'bloating'].map(s => {
                const isSelected = symptoms.includes(s);
                return h('button', {
                  key: s,
                  type: 'button',
                  onClick: () => toggleSymptom(s),
                  className: `py-1.5 px-3 rounded-full text-xs font-medium border ${isSelected ? 'bg-pink-100 border-pink-300 text-pink-800 font-bold' : 'bg-white border-slate-200 text-slate-600'}`
                }, `${s.replace('_', ' ')} ${isSelected ? '✓' : '+'}`);
              })
            )
          ),
          h('div', null,
            h('label', { className: 'block text-xs font-bold text-slate-700 mb-2' }, '✨ Mood'),
            h('div', { className: 'flex flex-wrap gap-1.5' },
              ['calm', 'happy', 'energetic', 'sensitive', 'irritable', 'anxious'].map(m => {
                const isSelected = moods.includes(m);
                return h('button', {
                  key: m,
                  type: 'button',
                  onClick: () => toggleMood(m),
                  className: `py-1.5 px-3 rounded-full text-xs font-medium border ${isSelected ? 'bg-purple-100 border-purple-300 text-purple-900 font-bold' : 'bg-white border-slate-200 text-slate-600'}`
                }, m);
              })
            )
          ),
          h('div', null,
            h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Note'),
            h('input', {
              type: 'text',
              value: notes,
              onChange: (e) => setNotes(e.target.value),
              placeholder: 'Add a personal note...',
              className: 'w-full px-3 py-2 rounded-xl border border-pink-200 text-xs'
            })
          ),
          h('div', { className: 'flex justify-between items-center pt-2' },
            existingLog && onDelete ? h('button', {
              type: 'button',
              onClick: handleDelete,
              className: 'py-2 px-3 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold'
            }, 'Delete Entry') : h('div'),
            h('div', { className: 'flex gap-2' },
              h('button', { type: 'button', onClick: onClose, className: 'py-2 px-4 rounded-xl border text-xs text-slate-600' }, 'Cancel'),
              h('button', { type: 'submit', className: 'py-2 px-5 rounded-xl bg-pink-500 text-white text-xs font-bold shadow-md' }, 'Save Day Log')
            )
          )
        )
      )
    );
  }

  // ----- AUTH & PRIVATE VAULT MODAL -----
  function AuthModalView({ isOpen, onClose, authUser, onAuthSuccess, onEnterDemoMode, onSignOut }) {
    const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot' | 'config'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const cfg = getSupabaseConfig();
    const [customUrl, setCustomUrl] = useState(cfg.url || '');
    const [customKey, setCustomKey] = useState(cfg.anonKey || '');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    if (!isOpen) return null;

    const handleSignIn = async (e) => {
      e.preventDefault();
      setErrorMsg(null);
      setSuccessMsg(null);
      if (!email || !password) {
        setErrorMsg('Please enter both your email address and password.');
        return;
      }
      const currentCfg = getSupabaseConfig();
      if (!currentCfg.isConfigured) {
        // Seamless fallback when Supabase keys have not been configured yet
        const cleanEmail = email.trim();
        const cleanName = cleanEmail.split('@')[0];
        const localUser = {
          id: 'user-' + Date.now(),
          email: cleanEmail,
          fullName: cleanName,
          isAnonymous: false,
          createdAt: new Date().toISOString(),
        };
        const session = {
          accessToken: 'local-demo-token',
          refreshToken: 'local-demo-refresh',
          expiresAt: Date.now() + 3600 * 1000,
          user: localUser,
        };
        saveStoredSession(session);
        onAuthSuccess(localUser);
        setSuccessMsg(`Welcome, ${cleanName}! Signed in via Local On-Device Vault.`);
        setTimeout(onClose, 800);
        return;
      }
      setLoading(true);
      try {
        const res = await supabaseSignIn({ email, password });
        onAuthSuccess(res.user);
        setSuccessMsg(`Welcome back, ${res.user.fullName || res.user.email}!`);
        setTimeout(onClose, 1000);
      } catch (err) {
        setErrorMsg(err.message || 'Unable to sign in. Please verify your credentials.');
      } finally {
        setLoading(false);
      }
    };

    const handleSignUp = async (e) => {
      e.preventDefault();
      setErrorMsg(null);
      setSuccessMsg(null);
      if (!email || !password) {
        setErrorMsg('Please provide an email and a password.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      const currentCfg = getSupabaseConfig();
      if (!currentCfg.isConfigured) {
        // Seamless fallback when Supabase keys have not been configured yet
        const cleanEmail = email.trim();
        const cleanName = isAnonymous ? 'CycleCare Friend' : (fullName.trim() || cleanEmail.split('@')[0]);
        const localUser = {
          id: 'user-' + Date.now(),
          email: cleanEmail,
          fullName: cleanName,
          isAnonymous: Boolean(isAnonymous),
          createdAt: new Date().toISOString(),
        };
        const session = {
          accessToken: 'local-demo-token',
          refreshToken: 'local-demo-refresh',
          expiresAt: Date.now() + 3600 * 1000,
          user: localUser,
        };
        saveStoredSession(session);
        onAuthSuccess(localUser);
        setSuccessMsg(`Account created for ${cleanName}! Welcome to CycleCare.`);
        setTimeout(onClose, 800);
        return;
      }
      setLoading(true);
      try {
        const res = await supabaseSignUp({
          email,
          password,
          fullName: isAnonymous ? 'CycleCare Friend' : (fullName || 'CycleCare Friend'),
          isAnonymous,
        });
        if (res.requiresEmailConfirmation) {
          setSuccessMsg('Account created! Please check your email for a confirmation link.');
        } else {
          onAuthSuccess(res.user);
          setSuccessMsg('Account created successfully! Your records are now isolated via RLS.');
          setTimeout(onClose, 1200);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Registration failed.');
      } finally {
        setLoading(false);
      }
    };

    const handleForgotPassword = async (e) => {
      e.preventDefault();
      setErrorMsg(null);
      setSuccessMsg(null);
      if (!email) {
        setErrorMsg('Please enter your email.');
        return;
      }
      const currentCfg = getSupabaseConfig();
      if (!currentCfg.isConfigured) {
        setSuccessMsg(`Password reset instructions sent to ${email} (Local Simulation).`);
        return;
      }
      setLoading(true);
      try {
        const res = await supabaseResetPassword(email);
        setSuccessMsg(res.message);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to dispatch password reset email.');
      } finally {
        setLoading(false);
      }
    };

    const handleSaveConfig = (e) => {
      e.preventDefault();
      setErrorMsg(null);
      setSuccessMsg(null);
      const val = validateSupabaseKey(customKey);
      if (!val.isValid) {
        setErrorMsg(val.error);
        return;
      }
      if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://')) {
        setErrorMsg('Supabase URL must start with https://');
        return;
      }
      try {
        setSupabaseConfig(customUrl, customKey);
        setSuccessMsg('Supabase credentials successfully saved!');
        setTimeout(() => setMode('signin'), 1000);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to save config.');
      }
    };

    return h('div', { className: 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn' },
      h('div', { className: 'bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-pink-100 shadow-2xl relative my-auto' },
        h('button', {
          onClick: onClose,
          className: 'absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm'
        }, '✕'),

        h('div', { className: 'text-center mb-6' },
          h('div', { className: 'w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-purple-500 p-0.5 shadow-md shadow-pink-200/50 mb-3 flex items-center justify-center' },
            h('div', { className: 'w-full h-full bg-white rounded-[14px] flex items-center justify-center text-pink-500 text-2xl' }, '🌸')
          ),
          h('h2', { className: 'text-xl font-extrabold text-slate-800 tracking-tight' },
            authUser ? 'Your Private Health Vault' : 'CycleCare Cloud & Authentication'
          ),
          h('p', { className: 'text-xs text-slate-500 mt-1' },
            authUser ? `Signed in as ${authUser.email}` : 'End-to-end user isolation backed by Supabase Row Level Security (RLS)'
          )
        ),

        authUser ? h('div', { className: 'space-y-4' },
          h('div', { className: 'p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1' },
            h('div', { className: 'flex items-center gap-1.5 font-bold text-sm text-emerald-900' },
              h('span', null, '🛡️'),
              h('span', null, 'Active Cloud Session')
            ),
            h('p', null, 'Email: ', h('strong', { className: 'font-semibold' }, authUser.email)),
            h('p', null, 'Account ID: ', h('code', { className: 'text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-200' }, authUser.id)),
            h('p', { className: 'text-[11px] text-emerald-700 pt-1' },
              'All cycle entries, symptom logs, and predictions are stored in private Supabase tables protected by Row Level Security.'
            )
          ),
          h('div', { className: 'flex flex-col gap-2 pt-2' },
            h('button', {
              type: 'button',
              onClick: () => { onSignOut(); onClose(); },
              className: 'w-full py-3 px-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100'
            }, 'Sign Out of CycleCare'),
            h('button', {
              type: 'button',
              onClick: () => { onEnterDemoMode(); onClose(); },
              className: 'w-full py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100'
            }, 'Switch to Demo Mode (Local Sample Data)')
          )
        ) : h('div', null,
          h('div', { className: 'flex rounded-2xl bg-slate-100/80 p-1 mb-5 text-xs font-semibold' },
            h('button', {
              type: 'button',
              onClick: () => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); },
              className: `flex-1 py-2 rounded-xl transition-all ${mode === 'signin' ? 'bg-white text-pink-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`
            }, 'Sign In'),
            h('button', {
              type: 'button',
              onClick: () => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); },
              className: `flex-1 py-2 rounded-xl transition-all ${mode === 'signup' ? 'bg-white text-pink-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`
            }, 'Sign Up'),
            h('button', {
              type: 'button',
              onClick: () => { setMode('config'); setErrorMsg(null); setSuccessMsg(null); },
              className: `flex-1 py-2 rounded-xl transition-all ${mode === 'config' ? 'bg-white text-purple-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`
            }, 'Cloud Setup')
          ),

          errorMsg && h('div', { className: 'p-3.5 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2' },
            h('span', { className: 'text-base shrink-0' }, '⚠️'),
            h('div', { className: 'leading-snug' }, errorMsg)
          ),

          successMsg && h('div', { className: 'p-3.5 mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2' },
            h('span', { className: 'text-base shrink-0' }, '✨'),
            h('div', { className: 'leading-snug' }, successMsg)
          ),

          mode === 'signin' && h('form', { onSubmit: handleSignIn, className: 'space-y-4' },
            h('div', null,
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Email Address'),
              h('input', {
                type: 'email',
                required: true,
                value: email,
                onChange: (e) => setEmail(e.target.value),
                placeholder: 'maya@example.com',
                className: 'w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/20 focus:bg-white'
              })
            ),
            h('div', null,
              h('div', { className: 'flex justify-between items-center mb-1' },
                h('label', { className: 'text-xs font-bold text-slate-700' }, 'Password'),
                h('button', {
                  type: 'button',
                  onClick: () => setMode('forgot'),
                  className: 'text-[11px] font-semibold text-purple-600 hover:underline'
                }, 'Forgot password?')
              ),
              h('input', {
                type: 'password',
                required: true,
                value: password,
                onChange: (e) => setPassword(e.target.value),
                placeholder: '••••••••',
                className: 'w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/20 focus:bg-white'
              })
            ),
            h('button', {
              type: 'submit',
              disabled: loading,
              className: 'w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2'
            }, loading ? 'Authenticating...' : 'Sign In to Private Vault 🔒'),

            h('div', { className: 'relative my-3' },
              h('div', { className: 'absolute inset-0 flex items-center' }, h('div', { className: 'w-full border-t border-slate-200' })),
              h('div', { className: 'relative flex justify-center text-[10px] uppercase' }, h('span', { className: 'bg-white px-2 text-slate-400 font-semibold' }, 'Or'))
            ),

            h('button', {
              type: 'button',
              onClick: () => { onEnterDemoMode(); onClose(); },
              className: 'w-full py-2.5 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 flex items-center justify-center gap-1.5'
            }, '🧪 Continue in Demo Mode (Local Sample Data)')
          ),

          mode === 'signup' && h('form', { onSubmit: handleSignUp, className: 'space-y-4' },
            h('div', null,
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Display Name or Preferred Alias'),
              h('input', {
                type: 'text',
                value: fullName,
                onChange: (e) => setFullName(e.target.value),
                placeholder: 'Maya Chen (optional)',
                className: 'w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/20'
              })
            ),
            h('div', null,
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Email Address'),
              h('input', {
                type: 'email',
                required: true,
                value: email,
                onChange: (e) => setEmail(e.target.value),
                placeholder: 'maya@example.com',
                className: 'w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/20'
              })
            ),
            h('div', null,
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Create Password (min 6 chars)'),
              h('input', {
                type: 'password',
                required: true,
                minLength: 6,
                value: password,
                onChange: (e) => setPassword(e.target.value),
                placeholder: '••••••••',
                className: 'w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/20'
              })
            ),
            h('div', { className: 'p-3 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between' },
              h('div', null,
                h('h4', { className: 'text-xs font-bold text-slate-800' }, 'Anonymous Mode'),
                h('p', { className: 'text-[10px] text-slate-500' }, 'Omits personal identifiers from health records.')
              ),
              h('input', {
                type: 'checkbox',
                checked: isAnonymous,
                onChange: (e) => setIsAnonymous(e.target.checked),
                className: 'w-4 h-4 accent-purple-600 rounded cursor-pointer'
              })
            ),
            h('button', {
              type: 'submit',
              disabled: loading,
              className: 'w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md disabled:opacity-50'
            }, loading ? 'Creating Account...' : 'Create Encrypted Account ✨'),

            h('button', {
              type: 'button',
              onClick: () => { onEnterDemoMode(); onClose(); },
              className: 'w-full py-2.5 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100'
            }, 'Continue in Demo Mode instead')
          ),

          mode === 'forgot' && h('form', { onSubmit: handleForgotPassword, className: 'space-y-4' },
            h('p', { className: 'text-xs text-slate-600' }, 'Enter your registered email address to receive password reset instructions.'),
            h('div', null,
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Email Address'),
              h('input', {
                type: 'email',
                required: true,
                value: email,
                onChange: (e) => setEmail(e.target.value),
                placeholder: 'maya@example.com',
                className: 'w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs'
              })
            ),
            h('button', {
              type: 'submit',
              disabled: loading,
              className: 'w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md disabled:opacity-50'
            }, loading ? 'Sending...' : 'Send Password Reset Link ✉️'),
            h('button', {
              type: 'button',
              onClick: () => setMode('signin'),
              className: 'w-full py-2 text-xs font-semibold text-pink-600 hover:underline text-center'
            }, '← Back to Sign In')
          ),

          mode === 'config' && h('form', { onSubmit: handleSaveConfig, className: 'space-y-4' },
            h('div', { className: 'p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed' },
              h('strong', null, '🔒 Security Notice: '),
              'Only provide your public ', h('strong', { className: 'underline' }, 'anon'), ' key. Never enter the secret ', h('code', { className: 'bg-amber-100 px-1 py-0.5 rounded font-mono' }, 'service_role'), ' key.'
            ),
            h('div', null,
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Supabase Project URL'),
              h('input', {
                type: 'url',
                required: true,
                value: customUrl,
                onChange: (e) => setCustomUrl(e.target.value),
                placeholder: 'https://xyzcompany.supabase.co',
                className: 'w-full px-4 py-2 rounded-2xl border border-slate-200 text-xs font-mono'
              })
            ),
            h('div', null,
              h('label', { className: 'block text-xs font-bold text-slate-700 mb-1' }, 'Supabase Public Anon Key'),
              h('textarea', {
                required: true,
                rows: 3,
                value: customKey,
                onChange: (e) => setCustomKey(e.target.value),
                placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                className: 'w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-mono resize-none'
              })
            ),
            h('div', { className: 'flex gap-2' },
              h('button', {
                type: 'submit',
                className: 'flex-1 py-2.5 px-4 rounded-2xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700'
              }, 'Save & Test Connection'),
              h('button', {
                type: 'button',
                onClick: () => { clearSupabaseConfig(); setCustomUrl(''); setCustomKey(''); setSuccessMsg('Cleared credentials.'); },
                className: 'py-2.5 px-3 rounded-2xl border border-slate-300 text-slate-600 font-semibold text-xs'
              }, 'Clear')
            )
          )
        )
      )
    );
  }

  // ----- AI HEALTH COMPANION (MAYA AI) MODAL -----
  function AiCompanionModalView({ isOpen, onClose, cycleStatus, profile }) {
    const [messages, setMessages] = useState(() => [
      {
        id: 'msg-init',
        sender: 'maya',
        title: `Welcome, ${profile.isAnonymous ? 'Friend' : (profile.name || 'there').split(' ')[0]} 🌸`,
        text: `I am Maya, your private on-device cycle companion. You are currently on Day ${cycleStatus.currentCycleDay} (${cycleStatus.phaseTitle} Phase). How can I assist you with your cycle, ovulation indicators, PMS management, nutrition, or reproductive wellness today?`,
        sources: 'CycleCare Clinical Knowledge Base · ACOG & WHO Reference Library',
      }
    ]);
    const [inputQuery, setInputQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages, isTyping]);

    const handleSend = (queryToSend) => {
      const q = (queryToSend || inputQuery).trim();
      if (!q) return;

      const userMsg = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: q,
      };

      setMessages(prev => [...prev, userMsg]);
      setInputQuery('');
      setIsTyping(true);

      setTimeout(() => {
        const answer = askMayaAi(q, cycleStatus, profile);
        const mayaMsg = {
          id: `maya-${Date.now()}`,
          sender: 'maya',
          title: answer.title,
          text: answer.reply,
          sources: answer.sources,
        };
        setMessages(prev => [...prev, mayaMsg]);
        setIsTyping(false);
      }, 350);
    };

    const suggestedPrompts = [
      'Why do I get severe cramps?',
      'How do I know I\'m ovulating?',
      'What should I eat in my luteal phase?',
      'What is normal cervical mucus?',
      'What if I forgot a pill?',
      'Can stress delay my period?',
    ];

    if (!isOpen) return null;

    return h('div', { className: 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn' },
      h('div', { className: 'bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-pink-100' },
        // Header
        h('div', { className: 'px-5 py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white flex items-center justify-between shadow-sm' },
          h('div', { className: 'flex items-center gap-3' },
            h('div', { className: 'w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-xl shadow-inner' }, '🌸'),
            h('div', null,
              h('div', { className: 'flex items-center gap-2' },
                h('h3', { className: 'font-extrabold text-base tracking-tight' }, 'Maya AI Companion'),
                h('span', { className: 'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30' }, 'Private & On-Device')
              ),
              h('p', { className: 'text-xs text-white/90' }, `Day ${cycleStatus.currentCycleDay} (${cycleStatus.phaseTitle}) · Evidence-Based Awareness`)
            )
          ),
          h('button', {
            type: 'button',
            onClick: onClose,
            className: 'w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition-colors'
          }, '✕')
        ),

        // Quick Suggestion Chips
        h('div', { className: 'px-4 py-2.5 bg-pink-50/60 border-b border-pink-100/60 flex items-center gap-2 overflow-x-auto no-scrollbar' },
          h('span', { className: 'text-[11px] font-bold text-pink-700 whitespace-nowrap' }, '💡 Quick Topics:'),
          suggestedPrompts.map((prompt, idx) => h('button', {
            key: idx,
            type: 'button',
            onClick: () => handleSend(prompt),
            className: 'text-[11px] font-medium bg-white hover:bg-pink-100/70 text-slate-700 hover:text-pink-900 px-3 py-1 rounded-full border border-pink-200/80 whitespace-nowrap transition-all shadow-2xs'
          }, prompt))
        ),

        // Message Thread
        h('div', { className: 'flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-pink-50/20 via-white to-purple-50/20' },
          messages.map(msg => {
            if (msg.sender === 'user') {
              return h('div', { key: msg.id, className: 'flex justify-end animate-fadeIn' },
                h('div', { className: 'max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs sm:text-sm leading-relaxed shadow-sm' },
                  msg.text
                )
              );
            }

            return h('div', { key: msg.id, className: 'flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%] animate-fadeIn' },
              h('div', { className: 'w-7 h-7 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs' }, '🌸'),
              h('div', { className: 'space-y-1.5 bg-white p-4 rounded-2xl rounded-tl-xs border border-pink-100 shadow-sm text-xs sm:text-sm text-slate-800' },
                msg.title && h('h4', { className: 'font-bold text-purple-900 text-xs sm:text-sm flex items-center gap-1.5' },
                  h('span', null, '✨'),
                  h('span', null, msg.title)
                ),
                h('p', { className: 'text-slate-700 leading-relaxed text-xs' }, msg.text),
                msg.sources && h('div', { className: 'pt-2 border-t border-slate-100 text-[10px] text-purple-700/80 font-medium flex items-center gap-1' },
                  h('span', null, '📚'),
                  h('span', null, msg.sources)
                )
              )
            );
          }),

          isTyping && h('div', { className: 'flex items-center gap-2 text-xs text-purple-600 font-medium px-2' },
            h('span', { className: 'w-2 h-2 rounded-full bg-pink-500 animate-bounce' }),
            h('span', { className: 'w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]' }),
            h('span', { className: 'w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]' }),
            h('span', { className: 'text-slate-400 text-[11px] ml-1' }, 'Maya is consulting clinical references...')
          ),

          h('div', { ref: messagesEndRef })
        ),

        // Input Box
        h('form', {
          onSubmit: (e) => {
            e.preventDefault();
            handleSend();
          },
          className: 'p-3 sm:p-4 bg-white border-t border-pink-100 flex items-center gap-2'
        },
          h('input', {
            type: 'text',
            value: inputQuery,
            onChange: (e) => setInputQuery(e.target.value),
            placeholder: 'Ask about cramps, luteal food, ovulation signs, pills...',
            className: 'flex-1 px-4 py-2.5 rounded-2xl border border-pink-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-pink-50/20'
          }),
          h('button', {
            type: 'submit',
            disabled: !inputQuery.trim(),
            className: 'px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs hover:opacity-95 transition-opacity disabled:opacity-40 flex items-center gap-1.5'
          },
            h('span', { className: 'hidden sm:inline' }, 'Ask Maya'),
            h('span', null, '➤')
          )
        ),

        // Bottom Disclaimer
        h('div', { className: 'px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center' },
          '⚠️ Maya AI is for personal wellness awareness and cycle education only. Not intended for clinical diagnosis or contraception.'
        )
      )
    );
  }

  // ----- PWA INSTALL MODAL -----
  function PwaInstallModalView({ isOpen, onClose, deferredPrompt, onPromptInstall }) {
    if (!isOpen) return null;

    const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

    return h('div', { className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn' },
      h('div', { className: 'bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-pink-100 p-6 space-y-5' },
        h('div', { className: 'flex justify-between items-start' },
          h('div', { className: 'flex items-center gap-3' },
            h('div', { className: 'w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 p-0.5 shadow-md' },
              h('div', { className: 'w-full h-full bg-white rounded-[14px] flex items-center justify-center text-2xl' }, '🌸')
            ),
            h('div', null,
              h('h3', { className: 'font-extrabold text-lg text-slate-800' }, 'Install CycleCare'),
              h('p', { className: 'text-xs text-slate-500' }, 'Add to your Home Screen as a native web app')
            )
          ),
          h('button', { onClick: onClose, className: 'w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold' }, '✕')
        ),

        // Feature highlights
        h('div', { className: 'space-y-2.5 text-xs text-slate-700 bg-pink-50/50 p-4 rounded-2xl border border-pink-100' },
          h('div', { className: 'flex items-center gap-2.5' },
            h('span', { className: 'text-base' }, '⚡'),
            h('span', null, h('strong', null, 'Full-Screen Mobile App: '), 'No browser address bar or tabs.')
          ),
          h('div', { className: 'flex items-center gap-2.5' },
            h('span', { className: 'text-base' }, '📶'),
            h('span', null, h('strong', null, 'Offline Ready: '), 'Cached with Service Worker for instant offline logging.')
          ),
          h('div', { className: 'flex items-center gap-2.5' },
            h('span', { className: 'text-base' }, '🔒'),
            h('span', null, h('strong', null, '100% Private: '), 'Your health logs stay safely stored on this device.')
          )
        ),

        // Native Prompt Button if available (Chrome / Edge / Android)
        deferredPrompt && h('button', {
          type: 'button',
          onClick: onPromptInstall,
          className: 'w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2'
        }, '📲 Click Here to Install CycleCare Now'),

        // Step by step for iOS / Safari
        isIos ? h('div', { className: 'p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-slate-700 space-y-2' },
          h('h4', { className: 'font-bold text-purple-900 flex items-center gap-1.5' },
            h('span', null, '🍎'),
            h('span', null, 'How to install on iPhone & iPad:')
          ),
          h('ol', { className: 'space-y-1.5 list-decimal list-inside text-[11px] text-slate-600 pl-1' },
            h('li', null, 'Tap the ', h('strong', null, 'Share button [ ⎋ ]'), ' at the bottom of Safari.'),
            h('li', null, 'Scroll down and tap ', h('strong', null, 'Add to Home Screen [ ➕ ]'), '.'),
            h('li', null, 'Tap ', h('strong', null, 'Add'), ' in the top right corner.')
          )
        ) : !deferredPrompt && h('div', { className: 'p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2' },
          h('h4', { className: 'font-bold text-slate-900 flex items-center gap-1.5' },
            h('span', null, '📱'),
            h('span', null, 'How to install on Android & Desktop:')
          ),
          h('p', { className: 'text-[11px] text-slate-600' },
            'Open your browser menu (the 3 dots ', h('strong', null, '⋮'), ' in the top right) and select ',
            h('strong', null, 'Install CycleCare'), ' or ', h('strong', null, 'Add to Home Screen'), '.'
          )
        ),

        h('button', {
          type: 'button',
          onClick: onClose,
          className: 'w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50'
        }, 'Close')
      )
    );
  }

  // ----- DOCTOR REPORT MODAL -----
  function DoctorReportModalView({ profile, pastCycles, logs, onClose }) {
    const insights = computeInsights(pastCycles, logs);
    const patientIdentifier = profile.isAnonymous ? 'Anonymous Patient (ID: CC-8924)' : profile.name;

    return h('div', { className: 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto' },
      h('div', { className: 'bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 border border-slate-200 shadow-2xl relative my-auto' },
        h('div', { className: 'flex justify-between items-center border-b pb-4 mb-6' },
          h('span', { className: 'text-sm font-bold text-slate-800' }, '📋 Clinical Gynecological Summary'),
          h('div', { className: 'flex items-center gap-2' },
            h('button', { onClick: () => window.print(), className: 'py-1.5 px-3 rounded-xl bg-purple-600 text-white text-xs font-bold' }, '🖨️ Print / Save PDF'),
            h('button', { onClick: onClose, className: 'p-1 text-slate-400 hover:text-slate-600' }, '✕')
          )
        ),
        h('div', { className: 'space-y-5 text-xs text-slate-800' },
          h('div', { className: 'border-b pb-3' },
            h('h1', { className: 'text-xl font-bold text-slate-900' }, 'CycleCare · Menstrual History Report'),
            h('p', { className: 'text-slate-500 text-[11px]' }, `Patient: ${patientIdentifier} · Date: ${new Date().toLocaleDateString()}`)
          ),
          h('div', { className: 'grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl' },
            h('div', null, h('span', { className: 'text-slate-400 block text-[10px]' }, 'Avg Cycle Length'), h('span', { className: 'font-bold' }, `${insights.averageLength} days`)),
            h('div', null, h('span', { className: 'text-slate-400 block text-[10px]' }, 'Bleeding Duration'), h('span', { className: 'font-bold' }, `${insights.averagePeriod} days`)),
            h('div', null, h('span', { className: 'text-slate-400 block text-[10px]' }, 'Regularity'), h('span', { className: 'font-bold text-emerald-700' }, `${insights.regularityScore}%`))
          ),
          h('div', null,
            h('h4', { className: 'font-bold mb-2' }, 'Recent 6 Cycles:'),
            h('table', { className: 'w-full border-collapse border border-slate-200' },
              h('thead', { className: 'bg-slate-100 text-[10px]' },
                h('tr', null,
                  h('th', { className: 'border p-1.5 text-left' }, 'Start'),
                  h('th', { className: 'border p-1.5 text-left' }, 'Cycle Len'),
                  h('th', { className: 'border p-1.5 text-left' }, 'Flow'),
                  h('th', { className: 'border p-1.5 text-left' }, 'Ovulation')
                )
              ),
              h('tbody', null,
                pastCycles.map(c => h('tr', { key: c.id, className: 'text-[11px]' },
                  h('td', { className: 'border p-1.5' }, c.startDate),
                  h('td', { className: 'border p-1.5 font-bold' }, `${c.cycleLength}d`),
                  h('td', { className: 'border p-1.5' }, `${c.periodDuration}d`),
                  h('td', { className: 'border p-1.5' }, c.ovulationDate)
                ))
              )
            )
          )
        ),
        h('div', { className: 'mt-6 pt-4 border-t flex justify-end' },
          h('button', { onClick: onClose, className: 'py-2 px-5 rounded-xl bg-slate-800 text-white text-xs font-bold' }, 'Close')
        )
      )
    );
  }

  // ----- PIN LOCK MODAL -----
  function PinLockModalView({ correctPin, onUnlock }) {
    const [pin, setPin] = useState('');
    const [err, setErr] = useState(false);

    const handleDigit = (d) => {
      if (pin.length < 4) {
        const next = pin + d;
        setPin(next);
        if (next.length === 4) {
          if (next === correctPin) {
            onUnlock();
          } else {
            setErr(true);
            setTimeout(() => { setErr(false); setPin(''); }, 700);
          }
        }
      }
    };

    return h('div', { className: 'fixed inset-0 z-50 bg-gradient-to-br from-pink-100/90 to-purple-100/95 backdrop-blur-md flex items-center justify-center p-4' },
      h('div', { className: 'bg-white rounded-3xl max-w-sm w-full p-8 border border-pink-200 shadow-2xl text-center space-y-6' },
        h('div', { className: 'w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-md' }, '🔒'),
        h('h2', { className: 'text-xl font-bold text-slate-800' }, 'CycleCare Vault Locked'),
        h('div', { className: 'flex justify-center gap-3 py-2' },
          Array.from({ length: 4 }).map((_, i) => h('div', {
            key: i,
            className: `w-3.5 h-3.5 rounded-full border-2 ${i < pin.length ? 'bg-pink-600 border-pink-600' : 'border-slate-300'}`
          }))
        ),
        err && h('p', { className: 'text-xs text-rose-600 font-bold' }, 'Incorrect PIN. Try 1234.'),
        h('div', { className: 'grid grid-cols-3 gap-3 max-w-[220px] mx-auto' },
          ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => h('button', {
            key: d,
            type: 'button',
            onClick: () => handleDigit(d),
            className: 'w-14 h-14 rounded-2xl bg-slate-50 border text-xl font-bold text-slate-700 hover:bg-pink-50'
          }, d)),
          h('button', { onClick: onUnlock, className: 'w-14 h-14 rounded-2xl bg-purple-50 text-xs font-bold text-purple-700' }, 'Face ID'),
          h('button', { onClick: () => handleDigit('0'), className: 'w-14 h-14 rounded-2xl bg-slate-50 border text-xl font-bold text-slate-700' }, '0'),
          h('button', { onClick: () => setPin(p => p.slice(0, -1)), className: 'w-14 h-14 rounded-2xl bg-slate-50 border text-sm font-bold text-slate-600' }, '⌫')
        ),
        h('p', { className: 'text-[11px] text-slate-400' }, 'Sample PIN: 1234')
      )
    );
  }

  // ----- TOAST CONTAINER -----
  function ToastContainerView({ toasts, onDismiss }) {
    if (toasts.length === 0) return null;
    return h('div', { className: 'fixed bottom-20 lg:bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none' },
      toasts.map(t => {
        let styleClasses = 'bg-white border-pink-200 text-slate-800';
        let icon = '🌸';
        if (t.type === 'error') {
          styleClasses = 'bg-rose-50 border-rose-300 text-rose-900';
          icon = '⚠️';
        } else if (t.type === 'warning') {
          styleClasses = 'bg-amber-50 border-amber-300 text-amber-900';
          icon = '⚡';
        } else if (t.type === 'info') {
          styleClasses = 'bg-purple-50 border-purple-200 text-purple-900';
          icon = 'ℹ️';
        }

        return h('div', {
          key: t.id,
          className: `pointer-events-auto p-4 rounded-2xl shadow-xl border text-xs font-semibold flex items-center justify-between gap-3 animate-fadeIn ${styleClasses}`
        },
          h('span', { className: 'flex items-center gap-2' },
            h('span', { className: 'text-sm shrink-0' }, icon),
            h('span', { className: 'leading-relaxed' }, t.message)
          ),
          h('button', { onClick: () => onDismiss(t.id), className: 'text-slate-400 hover:text-slate-600 ml-2 text-sm font-bold' }, '✕')
        );
      })
    );
  }

  // ==================== 6. MOUNTING & EXPORTS ====================
  if (typeof document !== 'undefined') {
    const rootElement = document.getElementById('root');
    if (rootElement && ReactDOM) {
      const root = ReactDOM.createRoot(rootElement);
      root.render(h(React.StrictMode, null, h(CycleCareApp)));
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      validateCycleParameters,
      computeCycleStatus,
      computeSymptomTrends,
      validateSupabaseKey,
      getSupabaseConfig,
      DEFAULT_USER_PROFILE,
      INITIAL_LOGS,
      INITIAL_PAST_CYCLES,
      ARTICLES_DATA,
      PREGNANCY_WEEKS_DATA,
      askMayaAi,
      generateCycleCalendarIcs,
    };
  }
})();
