const config = require("../settings/mysql.setting.json");
import mysql from "mysql";

let connection: mysql.Connection;
const connectDatabase = async () => {
  connection = await mysql.createConnection(config);
  return new Promise<mysql.Connection>((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        reject("Connect Error mysql" + err.stack);
      }
      resolve(connection);
    });
  });
};

export const getConnection = async () => {
  return connection ? connection : await connectDatabase();
};
