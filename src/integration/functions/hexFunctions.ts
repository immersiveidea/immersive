export function hex_to_ascii(input) {
    const hex = input.toString();
    let output = '';
    for (let n = 0; n < hex.length; n += 2) {
        output += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return output;
}

export function ascii_to_hex(str) {
    const arr1 = [];
    for (let n = 0, l = str.length; n < l; n++) {
        const hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}