# Deployment & Integration Checklist

## Pre-Deployment Tasks

### 1. ✅ Database Setup (REQUIRED)
- [ ] Log into Supabase dashboard
- [ ] Go to SQL Editor
- [ ] Create new query
- [ ] Copy contents of `project-requests-schema.sql`
- [ ] Run the SQL
- [ ] Verify `project_requests` table appears in Tables list

### 2. ✅ Update Admin Component Integration
**File:** `src/pages/admin.astro`

Find the line with other component imports (around line 2-5):
```astro
import ProjectRequestsManager from '../components/ProjectRequestsManager.astro';
```

Find the location to insert (inside the admin container, after existing sections):
```astro
<!-- Add this BEFORE the closing </div> of admin-container, but after other sections -->
<ProjectRequestsManager />
```

**Testing:**
- Go to `/admin` page
- Should see "Project Requests" section
- Should show "No project requests yet" initially

### 3. ✅ Add Public Link to Request Form
**Files to update:** Homepage, nav menu, footer, or any CTA button

**Example 1: Replace existing "Order" button**
```astro
<!-- OLD -->
<a href="/buy" class="btn btn-primary">Buy Now</a>

<!-- NEW -->
<a href="/request-project" class="btn btn-primary">Request a Project</a>
```

**Example 2: Add to navigation menu**
```astro
<nav>
  <a href="/portfolio">Portfolio</a>
  <a href="/services">Services</a>
  <a href="/request-project">Request Project</a>
  <a href="/contact">Contact</a>
</nav>
```

**Example 3: Add in hero section**
```html
<section class="hero">
  <h1>Let's Create Something Amazing</h1>
  <p>Have a project in mind?</p>
  <a href="/request-project" class="cta-button">Request a Project</a>
</section>
```

### 4. ✅ Update Fiverr URL in Admin Component
**File:** `src/components/ProjectRequestsManager.astro` (line ~230)

Find:
```javascript
const fiverUrl = 'https://www.fiverr.com/nikhilsingh'; // Replace with your actual Fiverr URL
```

Replace `nikhilsingh` with your actual Fiverr username:
```javascript
const fiverUrl = 'https://www.fiverr.com/YOUR_FIVERR_USERNAME';
```

### 5. ✅ (Optional) Set Up Email Notifications
**If you want to receive email when new requests arrive:**

In `/src/pages/api/requests/index.ts`, after the database insert (around line 70):

```typescript
// Add Resend notification (optional)
try {
  const { Resend } = await import('resend');
  const resend = new Resend(import.meta.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'noreply@nikhilsingh.com', // Change to your domain
    to: 'nikhil.as.rajpoot@gmail.com', // Your email
    subject: `New Project Request: ${name}`,
    html: `
      <h2>New Project Request</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Type:</strong> ${project_type}</p>
      <p><strong>Budget:</strong> ${budget_range}</p>
      <p><strong>Description:</strong></p>
      <p>${description}</p>
      <p><a href="https://yoursite.com/admin">Review in Dashboard</a></p>
    `
  });
} catch (emailError) {
  console.error('Failed to send notification email:', emailError);
  // Don't throw - let the request succeed even if email fails
}
```

Then add to `.env.local`:
```
RESEND_API_KEY=your_resend_api_key_here
```

## Testing Checklist

### Test 1: Public Form Submission
- [ ] Navigate to `/request-project`
- [ ] Form loads without errors
- [ ] Fill in all required fields:
  - Name: "Test User"
  - Email: "test@example.com"
  - Project Type: "Animation"
  - Budget: "$1,000-$2,500"
  - Deadline: (leave blank or set)
  - Description: "Test project description"
- [ ] Click "Submit Project Request"
- [ ] See success screen with confirmation
- [ ] Check Supabase → project_requests table
- [ ] Verify row exists with correct data

### Test 2: Admin Dashboard Access
- [ ] Log into `/admin`
- [ ] See "Project Requests" section
- [ ] See the test request from Test 1
- [ ] Request shows correct info (name, email, type, budget)
- [ ] Status badge shows "pending" (orange)

### Test 3: Accept Request Flow
- [ ] Click "Accept" button on test request
- [ ] Confirm dialog appears
- [ ] Click "Accept" in dialog
- [ ] Alert shows "Request accepted!"
- [ ] Request card updates:
  - Status badge → "accepted" (green)
  - Action buttons change
- [ ] Refresh page
- [ ] Status persists as "accepted"

### Test 4: View Full Details (After Accept)
- [ ] Click "View Full Details" on accepted request
- [ ] Modal opens showing:
  - Client info (name, email)
  - Project details (type, budget, deadline, description)
  - Green acceptance message with Fiverr URL
- [ ] Fiverr URL is correct (YOUR username, not example)
- [ ] Close modal

### Test 5: Reject Request Flow
- [ ] Submit new test request (create another)
- [ ] Go to admin dashboard
- [ ] See new request with "pending" status
- [ ] Click "Reject" button
- [ ] Modal appears: "Reject Project Request"
- [ ] Enter rejection reason: "Outside my current capacity"
- [ ] Click "Reject Request"
- [ ] Alert shows "Request rejected."
- [ ] Request card updates:
  - Status badge → "rejected" (red)
  - No action buttons
- [ ] Refresh page
- [ ] Status and reason persist

