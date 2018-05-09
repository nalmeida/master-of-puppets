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
	const compressPng = util.compressPng;
	const toHHMMSS = util.toHHMMSS;
	const filenamify = util.filenamify;
	const newLogRow = util.newLogRow;
	const updateLogRow = util.updateLogRow;
	const endLogRow = util.endLogRow;

var setup;
var pages;
var compressImages;

var init = function(commandLineObject){

	util.logLevel = !isNaN(commandLineObject.loglevel) ? commandLineObject.loglevel : 1;
	setup = readJSON('setup.json');
		compressImages = setup.compressImages;
	pages = readJSON(setup.pages);
	// banner('Starting Screenshot');
	mkdir(setup.screenshotsFolder);

	captureScreenshots();
}

var startTime = new Date();

const captureScreenshots = async () => {

	var screenshotsFolder = setup.screenshotsFolder + '/' + timeStamp();
	
	mkdir(screenshotsFolder);
	// log('Creating "' + screenshotsFolder + '" folder\n');

	var urlsToTest = pages.pages;
	var lineCount = 0;
	
	for (var i=0; i < urlsToTest.length; i++) {
		
		var browser = await puppeteer.launch(setup.puppeteer.launch)
		var page = await browser.newPage();
		var slug = urlsToTest[i].url;
		var fullUrl = pages.domain + slug;
		var click = pages.pages[i].click;
		var devicesToEmulate = setup.puppeteer.emulate;

		for (device in devicesToEmulate) {

			lineCount++;

			var now = util.time();
			var fileName = i + '_' + filenamify(slug);
			var deviceFolder = screenshotsFolder + '/' + filenamify(devicesToEmulate[device].name.toLowerCase().replace(/ /g,'-'));
			var file = `${deviceFolder}/${fileName}.png`;

			mkdir(deviceFolder);

			// log('   Opening: ' + fullUrl);
			newLogRow(now + '\t' + fullUrl);

			await page.emulate(devicesToEmulate[device]);

			await page.goto(fullUrl);
			if(click) {
				for (selector in click) {
					await page.click(click[selector]);
				}
			}
			await page.mouse.move(0,0);
			updateLogRow(now + '\t' + fullUrl + '\t' + file);
			await page.screenshot({path: file, fullPage: true});
			endLogRow(now + '\t' + fullUrl + '\t' + file, lineCount);

			// log('    Saving: ' + file);

			// AQUI ta engazopando o log ...
			if(compressImages) {
				await compressPng(file, deviceFolder);
			}

		}

		await browser.close();
	}

	var timeDiff = ((new Date()) - startTime) / 1000;

	// banner('Proccess finished. Elapsed time: ' + toHHMMSS(timeDiff));
	// log('Files saved at: ' + screenshotsFolder + '\n')

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
				description: 'Print out helpful information.'
			},
			{
				name: 'loglevel',
				alias: 'l',
				typeLabel: '{underline number}',
				description: 'Log level. {italic Defalut 1}\n0=Silent, 1=Important only, 2=All.',
				defaultOption: 1
			}
		]
	}
]
const usage = commandLineUsage(sections)

const optionDefinitions = [
	{ name: 'help', alias: 'h' },
	{ name: 'loglevel', alias: 'l', type: Number },
	{ name: 'src', type: String, multiple: true, defaultOption: true },
	{ name: 'timeout', alias: 't', type: Number }
]
const options = commandLineArgs(optionDefinitions);

if(typeof(options.help) == 'object') {
	console.log(usage);
} else {
	init(options);
}