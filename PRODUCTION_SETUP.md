# Production Setup - Snooze Lane Website

## ✅ Current Status

### Deployed Components
- **Website**: https://snoozelaneapp.com (Cloudflare Pages)
- **Forms Worker**: https://snooze-lane-forms.elombe.workers.dev (Cloudflare Worker)
- **GitHub Repo**: https://github.com/SWFTstudios/snooze-lane-website

### Form Endpoints
- **Waitlist Form**: `https://snooze-lane-forms.elombe.workers.dev/waitlist`
- **Contact Form**: `https://snooze-lane-forms.elombe.workers.dev/contact`

## 🔧 Configuration

### Cloudflare Worker Environment Variables
Set in: Cloudflare Dashboard → Workers & Pages → snooze-lane-forms → Settings → Variables

- ✅ `AIRTABLE_ACCESS_TOKEN` (Secret)
- ✅ `AIRTABLE_BASE_ID` (Text): `appYT7C2POhuNDsDs`
- ✅ `RESEND_API_KEY` (Secret)

### Airtable Tables
- ✅ **Waitlist Signups** - Stores waitlist submissions
- ✅ **General Inquiries** - Stores contact form submissions

### Resend Configuration
- ✅ Domain verified: `snoozelaneapp.com`
- ✅ Email sending from: `hello@snoozelaneapp.com`
- ✅ Admin notifications to: `elombe@swftstudios.com`

## 📧 Email Features

### Waitlist Emails
- **First 100 signups**: Receive premium coupon code (SNOOZE100-XXXX) via Resend
- **After 100**: Receive thank you message via Resend
- **Email tracking**: View all sent emails in [Resend Dashboard](https://resend.com/emails)

### Contact Form Emails
- **User**: Receives confirmation (if implemented)
- **Admin**: Receives notification at `elombe@swftstudios.com` via Resend

## 🚀 Monitoring & Management

### View Sent Emails
1. Go to [Resend Dashboard → Emails](https://resend.com/emails)
2. See all sent emails with status (sent, delivered, opened, clicked, bounced)
3. View email preview, HTML, and plain text versions
4. Check email events and logs

### Monitor Form Submissions
1. Check Airtable tables for new records
2. View Cloudflare Worker logs: Dashboard → Workers & Pages → snooze-lane-forms → Logs
3. Check Resend email delivery status

### Troubleshooting
- **Emails not sending**: Check Resend API key in Worker settings
- **Forms not working**: Check Worker logs for errors
- **Airtable errors**: Verify table/field names match exactly

## 📝 Production Checklist

- [x] Worker deployed and accessible
- [x] Forms updated to use Worker endpoints
- [x] Environment variables configured
- [x] Airtable tables created
- [x] Resend domain verified
- [x] Email templates configured
- [x] Google Analytics integrated
- [x] Website deployed to Cloudflare Pages

## 🔄 Updates & Maintenance

### To Update the Worker
```bash
cd worker
npm run deploy
```

### To Update Website
- Push changes to GitHub
- Cloudflare Pages auto-deploys from `main` branch

### To View Email Analytics
- Visit [Resend Dashboard](https://resend.com/emails)
- See delivery rates, opens, clicks, bounces
- Export email data if needed

## 📊 Email Management Features

According to [Resend documentation](https://resend.com/docs/dashboard/emails/introduction):

- **View email details**: Preview, HTML, and plain text versions
- **Email events**: Track sent, delivered, opened, clicked, bounced, complained
- **Share emails**: Generate 48-hour shareable links
- **View logs**: See all logs associated with each email
- **Export data**: Download email data in CSV format (admin only)

## 🎯 Next Steps

1. Test both forms on production website
2. Monitor Resend dashboard for email delivery
3. Check Airtable for form submissions
4. Set up email monitoring/alerts if needed

