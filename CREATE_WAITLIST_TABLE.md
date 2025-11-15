# Create "Waitlist Signups" Table - Step by Step

## The Problem
Your "Waitlist Signups" table is missing, which is why the waitlist form is failing.

## Solution: Create the Table Manually

### Step 1: Open Your Airtable Base
Go to: https://airtable.com/appYT7C2POhuNDsDs

### Step 2: Create New Table
1. Click the **"+"** button next to your existing tables (or click **"+ Add a table"**)
2. Name it exactly: **`Waitlist Signups`** (case-sensitive, with a space)

### Step 3: Add Fields

Delete the default "Name" field if it exists, then add these fields **in order**:

#### Field 1: Email
- Click **"+ Add a field"**
- Name: `Email`
- Type: Select **"Email"**
- Check **"This field is required"**
- Click **"Create field"**

#### Field 2: Signup Number
- Click **"+ Add a field"**
- Name: `Signup Number`
- Type: Select **"Number"**
- Format: **Integer**
- Click **"Create field"**

#### Field 3: Premium Eligible
- Click **"+ Add a field"**
- Name: `Premium Eligible`
- Type: Select **"Checkbox"**
- Click **"Create field"**

#### Field 4: Coupon Code
- Click **"+ Add a field"**
- Name: `Coupon Code`
- Type: Select **"Single line text"**
- Click **"Create field"**

#### Field 5: Date Signed Up
- Click **"+ Add a field"**
- Name: `Date Signed Up`
- Type: Select **"Date"**
- Options: Check **"Include time"**
- Click **"Create field"**

### Step 4: Verify
Your table should now have exactly 5 fields:
1. Email (Email, Required)
2. Signup Number (Number)
3. Premium Eligible (Checkbox)
4. Coupon Code (Single line text)
5. Date Signed Up (Date with time)

### Step 5: Test
1. Run the check script: `node scripts/check-airtable.js`
2. It should now show ✅ for "Waitlist Signups"
3. Try submitting the waitlist form on your website

## Quick Reference

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| Email | Email | ✅ Yes | - |
| Signup Number | Number | No | Integer |
| Premium Eligible | Checkbox | No | - |
| Coupon Code | Single line text | No | - |
| Date Signed Up | Date | No | Include time |

## Important Notes
- ⚠️ Field names are **case-sensitive** - must match exactly
- ⚠️ Table name must be exactly **"Waitlist Signups"** (with space)
- The code will automatically populate all fields when forms are submitted
- "Signup Number" and "Coupon Code" are auto-generated
- "Premium Eligible" is automatically set to true for first 100 signups

