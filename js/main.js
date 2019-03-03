// JavaScript Ray Caster: main loop
// author: Cédric "tuzepoito" Chartron

var requestAnimation = window.requestAnimationFrame ||
  function (callback, el) { setTimeout(callback, 1000/60.0); };

// main loop

var MainLoop = {
  load: function () {
    this.canvas = document.getElementById("maincanvas");
    if (!this.canvas.getContext)
      return;

    this.fps = document.getElementById('fps');
    this.fpsTimes = [];

    this.keys = {
      "a": false,
      "d": false,
      "w": false,
      "s": false
    };

    var self = this;

    window.addEventListener('keydown', function(event) {
      if (event.key in self.keys) {
        self.keys[event.key] = true;
        event.preventDefault();
      } else {
        // console.debug(event);
      }
    }, false);
  
    window.addEventListener('keyup', function(event) {
      if (event.key in self.keys) {
        self.keys[event.key] = false;
        event.preventDefault();
      } else {
        // console.debug(event);
      }
    }, false);
    
    this.ctx = this.canvas.getContext('2d');

    RayCaster.init(this.canvas, function() {
      requestAnimation(self.timerCallback.bind(self));
    });
  },

  timerCallback: function() {
    this.fpsTimes.push(Date.now());
    if (this.fpsTimes.length > 5) {
      this.fpsTimes.shift();
      var fps = 1000 * (this.fpsTimes.length-1) / (this.fpsTimes[this.fpsTimes.length-1] - this.fpsTimes[0]);
      this.fps.innerText = 'FPS:'+ (Math.floor(10000 * fps) / 10000);
    }

    if (this.keys["a"]) {
      RayCaster.currentAngle += 4;
      if (RayCaster.currentAngle > 180) {
        RayCaster.currentAngle = realmod(RayCaster.currentAngle, 360) - 360;
      }

    } else if (this.keys["d"]) {
      RayCaster.currentAngle -= 4;
      if (RayCaster.currentAngle < -180) {
        RayCaster.currentAngle = realmod(RayCaster.currentAngle, 360);
      }

    } else if (this.keys["w"]) {
      RayCaster.x += 5 * Math.cos(Math.PI * RayCaster.currentAngle / 180);
      RayCaster.y += 5 * Math.sin(Math.PI * RayCaster.currentAngle / 180);

      if (RayCaster.x <= 0) {
        RayCaster.x = 1;
      }
      if (RayCaster.y <= 0) {
        RayCaster.y = 1;
      }
      if (RayCaster.x >= mapSize * gridSize) {
        RayCaster.x = mapSize * gridSize - 1;
      }
      if (RayCaster.y >= mapSize * gridSize) {
        RayCaster.y = mapSize * gridSize - 1;
      }

    } else if (this.keys["s"]) {
      RayCaster.x -= 5 * Math.cos(Math.PI * RayCaster.currentAngle / 180);
      RayCaster.y -= 5 * Math.sin(Math.PI * RayCaster.currentAngle / 180);

      if (RayCaster.x <= 0) {
        RayCaster.x = 1;
      }
      if (RayCaster.y <= 0) {
        RayCaster.y = 1;
      }
      if (RayCaster.x >= mapSize * gridSize) {
        RayCaster.x = mapSize * gridSize - 1;
      }
      if (RayCaster.y >= mapSize * gridSize) {
        RayCaster.y = mapSize * gridSize - 1;
      }
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    var dataPixels = new Pixels(imgData, this.canvas.width, this.canvas.height);
    RayCaster.update(dataPixels);
    this.ctx.putImageData(imgData,0,0);

    requestAnimation(this.timerCallback.bind(this));
  }
};

window.addEventListener('load', function() { MainLoop.load(); });
