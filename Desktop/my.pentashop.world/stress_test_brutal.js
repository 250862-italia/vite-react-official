#!/usr/bin/env node

/**
 * 🧨 STRESS TEST BRUTAL - Distruggi il sistema
 * Simula utenti idioti, hacker, e condizioni estreme
 */

const axios = require('axios');
const fs = require('fs');

class BrutalStressTest {
  constructor() {
    this.results = {
      security: { critical: 0, high: 0, medium: 0, low: 0, issues: [] },
      performance: { critical: 0, high: 0, medium: 0, low: 0, issues: [] },
      logic: { critical: 0, high: 0, medium: 0, low: 0, issues: [] },
      ux: { critical: 0, high: 0, medium: 0, low: 0, issues: [] }
    };
    this.baseUrl = 'http://localhost:3000';
    this.frontendUrl = 'http://localhost:5173';
  }

  log(message, type = 'info') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      critical: '💥',
      hack: '🕵️',
      stress: '🔥'
    };
    console.log(`${emoji[type]} ${message}`);
  }

  // 🔥 TEST 1: SQL INJECTION ATTACKS
  async testSQLInjection() {
    this.log('🔥 TEST 1: SQL INJECTION ATTACKS', 'hack');
    
    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "1' OR '1' = '1' --",
      "'; INSERT INTO users VALUES ('hacker','hacked'); --"
    ];

    for (const payload of sqlPayloads) {
      try {
        // Test login con SQL injection
        const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
          username: payload,
          password: payload
        }, { timeout: 5000 });

        if (response.data.success) {
          this.log(`💥 CRITICAL: SQL Injection success with payload: ${payload}`, 'critical');
          this.results.security.critical++;
          this.results.security.issues.push({
            type: 'SQL_INJECTION',
            severity: 'CRITICAL',
            payload: payload,
            endpoint: '/api/auth/login'
          });
        }
      } catch (error) {
        // Se non risponde, potrebbe essere un segno di vulnerabilità
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          this.log(`⚠️ POTENTIAL: SQL Injection might have crashed server with: ${payload}`, 'warning');
          this.results.security.high++;
          this.results.security.issues.push({
            type: 'SQL_INJECTION_CRASH',
            severity: 'HIGH',
            payload: payload,
            endpoint: '/api/auth/login'
          });
        }
      }
    }
  }

  // 🔥 TEST 2: XSS ATTACKS
  async testXSSAttacks() {
    this.log('🔥 TEST 2: XSS ATTACKS', 'hack');
    
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>",
      "'><script>alert('XSS')</script>",
      "<iframe src=javascript:alert('XSS')>"
    ];

    for (const payload of xssPayloads) {
      try {
        // Test registrazione con XSS
        const response = await axios.post(`${this.baseUrl}/api/auth/register`, {
          username: payload,
          email: `${payload}@test.com`,
          password: 'test123',
          firstName: payload,
          lastName: payload
        }, { timeout: 5000 });

        if (response.data.success) {
          this.log(`💥 CRITICAL: XSS payload accepted: ${payload}`, 'critical');
          this.results.security.critical++;
          this.results.security.issues.push({
            type: 'XSS',
            severity: 'CRITICAL',
            payload: payload,
            endpoint: '/api/auth/register'
          });
        }
      } catch (error) {
        // Controlla se il payload è stato salvato
        if (error.response && error.response.status === 200) {
          this.log(`⚠️ HIGH: XSS payload might be stored: ${payload}`, 'warning');
          this.results.security.high++;
          this.results.security.issues.push({
            type: 'XSS_STORED',
            severity: 'HIGH',
            payload: payload,
            endpoint: '/api/auth/register'
          });
        }
      }
    }
  }

  // 🔥 TEST 3: AUTHENTICATION BYPASS
  async testAuthBypass() {
    this.log('🔥 TEST 3: AUTHENTICATION BYPASS', 'hack');
    
    const bypassTests = [
      { token: null, name: 'No Token' },
      { token: '', name: 'Empty Token' },
      { token: 'invalid-token', name: 'Invalid Token' },
      { token: 'Bearer fake-token', name: 'Fake Bearer Token' },
      { token: 'admin', name: 'Admin String' },
      { token: 'true', name: 'Boolean True' },
      { token: '1', name: 'Number One' }
    ];

    const protectedEndpoints = [
      '/api/admin/users',
      '/api/admin/tasks',
      '/api/admin/commission-plans',
      '/api/profile',
      '/api/admin/sales'
    ];

    for (const test of bypassTests) {
      for (const endpoint of protectedEndpoints) {
        try {
          const headers = test.token ? { 'Authorization': `Bearer ${test.token}` } : {};
          const response = await axios.get(`${this.baseUrl}${endpoint}`, { 
            headers,
            timeout: 5000 
          });

          if (response.status === 200) {
            this.log(`💥 CRITICAL: Auth bypass with ${test.name} on ${endpoint}`, 'critical');
            this.results.security.critical++;
            this.results.security.issues.push({
              type: 'AUTH_BYPASS',
              severity: 'CRITICAL',
              method: test.name,
              endpoint: endpoint
            });
          }
        } catch (error) {
          // Se non è 401/403, potrebbe essere un bypass
          if (error.response && error.response.status !== 401 && error.response.status !== 403) {
            this.log(`⚠️ HIGH: Potential auth bypass with ${test.name} on ${endpoint}`, 'warning');
            this.results.security.high++;
            this.results.security.issues.push({
              type: 'AUTH_BYPASS_POTENTIAL',
              severity: 'HIGH',
              method: test.name,
              endpoint: endpoint,
              status: error.response.status
            });
          }
        }
      }
    }
  }

  // 🔥 TEST 4: MALFORMED PAYLOADS
  async testMalformedPayloads() {
    this.log('🔥 TEST 4: MALFORMED PAYLOADS', 'stress');
    
    const malformedPayloads = [
      null,
      undefined,
      {},
      { username: null },
      { username: undefined },
      { username: '' },
      { username: 'a'.repeat(10000) }, // Buffer overflow attempt
      { username: 'test', password: 'a'.repeat(10000) },
      { username: 'test', email: 'invalid-email' },
      { username: 'test', email: 'test@' },
      { username: 'test', email: '@test.com' },
      { username: 'test', email: 'test@test' },
      { username: 'test', email: 'test@test.', password: '' },
      { username: 'test', email: 'test@test.com', password: '123' }, // Password troppo corta
      { username: 'test', email: 'test@test.com', password: 'a'.repeat(1000) }, // Password troppo lunga
      { username: 'test', email: 'test@test.com', password: 'password123', firstName: 'a'.repeat(1000) },
      { username: 'test', email: 'test@test.com', password: 'password123', phone: 'not-a-number' },
      { username: 'test', email: 'test@test.com', password: 'password123', level: 'not-a-number' },
      { username: 'test', email: 'test@test.com', password: 'password123', points: 'not-a-number' }
    ];

    for (let i = 0; i < malformedPayloads.length; i++) {
      const payload = malformedPayloads[i];
      try {
        const response = await axios.post(`${this.baseUrl}/api/auth/register`, payload, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
          this.log(`💥 CRITICAL: Malformed payload accepted: ${JSON.stringify(payload)}`, 'critical');
          this.results.security.critical++;
          this.results.security.issues.push({
            type: 'MALFORMED_PAYLOAD',
            severity: 'CRITICAL',
            payload: payload,
            endpoint: '/api/auth/register'
          });
        }
      } catch (error) {
        // Se il server crasha, è un problema critico
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          this.log(`💥 CRITICAL: Server crashed with malformed payload: ${JSON.stringify(payload)}`, 'critical');
          this.results.security.critical++;
          this.results.security.issues.push({
            type: 'SERVER_CRASH',
            severity: 'CRITICAL',
            payload: payload,
            endpoint: '/api/auth/register'
          });
        }
      }
    }
  }

  // 🔥 TEST 5: STRESS TEST - 1000 REQUESTS
  async testStressLoad() {
    this.log('🔥 TEST 5: STRESS TEST - 1000 REQUESTS', 'stress');
    
    const requests = [];
    const startTime = Date.now();
    
    // Crea 1000 richieste parallele
    for (let i = 0; i < 1000; i++) {
      requests.push(
        axios.get(`${this.baseUrl}/health`, { timeout: 10000 })
          .then(response => ({ success: true, status: response.status }))
          .catch(error => ({ success: false, error: error.message }))
      );
    }

    try {
      const results = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      this.log(`📊 Stress Test Results:`, 'info');
      this.log(`  ✅ Successful: ${successful}/1000`, 'success');
      this.log(`  ❌ Failed: ${failed}/1000`, 'error');
      this.log(`  ⏱️ Duration: ${duration}ms`, 'info');
      this.log(`  🚀 RPS: ${Math.round(1000 / (duration / 1000))}`, 'info');
      
      if (failed > 100) {
        this.log(`💥 CRITICAL: High failure rate under load: ${failed} failures`, 'critical');
        this.results.performance.critical++;
        this.results.performance.issues.push({
          type: 'STRESS_TEST_FAILURE',
          severity: 'CRITICAL',
          failed: failed,
          total: 1000,
          duration: duration
        });
      } else if (failed > 10) {
        this.log(`⚠️ HIGH: Moderate failure rate under load: ${failed} failures`, 'warning');
        this.results.performance.high++;
        this.results.performance.issues.push({
          type: 'STRESS_TEST_FAILURE',
          severity: 'HIGH',
          failed: failed,
          total: 1000,
          duration: duration
        });
      }
      
      if (duration > 30000) {
        this.log(`⚠️ HIGH: Slow response under load: ${duration}ms`, 'warning');
        this.results.performance.high++;
        this.results.performance.issues.push({
          type: 'STRESS_TEST_SLOW',
          severity: 'HIGH',
          duration: duration
        });
      }
      
    } catch (error) {
      this.log(`💥 CRITICAL: Stress test completely failed: ${error.message}`, 'critical');
      this.results.performance.critical++;
      this.results.performance.issues.push({
        type: 'STRESS_TEST_CRASH',
        severity: 'CRITICAL',
        error: error.message
      });
    }
  }

  // 🔥 TEST 6: CONCURRENT LOGINS
  async testConcurrentLogins() {
    this.log('🔥 TEST 6: CONCURRENT LOGINS', 'stress');
    
    const loginRequests = [];
    const credentials = { username: 'Gianni 62', password: 'password123' };
    
    // Simula 100 login simultanei
    for (let i = 0; i < 100; i++) {
      loginRequests.push(
        axios.post(`${this.baseUrl}/api/auth/login`, credentials, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        })
        .then(response => ({ success: true, token: response.data.data?.token }))
        .catch(error => ({ success: false, error: error.message }))
      );
    }

    try {
      const results = await Promise.all(loginRequests);
      const successful = results.filter(r => r.success).length;
      const tokens = results.filter(r => r.success && r.token).map(r => r.token);
      const uniqueTokens = new Set(tokens).size;
      
      this.log(`📊 Concurrent Login Results:`, 'info');
      this.log(`  ✅ Successful logins: ${successful}/100`, 'success');
      this.log(`  🔑 Unique tokens: ${uniqueTokens}`, 'info');
      
      if (uniqueTokens !== successful) {
        this.log(`💥 CRITICAL: Token collision detected!`, 'critical');
        this.results.security.critical++;
        this.results.security.issues.push({
          type: 'TOKEN_COLLISION',
          severity: 'CRITICAL',
          successful: successful,
          uniqueTokens: uniqueTokens
        });
      }
      
      if (successful < 50) {
        this.log(`⚠️ HIGH: Low success rate under concurrent load: ${successful}%`, 'warning');
        this.results.performance.high++;
        this.results.performance.issues.push({
          type: 'CONCURRENT_LOGIN_FAILURE',
          severity: 'HIGH',
          successRate: successful
        });
      }
      
    } catch (error) {
      this.log(`💥 CRITICAL: Concurrent login test failed: ${error.message}`, 'critical');
      this.results.performance.critical++;
      this.results.performance.issues.push({
        type: 'CONCURRENT_LOGIN_CRASH',
        severity: 'CRITICAL',
        error: error.message
      });
    }
  }

  // 🔥 TEST 7: FRONTEND STRESS
  async testFrontendStress() {
    this.log('🔥 TEST 7: FRONTEND STRESS', 'stress');
    
    try {
      // Test frontend accessibilità
      const response = await axios.get(this.frontendUrl, { timeout: 10000 });
      
      if (response.status === 200) {
        this.log(`✅ Frontend accessible`, 'success');
        
        // Test se il frontend contiene errori evidenti
        const html = response.data;
        const errors = [];
        
        if (html.includes('error') || html.includes('Error')) {
          errors.push('Error text found in HTML');
        }
        
        if (html.includes('undefined') || html.includes('null')) {
          errors.push('Undefined/null values in HTML');
        }
        
        if (html.includes('console.error')) {
          errors.push('Console errors in HTML');
        }
        
        if (errors.length > 0) {
          this.log(`⚠️ MEDIUM: Frontend issues found: ${errors.join(', ')}`, 'warning');
          this.results.ux.medium++;
          this.results.ux.issues.push({
            type: 'FRONTEND_ERRORS',
            severity: 'MEDIUM',
            errors: errors
          });
        }
      } else {
        this.log(`❌ Frontend not accessible: ${response.status}`, 'error');
        this.results.ux.critical++;
        this.results.ux.issues.push({
          type: 'FRONTEND_INACCESSIBLE',
          severity: 'CRITICAL',
          status: response.status
        });
      }
    } catch (error) {
      this.log(`💥 CRITICAL: Frontend stress test failed: ${error.message}`, 'critical');
      this.results.ux.critical++;
      this.results.ux.issues.push({
        type: 'FRONTEND_CRASH',
        severity: 'CRITICAL',
        error: error.message
      });
    }
  }

  // 🔥 TEST 8: LOGIC FLAWS
  async testLogicFlaws() {
    this.log('🔥 TEST 8: LOGIC FLAWS', 'hack');
    
    // Test 1: Registrazione con email duplicata
    try {
      const user1 = await axios.post(`${this.baseUrl}/api/auth/register`, {
        username: 'testuser1',
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });
      
      const user2 = await axios.post(`${this.baseUrl}/api/auth/register`, {
        username: 'testuser2',
        email: 'test@test.com', // Stessa email
        password: 'password123',
        firstName: 'Test',
        lastName: 'User2'
      });
      
      if (user2.data.success) {
        this.log(`💥 CRITICAL: Duplicate email registration allowed`, 'critical');
        this.results.logic.critical++;
        this.results.logic.issues.push({
          type: 'DUPLICATE_EMAIL',
          severity: 'CRITICAL',
          email: 'test@test.com'
        });
      }
    } catch (error) {
      // Se fallisce, è corretto
    }
    
    // Test 2: Login con credenziali sbagliate
    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
        username: 'nonexistent',
        password: 'wrongpassword'
      });
      
      if (response.data.success) {
        this.log(`💥 CRITICAL: Login with wrong credentials succeeded`, 'critical');
        this.results.logic.critical++;
        this.results.logic.issues.push({
          type: 'WRONG_CREDENTIALS_LOGIN',
          severity: 'CRITICAL'
        });
      }
    } catch (error) {
      // Se fallisce, è corretto
    }
    
    // Test 3: Accesso admin senza permessi
    try {
      const loginResponse = await axios.post(`${this.baseUrl}/api/auth/login`, {
        username: 'Gianni 62',
        password: 'password123'
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.token;
        
        // Prova ad accedere a endpoint admin
        const adminResponse = await axios.get(`${this.baseUrl}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (adminResponse.status === 200) {
          this.log(`💥 CRITICAL: Non-admin user can access admin endpoints`, 'critical');
          this.results.logic.critical++;
          this.results.logic.issues.push({
            type: 'ADMIN_ACCESS_BYPASS',
            severity: 'CRITICAL',
            user: 'Gianni 62',
            endpoint: '/api/admin/users'
          });
        }
      }
    } catch (error) {
      // Se fallisce, è corretto
    }
  }

  async runBrutalTest() {
    this.log('🧨 INIZIANDO STRESS TEST BRUTAL', 'critical');
    this.log('================================', 'info');
    
    await this.testSQLInjection();
    await this.testXSSAttacks();
    await this.testAuthBypass();
    await this.testMalformedPayloads();
    await this.testStressLoad();
    await this.testConcurrentLogins();
    await this.testFrontendStress();
    await this.testLogicFlaws();
    
    this.printBrutalResults();
  }

  printBrutalResults() {
    this.log('📊 RISULTATI STRESS TEST BRUTAL', 'critical');
    this.log('================================', 'info');
    
    const categories = [
      { name: '🔐 SECURITY VULNERABILITIES', data: this.results.security },
      { name: '🚀 PERFORMANCE ISSUES', data: this.results.performance },
      { name: '🧠 LOGIC FLAWS', data: this.results.logic },
      { name: '🎨 UX PROBLEMS', data: this.results.ux }
    ];

    let totalCritical = 0;
    let totalHigh = 0;
    let totalMedium = 0;
    let totalLow = 0;

    categories.forEach(category => {
      const { name, data } = category;
      this.log(`${name}:`, 'info');
      this.log(`  💥 Critical: ${data.critical}`, 'critical');
      this.log(`  ⚠️ High: ${data.high}`, 'warning');
      this.log(`  🔶 Medium: ${data.medium}`, 'info');
      this.log(`  📝 Low: ${data.low}`, 'info');
      
      totalCritical += data.critical;
      totalHigh += data.high;
      totalMedium += data.medium;
      totalLow += data.low;
    });

    this.log('================================', 'info');
    this.log(`💥 TOTALE CRITICAL: ${totalCritical}`, 'critical');
    this.log(`⚠️ TOTALE HIGH: ${totalHigh}`, 'warning');
    this.log(`🔶 TOTALE MEDIUM: ${totalMedium}`, 'info');
    this.log(`📝 TOTALE LOW: ${totalLow}`, 'info');
    
    if (totalCritical > 0) {
      this.log('💥 SISTEMA CRITICAMENTE VULNERABILE!', 'critical');
    } else if (totalHigh > 0) {
      this.log('⚠️ SISTEMA CON VULNERABILITÀ ALTE!', 'warning');
    } else {
      this.log('✅ SISTEMA RELATIVAMENTE SICURO', 'success');
    }
    
    // Stampa dettagli issues
    this.log('\n📋 DETTAGLI ISSUES:', 'info');
    categories.forEach(category => {
      if (category.data.issues.length > 0) {
        this.log(`\n${category.name}:`, 'info');
        category.data.issues.forEach(issue => {
          this.log(`  ${issue.severity}: ${issue.type}`, issue.severity === 'CRITICAL' ? 'critical' : 'warning');
        });
      }
    });
  }
}

// Esegui il test brutale
const test = new BrutalStressTest();
test.runBrutalTest().catch(console.error); 