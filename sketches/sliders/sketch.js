let theShader;
let img;
let currentRipplePower = 0;
let smoothingFactor = 0.05; // Adjust this for more or less smoothing
let previousLightness = 0.5;  // Initial lightness value
let lightSmoothingFactor = 0.1;    // Smoothing factor for EMA
let previousSaturation = 0.5;
let previousHue = 0.5;
let previousGranularity = 10.0;
let slider1, slider2, slider3, slider4, slider5;

// exponential moving average
function EMA(curr, prev, factor) {
  return prev + factor * (curr - prev);  
}

function makeSliders() {
   // Create a container for the slider and label
   
    let container1 = createDiv('').parent('control-panel').class('slider-container');
    slider1 = createSlider(0, 1, 0.5, 0.01).parent(container1).class('my-slider');
    let label1 = createP('Intensity').parent(container1).class('my-label');

    let container2 = createDiv('').parent('control-panel').class('slider-container');
    slider2 = createSlider(0, 1, 0.5, 0.01).parent(container2).class('my-slider');
    let label2 = createP('Lightness').parent(container2).class('my-label');
  
    let container3 = createDiv('').parent('control-panel').class('slider-container');
    slider3 = createSlider(0, 1, 0.5, 0.01).parent(container3).class('my-slider');
    let label3 = createP('Horizontal').parent(container3).class('my-label');
  
    let container4 = createDiv('').parent('control-panel').class('slider-container');
    slider4 = createSlider(0, 1, 0.5, 0.01).parent(container4).class('my-slider');
    let label4 = createP('Vertical').parent(container4).class('my-label');
  
    let container5 = createDiv('').parent('control-panel').class('slider-container');
  
    slider5 = createSlider(1, 100, 10, 1).parent(container5).class('my-slider');
    let label5 = createP('Granularity').parent(container5).class('my-label');
}

function preload() {
  theShader = loadShader('sketches/sliders/assets/vertexShader.vert', 'sketches/sliders/assets/noise.frag');
  img = loadImage('sketches/sliders/images/warmth.png');
}

function setup() {
  frameRate(30);
  // createCanvas(img.width, img.height, WEBGL).parent('p5-sketch-container');
  createCanvas(windowWidth * 0.60, windowHeight * 0.60, WEBGL).parent('p5-sketch-container'); 
  noStroke();
  makeSliders();
}

function draw() {
  let maxRipplePower = 4;
  let level = slider1.value();
  let targetRipplePower = map(level, 0, 1, 0, maxRipplePower); // 
  let currentLightness = slider2.value();
  previousLightness += lightSmoothingFactor * (currentLightness - previousLightness);

  let currentSaturation = slider3.value();
  // Apply EMA to the lightness value
  previousSaturation += lightSmoothingFactor * (currentSaturation - previousSaturation);
  
  let currentHue = slider4.value();
  previousHue += lightSmoothingFactor * (currentHue - previousHue);

  // Smoothly interpolate the ripple power
  currentRipplePower += smoothingFactor * (targetRipplePower - currentRipplePower);
  
  let currentGranularity = slider5.value();

   
  previousGranularity += lightSmoothingFactor * (currentGranularity - previousGranularity);
  
  shader(theShader);
  theShader.setUniform('uTexture', img);
  theShader.setUniform('u_time', millis() / 1000.0);
  theShader.setUniform('u_amplitude', currentRipplePower); 
  theShader.setUniform('uSmoothedLightness', previousLightness);
  theShader.setUniform('uSaturation', previousSaturation);
  theShader.setUniform('uHue', previousHue);
  theShader.setUniform('uGranularity', previousGranularity);

  
  // Draw the rectangle with the image
  rect(0, 0, width, height);
}