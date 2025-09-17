const puppeteer = require('puppeteer');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const util = require('./helpers/util.js');

const {
	timeStamp,
	mkdir,
	readJSON,
	log,
	filenamify,
	newLogRow,
	endLogRow,
	findDuplicates,
} = util;

// Full list from: https://www.bannerbear.com/blog/ways-to-speed-up-puppeteer-screenshots/
const minimalArgs = [
	'--autoplay-policy=user-gesture-required',
	'--disable-background-networking',
	'--disable-background-timer-throttling',
	'--disable-backgrounding-occluded-windows',
	'--disable-breakpad',
	'--disable-client-side-phishing-detection',
	'--disable-component-update',
	'--disable-default-apps',
	'--disable-dev-shm-usage',
	'--disable-domain-reliability',
	'--disable-extensions',
	'--disable-features=AudioServiceOutOfProcess',
	'--disable-hang-monitor',
	'--disable-ipc-flooding-protection',
	'--disable-notifications',
	'--disable-offer-store-unmasked-wallet-cards',
	'--disable-popup-blocking',
	'--disable-print-preview',
	'--disable-prompt-on-repost',
	'--disable-renderer-backgrounding',
	'--disable-setuid-sandbox',
	'--disable-speech-api',
	'--disable-sync',
	'--hide-scrollbars',
	'--ignore-gpu-blacklist',
	'--metrics-recording-only',
	'--mute-audio',
	'--no-default-browser-check',
	'--no-first-run',
	'--no-pings',
	'--no-sandbox', // Be careful with this in production environments
	'--no-zygote',
	'--password-store=basic',
	'--use-gl=swiftshader',
	'--use-mock-keychain',
];

let setup, logLevel, urlsToTest, autoScroll, domainConfig, headlessConfig, authConfig;

const initialize = (commandLineObject) => {
	logLevel = !isNaN(commandLineObject.loglevel) ? commandLineObject.loglevel : 0;
	util.logLevel = logLevel;

	setup = readJSON('setup.json');
	autoScroll = setup.autoScroll;

	domainConfig = commandLineObject.domain;
	headlessConfig = commandLineObject.headless;
	authConfig = commandLineObject.auth;

	if (commandLineObject.pages) {
		setup.pages = commandLineObject.pages;
	}

	const pages = readJSON(setup.pages);
	urlsToTest = pages.pages;

	if (domainConfig) {
		pages.domain = domainConfig;
	}

	if (headlessConfig) {
		setup.puppeteer.launch.headless = headlessConfig.toLowerCase() === 'true';
	}

	if (authConfig) {
		const [username, password] = authConfig.split(':');
		setup.authenticate = { username, password };
	}

	setup.puppeteer.launch.args = minimalArgs;

	validateUrls(urlsToTest);
	mkdir(setup.screenshotsFolder);
	captureScreenshots(pages);
};

const validateUrls = (urls) => {
	const duplicateUrls = findDuplicates(urls.map((url) => url.url));
	if (duplicateUrls.length > 0) {
		console.error('Error: duplicate URLs found:', duplicateUrls.join('\n'));
		process.exit(1);
	}
};

const captureScreenshots = async (pages) => {
	const screenshotsFolder = `${setup.screenshotsFolder}/${timeStamp()}`;
	mkdir(screenshotsFolder);

	if (logLevel === 2) {
		log(`Starting screenshot capture in folder: ${screenshotsFolder}`);
		log(`Creating folder: ${screenshotsFolder}`);
	}

	for (const [index, { url, click, waitFor }] of urlsToTest.entries()) {
		const fullUrl = `${pages.domain}${url}`;

		try {
			const browser = await puppeteer.launch(setup.puppeteer.launch);
			const page = await browser.newPage();

			if (setup.authenticate) {
				await page.authenticate(setup.authenticate);
			}

			for (const device of setup.puppeteer.emulate) {
				const deviceFolder = `${screenshotsFolder}/${filenamify(device.name.toLowerCase().replace(/ /g, '-'))}`;
				mkdir(deviceFolder);

				const fileName = `${index}_${filenamify(url)}.jpg`;
				const filePath = `${deviceFolder}/${fileName}`;

				if (logLevel === 2) {
					log(`Capturing screenshot for: ${fullUrl} on device: ${device.name}`);
				} else if (logLevel === 1) {
					newLogRow(`Capturing: ${fullUrl}`);
				}

				await page.emulate(device);
				await page.goto(fullUrl, { waitUntil: 'networkidle0' });

				if (autoScroll) {
					await scrollPage(page);
				}

				if (click) {
					for (const selector of click) {
						await page.click(selector);
					}
				}

				if (waitFor) {
					await page.waitFor(waitFor);
				}

				await page.screenshot({ path: filePath, fullPage: true });

				if (logLevel === 2) {
					log(`Saved screenshot: ${filePath}`);
				} else if (logLevel === 1) {
					endLogRow(`Saved: ${filePath}`, '✔');
				}
			}

			await browser.close();
		} catch (error) {
			console.error(`Error capturing screenshot for ${fullUrl}:`, error);
		}
	}

	if (logLevel === 2) {
		log(`Screenshot capture completed in folder: ${screenshotsFolder}`);
	}
};

const scrollPage = async (page) => {
	const bodyHandle = await page.$('body');
	const { height } = await bodyHandle.boundingBox();
	await bodyHandle.dispose();

	const viewportHeight = page.viewport().height;
	let viewportIncr = 0;

	while (viewportIncr + viewportHeight < height) {
		await page.evaluate((vh) => window.scrollBy(0, vh), viewportHeight);
		await new Promise((resolve) => setTimeout(resolve, 700));
		viewportIncr += viewportHeight;
	}

	await page.evaluate(() => window.scrollTo(0, 0));
	await new Promise((resolve) => setTimeout(resolve, 1000));
};

const sections = [
	{
		header: 'Master of Puppets Screenshot',
		content: 'Generates screenshots from a page list using Puppeteer and Chromium.',
	},
	{
		header: 'Synopsis',
		content: [
			'$ node screenshot <options>',
			'$ node screenshot --help',
			'$ node screenshot --loglevel 1 --headless false --pages anotherfile.json --domain http://example.com --auth user:pass',
		],
	},
	{
		header: 'Options List',
		optionList: [
			{ name: 'help', alias: 'h', description: 'Print out helpful information.' },
			{ name: 'loglevel', alias: 'l', typeLabel: '{underline Number}', description: 'Log level. Default 0.\n0=Silent, 1=Important only, 2=All.', defaultOption: 0 },
			{ name: 'domain', alias: 'd', typeLabel: '{underline String}', description: 'Main domain to be tested.' },
			{ name: 'auth', alias: 'a', typeLabel: '{underline String}:{underline String}', description: 'HTTP authentication credentials.' },
			{ name: 'headless', alias: 'e', typeLabel: '{underline Boolean}', description: 'Run Puppeteer in headless mode.' },
			{ name: 'pages', alias: 'p', typeLabel: '{underline String}', description: 'Path to the pages.json file.' },
		],
	},
];

const usage = commandLineUsage(sections);
const optionDefinitions = [
	{ name: 'help', alias: 'h' },
	{ name: 'loglevel', alias: 'l', type: Number },
	{ name: 'domain', alias: 'd', type: String },
	{ name: 'auth', alias: 'a', type: String },
	{ name: 'headless', alias: 'e', type: String },
	{ name: 'pages', alias: 'p', type: String },
];

const options = commandLineArgs(optionDefinitions);

if (options.help) {
	console.log(usage);
} else {
	initialize(options);
}