### Test 6: Form Validation
- [ ] Try submitting empty form
- [ ] Error shows: "Missing required fields"
- [ ] Try invalid email: "test@"
- [ ] Error shows: "Invalid email address"
- [ ] Try unknown project type (hack form)
- [ ] Error shows: "Invalid project type"

### Test 7: Success Message Copy
- [ ] Submit form
- [ ] Success screen shows:
  - ✓ icon
  - "Request Received!" heading
  - "I've received your project request..." text
  - Email address display
  - Next steps information

### Test 8: Mobile Responsiveness
- [ ] View form on mobile (iPhone size)
- [ ] Form fields stack vertically
- [ ] Submit button is full width
- [ ] Text is readable (not tiny)
- [ ] Success screen is centered
- [ ] Admin modals are responsive

## Pre-Launch Checklist

### Content & Copy
- [ ] Fiverr URL is YOUR actual profile (not placeholder)
- [ ] Email address in notifications is YOUR email
- [ ] Trust messaging resonates with your brand
- [ ] Project types match what you offer
- [ ] Budget ranges make sense for your work

### Navigation & Discovery
- [ ] "Request a Project" link is visible on homepage
- [ ] Link appears in nav menu or footer
- [ ] All existing "Buy Now" buttons updated
- [ ] Link works on all pages

### Admin Dashboard
- [ ] You can successfully log in
- [ ] You can see the Project Requests section
- [ ] Accept/reject buttons work
- [ ] Modals display correctly
- [ ] You understand the workflow

### Error Handling
- [ ] Form shows helpful errors (not technical)
- [ ] Admin modals close properly
- [ ] Page doesn't break with edge cases
- [ ] Console has no unhandled errors

### Accessibility & Trust
- [ ] Trust message is visible and clear
- [ ] No dark patterns or urgency language
- [ ] Form labels are clear
- [ ] Helper text explains optional fields
- [ ] Success confirmation is reassuring

## Deployment Steps

### Step 1: Run Database Migration
```sql
-- In Supabase SQL Editor:
-- Copy contents of project-requests-schema.sql and run
```

### Step 2: Deploy Code Changes
```bash
# Commit all changes
git add .
git commit -m "feat: add Fiverr-only project request intake system"

# Deploy (depends on your host)
# Vercel: Auto-deploys from git push
# Manual: npm run build && upload dist/
```

### Step 3: Update Environment Variables (if email setup)
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Step 4: Post-Launch Tasks
- [ ] Monitor admin dashboard for new requests
- [ ] Respond to requests within 24 hours
- [ ] Test email notifications if enabled
- [ ] Gather feedback from early submissions

## Troubleshooting

### Issue: "Supabase client not initialized"
**Solution:**
- Check `.env.local` has:
  - `PUBLIC_SUPABASE_URL=...`
  - `PUBLIC_SUPABASE_ANON_KEY=...`
- Restart dev server: `npm run dev`

### Issue: Form submits but doesn't show success
**Solution:**
- Check browser console (F12) for errors
- Verify API endpoint: `POST /api/requests`
- Check Supabase project_requests table exists
- Try in browser incognito mode

### Issue: Admin can't see requests
**Solution:**
- Verify admin is logged in
- Check `profiles.is_admin = true` in database
- Check email matches admin email list (if using email-based)
- Try logging out and back in

### Issue: Fiverr URL not showing in acceptance modal
**Solution:**
- Check ProjectRequestsManager.astro line ~230
- Verify URL is correct: `https://www.fiverr.com/YOUR_USERNAME`
- No spaces or typos
- Refresh page in admin

### Issue: Database errors in console
**Solution:**
- Check RLS (Row Level Security) policies
- Verify Supabase anon key has correct permissions
- Check if project_requests table was created properly
- Try re-running SQL migration

## Long-Term Maintenance

### Weekly
- [ ] Check admin dashboard for requests
- [ ] Respond to requests
- [ ] Accept/reject within 2-3 days promise

### Monthly
- [ ] Review request data in Supabase
- [ ] Look for patterns:
  - Most common project types?
  - Average budget ranges?
  - Common rejection reasons?
- [ ] Adjust messaging/offerings based on patterns

### Quarterly
- [ ] Review system performance
- [ ] Consider adding features:
  - Email notifications
  - Request status page for clients
  - Custom pricing per type
  - Revision tracking

## Success Metrics to Track

After launch, monitor:
- **Request Volume:** How many per week?
- **Acceptance Rate:** What % do you accept?
- **Conversion Rate:** What % convert to Fiverr orders?
- **Average Budget:** Do requests match your pricing?
- **Time to Response:** How fast do you review?

This data helps you optimize over time.

---

## Quick Reference

**Public Form:**
`/request-project`

**Admin Dashboard:**
`/admin` (protected - requires login)

**API Endpoints:**
- `POST /api/requests` (public)
- `GET /api/requests/admin/list` (admin)
- `POST /api/requests/admin/accept` (admin)
- `POST /api/requests/admin/reject` (admin)

**Database:**
`project_requests` table in Supabase

**Key Files:**
- `src/pages/request-project.astro` (form page)
- `src/components/ProjectRequestsManager.astro` (admin UI)
- `src/pages/api/requests/index.ts` (form submission)
- `src/pages/api/requests/admin/*.ts` (admin endpoints)
- `project-requests-schema.sql` (database setup)

---

**Ready to launch? Go through the checklist and test thoroughly!**

Questions? Refer to `PROJECT_REQUEST_SYSTEM_GUIDE.md` for full documentation.
