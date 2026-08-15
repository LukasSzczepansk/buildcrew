export const LEGAL_EFFECTIVE_DATE = "15 sierpnia 2026";

export function getLegalConfig() {
  return {
    serviceName: "BuildCrew",
    operatorName: process.env.LEGAL_OPERATOR_NAME?.trim() || "operator serwisu BuildCrew",
    operatorAddress: process.env.LEGAL_OPERATOR_ADDRESS?.trim() || "",
    contactEmail: process.env.PUBLIC_CONTACT_EMAIL?.trim() || "kontakt@buildcreww.pl",
  };
}
