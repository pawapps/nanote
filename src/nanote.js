'use strict';

// Nanote - send notes with Nano
// Jason Pawlak
// https://www.github.com/pawapps/nanote

////
// Protocol
//  0.000000000000000000000000000 000
//  base 10 encoded string        charset index
//
//  Character Set Index:
//   This three digit index represents the set of characters that were used
//   to encode the string.  Using the smallest set of characters is what
//   lets the user create the longest string possible for minimal value.
//
//  Encoded String:
//   The value of the encoded string is dependent on the character set
//   used and the length of the string.  There are no protocol limitations
//   on the length of the decoded string, only the total supply of Nano
//   or the balance of your sending account.
//
//  Minimum value is added to value to ensure receive block is created
//
//  How it works:
//   1. A string of characters is given for encoding
//   2. The shortest character set to cover the string is found
//   3. Each character in the string has a value assigned to it
//      based on the character set selected.
//   4. The string values are encoded in base 10
//   5. The standardized character set index is appended to the
//      encoded string
//   6. A minimum value is added to the resulting value.  This is
//      to ensure normal wallets will create a receive block.  Most
//      wallets have a minimum receive to block small transaction spam.
//   7. Send a Nano transaction with the resulting value and the
//      receiver can decode the value to reveal the message.
//
//  Implementation:
//   This library simply gives a value for a transaction.  How
//   transactions are sent, received, and tracked is up to the
//   implementation.  Simply decoding all blocks on the Nano network
//   will give lots of messages that were not encoded with Nanote.
//   Some possible implementations...
//   - Monitor an account in which all transactions are encoded
//     messages.  Decode each block sent/received by that account.
//   - Monitor a representative account so that all transactions
//     with that representative are decoded.  This would be similar
//     to a chat channel.

/**
 * Generates the character sets
 */
var gen_charsets = function() {
    var charsets = [];
    var letters = 'etaoinsrhldcumfpgwybvkxjqz';     // sorted by usage frequency in the English language
    var letters_no_vowels = 'tnsrhldcmfpgwbvkxjqz';
    var numbers = '1234567890';
    var puncs_list = ['', '~', '!', '@', '#', '$', '%', '&', '*', '(', ')', '-', '_', '+', '=', ',', '.', '?', '/', '<', '>', ';', ':', '[', ']', '\''];
    var puncs = puncs_list.slice(0);
    
    // Groups punctuations
    for (var i=0; i<puncs_list.length; i=i+4) { puncs.push(puncs_list.join('').slice(i, i+4)); }
    for (var i=0; i<puncs_list.length; i=i+8) { puncs.push(puncs_list.join('').slice(i, i+8)); }
    for (var i=0; i<puncs_list.length; i=i+16) { puncs.push(puncs_list.join('').slice(i, i+16)); }
    puncs.push(puncs_list.join(''));
    for (var punc of puncs)
    {
        // Punctuation
        for (var i=10; i<=letters.length; i++)
        {
            charsets.push(' ' + letters.slice(0, i) + punc);
        }

        // Numbers and punctuation
        charsets.push(' ' + letters.slice(0, 10) + numbers + punc);
        charsets.push(' ' + letters.slice(0, 14) + numbers + punc);
        charsets.push(' ' + letters.slice(0, 18) + numbers + punc);
        charsets.push(' ' + letters.slice(0, 22) + numbers + punc);
        charsets.push(' ' + letters + numbers + punc);

        // No vowels
        charsets.push(' ' + letters_no_vowels + punc);
        charsets.push(' ' + letters_no_vowels + numbers + punc);

        // Only numbers, no letters
        charsets.push(' ' + numbers + punc);
    }
    // Sort charsets so shortests charsets are at the beginning
    charsets = charsets.sort(function(a,b) { return a.length - b.length; });
    console.log('Generated ' + charsets.length + ' charsets');
    return charsets;
}

class Nanote {

    constructor(verbose=false) {

        this.charsets = gen_charsets();
        this.minimum_raw = 10000000000000000000000000n;    // 0.00001 Nano
        this.charset_index_length = 3;
        this.verbose = verbose;

    }

