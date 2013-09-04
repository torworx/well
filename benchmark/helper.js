exports.pad = function pad(n, width, z) {
    z = z || ' ';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

exports.columns = function columns(cols, size) {
    if (!Array.isArray(size)) size = [size];
    var align = leftAlign;
    return cols.map(function(val, index) {
        var s = align(String(val), size[Math.min(index, size.length - 1)]);

        align = rightAlign;

        return s;
    }).join('');
};

exports.difference = function difference(r1, r2) {
    return ((r2-r1) / r1) * 100;
};

exports.formatNumber = function formatNumber(x, n) {
    return x === 0 ? '-' : Number(x).toFixed(n);
};

function leftAlign(s, size) {
    while(s.length < size) {
        s = s + ' ';
    }

    return s;
}

function rightAlign(s, size) {
    while(s.length < size) {
        s = ' ' + s;
    }

    return ' ' + s;
}
