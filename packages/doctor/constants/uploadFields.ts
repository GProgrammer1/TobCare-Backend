/** Document field names that accept a single file */
export const SINGLE_DOC_FIELDS = [
  "nationalIdDoc",
  "lopCertificateDoc",
  "medicalDegreeDoc",
  "mophLicenseDoc",
  "colloquiumDoc",
  "criminalRecordDoc",
  "passportPhotoDoc",
] as const

/** Document field names that accept multiple files */
export const ARRAY_DOC_FIELDS = ["specialtyDocs"] as const
