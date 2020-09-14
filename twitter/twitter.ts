import Twitter from "twitter";
import setting from "../settings/twitter.setting.json";
const client = new Twitter(setting);

exports.postTweet = (content: string) => {
  return new Promise((resolve, reject) => {
    client.post("statuses/update", { status: content }, function (error, _tweet, _response) {
      if (!error) {
        resolve("tweet success: " + content);
      } else {
        reject(error);
      }
    });
  });
};
