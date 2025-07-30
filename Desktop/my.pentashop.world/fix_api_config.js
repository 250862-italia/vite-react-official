#!/usr/bin/env node

/**
 * 🔧 FIX API CONFIG - Aggiorna tutti i file per usare la configurazione API corretta
 */

const fs = require('fs');
const path = require('path');

class APIConfigFixer {
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

  async updateFile(filePath, oldPattern, newPattern) {
    try {
      if (!fs.existsSync(filePath)) {
        this.log(`File non trovato: ${filePath}`, 'warning');
        return false;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      // Sostituisci localhost:3000 con getApiUrl
      content = content.replace(
        /axios\.(get|post|put|delete)\('http:\/\/localhost:3000\/api\/([^']+)'/g,
        (match, method, endpoint) => {
          return `axios.${method}(${this.getApiUrlCall(endpoint)})`;
        }
      );

      // Sostituisci anche le versioni con template literals
      content = content.replace(
        /axios\.(get|post|put|delete)\(`http:\/\/localhost:3000\/api\/([^`]+)`/g,
        (match, method, endpoint) => {
          return `axios.${method}(${this.getApiUrlCall(endpoint)})`;
        }
      );

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        this.fixedFiles.push(filePath);
        this.log(`✅ Aggiornato: ${filePath}`, 'success');
        return true;
      } else {
        this.log(`ℹ️ Nessuna modifica necessaria: ${filePath}`, 'info');
        return false;
      }
    } catch (error) {
      this.log(`❌ Errore aggiornamento ${filePath}: ${error.message}`, 'error');
      this.errors.push({ file: filePath, error: error.message });
      return false;
    }
  }

  getApiUrlCall(endpoint) {
    // Gestisci i template literals
    if (endpoint.includes('${')) {
      return `getApiUrl(\`/${endpoint}\`)`;
    }
    return `getApiUrl('/${endpoint}')`;
  }

  async addImportToFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return false;

      let content = fs.readFileSync(filePath, 'utf8');
      
      // Controlla se getApiUrl è già importato
      if (content.includes('getApiUrl')) {
        return false;
      }

      // Aggiungi l'import se non presente
      if (content.includes("import axios from 'axios'")) {
        content = content.replace(
          "import axios from 'axios'",
          "import axios from 'axios';\nimport { getApiUrl } from '../config/api'"
        );
      } else if (content.includes("import axios from \"axios\"")) {
        content = content.replace(
          "import axios from \"axios\"",
          "import axios from \"axios\";\nimport { getApiUrl } from '../config/api'"
        );
      } else {
        // Aggiungi l'import all'inizio del file
        const importStatement = "import { getApiUrl } from '../config/api';\n";
        content = importStatement + content;
      }

      fs.writeFileSync(filePath, content);
      this.log(`✅ Aggiunto import getApiUrl: ${filePath}`, 'success');
      return true;
    } catch (error) {
      this.log(`❌ Errore aggiunta import ${filePath}: ${error.message}`, 'error');
      return false;
    }
  }

  async fixAllFiles() {
    this.log('🔧 INIZIANDO FIX API CONFIG');
    this.log('=' * 50);

    const filesToFix = [
      'frontend/src/pages/AdminDashboard.jsx',
      'frontend/src/components/Profile/UserProfile.jsx',
      'frontend/src/components/Tasks/QuizPlayer.jsx',
      'frontend/src/components/Tasks/TaskExecutor.jsx',
      'frontend/src/components/Admin/CommissionManager.jsx',
      'frontend/src/components/Admin/SalesManager.jsx',
      'frontend/src/components/Tasks/VideoPlayer.jsx',
      'frontend/src/components/Tasks/DocumentReader.jsx',
      'frontend/src/components/Admin/TaskManager.jsx',
      'frontend/src/components/Tasks/SurveyPlayer.jsx',
      'frontend/src/components/Admin/UserManager.jsx',
      'frontend/src/components/Admin/CommissionPlansManager.jsx',
      'frontend/src/components/Admin/KYCManager.jsx'
    ];

    for (const file of filesToFix) {
      await this.updateFile(file);
      await this.addImportToFile(file);
    }

    this.printResults();
  }

  printResults() {
    this.log('\n📊 RISULTATI FIX API CONFIG');
    this.log('=' * 50);
    
    this.log(`File aggiornati: ${this.fixedFiles.length}`);
    this.log(`Errori: ${this.errors.length}`);
    
    if (this.fixedFiles.length > 0) {
      this.log('\n✅ File aggiornati:');
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
  const fixer = new APIConfigFixer();
  await fixer.fixAllFiles();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = APIConfigFixer; 