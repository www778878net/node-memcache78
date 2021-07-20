'use strict';
const expect = require('chai').expect;
const MemCache = require('../dist/index').default;
var iconv = require('iconv-lite');
var fs = require('fs'); 
console.log(process.argv)
var fspath = process.argv[3]
var config = loadjson(fspath);
console.log(config)
function loadjson(filepath) {
    var data;
    try {
        var jsondata = iconv.decode(fs.readFileSync(filepath, "binary"), "utf8");
        data = JSON.parse(jsondata); 
    }
    catch (err) {
        console.log(err);
    }
    return data;
}
let memcached78 = new MemCache(config["memcached"]);


describe('test set  ', () => {
    it(' return true', () => { 
        return memcached78.set("testitem", 1, 60).then(function (result) {
            console.log(result);
            expect(result).to.be.true;
        })  
    });
});

describe('test get  ', () => {
    it(' return 1', () => {
        return memcached78.get("testitem").then(function (result) {
            console.log(result);
            expect(result).to.equals(1);
        })
    });
}); 

describe('test incr  ', () => {
    it(' return 2', () => {
        return memcached78.incr("testitem").then(function (result) {
            console.log(result);
            expect(result).to.equals(2);
        })
    });
}); 

describe('test del  ', () => {
    it(' return true', () => {
        return memcached78.del("testitem").then(function (result) {
            console.log(result);
            expect(result).to.be.true;
        })
    });
}); 

describe('test tbset  ', () => {
    it(' return true', () => {
        return memcached78.tbset("testitemset", {test:1,test2:2},30).then(function (result) {
            console.log(result);
            expect(result).to.be.true;
        })
    });
}); 

describe('test tbget  ', () => {
    it(' return true', () => {
        return memcached78.tbget("testitemset" ).then(function (result) {
            console.log(result);
            expect(result["test2"]).to.equals(2);
        })
    });
});

 