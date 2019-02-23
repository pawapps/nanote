'use strict';

const expect = require('chai').expect;
const Nanote = require('../src/nanote');

describe('Nanote', function() {

    var verbose = true;
    var nanote = new Nanote(verbose);
    var letters = 'etaoinsrhldcumfpgwybvkxjqz';
    var numbers = '1234567890';
    var puncs = ['', '~', '!', '@', '#', '$', '%', '&', '*', '(', ')', '-', '_', '+', '=', ',', '.', '?', '/', '<', '>', ';', ':', '[', ']', '\''].join('');
    var valid_chars = letters + numbers + puncs;

    it('should encode and then decode to the same plaintext string', function() {

        var encoded = nanote.encode(valid_chars);
        console.log('encoded: ' + encoded);
        var decoded = nanote.decode(encoded);
        console.log('decoded: ' + decoded);
        expect(decoded).to.be.equal(valid_chars);
    });

    describe('#constructor()', function() {

        it('should reference charsets that contain 1000 sets', function() {
            expect(nanote.charsets.length).to.be.equal(1000);
        });
    });

    describe('#shortest_charset()', function() {

        it('should return the last charset when all valid characters are given', function() {
            expect(nanote.shortest_charset(valid_chars)).to.be.equal(nanote.charsets.length-1);
        });

        it('should return 0 index when "e" is passed (most used character)', function() {
            expect(nanote.shortest_charset('e')).to.be.equal(0);
        });

        it('should return -1 index when unsupported character is given', function() {
            expect(nanote.shortest_charset('\\')).to.be.equal(-1);
        });
    });

    describe('#calculate_checksum()', function() {
        it('should return valid checksum', function() {
            expect(nanote.calculate_checksum('0')).to.be.equal('1');
            expect(nanote.calculate_checksum('1')).to.be.equal('2');
            expect(nanote.calculate_checksum('12')).to.be.equal('4');
            expect(nanote.calculate_checksum('123')).to.be.equal('7');
            expect(nanote.calculate_checksum('012')).to.be.equal('4');
            expect(nanote.calculate_checksum('999')).to.be.equal('8');
            expect(nanote.calculate_checksum('900')).to.be.equal('0');
            expect(nanote.calculate_checksum('000')).to.be.equal('1');
        });

        it('should return false with invalid input', function() {
            expect(nanote.calculate_checksum('')).to.be.equal(false);
            expect(nanote.calculate_checksum('a')).to.be.equal(false);
            expect(nanote.calculate_checksum('1a')).to.be.equal(false);
            expect(nanote.calculate_checksum(' ')).to.be.equal(false);
            expect(nanote.calculate_checksum(123)).to.be.equal(false);
            expect(nanote.calculate_checksum(true)).to.be.equal(false);
        });
    });

    describe('#validate_checksum()', function() {
        it('should return true if valid checksum', function() {
            expect(nanote.validate_checksum('0', '1')).to.be.equal(true);
            expect(nanote.validate_checksum('1', '2')).to.be.equal(true);
            expect(nanote.validate_checksum('12', '4')).to.be.equal(true);
            expect(nanote.validate_checksum('123', '7')).to.be.equal(true);
            expect(nanote.validate_checksum('012', '4')).to.be.equal(true);
            expect(nanote.validate_checksum('999', '8')).to.be.equal(true);
            expect(nanote.validate_checksum('900', '0')).to.be.equal(true);
            expect(nanote.validate_checksum('000', '1')).to.be.equal(true);
        });

        it('should return false if not valid checksum', function() {
            expect(nanote.validate_checksum('', '')).to.be.equal(false);
            expect(nanote.validate_checksum('', '1')).to.be.equal(false);
            expect(nanote.validate_checksum('', 'a')).to.be.equal(false);
            expect(nanote.validate_checksum('a', '1')).to.be.equal(false);
            expect(nanote.validate_checksum('1a', '2')).to.be.equal(false);
            expect(nanote.validate_checksum(' ', '1')).to.be.equal(false);
            expect(nanote.validate_checksum('a', false)).to.be.equal(false);
            expect(nanote.validate_checksum(false, false)).to.be.equal(false);
            expect(nanote.validate_checksum(false, '1')).to.be.equal(false);
            expect(nanote.validate_checksum('123', 'a')).to.be.equal(false);
        });
    });

    describe('#encode()', function() {

        it('should return false when unsupported character is given', function() {

            expect(nanote.encode('\\')).to.be.equal(false);
            expect(nanote.encode('^')).to.be.equal(false);
            expect(nanote.encode('A')).to.be.equal(false);
        });

        it('should return string when valid characters given', function() {

            expect(nanote.encode(valid_chars)).to.be.a('string');
        });

        it('should return amount that matches expected output format', function() {

            expect(nanote.encode('a')).to.match(/^\d+\.\d{30}/);
        });

        it('should return correct output', function() {
            expect(nanote.encode('e')).to.be.equal('0.000100000000000000000000020001');
            expect(nanote.encode('hello, world!')).to.be.equal('0.000100476884084665303374618942');
            // Including this just to make updating documentation easier
            console.log('encode("hello, world!") is ' + nanote.encode('hello, world!'));
        });
    });

    describe('#encode_raw()', function() {

        it('should return false when unsupported character is given', function() {

            expect(nanote.encode_raw('\\')).to.be.equal(false);
            expect(nanote.encode_raw('^')).to.be.equal(false);
            expect(nanote.encode_raw('A')).to.be.equal(false);
        });

        it('should return string when valid characters given', function() {

            expect(nanote.encode_raw(valid_chars)).to.be.a('string');
        });

        it('should return amount that matches expected output format', function() {

            expect(nanote.encode_raw('a')).to.match(/^\d{31,}/);
        });

        it('should return correct output', function() {
            expect(nanote.encode_raw('e')).to.be.equal('0000100000000000000000000020001');
            expect(nanote.encode_raw('hello, world!')).to.be.equal('0000100476884084665303374618942');
        });
    });

    describe('#decode()', function() {

        it('should return string when valid characters given', function() {

            var encoded = nanote.encode(valid_chars);
            expect(nanote.decode(encoded)).to.be.a('string');
        });

        it('should return false when decoding value smaller than the minimal raw', function() {

            expect(nanote.decode('0.000000000000000000000000011114')).to.be.equal(false);
        });

        it('should return false when invalid input is given', function() {

            expect(nanote.decode('\\')).to.be.equal(false);
            expect(nanote.decode('^')).to.be.equal(false);
            expect(nanote.decode('A')).to.be.equal(false);
            expect(nanote.decode(true)).to.be.equal(false);
            expect(nanote.decode(false)).to.be.equal(false);
            expect(nanote.decode(12345)).to.be.equal(false);
        });

        it('should return correct output', function() {
            expect(nanote.decode('0.000100000000000000000000020001')).to.be.equal('e');
        });
    });

    describe('#decode_raw()', function() {
        it('should return string when valid characters given', function() {

            var encoded = nanote.encode(valid_chars);
            encoded = encoded.replace('.', '');
            expect(nanote.decode_raw(encoded)).to.be.a('string');
        });

        it('should return false when decoding value smaller than the minimal raw', function() {

            expect(nanote.decode_raw('11114')).to.be.equal(false);
            expect(nanote.decode_raw('0000000000000000000000000011114')).to.be.equal(false);
        });

        it('should return false when invalid input is given', function() {

            expect(nanote.decode_raw('')).to.be.equal(false);
            expect(nanote.decode_raw('123')).to.be.equal(false);
            expect(nanote.decode_raw('\\')).to.be.equal(false);
            expect(nanote.decode_raw('^')).to.be.equal(false);
            expect(nanote.decode('A')).to.be.equal(false);
            expect(nanote.decode_raw(true)).to.be.equal(false);
            expect(nanote.decode_raw(false)).to.be.equal(false);
            expect(nanote.decode_raw(12345)).to.be.equal(false);
        });

        it('should return correct output', function() {
            expect(nanote.decode_raw('0000100000000000000000000020001')).to.be.equal('e');
            expect(nanote.decode_raw('100000000000000000000020001')).to.be.equal('e');
        });
    });

    describe('#b10encode()', function() {

        it('should use expected encoding algorithm', function() {

            expect(nanote.b10encode('a', 'a')).to.be.equal(1n);
            expect(nanote.b10encode('aa', 'a')).to.be.equal(3n);
        });
    });

    describe('#b10decode()', function() {

        it('should use expected decoding algorithm', function() {

            expect(nanote.b10decode(1n, 'a')).to.be.equal('a');
            expect(nanote.b10decode(3n, 'a')).to.be.equal('aa');
        });
    });
});

