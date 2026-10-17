/**
 * Browser-native download utilities for files, blobs, text, and data URLs.
 */

/**
 * Creates a temporary anchor link and triggers browser download of a Blob object.
 *
 * @param {Blob} blob - The Blob to download.
 * @param {string} [filename='download'] - The default filename for the downloaded file.
 * @returns {boolean} True if download was triggered successfully, false otherwise.
 */
export function downloadBlob(blob, filename = 'download') {
  const isValidBlob = Boolean(
    blob &&
      typeof blob === 'object' &&
      (typeof Blob !== 'undefined'
        ? blob instanceof Blob || (typeof blob.size === 'number' && typeof blob.slice === 'function')
        : true)
  );

  if (!isValidBlob) {
    return false;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const urlHelper = window.URL || URL;
  if (!urlHelper || typeof urlHelper.createObjectURL !== 'function') {
    return false;
  }

  const objectUrl = urlHelper.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = typeof filename === 'string' && filename.trim() ? filename.trim() : 'download';
  link.style.display = 'none';

  if (document.body) {
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (document.documentElement) {
    document.documentElement.appendChild(link);
    link.click();
    document.documentElement.removeChild(link);
  } else {
    link.click();
  }

  if (typeof urlHelper.revokeObjectURL === 'function') {
    urlHelper.revokeObjectURL(objectUrl);
  }

  return true;
}

/**
 * Encodes a string as a Blob and triggers download.
 *
 * @param {string} content - The text content to download.
 * @param {string} [filename='download.txt'] - The name of the file to save.
 * @param {string} [mimeType='text/plain'] - The MIME type for the Blob (defaults to text/plain).
 * @returns {boolean} True if download was triggered successfully, false otherwise.
 */
export function downloadText(content, filename = 'download.txt', mimeType = 'text/plain') {
  if (content === null || content === undefined) {
    return false;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const textContent = typeof content === 'string' ? content : String(content);
  const type = typeof mimeType === 'string' && mimeType.trim() ? mimeType.trim() : 'text/plain';
  const name = typeof filename === 'string' && filename.trim() ? filename.trim() : 'download.txt';

  const blob = new Blob([textContent], { type });
  return downloadBlob(blob, name);
}

/**
 * Stringifies data as JSON and downloads as a .json file.
 *
 * @param {*} data - The data object or value to serialize to JSON.
 * @param {string} [filename='data.json'] - The name of the JSON file.
 * @returns {boolean} True if download was triggered successfully, false otherwise.
 */
export function downloadJSON(data, filename = 'data.json') {
  if (data === null || data === undefined) {
    return false;
  }

  let jsonString;
  try {
    jsonString = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Failed to stringify JSON data for download:', error);
    return false;
  }

  let finalFilename = typeof filename === 'string' && filename.trim() ? filename.trim() : 'data.json';
  if (!finalFilename.toLowerCase().endsWith('.json')) {
    finalFilename += '.json';
  }

  return downloadText(jsonString, finalFilename, 'application/json');
}

/**
 * Triggers browser download from a base64 data URL.
 *
 * @param {string} dataURL - The base64 or encoded data URL string.
 * @param {string} [filename='download'] - The name for the downloaded file.
 * @returns {boolean} True if download was triggered successfully, false otherwise.
 */
export function downloadDataURL(dataURL, filename = 'download') {
  if (!dataURL || typeof dataURL !== 'string' || !dataURL.trim()) {
    return false;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const link = document.createElement('a');
  link.href = dataURL.trim();
  link.download = typeof filename === 'string' && filename.trim() ? filename.trim() : 'download';
  link.style.display = 'none';

  if (document.body) {
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (document.documentElement) {
    document.documentElement.appendChild(link);
    link.click();
    document.documentElement.removeChild(link);
  } else {
    link.click();
  }

  return true;
}
