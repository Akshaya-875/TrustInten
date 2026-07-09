# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e.spec.js >> TrustIntern AI – Full Live Feature Demo
- Location: tests\e2e.spec.js:23:1

# Error details

```
Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for locator('input[placeholder=""]').nth(1)

```

# Test source

```ts
  3   | import path from 'path';
  4   | import { fileURLToPath } from 'url';
  5   | 
  6   | const __filename = fileURLToPath(import.meta.url);
  7   | const __dirname = path.dirname(__filename);
  8   | 
  9   | test.use({
  10  |   headless: false,
  11  |   launchOptions: { slowMo: 700 },
  12  |   viewport: { width: 1280, height: 800 },
  13  | });
  14  | 
  15  | test.setTimeout(180000);
  16  | 
  17  | // Helper: pause with a visible console message
  18  | async function step(page, message, ms = 1500) {
  19  |   console.log(`\n🎬 ${message}`);
  20  |   await page.waitForTimeout(ms);
  21  | }
  22  | 
  23  | test('TrustIntern AI – Full Live Feature Demo', async ({ page }) => {
  24  | 
  25  |   // ═══════════════════════════════════════════════════════════
  26  |   // SCENE 1: LANDING / LOGIN PAGE
  27  |   // ═══════════════════════════════════════════════════════════
  28  |   console.log('\n===================================');
  29  |   console.log('  TrustIntern AI - Live Demo Start ');
  30  |   console.log('===================================');
  31  | 
  32  |   await page.goto('http://localhost:5173/login');
  33  |   await page.waitForLoadState('networkidle');
  34  |   await step(page, 'SCENE 1: Login page loaded', 2500);
  35  | 
  36  |   // ═══════════════════════════════════════════════════════════
  37  |   // SCENE 2: REGISTER PAGE TOUR
  38  |   // ═══════════════════════════════════════════════════════════
  39  |   await step(page, 'SCENE 2: Navigating to Register page...');
  40  |   await page.click('text=Sign Up');
  41  |   await page.waitForLoadState('networkidle');
  42  |   await step(page, 'Register form visible – showing Student/Recruiter toggle', 2000);
  43  | 
  44  |   // Toggle to Recruiter to show both roles
  45  |   await page.click('button:has-text("Recruiter")');
  46  |   await step(page, 'Recruiter role selected – company name field appears', 1500);
  47  |   await page.click('button:has-text("Student")');
  48  |   await step(page, 'Back to Student role', 1000);
  49  | 
  50  |   // Navigate back to login
  51  |   await page.click('text=Sign In');
  52  |   await page.waitForLoadState('networkidle');
  53  |   await step(page, 'Returning to Login...', 1000);
  54  | 
  55  |   // ═══════════════════════════════════════════════════════════
  56  |   // SCENE 3: STUDENT LOGIN (john_student / password)
  57  |   // ═══════════════════════════════════════════════════════════
  58  |   await step(page, 'SCENE 3: Logging in as John (seeded student)');
  59  |   await page.fill('input[placeholder="Enter username"]', 'john_student');
  60  |   await page.waitForTimeout(600);
  61  |   await page.fill('input[placeholder="••••••••"]', 'password');
  62  |   await page.waitForTimeout(600);
  63  |   await page.click('button:has-text("Sign In")');
  64  | 
  65  |   const loginOk = await page.waitForURL('**/student/dashboard', { timeout: 10000 })
  66  |     .then(() => true)
  67  |     .catch(() => false);
  68  | 
  69  |   if (!loginOk) {
  70  |     console.log('❌ Login failed. Taking screenshot...');
  71  |     await page.screenshot({ path: path.join(__dirname, 'login_error.png') });
  72  |     return;
  73  |   }
  74  | 
  75  |   await page.waitForLoadState('networkidle');
  76  |   await step(page, 'SCENE 3 ✅ Student Dashboard loaded! JWT auth working.', 3000);
  77  | 
  78  |   // ═══════════════════════════════════════════════════════════
  79  |   // SCENE 4: NOTIFICATIONS BELL
  80  |   // ═══════════════════════════════════════════════════════════
  81  |   await step(page, 'SCENE 4: Opening Notifications dropdown...');
  82  |   const bell = page.locator('button[data-bs-toggle="dropdown"]').first();
  83  |   await bell.click();
  84  |   await step(page, 'Notifications panel open', 2000);
  85  |   await bell.click(); // close it
  86  | 
  87  |   // ═══════════════════════════════════════════════════════════
  88  |   // SCENE 5: EDIT PROFILE
  89  |   // ═══════════════════════════════════════════════════════════
  90  |   await step(page, 'SCENE 5: Editing student profile...');
  91  |   const editBtn = page.locator('button:has-text("Edit Profile Details")');
  92  |   await editBtn.scrollIntoViewIfNeeded();
  93  |   await editBtn.click({ force: true });
  94  |   await page.waitForTimeout(800);
  95  | 
  96  |   // Update CGPA
  97  |   const cgpaField = page.locator('input[type="number"]');
  98  |   await cgpaField.fill('8.75');
  99  |   await page.waitForTimeout(500);
  100 | 
  101 |   // Update preferred location
  102 |   const locField = page.locator('input[placeholder=""]').nth(1);
> 103 |   await locField.fill('Bangalore');
      |                  ^ Error: locator.fill: Target page, context or browser has been closed
  104 |   await page.waitForTimeout(400);
  105 | 
  106 |   // Check a couple of skills
  107 |   const skillCheck = page.locator('input[type="checkbox"]').first();
  108 |   if (await skillCheck.isVisible()) {
  109 |     await skillCheck.check();
  110 |     await page.waitForTimeout(300);
  111 |   }
  112 | 
  113 |   await step(page, 'Saving profile changes...');
  114 |   await page.click('button:has-text("Save")');
  115 |   await step(page, '✅ Profile saved! Success banner should appear.', 2500);
  116 | 
  117 |   // ═══════════════════════════════════════════════════════════
  118 |   // SCENE 6: CERTIFICATE UPLOAD (OCR Verification)
  119 |   // ═══════════════════════════════════════════════════════════
  120 |   await step(page, 'SCENE 6: Uploading degree certificate for AI OCR verification...');
  121 | 
  122 |   // Create a dummy text file (backend will apply fallback verification)
  123 |   const certPath = path.join(__dirname, 'john_doe_certificate.txt');
  124 |   fs.writeFileSync(certPath, 
  125 |     'CERTIFICATE OF GRADUATION\n' +
  126 |     'This is to certify that\n' +
  127 |     'John Doe\n' +
  128 |     'Register No: REG101\n' +
  129 |     'Has successfully completed the requirements for the degree of\n' +
  130 |     'Bachelor of Engineering in Computer Science\n' +
  131 |     'CGPA: 8.50\n' +
  132 |     'Anna University\n' +
  133 |     'Year: 2024'
  134 |   );
  135 | 
  136 |   // Make all file inputs accessible
  137 |   await page.evaluate(() => {
  138 |     document.querySelectorAll('input[type="file"]').forEach(el => {
  139 |       el.removeAttribute('hidden');
  140 |       el.style.opacity = '1';
  141 |       el.style.position = 'relative';
  142 |       el.style.display = 'block';
  143 |     });
  144 |   });
  145 | 
  146 |   const certInput = page.locator('input[type="file"]').first();
  147 |   await certInput.setInputFiles(certPath);
  148 |   await step(page, '📄 Certificate uploaded! Backend is running OCR + Blockchain hashing...', 4000);
  149 | 
  150 |   // ═══════════════════════════════════════════════════════════
  151 |   // SCENE 7: SCROLL THROUGH DASHBOARD
  152 |   // ═══════════════════════════════════════════════════════════
  153 |   await step(page, 'SCENE 7: Scrolling through full dashboard...');
  154 |   await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
  155 |   await step(page, 'Viewing file upload panels', 1800);
  156 |   await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }));
  157 |   await step(page, 'Viewing AI Recommendations panel', 2500);
  158 |   await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'smooth' }));
  159 |   await step(page, 'Viewing Applied Internships Tracker', 2000);
  160 |   await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  161 |   await step(page, 'Back to top', 1000);
  162 | 
  163 |   // ═══════════════════════════════════════════════════════════
  164 |   // SCENE 8: RELOAD - see updated verification status
  165 |   // ═══════════════════════════════════════════════════════════
  166 |   await step(page, 'SCENE 8: Reloading dashboard to show updated verification status...');
  167 |   await page.reload();
  168 |   await page.waitForLoadState('networkidle');
  169 |   await step(page, '🔄 Dashboard refreshed – check verification badge!', 3000);
  170 | 
  171 |   // ═══════════════════════════════════════════════════════════
  172 |   // SCENE 9: LOGOUT and LOGIN AS ADMIN
  173 |   // ═══════════════════════════════════════════════════════════
  174 |   await step(page, 'SCENE 9: Logging out...');
  175 |   await page.click('button:has-text("Logout")');
  176 |   await page.waitForURL('**/login');
  177 |   await step(page, 'Logged out. Now logging in as Admin...', 1500);
  178 | 
  179 |   await page.fill('input[placeholder="Enter username"]', 'admin');
  180 |   await page.waitForTimeout(500);
  181 |   await page.fill('input[placeholder="••••••••"]', 'password');
  182 |   await page.waitForTimeout(500);
  183 |   await page.click('button:has-text("Sign In")');
  184 | 
  185 |   const adminOk = await page.waitForURL('**/admin/dashboard', { timeout: 8000 })
  186 |     .then(() => true).catch(() => false);
  187 | 
  188 |   if (adminOk) {
  189 |     await page.waitForLoadState('networkidle');
  190 |     await step(page, 'SCENE 9 ✅ Admin Dashboard loaded!', 2000);
  191 |     await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
  192 |     await step(page, 'Admin can view students, verify certificates, and mint blockchain records', 3000);
  193 |     await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'smooth' }));
  194 |     await step(page, 'Viewing blockchain ledger / internship management', 3000);
  195 |   } else {
  196 |     console.log('⚠️ Admin dashboard redirect failed');
  197 |   }
  198 | 
  199 |   // ═══════════════════════════════════════════════════════════
  200 |   // FINAL HOLD
  201 |   // ═══════════════════════════════════════════════════════════
  202 |   console.log('\n✅ DEMO COMPLETE! All features shown.');
  203 |   await step(page, '🎉 Demo complete! Holding for review...', 6000);
```