#!/usr/bin/env node

/**
 * 🔧 FIX SYNTAX ERRORS - Corregge tutti gli errori di sintassi axios
 */

const fs = require('fs');
const path = require('path');

class SyntaxErrorFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      fix: '🔧'
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

      // Fix 1: Correggi la sintassi axios con parentesi extra
      content = content.replace(
        /axios\.(get|post|put|delete)\(getApiUrl\(([^)]+)\)\)\), \{
        /g,
        (match, method, url) => {
          return `axios.${method}(getApiUrl(${url}), {`;
        }
      );

      // Fix 3: Aggiungi import getApiUrl se mancante
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
        } else {
          // Aggiungi l'import all'inizio del file
          const importStatement = "import { getApiUrl } from '../../config/api';\n";
          content = importStatement + content;
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
      this.errors.push({ file: filePath, error: error.message });
      return false;
    }
  }

  async fixAllFiles() {
    this.log('🔧 INIZIANDO FIX SYNTAX ERRORS');
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

    this.printResults();
  }

  printResults() {
    this.log('\n📊 RISULTATI FIX SYNTAX ERRORS');
    this.log('=' * 50);
    
    this.log(`File corretti: ${this.fixedFiles.length}`);
    this.log(`Errori: ${this.errors.length}`);
    
    if (this.fixedFiles.length > 0) {
      this.log('\n✅ File corretti:');
      this.fixedFiles.forEach(file => {
        this.log(`  - ${file}`);
      });
    }
    
    if (this.errors.length > 0) {
      this.log('\n❌ Errori:');
      this.errors.forEach(error => {
        this.log(`  - ${error.file}: ${error.error}`);
      });
    }
  }
}

// Esegui il fix
async function main() {
  const fixer = new SyntaxErrorFixer();
  await fixer.fixAllFiles();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SyntaxErrorFixer; 