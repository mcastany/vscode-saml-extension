# saml-extension README

This extension adds some helper functionality to work with SAML elements

## Features

* SAML: Sign element
* SAML: Verify signature
* SMAL: Encode
* SAML: Encode and deflate
* SAML: Decode
* SAML: Decode and Inflate

## Using

The commands defined by this extensions are in the npm category.

![command palette](images/cmds.png)

## Extension Settings

Include if your extension adds any VS Code settings through the `xmlSettings` extension point.

For example:

This extension contributes the following settings:

- `samlExtension.sig_alg`: Configures signature algorithm used when signing an element. Default value `rsa-sha256`
- `samlExtension.digest_alg`: Configure digest algorithm used when signing an element. Default value `sha256` 
- `samlExtension.transforms`: Configure transforms used when signing an element. Default value `["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/2001/10/xml-exc-c14n#" ]`
- `samlExtension.publicKey`: Configure public key used when verifying the signature an element. Default value ``
- `samlExtension.signaturePrefix`: Configures the Signature Namespace prefix used when signing an Element. Default value `ds`
