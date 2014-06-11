# Gelaran
==============

## Dependencies

* Node >0.11.2 or gnode
* Koa
* koa-common
* Nginx
* koa-router
* thunkify
* co-body
* Nedb
* Swig

## Usage

Put your deploy key on the gitlab (check your key with `cat ~/.ssh/id_rsa.pub`)

Clone this repo.

Do `npm install --save`

Edit node_modules/config/index.js with your needs

* username = Your Linux username. ex: bobthelame
* hostname = Your hostname. ex: worksinmagic.com
* port = Your port of choice.

Run `sudo nodejs server.js` or `sudo gnode server.js` and it will listen to port of your choice. (default to 9999)

Make your webhook point to `thishostname:9999/yourapptype/yourappentry/yourappport` where

* yourapptype = currently only support 'nodejs'
* yourappentry = Your app entry file. ex: server.js
* yourappport = Your app listen port.

# WARNING I HAVE NOT TESTED THIS