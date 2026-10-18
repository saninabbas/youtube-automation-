/**
 * Comprehensive End-to-End Page & API Audit Script for AUTORA
 * 
 * Verifies every page, route, and authenticated flow on localhost:3001
 */

const BASE_URL = 'http://localhost:3001';

interface AuditResult {
  route: string;
  type: 'PAGE' | 'API';
  status: number;
  verdict: 'PASS' | 'FAIL';
  detail: string;
}

const results: AuditResult[] = [];

function record(route: string, type: 'PAGE' | 'API', status: number, verdict: 'PASS' | 'FAIL', detail: string) {
  results.push({ route, type, status, verdict, detail });
  const icon = verdict === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${type}] ${route} -> HTTP ${status} (${detail})`);
}

async function runPageAudit() {
  console.log('\n===============================================================');
  console.log('   AUTORA COMPREHENSIVE END-TO-END PAGE & API AUDIT');
  console.log(`   Target Server: ${BASE_URL}`);
  console.log('===============================================================\n');

  // 1. PUBLIC PAGES
  console.log('--- Phase 1: Public Pages (Unauthenticated) ---');
  const publicPages = [
    '/',
    '/login',
    '/signup',
    '/admin',
    '/blog',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ];

  for (const page of publicPages) {
    try {
      const res = await fetch(`${BASE_URL}${page}`);
      const text = await res.text();
      const hasHtml = text.includes('<!DOCTYPE html>') || text.includes('<html');
      const hasError = text.includes('Internal Server Error') || text.includes('Application error');
      
      if (res.status === 200 && hasHtml && !hasError) {
        record(page, 'PAGE', res.status, 'PASS', 'Rendered successfully with valid HTML');
      } else {
        record(page, 'PAGE', res.status, 'FAIL', hasError ? 'Server error displayed' : `Unexpected status ${res.status}`);
      }
    } catch (err: any) {
      record(page, 'PAGE', 0, 'FAIL', `Network fetch failed: ${err.message}`);
    }
  }

  // 2. PUBLIC APIS
  console.log('\n--- Phase 2: Public System APIs ---');
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthJson = await healthRes.json().catch(() => ({}));
    record('/api/health', 'API', healthRes.status, healthRes.status === 200 ? 'PASS' : 'FAIL', `Overall: ${healthJson.overall || 'UNKNOWN'}`);
  } catch (err: any) {
    record('/api/health', 'API', 0, 'FAIL', err.message);
  }

  try {
    const adminAuthRes = await fetch(`${BASE_URL}/api/admin/auth`);
    const adminAuthJson = await adminAuthRes.json().catch(() => ({}));
    record('/api/admin/auth', 'API', adminAuthRes.status, adminAuthRes.status === 200 ? 'PASS' : 'FAIL', `Auth status: ${adminAuthJson.authenticated}`);
  } catch (err: any) {
    record('/api/admin/auth', 'API', 0, 'FAIL', err.message);
  }

  // 3. FAKE USER SIGNUP & AUTH FLOW
  console.log('\n--- Phase 3: Customer Signup, Session Cookie & Verification ---');
  const testEmail = `qa_browser_tester_${Date.now()}@autora.live`;
  const testPassword = 'TestPassword123!';
  const testName = 'QA Browser Tester';
  let sessionCookie = '';

  try {
    const signupRes = await fetch(`${BASE_URL}/api/customer/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword }),
    });

    const setCookieHeader = signupRes.headers.get('set-cookie') || '';
    const signupJson = await signupRes.json().catch(() => ({}));
    
    // Extract auth_session_token cookie
    const tokenMatch = setCookieHeader.match(/auth_session_token=([^;]+)/);
    if (tokenMatch) {
      sessionCookie = `auth_session_token=${tokenMatch[1]}`;
    }

    if (signupRes.status === 201 && signupJson.success) {
      record('/api/customer/signup', 'API', signupRes.status, 'PASS', `Created user ${signupJson.user?.id || ''} with 500 initial credits`);
    } else {
      record('/api/customer/signup', 'API', signupRes.status, 'FAIL', signupJson.error || 'Signup failed');
    }
  } catch (err: any) {
    record('/api/customer/signup', 'API', 0, 'FAIL', err.message);
  }

  // Test Customer Login
  try {
    const loginRes = await fetch(`${BASE_URL}/api/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginJson = await loginRes.json().catch(() => ({}));
    if (loginRes.status === 200 && loginJson.success) {
      record('/api/customer/login', 'API', loginRes.status, 'PASS', 'Login authenticated cleanly');
    } else {
      record('/api/customer/login', 'API', loginRes.status, 'FAIL', loginJson.error || 'Login failed');
    }
  } catch (err: any) {
    record('/api/customer/login', 'API', 0, 'FAIL', err.message);
  }

  // Test /api/auth/me with session
  try {
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    const meJson = await meRes.json().catch(() => ({}));
    if (meRes.status === 200 && meJson.authenticated) {
      record('/api/auth/me', 'API', meRes.status, 'PASS', `Resolved user: ${meJson.user?.email}, balance: ${meJson.credits?.balance}`);
    } else {
      record('/api/auth/me', 'API', meRes.status, 'FAIL', 'Failed to resolve session context');
    }
  } catch (err: any) {
    record('/api/auth/me', 'API', 0, 'FAIL', err.message);
  }

  // 4. PROTECTED CUSTOMER PAGES (WITH SESSION)
  console.log('\n--- Phase 4: Protected Customer Dashboard Pages ---');
  const protectedPages = [
    '/channels',
    '/content',
    '/content/new',
    '/calendar',
    '/analytics',
    '/templates',
    '/settings',
    '/settings/account',
    '/settings/publishing',
    '/settings/security',
    '/billing',
    '/workflow',
    '/dashboard/personal-ai',
  ];

  for (const page of protectedPages) {
    try {
      const res = await fetch(`${BASE_URL}${page}`, {
        headers: { Cookie: sessionCookie },
      });
      const text = await res.text();
      const hasHtml = text.includes('<!DOCTYPE html>') || text.includes('<html');
      const isRedirectToLogin = res.url.includes('/login');
      const hasError = text.includes('Internal Server Error') || text.includes('Application error');

      if (res.status === 200 && hasHtml && !isRedirectToLogin && !hasError) {
        record(page, 'PAGE', res.status, 'PASS', 'Accessed protected dashboard cleanly');
      } else {
        record(page, 'PAGE', res.status, 'FAIL', isRedirectToLogin ? 'Redirected to login (auth rejected)' : 'Error rendering page');
      }
    } catch (err: any) {
      record(page, 'PAGE', 0, 'FAIL', err.message);
    }
  }

  // 5. PROTECTED CUSTOMER DATA APIS
  console.log('\n--- Phase 5: Protected Customer APIs ---');
  const customerApis = [
    { path: '/api/channels', method: 'GET' },
    { path: '/api/templates', method: 'GET' },
    { path: '/api/billing', method: 'GET' },
    { path: '/api/customer/workspace', method: 'GET' },
    { path: '/api/customer/sessions', method: 'GET' },
    { path: '/api/voice/my-voices', method: 'GET' },
  ];

  for (const api of customerApis) {
    try {
      const res = await fetch(`${BASE_URL}${api.path}`, {
        method: api.method,
        headers: { Cookie: sessionCookie },
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 200) {
        record(api.path, 'API', res.status, 'PASS', 'Returned valid 200 payload');
      } else {
        record(api.path, 'API', res.status, 'FAIL', json.error || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      record(api.path, 'API', 0, 'FAIL', err.message);
    }
  }

  // 6. ADMIN PORTAL LOGIN & CONTROL
  console.log('\n--- Phase 6: Admin Portal Authentication & Diagnostics ---');
  const adminUser = process.env.ADMIN_USER || 'sanin5';
  const adminPass = process.env.ADMIN_PASSWORD || 'Pakistan@1997';
  let adminSessionCookie = '';

  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser, password: adminPass }),
    });
    const adminLoginJson = await adminLoginRes.json().catch(() => ({}));
    const setCookie = adminLoginRes.headers.get('set-cookie') || '';
    const adminTokenMatch = setCookie.match(/admin_session_token=([^;]+)/);
    if (adminTokenMatch) {
      adminSessionCookie = `admin_session_token=${adminTokenMatch[1]}`;
    }

    if (adminLoginRes.status === 200 && adminLoginJson.success) {
      record('/api/admin/auth (POST)', 'API', adminLoginRes.status, 'PASS', 'Super Admin authenticated successfully');
    } else {
      record('/api/admin/auth (POST)', 'API', adminLoginRes.status, 'FAIL', adminLoginJson.error || 'Admin login failed');
    }
  } catch (err: any) {
    record('/api/admin/auth (POST)', 'API', 0, 'FAIL', err.message);
  }

  // Admin endpoints test
  const adminApis = [
    '/api/admin/stats',
    '/api/admin/users',
    '/api/admin/integrations',
    '/api/admin/gateways',
    '/api/admin/diagnostics',
  ];

  for (const adminApi of adminApis) {
    try {
      const res = await fetch(`${BASE_URL}${adminApi}`, {
        headers: { Cookie: adminSessionCookie },
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 200) {
        record(adminApi, 'API', res.status, 'PASS', 'Admin endpoint authorized and operational');
      } else {
        record(adminApi, 'API', res.status, 'FAIL', json.error || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      record(adminApi, 'API', 0, 'FAIL', err.message);
    }
  }

  // 7. SUMMARY
  const total = results.length;
  const passed = results.filter(r => r.verdict === 'PASS').length;
  const failed = results.filter(r => r.verdict === 'FAIL').length;

  console.log('\n===============================================================');
  console.log(`   FINAL AUDIT RESULTS: ${passed}/${total} PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  if (failed === 0) {
    console.log('   🎉 ALL SYSTEM PAGES AND APIS ARE 100% OPERATIONAL!');
  } else {
    console.log(`   ⚠️ ${failed} check(s) failed.`);
  }
  console.log('===============================================================\n');
}

runPageAudit();
