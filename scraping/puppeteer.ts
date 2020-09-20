import puppeteer, { Page, Response, devices } from "puppeteer";
import { waitSelector } from "./teleboat/common";

let browser: puppeteer.Browser;

export async function getBrowserPage(addLaunchOptions?: puppeteer.LaunchOptions) {
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox"],
    ...addLaunchOptions,
  };
  browser = await puppeteer.launch(launchOptions);
  return getMainPage();
}

const PageMap: { [key: string]: Page } = {
  mainPage: null,
  buyTicketPage: null,
};
export async function getMainPage() {
  if (PageMap.mainPage) return PageMap.mainPage;
  PageMap.mainPage = await browser.newPage();
  await PageMap.mainPage.emulate(puppeteer.devices["iPhone X"]);
  return PageMap.mainPage;
}
export async function getBuyTicketPage() {
  if (PageMap.buyTicketPage) return PageMap.buyTicketPage;
  PageMap.buyTicketPage = await browser.newPage();
  await PageMap.buyTicketPage.emulate(puppeteer.devices["iPhone X"]);
  return PageMap.buyTicketPage;
}

export async function waitAndClick(page: Page, selector: string) {
  await waitSelector(page, selector);
  await page.click(selector);
}

export function getRequestPayload(response: Response) {
  const postData = response.request().postData();
  return postData ? JSON.parse(postData) : {};
}
export async function getResponseData(response: Response, charCode: BufferEncoding = "utf-8") {
  const buf = await response.buffer();
  return JSON.parse(buf.toString(charCode, 0, buf.length));
}
