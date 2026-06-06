#!/usr/bin/env node
// scripts/test-connection.js — Quick DB connectivity probe.
//
// Usage: npm run db:test
//
// Confirms DATABASE_URL connects, then lists public tables so you can verify a
// manual Supabase SQL Editor apply landed. Prints redacted URL + full error
// detail (code/detail/hint) on failure.

'use strict';

require('dotenv').config();

const { Client } = require('pg');

function redactedUrl(url) {
  if (!url) return '(undefined)';
  // Hide the password between the first ':' after the user and the host '@'.
  return url.replace(/^([a-zA-Z][\w+.-]*:\/\/[^:/]+:).+(@[^@/]+\/)/, '$1***$2');
}

async function main() {
  const url = process.env.DATABASE_URL;
  console.log('DATABASE_URL:', redactedUrl(url));

  if (!url) {
    console.error('FATAL: DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  console.log('Connecting...');

  try {
    await client.connect();
    const { rows } = await client.query(
      'SELECT current_database() AS db, current_user AS usr',
    );
    console.log('Connected:', rows[0]);

    const { rows: tables } = await client.query(
      "SELECT table_name FROM information_schema.tables " +
        "WHERE table_schema = 'public' ORDER BY table_name",
    );
    console.log('public tables:', tables.map((r) => r.table_name).join(', ') || '(none)');
    console.log('\nOK — connection works.');
  } catch (err) {
    console.error('\nConnection FAILED:');
    for (const k of ['message', 'code', 'detail', 'hint', 'address', 'port']) {
      if (err[k]) console.error(`  ${k}: ${err[k]}`);
    }
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
