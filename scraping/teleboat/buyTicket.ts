import { Page } from "puppeteer";
import { goHome } from "./common";

export async function buyTicket(page: Page) {
  await goHome(page);
}
