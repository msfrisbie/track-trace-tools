const axios = require("axios");

// const instance = axios.create(
//   {
//     withCredentials: true,
//     baseURL: "https://testing-az.metrc.com",
//   },

// );

axios
  .post(
    "https://testing-az.metrc.com/api/packages",
    { request: { take: 20, skip: 0, page: 1, pageSize: 20, group: [] } },
    {
      headers: {
        authority: "testing-az.metrc.com",
        accept: "application/json, text/javascript, */*; q=0.01",
        apiverificationtoken:
          "fj2vpy9D7uGREsUPUw8UugLjFahnrDJG41r14RIorxYHASn__hNOYtvaR9rJAUR6vtJSof4VYtCpDa-n6m7LZ8RGpVvgtjO4vlujrc4Y0sMIgdGOOGKe_x7864wsP13ijE-AUWJ9v609AoA-robSLg2:njOmxpblY8rtPZRLrLMvaT1dq3GVfWj0RLa14-nkCIEvRgl372XRkXEy8QchI8wda_fBpOspY5dIfX3pk-yC5WEmye8u9u8qwAP8DMCfjLlAmqcRDB1QQuGMYjBKil8xbDAK5DXmaNzeyxhBxLzI-6J5IFllvIReufhTQ97yKoo1",
        "content-type": "application/json",
        cookie:
          "MetrcRequestToken=VKDOL2FPeijkBtDB5G3K-qdmDlc-OhSxr0sXl-o-nm4ys9yS9gb0Pq2BaNFTKSbR1IakrsKGRBDspM5n3CJOhH1pwZxxj-VFRGLWaUs_w6y-SXq5TNLn7TuihxSFPNT6IVUNnMhv_rvOB0HwtNCyYg2; MetrcAuth=25B5AA4BE1963BD20B7BAA792EF0451165332E11D2E1BA32963933B536E9B26E8BD0AEDC6F1206F6B5FDCB4E4B117CB2AD14636B0E7C6C323A9F8783A330A6FE0C80DF7A7569F2901B13CB11B4F95F11B9CCFB4A31D3BD58D871E0600A1DD92EBF1CDF01A491CCE5C2B36474892E7D535F137D545AD7CFFD369E89F1C688EA5FD1663006D6795912BA18498074A4059A166BE8B5911CA067CC15FD69B397EF7B83C6F139825FADD2136066A711476D8AFCEFDD8721110C52009D6F7B911A3413F2C707D0DB6868C73242E144D9FC76CA9DB0217224D9D94BA89E13BBC7AD375E668565CE3750342F693659742739FF7014D1F42BD10770FC3B6E6CC5A1B47D3CEF7A46C191664767D609E9FB1A7F313B9330786053B9DA509E3C2449A26A48F26A3C7D8CB2DFF8D1960078377F5D71DE46326DD63A1257C2B8396E73322637BAB8835CB75960C030E448A84F9BF0A3B99C97C4ED6C1A557005BE2D64AE83D2DB5764EE1574A5ED2F5C5BBA236B7A706DB50F5D309D759637BD2090C2A94E7C88BBCFA3D161CF5AD8BA230BBF3B68885C407A8BA2B47E8F6A5C01135E0A7E5ADABBC2FF351540D94A186D27F2BE44D304257DA4B71C624DF9DCBA8D4A75BE1ED5; MetrcSessionTime=2023-06-13T22:33:34Z",
        origin: "https://testing-az.metrc.com",
        referer: "https://testing-az.metrc.com/industry/4b-X0002/packages",
        "x-metrc-licensenumber": "4b-X0002",
        "x-requested-with": "XMLHttpRequest",
      },
    }
  )
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.log(error);
  });

console.log("foobar");

// fetch("https://testing-az.metrc.com/api/packages", {
//   referrer: "https://testing-az.metrc.com/industry/4b-X0002/packages",
//   referrerPolicy: "strict-origin-when-cross-origin",
//   body: '{"request":{"take":20,"skip":0,"page":1,"pageSize":20,"group":[]}}',
//   method: "POST",
//   mode: "cors",
//   credentials: "include",
// });
