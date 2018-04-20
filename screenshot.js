const fs = require('fs');
const puppeteer = require('puppeteer');
const util = require('./util.js');
	const timeStamp = util.timeStamp;
	const mkdir = util.mkdir;
	const readJSON = util.readJSON;
	const banner = util.banner;
	const log = util.log;
	const compressPng = util.compressPng;
	const toHHMMSS = util.toHHMMSS;
	const filenamify = util.filenamify;

var setup;
var pages;
var compressImages;

var init = function(){
	setup = readJSON('setup.json');
		util.logLevel = setup.logLevel;
	pages = readJSON(setup.pages);
	banner('Starting Screenshot');
	compressImages = setup.compressImages;
	mkdir(setup.screenshotsFolder);

	captureScreenshots();

}

var startTime = new Date();

const captureScreenshots = async () => {

	var screenshotsFolder = setup.screenshotsFolder + '/' + timeStamp();
	
	mkdir(screenshotsFolder);
	log('Creating "' + screenshotsFolder + '" folder\n');

	var urlsToTest = pages.pages;
	
	for (var i=0; i < urlsToTest.length; i++) {
		
		var browser = await puppeteer.launch(setup.puppeteer.launch)
		var page = await browser.newPage();
		var slug = urlsToTest[i].url;
		var fullUrl = pages.domain + slug;
		var click = pages.pages[i].click;
		var devicesToEmulate = setup.puppeteer.emulate;

		for (device in devicesToEmulate) {

			var fileName = i + '_' + filenamify(slug);
			var deviceFolder = screenshotsFolder + '/' + filenamify(devicesToEmulate[device].name.toLowerCase().replace(/ /g,'-'));
			var file = `${deviceFolder}/${fileName}.png`;

			mkdir(deviceFolder);

			await page.emulate(devicesToEmulate[device]);

			log('Opening   : ' + fullUrl);
			await page.goto(fullUrl);
			if(click) {
				for (selector in click) {
					await page.click(click[selector]);
				}
			}
			await page.mouse.move(0,0);
			await page.screenshot({path: file, fullPage: true});
			log('  Saving  : ' + file);

			if(compressImages) {
				await compressPng(file, deviceFolder);
			} 

		}

		await browser.close();
	}

	var timeDiff = ((new Date()) - startTime) / 1000;

	banner('Proccess finished. Elapsed time: ' + toHHMMSS(timeDiff));
	log('Files saved at: ' + screenshotsFolder + '\n')

}

init();