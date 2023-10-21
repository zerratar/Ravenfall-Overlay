let isLocalTest = false; // Don't touch.

if (window.location.href.indexOf('localhost') > -1 || window.location.href.indexOf('127.0.0.1') > -1) {
    var dev_users = {
        zerratar: { id: '72424639', username: 'zerratar' },
        ravenmmo: { id: '645348224', username: 'ravenmmo' },
        abby: { id: '39575045', username: 'abbycottontail' },
        yreon: { id: '232994157', username: 'varietydefenceforce' },
        c00kies: { id: '83365039', username: 'grandmazc00kies' },
        madgarou: { id: '158976550', username: 'madgarou' },
        tripthefirst: { id: '130814585', username: 'tripthefirst' }
    }

    var debug_streamer = dev_users.tripthefirst;
    var debug_viewer = dev_users.tripthefirst;

    isLocalTest = true;
}

if (isLocalTest || window.location.href.indexOf('letsdohosting.com') > -1) {
    var btnRefreshPanel = document.createElement('div');
    var refreshIcon = document.createElement('i');

    refreshIcon.addEventListener('click', () => {
        window.location.reload(true)
    });

    btnRefreshPanel.className = 'btn btn-refresh-panel';
    refreshIcon.className = 'fa fa-refresh';

    btnRefreshPanel.appendChild(refreshIcon);

    var topBar = document.querySelector('.top-bar');

    topBar.appendChild(btnRefreshPanel);
}