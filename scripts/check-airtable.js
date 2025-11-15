/**
 * Airtable Setup Checker
 * Run with: node scripts/check-airtable.js
 * 
 * This script checks if your Airtable tables exist and have the correct fields
 */

// Get credentials from environment variables
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appYT7C2POhuNDsDs';
const AIRTABLE_ACCESS_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN;

if (!AIRTABLE_ACCESS_TOKEN) {
  console.error('❌ Error: AIRTABLE_ACCESS_TOKEN environment variable is required');
  console.log('   Set it with: export AIRTABLE_ACCESS_TOKEN="your-token"');
  process.exit(1);
}

const EXPECTED_TABLES = {
  'Waitlist Signups': ['Email', 'Signup Number', 'Premium Eligible', 'Coupon Code', 'Date Signed Up'],
  'General Inquiries': ['Name', 'Email', 'Message', 'Date Submitted']
};

async function checkTable(tableName) {
  console.log(`\n📋 Checking: "${tableName}"`);
  
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?maxRecords=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log(`   ✅ Table exists and is accessible`);
      return true;
    } else if (response.status === 404) {
      console.log(`   ❌ Table does NOT exist`);
      console.log(`\n   📝 Create it in Airtable with these fields:`);
      EXPECTED_TABLES[tableName].forEach(field => {
        console.log(`      - ${field}`);
      });
      return false;
    } else {
      const error = await response.json();
      console.log(`   ⚠️  Error: ${JSON.stringify(error)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Checking Airtable Setup...\n');
  console.log(`Base ID: ${AIRTABLE_BASE_ID}\n`);
  
  const results = {};
  for (const tableName of Object.keys(EXPECTED_TABLES)) {
    results[tableName] = await checkTable(tableName);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Summary:');
  Object.entries(results).forEach(([table, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${table}`);
  });
  
  const allExist = Object.values(results).every(r => r);
  if (allExist) {
    console.log('\n✨ All tables exist! Your setup looks good.');
  } else {
    console.log('\n⚠️  Some tables are missing. Please create them in Airtable.');
    console.log('\n📚 Quick Setup Guide:');
    console.log('   1. Go to: https://airtable.com/' + AIRTABLE_BASE_ID);
    console.log('   2. For each missing table:');
    console.log('      - Click "+ Add a table"');
    console.log('      - Name it exactly as shown above');
    console.log('      - Add the fields listed');
    console.log('   3. Field types:');
    console.log('      - Email → Email field');
    console.log('      - Name, Message, Coupon Code → Text fields');
    console.log('      - Signup Number → Number field');
    console.log('      - Premium Eligible → Checkbox');
    console.log('      - Date Signed Up, Date Submitted → Date field');
  }
}

main().catch(console.error);

