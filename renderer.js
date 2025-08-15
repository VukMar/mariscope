// renderer.js
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { simplifyName } from './pobNameFix.js';
import { logToConsole } from './consoleLogger.js';

function escapeHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function dateToDiscoDate(config){

  let now = new Date();

  // Move current year 1190 years back
  now.setFullYear(now.getFullYear() - 1190);

  // Extract date components
  let day = String(now.getDate()).padStart(2, '0');
  let month = String(now.getMonth() + 1).padStart(2, '0');
  let year = now.getFullYear();
  let hours = String(now.getHours()).padStart(2, '0');
  let minutes = String(now.getMinutes()).padStart(2, '0');
  let seconds = String(now.getSeconds()).padStart(2, '0');

  // Build formatted string
  let formattedDate = `${day}.${month}.${year} A.S [${hours}:${minutes}:${seconds}]`;

  return formattedDate;
}

export async function renderToImage(daxInfoText, config, opts = {}) {
  const width = opts.width || 1200;
  const padding = 32;
  logToConsole(config, config);
  
  // Ensure daxInfoText is safe for HTML and in string form
  function safeInfo(daxInfoText){
    let re = '<div class="commodity_container">\n';
    daxInfoText.forEach(el => {
      const key = el.nickname;
      const tdData =  `<img class="commodity_img" src="${config.img[key] && config.img[key] !== 'empty' ? config.img[key] : config.noImg}">
`
      re += `
      <table class="commodity"><tr>
        <td>${tdData}</td>
        <td>
          ${escapeHtml(el.name)}
          Buy: ${escapeHtml(el.buyPrice)}SC/u
          Sell: ${escapeHtml(el.sellPrice)}SC/u
          Stock: ${escapeHtml(el.stock)}/${escapeHtml(el.maxStock)} 
        </td>
      </tr></table>\n`
    });
    re += '</div>'
    return re;
  }

  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=800px", initial-scale=1" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Overpass:ital,wght@0,100..900;1,100..900&display=swap');
      body{
        margin:0;
        background:#000;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:40px 0;
      }
      td{
        font-family: "Overpass", sans-serif;
      }
      .card{
         width:${width - padding * 2}px;
         padding:24px;
         border-radius:14px;
         background: linear-gradient(135deg,#04102a 0%, #001a1f 100%);
         box-shadow: 0 8px 30px rgba(0,0,0,0.6),
                     inset 0 0 40px rgba(0,255,220,0.02);
         color:#bffaf7;
         font-family: 'Orbitron', sans-serif;
      }
      .header{
         display: flex;
         font-family: "Overpass", sans-serif;
         color:#1abbae;
         font-size:20px;
         margin-bottom:10px;
         width: max-width;
         justify-content: center;
         align-content: center;
         opacity:0.8;
      }
      .title{
         color:#1abbae;
         font-size:35px;
         margin-bottom:8px;
      }
      .content{
         display: flex;
         justify-content: center;
         align-items: center;
         font-size:20px;
         line-height:1.35;
         white-space:pre-wrap;
         word-break:break-word;
      }
      .commodity_img{
        width: 80px;
        height: 80px;
      }
      .footer{
         font-family: "Overpass", sans-serif;
         color:#faf0e6;
         font-size:25px;
         margin-bottom:10px;
         width: max-width;
         opacity:0.8;
      }
      .mcrscope{
         font-size: 35px;
      }
      .commodity_container {
         display: flex;
         flex-wrap: wrap;
         justify-content: space-evenly;
         align-items: flex-start;
      }
      .commodity{
         width: max-content;
         max-width: 400px;
         min-width: 300px;
         min-height: 250px;
      }
    </style>
  </head>
  <body>
    <div class="card" id="card">
    <div class="header">Updated: ${ dateToDiscoDate(config)}</div>
    <div class="content">${safeInfo(daxInfoText,config)}</div>
    <div class="footer">Generated using:  <i class="mcrscope">MCR.Scope</i></div>
    </div>
  </body>
  </html>`;

  // Ensure folder exists
  fs.mkdirSync(path.dirname(`${config.output.main}/${await simplifyName(config.selectors.pobName)}/${config.output.renderOut}`), { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: width, height: 800 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    const card = await page.$('#card');
    if (!card) throw new Error('Card element not found in template');
    await card.screenshot({ path: `${config.output.main}/${await simplifyName(config.selectors.pobName)}/${config.output.renderOut}` });
  } finally {
    await browser.close();
  }
  return `${config.output.main}/${await simplifyName(config.selectors.pobName)}/${config.output.renderOut}`;
}
