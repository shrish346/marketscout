"""Zip code to Craigslist subdomain mapping for major US metros."""

ZIP_TO_SUBDOMAIN: dict[str, str] = {
    # Bay Area
    "94102": "sfbay",
    "94103": "sfbay",
    "94110": "sfbay",
    "94301": "sfbay",
    "95110": "sfbay",
    # Los Angeles
    "90001": "losangeles",
    "90012": "losangeles",
    "90210": "losangeles",
    # New York
    "10001": "newyork",
    "10011": "newyork",
    "11201": "newyork",
    # Chicago
    "60601": "chicago",
    "60614": "chicago",
    # Seattle
    "98101": "seattle",
    "98122": "seattle",
    # Portland
    "97201": "portland",
    # Austin
    "78701": "austin",
    # Denver
    "80202": "denver",
    # Boston
    "02108": "boston",
    # Miami
    "33101": "miami",
    # Atlanta
    "30303": "atlanta",
    # Dallas
    "75201": "dallas",
    # Houston
    "77002": "houston",
    # Phoenix
    "85001": "phoenix",
    # Philadelphia
    "19103": "philadelphia",
    # Washington DC
    "20001": "washingtondc",
}

PREFIX_TO_SUBDOMAIN: dict[str, str] = {
    "94": "sfbay",
    "95": "sfbay",
    "90": "losangeles",
    "91": "losangeles",
    "92": "losangeles",
    "10": "newyork",
    "11": "newyork",
    "60": "chicago",
    "98": "seattle",
    "97": "portland",
    "78": "austin",
    "80": "denver",
    "02": "boston",
    "33": "miami",
    "30": "atlanta",
    "75": "dallas",
    "77": "houston",
    "85": "phoenix",
    "19": "philadelphia",
    "20": "washingtondc",
}


def zip_to_subdomain(zip_code: str) -> str:
    zip_code = zip_code.strip()[:5]
    if zip_code in ZIP_TO_SUBDOMAIN:
        return ZIP_TO_SUBDOMAIN[zip_code]
    prefix = zip_code[:2]
    if prefix in PREFIX_TO_SUBDOMAIN:
        return PREFIX_TO_SUBDOMAIN[prefix]
    return "sfbay"
