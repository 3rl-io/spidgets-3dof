class WeatherWidget extends window.spidgets.SDiv {
    connectedCallback() {
        this.height = 230;
        this.width = 380;

        this.object3D.element.innerHTML += `
            <div id="ww_0fee1cb61470e" v='1.3' loc='auto' width="430px" height="380px" class="transparent"
                a='{"t":"horizontal","lang":"en","sl_lpl":1,"ids":[],"font":"Arial","sl_ics":"one","sl_sot":"fahrenheit","cl_bkg":"image","cl_font":"#FFFFFF","cl_cloud":"#FFFFFF","cl_persp":"#81D4FA","cl_sun":"#FFC107","cl_moon":"#FFC107","cl_thund":"#FF5722"}'>
                More forecasts: <a href="https://wetterlabs.de/wetter_deutschland/30_tage/" id="ww_0fee1cb61470e_u" target="_blank">30 tage wettervorhersage</a>
            </div>
            `;

        /*
        <div id="ww_432e9d2bd2045" v='1.3' loc='auto' width="240px" height="200px" class="transparent"
                a='{"t":"responsive","lang":"en","sl_lpl":1,"ids":[],"font":"Arial","sl_ics":"one","sl_sot":"fahrenheit","cl_bkg":"image","cl_font":"#FFFFFF","cl_cloud":"#FFFFFF","cl_persp":"#81D4FA","cl_sun":"#FFC107","cl_moon":"#FFC107","cl_thund":"#FF5722","el_nme":3,"el_cwi":3,"el_ctm":3}'>
                More forecasts: <a href="https://wetterlabs.de/wetter_deutschland/30_tage/" id="ww_432e9d2bd2045_u" target="_blank">30 tage wettervorhersage</a>
            </div>
         */

        super.connectedCallback();

        //spidgets.scriptFromUrl('https://app2.weatherwidget.org/js/?id=ww_432e9d2bd2045');
        spidgets.scriptFromUrl('https://app2.weatherwidget.org/js/?id=ww_0fee1cb61470e');
    }
}

customElements.define('weather-widget', WeatherWidget);