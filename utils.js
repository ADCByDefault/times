export async function getCurrentPosition() {
    const ret = {
        latitude: null,
        longitude: null,
        navigatorPosition: null,
        ipapiData: null,
        error: true,
    };
    if (navigator.geolocation) {
        await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    ret.navigatorPosition = position;
                    resolve();
                },
                (e) => {
                    reject();
                }
            );
        });
    }
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok && !ret.navigatorPosition) {
        ret.error = "failed to get data from navigator or ipapi";
        return ret;
    }
    const data = await res.json();
    ret.error = false;
    ret.ipapiData = data;
    ret.latitude = ret.navigatorPosition
        ? ret.navigatorPosition.coords.latitude
        : data.latitude;
    ret.longitude = ret.navigatorPosition
        ? ret.navigatorPosition.coords.longitude
        : data.longitude;
    return ret;
}
