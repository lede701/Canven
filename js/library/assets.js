// Converting the new class definition to the old object definition style so that this can be
// a module to export, maybe...

class Assets{
	constructor(config) {
		this.pendingFiles = [];
		this.fileList = {};
		this.toLoad = 0;
		this.loaded = 0;

		this.imageTypes = ['png', 'jpg', 'jpeg', 'gif'];
		this.dataTypes = ['json']; // Not sure if I want to support XML but it could be easily added
		this.audioTypes = ['wav', 'mp3', 'ogg', 'webm'];
		this.fontTypes = ['ttf', 'otf', 'ttc', 'woff']; // Need to look up different font extensions

		Object.assign(asm, config);
		if (typeof (asm.ctx) == 'undefined' || asm.ctx == null) {
			console.error(`Context was not provided to the asset manager! Font's will not preload'`);
		}
	};

	// The load function needs to support promises.  That way we can reliably count the files being loaded and hadnle failed
	// file loads.
	Load(files) {
		asm.toLoad += files.length;
		while (files.length > 0) {
			let file = files.pop();
			let ext = file.split('.').pop();
			if (asm.imageTypes.indexOf(ext) >= 0) {
				// Need to load an image
				asm.LoadImage(file, asm.LoadHandler);
			} else if (asm.dataTypes.indexOf(ext) >= 0) {
				// Need to load a data file
				asm.LoadJson(file, asm.LoadHandler);
			} else if (asm.audioTypes.indexOf(ext) >= 0) {
				// Need to load an audio file
				asm.LoadAudio(file, asm.LoadHandler);
			} else if (this.fontTypes.indexOf(ext) >= 0) {
				// Need to load a font which is tricky :/
				asm.LoadFont(file, asm.LoadHandler);
			} else {
				console.error(`Unknown file type ${ext} in file ${file}`);
			}
			// Add file to the pending load list
			asm.pendingFiles.push(file);
		}
	};

	LoadImage(file, loadHandler){
		let img = new Image();
		// Connect the load event to our event handler
		img.addEventListener('load', loadHandler, false);
		// Store image in the asset list
		asm[file] = img;
		// Start the image loading process
		img.src = file;
	};

	LoadJson(file, loadHandler) {
		// Time to load some data so that the game can either pull it from a static file or if your good with server code
		// it can be pulled dynamically from a database or cloud service....
		let xhr = new XMLHttpRequest();
		xhr.open('GET', file, true);
		// Let system know we want a text file
		xhr.responseType = 'text';
		xnh.onload = event => {
			if (xhr.status == 200) {
				// Parse the server response
				let data = JSON.parse(xhr.responseText);
				// Add the file name to the data structure
				data.name = file;
				// Store our loaded data!
				asm[file] = data;
				loadHandler();
			}
		};
		xhr.send();
	};

	LoadAudio(file, loadHandler) {
		// Will update this when I have some audio files to load for now it is just a stub
		asm[file] = undefined;
		loadHandler();
	};

	LoadFont(file, loadHandler) {
		// Fonts are very tricky to load so the first thing we will do is add a new style to the document header
		// Then if ctx is defined we will try and write the font name to the canvas
		let fontName = file.split('/').pop().split('.')[0];
		let newStyle = document.createElement("style");
		let fontFace = `@font-face{font-family: ${fontName}; src: url('${file}');`;
		newStyle.appendChild(fontFace);
		document.head.appendChild(newStyle);
		// Try and force the font to load by drawing it to the canvas
		if (typeof (asm.ctx) != 'undefined' && asm.ctx != null) {
			// Need to test this with a font to see if we will get it to work
			let oldFont = ctx.font;
			let oldStyle = ctx.fillStyle;
			ctx.font = `12pt ${fontName}`;
			ctx.fillStyle = 'rgba(0,0,0,1)';

			ctx.fillText(fontName);

			ctx.font = oldFont;
			ctx.fillStyle = oldStyle;
		}
		loadHandler();
	};

	LoadHandler() {
		asm.loaded += 1;
		if (asm.loaded == asm.toLoad) {
			// Reset the load tracking system
			this.loaded = 0;
			this.toLoad = 0;

			// We will want to complete the promise now that everything is loaded
			//resolve();
		}
		// We should know that an assets was successfully loaded
		console.log(`Asset loaded.`);
	};
};