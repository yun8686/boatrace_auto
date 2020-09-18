import { Page } from "puppeteer";
import { goHome, waitNavigation } from "./common";
import { waitAndClick } from "../puppeteer";

export async function getNextRaces(page: Page) {
  await goHome(page);
  await page.waitForSelector(".react-swipeable-view-container>div:nth-child(2)");
  const raceLength = await page.evaluate(() => {
    return document.querySelectorAll(".react-swipeable-view-container>div:nth-child(2) .deadline-list-item .jyo-panel").length;
  });
  for (let i = 0; i < raceLength; i++) {
    await goHome(page);
    if (await page.$(".header-nav-btn.home")) {
      await waitAndClick(page, ".header-nav-btn.home");
    }
    await page.waitForSelector(".react-swipeable-view-container>div:nth-child(2) .deadline-list-item .jyo-panel");
    await waitAndClick(page, ".tab-list li:nth-child(2) .btn-tab");
    await page.waitForSelector(".odds-popular-table-group");
  }
}
