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
var pages;
var logLevel;
var urlsToTest;

var init = function(commandLineObject){

	util.logLevel = logLevel = !isNaN(commandLineObject.loglevel) ? commandLineObject.loglevel : 0;
	setup = readJSON('setup.json');
	pages = readJSON(setup.pages);
		urlsToTest = pages.pages;

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

const autoScroll = function(page){
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

			await autoScroll(page);

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
		content: 'Generates screenshots from a page list using Puppeteer and Chromium'
	},
	{
		header: 'Options',
		optionList: [
			{
				name: 'help',
				alias: 'h',
				description: 'Print out helpful information.'
			},
			{
				name: 'loglevel',
				alias: 'l',
				typeLabel: '{underline number}',
				description: 'Log level. {italic Defalut 0}\n0=Silent, 1=Important only, 2=All.',
				defaultOption: 0
			}
		]
	}
]
const usage = commandLineUsage(sections)

const optionDefinitions = [
	{ name: 'help', alias: 'h' },
	{ name: 'loglevel', alias: 'l', type: Number },
	{ name: 'domain', alias: 'd', type: String},
	{ name: 'pages', alias: 'p', type: String},
	{ name: 'timeout', alias: 't', type: Number }
]
const options = commandLineArgs(optionDefinitions);

if(typeof(options.help) == 'object') {
	console.log(usage);
} else {
	init(options);
}