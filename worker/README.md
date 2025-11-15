# Snooze Lane Forms Worker

Cloudflare Worker for handling waitlist and contact form submissions for Snooze Lane.

## Features

- ✅ Waitlist form handling with Airtable integration
- ✅ Contact form handling with Airtable integration
- ✅ Resend email integration for automated emails
- ✅ Premium coupon code generation for first 100 signups
- ✅ Duplicate email prevention
- ✅ Signup count tracking

## Setup

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Configure Environment Variables

Set these in Cloudflare Dashboard → Workers & Pages → snooze-lane-forms → Settings → Variables:

- `AIRTABLE_ACCESS_TOKEN` (Secret) - Your Airtable Personal Access Token
- `AIRTABLE_BASE_ID` (Text) - Your Airtable Base ID (`appYT7C2POhuNDsDs`)
- `RESEND_API_KEY` (Secret) - Your Resend API key

### 3. Deploy

```bash
npm run deploy:production
```

Or use Wrangler CLI:

```bash
wrangler deploy --env production
```

## Endpoints

### POST `/waitlist`
Handles waitlist form submissions.

**Form Field:** `Waitlist-Member-Email`

**Response:** HTML redirect page

### POST `/contact`
Handles contact form submissions.

**Form Fields:** `Name`, `Email`, `Message`

**Response:** HTML redirect page

## Usage

Update your HTML forms to point to the worker:

```html
<!-- Waitlist form -->
<form action="https://snooze-lane-forms.YOUR_SUBDOMAIN.workers.dev/waitlist" method="post">
  <input type="email" name="Waitlist-Member-Email" required>
  <button type="submit">Join Waitlist</button>
</form>

<!-- Contact form -->
<form action="https://snooze-lane-forms.YOUR_SUBDOMAIN.workers.dev/contact" method="post">
  <input type="text" name="Name" required>
  <input type="email" name="Email" required>
  <textarea name="Message" required></textarea>
  <button type="submit">Send Message</button>
</form>
```

## Development

Run locally:

```bash
npm run dev
```

This will start a local development server with hot reload.

## Environment Variables

All environment variables should be set in Cloudflare Dashboard, not in `wrangler.toml` for security.

## Notes

- The worker handles CORS automatically
- Email sending failures don't block form submission
- Duplicate email submissions are prevented
- Signup numbers are auto-calculated based on existing records

