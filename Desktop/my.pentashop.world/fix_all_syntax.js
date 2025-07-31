#!/usr/bin/env node

/**
 * 🔧 FIX ALL SYNTAX - Corregge tutti gli errori di sintassi rimanenti
 */

const fs = require('fs');

const filesToFix = [
  'frontend/src/components/Admin/CommissionManager.jsx',
  'frontend/src/components/Admin/TaskManager.jsx',
  'frontend/src/components/Admin/CommissionPlansManager.jsx',
  'frontend/src/components/Admin/SalesManager.jsx',
  'frontend/src/components/Tasks/VideoPlayer.jsx',
  'frontend/src/components/Tasks/DocumentReader.jsx',
  'frontend/src/components/Admin/UserManager.jsx',
  'frontend/src/components/Tasks/SurveyPlayer.jsx'
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File non trovato: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix 1: Correggi axios.get(getApiUrl(...)), { -> axios.get(getApiUrl(...), {
    content = content.replace(
      /axios\.get\(getApiUrl\(([^)]+)\)\), \{
      /g,
      'axios.get(getApiUrl($1), {'
    );

    // Fix 2: Correggi axios.post(getApiUrl(...)), { -> axios.post(getApiUrl(...), {
    content = content.replace(
      /axios\.post\(getApiUrl\(([^)]+)\)\), \{
      /g,
      'axios.post(getApiUrl($1), {'
    );

    // Fix 3: Correggi axios.put(getApiUrl(...)), { -> axios.put(getApiUrl(...), {
    content = content.replace(
      /axios\.put\(getApiUrl\(([^)]+)\)\), \{
      /g,
      'axios.put(getApiUrl($1), {'
    );

    // Fix 4: Correggi axios.delete(getApiUrl(...)), { -> axios.delete(getApiUrl(...), {
    content = content.replace(
      /axios\.delete\(getApiUrl\(([^)]+)\)\), \{
      /g,
      'axios.delete(getApiUrl($1), {'
    );

    // Fix 5: Aggiungi import getApiUrl se mancante
    if (content.includes('getApiUrl') && !content.includes("import { getApiUrl }")) {
      if (content.includes("import axios from 'axios'")) {
        content = content.replace(
          "import axios from 'axios'",
          "import axios from 'axios';\nimport { getApiUrl } from '../../config/api'"
        );
      } else if (content.includes("import axios from \"axios\"")) {
        content = content.replace(
          "import axios from \"axios\"",
          "import axios from \"axios\";\nimport { getApiUrl } from '../../config/api'"
        );
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corretto: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️ Nessuna modifica necessaria: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Errore correzione ${filePath}: ${error.message}`);
    return false;
  }
}

console.log('🔧 INIZIANDO FIX ALL SYNTAX');
console.log('=' * 50);

let fixedCount = 0;
for (const file of filesToFix) {
  if (fixFile(file)) {
    fixedCount++;
  }
}

console.log('\n📊 RISULTATI');
console.log(`File corretti: ${fixedCount}/${filesToFix.length}`);
console.log('�� FIX COMPLETATO!'); 