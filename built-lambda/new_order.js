!function(e,t){for(var r in t)e[r]=t[r]}(exports,function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=48)}({48:function(e,t){let r={"Access-Control-Allow-Headers":"Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin","Content-Type":"application/json","Access-Control-Allow-Methods":"GET, HEADERS, POST, OPTIONS","Access-Control-Max-Age":"8640","Access-Control-Allow-Origin":"*",Vary:"Origin"};t.handler=async function(e,t){try{if("OPTIONS"===e.httpMethod)return{statusCode:"200",HEADERS:r};if("POST"===e.httpMethod){JSON.parse(e.body);return{statusCode:200,body:"Success",HEADERS:r}}return{statusCode:200,body:"yay",HEADERS:r}}catch(e){return console.error(e),{statusCode:500,body:e.toString()}}}}}));