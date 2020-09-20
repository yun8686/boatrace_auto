import { login } from "../teleboat/login";
import { buyTicket } from "../teleboat/buyTicket";

(async () => {
  const page = await login({ headless: false });
  await buyTicket(page);
})();
