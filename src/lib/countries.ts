const COUNTRY_CODES: Record<string, string> = {
  Poland: "PL",
  Germany: "DE",
  "United Kingdom": "GB",
  Netherlands: "NL",
  Czechia: "CZ",
  Spain: "ES",
  France: "FR",
  Italy: "IT",
  Portugal: "PT",
  Ukraine: "UA",
  "United States": "US",
  Canada: "CA",
  Ireland: "IE",
  Sweden: "SE",
  Norway: "NO",
  Denmark: "DK",
  Finland: "FI",
  Austria: "AT",
  Switzerland: "CH",
  Belgium: "BE",
  Estonia: "EE",
  Latvia: "LV",
  Lithuania: "LT",
  Slovakia: "SK",
  Slovenia: "SI",
  Croatia: "HR",
  Romania: "RO",
  Bulgaria: "BG",
  Greece: "GR",
  Hungary: "HU",
  Serbia: "RS",
  Turkey: "TR",
  India: "IN",
  Australia: "AU",
  "New Zealand": "NZ",
  Brazil: "BR",
  Mexico: "MX",
  Japan: "JP",
  Singapore: "SG",
  "United Arab Emirates": "AE",
};

function flagFromCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "";
  return String.fromCodePoint(...[...normalized].map((char) => 127397 + char.charCodeAt(0)));
}

export function countryFlag(country?: string | null) {
  if (!country || country === "Other") return "";
  const trimmed = country.trim();
  const code = /^[A-Za-z]{2}$/.test(trimmed) ? trimmed : COUNTRY_CODES[trimmed];
  return code ? flagFromCode(code) : "";
}

export function countryLabel(country?: string | null) {
  if (!country) return "";
  const flag = countryFlag(country);
  return flag ? `${flag} ${country}` : country;
}

export function locationLabel(city?: string | null, country?: string | null) {
  const location = [city?.trim(), country?.trim()].filter(Boolean).join(", ");
  if (!location) return "";
  const flag = countryFlag(country);
  return flag ? `${flag} ${location}` : location;
}
