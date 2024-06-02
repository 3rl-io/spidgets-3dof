let tradingViewCount = 0;
class ChartWidget extends window.spidgets.SDiv {
    connectedCallback() {
        //default size for charts unless defined by attributes
        this.height = 360;
        this.width = 640;
        super.connectedCallback();

        // After DOM connected load widget script and run with config
        // scriptFromUrl prepends script tag to document if it hasn't been loaded already, then callback
        spidgets.scriptFromUrl('https://s3.tradingview.com/tv.js', () => {
            // Docs: https://www.tradingview.com/widget/advanced-chart/
            new TradingView.widget({
                container_id: this.object3D.element.id = 'tv-embed-' + ++tradingViewCount,
                interval: this.getAttribute('interval') || '15',
                symbol: this.getAttribute('symbol') || 'SPY',

                //boilerplate basically
                hide_top_toolbar: false, theme: 'dark', autosize: true, style: '1', locale: 'en', toolbar_bg: '#f1f3f6', enable_publishing: false,
                allow_symbol_change: true, save_image: false, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
        });
    }
}

customElements.define('chart-widget', ChartWidget);