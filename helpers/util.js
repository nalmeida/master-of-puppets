const fs = require('fs');
const path = require('path');
const filenamify = require('filenamify');
const ora = require('ora');
const spinner = ora();

let logLevel = 0;

const l2 = (s) => String(s).padStart(2, '0');

const newLogRow = (str) => {
	if (logLevel === 1) {
		spinner.color = 'red';
		spinner.text = str;
		spinner.start();
	}
};

const updateLogRow = (str, color = 'yellow') => {
	if (logLevel === 1) {
		spinner.color = color;
		spinner.text = str;
	}
};

const endLogRow = (str, symbol) => {
	if (logLevel === 1) {
		spinner.text = str;
		spinner.stopAndPersist({ symbol });
	}
};

const log = (str) => {
	if (logLevel) {
		console.log(`${time()}\t${str}`);
	}
};

const banner = (str) => log(`----------- ${str} -----------`);

const addSlash = (str) => (str.endsWith('/') ? str : `${str}/`);

const findDuplicates = (arr) => {
	const counts = {};
	return arr.filter((item) => {
		counts[item] = (counts[item] || 0) + 1;
		return counts[item] === 2;
	});
};

const isFolder = (str) => fs.statSync(str).isDirectory();

const readJSON = (file) => {
	const content = fs.readFileSync(file, 'utf8');
	if (logLevel > 1) log(`Reading file: ${file}\n${content}`);
	return JSON.parse(content);
};

const mkdir = (dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
};

const rm = (dirPath) => {
	if (fs.existsSync(dirPath)) {
		fs.readdirSync(dirPath).forEach((file) => {
			const curPath = path.join(dirPath, file);
			if (fs.lstatSync(curPath).isDirectory()) {
				rm(curPath);
			} else {
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(dirPath);
	}
};

const time = () => {
	const d = new Date();
	const mili = d.getMilliseconds();
	return `${l2(d.getHours())}:${l2(d.getMinutes())}:${l2(mili < 100 ? mili + '0' : mili)}`;
};

const timeStamp = () => {
	const d = new Date();
	return `${d.getFullYear()}.${l2(d.getMonth() + 1)}.${l2(d.getDate())}-${time().replace(/:/g, '.')}`;
};

const toHHMMSS = (str) => {
	const secNum = parseInt(str, 10);
	const hours = l2(Math.floor(secNum / 3600));
	const minutes = l2(Math.floor((secNum % 3600) / 60));
	const seconds = l2(secNum % 60);
	return `${hours}:${minutes}:${seconds}`;
};

const remapInternationalCharToAscii = (str) => {
	const defaultDiacriticsRemovalMap = [
		{ base: 'A', letters: /[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g },
		// ... (truncated for brevity)
	];

	defaultDiacriticsRemovalMap.forEach(({ letters, base }) => {
		str = str.replace(letters, base);
	});

	return str;
};

const filenamifyWrapper = (string, options) => filenamify(remapInternationalCharToAscii(string), options);

const getRecursiveFileList = (dir, filelist = []) => {
	const files = fs.readdirSync(dir);
	files.forEach((file) => {
		const fullPath = path.join(dir, file);
		if (fs.statSync(fullPath).isDirectory()) {
			getRecursiveFileList(fullPath, filelist);
		} else if (['png', 'jpg'].includes(file.slice(-3))) {
			filelist.push(addSlash(dir) + file);
		}
	});
	return filelist;
};

module.exports = {
	...module.exports,
	logLevel,
	set logLevel(value) {
		logLevel = value;
	},
	get logLevel() {
		return logLevel;
	},
	l2,
	newLogRow,
	updateLogRow,
	endLogRow,
	log,
	banner,
	addSlash,
	findDuplicates,
	isFolder,
	readJSON,
	mkdir,
	rm,
	time,
	timeStamp,
	toHHMMSS,
	filenamify: filenamifyWrapper,
	getRecursiveFileList,
};