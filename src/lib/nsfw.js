// Client-side NSFW screening for profile picture uploads - runs entirely in
// the browser via nsfwjs/TensorFlow.js, no image ever leaves the device for
// this check and no paid moderation API is involved.
//
// Importing the top-level "nsfwjs" package pulls in all three of its bundled
// models (including a ~30MB Inception model) into the JS bundle regardless
// of which one is used at runtime, because they're statically imported by
// its default_models.js - it blew the build up to 40+MB. Importing from
// "nsfwjs/core" plus only the single smallest model ("nsfwjs/models/
// mobilenet_v2", ~3.5MB) avoids that entirely; see the "Selective model
// bundles (tree-shaking)" section of the nsfwjs README. This is also fully
// dynamically imported so that 3.5MB never loads until someone actually
// tries to upload a picture.
let modelPromise = null;

function loadModel() {
  if (!modelPromise) {
    modelPromise = Promise.all([import("nsfwjs/core"), import("nsfwjs/models/mobilenet_v2")]).then(
      ([{ load }, { MobileNetV2Model }]) => load("MobileNetV2", { size: 224, modelDefinitions: [MobileNetV2Model] })
    );
  }
  return modelPromise;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that image"));
    img.src = URL.createObjectURL(file);
  });
}

const UNSAFE_CLASSES = ["Porn", "Hentai", "Sexy"];
const UNSAFE_THRESHOLD = 0.6;

// Returns { safe, predictions }. Errs toward blocking on model failure so a
// broken model never becomes a silent bypass.
export async function checkImageSafety(file) {
  const img = await loadImage(file);
  try {
    const model = await loadModel();
    const predictions = await model.classify(img);
    const unsafe = predictions.some((p) => UNSAFE_CLASSES.includes(p.className) && p.probability > UNSAFE_THRESHOLD);
    return { safe: !unsafe, predictions };
  } finally {
    URL.revokeObjectURL(img.src);
  }
}
