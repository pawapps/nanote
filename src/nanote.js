'use strict';

// Nanote - send notes with Nano
// Jason Pawlak
// https://www.github.com/pawapps/nanote

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
        this.minimum_raw = 100000000000000000000000000n;    // 0.0001 Nano
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
     * Calculates the checksum of given string of digits
     * checksum = ( sum(digits) + 1 ) % 10
     * @param {string} string of digits
     * @return {string} checksum value as string. false if error.
     */
    calculate_checksum(digits) {
        // Validate input
        if (typeof digits != 'string') {
            return false;
        }
        if (!digits.match(/^\d+$/)) {
            return false;
        }
        var sum = 0;
        for (var digit of digits) {
            sum = sum + Number(digit);
        }

        sum++;
        return String(sum % 10);
    }

    /**
     * Validates the given checksum for given digits
     * @param {string} digits to calculate checksum
     * @param {string} expected checksum value
     * @return {boolean} true if valid, false if not valid
     */
    validate_checksum(digits, checksum) {
        // Validate input
        if (typeof digits != 'string') {
            return false;
        }
        if (typeof checksum != 'string') {
            return false;
        }
        if (!checksum.match(/^\d$/)) {
            return false;
        }
        if (this.calculate_checksum(digits) == checksum) {
            return true;
        }
        return false;
    }

    /**
     * Encodes plaintext string in Nano value
     * @param {string} plaintext string to encode
     * @return {string} formatted string as Nano value. false if error.
     */
    encode(plaintext) {
        // input validation
        if (typeof plaintext != 'string') {
            if (this.verbose) { console.error('Failed to encode due to non string input'); }
            return false;
        }

        var charset_index = this.shortest_charset(plaintext);
        if (charset_index == -1)
        {
            // No charset found
            if (this.verbose) { console.error('Failed to encode due to no available charset'); }
            return false;
        }
        if (this.verbose) { console.log('Encoding with charset (' + charset_index + '): ' + this.charsets[charset_index]); }
        
        var quotient = this.b10encode(plaintext, this.charsets[charset_index]);

        // Format Nano value string
        quotient = quotient + (this.minimum_raw/BigInt(10**(this.charset_index_length+1)));    // Add minimum_raw (divide charset_index_length+1
                                                                                // because quotient is shifted left to
                                                                                // allow charset index and checksum)
        
        var nano = String(quotient);                                                    // Set encoded string
        nano = nano + String(charset_index).padStart(this.charset_index_length, '0');   // Set charset index
        var checksum = this.calculate_checksum(String(charset_index));                  // Set checksum
        if (checksum == false) {
            if (this.verbose) { console.error('Failed to encode due to failed checksum calculation'); }
            return false;
        }
        nano = nano + checksum;     // Set checksum
        // var nano = this.calculate_checksum(String(charset_index));
        // nano = String(charset_index).padStart(this.charset_index_length, '0');   // Set charset index
        // nano = String(quotient) + nano;                     // Set encoded string
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
        if (typeof nano != 'string') {
            if (this.verbose) { console.error('Failed to decode due to non string input'); }
            return false;
        }
        if (nano.match(/^\d+\.\d{30}/) == null) {
            if (this.verbose) { console.error('Failed to decode due to regex mismatch'); }
            return false;
        }
        try {
            var checksum = nano.slice(-1,);
            var charset_index = Number(nano.slice((this.charset_index_length*-1)-1, -1));
        } catch(err) {
            if (this.verbose) { console.error('Failed to decode due to amount parsing exception'); }
            return false;
        }
        if (this.validate_checksum(String(charset_index), checksum) == false) {
            if (this.verbose) { console.error('Failed to decode due to invalid checksum'); }
            return false;
        }

        if (this.verbose) { console.log('Decoding with charset (' + charset_index + '): ' + this.charsets[charset_index]); }

        // Format Nano value string to quotient
        var quotient = nano.replace('.', '');                                   // remove decimal
        quotient = quotient.slice(0, -1)                                        // remove checksum
        quotient = quotient.slice(0, (this.charset_index_length*-1));           // remove charset index
        quotient = BigInt(quotient);
        quotient = quotient - (this.minimum_raw/BigInt(10**(this.charset_index_length+1)));    // remove minimum_raw (divide charset_index_length+1
                                                                                // and checksum length because quotient was shifted right)
        if (quotient < 0) {
            // nano input was not larger than the minimum raw
            if (this.verbose) { console.error('Failed to decode due to amount not being larger than the minimum raw'); }
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