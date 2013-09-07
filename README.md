# well.js

Well.js is lightweight Promises implemention. It evolved from [when](https://github.com/cujojs/when)-[1.8.1](https://github.com/cujojs/when/releases/tag/1.8.1) for  getting higher performance. The article [Promises/A+ Performance Hits You Should Be Aware Of](http://thanpol.as/javascript/promises-a-performance-hits-you-should-be-aware-of/) described the benchmark defference of some common promise implementations. In addition, well.js also provide:

* Native cancelable deferred
* Extendable promise through `well.extend`
* Throw exception for uncaught error

It is [very fast](https://github.com/torworx/promise-benchmark#test-results) and compact, and has no external dependencies.
