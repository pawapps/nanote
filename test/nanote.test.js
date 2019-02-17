'use strict';

const expect = require('chai').expect;
const Nanote = require('../nanote');

describe('Nanote', function() {

    var nanote = new Nanote();
    var letters = 'etaoinsrhldcumfpgwybvkxjqz';
    var numbers = '1234567890';
    var puncs = ['', '~', '!', '@', '#', '$', '%', '&', '*', '(', ')', '-', '_', '+', '=', ',', '.', '?', '/', '<', '>', ';', ':', '[', ']', '\''].join('');
    var valid_chars = letters + numbers + puncs;

    it('should encode and then decode to the same plaintext string', function() {

        var encoded = nanote.encode(valid_chars);
        var decoded = nanote.decode(encoded);
        expect(decoded).to.be.equal(valid_chars);
    });

    describe('#constructor()', function() {

        it('should reference charsets that contain no more than 1000 sets', function() {
            expect(nanote.charsets.length).to.be.below(1001);
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

    describe('#encode()', function() {

        it('should return false when unsupported character is given', function() {

            expect(nanote.encode('\\')).to.be.equal(false);
        });

        it('should return string when valid characters given', function() {

            expect(nanote.encode(valid_chars)).to.be.a('string');
        });

        it('should return string that matches regular expression', function() {

            expect(nanote.encode('a')).to.match(/^\d+\.\d{30}/);
        });
    });

    describe('#decode()', function() {

        it('should return string when valid characters given', function() {

            var encoded = nanote.encode(valid_chars);
            expect(nanote.decode(encoded)).to.be.a('string');
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

