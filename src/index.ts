import { Main } from './services/main';
import { config } from './config/credentials.env';

const main = new Main({
  login: config.credentials.login,
  password: config.credentials.password
});

main.init().then(() => {
  try {
    main.work();
  } catch (e) {
    console.log('Caught an error, going to kill the process', e);
    process.exit(0);
  }
});
