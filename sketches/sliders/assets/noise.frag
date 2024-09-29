// fragment shader
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform float u_time;
uniform float u_amplitude; // If using audio data
uniform float uSmoothedLightness;
uniform float uSaturation;
uniform float uHue;
uniform float uGranularity;


vec3 permute(vec3 x) {
    return mod(((x*34.0)+1.0)*x, 289.0);
}

// 2D Simplex noise
float noise(vec2 st) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);

    vec2 i  = floor(st + dot(st, C.yy));
    vec2 x0 = st - i + dot(i, C.xx);

    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                    + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}



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
  
  // Simulate 3D effect
    float noiseValue = u_amplitude * noise(vec2(uv.x * uGranularity * uSaturation, uHue * (uv.y * uGranularity) + u_time));
    float depth = mix(0.1, 1.0, noiseValue); // Depth based on noise
    vec2 perspectiveUV = uv + (toCenter * depth); // Distort UV coordinates
    
    vec4 texColor = texture2D(uTexture, perspectiveUV);

    vec3 hslColor = rgbToHsl(texColor.rgb);

    // Adjust lightness based on frequency data
    hslColor.z = clamp(hslColor.z * (1.0 + 0.9 * uSmoothedLightness), 0.0, 1.0); // Example of subtle effect
  
   // hslColor.y = clamp(hslColor.y * (1.0 + 0.9 * uSaturation), 0.0, 1.0);
  
    // hslColor.x = clamp(hslColor.x * (1.0 + 0.5 * uHue), 0.0, 360.0);


    vec3 rgbColor = hslToRgb(hslColor);
    gl_FragColor = vec4(rgbColor, 1.0);
    
}