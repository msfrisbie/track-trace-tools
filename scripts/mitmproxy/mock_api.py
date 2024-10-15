import json
import random
import re
import traceback

from mitmproxy import http
from mitmproxy.http import Headers

# Linux:
# google-chrome --proxy-server="127.0.0.1:8080"

# OSX:
# open -na "Google Chrome" --args --proxy-server="127.0.0.1:8080" --ignore-certificate-errors

# mitmproxy -s scripts/mitmproxy/mock_api.py

# thisisunsafe OR --ignore-certificate-errors

RANDOM_SEED = 42

PATHS = [
    "/api/packages",
    "/api/packages/inactive",
    "/api/packages/onhold",
    "/api/packages/transferred",
    "/api/packages/intransit",
    "/api/transfers/incoming",
    "/api/transfers/incoming/inactive",
    "/api/transfers/outgoing",
    "/api/transfers/outgoing/inactive",
    "/api/transfers/rejected",
    "/api/plants/vegetative",
    "/api/plants/flowering",
    "/api/plants/onhold",
    "/api/harvests",
    "/api/harvests/onhold",
    "/api/harvests/inactive",
    "/api/plants/inactive",
    "/api/plantbatches",
    "/api/plantbatches/onhold",
    "/api/plantbatches/inactive",
    "/api/tags/available",
    "/api/tags/used",
    "/api/tags/voided",
    "/api/locations",
    "/api/items",
    "/api/strains",
]

TAG_KEYS = ["Label", "PackageLabel", "Name", "SourcePackageLabels"]

GENERIC_KEYS = [
    "Name",
    "LocationName",
    "HarvestNames",
    "Quantity",
    "SourceHarvestNames",
    "StrainName",
    "ProductName",
    "ProductionBatchNumber",
    "SourceProductionBatchNumbers",
    "TransferManifestNumber",
    "CreatedByUserName",
    "ManifestNumber",
]

GENERIC_PARTIALS = ["Facility", "Facilities", "LicenseNumber"]

NESTED_KEYS = ["Item"]

HEX_PATTERN = re.compile(r"^[0-9a-fA-F]+$")


def is_hex_string(s):
    return bool(HEX_PATTERN.match(s))


vowels = "aeiouAEIOU"
consonants = "bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ"
numbers = "123456789"


# Function to get a different random vowel
def get_random_vowel(exclude):
    if exclude.islower():
        new_vowel = random.choice("aeiou")
    else:
        new_vowel = random.choice("AEIOU")

    while new_vowel == exclude:
        if exclude.islower():
            new_vowel = random.choice("aeiou")
        else:
            new_vowel = random.choice("AEIOU")
    return new_vowel


# Function to get a different random consonant
def get_random_consonant(exclude):
    if exclude.islower():
        # new_consonant = random.choice("bcdfghjklmnpqrstvwxyz")
        new_consonant = random.choice("bcdfghlmnprst")
    else:
        # new_consonant = random.choice("BCDFGHJKLMNPQRSTVWXYZ")
        new_consonant = random.choice("BCDFGHLMNPRST")

    while new_consonant == exclude:
        if exclude.islower():
            # new_consonant = random.choice("bcdfghjklmnpqrstvwxyz")
            new_consonant = random.choice("bcdfghlmnprst")
        else:
            # new_consonant = random.choice("BCDFGHJKLMNPQRSTVWXYZ")
            new_consonant = random.choice("BCDFGHLMNPRST")
    return new_consonant


# Function to get a different random number
def get_random_number(exclude):
    new_number = exclude
    while new_number == exclude:
        new_number = random.choice(numbers)
    return new_number


def scramble_generic(input_string):
    if input_string is None:
        return None

    converter = type(input_string)

    input_string = str(input_string)

    # Set the seed for repeatable results
    random.seed(RANDOM_SEED)

    scrambled_string = []
    for char in input_string:
        if char in vowels:
            scrambled_string.append(get_random_vowel(char))
        elif char in consonants:
            scrambled_string.append(get_random_consonant(char))
        elif char.isdigit():
            scrambled_string.append(get_random_number(char))
        else:
            scrambled_string.append(char)

    input_string = "".join(scrambled_string)

    return converter(input_string)


# Function to scramble a single hex string
def scramble_single_hex_string(s):
    hex_chars = list(s)
    random.seed(RANDOM_SEED)
    random.shuffle(hex_chars)
    return "".join(hex_chars)


def scramble_tag(hex_string):
    if not isinstance(hex_string, str):
        return hex_string

    # Split the input by commas to handle multiple hex strings
    hex_strings = hex_string.split(",")

    # Scramble each hex string individually
    scrambled_hex_strings = [scramble_single_hex_string(h.strip()) for h in hex_strings]

    # Join the scrambled hex strings back into a single string separated by commas
    return ",".join(scrambled_hex_strings)


def scramble(metrc_object, context=None):
    if context is None:
        for test_key in TAG_KEYS:
            if test_key in metrc_object:
                metrc_object[test_key] = scramble_tag(metrc_object[test_key])

    for test_key in GENERIC_KEYS:
        if test_key in metrc_object:
            metrc_object[test_key] = scramble_generic(metrc_object[test_key])

    for partial_test_key in GENERIC_PARTIALS:
        for key in metrc_object.keys():
            if partial_test_key in key:
                metrc_object[key] = scramble_generic(metrc_object[key])

    for test_key in NESTED_KEYS:
        if test_key in metrc_object:
            # A handful of objects like Item are nested, these should be handled differently
            scramble(metrc_object=metrc_object[test_key], context=test_key)

    return metrc_object


def response(flow: http.HTTPFlow):
    if not flow.request.pretty_host.endswith(".metrc.com"):
        return

    # if not "application/json" in response.headers.get("Content-Type", ""):
    #     return

    if flow.request.path.split("?")[0] in PATHS:
        data = flow.response.json()

        try:
            for metrc_object in data["Data"]:
                scramble(metrc_object=metrc_object)
        except Exception as e:
            print(e)
            traceback.print_exc()

        return flow.response.set_text(json.dumps(data))

    # if mock_data is not None:
    #     flow.response.content = bytes(json.dumps(mock_data), "utf-8")
