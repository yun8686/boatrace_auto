import puppeteer, { Page, Response } from "puppeteer";
const devices = puppeteer.devices;

export async function getBrowserPage(addLaunchOptions?: puppeteer.LaunchOptions) {
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox"],
    ...addLaunchOptions,
  };
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  const iPhone = devices["iPhone X"]; //デバイスはiPhone6を選択
  await page.emulate(iPhone); // デバイス適用
  return page;
}

export async function waitAndClick(page: Page, selector: string) {
  await page.waitForSelector(selector);
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
