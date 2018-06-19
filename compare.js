const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const resemblejs = require('resemblejs').compare;

const fs = require("mz/fs");
const util = require('./util.js');
	const log = util.log;
	const readJSON = util.readJSON;
	const mkdir = util.mkdir;
	const isFolder = util.isFolder;

var setup;
var logLevel;
var diffFolder;
var baseFolder;
var compareFolder;
var fileList;
var resembleOptions;


const init = function(commandLineObject) {

	util.logLevel = logLevel = !isNaN(commandLineObject.loglevel) ? commandLineObject.loglevel : 0;
	setup = readJSON('setup.json');
		diffFolder = setup.diffFolder;
		resembleOptions = setup.resembleOptions;

	mkdir(diffFolder);

	baseFolder = commandLineObject.base;
	compareFolder = commandLineObject.compare;
	fileList;

	fs.readdir(baseFolder, function(err, items) {
		fileList = items;
		getDiff();
	});
}


function getDiff(){

    for (var i=0; i<fileList.length; i++) {

        file = fileList[i];
		var options = resembleOptions;
        resemblejs(
                baseFolder + file,
                compareFolder + file, 
                options, 
                function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                    	if(logLevel > 0) {
                        	log(file + '\t' + (Number(data.misMatchPercentage) / 100).toString().replace('.',','));
						}
                        fs.writeFile(diffFolder + '/' + file, data.getBuffer());
                    }
                }
        );
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
]
const options = commandLineArgs(optionDefinitions);

if(typeof(options.help) == 'object') {
	console.log(usage);
} else {
	init(options);
}