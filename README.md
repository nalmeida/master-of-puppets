```
╔╦╗╔═╗╔═╗╔╦╗╔═╗╦═╗  ╔═╗╔═╗  ╔═╗╦ ╦╔═╗╔═╗╔═╗╔╦╗╔═╗
║║║╠═╣╚═╗ ║ ║╣ ╠╦╝  ║ ║╠╣   ╠═╝║ ║╠═╝╠═╝║╣  ║ ╚═╗
╩ ╩╩ ╩╚═╝ ╩ ╚═╝╩╚═  ╚═╝╚    ╩  ╚═╝╩  ╩  ╚═╝ ╩ ╚═╝
```

- [Install](#install)
- [Taking screenshots](#taking-screenshots)
	- [screenshot CLI Options](#screenshot-cli-options)
	- [Config the __`setup.json`__](#config-the-__setupjson__)
		- [Parameters](#parameters)
			- [Sample file:](#sample-file)
	- [Config the __`pages.json`__](#config-the-__pagesjson__)
		- [Parameters](#parameters-1)
			- [Sample file:](#sample-file-1)
- [Comparing screenshots](#comparing-screenshots)
	- [compare CLI Options](#compare-cli-options)

# Install

Clone this repository and run:

```
$ npm install
```

# Taking screenshots

```
$ node screenshot.js
```

## screenshot CLI Options

```
  -h, --help                 Print out helpful information.
  -l, --loglevel Number      Log level. Default 0
                             0=Silent, 1=Important only, 2=All.
  -d, --domain String        Main domain to be tested. When set, it OVERRIDES the "domain" parameter from
                             the pages.json file.
  -a, --auth String:String   username:password for the http authentication. When set, it OVERRIDES the
                             "authenticate" parameter from the pages.json file.
  -e, --headless Boolean     Set Puppeteer to run in the headless mode. When set, it OVERRIDES the
                             "headless" parameter from the setup.json file.
  -p, --pages String         The path to the pages.json file. Default option uses pages.json from the root
                             of the project.

```

## Config the __`setup.json`__

### Parameters

 - `screenshotsFolder` <[string]> Destination folder for the image files. _Default_ __```screenshots```__
 - `autoScroll` <[Boolean]> Option for Puppeteer to scroll automatically to the bottom of the page before screenshot. Useful for scroll incrementally through a page in order to deal with lazy loaded elements. It scrolls in 100px every 100ms until the bottom of the page. _Default_ __```true```__
  - `pages` <[string]> Path and file name of pages list. _Default_ __```pages.json```__
  - `puppeteer` <[Object]> <[Puppeteer]> config object. _Default_:
  	- `launch` <[boolean]> Whether to use or not the headless mode. _Default_ __```true```__
  	- `emulate` <[Array]> Array of objects following the Puppeteer [`DeviceDescriptors.ts`](https://github.com/puppeteer/puppeteer/blob/main/src/common/DeviceDescriptors.ts) standards. In order to test different resolutions emulating the same browser, just add the width in the `name` parameter. E.g.: `"name": "Chrome 1024"`.
  - `diffFolder` <[string]> Destination folder for the comparison image files. _Default_ __```screenshots/_diff```__
  - `resembleOptions` <[Object]> [`Resemblejs`](https://github.com/HuddleEng/Resemble.js#nodejs) configuration options.

#### Sample file:

```
{
	"screenshotsFolder": "screenshots",
	"pages": "pages.json",
	"puppeteer": {
		"launch": {
			"headless": true
		},
		"emulate": [
			{
				"name": "Chrome 1280",
				"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
				"viewport": {
					"width": 1280,
					"height": 780
				}
			},
			{
				"name": "iPhone 6",
				"userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1",
				"viewport": {
					"width": 375,
					"height": 667,
					"deviceScaleFactor": 2,
					"isMobile": true,
					"hasTouch": true,
					"isLandscape": false
				}
			}
		]
	},

	"diffFolder": "diff",
	"resembleOptions": {
		"output": {
			"errorColor": {
				"red": 255,
				"green": 0,
				"blue": 255
			},
			"errorType": "movement",
			"transparency": 1,
			"largeImageThreshold": 5000,
			"useCrossOrigin": false,
			"outputDiff": true
		},
		"scaleToSameSize": false,
		"ignore": "colors"
}
```

## Config the __`pages.json`__

### Parameters

 - `domain` <[string]> Main domain to be tested. It is concatenated with the `pages.url`.
 - `authenticate` <[Object]> Object credentials for [http authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication). See more at [Puppeteer page.authenticate](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageauthenticatecredentials) documentation. If `username` or `password` equal to `null`, will not run the `page.authenticate` method.
 	- `username` <[string]> _Default_ __```null```__
 	- `password` <[string]> _Default_ __```null```__
 - `pages` <[Array]> Array of objects containing information about the pages to be tested.
	- `url` <[string]> URL path. It is also used to create a unique filename for each image so, it is important to have a unique `url` name. If you want to test mutiple scenarios from the same page, use some `querystring` to identify it otherwise the last file will override the previous one.
	- `click` <[array]> Array of elements to be clicked. Each element is a [selector] to search for element to click. If there are multiple elements satisfying the selector, the first will be clicked. It follows the same behavior of the `document.querySelectorAll` of javascript.
	- `waitFor` If follows the [Puppeteer] __[`page.waitFor`](https://github.com/GoogleChrome/puppeteer/blob/v1.2.0/docs/api.md#pagewaitforselectororfunctionortimeout-options-args)__ documentation.

Actions will follow the order:

```
 Page load event → autoScroll → click → waitFor → screenshot
```

#### Sample file:

```
{
	"domain": "http://www.yoursupercoolsite.com",
	"authenticate": {
		"username": null,
		"password": null
	},
	"pages": [
		{ "url": "/", "click": ["#mainbutton"]},
		{ "url": "/?complex-selector", "click": [".menu-secondary > ul > li:nth-child(2) > .link"]},
		{ "url": "/?3-buttons", "click": ["#firstbutton", ".secondbutton", "#send-form a"]},
		{ "url": "/?click-and-wait", "click": ["#mainbutton"], "waitFor": 5000},
		{ "url": "/contact"},
		{ "url": "/products"},
		{ "url": "/products/product-1"},
		{ "url": "/products/product-2"},
		{ "url": "/products/product-3"}
	]
}
```

# Comparing screenshots

The `compare.js` script compares two image folders, generates the diff images inside a folder. The diff destination folder can be set inside the `setup.json` file by the `diffFolder` parameter.

When `screenshot.js` runs, it creates a folder inside `screenshots` using a timestamp format (YYYY.MM.DD-HH.MM.SSSS) to avoid folder naming conflic and overriding. E.g.: `2018.07.05-16.34.929`.

Inside the "timestamp" folder, it creates a folder structure for each "device" name. E.g.:

```
./screenshots/2018.07.05-16.34.929/
              ├── chrome-1280/
              ├── chrome-1024/
              ├── iphone-6/
              ...
```

It is mandatory to set a `--base` **and** `--compare` folder and they must be the "timestamp" folder so, the script will search for the images in the "device" child folders.

In order to make easier to use the compare CLI, you can rename your "timestamp" folder to a easier name do recall such as "production" and "staging". E.g.:

```
./screenshots/production/
              ├── chrome-1280/
              ├── chrome-1024/
              └── iphone-6/
./screenshots/staging/
              ├── chrome-1280/
              ├── chrome-1024/
              └── iphone-6/
```



## compare CLI Options

```
$ node compare.js
```

```
Options List

  -h, --help              Print out helpful information.
  -l, --loglevel Number   Log level. Defalut 0
                          0=Silent, 1=Important only, 2=All.
  -b, --base String       Path to the folder used as the base for comparison.
  -c, --compare String    Path to the folder used for comparison against the base folder.
  -d, --dry-run           Compares the images without saving the diff files.
```


[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[Puppeteer]: https://github.com/GoogleChrome/puppeteer "Puppeteer"
[Resemblejs]: https://github.com/HuddleEng/Resemble.js "Resemblejs"
[selector]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors "selector"

