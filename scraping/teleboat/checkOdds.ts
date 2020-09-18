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
    await waitAndClick(page, ".top-nav-link.deadline");
    const moved = await page.evaluate(
      (index, currentTime) => {
        console.log(index, currentTime);
        const element = document.querySelectorAll(".react-swipeable-view-container>div:nth-child(2) .deadline-list-item .jyo-panel")[
          index
        ] as HTMLElement;
        const time = parseInt(element.innerText.match(/締切予定時刻(\d+:\d+)/)[1].replace(":", ""));
        if (time - currentTime <= 5) {
          element.click();
          return true;
        } else {
          return false;
        }
      },
      i,
      currentTimeNumber(),
    );
    if (moved) await page.waitForNavigation({ waitUntil: "networkidle2" });
  }
}

function currentTimeNumber() {
  const date = new Date();
  return date.getHours() * 100 + date.getMinutes();
}
