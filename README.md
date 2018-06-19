```
╔╦╗╔═╗╔═╗╔╦╗╔═╗╦═╗  ╔═╗╔═╗  ╔═╗╦ ╦╔═╗╔═╗╔═╗╔╦╗╔═╗
║║║╠═╣╚═╗ ║ ║╣ ╠╦╝  ║ ║╠╣   ╠═╝║ ║╠═╝╠═╝║╣  ║ ╚═╗
╩ ╩╩ ╩╚═╝ ╩ ╚═╝╩╚═  ╚═╝╚    ╩  ╚═╝╩  ╩  ╚═╝ ╩ ╚═╝
```
ASC Art from: http://patorjk.com/software/taag/#p=testall&f=3-D&t=MASTER%20OF%20PUPPETS

# Install

Clone this repository and run:

```
$ npm install
```

# Usage

# Taking screenshots

In order to read the help, run the command:

```
$ node screenshot --help
```

## Config the __`setup.json`__

### Parameters

 - `compressImages` <[boolean]> Whether to compress the generated images. _Default_ __```true```__
 - `screenshotsFolder` <[string]> Destination folder for the image files. _Default_ __```screenshots```__
  - `pages` <[string]> Path and file name of pages list. _Default_ __```pages.json```__
  - `puppeteer` <[Object]> <[Puppeteer]> config object. _Default_:
  	- `puppeteer.launch` <[boolean]> Whether to to use or not the headless mode. _Default_ __```true```__
  	- `emulate` <[Array]> Array of objects following the Puppeteer [`page.emulate`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageemulateoptions) standard with the __required__ adition of `name` <[string]> as a short description of the browser / resolution.
  - `diffFolder` <[string]> Destination folder for the comparison image files. _Default_ __```screenshots/_diff```__
  - `resembleOptions` <[Object]> <[Resemblejs]> configuration options.
  	- `resembleOptions.output` <[Object]>
  		- `resembleOptions.output.errorType` <[string]> Error type. _Default_ `movement`. 

#### Sample file:

```
{
	"compressImages": true,
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
			}
		]
	},
	
	"diffFolder": "screenshots/_diff",
	"resembleOptions": {
		"output": {
			"errorType": "movement"
		}
	}
}
```

## Config the __`pages.json`__

### Parameters

 - `domain` <[string]> Main domain to be tested. It is concatenated with the `pages.url`.
 - `pages` <[Array]> Array of objects containing information about the pages to be tested.
	- `url` <[string]> Url path. It is also used to create a unique filename for each image so, it is important to have a unique `url` name. If you want to test mutiple scenarios from the same page, use some `querystring` to identify it otherwise the last file will override the previous one.
	- `click` <[array]> Array of elements to be clicked. Each element is a [selector] to search for element to click. If there are multiple elements satisfying the selector, the first will be clicked. It follows the same behavior of the `document.querySelectorAll` of javascript.
	- `waitFor` If follows the [Puppeteer] __[`page.waitFor`](https://github.com/GoogleChrome/puppeteer/blob/v1.2.0/docs/api.md#pagewaitforselectororfunctionortimeout-options-args)__ documentation.

#### Sample file:

```
{
	"domain": "http://www.yoursupercoolsite.com",
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


[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[Puppeteer]: https://github.com/GoogleChrome/puppeteer "Puppeteer"
[Resemblejs]: https://github.com/HuddleEng/Resemble.js "Resemblejs"
[selector]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors "selector"