    /**
     * Finds the shortest character set for given string.  Returns -1 on error.
     * @param {string} plaintext string
     * @return {number} index of charsets. -1 on error.
     */
    shortest_charset(plaintext) {
        // Keep only unique characters in plaintext
        plaintext = String.prototype.concat(...new Set(plaintext));

        var ret = -1;
        var good_charset = true;

        // Iterate over all charsets
        for (var counter in this.charsets)
        {
            var charset = this.charsets[counter];
            good_charset = true;
            
            // Iterate over all characters in plaintext
            for (var char of plaintext)
            {
                // Plaintext character not found in this charset
                if (charset.indexOf(char) == -1)
                {
                    good_charset = false;
                    break;
                }
            }

            if (good_charset)
            {
                // Return first good charset because shorter charsets are
                // iterated over before longer charsets.
                return Number(counter);
            }
        }

        return ret;
    }

    /**
     * Encodes plaintext string in Nano value
     * @param {string} plaintext string to encode
     * @return {string} formatted string as Nano value. false if error.
     */
    encode(plaintext) {
        var charset_index = this.shortest_charset(plaintext);
        if (charset_index == -1)
        {
            // No charset found
            return false;
        }
        if (this.verbose) { console.log('Encoding with charset (' + charset_index + '): ' + this.charsets[charset_index]); }
        
        var quotient = this.b10encode(plaintext, this.charsets[charset_index]);

        // Format Nano value string
        quotient = quotient + (this.minimum_raw/BigInt(10**this.charset_index_length));    // Add minimum_raw (divide charset_index_length
                                                                                // because quotient is shifted left to
                                                                                // allow charset index)
        var nano = String(charset_index).padStart(this.charset_index_length, '0');   // Set charset index
        nano = String(quotient) + nano;                     // Set encoded string
        nano = nano.padStart(31, '0');                      // Ensure leading zeros
        nano = nano.slice(0, -30) + '.' + nano.slice(-30);  // Add decimal
     
        return nano;
    }

    /**
     * Decodes Nano value string into plaintext string
     * @param {string} nano value as string
     * @return {string} plaintext decoded string. false if error.
     */
    decode(nano)
    {
        // Input validation
        if (nano.match(/^\d+\.\d{30}/) == null) {
            return false;
        }
        try {
            var charset_index = Number(nano.slice(this.charset_index_length*-1));
        } catch(err) {
            return false;
        }
        if (this.verbose) { console.log('Decoding with charset (' + charset_index + '): ' + this.charsets[charset_index]); }

        // Format Nano value string to quotient
        var quotient = nano.replace('.', '');                                   // remove decimal
        quotient = quotient.slice(0, this.charset_index_length*-1);             // remove charset
        quotient = BigInt(quotient);
        quotient = quotient - (this.minimum_raw/BigInt(10**this.charset_index_length));    // remove minimum_raw (divide charset_index_length
                                                                                // because quotient was shifted right)
        if (quotient < 0) {
            // nano input was not larger than the minimum raw
            return false;
        }
        var plaintext = this.b10decode(BigInt(quotient), this.charsets[charset_index]);

        return plaintext;
    }

    /**
     * Base 10 encodes plaintext string from given charset
     * @param {string} plaintext string in which to encode
     * @param {string} character array where index denotes encoded value
     * @return {BigInt} value of encoding
     */
    b10encode(plaintext, charset)
    {
        var quotient = 0n;
        var modulus = 0n;

        for (var char of plaintext)
        {
            modulus = BigInt(charset.indexOf(char)+1);
            quotient = (quotient * BigInt(charset.length+1)) + modulus
        }

        return quotient;
    }

    /**
     * Base 10 decode BigInt from given charset
     * @param {BigInt} value of encoding
     * @param {string} character array where index denotes encoded value
     * @return {string} plaintext decoded string
     */
    b10decode(quotient, charset)
    {
        var plaintext = '';
        var modulus = 0n;

        while (quotient != 0n || modulus != 0n)
        {
            modulus = quotient % BigInt(charset.length+1);
            if (quotient > 0n)
            {
                quotient = BigInt(quotient / BigInt(charset.length+1));
            }
            if (modulus > 0n)
            {
                plaintext = charset[modulus-1n] + plaintext;
            }
        }

        return plaintext;
    }

}

module.exports = Nanote;