export function initReaderControls() {
    let currentFontSize = 16;
    let isSyncScroll = true;
    
    const sourceText = document.getElementById('source-text');
    const vpText = document.getElementById('vp-text');
    const targetText = document.getElementById('target-text');
    const panes = [sourceText, vpText, targetText];
    
    document.getElementById('btn-font-inc')?.addEventListener('click', () => {
        currentFontSize = Math.min(currentFontSize + 2, 32);
        panes.forEach(pane => pane.style.fontSize = currentFontSize + 'px');
    });
    
    document.getElementById('btn-font-dec')?.addEventListener('click', () => {
        currentFontSize = Math.max(currentFontSize - 2, 12);
        panes.forEach(pane => pane.style.fontSize = currentFontSize + 'px');
    });
    
    const btnSyncScroll = document.getElementById('btn-sync-scroll');
    btnSyncScroll?.addEventListener('click', () => {
        isSyncScroll = !isSyncScroll;
        btnSyncScroll.style.color = isSyncScroll ? 'var(--accent-color)' : 'inherit';
    });
    
    let isScrolling = false;
    const scrollContainers = panes.map(p => p?.closest('.editor-container')).filter(Boolean);
    
    function syncScroll(e) {
        if (!isSyncScroll || isScrolling) return;
        isScrolling = true;
        const source = e.target;
        // prevent divide by zero
        const scrollRange = source.scrollHeight - source.clientHeight;
        const percentage = scrollRange > 0 ? source.scrollTop / scrollRange : 0;
        
        scrollContainers.forEach(container => {
            if (container !== source) {
                const targetRange = container.scrollHeight - container.clientHeight;
                if (targetRange > 0) {
                    container.scrollTop = percentage * targetRange;
                }
            }
        });
        
        setTimeout(() => { isScrolling = false; }, 50);
    }
    
    scrollContainers.forEach(container => container.addEventListener('scroll', syncScroll));
}
