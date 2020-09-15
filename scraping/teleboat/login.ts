import { getBrowserPage } from "../puppeteer";
import teleboat from "../../settings/teleboat.setting.json";
import { Page } from "puppeteer";

export async function login(page?: Page) {
  if (!page) {
    page = await getBrowserPage();
  } else {
    return;
  }
  await page.goto("https://spweb.brtb.jp/account");
  let loadPromise = page.waitForNavigation();
  const disabledLoginButton = await page.evaluate(() => {
    return document.querySelectorAll(".btn-login.is-disabled").length;
  });
  console.log("disabledLoginButton", disabledLoginButton);
  if (disabledLoginButton > 0) {
    throw "login disabled";
  }

  await page.click(".btn-login");
  await loadPromise;

  await page.waitForSelector(".login-input-table tr:nth-of-type(1) .textbox");
  await page.type(".login-input-table tr:nth-of-type(1) .textbox", teleboat.memberNo);
  await page.type(".login-input-table tr:nth-of-type(2) .textbox", teleboat.pin);
  await page.type(".login-input-table tr:nth-of-type(3) .textbox", teleboat.authNo);

  loadPromise = page.waitForNavigation();
  await page.click(".btn-login");
  await loadPromise;
  return page;
}
