# Nanote

[![npm version](https://img.shields.io/npm/v/nanote.svg)](https://www.npmjs.com/package/nanote)
[![Build Status](https://travis-ci.org/pawapps/nanote.svg?branch=master)](https://travis-ci.org/pawapps/nanote)

Send short messages in the Nano currency protocol

## Installation

  `npm install nanote`

## Usage

### Node.js

See example [here](examples/nodejs)

    var Nanote = require('nanote');

    var verbose = true;
    var nanote = new Nanote(verbose);

    var encoded = nanote.encode('hello, world!');
    // 0.000100476884084665303374618942

    var decoded = nanote.decode(encoded);
    // hello, world!

### Client Side (via [Browserify](https://github.com/browserify/browserify#example))

See example [here](examples/client_side)

    // Instantiate nanote in index.js
    var Nanote = require('nanote');
    var verbose = true;
    var nanote = new Nanote(verbose);

    // browserify index.js > bundle.js

    // Include <script src="bundle.js"></script> in file.html
    <script>
    var encoded = nanote.encode('hello, world!');
    // 0.000100476884084665303374618942
    var decoded = nanote.decode(encoded);
    // hello, world!
    </script>

## Tests

  `npm test`

## Protocol
    0.00000000000000000000000000  000           0
    base 10 encoded string        charset index checksum

### Encoded String:
The value of the encoded string is dependent on the character set used and the length of the string.  There are no protocol limitations on the length of the decoded string, only the total supply of Nano or the balance of your sending account.

### Character Set Index:
This three digit index represents the set of characters that were used to encode the string.  Using the smallest set of characters is what lets the user create the longest string possible for minimal value.

### Checksum:
The checksum is used to filter nanote messages from regular nano transactions.
The checksum is... ( sum(charset index) + 1 ) % 10.
The +1 is so a transaction with all zeros (the majority of nano transactions does not have a checksum of 0).

Minimum value is added to value to ensure receive block is created

## How it works:
1. A string of characters is given for encoding
2. The shortest character set to cover the string is found
3. Each character in the string has a value assigned to it based on the character set selected.
4. The string values are encoded in base 10
5. The standardized character set index is set in the value
6. A checksum is calculated and set in the value
7. A minimum value is added to the resulting value.  This is to ensure normal wallets will create a receive block.  Most wallets have a minimum receive to block small transaction spam.
8. Send a Nano transaction with the resulting value and the receiver can decode the value to reveal the message.

## Implementation:
This library simply gives a value for a transaction.  How transactions are sent, received, and tracked is up to the implementation.  Simply decoding all blocks on the Nano network will give lots of messages that were not encoded with Nanote.
  
Some possible implementations...

- Monitor an account in which all transactions are encoded messages.  Decode each block sent/received by that account.
- Monitor a representative account so that all transactions with that representative are decoded.  This would be similar to a chat channel.

## Contributing

Contributions and comments welcome.