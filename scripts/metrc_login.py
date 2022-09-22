import json
import re

import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

DEFAULT_TIMEOUT_SECONDS = 10


class TimeoutHTTPAdapter(HTTPAdapter):
    def __init__(self, *args, **kwargs):
        self.timeout = DEFAULT_TIMEOUT_SECONDS
        if "timeout" in kwargs:
            self.timeout = kwargs["timeout"]
            del kwargs["timeout"]
        super().__init__(*args, **kwargs)

    def send(self, request, **kwargs):
        timeout = kwargs.get("timeout")
        if timeout is None:
            kwargs["timeout"] = self.timeout
        return super().send(request, **kwargs)


RETRY_STRATEGY = Retry(total=5,
                       status_forcelist=[400, 429, 500, 502, 503, 504],
                       method_whitelist=["HEAD", "GET", "OPTIONS"])

raw = open("secrets/credentials.json", "r")
credentials = json.loads(raw.read())


CSRF_KEY = "__RequestVerificationToken"

PROTOCOL = "https://"
ORIGIN = PROTOCOL + credentials["hostname"]

LOGIN_PATH = "/log-in"
FLOWERING_PLANTS_PATH = "/api/plants/flowering"
LOGIN_QUERY_STRING = "?ReturnUrl=%2f"
GENERATE_API_KEY_URL = "/api/users/apikeys/generate"

CSRF_REGEX = f'{CSRF_KEY}.*value="([^"]*)"'
LICENSE_REGEX = "'X-Metrc-LicenseNumber': '([^']+)'"
API_VERIFICATION_TOKEN_REGEX = "'ApiVerificationToken': '([^']+)'"
API_KEY_REGEX = "value=\"([^\"]{36,})\""

SHARED_HEADERS = {
    "Host": credentials["hostname"],
    "Connection": "keep-alive",
    "sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
    "sec-ch-ua-mobile": "?0",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    "Sec-Fetch-Dest": "document",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9,pt;q=0.8",
}

DEFAULT_GET_HEADERS = {
    **SHARED_HEADERS,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Sec-Fetch-Site": "none",
}

# https://docs.python-requests.org/en/latest/user/advanced/#session-objects
# Taken from https://findwork.dev/blog/advanced-usage-python-requests-timeouts-retries-hooks/
adapter = TimeoutHTTPAdapter(max_retries=RETRY_STRATEGY, timeout=10)
http = requests.Session()
http.mount("https://", adapter)
http.mount("http://", adapter)


# r = http.put(
#     self.path_to_url(path),
#     params=params,
#     auth=(self.api_key, self.user_key),
#     json=json.loads(request_data),
#     timeout=TIMEOUT_WRITE_SECONDS,
# )

r1 = http.get(ORIGIN + LOGIN_PATH, headers=DEFAULT_GET_HEADERS)

csrf_token = re.search(CSRF_REGEX, r1.text).group(1)

form_data = {}

form_data[CSRF_KEY] = csrf_token
form_data["Username"] = credentials["username"]
form_data["Password"] = credentials["password"]

# print(form_data)

login_headers = {
    **SHARED_HEADERS,
    "Origin": ORIGIN,
    # "Content-Length": str(len(json.dumps(form_data))),
    "Upgrade-Insecure-Requests": "1",
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Sec-Fetch-Site": "same-origin",
    "Referer": ORIGIN + LOGIN_PATH + LOGIN_QUERY_STRING,
}

# This will perform redirect
r2 = http.post(ORIGIN + LOGIN_PATH + LOGIN_QUERY_STRING,
               headers=login_headers,
               data=form_data)

license_number = re.search(LICENSE_REGEX, r2.text).group(1)
api_verification_token = re.search(
    API_VERIFICATION_TOKEN_REGEX, r2.text).group(1)

api_headers = {
    'ApiVerificationToken': api_verification_token,
    'X-Metrc-LicenseNumber': license_number,
    'X-Requested-With': 'XMLHttpRequest',
}

body = {"request": {"take": 20, "skip": 0,
                    "page": 1, "pageSize": 20, "group": []}}

json_headers = {
    **SHARED_HEADERS,
    **api_headers,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/javascript, */*; q=0.01'
}

r3 = http.post(ORIGIN + FLOWERING_PLANTS_PATH,
               headers=json_headers, data=json.dumps(body))

# print(r3.text)

r4 = http.get(ORIGIN + f'/user/apikeys?licenseNumber={license_number}')

# print(r4.text)

api_key = re.search(API_KEY_REGEX, r4.text).group(1)

print(api_key)
