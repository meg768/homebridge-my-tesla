
all:
	@echo Specify 'pull', 'config', 'install' or 'run'

pull:
	git pull

config:
	node ./scripts/install-config.js

copy-config:
	cp ./config.json ~/.homebridge/config.json

install:
	npm install -g --unsafe-perm 

undo:
	git reset --hard HEAD

restart:
	pm2 restart homebridge

stop:
	pm2 stop homebridge

run:
	homebridge
