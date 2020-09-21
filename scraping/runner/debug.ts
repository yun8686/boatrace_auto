import { login } from "../teleboat/login";
import { buyTicket, checkDeposit } from "../teleboat/buyTicket";

(async () => {
  const page = await login({ headless: true });
  await checkDeposit(page, 100);
  console.log("ok");
})();
