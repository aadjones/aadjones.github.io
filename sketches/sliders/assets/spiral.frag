// fragment shader
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_amplitude; // If using audio data
uniform float uBass, uMid, uTreble;
uniform float uSmoothedLightness;
uniform float uSaturation;
uniform float uHue;

float hueToRgb(float f1, float f2, float hue) {
    if (hue < 0.0)
        hue += 1.0;
    else if (hue > 1.0)
        hue -= 1.0;
    float res;
    if ((6.0 * hue) < 1.0)
        res = f1 + (f2 - f1) * 6.0 * hue;
    else if ((2.0 * hue) < 1.0)
        res = f2;
    else if ((3.0 * hue) < 2.0)
        res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
    else
        res = f1;
    return res;
}

vec3 rgbToHsl(vec3 color) {
    float fmin = min(min(color.r, color.g), color.b);    // Min. value of RGB
    float fmax = max(max(color.r, color.g), color.b);    // Max. value of RGB
    float delta = fmax - fmin;                           // Delta RGB value

    vec3 hsl; // Initialize HSL
    hsl.z = (fmax + fmin) / 2.0; // Lightness

    if (delta == 0.0) { // This is a gray, no chroma...
        hsl.x = 0.0; // Hue
        hsl.y = 0.0; // Saturation
    } else { // Chromatic data...
        if (hsl.z < 0.5)
            hsl.y = delta / (fmax + fmin); // Saturation
        else
            hsl.y = delta / (2.0 - fmax - fmin); // Saturation

        float deltaR = (((fmax - color.r) / 6.0) + (delta / 2.0)) / delta;
        float deltaG = (((fmax - color.g) / 6.0) + (delta / 2.0)) / delta;
        float deltaB = (((fmax - color.b) / 6.0) + (delta / 2.0)) / delta;

        if (color.r == fmax)
            hsl.x = deltaB - deltaG; // Hue
        else if (color.g == fmax)
            hsl.x = (1.0 / 3.0) + deltaR - deltaB; // Hue
        else if (color.b == fmax)
            hsl.x = (2.0 / 3.0) + deltaG - deltaR; // Hue

        if (hsl.x < 0.0)
            hsl.x += 1.0; // Hue
        else if (hsl.x > 1.0)
            hsl.x -= 1.0; // Hue
    }

    return hsl;
}

vec3 hslToRgb(vec3 hsl) {
    vec3 rgb;

    if (hsl.y == 0.0)
        rgb = vec3(hsl.z); // Luminance
    else {
        float f2;

        if (hsl.z < 0.5)
            f2 = hsl.z * (1.0 + hsl.y);
        else
            f2 = (hsl.z + hsl.y) - (hsl.y * hsl.z);

        float f1 = 2.0 * hsl.z - f2;

        rgb.r = hueToRgb(f1, f2, hsl.x + (1.0 / 3.0));
        rgb.g = hueToRgb(f1, f2, hsl.x);
        rgb.b = hueToRgb(f1, f2, hsl.x - (1.0 / 3.0));
    }

    return rgb;
}


void main() {
    // Normalized texture coordinates
    vec2 uv = vTexCoord;
   // Calculate center of the swirl
    vec2 center = vec2(0.5, 0.5);

    // Calculate the distance and angle from the center
    vec2 toCenter = center - uv;
    float distance = length(toCenter);
    float angle = atan(toCenter.y, toCenter.x);

    // Swirl effect
    float swirlFactor = u_amplitude; // Adjust the strength of the swirl
    angle += sin(distance * 10.0 - u_time * 2.0) * swirlFactor;

    // Convert polar coordinates back to Cartesian
    vec2 swirledUV = center + vec2(cos(angle), sin(angle)) * distance;
  
    // Apply the swirled UV to the texture
    vec4 texColor = texture2D(uTexture, swirledUV);
    // vec4 texColor = texture2D(uTexture, perspectiveUV);

    vec3 hslColor = rgbToHsl(texColor.rgb);

    // Adjust lightness based on frequency data
    hslColor.z = clamp(hslColor.z * (1.0 + 0.9 * uSmoothedLightness), 0.0, 1.0); // Example of subtle effect
  
   // hslColor.y = clamp(hslColor.y * (1.0 + 0.9 * uSaturation), 0.0, 1.0);
  
    // hslColor.x = clamp(hslColor.x * (1.0 + 0.5 * uHue), 0.0, 360.0);


    vec3 rgbColor = hslToRgb(hslColor);
    gl_FragColor = vec4(rgbColor, 1.0);
    
}