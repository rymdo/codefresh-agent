import { Cli } from "./cli";

function main() {
  const cli = new Cli();
  cli.run();
}

process.on("SIGINT", () => {
  console.log("Caught interrupt signal");
  process.exit();
});

main();
