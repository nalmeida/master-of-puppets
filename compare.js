const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const compareImages = require('resemblejs/compareImages');
const path = require('path');
const fs = require('mz/fs');
const util = require('./helpers/util.js');

const {
	log,
	readJSON,
	mkdir,
	rm,
	addSlash,
	getRecursiveFileList,
} = util;

let setup, logLevel, diffFolder, baseFolder, compareFolder, dryRun, resembleOptions;

const initialize = (commandLineObject) => {
	logLevel = !isNaN(commandLineObject.loglevel) ? commandLineObject.loglevel : 0;
	util.logLevel = logLevel;

	setup = readJSON('setup.json');
	({ diffFolder, resembleOptions } = setup);

	dryRun = Boolean(commandLineObject['dry-run']);
	baseFolder = path.resolve(addSlash(commandLineObject.base));
	compareFolder = path.resolve(addSlash(commandLineObject.compare));

	const fullBaseList = getRecursiveFileList(addSlash(commandLineObject.base));

	if (!dryRun) {
		rm(diffFolder);
		mkdir(diffFolder);
	}

	processDiffs(fullBaseList);
};

const processDiffs = async (fullBaseList) => {
	const destinationFolder = addSlash(diffFolder);

	for (const baseFilePath of fullBaseList) {
		const compareFilePath = baseFilePath.replace(baseFolder, compareFolder);
		const fileName = path.basename(baseFilePath);
		const resFolder = path.basename(path.dirname(baseFilePath));
		const options = resembleOptions;

		try {
			const fileA = await fs.readFile(baseFilePath);
			const fileB = await fs.readFile(compareFilePath).catch(() => null);

			if (!fileB) {
				if (logLevel > 0 || dryRun) {
					log(`${baseFilePath}\t ONLY AT BASE`);
				}
				continue;
			}

			const data = await compareImages(fileA, fileB, options);
			const diffFile = path.join(destinationFolder, resFolder, fileName);

			if (logLevel > 0 || dryRun) {
				log(`${diffFile}\t${(data.misMatchPercentage / 100).toFixed(2)}`);
			}

			if (!dryRun) {
				mkdir(path.join(destinationFolder, resFolder));
				await fs.writeFile(diffFile, data.getBuffer());
			}
		} catch (error) {
			console.error(`Error processing ${baseFilePath}:`, error);
		}
	}
};

const sections = [
	{
		header: 'Master of Puppets Compare',
		content: 'Visual compare screenshots taken using screenshots.js using ResembleJS.',
	},
	{
		header: 'Synopsis',
		content: [
			'$ node compare <base> <compare> <options>',
			'$ node compare --help',
			'$ node compare --loglevel 1 --base screenshots/prodFolder --compare screenshots/stageFolder --dry-run',
		],
	},
	{
		header: 'Options List',
		optionList: [
			{ name: 'help', alias: 'h', description: 'Print out helpful information.' },
			{ name: 'loglevel', alias: 'l', typeLabel: '{italic Number}', description: 'Log level. Default 0.\n0=Silent, 1=Important only, 2=All.', defaultOption: 0 },
			{ name: 'base', alias: 'b', typeLabel: '{italic String}', description: 'Path to the folder used as the base for comparison.' },
			{ name: 'compare', alias: 'c', typeLabel: '{italic String}', description: 'Path to the folder used for comparison against the base folder.' },
			{ name: 'dry-run', alias: 'd', description: 'Compares the images without saving the diff files.' },
		],
	},
];

const usage = commandLineUsage(sections);
const optionDefinitions = [
	{ name: 'help', alias: 'h' },
	{ name: 'loglevel', alias: 'l', type: Number },
	{ name: 'base', alias: 'b', type: String },
	{ name: 'compare', alias: 'c', type: String },
	{ name: 'dry-run', alias: 'd' },
];

const options = commandLineArgs(optionDefinitions);

if (options.help) {
	console.log(usage);
} else {
	initialize(options);
}