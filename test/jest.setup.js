// Intercept process.exit so commands that bail out don't kill the Jest worker
const realExit = process.exit.bind(process);
process.exit = function interceptedExit(code) {
  throw new Error(`process.exit(${code})`);
};
process.exit.realExit = realExit;
