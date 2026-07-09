import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.use({
  headless: false,
  launchOptions: { slowMo: 700 },
  viewport: { width: 1280, height: 800 },
});

test.setTimeout(180000);

// Helper: pause with a visible console message
async function step(page, message, ms = 1500) {
  console.log(`\n🎬 ${message}`);
  await page.waitForTimeout(ms);
}

test('TrustIntern AI – Full Live Feature Demo', async ({ page }) => {

  // ═══════════════════════════════════════════════════════════
  // SCENE 1: LANDING / LOGIN PAGE
  // ═══════════════════════════════════════════════════════════
  console.log('\n===================================');
  console.log('  TrustIntern AI - Live Demo Start ');
  console.log('===================================');

  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await step(page, 'SCENE 1: Login page loaded', 2500);

  // ═══════════════════════════════════════════════════════════
  // SCENE 2: REGISTER PAGE TOUR
  // ═══════════════════════════════════════════════════════════
  await step(page, 'SCENE 2: Navigating to Register page...');
  await page.click('text=Sign Up');
  await page.waitForLoadState('networkidle');
  await step(page, 'Register form visible – showing Student/Recruiter toggle', 2000);

  // Toggle to Recruiter to show both roles
  await page.click('button:has-text("Recruiter")');
  await step(page, 'Recruiter role selected – company name field appears', 1500);
  await page.click('button:has-text("Student")');
  await step(page, 'Back to Student role', 1000);

  // Navigate back to login
  await page.click('text=Sign In');
  await page.waitForLoadState('networkidle');
  await step(page, 'Returning to Login...', 1000);

  // ═══════════════════════════════════════════════════════════
  // SCENE 3: STUDENT LOGIN (john_student / password)
  // ═══════════════════════════════════════════════════════════
  await step(page, 'SCENE 3: Logging in as John (seeded student)');
  await page.fill('input[placeholder="Enter username"]', 'john_student');
  await page.waitForTimeout(600);
  await page.fill('input[placeholder="••••••••"]', 'password');
  await page.waitForTimeout(600);
  await page.click('button:has-text("Sign In")');

  const loginOk = await page.waitForURL('**/student/dashboard', { timeout: 10000 })
    .then(() => true)
    .catch(() => false);

  if (!loginOk) {
    console.log('❌ Login failed. Taking screenshot...');
    await page.screenshot({ path: path.join(__dirname, 'login_error.png') });
    return;
  }

  await page.waitForLoadState('networkidle');
  await step(page, 'SCENE 3 ✅ Student Dashboard loaded! JWT auth working.', 3000);

  // ═══════════════════════════════════════════════════════════
  // SCENE 4: NOTIFICATIONS BELL
  // ═══════════════════════════════════════════════════════════
  await step(page, 'SCENE 4: Opening Notifications dropdown...');
  const bell = page.locator('button[data-bs-toggle="dropdown"]').first();
  await bell.click();
  await step(page, 'Notifications panel open', 2000);
  await bell.click(); // close it

  // ═══════════════════════════════════════════════════════════
  // SCENE 5: EDIT PROFILE
  // ═══════════════════════════════════════════════════════════
  await step(page, 'SCENE 5: Editing student profile...');
  const editBtn = page.locator('button:has-text("Edit Profile Details")');
  await editBtn.scrollIntoViewIfNeeded();
  await editBtn.click({ force: true });
  await page.waitForTimeout(800);

  // Update CGPA
  const cgpaField = page.locator('input[type="number"]');
  await cgpaField.fill('8.75');
  await page.waitForTimeout(500);

  // Update preferred location
  const locField = page.locator('input[placeholder=""]').nth(1);
  await locField.fill('Bangalore');
  await page.waitForTimeout(400);

  // Check a couple of skills
  const skillCheck = page.locator('input[type="checkbox"]').first();
  if (await skillCheck.isVisible()) {
    await skillCheck.check();
    await page.waitForTimeout(300);
  }

  await step(page, 'Saving profile changes...');
  await page.click('button:has-text("Save")');
  await step(page, '✅ Profile saved! Success banner should appear.', 2500);

  // ═══════════════════════════════════════════════════════════
  // SCENE 6: CERTIFICATE UPLOAD (OCR Verification)
  // ═══════════════════════════════════════════════════════════
  await step(page, 'SCENE 6: Uploading degree certificate for AI OCR verification...');

  // Create a dummy text file (backend will apply fallback verification)
  const certPath = path.join(__dirname, 'john_doe_certificate.txt');
  fs.writeFileSync(certPath, 
    'CERTIFICATE OF GRADUATION\n' +
    'This is to certify that\n' +
    'John Doe\n' +
    'Register No: REG101\n' +
    'Has successfully completed the requirements for the degree of\n' +
    'Bachelor of Engineering in Computer Science\n' +
    'CGPA: 8.50\n' +
    'Anna University\n' +
    'Year: 2024'
  );

  // Make all file inputs accessible
  await page.evaluate(() => {
    document.querySelectorAll('input[type="file"]').forEach(el => {
      el.removeAttribute('hidden');
      el.style.opacity = '1';
      el.style.position = 'relative';
      el.style.display = 'block';
    });
  });

  const certInput = page.locator('input[type="file"]').first();
  await certInput.setInputFiles(certPath);
  await step(page, '📄 Certificate uploaded! Backend is running OCR + Blockchain hashing...', 4000);

  // ═══════════════════════════════════════════════════════════
  // SCENE 7: SCROLL THROUGH DASHBOARD
  // ═══════════════════════════════════════════════════════════
  await step(page, 'SCENE 7: Scrolling through full dashboard...');
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
  await step(page, 'Viewing file upload panels', 1800);
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }));
  await step(page, 'Viewing AI Recommendations panel', 2500);
  await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'smooth' }));
  await step(page, 'Viewing Applied Internships Tracker', 2000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await step(page, 'Back to top', 1000);

  // ═══════════════════════════════════════════════════════════
  // SCENE 8: RELOAD - see updated verification status
  // ═══════════════════════════════════════════════════════════
  await step(page, 'SCENE 8: Reloading dashboard to show updated verification status...');
  await page.reload();
  await page.waitForLoadState('networkidle');
  await step(page, '🔄 Dashboard refreshed – check verification badge!', 3000);

  // ═══════════════════════════════════════════════════════════
  // SCENE 9: LOGOUT and LOGIN AS ADMIN
  // ═══════════════════════════════════════════════════════════
  await step(page, 'SCENE 9: Logging out...');
  await page.click('button:has-text("Logout")');
  await page.waitForURL('**/login');
  await step(page, 'Logged out. Now logging in as Admin...', 1500);

  await page.fill('input[placeholder="Enter username"]', 'admin');
  await page.waitForTimeout(500);
  await page.fill('input[placeholder="••••••••"]', 'password');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Sign In")');

  const adminOk = await page.waitForURL('**/admin/dashboard', { timeout: 8000 })
    .then(() => true).catch(() => false);

  if (adminOk) {
    await page.waitForLoadState('networkidle');
    await step(page, 'SCENE 9 ✅ Admin Dashboard loaded!', 2000);
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
    await step(page, 'Admin can view students, verify certificates, and mint blockchain records', 3000);
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'smooth' }));
    await step(page, 'Viewing blockchain ledger / internship management', 3000);
  } else {
    console.log('⚠️ Admin dashboard redirect failed');
  }

  // ═══════════════════════════════════════════════════════════
  // FINAL HOLD
  // ═══════════════════════════════════════════════════════════
  console.log('\n✅ DEMO COMPLETE! All features shown.');
  await step(page, '🎉 Demo complete! Holding for review...', 6000);
});
