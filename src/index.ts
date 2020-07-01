import { Main } from './services/main';
import { config } from './config/credentials.env';

const main = new Main({
  login: config.credentials.login,
  password: config.credentials.password
});

main.init().then(() => {
  main.work();
});
