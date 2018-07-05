const fs = require('fs');
const puppeteer = require('puppeteer');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

const util = require('./util.js');
	const timeStamp = util.timeStamp;
	const mkdir = util.mkdir;
	const readJSON = util.readJSON;
	const banner = util.banner;
	const log = util.log;
	const toHHMMSS = util.toHHMMSS;
	const filenamify = util.filenamify;
	const newLogRow = util.newLogRow;
	const updateLogRow = util.updateLogRow;
	const endLogRow = util.endLogRow;
	const findDuplicates = util.findDuplicates;

var setup;
var authenticateUser;
var authenticatePass;
var pages;
var logLevel;
var urlsToTest;
var autoScroll;
var domainConfig;
var headlessConfig;
var authConfig;

var init = function(commandLineObject){

	util.logLevel = logLevel = !isNaN(commandLineObject.loglevel) ? commandLineObject.loglevel : 0;
	
	var setupFile = commandLineObject.pages || 'setup.json';
		domainConfig = commandLineObject.domain || undefined;
		headlessConfig = commandLineObject.headless || undefined;
		authConfig = commandLineObject.auth || undefined;


	setup = readJSON(setupFile);
		autoScroll = setup.autoScroll;

	pages = readJSON(setup.pages);
		urlsToTest = pages.pages;
		authenticateUser = pages.authenticate.username
		authenticatePass = pages.authenticate.password

	if(domainConfig != undefined) {
		pages.domain = domainConfig;
	}
	if(headlessConfig != undefined) {
		if(headlessConfig.toLowerCase() === 'false') headlessConfig = false;
		else if(headlessConfig.toLowerCase() === 'true') headlessConfig = true;

		setup.puppeteer.launch.headless = headlessConfig;
	}
	if(authConfig != undefined) {
		authenticateUser = authConfig.split(':')[0];
		authenticatePass = authConfig.split(':')[1];
	}

	var tmpArr = [];

	for (var i = 0; i < urlsToTest.length; i++) {
		tmpArr.push(urlsToTest[i].url)
	}

	var duplicateUrl = findDuplicates(tmpArr);
	if(duplicateUrl.length > 0) {
		console.error('Error: duplicate url found.\n' + (duplicateUrl.join('\r\n')));
		process.exit(1);
	}

	if(logLevel == 2) {
		banner('Starting Screenshot');
	}
	mkdir(setup.screenshotsFolder);

	captureScreenshots();
}

var startTime = new Date();

const scrollToBottom = function(page){
	// from: https://github.com/GoogleChrome/puppeteer/issues/844#issuecomment-338916722
    return page.evaluate(() => {
        return new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    window.scrollBy(0, 0);
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        })
    });
}

const captureScreenshots = async () => {

	var screenshotsFolder = setup.screenshotsFolder + '/' + timeStamp();
	
	mkdir(screenshotsFolder);
	if(logLevel == 2) {
		log('Creating "' + screenshotsFolder + '" folder\n');
	}

	var lineCount = 0;
	
	for (var i=0; i < urlsToTest.length; i++) {
		
		var browser = await puppeteer.launch(setup.puppeteer.launch)
		var page = await browser.newPage();
			if(authenticateUser != null && authenticatePass != null) {
				page.authenticate({username:authenticateUser, password: authenticatePass})
			}

		var slug = urlsToTest[i].url;
		var fullUrl = pages.domain + slug;
		var click = pages.pages[i].click;
		var waitFor = pages.pages[i].waitFor;
		var devicesToEmulate = setup.puppeteer.emulate;

		for (device in devicesToEmulate) {

			lineCount++;

			var now = (util.logLevel == 1 ? '\t': '') + util.time();
			var fileName = i + '_' + filenamify(slug);
			var deviceFolder = screenshotsFolder + '/' + filenamify(devicesToEmulate[device].name.toLowerCase().replace(/ /g,'-'));
			var file = `${deviceFolder}/${fileName}.jpg`;

			mkdir(deviceFolder);

			if(logLevel == 2) {
				log('URL:\t' + fullUrl);
			} else if(logLevel == 1) {
				newLogRow(now + '\t' + fullUrl)	;
			}

			await page.emulate(devicesToEmulate[device]);

			await page.goto(fullUrl);

			if(autoScroll) {
				await scrollToBottom(page);
			}

			if(click) {
				for (selector in click) {
					await page.click(click[selector]);
				}
			}
			if(waitFor) {
				await page.waitFor(waitFor)
			}
			await page.mouse.move(0,0);
			await page.screenshot({path: file, fullPage: true});

			if(logLevel == 2) {
				log('IMG:\t' + file);
			}
			
			if(logLevel == 1) {
				endLogRow(now + '\t' + fullUrl + '\t' + file, lineCount);  
			}

		}

		await browser.close();
	}


	if(logLevel == 2) {
		var timeDiff = ((new Date()) - startTime) / 1000;
		banner('Proccess finished. Elapsed time: ' + toHHMMSS(timeDiff));
		log('Files saved at: ' + screenshotsFolder + '\n')
	}

}

const sections = [
	{
		header: 'Master of Puppets Screnshot',
		content: 'Generates screenshots from a page list using Puppeteer and Chromium.'
	},
	{
    header: 'Synopsis',
    content: [
      '$ node screenshot <options>\n',
      '$ node screenshot {italic --help}\n',
      '$ node screenshot {italic --loglevel 1} {italic --headless false} {italic --pages anotherfile.json} {italic --domanin http://www.myanotherdomain.com} {italic --auth myuser:MyP4ssw0rd}\n',
      '$ node screenshot {italic -l 1} {italic -h false} {italic -p anotherfile.json} {italic -d http://www.myanotherdomain.com} {italic -a myuser:MyP4ssw0rd}'
    ]
  },
	{
		header: 'Options List',
		optionList: [
			{
				name: 'help',
				alias: 'h',
				description: 'Print out helpful information.'
			},
			{
				name: 'loglevel',
				alias: 'l',
				typeLabel: '{underline Number}',
				description: 'Log level. {italic Default 0}\n0=Silent, 1=Important only, 2=All.',
				defaultOption: 0
			},
			{
				name: 'domain',
				alias: 'd',
				typeLabel: '{underline String}',
				description: 'Main domain to be tested. When set, it {underline OVERRIDES} the "doamin" parameter from the {italic pages.json} file.'
			},
			{
				name: 'auth',
				alias: 'a',
				typeLabel: '{underline String}:{underline String}',
				description: '{underline username}:{underline password} for the http authentication. When set, it {underline OVERRIDES} the "authenticate" parameter from the {italic pages.json} file.'
			},
			{
				name: 'headless',
				alias: 'e',
				typeLabel: '{underline Boolean}',
				description: 'Set Puppeteer to run in the headless mode. When set, it {underline OVERRIDES} the "headless" parameter from the {italic setup.json} file.'
			},
			{
				name: 'pages',
				alias: 'p',
				typeLabel: '{underline String}',
				description: 'The path to the {italic pages.json} file. Default option uses {italic pages.json} from the root of the project.'
			}
		]
	}
]
const usage = commandLineUsage(sections)

const optionDefinitions = [
	{ name: 'help', alias: 'h' },
	{ name: 'loglevel', alias: 'l', type: Number },
	{ name: 'domain', alias: 'd', type: String},
	{ name: 'auth', alias: 'a', type: String},
	{ name: 'headless', alias: 'e', type: String},
	{ name: 'pages', alias: 'p', type: String}
]
const options = commandLineArgs(optionDefinitions);

if(typeof(options.help) == 'object') {
	console.log(usage);
} else {
	init(options);
}