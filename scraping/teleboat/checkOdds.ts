import { Page } from "puppeteer";
import { goHome, waitNavigation, sleep } from "./common";
import { waitAndClick } from "../puppeteer";

type Params = {
  limitDiff: number; // 何分前に取得するか
};
export async function getNextRaces(page: Page, params: Params) {
  await goHome(page);
  try {
    await page.waitForSelector(".react-swipeable-view-container>div:nth-child(2)");
  } catch (e) {
    console.log(e);
    throw e;
  }
  const raceLength = await page.evaluate(() => {
    return document.querySelectorAll(".react-swipeable-view-container>div:nth-child(2) .deadline-list-item .jyo-panel").length;
  });
  console.log("raceLength", raceLength);
  for (let i = 0; i < raceLength; i++) {
    await sleep(1000);
    await goHome(page);
    await waitAndClick(page, ".top-nav-link.deadline");
    const retObj = await page.evaluate(
      (index, currentTime, limitDiff) => {
        const element = document.querySelectorAll(".react-swipeable-view-container>div:nth-child(2) .deadline-list-item .jyo-panel")[
          index
        ] as HTMLElement;
        const time =
          parseInt(element.innerText.match(/締切予定時刻(\d+:\d+)/)[1].split(":")[0]) * 60 +
          parseInt(element.innerText.match(/締切予定時刻(\d+:\d+)/)[1].split(":")[1]);
        if (time - currentTime <= limitDiff) {
          element.click();
          return { moved: true, time, currentTime, limitDiff };
        } else {
          return { moved: false, time, currentTime, limitDiff };
        }
      },
      i,
      currentTimeNumber(),
      params.limitDiff,
    );
    console.log("retObj", retObj);
    if (retObj.moved) await page.waitForNavigation({ waitUntil: "networkidle0" });
  }
}

function currentTimeNumber() {
  const date = new Date();
  return date.getHours() * 60 + date.getMinutes();
}
