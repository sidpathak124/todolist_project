const { Client } = require("pg");

const logQuery = (statement, parameters) => {
  const timestamp = new Date();
  const formattedTimestamp = timestamp.toString().substring(4, 24);
  console.log(formattedTimestamp, statement, parameters);
};

module.exports = {
  async dbQuery(statement, ...parameters) {
    let client = new Client({
      database: "todo_lists",
      username: "********",
      password: "********",
    });

    await client.connect();
    let result = await client.query(statement, parameters);
    logQuery(statement, parameters);
    await client.end();

    return result;
  },
};
