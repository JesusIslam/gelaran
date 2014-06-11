// Run this as sudo probably
// test if yielding all return the correct response
var config = require('config');

var http = require('http'),
	fs = require('fs'),
	exec = require('child_process').exec;

var koa = require('koa'),
	common = require('koa-common'),
	router = require('koa-router'),
	thunk = require('thunkify'),
	parse = require('co-body'),
	Nedb = require('nedb'),
	swig = require('swig');

var db = new Nedb({ filename : __dirname + '/database', autoload : true });
var findOne = thunk(db.findOne);

var nginxTemplate = __dirname + '/nginxTemplate';

var exists = thunk(fs.exists),
	mkdir = thunk(fs.mkdir),
	rmdir = thunk(fs.rmdir),
	writeFile = thunk(fs.writeFile);

execT = thunk(exec);

var render = thunk(swig.renderFile);

var app = koa();
app.use(router(app));
app.post('/:type/:entry/:port', function * () {
	console.log('Updating '+appli.name);
	var self = this;
	try {
		var hook = yield parse(this);
		if (!hook.repository) {
			throw 'Invalid hook';
		}
		var appli = {
			type : self.params.type,
			entry : self.params.entry,
			port : parseInt(self.params.port, 10),
			name : hook.repository.name,
			dir : '/home/'+config.username+'/'+hook.repository.name,
			git : hook.repository.url
		};
		var bin;
		switch (appli.type) {
			case 'nodejs' : 
				bin = '/usr/bin/nodejs';
			break;
		}
		if (!appli.type || !appli.entry || !appli.port) {
			throw 'Invalid entry';
		}
		var isExists = yield exists(appli.dir);
		if (isExists) {
			// remove node_modules first
			yield rmdir(appli.dir+'/node_modules');
			// fetch new from git
			yield execT('git fetch --all', { cwd : appli.dir });
			yield execT('git reset --hard origin/master', { cwd : appli.dir });
			// reinstall node_modules
			yield execT('npm install', { cwd : appli.dir });
			// get pid from db or something
			var prevAppli = yield findOne({ name : appli.name });
			// stop current running if exists
			yield execT('kill '+prevAppli.pid, {});
			// if port is different
			if (prevAppli.port !== appli.port) {
				// create nginx file
				var file = yield render(nginxTemplate, { port : appli.port, name : appli.name, hostname : config.hostname });
				// edit the nginx config file
				writeFile('/home/'+config.username+'/nginx-conf/'+appli.name, file, {});
				// restart nginx
				yield execT('service nginx restart', {});
			}
		} else {
			// create new dir and clone new if not exists
			yield mkdir(appli.dir, '0755');
			yield execT('git clone '+appli.git+' '+appli.dir, { cwd : appli.dir });
			// install node_modules
			yield execT('npm install', { cwd : appli.dir });
			// create nginx file
			var file = yield render(nginxTemplate, { port : appli.port, name : appli.name, hostname : config.hostname });
			writeFile('/home/'+config.username+'/nginx-conf/'+appli.name, file, {});
			// restart nginx
			yield execT('service nginx restart', {});
		}
		// start new
		var proc = exec(bin+' '+appli.entry, { cwd : appli.dir });
		// add pid to db or something
		appli.pid = proc.pid;
		db.update({ name : appli.name }, appli, { upsert : true });
		// send success message
		this.status = 200;
		this.body = 'Success';
		console.log('Finished updating '+appli.name);
	} catch (e) {
		this.status = 400;
		this.body = e;
	}
});
app.listen(config.port);