#!/usr/bin/env node

/**
 * 🔧 FIX SYNTAX ERRORS SIMPLE - Corregge errori di sintassi axios
 */

const fs = require('fs');

class SimpleSyntaxFixer {
  constructor() {
    this.fixedFiles = [];
  }

  log(message, type = 'info') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    console.log(`${emoji[type]} ${message}`);
  }

  async fixFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        this.log(`File non trovato: ${filePath}`, 'warning');
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

      content = content.replace(
        /axios\.post\(getApiUrl\(([^)]+)\)\), \{
        /g,
        'axios.post(getApiUrl($1), {'
      );

      content = content.replace(
        /axios\.put\(getApiUrl\(([^)]+)\)\), \{
        /g,
        'axios.put(getApiUrl($1), {'
      );

      content = content.replace(
        /axios\.delete\(getApiUrl\(([^)]+)\)\), \{
        /g,
        'axios.delete(getApiUrl($1), {'
      );

      // Fix 2: Aggiungi import getApiUrl se mancante
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
        this.fixedFiles.push(filePath);
        this.log(`✅ Corretto: ${filePath}`, 'success');
        return true;
      } else {
        this.log(`ℹ️ Nessuna modifica necessaria: ${filePath}`, 'info');
        return false;
      }
    } catch (error) {
      this.log(`❌ Errore correzione ${filePath}: ${error.message}`, 'error');
      return false;
    }
  }

  async fixAllFiles() {
    this.log('🔧 INIZIANDO FIX SYNTAX ERRORS SIMPLE');
    this.log('=' * 50);

    const filesToFix = [
      'frontend/src/pages/AdminDashboard.jsx',
      'frontend/src/components/Tasks/QuizPlayer.jsx',
      'frontend/src/components/Tasks/SurveyPlayer.jsx',
      'frontend/src/components/Tasks/DocumentReader.jsx',
      'frontend/src/components/Admin/CommissionManager.jsx',
      'frontend/src/components/Tasks/VideoPlayer.jsx',
      'frontend/src/components/Admin/KYCManager.jsx',
      'frontend/src/components/Admin/CommissionPlansManager.jsx',
      'frontend/src/components/Admin/TaskManager.jsx',
      'frontend/src/components/Admin/SalesManager.jsx',
      'frontend/src/components/Admin/UserManager.jsx'
    ];

    for (const file of filesToFix) {
      await this.fixFile(file);
    }

    this.log('\n📊 RISULTATI');
    this.log(`File corretti: ${this.fixedFiles.length}`);
    
    if (this.fixedFiles.length > 0) {
      this.log('\n✅ File corretti:');
      this.fixedFiles.forEach(file => {
        this.log(`  - ${file}`);
      });
    }
  }
}

// Esegui il fix
async function main() {
  const fixer = new SimpleSyntaxFixer();
  await fixer.fixAllFiles();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimpleSyntaxFixer; 