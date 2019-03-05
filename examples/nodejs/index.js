var Nanote = require('nanote');

var nanote = new Nanote();

var plaintext = 'hello, world!';
console.log('Plaintext: ' + plaintext);
// Plaintext: hello, world!

var encoded = nanote.encode(plaintext);
console.log('Encoded: ' + encoded);
// Encoded: 0.000102182701366461085457178942

var decoded = nanote.decode(encoded);
console.log('Decoded: ' + decoded);
// Decoded: hello, world!