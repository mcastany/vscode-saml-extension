# SAML Extension

This extension adds some helper functionality to work with SAML elements

## Features

* SAML: Sign element
* SAML: Verify signature
* SAML: Encode
* SAML: Encode and deflate
* SAML: Decode
* SAML: Decode and Inflate
* SAML: Decrypt
* SAML: Format certificate as PEM
* SAML: Calculate a certificate thumbprint

## Using

The commands defined by this extensions are in the npm category.

![command palette](images/cmds.png)

## Extension Settings

This extension contributes the following settings:

- `samlExtension.sig_alg`: Configures signature algorithm used when signing an element. Default value `rsa-sha256`
- `samlExtension.digest_alg`: Configure digest algorithm used when signing an element. Default value `sha256` 
- `samlExtension.transforms`: Configure transforms used when signing an element. Default value `["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/2001/10/xml-exc-c14n#" ]`
- `samlExtension.publicKey`: Configure public key certificate used when signing or verifying the signature an element. Default value empty. If set, it should be in PEM format, like this:
```
"-----BEGIN CERTIFICATE-----\n[64 base-64 chars]\n[64 base-64 chars][...]-----END CERTIFICATE-----"
```
- `samlExtension.signaturePrefix`: Configures the Signature Namespace prefix used when signing an Element. Default value `ds`
- `samlExtension.privateKey`: Configures a default private key used when signing an element. Default value empty. If set, it should be in PEM format, like this:
```
"-----BEGIN RSA PRIVATE KEY-----\n[64 base-64 chars]\n[64 base-64 chars][...]-----END RSA PRIVATE KEY-----"
```
