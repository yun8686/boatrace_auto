import { Page } from "puppeteer";
import { waitAndClick } from "../puppeteer";

export async function waitNavigation(page: Page) {
  await page.waitForFunction(() => {
    return !document.querySelector(".loading-spinner-overlay");
  });
  return true;
}

export async function goHome(page: Page) {
  if (await page.$(".header-nav-btn.home")) {
    await waitAndClick(page, ".header-nav-btn.home");
    await waitNavigation(page);
  }
}
