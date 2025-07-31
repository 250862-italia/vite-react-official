#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');

console.log('🔍 MONITOR SISTEMA PENTASHOP WORLD');
console.log('=====================================\n');

// Funzioni di test
async function testBackend() {
    return new Promise((resolve) => {
        const req = http.request('http://localhost:3001/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ success: true, data: result });
                } catch (e) {
                    resolve({ success: false, error: 'JSON parse error' });
                }
            });
        });
        
        req.on('error', (err) => {
            resolve({ success: false, error: err.message });
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });
        
        req.end();
    });
}

async function testFrontend() {
    return new Promise((resolve) => {
        const req = http.request('http://localhost:5173', (res) => {
            resolve({ success: true, status: res.statusCode });
        });
        
        req.on('error', (err) => {
            resolve({ success: false, error: err.message });
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });
        
        req.end();
    });
}

async function testLogin() {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            username: 'admin',
            password: 'password'
        });
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ success: result.success, data: result });
                } catch (e) {
                    resolve({ success: false, error: 'JSON parse error' });
                }
            });
        });
        
        req.on('error', (err) => {
            resolve({ success: false, error: err.message });
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });
        
        req.write(postData);
        req.end();
    });
}

function checkProcesses() {
    return new Promise((resolve) => {
        exec('ps aux | grep -E "(node|npm)" | grep -v grep', (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, error: error.message });
            } else {
                const processes = stdout.trim().split('\n').filter(line => line.length > 0);
                resolve({ success: true, processes });
            }
        });
    });
}

function checkPorts() {
    return new Promise((resolve) => {
        exec('lsof -i :3001,5173', (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, error: error.message });
            } else {
                const ports = stdout.trim().split('\n').filter(line => line.length > 0);
                resolve({ success: true, ports });
            }
        });
    });
}

async function runDiagnostics() {
    console.log('📊 DIAGNOSTICA IN CORSO...\n');
    
    // Test Backend
    console.log('🔧 Test Backend...');
    const backendResult = await testBackend();
    if (backendResult.success) {
        console.log('✅ Backend OK:', backendResult.data.status);
    } else {
        console.log('❌ Backend Error:', backendResult.error);
    }
    
    // Test Frontend
    console.log('\n🌐 Test Frontend...');
    const frontendResult = await testFrontend();
    if (frontendResult.success) {
        console.log('✅ Frontend OK:', frontendResult.status);
    } else {
        console.log('❌ Frontend Error:', frontendResult.error);
    }
    
    // Test Login
    console.log('\n🔐 Test Login...');
    const loginResult = await testLogin();
    if (loginResult.success) {
        console.log('✅ Login OK - Admin autenticato');
    } else {
        console.log('❌ Login Error:', loginResult.error);
    }
    
    // Check Processes
    console.log('\n📋 Check Processi...');
    const processResult = await checkProcesses();
    if (processResult.success) {
        console.log('📊 Processi attivi:', processResult.processes.length);
        processResult.processes.forEach((proc, i) => {
            console.log(`  ${i+1}. ${proc.split(/\s+/).slice(10).join(' ')}`);
        });
    } else {
        console.log('❌ Errore check processi:', processResult.error);
    }
    
    // Check Ports
    console.log('\n🔌 Check Porte...');
    const portResult = await checkPorts();
    if (portResult.success) {
        console.log('📊 Porte in uso:');
        portResult.ports.forEach((port, i) => {
            console.log(`  ${i+1}. ${port}`);
        });
    } else {
        console.log('❌ Errore check porte:', portResult.error);
    }
    
    console.log('\n🎯 DIAGNOSTICA COMPLETATA');
    console.log('==========================');
}

// Esegui diagnostica
runDiagnostics().catch(console.error); 