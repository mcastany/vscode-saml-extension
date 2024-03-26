const crypto        = require('crypto');
const xmldom        = require('xmldom');
const DOMParser     = xmldom.DOMParser;
const whitespace    = /^\s+$/;

// Utils
export function removeHeaders(cert) {
  var pem = /-----BEGIN (\w*)-----([^-]*)-----END (\w*)-----/g.exec(cert.toString());
  if (pem && pem.length > 0) {
    return pem[2].replace(/[\n|\r\n]/g, '');
  }
  return cert;
}

export function formatCert(cert) {
  var pem = /-----BEGIN ([\w,\s]*)-----([^-]*)-----END ([\w,\s]*)-----/g.exec(cert.toString());
  if (pem && pem.length > 0) {
    return cert.replace(pem[2], pem[2].replace(/ /g, "\r\n"));
  }

  return cert.replace(/ /g, "\r\n");
}

export function calculateThumbprint(pem) {
  const cert = removeHeaders(pem);
  const shasum = crypto.createHash('sha1');
  const der = Buffer.from(cert, 'base64').toString('binary')
  shasum.update(der, 'binary');
  return shasum.digest('hex');
}

export function removeEmptyNodes(node) {
  for (var i = 0; i < node.childNodes.length; i++){
    var current = node.childNodes[i];
    if (current.nodeType === 3 && whitespace.test(current.nodeValue)) {
      node.removeChild(current);
    } else if (current.nodeType === 1) {
      removeEmptyNodes(current); //remove whitespace on child element's children
    }
  }
}

export function trimXML(xml) {
  var XMLSerializer = xmldom.XMLSerializer;
  var dom = new DOMParser().parseFromString(xml);
  var serializer = new XMLSerializer();
  removeEmptyNodes(dom);
  return serializer.serializeToString(dom);
}

export function certToPEM(cert) {
  if (/-----BEGIN CERTIFICATE-----/.test(cert)) {
    return cert;
  }
  
  // remove all non base64 characters
  cert = cert.replace(/[^A-Za-z0-9+/=]/g, "");
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = "-----BEGIN CERTIFICATE-----\n" + cert;
  cert = cert + "\n-----END CERTIFICATE-----\n";
  return cert;
}

export function normalizeLineEndings(xmlText) {
  // normalize line endings
  // this should be done once, before parsing the raw XML string
  return xmlText.replace(/\r\n?/g, "\n");
}

export function encodeCarriageReturns(xmlText) {
  // re-encode carriage returns that remain after line
  // ending normalization.
  return xmlText.replace(/\r/g, "&#13;");
}