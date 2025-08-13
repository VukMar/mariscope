// CLI.js
import minimist from 'minimist';
import { mariscope } from './main.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { debug } from 'console';

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Parse CLI arguments ---
const args = minimist(process.argv.slice(2), {
  boolean: ['clean', 'debug', 'uploadOff'],
  string: ['pobName', 'config', 'clConfig'],
  alias: { c: 'config', d: 'debug' , cl: 'clean' , nm: 'pobName'},
  default: { config: './config.json' , uploadOff: false , debug: false , clean: false , clConfig: './clConfig.json'}
});

if (args.clean) {
  const dirPath = path.join(__dirname, 'PoBs');

  fs.rm(dirPath, { recursive: true, force: true }, (err) => {
    if (err) {
      console.error('Error deleting directory:', err);
    } else {
      console.log(`Directory "${dirPath}" deleted successfully.`);
    }
  });
} else {
  // --- Run the scraper ---
  (async () => {
    try {
      await mariscope(args);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
