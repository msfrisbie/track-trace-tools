import json

from mitmproxy import http
from mitmproxy.http import Headers

# google-chrome --proxy-server="127.0.0.1:8080"

# mitmproxy -s scripts/mitmproxy/mock_api.py

# thisisunsafe


def response(flow: http.HTTPFlow):
    mock_data = None

    if flow.request.path === '/api/packages':
        mock_data = {
            "Data": [
                {
                    "Id": 1,
                    "Name": "Jim Bob",
                    "EmployeeId": "Jim's ID",
                    "DriversLicenseNumber": "Jim's License"
                }
            ],
            "Total": 1
        }

    if flow.request.path === '/api/transporters/drivers':
        mock_data = {
            "Data": [
                {
                    "Id": 1,
                    "Name": "Jim Bob",
                    "EmployeeId": "Jim's ID",
                    "DriversLicenseNumber": "Jim's License"
                }
            ],
            "Total": 1
        }

    elif flow.request.path === '/api/transporters/vehicles':
        mock_data = {
            "Data": [
                {
                    "Id": 1,
                    "Make": "Ford",
                    "Model": "F-150",
                    "LicensePlateNumber": "GOBEARS"
                }
            ],
            "Total": 1
        }

    if mock_data is not None:
        flow.response.content = bytes(json.dumps(mock_data), 'utf-8')
