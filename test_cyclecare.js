/**
 * CycleCare — End-to-End Test Suite
 * Validates server endpoints, cycle calculations, irregular cycle margins,
 * symptom trends aggregation, security key protection, and educational content.
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');
const fs = require('fs');

// Import CycleCare pure logic
const {
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
  isValidEmail,
} = require('./cyclecare.js');

const TEST_PORT = 3123;
let serverProcess = null;
let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failedCount++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failedCount++;
  }
}

function fetchHttp(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${TEST_PORT}${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    }).on('error', reject);
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
        VITE_SUPABASE_URL: 'https://test-project.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QtcHJvamVjdCIsInJvbGUiOiJhbW9uIn0.test',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    serverProcess.stdout.on('data', (d) => {
      stdout += d.toString();
      if (stdout.includes(`CycleCare server running at http://localhost:${TEST_PORT}`)) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (d) => {
      console.error('Server stderr:', d.toString());
    });

    serverProcess.on('error', reject);

    // Timeout fallback
    setTimeout(resolve, 1500);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
  }
}

async function main() {
  console.log('\n========================================');
  console.log('🌸 CycleCare Automated Test Suite');
  console.log('========================================\n');

  try {
    await startServer();

    // ----------------------------------------------------
    // Suite 1: HTTP Server & Static Assets
    // ----------------------------------------------------
    console.log('📦 Suite 1: Server Endpoints & Static Routing');

    await runAsyncTest('GET /api/health returns 200 with ok status and app name', async () => {
      const res = await fetchHttp('/api/health');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('application/json'));
      const json = JSON.parse(res.body);
      assert.strictEqual(json.status, 'ok');
      assert.strictEqual(json.app, 'CycleCare');
      assert(json.timestamp);
    });

    await runAsyncTest('GET /env.js safely injects environment variables into window.__ENV__', async () => {
      const res = await fetchHttp('/env.js');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('application/javascript'));
      assert(res.body.includes('window.__ENV__'));
      assert(res.body.includes('https://test-project.supabase.co'));
    });

    await runAsyncTest('GET / serves index.html with CycleCare branding and responsive viewport', async () => {
      const res = await fetchHttp('/');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/html'));
      assert(res.body.includes('<title>CycleCare'));
      assert(res.body.includes('name="viewport"'));
      assert(res.body.includes('src="/env.js"'));
      assert(res.body.includes('cyclecare.js'));
    });

    await runAsyncTest('GET /cyclecare.js serves main client bundle', async () => {
      const res = await fetchHttp('/cyclecare.js');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('application/javascript'));
      assert(res.body.includes('CycleCareApp'));
    });

    await runAsyncTest('Unknown routes fallback to index.html for SPA client-side routing', async () => {
      const res = await fetchHttp('/dashboard/calendar');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/html'));
      assert(res.body.includes('CycleCare'));
    });

    await runAsyncTest('POST /api/chat responds gracefully with fallback notice when no API key is provided', async () => {
      const res = await new Promise((resolve, reject) => {
        const req = http.request(`http://localhost:${TEST_PORT}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.write(JSON.stringify({ message: 'Hello' }));
        req.end();
      });
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.body);
      assert.strictEqual(json.fallback, true);
    });

    // ----------------------------------------------------
    // Suite 2: Cycle Calculations & Phase Forecasting
    // ----------------------------------------------------
    console.log('\n📅 Suite 2: Cycle Calculations & Phase Forecasting');

    runTest('Calculates current cycle day accurately based on last period start', () => {
      const profile = {
        lastPeriodStartDate: '2026-10-15',
        averageCycleLength: 28,
        averagePeriodLength: 5,
        lutealPhaseLength: 14,
        isIrregularCycle: false,
      };
      // On 2026-10-29, 14 full days have passed, so today is Cycle Day 15
      const status = computeCycleStatus(profile, '2026-10-29', INITIAL_PAST_CYCLES);
      assert.strictEqual(status.currentCycleDay, 15);
      assert.strictEqual(status.nextPeriodDate, '2026-11-12');
      assert.strictEqual(status.daysUntilNextPeriod, 14);
      assert(status.nextPeriodRange.start && status.nextPeriodRange.end);
    });

    runTest('Correctly identifies Menstrual Phase on active bleeding days', () => {
      const profile = {
        lastPeriodStartDate: '2026-10-26',
        averageCycleLength: 28,
        averagePeriodLength: 5,
      };
      // On 2026-10-28, day 3 of 5
      const status = computeCycleStatus(profile, '2026-10-28', []);
      assert.strictEqual(status.currentCycleDay, 3);
      assert.strictEqual(status.currentPhase, 'menstrual');
      assert.strictEqual(status.phaseTitle, 'Menstrual Phase');
    });

    runTest('Calculates Fertile Window and predicted ovulation date correctly', () => {
      const profile = {
        lastPeriodStartDate: '2026-10-15',
        averageCycleLength: 28,
        averagePeriodLength: 5,
        lutealPhaseLength: 14,
      };
      // Ovulation day = 28 - 14 = day 14 (Oct 28)
      // Fertile window = Oct 23 to Oct 29
      const status = computeCycleStatus(profile, '2026-10-28', []);
      assert.strictEqual(status.ovulationDate, '2026-10-28');
      assert.strictEqual(status.currentPhase, 'ovulation');
      assert.strictEqual(status.pregnancyChance, 'Peak (Ovulation)');
    });

    runTest('Correctly estimates Luteal Phase after ovulation', () => {
      const profile = {
        lastPeriodStartDate: '2026-10-01',
        averageCycleLength: 28,
        averagePeriodLength: 5,
      };
      // On 2026-10-25, cycle day 25 is deep into the luteal phase
      const status = computeCycleStatus(profile, '2026-10-25', []);
      assert.strictEqual(status.currentCycleDay, 25);
      assert.strictEqual(status.currentPhase, 'luteal');
      assert.strictEqual(status.phaseTitle, 'Luteal Phase');
    });

    // ----------------------------------------------------
    // Suite 3: Irregular Cycles & Uncertainty Handling
    // ----------------------------------------------------
    console.log('\n⚡ Suite 3: Irregular Cycles & Uncertainty Handling');

    runTest('Widens prediction margin for user-flagged irregular cycle', () => {
      const regularProfile = {
        lastPeriodStartDate: '2026-10-15',
        averageCycleLength: 28,
        averagePeriodLength: 5,
        isIrregularCycle: false,
      };
      const regularStatus = computeCycleStatus(regularProfile, '2026-10-29', []);
      
      const irregularProfile = {
        ...regularProfile,
        isIrregularCycle: true,
      };
      const irregularStatus = computeCycleStatus(irregularProfile, '2026-10-29', []);

      assert.strictEqual(irregularStatus.predictionConfidence, 'Wide Window (Irregular Rhythm)');
      // Regular margin is ±1 day (start to end is 2 days span)
      // Irregular margin is ±3 days (start to end is 6 days span)
      const regDiff = new Date(regularStatus.nextPeriodRange.end) - new Date(regularStatus.nextPeriodRange.start);
      const irregDiff = new Date(irregularStatus.nextPeriodRange.end) - new Date(irregularStatus.nextPeriodRange.start);
      assert(irregDiff > regDiff, 'Irregular prediction range must be wider than regular');
    });

    runTest('Automatically detects high historical variance and flags irregular prediction window', () => {
      const profile = {
        lastPeriodStartDate: '2026-10-15',
        averageCycleLength: 28,
        averagePeriodLength: 5,
        isIrregularCycle: false,
      };
      // Highly variable historical past cycles (21, 35, 24, 38)
      const volatileCycles = [
        { id: '1', cycleLength: 21, periodDuration: 4 },
        { id: '2', cycleLength: 35, periodDuration: 6 },
        { id: '3', cycleLength: 24, periodDuration: 5 },
        { id: '4', cycleLength: 38, periodDuration: 7 },
      ];
      const status = computeCycleStatus(profile, '2026-10-29', volatileCycles);
      assert.strictEqual(status.predictionConfidence, 'Wide Window (Irregular Rhythm)');
    });

    runTest('Includes clear non-diagnostic medical disclaimer with all predictions', () => {
      const status = computeCycleStatus(DEFAULT_USER_PROFILE, '2026-10-29', []);
      assert(status.medicalDisclaimer);
      assert(status.medicalDisclaimer.includes('NOT medical diagnoses'));
      assert(status.medicalDisclaimer.includes('birth control') || status.medicalDisclaimer.includes('contraception'));
    });

    // ----------------------------------------------------
    // Suite 4: Form & Parameter Validation
    // ----------------------------------------------------
    console.log('\n🛡️ Suite 4: Form & Parameter Validation');

    runTest('Accepts valid cycle inputs without errors', () => {
      const res = validateCycleParameters('2026-10-15', 28, 5);
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(Object.keys(res.errors).length, 0);
    });

    runTest('Rejects invalid cycle lengths (< 15 or > 90)', () => {
      const resTooLow = validateCycleParameters('2026-10-15', 10, 5);
      assert.strictEqual(resTooLow.isValid, false);
      assert(resTooLow.errors.averageCycleLength);

      const resTooHigh = validateCycleParameters('2026-10-15', 120, 5);
      assert.strictEqual(resTooHigh.isValid, false);
      assert(resTooHigh.errors.averageCycleLength);
    });

    runTest('Rejects invalid bleeding duration (< 1 or > 15)', () => {
      const resZero = validateCycleParameters('2026-10-15', 28, 0);
      assert.strictEqual(resZero.isValid, false);
      assert(resZero.errors.averagePeriodLength);

      const resTooHigh = validateCycleParameters('2026-10-15', 28, 20);
      assert.strictEqual(resTooHigh.isValid, false);
      assert(resTooHigh.errors.averagePeriodLength);
    });

    runTest('Rejects bleeding duration >= total cycle length', () => {
      const resEqual = validateCycleParameters('2026-10-15', 15, 15);
      assert.strictEqual(resEqual.isValid, false);
      assert(resEqual.errors.averagePeriodLength.includes('cannot exceed or equal'));
    });

    // ----------------------------------------------------
    // Suite 5: Symptom Trends Analytics & Zero Logs Edge Case
    // ----------------------------------------------------
    console.log('\n📊 Suite 5: Symptom Trends & Historical Aggregation');

    runTest('Gracefully handles empty logs (0 entries) without errors or NaN', () => {
      const trends = computeSymptomTrends({});
      assert.strictEqual(trends.totalLoggedDays, 0);
      assert.strictEqual(trends.periodDaysLogged, 0);
      assert.strictEqual(trends.crampsPeriodRatioPct, 0);
      assert.strictEqual(trends.totalCrampsCount, 0);
      assert.strictEqual(trends.headacheCount, 0);
      assert.strictEqual(trends.mostFrequentMood, null);
      assert.strictEqual(trends.mostFrequentEnergy, null);
      assert.strictEqual(trends.topPhysicalSymptoms.length, 6);
      trends.topPhysicalSymptoms.forEach(s => {
        assert.strictEqual(s.percentage, 0);
        assert.strictEqual(s.count, 0);
      });
    });

    runTest('Accurately aggregates symptom counts, mood trends, and energy distributions', () => {
      const trends = computeSymptomTrends(INITIAL_LOGS);
      assert(trends.totalLoggedDays >= 5);
      assert(trends.periodDaysLogged >= 5);
      assert(trends.crampsMildCount >= 1);
      assert(trends.crampsSevereCount >= 1);
      assert(trends.totalCrampsCount >= 2);
      assert(trends.crampsPeriodRatioPct > 0);
      assert(trends.topPhysicalSymptoms[0].count >= trends.topPhysicalSymptoms[1].count);
      assert(typeof trends.moodCounts.calm === 'number');
      assert(trends.energyCounts.sluggish >= 1);
    });

    // ----------------------------------------------------
    // Suite 6: Security & Supabase Key Protection
    // ----------------------------------------------------
    console.log('\n🔐 Suite 6: Supabase RLS Client Protection & Security');

    runTest('Detects and blocks service_role keys to protect client security', () => {
      // Craft a mock service_role JWT
      const serviceHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const servicePayload = Buffer.from(JSON.stringify({ role: 'service_role', sub: 'admin' })).toString('base64');
      const serviceRoleToken = `${serviceHeader}.${servicePayload}.mocksignature`;

      const check = validateSupabaseKey(serviceRoleToken);
      assert.strictEqual(check.isValid, false);
      assert(check.error.includes('service_role'));
    });

    runTest('Allows valid anon public keys', () => {
      const anonHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const anonPayload = Buffer.from(JSON.stringify({ role: 'anon', sub: 'anon-user' })).toString('base64');
      const anonToken = `${anonHeader}.${anonPayload}.mocksignature`;

      const check = validateSupabaseKey(anonToken);
      assert.strictEqual(check.isValid, true);
    });

    runTest('Rejects empty or missing keys', () => {
      const checkEmpty = validateSupabaseKey('');
      assert.strictEqual(checkEmpty.isValid, false);
      const checkNull = validateSupabaseKey(null);
      assert.strictEqual(checkNull.isValid, false);
    });

    runTest('Validates proper email address format and rejects random strings', () => {
      assert.strictEqual(isValidEmail('tobi@gmail.com'), true);
      assert.strictEqual(isValidEmail('maya.chen@cyclecare.app'), true);
      assert.strictEqual(isValidEmail('random'), false);
      assert.strictEqual(isValidEmail('fake@'), false);
      assert.strictEqual(isValidEmail('user@domain'), false);
      assert.strictEqual(isValidEmail(''), false);
      assert.strictEqual(isValidEmail(null), false);
    });

    // ----------------------------------------------------
    // Suite 7: Educational Content & Medically Reviewed Standards
    // ----------------------------------------------------
    console.log('\n📖 Suite 7: Educational Content & Medically Reviewed Articles');

    runTest('All educational articles include peer-reviewed sources and reviewer credentials', () => {
      assert(ARTICLES_DATA.length >= 3);
      for (const article of ARTICLES_DATA) {
        assert(article.id, 'Article must have an ID');
        assert(article.title, 'Article must have a title');
        assert(article.medicalReviewer, `Article ${article.id} missing medicalReviewer`);
        assert(article.medicalReviewerTitle, `Article ${article.id} missing medicalReviewerTitle`);
        assert(article.reviewDate, `Article ${article.id} missing reviewDate`);
        assert(article.sources && article.sources.length > 0, `Article ${article.id} must have sources`);
        assert(article.disclaimer && article.disclaimer.includes('Medical Disclaimer'), `Article ${article.id} must have a medical disclaimer`);
      }
    });

    // ----------------------------------------------------
    // Suite 8: Mobile PWA Manifest & Service Worker Assets
    // ----------------------------------------------------
    console.log('\n📱 Suite 8: Mobile PWA Manifest & Service Worker Assets');

    runTest('Web App Manifest exists and is valid JSON with standalone display and icons', () => {
      const manifestPath = path.join(__dirname, 'manifest.json');
      assert(fs.existsSync(manifestPath), 'manifest.json must exist');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      assert(manifest.name.includes('CycleCare'));
      assert.strictEqual(manifest.display, 'standalone');
      assert(manifest.start_url === '/' || manifest.start_url === './');
      assert(manifest.icons && manifest.icons.length >= 2, 'Manifest must have at least 2 icon sizes');
    });

    runTest('Service Worker sw.js exists with cache-first / network strategy', () => {
      const swPath = path.join(__dirname, 'sw.js');
      assert(fs.existsSync(swPath), 'sw.js must exist');
      const sw = fs.readFileSync(swPath, 'utf8');
      assert(sw.includes('cyclecare-v'), 'sw.js must specify a versioned cache name');
      assert(sw.includes("addEventListener('install'"), 'sw.js must handle install event');
      assert(sw.includes("addEventListener('fetch'"), 'sw.js must handle fetch event');
      assert(sw.includes("addEventListener('notificationclick'"), 'sw.js must handle notification click');
    });

    runTest('PWA vector and PNG icons are generated and accessible', () => {
      assert(fs.existsSync(path.join(__dirname, 'assets', 'icon.svg')), 'assets/icon.svg must exist');
      assert(fs.existsSync(path.join(__dirname, 'assets', 'icon-192.png')), 'assets/icon-192.png must exist');
      assert(fs.existsSync(path.join(__dirname, 'assets', 'icon-512.png')), 'assets/icon-512.png must exist');
    });

    // ----------------------------------------------------
    // Suite 9: Pregnancy & Fetal Milestones Model
    // ----------------------------------------------------
    console.log('\n🤰 Suite 9: Pregnancy & Fetal Milestones Model');

    runTest('PREGNANCY_WEEKS_DATA spans all 40 gestational weeks with fruit comparison and milestones', () => {
      assert(typeof PREGNANCY_WEEKS_DATA === 'object', 'PREGNANCY_WEEKS_DATA must be defined');
      for (let w = 1; w <= 40; w++) {
        const data = PREGNANCY_WEEKS_DATA[w];
        assert(data, `Week ${w} data must exist in PREGNANCY_WEEKS_DATA`);
        assert(data.fruit, `Week ${w} must define a fruit/size comparison`);
        assert(data.length, `Week ${w} must define length`);
        assert(data.weight, `Week ${w} must define weight`);
        assert([1, 2, 3].includes(data.trimester), `Week ${w} must belong to trimester 1, 2, or 3`);
        assert(data.milestones && data.milestones.length > 10, `Week ${w} must define milestones`);
        assert(data.maternalChanges && data.maternalChanges.length > 10, `Week ${w} must define maternal changes`);
      }
    });

    runTest('Trimester segmentation correctly categorizes all weeks', () => {
      assert.strictEqual(PREGNANCY_WEEKS_DATA[4].trimester, 1);
      assert.strictEqual(PREGNANCY_WEEKS_DATA[12].trimester, 1);
      assert.strictEqual(PREGNANCY_WEEKS_DATA[13].trimester, 2);
      assert.strictEqual(PREGNANCY_WEEKS_DATA[26].trimester, 2);
      assert.strictEqual(PREGNANCY_WEEKS_DATA[27].trimester, 3);
      assert.strictEqual(PREGNANCY_WEEKS_DATA[40].trimester, 3);
    });

    // ----------------------------------------------------
    // Suite 10: Maya AI Health Companion Q&A Engine
    // ----------------------------------------------------
    console.log('\n💬 Suite 10: Maya AI Health Companion Knowledge & Q&A Engine');

    const sampleStatus = {
      currentCycleDay: 15,
      phaseTitle: 'Ovulatory Phase',
      phaseDescription: 'Luteinizing Hormone (LH) surge triggers ovulation within 24–36 hours.',
      nextPeriodDate: '2026-11-12',
      ovulationDate: '2026-10-29',
      fertileWindowStart: '2026-10-24',
      fertileWindowEnd: '2026-10-30',
      daysUntilNextPeriod: 14,
    };

    runTest('Answers dysmenorrhea / cramp queries with clinical prostaglandin references', () => {
      const res = askMayaAi('Why do I have bad cramps?', sampleStatus, DEFAULT_USER_PROFILE);
      assert.strictEqual(res.matched, true);
      assert(res.reply.includes('prostaglandins'));
      assert(res.sources.includes('ACOG'));
    });

    runTest('Answers ovulation test / LH strip inquiries with clinical timing protocol', () => {
      const res = askMayaAi('How do I read my ovulation test strip?', sampleStatus, DEFAULT_USER_PROFILE);
      assert.strictEqual(res.matched, true);
      assert(res.reply.includes('LH surge'));
      assert(res.reply.includes('24–36 hours'));
    });

    runTest('Answers luteal phase nutrition questions with micronutrient guidance', () => {
      const res = askMayaAi('What foods should I eat in the luteal phase?', sampleStatus, DEFAULT_USER_PROFILE);
      assert.strictEqual(res.matched, true);
      assert(res.reply.toLowerCase().includes('carbohydrates') || res.reply.toLowerCase().includes('magnesium'));
    });

    runTest('Answers cervical mucus inquiries with fertility indicator descriptions', () => {
      const res = askMayaAi('What does egg-white cervical mucus mean?', sampleStatus, DEFAULT_USER_PROFILE);
      assert.strictEqual(res.matched, true);
      assert(res.reply.toLowerCase().includes('egg white') || res.reply.toLowerCase().includes('estrogen'));
    });

    runTest('Answers missed contraceptive pill inquiries with ACOG protocol', () => {
      const res = askMayaAi('What if I missed a birth control pill yesterday?', sampleStatus, DEFAULT_USER_PROFILE);
      assert.strictEqual(res.matched, true);
      assert(res.reply.includes('active pill') || res.reply.includes('ACOG'));
      assert(res.sources.includes('ACOG'));
    });

    runTest('Answers uncataloged queries with personalized cycle-phase context and clinical disclaimer', () => {
      const res = askMayaAi('Can high altitude affect my skin?', sampleStatus, DEFAULT_USER_PROFILE);
      assert.strictEqual(res.matched, false);
      assert(res.reply.includes('Ovulatory Phase'));
      assert(res.reply.includes('Cycle Day 15'));
      assert(res.sources.includes('ACOG'));
    });

    runTest('Answers direct transparency and honesty queries with clear clinical boundaries', () => {
      const res = askMayaAi('can you be honest with me', sampleStatus, DEFAULT_USER_PROFILE);
      assert.strictEqual(res.matched, true);
      assert.strictEqual(res.title, 'Complete Transparency & Honesty');
      assert(res.reply.includes('100% honest and transparent'));
      assert(res.reply.includes('ACOG'));
    });

    runTest('Answers identity queries directly with Maya introduction', () => {
      const res = askMayaAi('who are you', sampleStatus, DEFAULT_USER_PROFILE);
      assert.strictEqual(res.matched, true);
      assert(res.reply.includes('I am Maya'));
    });

    // ----------------------------------------------------
    // Suite 11: iCalendar (.ICS) Schedule & Reminder Exporter
    // ----------------------------------------------------
    console.log('\n📅 Suite 11: iCalendar (.ICS) Schedule & Reminder Exporter');

    runTest('Generates standard RFC-5545 formatted .ICS file', () => {
      const ics = generateCycleCalendarIcs(DEFAULT_USER_PROFILE, sampleStatus);
      assert(ics.startsWith('BEGIN:VCALENDAR'), 'ICS must start with BEGIN:VCALENDAR');
      assert(ics.includes('VERSION:2.0'), 'ICS must declare VERSION:2.0');
      assert(ics.includes('PRODID:-//CycleCare//Cycle Health Companion//EN'), 'ICS must declare PRODID');
      assert(ics.includes('BEGIN:VEVENT'), 'ICS must contain VEVENT entries');
      assert(ics.includes('SUMMARY:🌸 CycleCare: Predicted Period'), 'ICS must contain predicted period event');
      assert(ics.includes('SUMMARY:★ CycleCare: Predicted Ovulation Peak'), 'ICS must contain predicted ovulation event');
      assert(ics.includes('SUMMARY:🌿 CycleCare: Estimated Fertile Window'), 'ICS must contain fertile window event');
      assert(ics.trim().endsWith('END:VCALENDAR'), 'ICS must end with END:VCALENDAR');
    });

    // ----------------------------------------------------
    // Suite 12: Text Readability, Accessibility & Font Scaling
    // ----------------------------------------------------
    console.log('\n🔤 Suite 12: Text Readability, Accessibility & Dynamic Font Scaling');

    runTest('index.html enables mobile pinch-to-zoom accessibility (user-scalable=yes)', () => {
      const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
      assert(indexHtml.includes('user-scalable=yes'), 'index.html must enable user-scalable=yes for accessibility');
      assert(indexHtml.includes('maximum-scale=5.0'), 'index.html must allow scaling up to at least 5.0');
    });

    runTest('index.html restores text scaling immediately to eliminate FOUC layout shift', () => {
      const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
      assert(indexHtml.includes('cyclecare_text_scale'), 'index.html must check stored text scale preference');
      assert(indexHtml.includes('setAttribute(\'data-text-scale\''), 'index.html must set data-text-scale attribute');
    });

    runTest('styles.css defines scalable font sizes across standard, comfortable, large, and xlarge tiers', () => {
      const stylesCss = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
      assert(stylesCss.includes('html[data-text-scale="standard"]'), 'styles.css must support standard (16px)');
      assert(stylesCss.includes('html[data-text-scale="comfortable"]'), 'styles.css must support comfortable (18px)');
      assert(stylesCss.includes('html[data-text-scale="large"]'), 'styles.css must support large (20px)');
      assert(stylesCss.includes('html[data-text-scale="xlarge"]'), 'styles.css must support xlarge (22px)');
      assert(stylesCss.includes('0.8125rem !important'), 'styles.css must elevate micro-text utilities so text is never tiny');
    });

    runTest('cyclecare.js provides dynamic text scaling controls and persists user choice', () => {
      const jsContent = fs.readFileSync(path.join(__dirname, 'cyclecare.js'), 'utf8');
      assert(jsContent.includes('cyclecare_text_scale'), 'cyclecare.js must persist text scale to localStorage');
      assert(jsContent.includes('handleCycleTextScale'), 'cyclecare.js must implement cycle font scale handler');
      assert(jsContent.includes('Display & Text Size (Accessibility)'), 'Settings must contain Display & Text Size section');
    });

    runTest('Maya AI companion uses comfortable, scalable text for clear reading', () => {
      const jsContent = fs.readFileSync(path.join(__dirname, 'cyclecare.js'), 'utf8');
      assert(jsContent.includes('text-sm sm:text-base whitespace-pre-wrap select-text'), 'Maya response text must use comfortable scalable typography');
    });

    // ----------------------------------------------------
    // Suite 13: Live SMS Reception Modal & Active Reservation Display
    // ----------------------------------------------------
    console.log('\n📱 Suite 13: Live SMS Reception Modal & Active Reservation Display');

    const { getOrCreateCustomerId, SmsReceptionModalView } = require('./cyclecare');

    runTest('getOrCreateCustomerId isolates authenticated users and generates customer tenant ID', () => {
      assert.strictEqual(typeof getOrCreateCustomerId, 'function');
      const authUser = { id: 'usr_auth_789', email: 'jane@example.com' };
      assert.strictEqual(getOrCreateCustomerId(authUser), 'usr_auth_789');

      const guestId = getOrCreateCustomerId(null);
      assert(guestId.startsWith('cust_'), 'Guest customer ID must start with cust_');
    });

    runTest('SmsReceptionModalView component is defined and exported', () => {
      assert.strictEqual(typeof SmsReceptionModalView, 'function');
    });

    runTest('cyclecare.js renders all 7 required display elements for live SMS reception', () => {
      const jsContent = fs.readFileSync(path.join(__dirname, 'cyclecare.js'), 'utf8');

      // 1. Purchased phone number
      assert(jsContent.includes('Purchased Phone Number') && jsContent.includes('activeOrder.number'), 'Must display purchased phone number');

      // 2. Selected country and service
      assert(jsContent.includes('countryName') && jsContent.includes('serviceName'), 'Must display selected country and service');

      // 3. Order reference
      assert(jsContent.includes('activeOrder.id') && jsContent.includes('Ref:'), 'Must display order reference ID');

      // 4. Waiting for SMS status
      assert(jsContent.includes('Waiting for SMS') && jsContent.includes('Live polling active'), 'Must display waiting for SMS status');

      // 5. Received message
      assert(jsContent.includes('Received Message') && jsContent.includes('Verification Code / OTP'), 'Must display received message and code');

      // 6. Received time
      assert(jsContent.includes('formatTimestamp(latestMsg.receivedAt)'), 'Must display received time');

      // 7. Copy message button
      assert(jsContent.includes('Copy Code') && jsContent.includes('Copy Full Message'), 'Must provide 1-click copy buttons');
    });

    runTest('Controlled polling interval (3.5s) stops on completion, expiry, or cancellation', () => {
      const jsContent = fs.readFileSync(path.join(__dirname, 'cyclecare.js'), 'utf8');
      assert(jsContent.includes('3500'), 'Must poll at controlled 3500ms interval');
      assert(jsContent.includes('status === \'RECEIVED\''), 'Must stop polling when SMS is received');
      assert(jsContent.includes('status === \'CANCELLED\''), 'Must stop polling when order is cancelled');
      assert(jsContent.includes('status === \'EXPIRED\''), 'Must stop polling when order is expired');
    });

    runTest('Customer tenant isolation and resilient provider error handling are enforced in client requests', () => {
      const jsContent = fs.readFileSync(path.join(__dirname, 'cyclecare.js'), 'utf8');
      assert(jsContent.includes('\'x-customer-id\': customerId'), 'Every SMS API call must send customer isolation header');
      assert(jsContent.includes('setPollError'), 'Provider timeouts and drops must be handled gracefully');
    });

  } finally {
    stopServer();
  }

  console.log('\n========================================');
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('========================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  stopServer();
  process.exit(1);
});
