import puppeteer from "puppeteer";
import fs from "fs";
import { nameToId , simplifyName } from "./pobNameFix.js";
import { logToConsole } from "./consoleLogger.js";

export async function scrapePoBCommodities(config) {
  const browser = await puppeteer.launch({ headless: !config.debug });
  const page = await browser.newPage();
  const pobId = await nameToId(config.selectors.pobName);
  logToConsole(pobId,config);
  await page.goto(config.targetUrl, { waitUntil: "networkidle2" });

  // Click PoBs
  await page.waitForSelector(config.selectors.pobsButton);
  await page.click(config.selectors.pobsButton);

  // Wait for row
  try {
    await page.waitForSelector(pobId, { timeout: 10000 });
    // If found, proceed with scraping
  } catch (err) {
    if (err.name === 'TimeoutError') {
      // Handle the case when selector doesn't appear in time
      await browser.close();
      return { error: 'PoB not found' };
    } else {
      // Re-throw other errors
      throw err;
    }
  }

  // Trigger load without clicking pin
  await page.evaluate((selector) => {
    const row = document.querySelector(selector);
    if (row) {
      const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      row.dispatchEvent(event);
    }
  }, pobId);

  // Wait for table content change
  const initialContent = await page.$eval(config.selectors.tableBottomMain, el => el.innerText);
  await page.waitForFunction(
    (sel, initial) => {
      const el = document.querySelector(sel);
      return el && el.innerText.trim() !== initial.trim() && el.innerText.trim().length > 0;
    },
    { timeout: 10000 },
    config.selectors.tableBottomMain,
    initialContent
  );

  // Extract table data
  const tableData = await page.evaluate((selector) => {
    const table = document.querySelector(selector);
    if (!table) return [];

    const rows = table.querySelectorAll("tbody tr");
    return Array.from(rows)
      .filter(row => {
        const nameCell = row.querySelectorAll("td")[0];
        const name = nameCell ? nameCell.innerText.trim() : "";
        // Skip if empty name or contains "()"
        return name && !name.includes("()");
      })
      .map(row => {
        const cells = row.querySelectorAll("td");
        return {
          name: cells[0]?.innerText.trim() || "",
          stock: cells[2]?.innerText.trim() || "",
          sellPrice: cells[4]?.innerText.trim() || "",
          buyPrice: cells[3]?.innerText.trim() || "",
          maxStock: cells[11]?.innerText.trim() || "",
          nickname: cells[12]?.innerText.trim() || ""
        };
      });
  }, config.selectors.tableBottomMain);


  await browser.close();
  
  // Save JSON
  fs.mkdirSync(`${config.output.main}/${await simplifyName(config.selectors.pobName)}`, { recursive: true });
  fs.writeFileSync(`${config.output.main}/${await simplifyName(config.selectors.pobName)}/${config.output.localJson}`, JSON.stringify(tableData, null, 2));

  logToConsole(`Saved data to ${config.output.localJson}`, config);
  return tableData;
}
