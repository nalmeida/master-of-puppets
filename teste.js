const ora = require('ora');

const spinner = ora();

newLogRow = function(str) {
	spinner.color = 'blue';
	spinner.text = str;
	spinner.start();	
}

updateLogRow = function(str, color) {
	spinner.clear();
	spinner.color = color || 'yellow';
	spinner.text = str;
}

endLogRow = function(str, symbol) {
	spinner.text = str;
	spinner.stopAndPersist({symbol:symbol});
}


newLogRow('\t16:47:593\thttps://www.toyota.com.br/');

setTimeout(() => {
	updateLogRow('	16:47:593	https://www.toyota.com.br/	screenshots/2018.05.08-16.47.130/chrome-1280/0_!.png');
}, 2000);

setTimeout(() => {
	endLogRow('	11:11:111	https://www.toyota.com.br/	screenshots/2018.05.08-16.47.130/chrome-1280/0_!.png', 1);
}, 4000);

setTimeout(() => {
	newLogRow('	22:22:222	https://www.toyota.com.br/?asdasdsad');
}, 4001);

setTimeout(() => {
	updateLogRow('	22:22:222	https://www.toyota.com.br/	screenshots/2018.05.08-16.47.130/chrome-1280/0_!.png');
}, 6000);

setTimeout(() => {
	endLogRow('	22:22:222	https://www.toyota.com.br/	screenshots/2018.05.08-16.47.130/chrome-1280/0_!.png', 2);
	console.log("finito")
}, 8000);