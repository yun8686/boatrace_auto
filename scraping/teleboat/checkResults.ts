import { Page } from "puppeteer";
import { goHome, sleep } from "./common";

export async function checkResults(page: Page) {
  console.log("go homing");
  await goHome(page);
  console.log("go homed");
  const navi = page.waitForNavigation({ waitUntil: "networkidle2" });
  await page.evaluate(() =>
    document.querySelectorAll(".menu-list-link").forEach((v: HTMLElement) => {
      if (v.innerText === "本日の払戻金一覧") {
        v.click();
      }
    }),
  );
  console.log("本日の払戻金一覧");
  await Promise.all([sleep(500), navi]);
}
