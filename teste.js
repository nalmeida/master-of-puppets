const ora = require('ora');

const spinner = ora('Loading unicorns').start();

setTimeout(() => {
	spinner.fail ('Loading FAIL');
}, 1000);

setTimeout(() => {
	spinner.stop ();
}, 2000);

setTimeout(() => {
	spinner.warn ('Loading WARN');
}, 3000);

setTimeout(() => {
	spinner.succeed ('Loading SUCCESS');
}, 3000);