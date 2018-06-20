const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const compareImages = require("resemblejs/compareImages");


const fs = require("mz/fs");
const util = require('./util.js');
	const log = util.log;
	const readJSON = util.readJSON;
	const mkdir = util.mkdir;
	const rm = util.rm;
	const isFolder = util.isFolder;

var setup;
var logLevel;
var diffFolder;
var baseFolder;
var compareFolder;
var dryRun;
var fileList;
var resembleOptions;


const init = function(commandLineObject) {

	util.logLevel = logLevel = !isNaN(commandLineObject.loglevel) ? commandLineObject.loglevel : 0;
	setup = readJSON('setup.json');
		diffFolder = setup.diffFolder;
		resembleOptions = setup.resembleOptions;

	rm(diffFolder);
	mkdir(diffFolder);

	dryRun = typeof(commandLineObject['dry-run']) == 'object' ?  true : false;
	baseFolder = commandLineObject.base;
	compareFolder = commandLineObject.compare;
	fileList;

	fs.readdir(baseFolder, function(err, items) {
		fileList = items;
		getDiff();
	});
}

async function getDiff(){

	for (var i=0; i<fileList.length; i++) {

		file = fileList[i];
		var options = resembleOptions;

		const data = await compareImages(
			await fs.readFile(baseFolder + file),
			await fs.readFile(compareFolder + file),
			options
		);

		if(logLevel > 0 || dryRun) {
			console.log(file + '\t' + (Number(data.misMatchPercentage) / 100).toString().replace('.',','));
		}

		if(dryRun === false) {
			await fs.writeFile(diffFolder + '/' + file, data.getBuffer());
		}
	}
}

const sections = [
	{
		header: 'Master of Puppets Compare',
		content: 'Visual compare screenshots taken using screenshots.js using ResembleJS.'
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
				typeLabel: '{italic number}',
				description: 'Log level. {italic Defalut 0}\n0=Silent, 1=Important only, 2=All.',
				defaultOption: 0
			},
			{
				name: 'dry-run',
				alias: 'd',
				description: 'Compares the images without saving any new files.'
			},
			{
				name: 'base',
				alias: 'b',
				typeLabel: '{italic string}',
				description: 'Path to the folder used as the base for comparison.'
			},
			{
				name: 'compare',
				alias: 'c',
				typeLabel: '{italic string}',
				description: 'Path to the folder used for comparison against the base folder.'
			}
		]
	}
]
const usage = commandLineUsage(sections)

const optionDefinitions = [
	{ name: 'help', alias: 'h' },
	{ name: 'loglevel', alias: 'l', type: Number },
	{ name: 'base', alias: 'b', type: String},
	{ name: 'compare', alias: 'c', type: String},
	{ name: 'dry-run', alias: 'd'}
]
const options = commandLineArgs(optionDefinitions);

if(typeof(options.help) == 'object') {
	console.log(usage);
} else {
	init(options);
}