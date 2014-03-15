/**
    @module loader
    @namespace game
**/
game.module(
    'engine.loader'
)
.body(function(){ 'use strict';

/**
    @class Loader
    @extends game.Class
**/
game.Loader = game.Class.extend({
    /**
        Game scene to start, when loader is finished.
        @property {game.Scene} gameScene
    **/
    gameScene: null,
    /**
        Number of files loaded.
        @property {Number} loaded
    **/
    loaded: 0,
    /**
        Percent of files loaded.
        @property {Number} percent
    **/
    percent: 0,
    done: false,
    timerId: 0,
    assets: [],
    audioAssets: [],
    audioUnloaded: 0,
    startTime: null,
    endTime: null,
    tweens: [],

    init: function(gameScene, resources, audioResources) {
        if(this.backgroundColor) {
            var bg = new game.Graphics();
            bg.beginFill(this.backgroundColor);
            bg.drawRect(0, 0, game.system.width, game.system.height);
            game.system.stage.addChild(bg);
        }

        this.gameScene = gameScene;
        this.timer = new game.Timer();

        var i, path;
        for (i = 0; i < resources.length; i++) {
            path = this.getPath(resources[i]);
            this.assets.push(path);
        }

        for (i = 0; i < audioResources.length; i++) {
            this.audioAssets.push(audioResources[i]);
        }
        this.audioUnloaded = this.audioAssets.length;

        if(this.assets.length > 0) {
            this.loader = new game.AssetLoader(this.assets, true);
            this.loader.onProgress = this.progress.bind(this);
            this.loader.onComplete = this.complete.bind(this);
            this.loader.onError = this.error.bind(this);
        }

        if(this.assets.length === 0 && this.audioAssets.length === 0) this.percent = 100;

        this.initStage();

        if(this.assets.length === 0 && this.audioAssets.length === 0) this.ready();
        else this.startTime = Date.now();
    },

    initStage: function() {
        this.text = new game.Text(this.percent+'%',{font:'30px Arial',fill:'#ffffff'});
        this.text.position.x = game.system.width / 2 - this.text.width / 2;
        this.text.position.y = game.system.height/2 + 80;
        game.system.stage.addChild(this.text);

        var imageData = 'media/loading.png';
        if(game.device.ie) imageData += '?' + Date.now();
        this.symbol = new game.Sprite(game.system.width/2 - 8, game.system.height/2 + 70, PIXI.Texture.fromImage(imageData, true), {
            anchor: {x: 0.5, y: 1.0},
            rotation: -0.1
        });
        game.system.stage.addChild(this.symbol);

        if(game.Tween) {
            var tween = new game.Tween(this.symbol, {rotation: 0.1}, 0.5, {
                easing: game.Tween.Easing.Cubic.InOut,
                loop: game.Tween.Loop.Reverse
            });
            this.tweens.push(tween);
            tween.start();
        }
    },

    getPath: function(path) {
        return game.system.retina || game.system.hires ? path.replace(/\.(?=[^.]*$)/, '@2x.') : path;
    },

    start: function() {
        if(this.assets.length > 0) this.loader.load();
        else this.loadAudio();
        this.loopId = game.setGameLoop(this.run.bind(this), game.system.canvas);
    },

    error: function() {
        if(!this.text) return;
        this.text.setText('ERR');
        this.text.updateTransform();
        this.text.position.x = game.system.width / 2 - this.text.width / 2;
        this.onPercentChange = function() {};
    },

    progress: function() {
        this.loaded++;
        this.percent = Math.round(this.loaded / (this.assets.length + this.audioAssets.length) * 100);
        this.onPercentChange();
    },

    onPercentChange: function() {
        if(!this.text) return;
        this.text.setText(this.percent+'%');
        this.text.updateTransform();
        this.text.position.x = game.system.width / 2 - this.text.width / 2;
    },

    complete: function() {
        if(this.audioAssets.length > 0) this.loadAudio();
        else this.ready();
    },

    loadAudio: function() {
        for (var i = this.audioAssets.length - 1; i >= 0; i--) {
            this.audioAssets[i].load(this.audioLoaded.bind(this));
        }
    },

    audioLoaded: function(path, status) {
        this.progress();

        if(status) {
            this.audioUnloaded--;
        }
        else {
            if(this.text) this.text.setText('ERR');
            throw('Failed to load audio: ' + path);
        }

        if(this.audioUnloaded === 0) this.ready();
    },

    run: function() {
        game.Timer.update();
        this.delta = this.timer.delta();
        this.update();
        this.render();
    },

    update: function() {
        for (var i = this.tweens.length - 1; i >= 0; i--) {
            this.tweens[i].update();
            if(this.tweens[i].complete) this.tweens.erase(this.tweens[i]);
        }
    },

    render: function() {
        game.system.renderer.render(game.system.stage);
    },

    ready: function() {
        if(this.done) return;
        this.done = true;

        var timeout = game.Loader.timeout * 1000;
        if(this.startTime) {
            this.endTime = Date.now();
            timeout -= this.endTime - this.startTime;
        }
        if(timeout < 100) timeout = 100;

        if(game.system.retina || game.system.hires) {
            for(var i in game.TextureCache) {
                if(i.indexOf('@2x') !== -1) {
                    game.TextureCache[i.replace('@2x', '')] = game.TextureCache[i];
                    delete game.TextureCache[i];
                }
            }
        }

        setTimeout(this.preEnd.bind(this), timeout);
    },

    preEnd: function() {
        this.end();
    },

    end: function() {
        game.Timer.time = Number.MIN_VALUE;
        game.clearGameLoop(this.loopId);
        game.system.setScene(this.gameScene);
    }
});

/**
    Minimum time to show preloader, in seconds.
    @attribute {Number} timeout
    @default 0.5
    @example
        game.Loader.timeout = 1;
**/
game.Loader.timeout = 0.5;

});