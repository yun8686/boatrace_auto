import { Page } from "puppeteer";
import { goHome, waitNavigation, sleep } from "./common";
import { waitAndClick } from "../puppeteer";
import { BuyStatus } from "./models/BuyData";

type Parameter = {
  jyoCode: string;
  raceNo: string;
  oddsType: "rentan3" | "rentan2";
  kumiban: string;
  price: number;
};
export async function buyTicket(page: Page, param: Parameter, isDebug?: boolean): Promise<BuyStatus> {
  await checkDeposit(page, param.price);

  await waitAndClick(page, `.jyo-list li:nth-child(${parseInt(param.jyoCode)}) div`);
  await waitNavigation(page);

  await waitAndClick(page, ".btn-select-race");
  await waitNavigation(page);
  const raceDisabled = await page.evaluate((selector) => {
    return document.querySelector(selector).disabled;
  }, `.race-select #race-${parseInt(param.raceNo)}`);
  console.log("raceDisabled", raceDisabled);
  if (raceDisabled) {
    console.log("race is already closed", param);
    await waitAndClick(page, ".modal-close");
    await sleep(1000);
    await goHome(page);
    return "closed";
  }
  await waitAndClick(page, `.race-select #race-${parseInt(param.raceNo)}`);
  await waitNavigation(page);

  switch (param.oddsType) {
    case "rentan3": {
      await page.evaluate((kumiban) => {
        (document.querySelector(`#bet1-${kumiban.split("-")[0]}`) as HTMLInputElement).click();
        (document.querySelector(`#bet2-${kumiban.split("-")[1]}`) as HTMLInputElement).click();
        (document.querySelector(`#bet3-${kumiban.split("-")[2]}`) as HTMLInputElement).click();
      }, param.kumiban);
      await page.type(".input-money-block input", (~~(param.price / 100)).toString());
    }
    default: {
    }
  }
  await page.evaluate(() => {
    (document.querySelector(".btn-inverse") as HTMLInputElement).click();
  });
  await waitNavigation(page);
  await page.evaluate(() => {
    (document.querySelector(".btn-purchase") as HTMLInputElement).click();
  });
  await waitNavigation(page);

  await page.type(".input-money-block input", param.price.toString());
  console.log("isDebug", isDebug);
  const logtime = new Date().getTime();
  if (!isDebug) {
    await sleep(500);
    await page.evaluate(() => {
      (document.querySelector(".btn-purchase") as HTMLInputElement).click();
    });
  }
  console.log("buy complete!", param);
  await goHome(page);
  return "complete";
}

export async function checkDeposit(page, minimumPrice: number) {
  await goHome(page);
  try {
    await page.evaluate(() => {
      (document.querySelector(".payment") as HTMLInputElement).click();
    });
  } catch (e) {
    await page.screenshot({
      path: `./checkdeposit_error.png`,
    });
    throw e;
  }
  await waitNavigation(page);
  const deposit = await page.evaluate(() => {
    return parseInt((document.querySelectorAll(".deposit-table dd")[2] as HTMLInputElement).innerText.replace(",", ""));
  });

  if (deposit < minimumPrice) {
    await page.type(".input-money-block input", Math.ceil(minimumPrice / 1000).toString());
    await page.evaluate(() => {
      (document.querySelector(".btn-inverse") as HTMLInputElement).click();
    });
    await waitNavigation(page);
  }
  await waitAndClick(page, ".modal-close");
  await sleep(1000);
}
