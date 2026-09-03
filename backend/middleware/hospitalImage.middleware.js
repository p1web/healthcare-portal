// middleware/hospitalImage.middleware.js
//
// Multer factories used for public hospital profile / banner uploads.
// Reuses the shared `createImageUpload` helper (which pins subfolder,
// MIME whitelist, and per-user path) and only adds slot-specific size
// limits plus image-dimension validation via `image-size`.
const fs = require('fs');
const { imageSize } = require('image-size');
const { createImageUpload } = require('./profileImage.middleware');

const IMAGE_RULES = {
  profile: {
    subfolder: 'hospital-profile-images',
    maxBytes: 2 * 1024 * 1024,
    minWidth: 200,
    minHeight: 200,
    maxWidth: 2048,
    maxHeight: 2048,
    minAspect: 0.8,
    maxAspect: 1.25,
    aspectLabel: 'square (near 1:1)'
  },
  banner: {
    subfolder: 'hospital-banner-images',
    maxBytes: 5 * 1024 * 1024,
    minWidth: 1200,
    minHeight: 300,
    maxWidth: 3840,
    maxHeight: 1440,
    minAspect: 2,
    maxAspect: 6,
    aspectLabel: 'wide (between 2:1 and 6:1)'
  }
};

function createHospitalImageUpload(slot) {
  const rules = IMAGE_RULES[slot];
  if (!rules) throw new Error(`Unknown hospital image slot '${slot}'`);
  return createImageUpload(rules.subfolder, { maxBytes: rules.maxBytes });
}

function safeUnlink(absoluteFilePath) {
  fs.promises.unlink(absoluteFilePath).catch(() => { /* ignore */ });
}

/**
 * Validates the image dimensions and aspect ratio for the given slot.
 * On failure the uploaded file is deleted and a human-readable message
 * is returned. On success returns `{ ok: true, dimensions }`.
 */
function validateHospitalImageFile(slot, absoluteFilePath) {
  const rules = IMAGE_RULES[slot];
  if (!rules) throw new Error(`Unknown hospital image slot '${slot}'`);

  let dimensions;
  try {
    const buffer = fs.readFileSync(absoluteFilePath);
    dimensions = imageSize(buffer);
  } catch (err) {
    safeUnlink(absoluteFilePath);
    return { ok: false, message: 'Uploaded file is not a readable image' };
  }

  const { width, height } = dimensions;
  if (!width || !height) {
    safeUnlink(absoluteFilePath);
    return { ok: false, message: 'Uploaded file has no readable dimensions' };
  }

  if (width < rules.minWidth || height < rules.minHeight) {
    safeUnlink(absoluteFilePath);
    return {
      ok: false,
      message: `Image is too small (${width}x${height}px). Minimum size is ${rules.minWidth}x${rules.minHeight}px.`
    };
  }

  if (width > rules.maxWidth || height > rules.maxHeight) {
    safeUnlink(absoluteFilePath);
    return {
      ok: false,
      message: `Image is too large (${width}x${height}px). Maximum size is ${rules.maxWidth}x${rules.maxHeight}px.`
    };
  }

  const aspect = width / height;
  if (aspect < rules.minAspect || aspect > rules.maxAspect) {
    safeUnlink(absoluteFilePath);
    return {
      ok: false,
      message: `Image aspect ratio must be ${rules.aspectLabel}. Uploaded image is ${aspect.toFixed(2)}:1.`
    };
  }

  return { ok: true, dimensions };
}

module.exports = {
  IMAGE_RULES,
  createHospitalImageUpload,
  validateHospitalImageFile,
  safeUnlink
};
