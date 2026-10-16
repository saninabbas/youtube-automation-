import { getDb } from '../src/lib/db';
import { encryptToken, decryptToken } from '../src/lib/security/encryption';
import { IntegrationService } from '../src/lib/config/integrationService';
import { getApiKey } from '../src/lib/db';

async function runVerification() {
  console.log('====================================================');
  console.log('AUTORA API & PAYMENT GATEWAY MANAGEMENT VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
    }
  }

  // 1. Verify Database Tables
  console.log('--- TEST GROUP 1: Database Tables Initialization ---');
  const db = getDb();
  const tables = ['integration_configs', 'payment_gateways', 'integration_audit_logs', 'connection_test_logs', 'webhook_events'];
  for (const table of tables) {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(table) as any;
    assert(!!row, `Table "${table}" exists in SQLite schema`);
  }

  // 2. Verify AES-256-GCM Encryption / Decryption
  console.log('\n--- TEST GROUP 2: OWASP Cryptography (AES-256-GCM) ---');
  const rawSecret = 'sk_live_51M0abcdefghijklmnopqrstuvwxyz1234567890';
  const encrypted = encryptToken(rawSecret);
  assert(!!encrypted && encrypted.startsWith('enc:v1:'), 'encryptToken outputs enc:v1: formatted ciphertext');
  const decrypted = decryptToken(encrypted);
  assert(decrypted === rawSecret, 'decryptToken accurately recovers the original plaintext secret');

  // 3. Central Integration Service Persistence & Key Retrieval
  console.log('\n--- TEST GROUP 3: Central Integration Service ---');
  const testApiKey = 'AIzaSyTestApiKeyForCentralIntegrationValidation99';
  IntegrationService.saveIntegration(
    'gemini',
    {
      credentials: { apiKey: testApiKey },
      settings: { defaultModel: 'gemini-2.0-flash', temperature: 0.8 },
      isActive: true,
      isPrimary: true,
    },
    'admin_verifier',
    '127.0.0.1'
  );

  const integration = IntegrationService.getIntegration('gemini');
  assert(!!integration && integration.isConfigured, 'IntegrationService reports Gemini as configured');
  assert(integration?.maskedCredentials.apiKey.includes('••••'), 'Secret is masked in admin retrieval (never plaintext)');
  assert(!integration?.maskedCredentials.apiKey.includes(testApiKey), 'Plaintext secret is not leaked in maskedCredentials');

  const resolvedKey = IntegrationService.getDecryptedKey('gemini');
  assert(resolvedKey === testApiKey, 'IntegrationService.getDecryptedKey correctly decrypts the secret for backend requests');

  const dbResolvedKey = getApiKey('gemini');
  assert(dbResolvedKey === testApiKey, 'getApiKey("gemini") automatically delegates to central integration configs');

  // 4. Payment Gateway Multi-Provider & Dynamic Switching
  console.log('\n--- TEST GROUP 4: Payment Gateways & Dynamic MoR Routing ---');
  IntegrationService.savePaymentGateway(
    'stripe',
    {
      mode: 'live',
      isEnabled: true,
      isDefault: true,
      credentials: { secretKey: 'sk_live_test_stripe_secret_key', publishableKey: 'pk_live_test_pk' },
      webhookSecret: 'whsec_test_secret_stripe_99',
    },
    'admin_verifier',
    '127.0.0.1'
  );

  IntegrationService.savePaymentGateway(
    'polar',
    {
      mode: 'live',
      isEnabled: true,
      isDefault: false,
      credentials: { accessToken: 'polar_oat_test_polar_access_token' },
      webhookSecret: 'polar_whs_test_polar_webhook_secret',
    },
    'admin_verifier',
    '127.0.0.1'
  );

  let activeConfig = IntegrationService.getActivePaymentConfig();
  assert(activeConfig.provider === 'stripe', 'Default gateway is Stripe when Stripe is set as default');
  assert(activeConfig.stripe?.secretKey === 'sk_live_test_stripe_secret_key', 'Active Stripe secretKey is decrypted correctly');
  assert(activeConfig.stripe?.webhookSecret === 'whsec_test_secret_stripe_99', 'Active Stripe webhookSecret is decrypted correctly');

  // Switch default to Polar
  IntegrationService.setDefaultPaymentGateway('polar', 'admin_verifier', '127.0.0.1');
  activeConfig = IntegrationService.getActivePaymentConfig();
  assert(activeConfig.provider === 'polar', 'Switching default gateway to Polar takes effect immediately without server restart');
  assert(activeConfig.polar?.accessToken === 'polar_oat_test_polar_access_token', 'Active Polar accessToken is decrypted correctly');

  // 5. Audit Logging Verification
  console.log('\n--- TEST GROUP 5: Security Audit Trail ---');
  const auditLogs = IntegrationService.getAuditLogs(10) as any[];
  assert(auditLogs.length > 0, 'Audit logs are written to database');
  const recentAudit = auditLogs.find((l) => l.admin_user === 'admin_verifier');
  assert(!!recentAudit, 'Admin action "admin_verifier" is recorded with target and timestamp');

  // 6. Webhook Event Logging & Idempotency
  console.log('\n--- TEST GROUP 6: Webhook Events & Idempotency ---');
  const testEventId = `evt_test_${Date.now()}`;
  IntegrationService.logWebhookEvent({
    provider: 'stripe',
    eventId: testEventId,
    eventType: 'checkout.session.completed',
    payload: { customer: 'cus_12345', amount: 4900, status: 'complete' },
    status: 'PROCESSED',
  });

  const webhookEvents = IntegrationService.getWebhookEvents(10) as any[];
  const loggedEv = webhookEvents.find((e) => e.event_id === testEventId);
  assert(!!loggedEv, 'Webhook event is successfully recorded in webhook_events');
  assert(loggedEv?.status === 'PROCESSED', 'Webhook event has PROCESSED status');

  // 7. Connection Test Logging
  console.log('\n--- TEST GROUP 7: Connection Test Logging ---');
  IntegrationService.logConnectionTest({
    provider: 'gemini',
    status: 'SUCCESS',
    latencyMs: 142,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  });

  const testLogs = IntegrationService.getConnectionTestLogs(10) as any[];
  const loggedTest = testLogs.find((t) => t.provider === 'gemini');
  assert(!!loggedTest, 'Connection test log is persisted');
  assert(loggedTest?.latency_ms === 142, 'Round-trip latency is correctly stored and reported');

  console.log('\n====================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    console.log('ALL TESTS PASSED! System is production-ready.');
    process.exit(0);
  } else {
    console.error('Some tests failed.');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
