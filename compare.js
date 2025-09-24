const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const compareImages = require("resemblejs/compareImages");

var path = require("path");
const fs = require("mz/fs");
const util = require('./util.js');
const log = util.log;
const readJSON = util.readJSON;
const mkdir = util.mkdir;
const rm = util.rm;
const addSlash = util.addSlash;
const getRecursiveFileList = util.getRecursiveFileList;

var setup;
var logLevel;
var diffFolder;
var baseFolder;
var compareFolder;
var dryRun;
var resembleOptions;

const init = function (commandLineObject) {

	util.logLevel = logLevel = !isNaN(commandLineObject.loglevel) ? commandLineObject.loglevel : 0;
	setup = readJSON('setup.json');
	diffFolder = setup.diffFolder;
	resembleOptions = setup.resembleOptions;

	dryRun = typeof (commandLineObject['dry-run']) == 'object' ? true : false;

	baseFolder = path.resolve(addSlash(commandLineObject.base));
	compareFolder = path.resolve(addSlash(commandLineObject.compare));

	var fullBaseList = (getRecursiveFileList(addSlash(commandLineObject.base)))
	// var fullCompareList = (getRecursiveFileList(addSlash(commandLineObject.compare)))

	if (dryRun === false) {
		rm(diffFolder);
		mkdir(diffFolder);
	}

	getDiff(fullBaseList);
}

async function getDiff(fullBaseList) {

	// log('Base Folder:');
	// log(fullBaseList);
	// log('Compare Folder:');
	// log(fullCompareList);

	var destinationFolder = addSlash(diffFolder);

	for (var i = 0; i < fullBaseList.length; i++) {

		var baseFilePath = path.resolve(fullBaseList[i]);
		var compareFilePath = baseFilePath.replace(baseFolder, compareFolder);

		var fileName = baseFilePath.split('/').slice(-1).toString();
		var resFolder = baseFilePath.split('/').slice(-2, -1).toString();
		var options = resembleOptions;
		var fileA = fileB = null;

		try {
			fileA = await fs.readFile(baseFilePath);
		} catch (e) {
			console.error('\n Error: fileA fs.readFile\n', e);
		}

		try {
			fileB = await fs.readFile(compareFilePath);
		} catch (e) {
			console.error('\n Error: fileB fs.readFile\n', e);
		}

		// console.log(Boolean(fileB) + ' ' + baseFilePath + ' → ' + compareFilePath + '\n')

		if (!Boolean(fileB)) {
			if (logLevel > 0 || dryRun) {
				log(baseFilePath + '\t ONLY AT BASE');
			}
			continue;
		}

		try {
			var data = await compareImages(
				fileA,
				fileB,
				options
			);
		} catch (e) {
			console.error('\n Error: compareImages\n', e);
		}

		var diffFile = addSlash(destinationFolder) + addSlash(resFolder) + fileName;

		if (logLevel > 0 || dryRun) {
			log(diffFile + '\t' + (Number(data.misMatchPercentage) / 100).toString().replace('.', ','));
		}

		if (dryRun === false) {
			mkdir(destinationFolder);
			mkdir(addSlash(destinationFolder) + addSlash(resFolder))

			try {
				await fs.writeFile(diffFile, data.getBuffer());
			} catch (e) {
				console.error('\n Error: fs.writeFile\n', e);
			}
		}

	}

}

const sections = [
	{
		header: 'Master of Puppets Compare',
		content: 'Visual compare screenshots taken using screenshots.js using ResembleJS.'
	},
	{
		header: 'Synopsis',
		content: [
			'$ node compare <base> <compare> <options>\n',
			'$ node compare {italic --help}\n',
			'$ node compare {italic --loglevel 1} {italic --base screenshots/prodFolder} {italic --compare screenshots/stageFolder} {italic --dry-run}\n',
			'$ node compare {italic -l 1} {italic -b screenshots/prodFolder} {italic -c screenshots/stageFolder} {italic -d}\n'
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
				typeLabel: '{italic Number}',
				description: 'Log level. {italic Defalut 0}\n0=Silent, 1=Important only, 2=All.',
				defaultOption: 0
			},
			{
				name: 'base',
				alias: 'b',
				typeLabel: '{italic String}',
				description: 'Path to the folder used as the base for comparison.'
			},
			{
				name: 'compare',
				alias: 'c',
				typeLabel: '{italic String}',
				description: 'Path to the folder used for comparison against the base folder.'
			},
			{
				name: 'dry-run',
				alias: 'd',
				description: 'Compares the images without saving the diff files.'
			},
			{
				name: 'setup',
				alias: 's',
				typeLabel: '{italic String}',
				description: 'Path to the setup file in JSON format.',
				defaultOption: 'setup.json'
			}
		]
	}
]
const usage = commandLineUsage(sections)

const optionDefinitions = [
	{ name: 'help', alias: 'h' },
	{ name: 'base', alias: 'b', type: String },
	{ name: 'compare', alias: 'c', type: String },
	{ name: 'loglevel', alias: 'l', type: Number },
	{ name: 'setup', alias: 's', type: String },
	{ name: 'dry-run', alias: 'd' }
];

const options = commandLineArgs(optionDefinitions);

const setupFile = options.setup || 'setup.json'; // Default to setup.json if not provided
setup = readJSON(setupFile);

if (typeof (options.help) == 'object') {
	console.log(usage);
} else {
	init(options);
}