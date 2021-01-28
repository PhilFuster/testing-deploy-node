const fs = require("fs");

const path = `${__dirname}/logs/logs.txt`;

function log(buffer) {
  fs.appendFile(path, `\n${Date.now()} - ${buffer}`, (err) => {
    if (err) throw err;
    console.log("wrote to logs");
  });
}

module.exports = log;
