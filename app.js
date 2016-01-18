var http = require('http')
	, express = require('express')
	, fs = require('fs')
	, md5File = require('md5-file')

global.config = require('./config.js');
var app = express();

app.set('port', config.port || 9999);

app.get('*', function(req, res) {

	res.header('Access-Control-Allow-Origin', '*');
	var width = 500;
	var height = 500;
	var resizePath = '';
	var imageName = '';

	// หาขนาดรูปที่ต้องการ เช่น /500x500/category/bag/1.jpg
	var sp = req.url.split('/');
	if( sp.length >= 2 ) {
		sp2 = sp[1].split('x');
		if( sp2.length == 2 ) {
			if (!isNaN(parseFloat(sp2[0])) && isFinite(sp2[0]) && !isNaN(parseFloat(sp2[1])) && isFinite(sp2[1])) {
				width = parseFloat(sp2[0]);
				height = parseFloat(sp2[1]);
				req.url = req.url.replace( '/'+sp[1], '' );
				imageName = sp[4];
				resizePath = config.imageResizePath+'/'+sp[2]+'/'+sp[3];
				if (!fs.existsSync(config.imageResizePath+'/'+sp[2])){
					fs.mkdirSync(config.imageResizePath+'/'+sp[2]);
				}				
				if (!fs.existsSync(config.imageResizePath+'/'+sp[2]+'/'+sp[3])){
					fs.mkdirSync(config.imageResizePath+'/'+sp[2]+'/'+sp[3]);
				}
			}
		}
	}

	var name = config.imagePath+req.url;
	fs.exists(name, function (exists) {
		if (exists){

			var md5 = md5File(name);
			var resizeName = resizePath+'/'+md5+'-'+width+'x'+height+'-'+imageName;

			fs.exists(resizeName, function (exists) {
				if (exists){
					console.log('use '+ resizeName);
					var stream = fs.createReadStream(resizeName);
					stream.pipe(res);
				}
				else {
					console.log('generate '+ resizeName);

					var gm = require('gm');
					var img = gm(name);
					img.size(function(err, value){				
						var box = value.width > value.height ? value.height/4 : value.width/4;
						
						var textWidth = box*4/3;
						var textHeight = textWidth/8;
						var count = 5;
						var boxSplit = value.height/count;
						var gabX = ((value.width/2)-textWidth)/2;
						var gabY = (boxSplit-textHeight)/2;
						if (name.toLowerCase().indexOf('.gif') == -1) {
							for(i=0; i<count; i++){
								img.draw(['image Over '+gabX+','+((boxSplit*i)+gabY)+' '+textWidth+','+(textWidth/8)+' '+config.imageTextPath]);
								if ( i < count-1 ) {
									img.draw(['image Over '+((value.width/2)+gabX)+','+((boxSplit*i)+gabY)+' '+textWidth+','+(textWidth/8)+' '+config.imageTextPath]);
									img.draw(['image Over '+((value.width-textWidth)/2)+','+((boxSplit*(i+1))-(textHeight/2))+' '+textWidth+','+(textWidth/8)+' '+config.imageTextPath]);
								}
							}
						}
						
						img.draw(['image Over '+(value.width-box)+','+(value.height-box)+' '+box+','+box+' '+config.imageLogoPath])
							.resize(width, height)
							.comment('RemaxThailand')
							.compress('Lossless')
							.stream(function streamOut (error, stdout, stderr) {
								if (!error) {
									stdout.pipe(res);
								}
								else {
									res.send(error);
								}
							});
						
						img.draw(['image Over '+(value.width-box)+','+(value.height-box)+' '+box+','+box+' '+config.imageLogoPath])
							.resize(width, height)
							.comment('RemaxThailand')
							.compress('Lossless')
							.write(resizeName, function (err) {
								if (err) { console.log(err); }
							});
					});


				}
			});
		}
		else {
			console.log('no image');
			var stream = fs.createReadStream(config.imageLogoPath);
			stream.pipe(res);
		}
	});


});


var server = http.createServer(app);
server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});