import { Page } from "puppeteer";
import { goHome } from "./common";

export async function checkResults(page: Page) {
  await goHome(page);
  const navi = page.waitForNavigation({ waitUntil: "networkidle2" });
  await page.evaluate(() =>
    document.querySelectorAll(".menu-list-link").forEach((v: HTMLElement) => {
      if (v.innerText === "本日の払戻金一覧") {
        v.click();
      }
    }),
  );
  await navi;
}
