// Used to collect all Discovery Freelancer commodity nicknames as keys for image URLs

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export async function scrapeAllDiscoCommodities(config) {
  const browser = await puppeteer.launch({ headless: config.debug });
  const page = await browser.newPage();

  await page.goto(config.targetUrl, { waitUntil: "networkidle2" });

  // Click Commodities
  await page.waitForSelector(config.selectors.commoditiesButton);
  await page.click(config.selectors.commoditiesButton);

	// Wait for table content change
  const initialContent = await page.$eval(config.selectors.tableTopMain, el => el.innerText);
  await page.waitForFunction(
    (sel, initial) => {
      const el = document.querySelector(sel);
      return el && el.innerText.trim() !== initial.trim() && el.innerText.trim().length > 0;
    },
    { timeout: 10000 },
    config.selectors.tableTopMain,
    initialContent
  );

  //Make a function to fetch data form config.tableTopMain
	const tableData = await page.evaluate((tableSelector) => {
		const table = document.querySelector(tableSelector);
		if (!table) return {};

		const rows = Array.from(table.querySelectorAll("tr"));

		const data = {};

		rows.slice(1).forEach(row => {  // skip header
			const cells = row.querySelectorAll("td");
			if (cells.length > 10) {
				const key = cells[9].innerText.trim();
				data[key] = "empty";  // store "empty" if value is empty
			}
		});

		return data;
	}, config.selectors.tableTopMain);
  await browser.close();

  // Save JSON
  fs.mkdirSync(path.dirname(config.output.commListJSON), { recursive: true });
  fs.writeFileSync(config.output.commListJSON, JSON.stringify(tableData, null, 2));

  if(config.debug) console.log(`Saved data to ${config.output.commListJSON}`);
}

//Read config file and Call scraper
(async () => {
const configPath = 'allCommodityScraper/allCommConfig.json';
	let config;
	try {
		config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		scrapeAllDiscoCommodities(config);
	} catch (err) {
		console.error(`Failed to read config file at ${configPath}`, err);
		process.exit(1);
	}
})();