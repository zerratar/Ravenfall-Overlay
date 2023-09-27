
var ExpValuePostfix = [ ' ', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'R', 'Q' ];
var AmountPostFix = [ '', 'K', 'M', 'B', 'T', 'Q' ];

function formatValue(value, postfix, secondary = "Q") {
    let thousands = 0;
    while (value > 1000) {
        value = (value / 1000);
        thousands++;
    }
    if (thousands == 0) {
        return value;
    }
    const pLen = postfix.length - 1;
    const p0 = ((thousands - 1) % pLen)+1;
    const q = thousands >= pLen ? secondary : "";
    return value.toFixed(1) + postfix[0] + postfix[p0] + q;
}

function formatExp(amount) {
    return formatValue(amount, AmountPostFix, "");//ExpValuePostfix);
}

function formatAmount(amount) {
    return formatValue(amount, AmountPostFix, "");
}

function formatTimeShort(totalSeconds) {
    if (totalSeconds < 60) {
        return Math.floor(totalSeconds) + "s";
    }
    const totalMinutes = Math.floor(totalSeconds / 60);
    if (totalMinutes < 60) {
        return totalMinutes + "m";
    }

    const totalHours = Math.floor(totalMinutes / 60);
    return totalHours + "h+";
}