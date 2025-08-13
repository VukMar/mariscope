// main.js
import fs from 'fs';
import { scrapePoBCommodities } from './scraper.js';
import { renderToImage } from './renderer.js';
import { logToConsole } from './consoleLogger.js';
import { simplifyName } from './pobNameFix.js';
import { uploadImage } from './uploader.js';


export async function mariscope(args) {
  // --- Load config file ---
  let config;
  try {
    config = JSON.parse(fs.readFileSync(args.config, 'utf8'));
  } catch (err) {
    console.error(`Failed to read config file at ${args.config}`, err);
    throw err;
  }
  // --- Apply CLI overrides ---
  if (typeof args.debug === 'boolean') {
    config.debug = args.debug;
  }
  if (typeof args.uploadOff === 'boolean'){
    config.uploadOff = args.uploadOff;
  }
  if(typeof args.pobName === 'string'){
    logToConsole(typeof args.pobName, config);
    config.selectors.pobName = args.pobName;
  }
  if(typeof args.clConfig === 'string'){
    logToConsole(typeof args.clConfig, config);
    config.clConfig = args.clConfig;
  }
  logToConsole('Arguments given:', config);
  logToConsole(args, config);

  // Check if PoB name is valid
  if(!config.selectors.pobName || config.selectors.pobName === "" || config.selectors.pobName.toString().length < 3){
    console.warn("PoB not found:", "Invalid PoB name!");
    return { status: 'not found', message: "Invalid PoB name!"}
  }
  try {
    // Run Scraper
    const info = await scrapePoBCommodities(config);
    
    if (info.error) {
      // Handle PoB not found gracefully
      console.warn("PoB not found:", info.error);
      return { status: 'not_found', message: info.error };
    }
    logToConsole("Scraper success!", config);
    
    // Run Renderer 
    await renderToImage(info, config);
    logToConsole("Render success!", config);

    // Run Uploader
    if(!config.uploadOff){
      await uploadImage(config);
    }
    // Return success if we reach this point
    return { status: 'success', info };
  } catch (err) {
    console.error("Error running mariscope:", err);
    throw err;
  }
}