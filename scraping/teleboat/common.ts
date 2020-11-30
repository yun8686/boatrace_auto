import { Page } from "puppeteer";
import { waitAndClick } from "../puppeteer";

export async function waitNavigation(page: Page) {
  await page.waitForFunction(
    () => {
      return !document.querySelector(".loading-spinner-overlay");
    },
    { timeout: 15000 },
  );
  return true;
}
export async function waitSelector(page: Page, selector: string) {
  await page.waitForFunction(
    (selector) => {
      return !!document.querySelector(selector);
    },
    { timeout: 15000 },
    selector,
  );
  return true;
}
export const sleep = async (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function goHome(page: Page) {
  if (await page.$(".header-nav-btn.home")) {
    try {
      await waitAndClick(page, ".header-nav-btn.home");
      await waitNavigation(page);
    } catch (e) {
      console.log("goHomeError", e);
      throw e;
    }
  }
}
