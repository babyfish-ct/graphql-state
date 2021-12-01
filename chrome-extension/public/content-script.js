window.addEventListener('message', function(e) {
    if (e.source === window && e.data.messageDomain === 'graphQLStateMonitor') {
        chrome.runtime.sendMessage(e.data);
    }
});
