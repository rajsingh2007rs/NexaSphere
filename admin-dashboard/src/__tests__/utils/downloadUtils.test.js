import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  downloadBlob,
  downloadText,
  downloadJSON,
  downloadDataURL,
} from '../../utils/downloadUtils.js';

describe('downloadUtils', () => {
  let createdAnchors = [];
  let appendChildSpy;
  let removeChildSpy;
  let clickSpy;
  let createObjectURLSpy;
  let revokeObjectURLSpy;

  beforeEach(() => {
    createdAnchors = [];

    // Mock URL object methods
    createObjectURLSpy = vi.fn().mockImplementation((blob) => {
      return `blob:http://localhost/mock-blob-${Date.now()}`;
    });
    revokeObjectURLSpy = vi.fn();

    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;

    // Spy on DOM operations
    appendChildSpy = vi.spyOn(document.body, 'appendChild');
    removeChildSpy = vi.spyOn(document.body, 'removeChild');
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      createdAnchors.push(this);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadBlob', () => {
    it('creates a temporary anchor with href and download attributes and clicks it', () => {
      const testBlob = new Blob(['Hello World'], { type: 'text/plain' });
      const filename = 'sample.txt';

      const result = downloadBlob(testBlob, filename);

      expect(result).toBe(true);
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      expect(createObjectURLSpy).toHaveBeenCalledWith(testBlob);

      const objectUrl = createObjectURLSpy.mock.results[0].value;

      expect(appendChildSpy).toHaveBeenCalledTimes(1);
      const anchor = appendChildSpy.mock.calls[0][0];

      expect(anchor.tagName.toLowerCase()).toBe('a');
      expect(anchor.href).toBe(objectUrl);
      expect(anchor.download).toBe(filename);

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalledWith(anchor);

      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(objectUrl);
    });

    it('uses "download" as default filename when none is provided', () => {
      const testBlob = new Blob(['sample data'], { type: 'application/octet-stream' });
      downloadBlob(testBlob);

      const anchor = appendChildSpy.mock.calls[0][0];
      expect(anchor.download).toBe('download');
    });

    it('removes the temporary anchor from the DOM after download', () => {
      const testBlob = new Blob(['test content'], { type: 'text/plain' });
      downloadBlob(testBlob, 'test.txt');

      const anchor = appendChildSpy.mock.calls[0][0];
      expect(removeChildSpy).toHaveBeenCalledWith(anchor);
      expect(document.body.contains(anchor)).toBe(false);
    });

    it('gracefully returns false for null or undefined blob', () => {
      expect(downloadBlob(null, 'test.txt')).toBe(false);
      expect(downloadBlob(undefined, 'test.txt')).toBe(false);
      expect(createObjectURLSpy).not.toHaveBeenCalled();
      expect(appendChildSpy).not.toHaveBeenCalled();
    });

    it('gracefully returns false for invalid non-blob objects', () => {
      expect(downloadBlob('not-a-blob', 'test.txt')).toBe(false);
      expect(downloadBlob(12345, 'test.txt')).toBe(false);
      expect(downloadBlob({}, 'test.txt')).toBe(false);
      expect(createObjectURLSpy).not.toHaveBeenCalled();
    });
  });

  describe('downloadText', () => {
    it('encodes string as a Blob and triggers download with default text/plain and download.txt', () => {
      const content = 'Test plain text content';
      const result = downloadText(content);

      expect(result).toBe(true);
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);

      const createdBlob = createObjectURLSpy.mock.calls[0][0];
      expect(createdBlob).toBeInstanceOf(Blob);
      expect(createdBlob.type).toBe('text/plain');

      const anchor = appendChildSpy.mock.calls[0][0];
      expect(anchor.download).toBe('download.txt');
      expect(removeChildSpy).toHaveBeenCalledWith(anchor);
    });

    it('supports custom filename and custom MIME type', () => {
      const csvData = 'id,name\n1,Alpha\n2,Beta';
      const result = downloadText(csvData, 'export.csv', 'text/csv');

      expect(result).toBe(true);

      const createdBlob = createObjectURLSpy.mock.calls[0][0];
      expect(createdBlob.type).toBe('text/csv');

      const anchor = appendChildSpy.mock.calls[0][0];
      expect(anchor.download).toBe('export.csv');
    });

    it('handles empty string content gracefully', () => {
      const result = downloadText('');
      expect(result).toBe(true);
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    });

    it('handles non-string primitives by converting to string', () => {
      const result = downloadText(123456, 'number.txt');
      expect(result).toBe(true);
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    });

    it('gracefully returns false for null or undefined content', () => {
      expect(downloadText(null, 'test.txt')).toBe(false);
      expect(downloadText(undefined, 'test.txt')).toBe(false);
      expect(createObjectURLSpy).not.toHaveBeenCalled();
    });
  });

  describe('downloadJSON', () => {
    it('stringifies object data as JSON and downloads as .json file with application/json type', () => {
      const data = { id: 101, name: 'NexaSphere', active: true };
      const result = downloadJSON(data, 'project-config');

      expect(result).toBe(true);
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);

      const createdBlob = createObjectURLSpy.mock.calls[0][0];
      expect(createdBlob.type).toBe('application/json');

      const anchor = appendChildSpy.mock.calls[0][0];
      expect(anchor.download).toBe('project-config.json');
      expect(removeChildSpy).toHaveBeenCalledWith(anchor);
    });

    it('preserves .json extension if already provided in filename', () => {
      const data = [{ id: 1 }, { id: 2 }];
      downloadJSON(data, 'records.json');

      const anchor = appendChildSpy.mock.calls[0][0];
      expect(anchor.download).toBe('records.json');
    });

    it('defaults to data.json when filename is not specified', () => {
      downloadJSON({ test: true });

      const anchor = appendChildSpy.mock.calls[0][0];
      expect(anchor.download).toBe('data.json');
    });

    it('gracefully returns false for null or undefined data', () => {
      expect(downloadJSON(null, 'null.json')).toBe(false);
      expect(downloadJSON(undefined, 'undefined.json')).toBe(false);
      expect(createObjectURLSpy).not.toHaveBeenCalled();
    });

    it('gracefully returns false for circular data structures that cannot be stringified', () => {
      const circular = {};
      circular.self = circular;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = downloadJSON(circular, 'circular.json');

      expect(result).toBe(false);
      expect(createObjectURLSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('downloadDataURL', () => {
    it('triggers download from a base64 data URL and cleans up the anchor', () => {
      const sampleDataURL =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const filename = 'avatar.png';

      const result = downloadDataURL(sampleDataURL, filename);

      expect(result).toBe(true);
      expect(appendChildSpy).toHaveBeenCalledTimes(1);

      const anchor = appendChildSpy.mock.calls[0][0];
      expect(anchor.tagName.toLowerCase()).toBe('a');
      expect(anchor.href).toBe(sampleDataURL);
      expect(anchor.download).toBe(filename);

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalledWith(anchor);
      expect(document.body.contains(anchor)).toBe(false);
    });

    it('defaults filename to "download" when none is provided', () => {
      const sampleDataURL = 'data:text/plain;base64,SGVsbG8gV29ybGQ=';
      downloadDataURL(sampleDataURL);

      const anchor = appendChildSpy.mock.calls[0][0];
      expect(anchor.download).toBe('download');
    });

    it('gracefully returns false for null, undefined, empty, or non-string inputs', () => {
      expect(downloadDataURL(null, 'file.txt')).toBe(false);
      expect(downloadDataURL(undefined, 'file.txt')).toBe(false);
      expect(downloadDataURL('', 'file.txt')).toBe(false);
      expect(downloadDataURL('   ', 'file.txt')).toBe(false);
      expect(downloadDataURL(12345, 'file.txt')).toBe(false);
      expect(downloadDataURL({}, 'file.txt')).toBe(false);

      expect(appendChildSpy).not.toHaveBeenCalled();
      expect(clickSpy).not.toHaveBeenCalled();
    });
  });
});
